/**
 * Date rules.
 * Rules: date, date_format, date_equals, before, before_or_equal, after,
 *          after_or_equal, timezone.
 *
 * Reference dates may be literal strings (incl. relative `today`/`tomorrow`),
 * or the name of another field under validation.
 */

import { isString, isValidTimezone, parseDate } from '@/helpers'
import { dotGet, dotHas } from '@/core/data'
import type { ValidationData } from '@/types'
import type { RuleModule } from '@/core/ruleDefinition'
import { dateReplacer } from '@/rules/_shared'

const startOfDay = (offsetDays: number): number => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now.getTime() + offsetDays * 86_400_000
}

const RELATIVE: Readonly<Record<string, () => number>> = {
  now: () => Date.now(),
  today: () => startOfDay(0),
  tomorrow: () => startOfDay(1),
  yesterday: () => startOfDay(-1),
}

/** Resolve a reference (field name, relative keyword, or literal date) to millis. */
const resolveReference = (parameter: string, data: ValidationData): number | null => {
  if (dotHas(data, parameter)) return parseDate(dotGet(data, parameter))
  const relative = RELATIVE[parameter.toLowerCase()]
  if (relative) return relative()
  return parseDate(parameter)
}

const compare = (
  value: unknown,
  parameter: string | undefined,
  data: ValidationData,
  predicate: (a: number, b: number) => boolean,
): boolean => {
  if (parameter === undefined) return false
  const left = parseDate(value)
  const right = resolveReference(parameter, data)
  return left !== null && right !== null && predicate(left, right)
}

const FORMAT_TOKENS: Readonly<Record<string, string>> = {
  Y: '(?<Y>\\d{4})',
  y: '(?<y>\\d{2})',
  m: '(?<m>\\d{2})',
  n: '(?<m>\\d{1,2})',
  d: '(?<d>\\d{2})',
  j: '(?<d>\\d{1,2})',
  H: '(?<H>\\d{2})',
  G: '(?<H>\\d{1,2})',
  h: '(?<h>\\d{2})',
  i: '(?<i>\\d{2})',
  s: '(?<s>\\d{2})',
  A: '(?<A>AM|PM)',
  a: '(?<a>am|pm)',
}

const inRange = (raw: string | undefined, min: number, max: number): boolean => {
  if (raw === undefined) return true
  const num = Number(raw)
  return num >= min && num <= max
}

const escapeLiteral = (char: string): string => char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** The parsed year; two-digit years use PHP's 00–69 → 2000s mapping. */
const resolveYear = (groups: Record<string, string | undefined>): number => {
  const full = groups['Y']
  if (full !== undefined) return Number(full)
  const short = groups['y']
  if (short === undefined) return 2000 // no year in the format: a leap year keeps 02-29 valid
  return Number(short) + (Number(short) < 70 ? 2000 : 1900)
}

/** Reject structurally-valid but impossible dates (e.g. `2021-02-31`). */
const isRealCalendarDate = (groups: Record<string, string | undefined>): boolean => {
  const month = groups['m']
  const day = groups['d']
  if (month === undefined || day === undefined) return true
  const date = new Date(2000, Number(month) - 1, Number(day))
  date.setFullYear(resolveYear(groups))
  return date.getMonth() === Number(month) - 1 && date.getDate() === Number(day)
}

const matchesFormat = (value: string, format: string): boolean => {
  let pattern = ''
  let escaped = false
  for (const char of format) {
    if (escaped) {
      // A `\`-escaped format character is a literal, never a token.
      pattern += escapeLiteral(char)
      escaped = false
    } else if (char === '\\') {
      escaped = true
    } else {
      pattern += FORMAT_TOKENS[char] ?? escapeLiteral(char)
    }
  }
  const match = new RegExp(`^${pattern}$`).exec(value)
  if (match === null) return false
  const groups = match.groups ?? {}
  return (
    inRange(groups['m'], 1, 12) &&
    inRange(groups['d'], 1, 31) &&
    inRange(groups['H'], 0, 23) &&
    inRange(groups['h'], 1, 12) &&
    inRange(groups['i'], 0, 59) &&
    inRange(groups['s'], 0, 59) &&
    isRealCalendarDate(groups)
  )
}

export const dateRules: RuleModule = {
  date: {
    validate: ({ value }) =>
      (isString(value) || value instanceof Date) && parseDate(value) !== null,
  },

  date_format: {
    replace: (ctx) => ({ format: ctx.parameters.join(', ') }),
    validate: ({ value, parameters }) =>
      isString(value) && parameters.some((format) => matchesFormat(value, format)),
  },

  date_equals: {
    dependent: true,
    replace: dateReplacer,
    validate: ({ value, parameters, data }) =>
      compare(value, parameters[0], data, (a, b) => a === b),
  },

  before: {
    dependent: true,
    replace: dateReplacer,
    validate: ({ value, parameters, data }) => compare(value, parameters[0], data, (a, b) => a < b),
  },
  before_or_equal: {
    dependent: true,
    replace: dateReplacer,
    validate: ({ value, parameters, data }) =>
      compare(value, parameters[0], data, (a, b) => a <= b),
  },
  after: {
    dependent: true,
    replace: dateReplacer,
    validate: ({ value, parameters, data }) => compare(value, parameters[0], data, (a, b) => a > b),
  },
  after_or_equal: {
    dependent: true,
    replace: dateReplacer,
    validate: ({ value, parameters, data }) =>
      compare(value, parameters[0], data, (a, b) => a >= b),
  },

  timezone: {
    validate: ({ value, parameters }) => isString(value) && passesTimezone(value, parameters),
  },
}

/** The canonical identifier list, or `null` where `Intl.supportedValuesOf` is unavailable. */
const supportedTimezones = (): readonly string[] | null => {
  const intl: { supportedValuesOf?: (key: 'timeZone') => string[] } = Intl
  return typeof intl.supportedValuesOf === 'function' ? intl.supportedValuesOf('timeZone') : null
}

/**
 * `timezone` / `timezone:all` accept any identifier `Intl` recognizes (case-
 * insensitively); `timezone:<Region>` (e.g. `timezone:Africa`) additionally
 * requires the region prefix. Laravel's `timezone:per_country,CC` variant
 * needs a country database and is not supported.
 */
const passesTimezone = (value: string, parameters: readonly string[]): boolean => {
  const group = (parameters[0] ?? 'all').toLowerCase()
  if (group === 'all') return isValidTimezone(value)
  if (group === 'per_country') {
    throw new Error(
      '[validation] "timezone:per_country" is not supported: mapping timezones to ' +
        'countries requires a country database. Use "timezone" or "timezone:<Region>" instead.',
    )
  }
  const zones = supportedTimezones()
  const lower = value.toLowerCase()
  const known = zones ? zones.some((zone) => zone.toLowerCase() === lower) : isValidTimezone(value)
  return known && lower.startsWith(`${group}/`)
}

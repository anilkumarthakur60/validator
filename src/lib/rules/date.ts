/**
 * Date rules.
 * Laravel: date, date_format, date_equals, before, before_or_equal, after,
 *          after_or_equal, timezone.
 *
 * Reference dates may be literal strings (incl. relative `today`/`tomorrow`),
 * or the name of another field under validation.
 */

import { isString, isValidTimezone, parseDate } from '@/lib/helpers'
import { dotGet, dotHas } from '@/lib/core/data'
import type { ValidationData } from '@/lib/types'
import type { RuleModule } from '@/lib/core/ruleDefinition'
import { dateReplacer } from '@/lib/rules/_shared'

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

const matchesFormat = (value: string, format: string): boolean => {
  let pattern = ''
  for (const char of format) {
    if (char === '\\') continue
    pattern += FORMAT_TOKENS[char] ?? char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
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
    inRange(groups['s'], 0, 59)
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

  timezone: { validate: ({ value }) => isString(value) && isValidTimezone(value) },
}

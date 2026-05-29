/**
 * String-format rules.
 * Laravel: string, alpha, alpha_dash, alpha_num, ascii, email, lowercase,
 *          uppercase, url, active_url, uuid, ulid, hex_color, starts_with,
 *          ends_with, doesnt_start_with, doesnt_end_with, regex, not_regex.
 */

import {
  containsSpoofedCharacters,
  isAscii,
  isString,
  isValidEmailFilter,
  isValidEmailRfc,
  isValidEmailStrict,
  isValidHexColor,
  isValidUlid,
  isValidUrl,
  isValidUuid,
} from '@/lib/helpers'
import type { RuleModule } from '@/lib/core/ruleDefinition'
import { literalValuesReplacer } from '@/lib/rules/_shared'

const asText = (value: unknown): string | null =>
  typeof value === 'string' ? value : typeof value === 'number' ? String(value) : null

/** Convert a PHP-style delimited pattern (`/foo/i`) into a JS RegExp. */
const parsePhpRegex = (pattern: string): RegExp => {
  const trimmed = pattern.trim()
  const delimiter = trimmed.charAt(0)
  const close = delimiter === '(' ? ')' : delimiter === '{' ? '}' : delimiter
  const lastIndex = trimmed.lastIndexOf(close)
  if (lastIndex > 0) {
    const body = trimmed.slice(1, lastIndex)
    const rawFlags = trimmed.slice(lastIndex + 1)
    const flags = rawFlags.replace(/[^gimsuy]/g, '')
    return new RegExp(body, flags)
  }
  return new RegExp(pattern)
}

const matchesEmailStyle = (value: string, style: string): boolean => {
  switch (style) {
    case 'strict':
      return isValidEmailStrict(value)
    case 'filter':
    case 'filter_unicode':
      return isValidEmailFilter(value)
    case 'spoof':
      return isValidEmailRfc(value) && !containsSpoofedCharacters(value)
    case 'dns':
    case 'rfc':
    default:
      return isValidEmailRfc(value)
  }
}

const buildAlpha =
  (unicode: RegExp, ascii: RegExp) =>
  (value: unknown, ascii_: boolean): boolean => {
    const text = asText(value)
    return text !== null && (ascii_ ? ascii : unicode).test(text)
  }

const alphaCheck = buildAlpha(/^[\p{L}\p{M}]+$/u, /^[a-zA-Z]+$/)
const alphaDashCheck = buildAlpha(/^[\p{L}\p{M}\p{N}_-]+$/u, /^[a-zA-Z0-9_-]+$/)
const alphaNumCheck = buildAlpha(/^[\p{L}\p{M}\p{N}]+$/u, /^[a-zA-Z0-9]+$/)

export const stringRules: RuleModule = {
  string: { validate: ({ value }) => isString(value) },

  alpha: { validate: ({ value, parameters }) => alphaCheck(value, parameters[0] === 'ascii') },
  alpha_dash: {
    validate: ({ value, parameters }) => alphaDashCheck(value, parameters[0] === 'ascii'),
  },
  alpha_num: {
    validate: ({ value, parameters }) => alphaNumCheck(value, parameters[0] === 'ascii'),
  },

  ascii: {
    validate: ({ value }) => {
      const text = asText(value)
      return text !== null && isAscii(text)
    },
  },

  email: {
    validate: ({ value, parameters }) => {
      if (!isString(value)) return false
      const styles = parameters.length > 0 ? parameters : ['rfc']
      return styles.every((style) => matchesEmailStyle(value, style))
    },
  },

  lowercase: {
    validate: ({ value }) => isString(value) && value === value.toLowerCase(),
  },
  uppercase: {
    validate: ({ value }) => isString(value) && value === value.toUpperCase(),
  },

  url: {
    validate: ({ value, parameters }) =>
      isString(value) && isValidUrl(value, parameters.length > 0 ? parameters : undefined),
  },

  active_url: {
    validate: ({ value, validator }) => {
      if (!isString(value)) return false
      let host: string
      try {
        host = new URL(value).hostname
      } catch {
        return false
      }
      const resolver = validator.getResolvers().activeUrl
      return resolver ? Promise.resolve(resolver(host)) : true
    },
  },

  uuid: {
    validate: ({ value, parameters }) => {
      if (!isString(value)) return false
      const version = parameters[0] !== undefined ? Number(parameters[0]) : undefined
      return isValidUuid(value, Number.isNaN(version) ? undefined : version)
    },
  },

  ulid: { validate: ({ value }) => isString(value) && isValidUlid(value) },

  hex_color: { validate: ({ value }) => isString(value) && isValidHexColor(value) },

  starts_with: {
    replace: literalValuesReplacer,
    validate: ({ value, parameters }) =>
      isString(value) && parameters.some((prefix) => value.startsWith(prefix)),
  },
  ends_with: {
    replace: literalValuesReplacer,
    validate: ({ value, parameters }) =>
      isString(value) && parameters.some((suffix) => value.endsWith(suffix)),
  },
  doesnt_start_with: {
    replace: literalValuesReplacer,
    validate: ({ value, parameters }) =>
      isString(value) && !parameters.some((prefix) => value.startsWith(prefix)),
  },
  doesnt_end_with: {
    replace: literalValuesReplacer,
    validate: ({ value, parameters }) =>
      isString(value) && !parameters.some((suffix) => value.endsWith(suffix)),
  },

  regex: {
    validate: ({ value, parameters }) => {
      const text = asText(value)
      const pattern = parameters[0]
      return text !== null && pattern !== undefined && parsePhpRegex(pattern).test(text)
    },
  },
  not_regex: {
    validate: ({ value, parameters }) => {
      const text = asText(value)
      const pattern = parameters[0]
      return text !== null && pattern !== undefined && !parsePhpRegex(pattern).test(text)
    },
  },
}

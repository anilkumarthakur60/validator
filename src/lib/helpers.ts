/**
 * Pure, side-effect-free predicates and value helpers used across rules.
 * Every function narrows `unknown` — callers never pass `any`.
 */

/** A value treated as "empty" for presence rules. */
export const isEmpty = (value: unknown): boolean =>
  value === null ||
  value === undefined ||
  value === '' ||
  (Array.isArray(value) && value.length === 0) ||
  (isFile(value) && value.name === '') ||
  (isCountableObject(value) && Object.keys(value).length === 0)

const isCountableObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  !(value instanceof File) &&
  !(value instanceof Date)

export const isString = (value: unknown): value is string => typeof value === 'string'

export const isArray = (value: unknown): value is unknown[] => Array.isArray(value)

export const isFile = (value: unknown): value is File =>
  typeof File !== 'undefined' && value instanceof File

export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value) && !isFile(value)

/** Numeric per PHP's `is_numeric`: real numbers and numeric strings. */
export const isNumeric = (value: unknown): boolean => {
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed !== '' && Number.isFinite(Number(trimmed))
  }
  return false
}

export const isInteger = (value: unknown): boolean =>
  isNumeric(value) && Number.isInteger(Number(value))

export const toNumber = (value: unknown): number => Number(value)

/** The boolean-castable set for the `boolean` rule. */
export const isBooleanLike = (value: unknown): boolean =>
  value === true || value === false || value === 1 || value === 0 || value === '1' || value === '0'

const ACCEPTED_VALUES: readonly unknown[] = [true, 'true', 1, '1', 'yes', 'on']
const DECLINED_VALUES: readonly unknown[] = [false, 'false', 0, '0', 'no', 'off']

export const isAccepted = (value: unknown): boolean => ACCEPTED_VALUES.includes(value)
export const isDeclined = (value: unknown): boolean => DECLINED_VALUES.includes(value)

export const isValidEmailRfc = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

/** Strict-ish RFC check that rejects consecutive/trailing dots. */
export const isValidEmailStrict = (value: string): boolean => {
  if (!isValidEmailRfc(value)) return false
  // RFC-valid ⇒ exactly one '@'; slicing avoids a possibly-undefined destructure.
  const at = value.indexOf('@')
  const local = value.slice(0, at)
  const domain = value.slice(at + 1)
  if (value.includes('..')) return false
  if (local.startsWith('.') || local.endsWith('.')) return false
  if (domain.startsWith('.') || domain.endsWith('.')) return false
  return true
}

export const isValidEmailFilter = (value: string): boolean =>
  // Mirrors PHP FILTER_VALIDATE_EMAIL reasonably closely.
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/.test(
    value,
  )

const SPOOF_PATTERN = /[Ѐ-ӿͰ-Ͽ℀-⅏]/

export const containsSpoofedCharacters = (value: string): boolean => SPOOF_PATTERN.test(value)

export const isValidUrl = (value: string, protocols?: readonly string[]): boolean => {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return false
  }
  if (protocols && protocols.length > 0) {
    const scheme = url.protocol.replace(/:$/, '').toLowerCase()
    return protocols.map((p) => p.toLowerCase()).includes(scheme)
  }
  return true
}

export const isValidIPv4 = (value: string): boolean =>
  /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/.test(value)

export const isValidIPv6 = (value: string): boolean => {
  if (value.length === 0 || value.length > 45) return false
  // Full, compressed (::), and IPv4-mapped forms.
  const full = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
  const compressed =
    /^(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{0,4}::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{0,4}$/
  const v4mapped = /^::(?:ffff:)?(?:\d{1,3}\.){3}\d{1,3}$/i
  if (v4mapped.test(value)) {
    const tail = value.split(':').pop()
    return tail !== undefined && isValidIPv4(tail)
  }
  if (full.test(value)) return true
  return value.includes('::') && compressed.test(value)
}

export const isValidIP = (value: string): boolean => isValidIPv4(value) || isValidIPv6(value)

export const isValidJson = (value: string): boolean => {
  if (value.trim() === '') return false
  try {
    JSON.parse(value)
    return true
  } catch {
    return false
  }
}

export const isValidMacAddress = (value: string): boolean =>
  /^(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/.test(value) ||
  /^(?:[0-9A-Fa-f]{4}\.){2}[0-9A-Fa-f]{4}$/.test(value)

export const isValidUuid = (value: string, version?: number): boolean => {
  const generic = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!generic.test(value)) return value.toLowerCase() === '00000000-0000-0000-0000-000000000000'
  if (version === undefined) return true
  return value.charAt(14) === String(version)
}

export const isValidUlid = (value: string): boolean =>
  value.length === 26 && /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/i.test(value)

export const isValidTimezone = (value: string): boolean => {
  try {
    // Throws RangeError for an invalid identifier.
    Intl.DateTimeFormat(undefined, { timeZone: value })
    return value.length > 0
  } catch {
    return false
  }
}

export const isValidHexColor = (value: string): boolean =>
  /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value)

/** Parse a date-ish value into epoch millis, or `null` when unparseable. */
export const parseDate = (value: unknown): number | null => {
  if (value instanceof Date) {
    const time = value.getTime()
    return Number.isNaN(time) ? null : time
  }
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string' || value.trim() === '') return null
  const time = Date.parse(value)
  return Number.isNaN(time) ? null : time
}

export const isValidDate = (value: unknown): boolean => parseDate(value) !== null

/** Whether every code point in the string is 7-bit ASCII. */
export const isAscii = (value: string): boolean => {
  for (const char of value) {
    if (char.charCodeAt(0) > 0x7f) return false
  }
  return true
}

/** Convert any value to a display string without `[object Object]` surprises. */
export const stringifyValue = (value: unknown): string => {
  switch (typeof value) {
    case 'string':
      return value
    case 'number':
    case 'bigint':
    case 'boolean':
    case 'symbol':
    case 'function':
      return value.toString()
    case 'object':
      return value === null ? '' : JSON.stringify(value)
    default:
      return ''
  }
}

/**
 * The "size" of a value:
 *  - string → character length
 *  - numeric → numeric value
 *  - array → element count
 *  - countable object → key count
 *  - File → size in kilobytes
 */
export const sizeOf = (value: unknown, isNumericContext = false): number => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    return isNumericContext && isNumeric(value) ? Number(value) : Array.from(value).length
  }
  if (Array.isArray(value)) return value.length
  if (isFile(value)) return value.size / 1024
  if (isPlainObject(value)) return Object.keys(value).length
  return 0
}

/** Count of decimal places in a numeric value's string form. */
export const decimalPlaces = (value: unknown): number => {
  const str = String(value)
  const dot = str.indexOf('.')
  return dot === -1 ? 0 : str.length - dot - 1
}

/** Number of digits in an integer value (ignoring sign). */
export const digitCount = (value: unknown): number =>
  String(Math.abs(Number(value))).replace('.', '').length

export const fileExtension = (file: File): string =>
  file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.') + 1).toLowerCase() : ''

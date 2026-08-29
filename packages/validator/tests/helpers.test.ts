import { describe, expect, it } from 'vitest'
import * as h from '@/helpers'

describe('helpers  type predicates', () => {
  it('isEmpty', () => {
    expect(h.isEmpty(null)).toBe(true)
    expect(h.isEmpty(undefined)).toBe(true)
    expect(h.isEmpty('')).toBe(true)
    expect(h.isEmpty('   ')).toBe(true) // whitespace-only counts as empty (Laravel trims)
    expect(h.isEmpty('\t\n')).toBe(true)
    expect(h.isEmpty([])).toBe(true)
    expect(h.isEmpty({})).toBe(true)
    expect(h.isEmpty(new File([], ''))).toBe(true)
    expect(h.isEmpty(new File(['x'], 'a.txt'))).toBe(false)
    expect(h.isEmpty('x')).toBe(false)
    expect(h.isEmpty(0)).toBe(false)
    expect(h.isEmpty(false)).toBe(false)
    expect(h.isEmpty([1])).toBe(false)
    expect(h.isEmpty({ a: 1 })).toBe(false)
    expect(h.isEmpty(new Date())).toBe(false)
  })

  it('isString / isArray / isFile / isPlainObject', () => {
    expect(h.isString('a')).toBe(true)
    expect(h.isString(1)).toBe(false)
    expect(h.isArray([])).toBe(true)
    expect(h.isArray('a')).toBe(false)
    expect(h.isFile(new File([], 'a'))).toBe(true)
    expect(h.isFile({})).toBe(false)
    expect(h.isPlainObject({})).toBe(true)
    expect(h.isPlainObject([])).toBe(false)
    expect(h.isPlainObject(null)).toBe(false)
    expect(h.isPlainObject(new File([], 'a'))).toBe(false)
  })

  it('isNumeric / isInteger / toNumber', () => {
    expect(h.isNumeric(12)).toBe(true)
    expect(h.isNumeric(Number.NaN)).toBe(false)
    expect(h.isNumeric(Number.POSITIVE_INFINITY)).toBe(false)
    expect(h.isNumeric('12')).toBe(true)
    expect(h.isNumeric('  12  ')).toBe(true)
    expect(h.isNumeric('')).toBe(false)
    expect(h.isNumeric('abc')).toBe(false)
    expect(h.isNumeric(true)).toBe(false)
    expect(h.isInteger('12')).toBe(true)
    expect(h.isInteger('12.5')).toBe(false)
    expect(h.toNumber('3')).toBe(3)
  })

  it('isBooleanLike / isAccepted / isDeclined', () => {
    for (const v of [true, false, 1, 0, '1', '0']) expect(h.isBooleanLike(v)).toBe(true)
    expect(h.isBooleanLike('yes')).toBe(false)
    for (const v of [true, 'true', 1, '1', 'yes', 'on']) expect(h.isAccepted(v)).toBe(true)
    expect(h.isAccepted('nope')).toBe(false)
    for (const v of [false, 'false', 0, '0', 'no', 'off']) expect(h.isDeclined(v)).toBe(true)
    expect(h.isDeclined('yep')).toBe(false)
  })
})

describe('helpers  string formats', () => {
  it('email variants', () => {
    expect(h.isValidEmailRfc('a@b.com')).toBe(true)
    expect(h.isValidEmailRfc('a@b')).toBe(false)
    expect(h.isValidEmailStrict('a@b.com')).toBe(true)
    expect(h.isValidEmailStrict('a..b@c.com')).toBe(false)
    expect(h.isValidEmailStrict('.a@c.com')).toBe(false)
    expect(h.isValidEmailStrict('a.@c.com')).toBe(false)
    expect(h.isValidEmailStrict('a@.c.com')).toBe(false)
    expect(h.isValidEmailStrict('not-an-email')).toBe(false)
    expect(h.isValidEmailFilter('a@b.com')).toBe(true)
    expect(h.isValidEmailFilter('a@b')).toBe(false)
    expect(h.containsSpoofedCharacters('аdmin@x.com')).toBe(true) // Cyrillic а
    expect(h.containsSpoofedCharacters('admin@x.com')).toBe(false)
  })

  it('isValidUrl', () => {
    expect(h.isValidUrl('https://x.com')).toBe(true)
    expect(h.isValidUrl('not a url')).toBe(false)
    expect(h.isValidUrl('ftp://x.com', ['http', 'https'])).toBe(false)
    expect(h.isValidUrl('https://x.com', ['http', 'https'])).toBe(true)
  })

  it('IP addresses', () => {
    expect(h.isValidIPv4('192.168.0.1')).toBe(true)
    expect(h.isValidIPv4('999.0.0.1')).toBe(false)
    expect(h.isValidIPv6('::1')).toBe(true)
    expect(h.isValidIPv6('2001:db8:85a3:0:0:8a2e:370:7334')).toBe(true)
    expect(h.isValidIPv6('::ffff:192.168.0.1')).toBe(true)
    expect(h.isValidIPv6('::ffff:999.0.0.1')).toBe(false)
    expect(h.isValidIPv6('')).toBe(false)
    expect(h.isValidIPv6('x'.repeat(46))).toBe(false)
    expect(h.isValidIPv6('nope')).toBe(false)
    expect(h.isValidIP('192.168.0.1')).toBe(true)
    expect(h.isValidIP('::1')).toBe(true)
    expect(h.isValidIP('nope')).toBe(false)
  })

  it('json / mac / uuid / ulid / timezone / hex', () => {
    expect(h.isValidJson('{"a":1}')).toBe(true)
    expect(h.isValidJson('')).toBe(false)
    expect(h.isValidJson('{bad}')).toBe(false)
    expect(h.isValidMacAddress('3D:F2:C9:A6:B3:4F')).toBe(true)
    expect(h.isValidMacAddress('3df2.c9a6.b34f')).toBe(true)
    expect(h.isValidMacAddress('nope')).toBe(false)
    expect(h.isValidUuid('9c858901-8a57-4791-81fe-4c455b099bc9')).toBe(true)
    expect(h.isValidUuid('9c858901-8a57-4791-81fe-4c455b099bc9', 4)).toBe(true)
    expect(h.isValidUuid('9c858901-8a57-4791-81fe-4c455b099bc9', 3)).toBe(false)
    expect(h.isValidUuid('00000000-0000-0000-0000-000000000000')).toBe(true)
    expect(h.isValidUuid('00000000-0000-0000-0000-000000000000', 4)).toBe(false) // nil has no version
    expect(h.isValidUuid('nope')).toBe(false)
    expect(h.isValidUlid('01ARZ3NDEKTSV4RRFFQ69G5FAV')).toBe(true)
    expect(h.isValidUlid('short')).toBe(false)
    expect(h.isValidTimezone('Asia/Kathmandu')).toBe(true)
    expect(h.isValidTimezone('Not/AZone')).toBe(false)
    expect(h.isValidHexColor('#fff')).toBe(true)
    expect(h.isValidHexColor('#fffffff')).toBe(false)
  })

  it('isAscii', () => {
    expect(h.isAscii('abc123')).toBe(true)
    expect(h.isAscii('café')).toBe(false)
    expect(h.isAscii('')).toBe(true)
  })
})

describe('helpers  dates, sizes, numbers, stringify', () => {
  it('parseDate / isValidDate', () => {
    expect(h.parseDate(new Date('2024-01-01'))).toBeTypeOf('number')
    expect(h.parseDate(new Date('invalid'))).toBeNull()
    expect(h.parseDate(1000)).toBe(1000)
    expect(h.parseDate(Number.POSITIVE_INFINITY)).toBeNull()
    expect(h.parseDate('2024-01-01')).toBeTypeOf('number')
    expect(h.parseDate('')).toBeNull()
    expect(h.parseDate('nope')).toBeNull()
    expect(h.parseDate(true)).toBeNull()
    expect(h.isValidDate('2024-01-01')).toBe(true)
    expect(h.isValidDate('nope')).toBe(false)
  })

  it('sizeOf', () => {
    expect(h.sizeOf(5, true)).toBe(5)
    expect(h.sizeOf(5)).toBe(1) // no numeric context → string length, as in Laravel
    expect(h.sizeOf(1000000)).toBe(7)
    expect(h.sizeOf('12', true)).toBe(12)
    expect(h.sizeOf('café')).toBe(4)
    expect(h.sizeOf('   ')).toBe(3) // sizing never trims
    expect(h.sizeOf([1, 2, 3])).toBe(3)
    expect(h.sizeOf({ a: 1, b: 2 })).toBe(2)
    expect(h.sizeOf(new File(['12345'], 'a'))).toBeCloseTo(5 / 1024)
    expect(h.sizeOf(true)).toBe(1) // PHP strlen((string)true) === 1
    expect(h.sizeOf(false)).toBe(0) // PHP strlen((string)false) === 0
    expect(h.sizeOf('12', false)).toBe(2)
    expect(h.sizeOf(null)).toBe(0)
  })

  it('decimalPlaces / digitCount / fileExtension', () => {
    expect(h.decimalPlaces('9.99')).toBe(2)
    expect(h.decimalPlaces(9)).toBe(0)
    expect(h.decimalPlaces(1e-7)).toBe(7) // scientific notation is expanded
    expect(h.decimalPlaces(1.5e-3)).toBe(4)
    expect(h.decimalPlaces(1e21)).toBe(0)
    expect(h.decimalPlaces('1.5e3')).toBe(0)
    expect(h.decimalPlaces(' 1.25')).toBe(2) // non-canonical form → positional fallback
    expect(h.decimalPlaces('0x1A')).toBe(0)
    expect(h.digitCount(-123)).toBe(3)
    expect(h.fileExtension(new File([], 'photo.PNG'))).toBe('png')
    expect(h.fileExtension(new File([], 'noext'))).toBe('')
  })

  it('stringifyValue', () => {
    expect(h.stringifyValue(null)).toBe('')
    expect(h.stringifyValue(undefined)).toBe('')
    expect(h.stringifyValue({ a: 1 })).toBe('{"a":1}')
    expect(h.stringifyValue([1, 2])).toBe('[1,2]')
    expect(h.stringifyValue(5)).toBe('5')
    expect(h.stringifyValue(true)).toBe('true')
  })
})

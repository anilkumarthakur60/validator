import { describe, expect, it } from 'vitest'
import { Validator } from '@/lib/core/Validator'
import type { RulesSchema, ValidationData } from '@/lib/types'

/** Pass a single field value through a rule, with optional sibling data. */
const ok = (value: unknown, rule: RulesSchema['f'], extra: ValidationData = {}): boolean =>
  Validator.make({ f: value, ...extra }, { f: rule }).passes()

/** Same, but the field is intentionally absent from the data. */
const okAbsent = (rule: RulesSchema['f'], extra: ValidationData = {}): boolean =>
  Validator.make({ ...extra }, { f: rule }).passes()

describe('presence rules', () => {
  it('required / filled / present / missing / prohibited', () => {
    expect(ok('x', 'required')).toBe(true)
    expect(ok('', 'required')).toBe(false)
    expect(ok('', 'filled')).toBe(false)
    expect(okAbsent('filled')).toBe(true)
    expect(ok('x', 'filled')).toBe(true)
    expect(ok('', 'present')).toBe(true)
    expect(okAbsent('present')).toBe(false)
    expect(okAbsent('missing')).toBe(true)
    expect(ok('x', 'missing')).toBe(false)
    expect(ok('', 'prohibited')).toBe(true)
    expect(ok('x', 'prohibited')).toBe(false)
  })

  it('required_if family', () => {
    expect(ok('', 'required_if:other,cc', { other: 'cc' })).toBe(false)
    expect(ok('', 'required_if:other,cc', { other: 'x' })).toBe(true)
    expect(ok('', 'required_if_accepted:other', { other: 'yes' })).toBe(false)
    expect(ok('', 'required_if_accepted:other', { other: 'no' })).toBe(true)
    expect(ok('', 'required_if_declined:other', { other: 'no' })).toBe(false)
    expect(ok('', 'required_if_declined:other', { other: 'yes' })).toBe(true)
    expect(ok('', 'required_unless:other,cc', { other: 'x' })).toBe(false)
    expect(ok('', 'required_unless:other,cc', { other: 'cc' })).toBe(true)
    expect(ok('', 'required_with:a,b', { a: '1' })).toBe(false)
    expect(ok('', 'required_with:a,b', {})).toBe(true)
    expect(ok('', 'required_with_all:a,b', { a: '1', b: '2' })).toBe(false)
    expect(ok('', 'required_with_all:a,b', { a: '1' })).toBe(true)
    expect(ok('', 'required_without:a', {})).toBe(false)
    expect(ok('', 'required_without:a', { a: '1' })).toBe(true)
    expect(ok('', 'required_without_all:a,b', {})).toBe(false)
    expect(ok('', 'required_without_all:a,b', { a: '1' })).toBe(true)
    expect(ok({ x: 1 }, 'required_array_keys:x,y')).toBe(false)
    expect(ok({ x: 1, y: 2 }, 'required_array_keys:x,y')).toBe(true)
    expect(ok('not-array', 'required_array_keys:x')).toBe(false)
  })

  it('present_if / present_unless / present_with(_all)', () => {
    expect(okAbsent('present_if:other,1', { other: '1' })).toBe(false)
    expect(okAbsent('present_if:other,1', { other: '2' })).toBe(true)
    expect(okAbsent('present_unless:other,1', { other: '2' })).toBe(false)
    expect(okAbsent('present_unless:other,1', { other: '1' })).toBe(true)
    expect(okAbsent('present_with:a', { a: '1' })).toBe(false)
    expect(okAbsent('present_with:a', {})).toBe(true)
    expect(okAbsent('present_with_all:a,b', { a: '1', b: '2' })).toBe(false)
    expect(okAbsent('present_with_all:a,b', { a: '1' })).toBe(true)
  })

  it('missing_if / missing_unless / missing_with(_all)', () => {
    expect(ok('x', 'missing_if:other,1', { other: '1' })).toBe(false)
    expect(ok('x', 'missing_if:other,1', { other: '2' })).toBe(true)
    expect(ok('x', 'missing_unless:other,1', { other: '2' })).toBe(false)
    expect(ok('x', 'missing_unless:other,1', { other: '1' })).toBe(true)
    expect(ok('x', 'missing_with:a', { a: '1' })).toBe(false)
    expect(ok('x', 'missing_with:a', {})).toBe(true)
    expect(ok('x', 'missing_with_all:a,b', { a: '1', b: '2' })).toBe(false)
    expect(ok('x', 'missing_with_all:a,b', { a: '1' })).toBe(true)
  })

  it('prohibited family', () => {
    expect(ok('x', 'prohibited_if:other,1', { other: '1' })).toBe(false)
    expect(ok('x', 'prohibited_if:other,1', { other: '2' })).toBe(true)
    expect(ok('x', 'prohibited_if_accepted:other', { other: 'yes' })).toBe(false)
    expect(ok('x', 'prohibited_if_accepted:other', { other: 'no' })).toBe(true)
    expect(ok('x', 'prohibited_if_declined:other', { other: 'no' })).toBe(false)
    expect(ok('x', 'prohibited_if_declined:other', { other: 'yes' })).toBe(true)
    expect(ok('x', 'prohibited_unless:other,1', { other: '2' })).toBe(false)
    expect(ok('x', 'prohibited_unless:other,1', { other: '1' })).toBe(true)
    expect(ok('x', 'prohibits:a', { a: 'y' })).toBe(false)
    expect(ok('x', 'prohibits:a', { a: '' })).toBe(true)
    expect(ok('', 'prohibits:a', { a: 'y' })).toBe(true)
  })

  it('accepted / declined', () => {
    expect(ok('yes', 'accepted')).toBe(true)
    expect(ok('no', 'accepted')).toBe(false)
    expect(ok('', 'accepted_if:other,1', { other: '1' })).toBe(false)
    expect(ok('yes', 'accepted_if:other,1', { other: '1' })).toBe(true)
    expect(ok('x', 'accepted_if:other,1', { other: '2' })).toBe(true)
    expect(ok('no', 'declined')).toBe(true)
    expect(ok('', 'declined_if:other,1', { other: '1' })).toBe(false)
    expect(ok('no', 'declined_if:other,1', { other: '1' })).toBe(true)
    expect(ok('x', 'declined_if:other,1', { other: '2' })).toBe(true)
  })
})

describe('string rules', () => {
  it('type + alpha family + ascii', () => {
    expect(ok('hi', 'string')).toBe(true)
    expect(ok(1, 'string')).toBe(false)
    expect(ok('abcé', 'alpha')).toBe(true)
    expect(ok('abcé', 'alpha:ascii')).toBe(false)
    expect(ok(true, 'alpha')).toBe(false)
    expect(ok('a-1_b', 'alpha_dash')).toBe(true)
    expect(ok('a-1_b', 'alpha_dash:ascii')).toBe(true)
    expect(ok('ab12', 'alpha_num')).toBe(true)
    expect(ok('ab 12', 'alpha_num')).toBe(false)
    expect(ok('abc', 'ascii')).toBe(true)
    expect(ok('café', 'ascii')).toBe(false)
  })

  it('email styles', () => {
    expect(ok('a@b.com', 'email')).toBe(true)
    expect(ok('a@b.com', 'email:rfc,strict,filter,spoof,dns')).toBe(true)
    expect(ok('a..b@c.com', 'email:strict')).toBe(false)
    expect(ok('а@b.com', 'email:spoof')).toBe(false) // Cyrillic
    expect(ok(1, 'email')).toBe(false)
  })

  it('case / url / uuid / ulid / hex', () => {
    expect(ok('low', 'lowercase')).toBe(true)
    expect(ok('Low', 'lowercase')).toBe(false)
    expect(ok('UP', 'uppercase')).toBe(true)
    expect(ok('Up', 'uppercase')).toBe(false)
    expect(ok('https://x.com', 'url')).toBe(true)
    expect(ok('ftp://x.com', 'url:http,https')).toBe(false)
    expect(ok('9c858901-8a57-4791-81fe-4c455b099bc9', 'uuid')).toBe(true)
    expect(ok('9c858901-8a57-4791-81fe-4c455b099bc9', 'uuid:3')).toBe(false)
    expect(ok('01ARZ3NDEKTSV4RRFFQ69G5FAV', 'ulid')).toBe(true)
    expect(ok(123, 'uuid')).toBe(false) // non-string
    expect(ok('#fff', 'hex_color')).toBe(true)
  })

  it('starts/ends/regex (incl numeric coercion)', () => {
    expect(ok('hello', 'starts_with:he,foo')).toBe(true)
    expect(ok('hello', 'ends_with:lo')).toBe(true)
    expect(ok('hello', 'doesnt_start_with:x')).toBe(true)
    expect(ok('hello', 'doesnt_end_with:lo')).toBe(false)
    expect(ok(12345, 'regex:/^\\d+$/')).toBe(true) // number coerced to text
    expect(ok('abc', 'not_regex:/\\d/')).toBe(true)
    expect(ok(true, 'regex:/x/')).toBe(false) // non-text → false
  })

  it('active_url with and without resolver', async () => {
    expect(ok('https://x.com', 'active_url')).toBe(true)
    expect(ok('not a url', 'active_url')).toBe(false)
    expect(ok(1, 'active_url')).toBe(false)
    const v = Validator.make({ f: 'https://x.com' }, { f: 'active_url' }).withResolvers({
      activeUrl: () => Promise.resolve(false),
    })
    expect(await v.passesAsync()).toBe(false)
  })
})

describe('number + size rules', () => {
  it('numeric / integer strictness + decimal + digits + multiple_of', () => {
    expect(ok('12', 'numeric')).toBe(true)
    expect(ok('12', 'numeric:strict')).toBe(false)
    expect(ok(12, 'numeric:strict')).toBe(true)
    expect(ok(12, 'integer:strict')).toBe(true)
    expect(ok('12', 'integer:strict')).toBe(false)
    expect(ok('9.99', 'decimal:2')).toBe(true)
    expect(ok('9.999', 'decimal:2,4')).toBe(true)
    expect(ok('abc', 'decimal:2')).toBe(false)
    expect(ok('123', 'digits:3')).toBe(true)
    expect(ok('a1', 'digits:2')).toBe(false)
    expect(ok('123', 'digits_between:1,4')).toBe(true)
    expect(ok('a', 'digits_between:1,4')).toBe(false)
    expect(ok(12, 'numeric|max_digits:2')).toBe(true)
    expect(ok(123, 'numeric|min_digits:2')).toBe(true)
    expect(ok(9, 'numeric|multiple_of:3')).toBe(true)
    expect(ok(5, 'numeric|multiple_of:0')).toBe(false)
    expect(ok(5, 'numeric|multiple_of:x')).toBe(false)
  })

  it('size rules across types', () => {
    expect(ok(10, 'numeric|size:10')).toBe(true)
    expect(ok('abcde', 'string|size:5')).toBe(true)
    expect(ok([1, 2], 'array|size:2')).toBe(true)
    expect(ok(new File([], 'a'), 'file|size:0')).toBe(true)
    expect(ok('abc', 'string|min:2|max:4')).toBe(true)
    expect(ok([1, 2, 3], 'array|between:1,5')).toBe(true)
  })

  it('gt/gte/lt/lte literal + field reference', () => {
    expect(ok(5, 'numeric|gt:3')).toBe(true)
    expect(ok(5, 'numeric|gte:5')).toBe(true)
    expect(ok(2, 'numeric|lt:3')).toBe(true)
    expect(ok(3, 'numeric|lte:3')).toBe(true)
    expect(ok(5, 'numeric|gt:other', { other: 3 })).toBe(true)
    expect(ok(2, 'numeric|gt:other', { other: 3 })).toBe(false)
    expect(ok(5, 'numeric|gt:missing')).toBe(false) // NaN comparison
  })
})

describe('boolean + array rules', () => {
  it('boolean strictness', () => {
    expect(ok('1', 'boolean')).toBe(true)
    expect(ok('1', 'boolean:strict')).toBe(false)
    expect(ok(false, 'boolean:strict')).toBe(true)
  })

  it('array / list / distinct', () => {
    expect(ok([1, 2], 'array')).toBe(true)
    expect(ok([1, 2], 'array:0,1')).toBe(true)
    expect(ok([1, 2, 3], 'array:0,1')).toBe(false)
    expect(ok({ a: 1 }, 'array:a,b')).toBe(true)
    expect(ok({ a: 1, z: 9 }, 'array:a')).toBe(false)
    expect(ok('x', 'array')).toBe(false)
    expect(ok([1, 2, 3], 'list')).toBe(true)
    expect(ok({ 0: 'a' }, 'list')).toBe(false)
    expect(ok([1, 1], 'distinct')).toBe(false)
    expect(ok([1, 2], 'distinct')).toBe(true)
    expect(ok(['A', 'a'], 'distinct:ignore_case')).toBe(false)
    expect(ok([1, '1'], 'distinct:strict')).toBe(true)
    expect(ok('x', 'distinct')).toBe(true) // non-array, non-wildcard → passes
  })

  it('in_array / in_array_keys / contains / doesnt_contain', () => {
    expect(ok('a', 'in_array:pool.*', { pool: ['a', 'b'] })).toBe(true)
    expect(ok('z', 'in_array:pool.*', { pool: ['a', 'b'] })).toBe(false)
    expect(ok({ tz: 1 }, 'in_array_keys:tz,locale')).toBe(true)
    expect(ok({ other: 1 }, 'in_array_keys:tz')).toBe(false)
    expect(ok(['x'], 'in_array_keys:0')).toBe(true)
    expect(ok('s', 'in_array_keys:0')).toBe(false)
    expect(ok(['admin', 'editor'], 'array|contains:admin')).toBe(true)
    expect(ok(['editor'], 'array|contains:admin')).toBe(false)
    expect(ok('x', 'contains:admin')).toBe(false)
    expect(ok(['user'], 'array|doesnt_contain:admin')).toBe(true)
    expect(ok(['admin'], 'array|doesnt_contain:admin')).toBe(false)
    expect(ok('x', 'doesnt_contain:admin')).toBe(false)
  })

  it('distinct across wildcard siblings', () => {
    expect(Validator.make({ r: [{ id: 1 }, { id: 1 }] }, { 'r.*.id': 'distinct' }).fails()).toBe(
      true,
    )
    expect(Validator.make({ r: [{ id: 1 }, { id: 2 }] }, { 'r.*.id': 'distinct' }).passes()).toBe(
      true,
    )
  })
})

describe('date rules', () => {
  it('date / format / equals / before / after / timezone', () => {
    expect(ok('2024-01-01', 'date')).toBe(true)
    expect(ok(new Date(), 'date')).toBe(true)
    expect(ok('nope', 'date')).toBe(false)
    expect(ok('2024-01-31', 'date_format:Y-m-d')).toBe(true)
    expect(ok('2024-13-31', 'date_format:Y-m-d')).toBe(false)
    expect(ok('31/01/2024 13:5', 'date_format:d/m/Y G:i')).toBe(false)
    expect(ok('05/01/24 11', 'date_format:d/m/y h')).toBe(true)
    expect(ok('1', 'date_format:n')).toBe(true)
    expect(ok('2024-01-01', 'date_equals:2024-01-01')).toBe(true)
    expect(ok('2024-01-02', 'date_equals:2024-01-01')).toBe(false)
    expect(ok('2020-01-01', 'before:2021-01-01')).toBe(true)
    expect(ok('2020-01-01', 'before_or_equal:2020-01-01')).toBe(true)
    expect(ok('2022-01-01', 'after:2021-01-01')).toBe(true)
    expect(ok('2021-01-01', 'after_or_equal:2021-01-01')).toBe(true)
    expect(ok('3000-01-01', 'after:today')).toBe(true)
    expect(ok('1900-01-01', 'before:tomorrow')).toBe(true)
    expect(ok('1900-01-01', 'before:yesterday')).toBe(true)
    expect(ok('1900-01-01', 'before:now')).toBe(true)
    expect(ok('nope', 'before:2021-01-01')).toBe(false)
    expect(ok('2020-01-01', 'before:not-a-date')).toBe(false)
    expect(ok('end', 'before:start', { start: 'x' })).toBe(false)
    expect(ok('2020-01-01', 'before:start', { start: '2021-01-01' })).toBe(true)
    expect(ok('Asia/Kathmandu', 'timezone')).toBe(true)
    expect(ok('Nope/Zone', 'timezone')).toBe(false)
  })
})

describe('file rules', () => {
  const file = (name: string, type = '', body = 'x'): File => new File([body], name, { type })
  it('file / image / mimes / extensions / mimetypes', () => {
    expect(ok(file('a.png'), 'file')).toBe(true)
    expect(ok('x', 'file')).toBe(false)
    expect(ok(file('a.png'), 'image')).toBe(true)
    expect(ok(file('a', 'image/jpeg'), 'image')).toBe(true)
    expect(ok(file('a.svg'), 'image')).toBe(false)
    expect(ok(file('a.svg'), 'image:allow_svg')).toBe(true)
    expect(ok('x', 'image')).toBe(false)
    expect(ok(file('a.csv'), 'mimes:csv,txt')).toBe(true)
    expect(ok(file('a.png'), 'mimes:csv')).toBe(false)
    expect(ok(file('a.csv'), 'extensions:csv')).toBe(true)
    expect(ok(file('a.png', 'image/png'), 'mimetypes:image/*')).toBe(true)
    expect(ok(file('a.png', 'image/png'), 'mimetypes:image/png')).toBe(true)
    expect(ok(file('a.png', 'text/plain'), 'mimetypes:image/*')).toBe(false)
    expect(ok('x', 'mimetypes:image/*')).toBe(false)
    expect(ok('x', 'extensions:csv')).toBe(false)
  })
  it('encoding', () => {
    expect(ok('hello', 'encoding:utf-8')).toBe(true)
    expect(ok('hello', 'encoding:ascii')).toBe(true)
    expect(ok('café', 'encoding:ascii')).toBe(false)
    expect(ok('hello', 'encoding:latin1')).toBe(true) // unknown → passes
    expect(ok(file('a.txt'), 'encoding:utf-8')).toBe(true) // file value
  })
})

describe('utility rules', () => {
  it('confirmed / same / different / in / not_in', () => {
    expect(ok('p', 'confirmed', { f_confirmation: 'p' })).toBe(true)
    expect(ok('p', 'confirmed', { f_confirmation: 'q' })).toBe(false)
    expect(ok('p', 'confirmed:repeat', { repeat: 'p' })).toBe(true)
    expect(ok('x', 'same:other', { other: 'x' })).toBe(true)
    expect(ok('x', 'different:other', { other: 'y' })).toBe(true)
    expect(ok('a', 'in:a,b')).toBe(true)
    expect(ok('z', 'in:a,b')).toBe(false)
    expect(ok(['a', 'b'], 'array|in:a,b')).toBe(true)
    expect(ok(['a', 'z'], 'array|in:a,b')).toBe(false)
    expect(ok([['nested']], 'array|in:a')).toBe(false)
    expect(ok([1], 'in:a')).toBe(false) // array without array rule
    expect(ok('z', 'not_in:a,b')).toBe(true)
    expect(ok('a', 'not_in:a,b')).toBe(false)
  })

  it('json / ip / mac', () => {
    expect(ok('{"a":1}', 'json')).toBe(true)
    expect(ok('bad', 'json')).toBe(false)
    expect(ok('192.168.0.1', 'ip')).toBe(true)
    expect(ok('192.168.0.1', 'ipv4')).toBe(true)
    expect(ok('::1', 'ipv6')).toBe(true)
    expect(ok('3D:F2:C9:A6:B3:4F', 'mac_address')).toBe(true)
  })

  it('current_password / exists / unique (resolver + no resolver)', async () => {
    expect(ok('secret', 'current_password')).toBe(true) // no resolver → passes (warns once)
    expect(ok('x', 'exists:users')).toBe(true)
    expect(ok('x', 'unique:users')).toBe(true)

    const cp = Validator.make({ f: 'pw' }, { f: 'current_password:web' }).withResolvers({
      currentPassword: (p, guard) => Promise.resolve(p === 'pw' && guard === 'web'),
    })
    expect(await cp.passesAsync()).toBe(true)
    const cpFail = Validator.make({ f: 123 }, { f: 'current_password' }).withResolvers({
      currentPassword: () => Promise.resolve(true),
    })
    expect(await cpFail.failsAsync()).toBe(true) // non-string

    const ex = Validator.make({ f: 'a' }, { f: 'exists:users,name' }).withResolvers({
      exists: (q) => Promise.resolve(q.column === 'name'),
    })
    expect(await ex.passesAsync()).toBe(true)
    const uq = Validator.make({ f: ['a', 'b'] }, { f: 'unique:conn.users' }).withResolvers({
      unique: (q) => Promise.resolve(q.values.length === 2),
    })
    expect(await uq.passesAsync()).toBe(true)
  })
})

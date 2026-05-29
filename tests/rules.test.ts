import { describe, expect, it } from 'vitest'
import { Validator } from '@/lib/core/Validator'

const passes = (value: unknown, rule: string): boolean =>
  Validator.make({ field: value }, { field: rule }).passes()

describe('string rules', () => {
  it('email styles', () => {
    expect(passes('a@b.com', 'email')).toBe(true)
    expect(passes('a@b', 'email')).toBe(false)
    expect(passes('a..b@c.com', 'email:strict')).toBe(false)
  })
  it('alpha variants', () => {
    expect(passes('abcé', 'alpha')).toBe(true)
    expect(passes('abcé', 'alpha:ascii')).toBe(false)
    expect(passes('ab_1-2', 'alpha_dash')).toBe(true)
    expect(passes('ab 1', 'alpha_num')).toBe(false)
  })
  it('case + format', () => {
    expect(passes('lower', 'lowercase')).toBe(true)
    expect(passes('Lower', 'lowercase')).toBe(false)
    expect(passes('#ffcc00', 'hex_color')).toBe(true)
    expect(passes('https://x.com', 'url')).toBe(true)
    expect(passes('ftp://x.com', 'url:http,https')).toBe(false)
  })
  it('regex with delimiters', () => {
    expect(passes('abc123', 'regex:/^[a-z]+\\d+$/')).toBe(true)
    expect(passes('ABC', 'regex:/^[a-z]+$/i')).toBe(true)
    expect(passes('abc', 'not_regex:/\\d/')).toBe(true)
  })
  it('starts/ends with', () => {
    expect(passes('hello world', 'starts_with:hi,hello')).toBe(true)
    expect(passes('hello', 'doesnt_end_with:lo')).toBe(false)
  })
  it('uuid + ulid', () => {
    expect(passes('9c858901-8a57-4791-81fe-4c455b099bc9', 'uuid')).toBe(true)
    expect(passes('01ARZ3NDEKTSV4RRFFQ69G5FAV', 'ulid')).toBe(true)
  })
})

describe('number rules', () => {
  it('numeric / integer + strict', () => {
    expect(passes('12', 'numeric')).toBe(true)
    expect(passes('12', 'numeric:strict')).toBe(false)
    expect(passes(12, 'integer:strict')).toBe(true)
    expect(passes('12', 'integer:strict')).toBe(false)
  })
  it('between / digits / decimal / multiple_of', () => {
    expect(passes(5, 'numeric|between:1,10')).toBe(true)
    expect(passes(11, 'numeric|between:1,10')).toBe(false)
    expect(passes('12345', 'digits:5')).toBe(true)
    expect(passes('9.99', 'decimal:2')).toBe(true)
    expect(passes('9.999', 'decimal:2')).toBe(false)
    expect(passes(9, 'numeric|multiple_of:3')).toBe(true)
    expect(passes(10, 'numeric|multiple_of:3')).toBe(false)
  })
})

describe('boolean / accepted / declined', () => {
  it('boolean strictness', () => {
    expect(passes('1', 'boolean')).toBe(true)
    expect(passes('1', 'boolean:strict')).toBe(false)
    expect(passes(true, 'boolean:strict')).toBe(true)
  })
  it('accepted / declined', () => {
    expect(passes('yes', 'accepted')).toBe(true)
    expect(passes('no', 'accepted')).toBe(false)
    expect(passes('off', 'declined')).toBe(true)
  })
})

describe('array rules', () => {
  it('array key allow-list', () => {
    expect(Validator.make({ u: { name: 'x', admin: true } }, { u: 'array:name' }).fails()).toBe(true)
    expect(Validator.make({ u: { name: 'x' } }, { u: 'array:name,age' }).passes()).toBe(true)
  })
  it('list / distinct / contains', () => {
    expect(passes([1, 2, 3], 'list')).toBe(true)
    expect(passes([1, 2, 2], 'distinct')).toBe(false)
    expect(passes(['admin', 'editor'], 'array|contains:admin')).toBe(true)
    expect(passes(['user'], 'array|doesnt_contain:admin')).toBe(true)
  })
  it('distinct across wildcard siblings', () => {
    const v = Validator.make({ rows: [{ id: 1 }, { id: 1 }] }, { 'rows.*.id': 'distinct' })
    expect(v.fails()).toBe(true)
  })
})

describe('date rules', () => {
  it('date / before / after with relative + fields', () => {
    expect(passes('2024-01-01', 'date')).toBe(true)
    expect(passes('not a date', 'date')).toBe(false)
    expect(passes('2020-01-01', 'date|before:2021-01-01')).toBe(true)
    expect(
      Validator.make(
        { start: '2024-01-01', end: '2024-02-01' },
        { end: 'date|after:start' },
      ).passes(),
    ).toBe(true)
  })
  it('date_format', () => {
    expect(passes('2024-01-31', 'date_format:Y-m-d')).toBe(true)
    expect(passes('2024-13-31', 'date_format:Y-m-d')).toBe(false)
    expect(passes('31/01/2024', 'date_format:d/m/Y')).toBe(true)
  })
})

describe('utility rules', () => {
  it('in / not_in / json / ip / mac', () => {
    expect(passes('a', 'in:a,b,c')).toBe(true)
    expect(passes('z', 'in:a,b,c')).toBe(false)
    expect(passes('z', 'not_in:a,b,c')).toBe(true)
    expect(passes('{"a":1}', 'json')).toBe(true)
    expect(passes('192.168.0.1', 'ipv4')).toBe(true)
    expect(passes('::1', 'ipv6')).toBe(true)
    expect(passes('3D:F2:C9:A6:B3:4F', 'mac_address')).toBe(true)
  })
})

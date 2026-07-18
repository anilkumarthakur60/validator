import { afterEach, describe, expect, it } from 'vitest'
import { validation, ValidationBuilder } from '@/fluent/builder'
import type { ValidationBuilder as Builder } from '@/fluent/builder'

/** Assert a chain accepts `good` and rejects `bad`. */
const check = (chain: Builder, good: unknown, bad: unknown): void => {
  const rule = chain.toRule()
  expect(rule(good)).toBe(true)
  expect(rule(bad)).not.toBe(true)
}

const file = (name: string, type = ''): File => new File(['x'], name, { type })

describe('fluent — modifiers & presence', () => {
  it('nullable / bail / stopAfterFirstError / sometimes', () => {
    expect(validation.nullable().email().toRule()('')).toBe(true)
    expect(validation.bail().required().email().toRule()('')).toBe('The value field is required.')
    expect(validation.stopAfterFirstError().required().toRule()('x')).toBe(true)
    expect(validation.sometimes().email().toRule()('a@b.com')).toBe(true)
  })
  it('required / filled / present / missing / prohibited', () => {
    check(validation.required(), 'x', '')
    check(validation.filled(), 'x', '')
    expect(validation.present().toRule()('')).toBe(true)
    expect(validation.missing().toRule()('x')).not.toBe(true) // synthetic field is always present
    check(validation.prohibited(), '', 'x')
  })
})

describe('fluent — strings', () => {
  it('basic string formats', () => {
    check(validation.string(), 'x', 1)
    check(validation.alpha(), 'abc', 'a1')
    check(validation.alpha(true), 'abc', 'café')
    check(validation.alphaDash(), 'a_b-1', 'a b')
    check(validation.alphaNum(), 'ab12', 'ab 12')
    check(validation.ascii(), 'abc', 'café')
    check(validation.email(), 'a@b.com', 'nope')
    check(validation.email('strict'), 'a@b.com', 'a..b@c.com')
    check(validation.lowercase(), 'low', 'Low')
    check(validation.uppercase(), 'UP', 'up')
    check(validation.url(), 'https://x.com', 'nope')
    check(validation.url('http', 'https'), 'https://x.com', 'ftp://x.com')
    check(validation.activeUrl(), 'https://x.com', 'nope')
    check(validation.uuid(), '9c858901-8a57-4791-81fe-4c455b099bc9', 'nope')
    check(
      validation.uuid(3),
      '9c858901-8a57-3791-81fe-4c455b099bc9',
      '9c858901-8a57-4791-81fe-4c455b099bc9',
    )
    check(validation.ulid(), '01ARZ3NDEKTSV4RRFFQ69G5FAV', 'short')
    check(validation.hexColor(), '#fff', 'red')
  })
  it('length, affixes, regex', () => {
    check(validation.maxLength(3), 'abc', 'abcd')
    check(validation.minLength(3), 'abc', 'ab')
    check(validation.startsWith('he'), 'hello', 'world')
    check(validation.endsWith('lo'), 'hello', 'hi')
    check(validation.doesntStartWith('x'), 'hello', 'xenon')
    check(validation.doesntEndWith('o'), 'hi', 'halo')
    check(validation.regex(/^\d+$/), '123', 'abc')
    check(validation.regex('/^\\d+$/'), '123', 'abc')
    check(validation.notRegex(/\d/), 'abc', 'a1')
    check(validation.notRegex('/\\d/'), 'abc', 'a1')
    expect(validation.nullableMaxLength(3).toRule()('')).toBe(true)
    check(validation.stringBetweenLength(2, 4), 'abc', 'a')
  })
})

describe('fluent — numbers & dates', () => {
  it('numeric family', () => {
    check(validation.numeric(), 5, 'x')
    check(validation.numeric(true), 5, '5')
    check(validation.integer(), 5, 5.5)
    check(validation.integer(true), 5, '5')
    check(validation.min(3), 5, 2)
    check(validation.max(3), 2, 5)
    check(validation.between(1, 5), 3, 9)
    check(validation.gt(3), 5, 1)
    check(validation.gte(5), 5, 4)
    check(validation.lt(3), 2, 4)
    check(validation.lte(3), 3, 4)
    check(validation.digits(3), '123', '12')
    check(validation.digitsBetween(1, 3), '12', '1234')
    check(validation.maxDigits(2), 12, 123)
    check(validation.minDigits(2), 12, 1)
    check(validation.multipleOf(3), 9, 10)
    check(validation.decimal(2), '9.99', '9.999')
    check(validation.decimal(2, 4), '9.999', '9.9')
    check(validation.mustBePositive(), 1, -1)
    expect(validation.nullablePositive().toRule()('')).toBe(true)
    expect(validation.minPasswordLength(4).toRule()('abcd')).toBe(true)
    expect(validation.maxPasswordLength(4).toRule()('abcde')).not.toBe(true)
  })
  it('date family', () => {
    check(validation.date(), '2024-01-01', 'nope')
    check(validation.dateEquals('2024-01-01'), '2024-01-01', '2024-01-02')
    check(validation.dateFormat('Y-m-d'), '2024-01-01', '01/01/2024')
    check(validation.before('2021-01-01'), '2020-01-01', '2022-01-01')
    check(validation.beforeOrEqual('2020-01-01'), '2020-01-01', '2021-01-01')
    check(validation.after('2021-01-01'), '2022-01-01', '2020-01-01')
    check(validation.afterOrEqual('2021-01-01'), '2021-01-01', '2020-01-01')
    check(validation.timezone(), 'Asia/Kathmandu', 'Nope/Zone')
    check(validation.asDateOfBirth(), '1990-01-01', '3000-01-01')
    expect(validation.asDateOfBirth().toRule()('nope')).not.toBe(true)
    expect(validation.asDateOfBirth(10).toRule()('1900-01-01')).not.toBe(true)
  })
})

describe('fluent — booleans, arrays, files', () => {
  it('booleans', () => {
    check(validation.boolean(), '1', 'x')
    check(validation.boolean(true), true, '1')
    check(validation.accepted(), 'yes', 'no')
    check(validation.declined(), 'no', 'yes')
    check(validation.acceptedIf('cc', 'cc'), 'yes', 'no')
    check(validation.declinedIf('cc', 'cc'), 'no', 'yes')
  })
  it('arrays', () => {
    check(validation.array(), [1, 2], 'x')
    check(validation.array('0', '1'), [1, 2], [1, 2, 3])
    check(validation.listRule(), [1, 2], { 0: 'a' })
    check(validation.distinct(), [1, 2], [1, 1])
    check(validation.distinct('ignore_case'), ['a', 'B'], ['a', 'A'])
    check(validation.inArray(['a', 'b']), 'a', 'z')
    check(validation.containsRule('admin'), ['admin', 'user'], ['user'])
    check(validation.doesntContain('admin'), ['user'], ['admin'])
    check(validation.requiredArrayKeys('a'), { a: 1 }, { b: 2 })
  })
  it('files', () => {
    check(validation.file(), file('a.png'), 'x')
    check(validation.image(), file('a.png'), file('a.svg'))
    expect(validation.image(true).toRule()(file('a.svg'))).toBe(true)
    check(validation.mimes('png'), file('a.png'), file('a.csv'))
    check(validation.mimetypes('image/*'), file('a.png', 'image/png'), file('a.txt', 'text/plain'))
    check(validation.extensions('png'), file('a.png'), file('a.csv'))
  })
})

describe('fluent — comparison, conditional, misc', () => {
  it('comparison + cross-field', () => {
    check(validation.same('x'), 'x', 'y')
    check(validation.different('x'), 'y', 'x')
    check(validation.confirmed('p'), 'p', 'q')
    check(validation.mustMatch('p'), 'p', 'q')
    check(validation.in('a', 'b'), 'a', 'z')
    check(validation.notIn('a', 'b'), 'z', 'a')
    check(validation.enum(['a', 'b']), 'a', 'z')
  })
  it('conditional with captured siblings', () => {
    check(validation.requiredIf('cc', 'cc'), 'x', '')
    expect(validation.requiredUnless('cc', 'cc').toRule()('')).toBe(true)
    check(validation.requiredWith('present'), 'x', '')
    check(validation.requiredWithAll('a', 'b'), 'x', '')
    expect(validation.requiredWithout('present').toRule()('x')).toBe(true)
    expect(validation.requiredWithoutAll('', '').toRule()('')).not.toBe(true) // all others empty → required
    check(validation.prohibitedIf('cc', 'cc'), '', 'x')
    check(validation.prohibits('y'), '', 'x')
  })
  it('misc', () => {
    check(validation.ip(), '192.168.0.1', 'nope')
    check(validation.ipv4(), '192.168.0.1', '::1')
    check(validation.ipv6(), '::1', '192.168.0.1')
    check(validation.json(), '{"a":1}', 'bad')
    check(validation.macAddress(), '3D:F2:C9:A6:B3:4F', 'nope')
    check(validation.size(3), 'abc', 'ab')
    check(validation.password(), 'abcdefg1', 'short')
    expect(validation.password(8).toRule()('abcdefgh')).not.toBe(true) // no number
    expect(validation.password(8).toRule()('12345678')).not.toBe(true) // no letter
    check(validation.strongPassword(8), 'Abcdef@1', 'weak')
    check(validation.asPhoneNumber(), '+1 (555) 123-4567', 'abc')
    check(validation.notEmpty(), 'x', '')
  })
})

describe('fluent — terminal, config, extension', () => {
  it('getRuleFn / attribute / withMessages / empty message fallback', () => {
    expect(validation.required().getRuleFn()('x')).toBe(true)
    expect(validation.attribute('Email').required().toRule()('')).toBe(
      'The Email field is required.',
    )
    expect(validation.withMessages({ required: 'Need it' }).required().toRule()('')).toBe('Need it')
    expect(validation.custom(() => '').toRule()('x')).toBe('The given value is invalid.')
  })
  it('direct call (makeCallable), new instance, statics', () => {
    const rule = validation.required().maxLength(3)
    expect((rule as unknown as (v: unknown) => true | string)('ab')).toBe(true)
    expect(new ValidationBuilder().required().toRule()('x')).toBe(true)
  })
  it('custom + registry', () => {
    validation.extend('isFoo', (v) => v === 'foo' || 'must be foo')
    expect(validation.hasRule('isFoo')).toBe(true)
    expect(validation.customRuleNames()).toContain('isFoo')
    expect(validation.required().rule('isFoo').toRule()('foo')).toBe(true)
    expect(validation.rule('isFoo').toRule()('bar')).toBe('must be foo')
    expect(() => validation.rule('missing').toRule()('x')).toThrow(/Unknown custom rule/)
    const inline = validation.custom((v) => String(v).startsWith('HC-') || 'bad')
    expect(inline.toRule()('HC-1')).toBe(true)
    expect(inline.toRule()('X')).toBe('bad')
  })

  afterEach(() => {
    validation.removeRule('isFoo')
  })
})

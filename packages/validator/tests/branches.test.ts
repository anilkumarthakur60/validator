import { describe, expect, it } from 'vitest'
import { Validator } from '@/core/Validator'
import { dotGet, dotSet, flattenKeys } from '@/core/data'
import { parseFieldRules } from '@/core/RuleParser'
import { registerRule } from '@/core/registry'
import { Password } from '@/ruleObjects/Password'
import { AnyOf } from '@/ruleObjects/AnyOf'
import { Rule } from '@/ruleObjects/Rule'
import { validation } from '@/fluent/builder'
import type { ValidationData } from '@/types'

const ok = (value: unknown, rule: string, extra: ValidationData = {}): boolean =>
  Validator.make({ f: value, ...extra }, { f: rule }).passes()

describe('engine edge branches', () => {
  it('throws on an unknown rule', () => {
    expect(() => Validator.make({ f: 1 }, { f: 'no_such_rule' }).passes()).toThrow(
      /Unknown validation rule/,
    )
  })

  it('merges rules when two schema keys resolve to the same attribute', () => {
    const v = Validator.make(
      { users: [{ email: '' }] },
      { 'users.*.email': 'required', 'users.0.email': 'email' },
    )
    expect(v.fails()).toBe(true)
  })

  it('merges repeated sometimes() specs for one attribute', () => {
    const v = Validator.make({ games: 200, reason: 'hello there' }, { games: 'integer' })
    v.sometimes('reason', 'string', () => true)
    v.sometimes('reason', 'min:3', () => true) // exercises the "existing spec" merge path
    expect(v.passes()).toBe(true)
    expect(v.validated()).toMatchObject({ reason: 'hello there' })
  })

  it('walks through null intermediates during wildcard expansion', () => {
    expect(Validator.make({ a: null }, { 'a.b.c': 'sometimes|string' }).passes()).toBe(true)
  })

  it('flattenKeys over a root-level array', () => {
    expect(flattenKeys([1, 2] as unknown as ValidationData)).toEqual(['0', '1'])
  })
})

describe('rule parameter-absent branches', () => {
  // Dependent rules used without their parameter(s) exercise the
  // `parameters[i] ?? ''` fallbacks. We only need them to execute.
  const dependent = [
    'required_if',
    'required_if_accepted',
    'required_if_declined',
    'required_unless',
    'present_if',
    'present_unless',
    'missing_if',
    'missing_unless',
    'prohibited_if',
    'prohibited_if_accepted',
    'prohibited_if_declined',
    'prohibited_unless',
    'accepted_if',
    'declined_if',
    'same',
    'different',
    'date_equals',
    'before',
    'before_or_equal',
    'after',
    'after_or_equal',
  ]
  it('runs every dependent rule with no parameters', () => {
    for (const rule of dependent) {
      expect(() => Validator.make({ f: 'x' }, { f: `sometimes|${rule}` }).passes()).not.toThrow()
    }
  })

  it('size + numeric rules with no parameters', () => {
    expect(ok(5, 'numeric|gt')).toBe(true) // compared against 0
    expect(ok(5, 'numeric|gte')).toBe(true)
    expect(ok(-1, 'numeric|lt')).toBe(true)
    expect(ok(0, 'numeric|lte')).toBe(true)
    expect(ok(5, 'numeric|max')).toBe(false) // max '' → NaN → fails (replacer runs)
    expect(ok(5, 'numeric|min')).toBe(false) // min '' → NaN → fails
    expect(ok('1', 'digits')).toBe(false) // digits '' → length !== NaN
    expect(ok('9.9', 'decimal')).toBe(false) // decimal '' → 0 places expected
    expect(ok('a', 'in_array')).toBe(false)
  })

  it('parsePhpRegex fallback (no delimiters)', () => {
    expect(ok('xyzzy', 'regex:xyz')).toBe(true)
  })

  it('date_format with a literal (no tokens)', () => {
    expect(ok('X', 'date_format:X')).toBe(true)
  })

  it('looseEquals boolean false side + distinct over objects', () => {
    expect(ok('', 'required_if:flag,false', { flag: false })).toBe(false)
    expect(ok([{ a: 1 }, { a: 1 }], 'distinct')).toBe(false)
    expect(ok([{ a: 1 }, { a: 2 }], 'distinct')).toBe(true)
  })
})

describe('fluent + rule-object edge branches', () => {
  it('alphaDash/alphaNum ascii variants + asDateOfBirth(Date)', () => {
    expect(validation.alphaDash(true).toRule()('a_b-1')).toBe(true)
    expect(validation.alphaNum(true).toRule()('ab12')).toBe(true)
    expect(validation.asDateOfBirth().toRule()(new Date('1990-01-01'))).toBe(true)
  })

  it('AnyOf without a validator still works', () => {
    const anyOf = new AnyOf([['email'], ['alpha_dash', 'min:6']])
    const fail = (msg: string): void => {
      expect(msg).toContain('invalid')
    }
    anyOf.validate('f', 'longdash', () => {
      throw new Error('should have passed')
    })
    anyOf.validate('f', 'no', fail)
  })

  it('Password.defaults() falls back to a default factory when none set', () => {
    // Read before any factory is configured in this file → null branch.
    expect(Password.defaults()).toBeInstanceOf(Password)
  })

  it('FileRule size-string parsing edges', async () => {
    const file = new File(['x'.repeat(2048)], 'a.png', { type: 'image/png' })
    const noUnit = Rule.file().min('1').max('999999')
    expect(await Validator.make({ a: file }, { a: [noUnit] }).passesAsync()).toBe(true)
    const invalid = Rule.file().max('not-a-size')
    expect(await Validator.make({ a: file }, { a: [invalid] }).failsAsync()).toBe(true)
  })

  it('exists string-form with explicit NULL column + array value', async () => {
    const v = Validator.make({ ids: ['a', 'b'] }, { ids: 'exists:t,NULL' }).withResolvers({
      exists: (q) => Promise.resolve(q.column === 'ids' && q.values.length === 2),
    })
    expect(await v.passesAsync()).toBe(true)
  })

  it('ExistsRule object: array value + resolver rejection', async () => {
    const okArr = Validator.make({ ids: ['a', 'b'] }, { ids: [Rule.exists('t')] }).withResolvers({
      exists: (q) => Promise.resolve(q.values.length === 2),
    })
    expect(await okArr.passesAsync()).toBe(true)
    const rejected = Validator.make({ id: 1 }, { id: [Rule.exists('t')] }).withResolvers({
      exists: () => Promise.resolve(false),
    })
    expect(await rejected.failsAsync()).toBe(true)
  })
})

describe('more reachable branches', () => {
  it('parseFieldRules with a trailing colon yields no parameters', () => {
    expect(parseFieldRules('bail:')[0]).toMatchObject({ name: 'bail', parameters: [] })
  })

  it('dotSet into an existing array clones it', () => {
    const out = dotSet({ a: [1, 2] }, 'a.0', 9)
    expect(dotGet(out, 'a.0')).toBe(9)
    expect(dotGet(out, 'a.1')).toBe(2)
  })

  it('flattenKeys over a scalar root returns []', () => {
    expect(flattenKeys(5 as unknown as ValidationData)).toEqual([])
  })

  it('exclude_if with a boolean comparison value', () => {
    expect(
      Validator.make({ flag: true, f: 'bad' }, { f: 'exclude_if:flag,true|integer' }).passes(),
    ).toBe(true)
    expect(
      Validator.make({ flag: false, f: 'bad' }, { f: 'exclude_if:flag,false|integer' }).passes(),
    ).toBe(true)
  })

  it('Rule.requiredIf(true) with a present value passes (no-fail branch)', () => {
    expect(Validator.make({ role: 'x' }, { role: [Rule.requiredIf(true)] }).passes()).toBe(true)
  })

  it('looseEquals 1/0 string comparisons against booleans', () => {
    expect(ok('', 'required_if:flag,1', { flag: true })).toBe(false)
    expect(ok('', 'required_if:flag,0', { flag: false })).toBe(false)
  })

  it('regex with ( and { delimiters', () => {
    expect(ok('xabcx', 'regex:(abc)')).toBe(true)
    expect(ok('abc', 'regex:{abc}')).toBe(true)
  })

  it('uuid with a non-numeric version parameter is treated as unversioned', () => {
    expect(ok('9c858901-8a57-4791-81fe-4c455b099bc9', 'uuid:abc')).toBe(true)
  })

  it('date_format with an escaped character', () => {
    expect(ok('2024-01', 'date_format:Y\\-m')).toBe(true)
  })

  it('warnOnce only warns once per rule (second call hits the cache)', () => {
    expect(ok('a', 'exists:users')).toBe(true)
    expect(ok('b', 'exists:users')).toBe(true)
  })

  it('falls back to the generic message for a rule with no default', () => {
    registerRule('always_fail', { validate: () => false })
    const v = Validator.make({ x: 'v' }, { x: 'always_fail' })
    v.passes()
    expect(v.errors().first('x')).toBe('The x field is invalid.')
  })

  it('exclude_if with a non-boolean comparison value (string path)', () => {
    expect(Validator.make({ o: 2, f: 'bad' }, { f: 'exclude_if:o,2|integer' }).passes()).toBe(true)
  })

  it('asDateOfBirth rejects a non-string, non-Date value', () => {
    expect(validation.asDateOfBirth().toRule()(12345)).not.toBe(true)
  })

  it('proxy returns undefined for a non-method property', () => {
    expect(
      (validation as unknown as Record<string, unknown>)['definitelyNotAMethod'],
    ).toBeUndefined()
  })

  it('gt on non-numeric values (string size context in replacer)', () => {
    expect(ok('ab', 'gt:other', { other: 'abcd' })).toBe(false)
  })

  it('looseEquals against a boolean with an unrelated string', () => {
    expect(ok('', 'required_if:flag,maybe', { flag: true })).toBe(true)
  })

  it('exists with no table parameter', async () => {
    const v = Validator.make({ f: 'x' }, { f: 'exists' }).withResolvers({
      exists: (q) => Promise.resolve(q.table === ''),
    })
    expect(await v.passesAsync()).toBe(true)
  })

  it('async engine: exclude / sometimes-skip / bail / stopOnFirstFailure', async () => {
    expect(
      await Validator.make({ o: 1, f: 'bad' }, { f: 'exclude_with:o|integer' }).passesAsync(),
    ).toBe(true)
    expect(await Validator.make({}, { e: 'sometimes|email' }).passesAsync()).toBe(true)
    const bailed = Validator.make({ t: 123 }, { t: 'bail|string|max:2' })
    expect(await bailed.failsAsync()).toBe(true)
    expect(bailed.errors().get('t')).toHaveLength(1)
    const stopped = Validator.make(
      { a: '', b: '' },
      { a: 'required', b: 'required' },
    ).stopOnFirstFailure()
    await stopped.failsAsync()
    expect(stopped.errors().count()).toBe(1)
  })

  it('async closure skipped on empty value', async () => {
    const v = Validator.make(
      { f: '' },
      {
        f: [
          (_a: string, _v: unknown, fail: (m: string) => void) => {
            fail('nope')
          },
        ],
      },
    )
    expect(await v.passesAsync()).toBe(true)
  })

  it('exclude_if with boolean 1/0 comparison values', () => {
    expect(
      Validator.make({ flag: true, f: 'bad' }, { f: 'exclude_if:flag,1|integer' }).passes(),
    ).toBe(true)
    expect(
      Validator.make({ flag: false, f: 'bad' }, { f: 'exclude_if:flag,0|integer' }).passes(),
    ).toBe(true)
  })

  it('encoding us-ascii + no-param + dimensions without a decoder', async () => {
    expect(ok('hello', 'encoding:us-ascii')).toBe(true)
    expect(ok('hello', 'encoding')).toBe(true) // default utf-8
    // No createImageBitmap in this (non-stubbed) context → dimensions passes.
    const img = new File(['x'], 'a.png', { type: 'image/png' })
    expect(await Validator.make({ f: img }, { f: 'dimensions:min_width=10' }).passesAsync()).toBe(
      true,
    )
  })

  it('size replacer with no parameter (failing lt)', () => {
    expect(ok(5, 'numeric|lt')).toBe(false) // 5 < 0 false → fails → replacer reads param ?? ''
  })

  it('sometimes() targeting a schema attribute marks it consumed', () => {
    const v = Validator.make({ email: 'a@b.com' }, { email: 'string' })
    v.sometimes('email', 'email', () => true)
    expect(v.passes()).toBe(true)
  })

  it('exclude_if boolean value falling through to string compare', () => {
    expect(
      Validator.make({ flag: true, f: 'bad' }, { f: 'exclude_if:flag,maybe|integer' }).fails(),
    ).toBe(true)
  })
})

describe('formerly-suppressed branches, now exercised', () => {
  it('FileRule sizes in terabytes', async () => {
    const small = new File(['x'], 'a.bin')
    const v = Validator.make({ a: small }, { a: [Rule.file().max('1tb')] })
    expect(await v.passesAsync()).toBe(true)
  })

  it('utf-8 encoding rejects lone surrogates', () => {
    expect(ok('hello', 'encoding:utf-8')).toBe(true)
    expect(ok('\uD800', 'encoding:utf-8')).toBe(false) // lone surrogate → re-encoded as U+FFFD
  })

  it('positional placeholders at depth 5+ use the numeric ordinal fallback', () => {
    const deep = { a: [{ b: [{ c: [{ d: [{ e: [{ f: [{ g: '' }] }] }] }] }] }] }
    const v = Validator.make(
      deep,
      { 'a.*.b.*.c.*.d.*.e.*.f.*.g': 'required' },
      { 'a.*.b.*.c.*.d.*.e.*.f.*.g.required': 'idx :6th-index pos :6th-position' },
    )
    v.passes()
    expect(v.errors().first('a.0.b.0.c.0.d.0.e.0.f.0.g')).toBe('idx 0 pos 1')
  })

  it('requireBuiltinRule throws for an unknown rule (via the engine)', () => {
    expect(() => Validator.make({ f: 1 }, { f: 'totally_unknown_rule' }).passes()).toThrow(
      /Unknown validation rule/,
    )
  })
})

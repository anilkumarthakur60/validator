import { describe, expect, it, vi } from 'vitest'
import { Validator } from '@/lib/core/Validator'
import { Rule } from '@/lib/ruleObjects/Rule'
import { Password } from '@/lib/ruleObjects/Password'
import { Enum } from '@/lib/ruleObjects/Enum'
import { ExistsRule, UniqueRule } from '@/lib/ruleObjects/database'
import { FileRule } from '@/lib/ruleObjects/FileRule'
import { AnyOf } from '@/lib/ruleObjects/AnyOf'
import { makeBuiltinRuleObject } from '@/lib/ruleObjects/delegating'
import type { FailFn } from '@/lib/types'

const passes = (value: unknown, rule: Parameters<typeof Validator.make>[1]['x']): boolean =>
  Validator.make({ x: value }, { x: rule }).passes()

describe('Rule facade', () => {
  it('in / notIn / contains / doesntContain', () => {
    expect(passes('a', [Rule.in(['a', 'b'])])).toBe(true)
    expect(passes('z', [Rule.in(['a', 'b'])])).toBe(false)
    expect(passes('z', [Rule.notIn(['a', 'b'])])).toBe(true)
    expect(passes(['a', 'b'], ['array', Rule.contains(['a'])])).toBe(true)
    expect(passes(['a'], ['array', Rule.doesntContain(['admin'])])).toBe(true)
  })

  it('requiredIf / requiredUnless (bool + closure)', () => {
    expect(Validator.make({}, { role: [Rule.requiredIf(true)] }).fails()).toBe(true)
    expect(Validator.make({}, { role: [Rule.requiredIf(false)] }).passes()).toBe(true)
    expect(Validator.make({}, { role: [Rule.requiredIf(() => true)] }).fails()).toBe(true)
    expect(Validator.make({}, { role: [Rule.requiredUnless(true)] }).passes()).toBe(true)
    expect(Validator.make({}, { role: [Rule.requiredUnless(false)] }).fails()).toBe(true)
  })

  it('prohibitedIf / prohibitedUnless', () => {
    expect(Validator.make({ role: 'x' }, { role: [Rule.prohibitedIf(true)] }).fails()).toBe(true)
    expect(Validator.make({ role: 'x' }, { role: [Rule.prohibitedIf(false)] }).passes()).toBe(true)
    expect(Validator.make({ role: 'x' }, { role: [Rule.prohibitedUnless(false)] }).fails()).toBe(
      true,
    )
    expect(Validator.make({ role: 'x' }, { role: [Rule.prohibitedUnless(true)] }).passes()).toBe(
      true,
    )
  })

  it('excludeIf / excludeUnless', () => {
    const v1 = Validator.make({ a: 'x', b: 'bad' }, { b: [Rule.excludeIf(true), 'integer'] })
    expect(v1.passes()).toBe(true)
    expect(v1.validated()).not.toHaveProperty('b')
    expect(Validator.make({ b: 'bad' }, { b: [Rule.excludeIf(false), 'integer'] }).fails()).toBe(
      true,
    )
    expect(Validator.make({ b: 'bad' }, { b: [Rule.excludeUnless(true), 'integer'] }).fails()).toBe(
      true,
    )
    expect(
      Validator.make({ b: 'bad' }, { b: [Rule.excludeUnless(false), 'integer'] }).passes(),
    ).toBe(true)
  })

  it('enum / anyOf / forEach', () => {
    expect(passes('active', [Rule.enum(['pending', 'active'])])).toBe(true)
    const rules = { u: ['required', Rule.anyOf([['email'], ['alpha_dash', 'min:6']])] }
    expect(Validator.make({ u: 'a@b.com' }, rules).passes()).toBe(true)
    expect(Validator.make({ u: 'no' }, rules).fails()).toBe(true)
    const fe = Validator.make(
      { r: [{ id: 1 }, { id: -1 }] },
      {
        'r.*.id': Rule.forEach(() => ['integer', 'min:0']),
      },
    )
    expect(fe.fails()).toBe(true)
    expect(fe.errors().has('r.1.id')).toBe(true)
    expect(fe.errors().has('r.0.id')).toBe(false)
  })

  it('exists / unique / dimensions / file / password constructors', () => {
    expect(Rule.exists('users')).toBeInstanceOf(ExistsRule)
    expect(Rule.unique('users', 'email')).toBeInstanceOf(UniqueRule)
    expect(Rule.dimensions().maxWidth(10)).toBeTruthy()
    expect(Rule.file()).toBeInstanceOf(FileRule)
    expect(Rule.password(10)).toBeInstanceOf(Password)
  })
})

describe('Password', () => {
  const run = (value: unknown, password: Password) =>
    Validator.make({ p: value }, { p: [password] })

  it('length + character classes', async () => {
    expect(await run('abc', Password.min(8)).failsAsync()).toBe(true)
    expect(await run('abcdefgh', Password.min(8)).passesAsync()).toBe(true)
    expect(await run('abcdefghij', Password.min(8).max(8)).failsAsync()).toBe(true)
    expect(await run('12345678', Password.min(8).letters()).failsAsync()).toBe(true)
    expect(await run('abcdefgh', Password.min(8).mixedCase()).failsAsync()).toBe(true)
    expect(await run('Abcdefgh', Password.min(8).mixedCase()).passesAsync()).toBe(true)
    expect(await run('abcdefgh', Password.min(8).numbers()).failsAsync()).toBe(true)
    expect(await run('abcdefg1', Password.min(8).numbers()).passesAsync()).toBe(true)
    expect(await run('abcdefg1', Password.min(8).symbols()).failsAsync()).toBe(true)
    expect(await run('abcdef@1', Password.min(8).symbols()).passesAsync()).toBe(true)
    expect(await run(123, Password.min(8)).failsAsync()).toBe(true) // non-string
  })

  it('uncompromised (resolver present + absent)', async () => {
    const compromised = Validator.make(
      { p: 'password1' },
      { p: [Password.min(8).uncompromised(0)] },
    ).withResolvers({ compromised: () => Promise.resolve(5) })
    expect(await compromised.failsAsync()).toBe(true)
    const safe = Validator.make(
      { p: 'password1' },
      { p: [Password.min(8).uncompromised(10)] },
    ).withResolvers({ compromised: () => Promise.resolve(5) })
    expect(await safe.passesAsync()).toBe(true)
    // No resolver → uncompromised check is skipped.
    expect(
      await Validator.make(
        { p: 'password1' },
        { p: [Password.min(8).uncompromised()] },
      ).passesAsync(),
    ).toBe(true)
  })

  it('defaults + toPasswordRulesString', async () => {
    Password.defaults(() => Password.min(12).mixedCase().numbers().symbols())
    const dflt = Password.defaults()
    expect(await Validator.make({ p: 'short' }, { p: [dflt] }).failsAsync()).toBe(true)
    expect(Password.min(8).max(20).letters().numbers().symbols().toPasswordRulesString()).toContain(
      'minlength: 8',
    )
    // Reset to plain default for other tests.
    expect(Password.min(8).toPasswordRulesString()).toBe('minlength: 8')
  })
})

describe('Enum', () => {
  it('only / except / when', () => {
    expect(passes('active', [new Enum(['pending', 'active']).only(['active'])])).toBe(true)
    expect(passes('pending', [new Enum(['pending', 'active']).only(['active'])])).toBe(false)
    expect(passes('pending', [new Enum(['pending', 'active']).except(['pending'])])).toBe(false)
    expect(passes('active', [new Enum({ A: 'active', P: 'pending' })])).toBe(true)
    const adminRule = new Enum(['a', 'b', 'c']).when(
      true,
      (r) => r.only(['a']),
      (r) => r.only(['b']),
    )
    expect(passes('a', [adminRule])).toBe(true)
    const nonAdmin = new Enum(['a', 'b']).when(
      false,
      (r) => r.only(['a']),
      (r) => r.only(['b']),
    )
    expect(passes('b', [nonAdmin])).toBe(true)
    expect(passes('a', [new Enum(['a']).when(false, (r) => r.only([]))])).toBe(true) // no else branch
  })
})

describe('database rules', () => {
  it('ExistsRule with where + resolver, and no-resolver pass', async () => {
    const captured = vi.fn((_q: unknown) => Promise.resolve(true))
    const v = Validator.make(
      { id: 1 },
      { id: [Rule.exists('users', 'uid').where('team', 2)] },
    ).withResolvers({ exists: captured })
    expect(await v.passesAsync()).toBe(true)
    expect(captured.mock.calls[0]?.[0]).toMatchObject({
      table: 'users',
      column: 'uid',
      wheres: [{ column: 'team', value: 2 }],
    })
    // No resolver → rule passes.
    expect(await Validator.make({ id: 1 }, { id: [Rule.exists('users')] }).passesAsync()).toBe(true)
  })

  it('UniqueRule ignore + withoutTrashed + resolver', async () => {
    const captured = vi.fn((_q: unknown) => Promise.resolve(true))
    const rule = Rule.unique('users').ignore(7, 'uid').withoutTrashed('removed_at')
    const v = Validator.make({ email: 'a@b.com' }, { email: [rule] }).withResolvers({
      unique: captured,
    })
    expect(await v.passesAsync()).toBe(true)
    expect(captured.mock.calls[0]?.[0]).toMatchObject({
      table: 'users',
      column: 'email',
      ignore: { id: 7, column: 'uid' },
      wheres: [{ column: 'removed_at', value: null }],
    })
    const fail = Validator.make({ email: 'x' }, { email: [Rule.unique('users')] }).withResolvers({
      unique: () => Promise.resolve(false),
    })
    expect(await fail.failsAsync()).toBe(true)
    expect(
      await Validator.make({ email: 'x' }, { email: [Rule.unique('users')] }).passesAsync(),
    ).toBe(true)
  })
})

describe('FileRule', () => {
  const file = (name: string, type = '', bytes = 1024): File =>
    new File(['x'.repeat(bytes)], name, { type })

  it('types / min / max / size / extensions / encoding', async () => {
    const ok = FileRule.types(['png']).min('1kb').max('10mb')
    expect(await Validator.make({ a: file('p.png') }, { a: [ok] }).passesAsync()).toBe(true)
    expect(
      await Validator.make({ a: 'not a file' }, { a: [FileRule.default()] }).failsAsync(),
    ).toBe(true)
    const tooSmall = FileRule.types(['png']).min('5kb')
    expect(
      await Validator.make({ a: file('p.png', '', 100) }, { a: [tooSmall] }).failsAsync(),
    ).toBe(true)
    const wrongType = FileRule.types(['csv'])
    expect(await Validator.make({ a: file('p.png') }, { a: [wrongType] }).failsAsync()).toBe(true)
    const sized = FileRule.default().size(1).extensions(['png']).encoding('utf-8')
    expect(await Validator.make({ a: file('p.png') }, { a: [sized] }).passesAsync()).toBe(true)
    // image() without dimensions exercises the image branch with no decode.
    expect(
      await Validator.make(
        { a: file('p.png', 'image/png') },
        { a: [FileRule.image()] },
      ).passesAsync(),
    ).toBe(true)
    expect(
      await Validator.make(
        { a: file('a.txt', 'text/plain') },
        { a: [FileRule.image()] },
      ).failsAsync(),
    ).toBe(true)
    const bigUnit = FileRule.default().max('1gb').min(0)
    expect(await Validator.make({ a: file('p.png') }, { a: [bigUnit] }).passesAsync()).toBe(true)
    const svg = FileRule.image({ allowSvg: true })
    expect(await Validator.make({ a: file('logo.svg') }, { a: [svg] }).passesAsync()).toBe(true)
  })
})

describe('AnyOf inherits resolvers', () => {
  it('passes when one ruleset matches', () => {
    expect(passes('a@b.com', ['required', new AnyOf([['email'], ['alpha_dash', 'min:6']])])).toBe(
      true,
    )
  })
})

describe('delegating adapter (direct)', () => {
  it('passes, fails, null validator, and async path', async () => {
    const fail = vi.fn<FailFn>()
    const sync = makeBuiltinRuleObject('in', ['a', 'b'])
    const v = Validator.make({ x: 'a' }, { x: 'string' })
    sync.setValidator(v)
    void sync.validate('x', 'a', fail)
    expect(fail).not.toHaveBeenCalled()
    void sync.validate('x', 'z', fail)
    expect(fail).toHaveBeenCalledOnce()

    // No validator set → no-op (returns undefined).
    const orphan = makeBuiltinRuleObject('in', ['a'])
    expect(orphan.validate('x', 'a', fail)).toBeUndefined()

    // Async builtin (unique) routed through the adapter.
    const failAsync = vi.fn<FailFn>()
    const asyncObj = makeBuiltinRuleObject('unique', ['users'])
    const av = Validator.make({ x: 'a' }, { x: 'string' }).withResolvers({
      unique: () => Promise.resolve(false),
    })
    asyncObj.setValidator(av)
    await asyncObj.validate('x', 'a', failAsync)
    expect(failAsync).toHaveBeenCalledOnce()
  })
})

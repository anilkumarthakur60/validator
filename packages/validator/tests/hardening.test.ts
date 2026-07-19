import { afterEach, describe, expect, it, vi } from 'vitest'
import { Validator } from '@/core/Validator'
import { registerRule } from '@/core/registry'
import { clearRuleParseCache, parseFieldRules } from '@/core/RuleParser'
import { Enum } from '@/ruleObjects/Enum'
import { Rule } from '@/ruleObjects/Rule'
import type { RulesSchema } from '@/types'

const ok = (value: unknown, rules: string): boolean =>
  Validator.make({ x: value }, { x: rules }).passes()

const firstError = (value: unknown, rules: string): string => {
  const v = Validator.make({ x: value }, { x: rules })
  v.passes()
  return v.errors().first('x')
}

describe('Validator.onMissingResolver', () => {
  afterEach(() => {
    Validator.onMissingResolver('pass')
    vi.restoreAllMocks()
  })

  it("defaults to 'pass': resolver-backed rules pass without a resolver", () => {
    expect(ok('a', 'exists:users')).toBe(true)
    expect(ok('a', 'unique:users')).toBe(true)
    expect(ok('secret', 'current_password')).toBe(true)
    expect(ok('https://example.com', 'active_url')).toBe(true)
  })

  it("'fail' makes each resolver-backed rule fail with its normal message", () => {
    Validator.onMissingResolver('fail')
    expect(firstError('a', 'exists:users')).toBe('The selected x is invalid.')
    expect(firstError('a', 'unique:users')).toBe('The x has already been taken.')
    expect(firstError('secret', 'current_password')).toBe('The password is incorrect.')
    expect(firstError('https://example.com', 'active_url')).toBe('The x field must be a valid URL.')
  })

  it("'throw' raises an error naming the rule and the missing resolver", () => {
    Validator.onMissingResolver('throw')
    expect(() => ok('a', 'exists:users')).toThrow(
      '[validation] No "exists" resolver is configured for the "exists" rule. ' +
        'Register one with Validator.setGlobalResolvers() or withResolvers().',
    )
    expect(() => ok('a', 'unique:users')).toThrow('No "unique" resolver')
    expect(() => ok('secret', 'current_password')).toThrow('No "currentPassword" resolver')
    expect(() => ok('https://example.com', 'active_url')).toThrow('No "activeUrl" resolver')
  })

  it('strict modes never fire when a resolver is configured', async () => {
    Validator.onMissingResolver('throw')
    const v = Validator.make({ x: 'a' }, { x: 'exists:users' }).withResolvers({
      exists: () => true,
    })
    await expect(v.passesAsync()).resolves.toBe(true)
  })
})

describe('timezone rule parameters', () => {
  it('accepts any Intl-recognized identifier for the bare and :all forms', () => {
    expect(ok('Asia/Kathmandu', 'timezone')).toBe(true)
    expect(ok('Asia/Kathmandu', 'timezone:all')).toBe(true)
    expect(ok('asia/kathmandu', 'timezone:ALL')).toBe(true)
    expect(ok('Not/AZone', 'timezone')).toBe(false)
    expect(ok(5, 'timezone')).toBe(false)
  })

  it('restricts identifiers to a region prefix, case-insensitively', () => {
    expect(ok('Africa/Cairo', 'timezone:Africa')).toBe(true)
    expect(ok('africa/cairo', 'timezone:africa')).toBe(true)
    expect(ok('Asia/Kathmandu', 'timezone:Africa')).toBe(false)
    expect(ok('UTC', 'timezone:Africa')).toBe(false)
    expect(ok('Africa/Nowhere', 'timezone:Africa')).toBe(false)
  })

  it('falls back to the Intl-constructor probe without supportedValuesOf', () => {
    const original = Intl.supportedValuesOf
    Reflect.deleteProperty(Intl, 'supportedValuesOf')
    try {
      expect(ok('America/New_York', 'timezone:America')).toBe(true)
      expect(ok('Europe/Paris', 'timezone:America')).toBe(false)
      expect(ok('Not/AZone', 'timezone:Not')).toBe(false)
    } finally {
      Reflect.set(Intl, 'supportedValuesOf', original)
    }
  })

  it('throws for the unsupported per_country variant', () => {
    expect(() => ok('Asia/Kathmandu', 'timezone:per_country,NP')).toThrow(
      '"timezone:per_country" is not supported',
    )
  })
})

describe('Enum.strict() and Rule.in().strict()', () => {
  it('Enum stays loose by default and exact under strict()', () => {
    const loose = Validator.make({ x: '1' }, { x: [new Enum([1, 2])] })
    expect(loose.passes()).toBe(true)

    const strict = Validator.make({ x: '1' }, { x: [new Enum([1, 2]).strict()] })
    expect(strict.passes()).toBe(false)
    expect(strict.errors().first('x')).toBe('The selected x is invalid.')

    expect(Validator.make({ x: 1 }, { x: [new Enum([1, 2]).strict()] }).passes()).toBe(true)
    expect(Validator.make({ x: '1' }, { x: [new Enum([1, 2]).strict(false)] }).passes()).toBe(true)
  })

  it('Rule.in stays loose by default and exact under strict()', () => {
    expect(Validator.make({ x: '1' }, { x: [Rule.in([1, 2])] }).passes()).toBe(true)

    const strict = Validator.make({ x: '1' }, { x: [Rule.in([1, 2]).strict()] })
    expect(strict.passes()).toBe(false)
    expect(strict.errors().first('x')).toBe('The selected x is invalid.')

    expect(Validator.make({ x: 2 }, { x: [Rule.in([1, 2]).strict()] }).passes()).toBe(true)
    expect(Validator.make({ x: '1' }, { x: [Rule.in([1, 2]).strict(false)] }).passes()).toBe(true)
  })

  it('Rule.notIn().strict() is the exact negation', () => {
    expect(Validator.make({ x: 1 }, { x: [Rule.notIn([1, 2]).strict()] }).passes()).toBe(false)
    expect(Validator.make({ x: '1' }, { x: [Rule.notIn([1, 2]).strict()] }).passes()).toBe(true)
  })

  it('strict Rule.in checks every element of an array-typed field', () => {
    const rules = (values: readonly unknown[]): RulesSchema => ({
      x: ['array', Rule.in(values).strict()],
    })
    expect(Validator.make({ x: [1, 2] }, rules([1, 2, 3])).passes()).toBe(true)
    expect(Validator.make({ x: [1, '2'] }, rules([1, 2, 3])).passes()).toBe(false)
    expect(Validator.make({ x: [1, [2]] }, rules([1, 2, 3])).passes()).toBe(false)
    // Without the `array` rule, an array value itself is never a member.
    expect(Validator.make({ x: [1] }, { x: [Rule.in([1]).strict()] }).passes()).toBe(false)
  })

  it('strict Rule.in outside the engine falls back to a generic message', async () => {
    let message = ''
    await Rule.in([1])
      .strict()
      .validate('x', 2, (m) => {
        message = m
      })
    expect(message).toBe('The selected :attribute is invalid.')
  })
})

describe('rule-parse caching', () => {
  it('returns the identical frozen parse for a repeated rule string', () => {
    clearRuleParseCache()
    const first = parseFieldRules('required|string|min:3|max:255')
    const second = parseFieldRules('required|string|min:3|max:255')
    expect(second).toBe(first)
    expect(Object.isFrozen(first)).toBe(true)
    expect(Object.isFrozen(first[0])).toBe(true)
    expect(first).toEqual([
      { kind: 'builtin', name: 'required', parameters: [], raw: 'required' },
      { kind: 'builtin', name: 'string', parameters: [], raw: 'string' },
      { kind: 'builtin', name: 'min', parameters: ['3'], raw: 'min:3' },
      { kind: 'builtin', name: 'max', parameters: ['255'], raw: 'max:255' },
    ])
  })

  it('never caches array/object/closure definitions', () => {
    const first = parseFieldRules(['required'])
    const second = parseFieldRules(['required'])
    expect(second).not.toBe(first)
  })

  it('is invalidated when registerRule mutates the registry', () => {
    clearRuleParseCache()
    const before = parseFieldRules('required|string')
    registerRule('hardening_cache_probe', { validate: () => true })
    const after = parseFieldRules('required|string')
    expect(after).not.toBe(before)
    expect(after).toEqual(before)
  })

  it('evicts the oldest entry once the capacity is reached (FIFO)', () => {
    clearRuleParseCache()
    const first = parseFieldRules('required|string|max:10')
    for (let index = 0; index < 500; index++) parseFieldRules(`min:${String(index)}`)
    // The very first entry was evicted, so re-parsing creates a new object...
    expect(parseFieldRules('required|string|max:10')).not.toBe(first)
    // ...while a late entry is still served from the cache.
    expect(parseFieldRules('min:499')).toBe(parseFieldRules('min:499'))
  })

  it('caching keeps full-engine validation results identical', () => {
    clearRuleParseCache()
    const make = (): Validator =>
      Validator.make(
        { name: 'Al', tags: ['a', 'b'] },
        { name: 'required|string|min:3|max:255', 'tags.*': 'required|string' },
      )
    const first = make()
    const second = make()
    expect(first.passes()).toBe(second.passes())
    expect(first.errors().first('name')).toBe(second.errors().first('name'))
  })
})

import { describe, expect, it, vi } from 'vitest'
import { Validator } from '@/core/Validator'
import { MessageBag } from '@/core/MessageBag'
import { Rule } from '@/ruleObjects/Rule'
import { Password } from '@/ruleObjects/Password'
import { StringRule } from '@/ruleObjects/StringRule'
import { EmailRule } from '@/ruleObjects/EmailRule'
import type { DataAwareRule, ValidationRuleObject, ValidatorAwareRule } from '@/types'

const passes = (value: unknown, rule: ValidationRuleObject): boolean =>
  Validator.make({ f: value }, { f: [rule] }).passes()

describe('Rule.string() fluent builder', () => {
  it('base string check', () => {
    expect(passes('hi', Rule.string())).toBe(true)
    expect(passes(123, Rule.string())).toBe(false)
  })
  it('every constraint method', () => {
    expect(passes('ab', Rule.string().min(3))).toBe(false)
    expect(passes('abcd', Rule.string().max(3))).toBe(false)
    expect(passes('a', Rule.string().between(2, 4))).toBe(false)
    expect(passes('abc', Rule.string().between(2, 4))).toBe(true)
    expect(passes('ab', Rule.string().exactly(3))).toBe(false)
    expect(passes('abc', Rule.string().exactly(3))).toBe(true)
    expect(passes('abc', Rule.string().alpha())).toBe(true)
    expect(passes('a1', Rule.string().alpha())).toBe(false)
    expect(passes('café', Rule.string().alpha(true))).toBe(false)
    expect(passes('a-1_b', Rule.string().alphaDash())).toBe(true)
    expect(passes('a-1_b', Rule.string().alphaDash(true))).toBe(true)
    expect(passes('ab12', Rule.string().alphaNumeric())).toBe(true)
    expect(passes('ab12', Rule.string().alphaNumeric(true))).toBe(true)
    expect(passes('abc', Rule.string().ascii())).toBe(true)
    expect(passes('abc', Rule.string().lowercase())).toBe(true)
    expect(passes('ABC', Rule.string().lowercase())).toBe(false)
    expect(passes('ABC', Rule.string().uppercase())).toBe(true)
    expect(passes('hello', Rule.string().startsWith('he'))).toBe(true)
    expect(passes('hello', Rule.string().endsWith('lo'))).toBe(true)
    expect(passes('hello', Rule.string().doesntStartWith('x'))).toBe(true)
    expect(passes('hello', Rule.string().doesntEndWith('z'))).toBe(true)
  })
  it('when / unless conditionable', () => {
    expect(
      passes(
        'ab',
        Rule.string().when(true, (r) => r.min(5)),
      ),
    ).toBe(false)
    expect(
      passes(
        'ab',
        Rule.string().when(false, (r) => r.min(5)),
      ),
    ).toBe(true)
    expect(
      passes(
        'ab',
        Rule.string().when(
          false,
          (r) => r.min(5),
          (r) => r.max(1),
        ),
      ),
    ).toBe(false)
    expect(
      passes(
        'ab',
        Rule.string().unless(false, (r) => r.min(5)),
      ),
    ).toBe(false)
    expect(
      passes(
        'ab',
        Rule.string().unless(
          true,
          (r) => r.min(5),
          (r) => r.max(1),
        ),
      ),
    ).toBe(false)
  })
  it('no-op without a validator', () => {
    const fail = vi.fn()
    new StringRule().validate('f', 'x', fail)
    expect(fail).not.toHaveBeenCalled()
  })
})

describe('Rule.date() fluent builder', () => {
  it('every method', () => {
    expect(passes('2024-01-01', Rule.date())).toBe(true)
    expect(passes('nope', Rule.date())).toBe(false)
    expect(passes('2024-01-31', Rule.date().format('Y-m-d'))).toBe(true)
    expect(passes('2020-01-01', Rule.date().after('2019-01-01'))).toBe(true)
    expect(passes('2020-01-01', Rule.date().before('2021-01-01'))).toBe(true)
    expect(passes('2020-01-01', Rule.date().afterOrEqual('2020-01-01'))).toBe(true)
    expect(passes('2020-01-01', Rule.date().beforeOrEqual('2020-01-01'))).toBe(true)
    expect(passes('3000-01-01', Rule.date().afterToday())).toBe(true)
    expect(passes('1900-01-01', Rule.date().beforeToday())).toBe(true)
    expect(passes('3000-01-01', Rule.date().todayOrAfter())).toBe(true)
    expect(passes('1900-01-01', Rule.date().todayOrBefore())).toBe(true)
    expect(passes('3000-01-01', Rule.date().beforeToday())).toBe(false)
  })
})

describe('Rule.email() fluent builder', () => {
  it('styles', () => {
    expect(passes('a@b.com', Rule.email())).toBe(true)
    expect(passes('nope', Rule.email())).toBe(false)
    expect(passes('a@b.com', Rule.email().rfcCompliant())).toBe(true)
    expect(passes('a@b.com', Rule.email().rfcCompliant(true))).toBe(true)
    expect(passes('a..b@c.com', Rule.email().strict())).toBe(false)
    expect(passes('a@b.com', Rule.email().validateMxRecord())).toBe(true)
    expect(passes('а@b.com', Rule.email().preventSpoofing())).toBe(false) // Cyrillic
    expect(passes('a@b.com', Rule.email().withNativeValidation())).toBe(true)
    expect(passes('a@b.com', Rule.email().withNativeValidation(true))).toBe(true)
  })
  it('no-op without a validator', () => {
    const fail = vi.fn()
    new EmailRule().validate('f', 'a@b.com', fail)
    expect(fail).not.toHaveBeenCalled()
  })
})

describe(':input placeholder', () => {
  it('is replaced with the current value', () => {
    const v = Validator.make(
      { age: 200 },
      { age: 'numeric|max:100' },
      { 'age.max': 'The :attribute value :input is too large.' },
    )
    v.passes()
    expect(v.errors().first('age')).toBe('The age value 200 is too large.')
  })
})

describe('after()  array + invokable', () => {
  it('accepts an array of callbacks and invokable objects', () => {
    const v = Validator.make({ x: 1 }, { x: 'integer' })
    v.after([
      (validator) => {
        validator.errors().add('x', 'from-callback')
      },
      {
        __invoke: (validator) => {
          validator.errors().add('x', 'from-invokable')
        },
      },
    ])
    v.passes()
    expect(v.errors().get('x')).toEqual(['from-callback', 'from-invokable'])
  })
})

describe('MessageBag  any / hasAny / missing', () => {
  it('works', () => {
    const bag = new MessageBag({ a: ['x'] })
    expect(bag.any()).toBe(true)
    expect(new MessageBag().any()).toBe(false)
    expect(bag.hasAny(['a', 'b'])).toBe(true)
    expect(bag.hasAny(['b', 'c'])).toBe(false)
    expect(bag.missing('b')).toBe(true)
    expect(bag.missing('a')).toBe(false)
  })
})

describe('Password.rules()  extra rules', () => {
  it('runs closure, plain object, data/validator-aware, and async extras', async () => {
    const closure = Validator.make(
      { p: 'abcdefgh' },
      {
        p: [
          Password.min(8).rules((_a, value, fail) => {
            if (value === 'abcdefgh') fail('blacklisted')
          }),
        ],
      },
    )
    expect(await closure.failsAsync()).toBe(true)
    expect(closure.errors().first('p')).toBe('blacklisted')

    let gotData = false
    let gotValidator = false
    const aware: ValidationRuleObject & DataAwareRule & ValidatorAwareRule = {
      setData: () => {
        gotData = true
      },
      setValidator: () => {
        gotValidator = true
      },
      validate: (_a, _v, fail) => {
        fail('aware fail')
      },
    }
    const plain: ValidationRuleObject = {
      validate: (_a, _v, fail) => {
        fail('plain fail')
      },
    }
    const v2 = Validator.make({ p: 'abcdefgh' }, { p: [Password.min(8).rules([aware, plain])] })
    expect(await v2.failsAsync()).toBe(true)
    expect(gotData).toBe(true)
    expect(gotValidator).toBe(true)
    expect(v2.errors().get('p')).toEqual(['aware fail', 'plain fail'])

    const asyncExtra = Validator.make(
      { p: 'abcdefgh' },
      {
        p: [
          Password.min(8).rules((_a, _v, fail) =>
            Promise.resolve().then(() => {
              fail('async')
            }),
          ),
        ],
      },
    )
    expect(await asyncExtra.failsAsync()).toBe(true)
    expect(asyncExtra.errors().first('p')).toBe('async')
  })

  it('runs an extra object rule even without a validator (no injection)', () => {
    const fail = vi.fn()
    const extra: ValidationRuleObject = {
      validate: (_a, _v, f) => {
        f('direct')
      },
    }
    void Password.min(8).rules([extra]).validate('p', 'abcdefgh', fail)
    expect(fail).toHaveBeenCalledWith('direct')
  })
})

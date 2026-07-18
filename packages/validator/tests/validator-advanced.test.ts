import { afterEach, describe, expect, it, vi } from 'vitest'
import { Validator } from '@/core/Validator'
import { ValidationException } from '@/core/ValidationException'
import type { DataAwareRule, ValidationRuleObject, ValidatorAwareRule } from '@/types'

describe('Validator — size type resolution (value-based)', () => {
  it('picks the message wording from the value type when no type rule is present', () => {
    // A bare number is sized as a string (Laravel parity): only a numeric-type
    // rule switches the field to numeric sizing and wording.
    const numeric = Validator.make({ f: 5 }, { f: 'numeric|max:3' })
    numeric.passes()
    expect(numeric.errors().first('f')).toBe('The f field must not be greater than 3.')

    const arr = Validator.make({ f: [1, 2, 3, 4] }, { f: 'max:3' })
    arr.passes()
    expect(arr.errors().first('f')).toBe('The f field must not have more than 3 items.')

    const fileV = Validator.make({ f: new File(['x'], 'a') }, { f: 'max:0' })
    fileV.passes()
    expect(fileV.errors().first('f')).toBe('The f field must not be greater than 0 kilobytes.')

    const str = Validator.make({ f: 'abcd' }, { f: 'max:3' })
    str.passes()
    expect(str.errors().first('f')).toBe('The f field must not be greater than 3 characters.')
  })
})

describe('Validator — display helpers (public)', () => {
  it('getDisplayableValue', () => {
    const v = Validator.make({}, {}).setValueMap({ k: { x: 'X' } })
    expect(v.getDisplayableValue('k', 'x')).toBe('X')
    expect(v.getDisplayableValue('k', 'unmapped')).toBe('unmapped')
    expect(v.getDisplayableValue('k', true)).toBe('true')
    expect(v.getDisplayableValue('k', null)).toBe('empty')
    expect(v.getDisplayableValue('k', { a: 1 })).toBe('{"a":1}')
    expect(v.getDisplayableValue('other', 'plain')).toBe('plain')
  })
  it('getDisplayableAttribute', () => {
    const v = Validator.make({}, {}).setAttributeNames({
      email: 'email address',
      'users.*.email': 'user email',
    })
    expect(v.getDisplayableAttribute('email')).toBe('email address')
    expect(v.getDisplayableAttribute('users.0.email')).toBe('user email')
    expect(v.getDisplayableAttribute('first_name')).toBe('first name')
  })
  it('hasRule / resolveWildcardValues / getValue / getData', () => {
    const v = Validator.make({ f: 1, p: ['a', 'b'] }, { f: 'integer' })
    v.passes()
    expect(v.hasRule('f', 'integer')).toBe(true)
    expect(v.hasRule('f', 'email')).toBe(false)
    expect(v.hasRule('missing', 'x')).toBe(false)
    expect(v.getSizeType('nonexistent')).toBe('string') // entry not found → value-based
    expect(v.resolveWildcardValues('p.*')).toEqual(['a', 'b'])
    expect(v.getValue('p.0')).toBe('a')
    expect(v.getData()).toEqual({ f: 1, p: ['a', 'b'] })
  })
})

describe('Validator — message placeholders', () => {
  it(':value uses the other field value (mapped + boolean)', () => {
    const mapped = Validator.make({ pt: 'cc', cc: '' }, { cc: 'required_if:pt,cc' }).setValueMap({
      pt: { cc: 'credit card' },
    })
    mapped.passes()
    expect(mapped.errors().first('cc')).toBe('The cc field is required when pt is credit card.')
    const bool = Validator.make({ flag: true, x: '' }, { x: 'required_if:flag,true' })
    bool.passes()
    expect(bool.errors().first('x')).toBe('The x field is required when flag is true.')
  })

  it(':position / :ordinal-position / :index', () => {
    const items = Array.from({ length: 21 }, () => ({ x: '' }))
    const v = Validator.make(
      { items },
      { 'items.*.x': 'required' },
      { 'items.*.x.required': 'pos :position ord :ordinal-position idx :index' },
    )
    v.passes()
    expect(v.errors().first('items.0.x')).toBe('pos 1 ord 1st idx 0')
    expect(v.errors().first('items.1.x')).toBe('pos 2 ord 2nd idx 1')
    expect(v.errors().first('items.2.x')).toBe('pos 3 ord 3rd idx 2')
    expect(v.errors().first('items.3.x')).toBe('pos 4 ord 4th idx 3')
    expect(v.errors().first('items.10.x')).toBe('pos 11 ord 11th idx 10')
    expect(v.errors().first('items.20.x')).toBe('pos 21 ord 21st idx 20')
  })

  it('second-index / second-position (nested wildcards)', () => {
    const v = Validator.make(
      { a: [{ b: [{ c: 'ok' }, { c: '' }] }] },
      { 'a.*.b.*.c': 'required' },
      { 'a.*.b.*.c.required': 'first :index second :second-index pos :second-position' },
    )
    v.passes()
    expect(v.errors().first('a.0.b.1.c')).toBe('first 0 second 1 pos 2')
  })
})

describe('Validator — exclusion variants', () => {
  it('exclude / exclude_with / exclude_without / exclude_unless / exclude_if(no value)', () => {
    expect(Validator.make({ f: 'bad' }, { f: 'exclude|integer' }).passes()).toBe(true)
    expect(Validator.make({ f: 'bad', o: 1 }, { f: 'exclude_with:o|integer' }).passes()).toBe(true)
    expect(Validator.make({ f: 'bad' }, { f: 'exclude_without:o|integer' }).passes()).toBe(true)
    expect(Validator.make({ f: 'bad', o: 2 }, { f: 'exclude_unless:o,1|integer' }).passes()).toBe(
      true,
    )
    // exclude_if with no comparison value → never excludes.
    expect(Validator.make({ f: 'bad', o: 1 }, { f: 'exclude_if:o|integer' }).fails()).toBe(true)
  })
})

describe('Validator — async paths & rule objects', () => {
  it('validate() / validateAsync() return and throw', async () => {
    expect(Validator.make({ a: 'x' }, { a: 'required' }).validate()).toEqual({ a: 'x' })
    expect(() => Validator.make({}, { a: 'required' }).validate()).toThrow(ValidationException)
    await expect(Validator.make({ a: 'x' }, { a: 'required' }).validateAsync()).resolves.toEqual({
      a: 'x',
    })
    await expect(Validator.make({}, { a: 'required' }).validateAsync()).rejects.toBeInstanceOf(
      ValidationException,
    )
  })

  it('async closure + async object rules', async () => {
    const closure = Validator.make(
      { f: 'x' },
      {
        f: [
          async (_a: string, _v: unknown, fail: (m: string) => void): Promise<void> => {
            await Promise.resolve()
            fail('async closure')
          },
        ],
      },
    )
    expect(await closure.failsAsync()).toBe(true)
    expect(() => closure.passes()).toThrow(/asynchronous/)

    const obj: ValidationRuleObject = {
      validate: (_a, _v, fail) =>
        Promise.resolve().then(() => {
          fail('async object')
        }),
    }
    expect(await Validator.make({ f: 'x' }, { f: [obj] }).failsAsync()).toBe(true)
  })

  it('object rule implicit vs empty skipping', () => {
    const ran = vi.fn()
    const lazy: ValidationRuleObject = {
      validate: (_a, _v, fail) => {
        ran()
        fail('should be skipped')
      },
    }
    expect(Validator.make({ f: '' }, { f: [lazy] }).passes()).toBe(true)
    expect(ran).not.toHaveBeenCalled()

    const eager: ValidationRuleObject = {
      implicit: true,
      validate: (_a, _v, fail) => {
        fail('runs on empty')
      },
    }
    expect(Validator.make({ f: '' }, { f: [eager] }).fails()).toBe(true)
  })

  it('DataAware + ValidatorAware injection', () => {
    let data: Record<string, unknown> | null = null
    let gotValidator = false
    const rule: ValidationRuleObject & DataAwareRule & ValidatorAwareRule = {
      setData: (d) => {
        data = d
      },
      setValidator: () => {
        gotValidator = true
      },
      validate: () => undefined,
    }
    Validator.make({ a: 1 }, { a: [rule] }).passes()
    expect(data).toEqual({ a: 1 })
    expect(gotValidator).toBe(true)
  })

  it('formats :attribute in closure/object messages', () => {
    const v = Validator.make(
      { email: 'x' },
      {
        email: [
          (_a: string, _v: unknown, fail: (m: string) => void) => {
            fail('The :attribute is bad.')
          },
        ],
      },
    )
    v.passes()
    expect(v.errors().first('email')).toBe('The email is bad.')
  })
})

describe('Validator — sometimes(), after(), wildcard dependent params', () => {
  it('sometimes() with array items', () => {
    const data = {
      channels: [
        { type: 'email', address: 'bad' },
        { type: 'url', address: 'https://x.com' },
      ],
    }
    const v = Validator.make(data, { 'channels.*.type': 'required' })
    v.sometimes('channels.*.address', 'email', (_input, item) => {
      return (item as { type?: string }).type === 'email'
    })
    v.passes()
    expect(v.errors().has('channels.0.address')).toBe(true)
    expect(v.errors().has('channels.1.address')).toBe(false)
  })

  it('after() async callback', async () => {
    const v = Validator.make({ a: 1 }, { a: 'integer' })
    v.after(async (validator) => {
      await Promise.resolve()
      validator.errors().add('a', 'late error')
    })
    await v.passesAsync()
    expect(v.errors().first('a')).toBe('late error')
  })

  it('substitutes * in dependent rule parameters', () => {
    const same = Validator.make({ rows: [{ a: 1, b: 1 }] }, { 'rows.*.a': 'same:rows.*.b' })
    expect(same.passes()).toBe(true)
    const diff = Validator.make({ rows: [{ a: 1, b: 2 }] }, { 'rows.*.a': 'same:rows.*.b' })
    expect(diff.fails()).toBe(true)
  })

  it('safe() / messages() alias / validated() omits absent attributes', () => {
    const v = Validator.make({ a: 1, b: 2 }, { a: 'integer', b: 'integer' })
    v.passes()
    expect(v.safe().only(['a'])).toEqual({ a: 1 })
    expect(v.messages()).toBe(v.errors())
    // `c` has a (non-implicit) rule but is absent → excluded from validated().
    const absent = Validator.make({ a: 1 }, { a: 'integer', c: 'email' })
    absent.passes()
    expect(absent.validated()).toEqual({ a: 1 })
  })

  it('sometimes() accepts an array of attributes', () => {
    const v = Validator.make({ games: 150 }, { games: 'integer' })
    v.sometimes(['reason', 'cost'], 'required', (data) => Number(data['games']) >= 100)
    v.passes()
    expect(v.errors().has('reason')).toBe(true)
    expect(v.errors().has('cost')).toBe(true)
  })
})

describe('Validator — global resolvers + config setters', () => {
  afterEach(() => {
    Validator.setGlobalResolvers({})
  })
  it('setGlobalResolvers is inherited', async () => {
    Validator.setGlobalResolvers({ unique: () => Promise.resolve(false) })
    const v = Validator.make({ e: 'a' }, { e: 'unique:users' })
    expect(await v.failsAsync()).toBe(true)
  })
  it('setCustomMessages + stopOnFirstFailure(false)', () => {
    const v = Validator.make({ a: '' }, { a: 'required' }).setCustomMessages({
      required: 'Need :attribute',
    })
    v.stopOnFirstFailure(false).passes()
    expect(v.errors().first('a')).toBe('Need a')
  })
})

import { describe, expect, it } from 'vitest'
import {
  dotGet,
  dotHas,
  dotSet,
  expandWildcards,
  flattenKeys,
  replaceWildcardParameter,
  splitPath,
} from '@/core/data'
import { MessageBag } from '@/core/MessageBag'
import { ValidatedInput } from '@/core/ValidatedInput'
import { ValidationException } from '@/core/ValidationException'
import { Validator } from '@/core/Validator'
import { defaultMessages, formatMessage, FALLBACK_MESSAGE } from '@/messages'
import { parseFieldRules, normalizeRuleName } from '@/core/RuleParser'
import { getBuiltinRule, hasBuiltinRule, registerRule } from '@/core/registry'

describe('data — dot access', () => {
  const data = { a: { b: [{ c: 1 }, { c: 2 }] }, 'v1.0': 'x', n: null }
  it('splitPath honors escaped dots', () => {
    expect(splitPath('a.b')).toEqual(['a', 'b'])
    expect(splitPath('v1\\.0')).toEqual(['v1.0'])
  })
  it('dotGet', () => {
    expect(dotGet(data, 'a.b.0.c')).toBe(1)
    expect(dotGet(data, 'a.b.5.c')).toBeUndefined()
    expect(dotGet(data, 'v1\\.0')).toBe('x')
    expect(dotGet(data, 'a.b.x')).toBeUndefined()
    expect(dotGet(data, 'n.deep')).toBeUndefined()
    expect(dotGet({ a: 'str' }, 'a.0')).toBeUndefined()
  })
  it('dotHas', () => {
    expect(dotHas(data, 'a.b.1.c')).toBe(true)
    expect(dotHas(data, 'a.b.9')).toBe(false)
    expect(dotHas(data, 'n')).toBe(true)
    expect(dotHas(data, 'a.z')).toBe(false)
    expect(dotHas({ a: 'str' }, 'a.b')).toBe(false)
  })
  it('dotSet creates nested arrays and objects immutably', () => {
    const out = dotSet({}, 'a.b.0.c', 7)
    expect(dotGet(out, 'a.b.0.c')).toBe(7)
    expect(Array.isArray((out as { a: { b: unknown } }).a.b)).toBe(true)
    const merged = dotSet({ a: { keep: 1 } }, 'a.added', 2)
    expect(merged).toEqual({ a: { keep: 1, added: 2 } })
  })
})

describe('data — wildcards', () => {
  it('expands arrays and objects', () => {
    const data = { users: [{ e: 'a' }, { e: 'b' }], cfg: { x: 1, y: 2 } }
    expect(expandWildcards(data, 'users.*.e').map((x) => x.attribute)).toEqual([
      'users.0.e',
      'users.1.e',
    ])
    expect(expandWildcards(data, 'cfg.*').map((x) => x.attribute)).toEqual(['cfg.x', 'cfg.y'])
    // literal path that is absent still yields one entry
    expect(expandWildcards(data, 'missing').map((x) => x.attribute)).toEqual(['missing'])
    // wildcard over a non-traversable value yields nothing
    expect(expandWildcards({ a: 5 }, 'a.*')).toEqual([])
  })
  it('replaceWildcardParameter', () => {
    expect(replaceWildcardParameter('users.*.name', ['0'])).toBe('users.0.name')
    expect(replaceWildcardParameter('plain', ['0'])).toBe('plain')
    expect(replaceWildcardParameter('a.*.b.*', ['1'])).toBe('a.1.b.*')
  })
  it('flattenKeys', () => {
    expect(flattenKeys({ a: 1, b: { c: 2 }, d: [3, 4] }).sort()).toEqual(
      ['a', 'b.c', 'd.0', 'd.1'].sort(),
    )
    expect(flattenKeys({ empty: [], obj: {} })).toEqual(['empty', 'obj'])
  })
})

describe('MessageBag', () => {
  it('add/has/first/get/all/keys/messages/count', () => {
    const bag = new MessageBag()
    bag.add('a', 'one').add('a', 'one').add('a', 'two').add('b', 'three')
    expect(bag.get('a')).toEqual(['one', 'two']) // deduped
    expect(bag.first()).toBe('one')
    expect(bag.first('b')).toBe('three')
    expect(bag.first('missing')).toBe('')
    expect(bag.has('a')).toBe(true)
    expect(bag.has()).toBe(true)
    expect(bag.all()).toEqual(['one', 'two', 'three'])
    expect(bag.keys()).toEqual(['a', 'b'])
    expect(bag.count()).toBe(3)
    expect(bag.isEmpty()).toBe(false)
    expect(bag.isNotEmpty()).toBe(true)
    expect(bag.toArray()).toEqual({ a: ['one', 'two'], b: ['three'] })
  })
  it('empty bag first()', () => {
    expect(new MessageBag().first()).toBe('')
    expect(new MessageBag().isEmpty()).toBe(true)
  })
  it('first() skips keys whose message list is empty', () => {
    expect(new MessageBag({ empty: [], a: ['x'] }).first()).toBe('x')
  })
  it('wildcard get', () => {
    const bag = new MessageBag({ 'u.0.e': ['x'], 'u.1.e': ['y'], other: ['z'] })
    expect(bag.get('u.*.e')).toEqual(['x', 'y'])
    expect(bag.has('u.*.e')).toBe(true)
  })
  it('merge from bag and record', () => {
    const a = new MessageBag({ x: ['1'] })
    a.merge(new MessageBag({ x: ['2'], y: ['3'] }))
    a.merge({ z: ['4'] })
    expect(a.messages()).toEqual({ x: ['1', '2'], y: ['3'], z: ['4'] })
  })
})

describe('ValidatedInput', () => {
  const input = new ValidatedInput({ a: 1, b: { c: 2 }, d: 3 })
  it('all/only/except/has/get/merge/iterate', () => {
    expect(input.all()).toEqual({ a: 1, b: { c: 2 }, d: 3 })
    expect(input.only(['a', 'b.c'])).toEqual({ a: 1, b: { c: 2 } })
    expect(input.only(['missing'])).toEqual({})
    expect(input.except(['a', 'd'])).toEqual({ b: { c: 2 } })
    expect(input.has('b.c')).toBe(true)
    expect(input.has('z')).toBe(false)
    expect(input.get('a')).toBe(1)
    expect(input.get('z', 'fallback')).toBe('fallback')
    expect(input.merge({ e: 4 }).all()).toMatchObject({ a: 1, e: 4 })
    expect([...input].length).toBe(3)
  })
})

describe('ValidationException', () => {
  it('summarizes single and multiple errors', () => {
    const single = Validator.make({}, { a: 'required' })
    single.passes()
    expect(new ValidationException(single).message).toBe('The a field is required.')

    const multi = Validator.make({}, { a: 'required', b: 'required', c: 'required' })
    multi.passes()
    const ex = new ValidationException(multi)
    expect(ex.message).toMatch(/\(and 2 more errors\)$/)
    expect(ex.status).toBe(422)
    expect(ex.errorBag).toBe('default')
    expect(Object.keys(ex.errors())).toContain('a')

    const empty = Validator.make({ a: 1 }, { a: 'integer' })
    empty.passes()
    expect(new ValidationException(empty).message).toBe('The given data was invalid.')

    const two = Validator.make({}, { a: 'required', b: 'required' })
    two.passes()
    expect(new ValidationException(two).message).toMatch(/\(and 1 more error\)$/)
  })
})

describe('messages', () => {
  it('formatMessage handles lower/Capital/UPPER placeholders', () => {
    expect(formatMessage('The :attribute field', { attribute: 'name' })).toBe('The name field')
    expect(formatMessage(':Attribute is set', { attribute: 'name' })).toBe('Name is set')
    expect(formatMessage(':ATTRIBUTE', { attribute: 'name' })).toBe('NAME')
  })
  it('defaults exist and fallback defined', () => {
    expect(defaultMessages['required']).toBeTypeOf('string')
    expect(typeof defaultMessages['min']).toBe('object')
    expect(FALLBACK_MESSAGE).toContain(':attribute')
  })
})

describe('RuleParser', () => {
  it('normalizeRuleName', () => {
    expect(normalizeRuleName('requiredIf')).toBe('required_if')
    expect(normalizeRuleName('MAX')).toBe('max')
  })
  it('parses string, array, regex, single object, closure', () => {
    expect(parseFieldRules('required|max:255')).toHaveLength(2)
    expect(parseFieldRules('regex:/a,b/i')[0]).toMatchObject({
      name: 'regex',
      parameters: ['/a,b/i'],
    })
    expect(parseFieldRules(['required'])).toHaveLength(1)
    const closure = parseFieldRules(() => undefined)
    expect(closure[0]?.kind).toBe('closure')
    const obj = parseFieldRules({ validate: () => undefined })
    expect(obj[0]?.kind).toBe('object')
    expect(parseFieldRules('')).toEqual([])
    expect(parseFieldRules('between:1,5')[0]).toMatchObject({ parameters: ['1', '5'] })
  })
  it('throws on unsupported entry', () => {
    expect(() => parseFieldRules([42 as unknown as string & object])).toThrow()
  })
})

describe('registry', () => {
  it('lookup + register', () => {
    expect(hasBuiltinRule('required')).toBe(true)
    expect(getBuiltinRule('does_not_exist')).toBeUndefined()
    registerRule('always_true', { validate: () => true })
    expect(hasBuiltinRule('always_true')).toBe(true)
    expect(Validator.make({ x: 1 }, { x: 'always_true' }).passes()).toBe(true)
  })
})

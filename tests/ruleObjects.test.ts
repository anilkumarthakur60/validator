import { describe, expect, it, vi } from 'vitest'
import { Validator } from '@/lib/core/Validator'
import { Rule } from '@/lib/ruleObjects/Rule'
import { Password } from '@/lib/ruleObjects/Password'
import type { DataAwareRule, ValidationRuleObject } from '@/lib/types'

describe('Rule facade', () => {
  it('Rule.in / notIn', () => {
    expect(Validator.make({ x: 'a' }, { x: [Rule.in(['a', 'b'])] }).passes()).toBe(true)
    expect(Validator.make({ x: 'z' }, { x: [Rule.in(['a', 'b'])] }).passes()).toBe(false)
  })

  it('Rule.enum with only/except', () => {
    const v = Validator.make({ s: 'pending' }, { s: [Rule.enum(['pending', 'active']).only(['active'])] })
    expect(v.fails()).toBe(true)
  })

  it('Rule.requiredIf with closure', () => {
    let admin = true
    const rules = { role: [Rule.requiredIf(() => admin)] }
    expect(Validator.make({}, rules).fails()).toBe(true)
    admin = false
    expect(Validator.make({}, rules).passes()).toBe(true)
  })

  it('Rule.anyOf', () => {
    const rules = { username: ['required', Rule.anyOf([['string', 'email'], ['string', 'alpha_dash', 'min:6']])] }
    expect(Validator.make({ username: 'a@b.com' }, rules).passes()).toBe(true)
    expect(Validator.make({ username: 'longdash' }, rules).passes()).toBe(true)
    expect(Validator.make({ username: 'no' }, rules).fails()).toBe(true)
  })

  it('Rule.forEach yields per-element rules', () => {
    const v = Validator.make(
      { rows: [{ id: 5 }, { id: -1 }] },
      { 'rows.*.id': Rule.forEach(() => ['integer', 'min:0']) },
    )
    expect(v.fails()).toBe(true)
    expect(v.errors().has('rows.1.id')).toBe(true)
    expect(v.errors().has('rows.0.id')).toBe(false)
  })

  it('Rule.exists uses the resolver', async () => {
    const exists = vi.fn(async (_query: unknown) => true)
    const v = Validator.make({ id: 7 }, { id: [Rule.exists('users').where('active', true)] }).withResolvers({
      exists,
    })
    expect(await v.passesAsync()).toBe(true)
    expect(exists).toHaveBeenCalledOnce()
    const query = exists.mock.calls[0]?.[0]
    expect(query).toMatchObject({ table: 'users', column: 'id' })
  })
})

describe('Password rule object', () => {
  it('enforces complexity (sync portions)', async () => {
    const weak = Validator.make({ password: 'abc' }, { password: [Password.min(8).letters().numbers()] })
    expect(await weak.failsAsync()).toBe(true)
    const strong = Validator.make(
      { password: 'abcdefg9' },
      { password: [Password.min(8).letters().numbers()] },
    )
    expect(await strong.passesAsync()).toBe(true)
  })

  it('uncompromised uses the resolver', async () => {
    const v = Validator.make({ password: 'password123' }, {
      password: [Password.min(8).uncompromised()],
    }).withResolvers({ compromised: async () => 42 })
    expect(await v.failsAsync()).toBe(true)
    expect(v.errors().first('password')).toMatch(/data leak/)
  })
})

describe('Custom rule objects (closures + contracts)', () => {
  it('runs closure rules', () => {
    const v = Validator.make({ title: 'foo' }, {
      title: ['required', (_a, value, fail): void => {
        if (value === 'foo') fail('The :attribute is invalid.')
      }],
    })
    expect(v.fails()).toBe(true)
    expect(v.errors().first('title')).toBe('The title is invalid.')
  })

  it('injects data into DataAwareRule', () => {
    let received: Record<string, unknown> | null = null
    const rule: ValidationRuleObject & DataAwareRule = {
      setData(data: Record<string, unknown>): void {
        received = data
      },
      validate(): void {},
    }
    const v = Validator.make({ a: 1, b: 2 }, { a: [rule] })
    v.passes()
    expect(received).toEqual({ a: 1, b: 2 })
  })
})

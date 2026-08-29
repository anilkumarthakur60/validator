import { describe, expect, it } from 'vitest'
import { Validator } from '@/core/Validator'
import type { InferRules } from '@/infer'

/**
 * These tests exercise compile-time inference: the property accesses below only
 * type-check if `validated()`/`safe()` return the inferred shape (the strict
 * `tsc --noEmit` in CI enforces it), and the runtime assertions confirm values.
 */

describe('InferRules  typed validated() output', () => {
  it('infers scalar, nullable, optional, nested and wildcard fields', () => {
    // Inputs conform to each rule's intended type (the engine validates but
    // does not coerce  so a numeric field fed a string stays a string).
    const data = Validator.make(
      {
        title: 'Hello',
        count: 5,
        active: true,
        author: { name: 'Ada' },
        users: [{ email: 'a@b.com' }, { email: 'c@d.com' }],
        note: 'hi',
      },
      {
        title: 'required|string|max:255',
        count: 'required|integer',
        active: 'required|boolean',
        'author.name': 'required|string',
        'users.*.email': 'required|email',
        note: 'nullable|string',
      },
    ).validate()

    // ── compile-time: these only type-check when inference works ──
    const title: string = data.title
    const count: number = data.count
    const active: boolean = data.active
    const authorName: string = data.author.name
    const firstEmail: string | undefined = data.users[0]?.email
    const note: string | null | undefined = data.note

    // ── runtime ──
    expect(title).toBe('Hello')
    expect(count).toBe(5)
    expect(active).toBe(true)
    expect(authorName).toBe('Ada')
    expect(firstEmail).toBe('a@b.com')
    expect(note).toBe('hi')
    expect(data.users).toHaveLength(2)
  })

  it('treats fields without `required` as optional', () => {
    const data = Validator.make(
      { name: 'Ada' },
      { name: 'required|string', nickname: 'string' },
    ).validate()

    // `nickname` is optional → key may be absent.
    const nickname: string | undefined = data.nickname
    expect(data.name).toBe('Ada')
    expect(nickname).toBeUndefined()
  })

  it('infers a string-literal union from an in: rule', () => {
    const data = Validator.make(
      { status: 'active', level: 2, mode: null },
      {
        status: 'required|in:active,inactive',
        level: 'required|integer|in:1,2',
        mode: ['nullable', 'in:dark,light'],
      },
    ).validate()

    // ── compile-time ──
    const status: 'active' | 'inactive' = data.status
    // A numeric-type rule takes precedence over the literal union.
    const level: number = data.level
    // Array-syntax definitions and `nullable` compose with the union.
    const mode: 'dark' | 'light' | null | undefined = data.mode

    // ── runtime ──
    expect(status).toBe('active')
    expect(level).toBe(2)
    expect(mode).toBeNull()
  })

  it('falls back to ValidationData for a non-literal schema', () => {
    const schema: Record<string, string> = { a: 'required|string' }
    const v = Validator.make({ a: 'x' }, schema)
    type T = InferRules<typeof schema>
    // T resolves to ValidationData (Record<string, unknown>); index access is allowed.
    const validated: T = v.validate()
    expect(validated['a']).toBe('x')
  })

  it('safe().all() is typed too', () => {
    const all = Validator.make({ code: 'AB12' }, { code: 'required|string' }).safe().all()
    const code: string = all.code
    expect(code).toBe('AB12')
  })
})

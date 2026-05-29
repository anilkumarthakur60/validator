import { describe, expect, it, vi } from 'vitest'
import { Validator } from '@/lib/core/Validator'
import { ValidationException } from '@/lib/core/ValidationException'

describe('Validator — basics', () => {
  it('passes valid data and exposes validated()', () => {
    const v = Validator.make(
      { title: 'Hello', body: 'World', extra: 'drop' },
      { title: 'required|string|max:255', body: ['required'] },
    )
    expect(v.passes()).toBe(true)
    expect(v.validated()).toEqual({ title: 'Hello', body: 'World' })
  })

  it('collects failures with Laravel-style messages', () => {
    const v = Validator.make({ title: '' }, { title: 'required', body: 'required' })
    expect(v.fails()).toBe(true)
    expect(v.errors().first('title')).toBe('The title field is required.')
    expect(v.errors().first('body')).toBe('The body field is required.')
  })

  it('selects type-aware size messages', () => {
    expect(
      Validator.make({ n: 5 }, { n: 'numeric|max:3' }).errors === undefined,
    ).toBe(false)
    const numeric = Validator.make({ n: 5 }, { n: 'numeric|max:3' })
    numeric.passes()
    expect(numeric.errors().first('n')).toBe('The n field must not be greater than 3.')

    const str = Validator.make({ n: 'abcd' }, { n: 'string|max:3' })
    str.passes()
    expect(str.errors().first('n')).toBe('The n field must not be greater than 3 characters.')

    const arr = Validator.make({ n: [1, 2, 3, 4] }, { n: 'array|max:3' })
    arr.passes()
    expect(arr.errors().first('n')).toBe('The n field must not have more than 3 items.')
  })

  it('throws ValidationException from validate()', () => {
    const v = Validator.make({}, { name: 'required' })
    expect(() => v.validate()).toThrow(ValidationException)
    try {
      v.validate()
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationException)
      if (error instanceof ValidationException) {
        expect(error.errors()).toHaveProperty('name')
      }
    }
  })

  it('respects bail', () => {
    const v = Validator.make({ title: 123 }, { title: 'bail|string|max:2' })
    v.passes()
    expect(v.errors().get('title')).toHaveLength(1)
  })

  it('respects nullable', () => {
    const v = Validator.make({ publish_at: null }, { publish_at: 'nullable|date' })
    expect(v.passes()).toBe(true)
    const invalid = Validator.make({ publish_at: null }, { publish_at: 'date' })
    expect(invalid.fails()).toBe(true)
  })

  it('honors the sometimes flag', () => {
    expect(Validator.make({}, { email: 'sometimes|required|email' }).passes()).toBe(true)
    expect(Validator.make({ email: 'bad' }, { email: 'sometimes|email' }).fails()).toBe(true)
  })

  it('stops on first failure when configured', () => {
    const v = Validator.make({ a: '', b: '' }, { a: 'required', b: 'required' }).stopOnFirstFailure()
    v.passes()
    expect(v.errors().count()).toBe(1)
  })
})

describe('Validator — nested & wildcards', () => {
  it('validates dot-notation fields', () => {
    const v = Validator.make({ author: { name: '' } }, { 'author.name': 'required' })
    expect(v.fails()).toBe(true)
    expect(v.errors().first('author.name')).toBe('The author.name field is required.')
  })

  it('expands * wildcards over arrays', () => {
    const v = Validator.make(
      { users: [{ email: 'a@b.com' }, { email: 'nope' }, { email: 'c@d.com' }] },
      { 'users.*.email': 'required|email' },
    )
    expect(v.fails()).toBe(true)
    expect(v.errors().has('users.1.email')).toBe(true)
    expect(v.errors().has('users.0.email')).toBe(false)
  })

  it('supports :position placeholders in custom messages', () => {
    const v = Validator.make(
      { photos: [{ description: 'ok' }, { description: '' }] },
      { 'photos.*.description': 'required' },
      { 'photos.*.description.required': 'Please describe photo #:position.' },
    )
    v.passes()
    expect(v.errors().first('photos.1.description')).toBe('Please describe photo #2.')
  })

  it('retrieves wildcard errors via MessageBag.get', () => {
    const v = Validator.make(
      { tags: ['', ''] },
      { 'tags.*': 'required' },
    )
    v.passes()
    expect(v.errors().get('tags.*')).toHaveLength(2)
  })
})

describe('Validator — exclusion & conditional', () => {
  it('exclude_if removes a field and skips its rules', () => {
    const v = Validator.make(
      { has_appointment: false, appointment_date: 'not-a-date' },
      {
        has_appointment: 'required|boolean',
        appointment_date: 'exclude_if:has_appointment,false|required|date',
      },
    )
    expect(v.passes()).toBe(true)
    expect(v.validated()).not.toHaveProperty('appointment_date')
  })

  it('supports sometimes() complex conditions', () => {
    const v = Validator.make({ games: 150 }, { games: 'required|integer' })
    v.sometimes('reason', 'required|max:5', (data) => Number(data['games']) >= 100)
    expect(v.fails()).toBe(true)
    expect(v.errors().has('reason')).toBe(true)
  })

  it('runs after() callbacks', () => {
    const v = Validator.make({ x: 1 }, { x: 'integer' })
    v.after((validator) => {
      validator.errors().add('x', 'extra problem')
    })
    v.passes()
    expect(v.errors().first('x')).toBe('extra problem')
  })
})

describe('Validator — custom messages & attributes', () => {
  it('uses attribute.rule and custom attribute names', () => {
    const v = Validator.make(
      { email: '' },
      { email: 'required' },
      { 'email.required': 'We need your :attribute!' },
      { email: 'email address' },
    )
    v.passes()
    expect(v.errors().first('email')).toBe('We need your email address!')
  })

  it('formats required_if with other field value', () => {
    const v = Validator.make(
      { payment_type: 'cc', cc_number: '' },
      { cc_number: 'required_if:payment_type,cc' },
    )
    v.passes()
    expect(v.errors().first('cc_number')).toBe(
      'The cc number field is required when payment type is cc.',
    )
  })
})

describe('Validator — async rules', () => {
  it('runs unique/exists resolvers asynchronously', async () => {
    const unique = vi.fn(async () => false)
    const v = Validator.make({ email: 'taken@x.com' }, { email: 'required|email|unique:users' })
      .withResolvers({ unique })
    expect(await v.failsAsync()).toBe(true)
    expect(unique).toHaveBeenCalledOnce()
    expect(v.errors().first('email')).toBe('The email has already been taken.')
  })

  it('throws when async rules run on the sync path', () => {
    const v = Validator.make({ email: 'x@y.com' }, { email: 'unique:users' }).withResolvers({
      unique: async () => true,
    })
    expect(() => v.passes()).toThrow(/asynchronous/)
  })
})

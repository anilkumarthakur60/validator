import { afterEach, describe, expect, it } from 'vitest'
import { validation, ValidationBuilder } from '@/fluent/builder'

describe('fluent builder', () => {
  it('produces a Quasar rule function via toRule()', () => {
    const rule = validation.required().email().toRule()
    expect(rule('a@b.com')).toBe(true)
    expect(typeof rule('')).toBe('string')
    expect(typeof rule('bad')).toBe('string')
  })

  it('is directly callable without toRule()', () => {
    const rule = validation.required().maxLength(5)
    expect((rule as unknown as (v: unknown) => true | string)('hi')).toBe(true)
    expect((rule as unknown as (v: unknown) => true | string)('toolong')).not.toBe(true)
  })

  it('nullable skips when empty', () => {
    const rule = validation.nullable().email().toRule()
    expect(rule('')).toBe(true)
    expect(rule(null)).toBe(true)
    expect(rule('bad')).not.toBe(true)
  })

  it('between for numbers', () => {
    const rule = validation.required().numeric().between(1, 5).toRule()
    expect(rule(3)).toBe(true)
    expect(rule(9)).not.toBe(true)
  })

  it('cross-field same() via captured sibling', () => {
    expect(validation.same('secret').toRule()('secret')).toBe(true)
    expect(validation.same('secret').toRule()('other')).not.toBe(true)
  })

  it('confirmed() compares to the captured confirmation value', () => {
    expect(validation.confirmed('pw').toRule()('pw')).toBe(true)
    expect(validation.confirmed('pw').toRule()('nope')).not.toBe(true)
  })

  it('in() / enum()', () => {
    expect(validation.in('a', 'b').toRule()('a')).toBe(true)
    expect(validation.in('a', 'b').toRule()('z')).not.toBe(true)
    expect(validation.enum(['x', 'y']).toRule()('y')).toBe(true)
  })

  it('custom() inline rule', () => {
    const rule = validation
      .required()
      .custom((value) => String(value).startsWith('HC-') || 'Must start with HC-')
      .toRule()
    expect(rule('HC-1')).toBe(true)
    expect(rule('X')).toBe('Must start with HC-')
  })

  it('attribute() customizes the message label', () => {
    const rule = validation.attribute('Email').required().toRule()
    expect(rule('')).toBe('The Email field is required.')
  })

  it('works via new validation()', () => {
    const rule = new ValidationBuilder().required().toRule()
    expect(rule('x')).toBe(true)
  })
})

describe('fluent registry', () => {
  afterEach(() => {
    validation.removeRule('nepaliPhone')
  })

  it('extend() + rule()', () => {
    validation.extend(
      'nepaliPhone',
      (value) => /^(\+977)?9[78]\d{8}$/.test(String(value)) || 'Invalid Nepali phone number.',
    )
    expect(validation.hasRule('nepaliPhone')).toBe(true)
    const rule = validation.required().rule('nepaliPhone').toRule()
    expect(rule('9812345678')).toBe(true)
    expect(rule('123')).toBe('Invalid Nepali phone number.')
  })
})

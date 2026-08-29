/**
 * Chainable, Quasar-friendly single-field builder.
 *
 * It produces a `(value) => true | string` rule function (Quasar's `:rules`
 * contract) and is itself directly callable, so `.toRule()` is optional:
 *
 *   <q-input :rules="[validation.required().email()]" />
 *   <q-input :rules="[validation.required().email().toRule()]" />
 *
 * Internally every chain composes the real {@link Validator} engine against a
 * single synthetic field, so behavior matches the dataset API exactly 
 * including cross-field rules, which capture sibling values at build time.
 */

import { isEmpty, stringifyValue } from '@/helpers'
import type { CustomMessages, FieldRuleFn, RuleEntry, ValidationData } from '@/types'
import { Validator } from '@/core/Validator'
import { Rule } from '@/ruleObjects/Rule'
import { Password } from '@/ruleObjects/Password'

const FIELD = 'value'

type SimpleRule = (value: unknown) => true | string
type CustomRuleFn = (value: unknown, ...parameters: unknown[]) => true | string

/** A chain that is also directly usable as a Quasar rule function. */
export type ValidationRule = ValidationBuilder & FieldRuleFn

const makeCallable = (instance: ValidationBuilder): ValidationBuilder => {
  const fn = (value: unknown): true | string => (fn as unknown as ValidationBuilder).toRule()(value)
  Object.setPrototypeOf(fn, Object.getPrototypeOf(instance) as object)
  Object.defineProperties(fn, Object.getOwnPropertyDescriptors(instance))
  return fn as unknown as ValidationBuilder
}

class ValidationBuilder {
  private readonly specs: RuleEntry[] = []
  private readonly siblings: ValidationData = {}
  private refCount = 0
  private label = 'value'
  private readonly customMessages: CustomMessages = {}

  private static readonly customRules = new Map<string, CustomRuleFn>()

  constructor() {
    return makeCallable(this)
  }

  // ── terminal ────────────────────────────────────────────

  toRule(): FieldRuleFn {
    return (value: unknown): true | string => {
      const data: ValidationData = { [FIELD]: value, ...this.siblings }
      const validator = Validator.make(data, { [FIELD]: this.specs }, this.customMessages, {
        [FIELD]: this.label,
      })
      if (validator.passes()) return true
      const message = validator.errors().first(FIELD)
      return message === '' ? 'The given value is invalid.' : message
    }
  }

  /** Alias of {@link toRule}. */
  getRuleFn(): FieldRuleFn {
    return this.toRule()
  }

  /** Set the attribute label used in messages (replaces `:attribute`). */
  attribute(name: string): this {
    this.label = name
    return this
  }

  /** Provide custom messages keyed by rule name. */
  withMessages(messages: CustomMessages): this {
    Object.assign(this.customMessages, messages)
    return this
  }

  // ── internals ───────────────────────────────────────────

  private push(spec: RuleEntry): this {
    this.specs.push(spec)
    return this
  }

  private sibling(value: unknown): string {
    const key = `__ref_${this.refCount}`
    this.refCount += 1
    this.siblings[key] = value
    return key
  }

  // ── modifiers ───────────────────────────────────────────

  nullable(): this {
    return this.push('nullable')
  }
  bail(): this {
    return this.push('bail')
  }
  stopAfterFirstError(): this {
    return this.bail()
  }
  sometimes(): this {
    return this.push('sometimes')
  }

  // ── presence ────────────────────────────────────────────

  required(): this {
    return this.push('required')
  }
  filled(): this {
    return this.push('filled')
  }
  present(): this {
    return this.push('present')
  }
  missing(): this {
    return this.push('missing')
  }
  prohibited(): this {
    return this.push('prohibited')
  }

  // ── strings ─────────────────────────────────────────────

  string(): this {
    return this.push('string')
  }
  alpha(ascii = false): this {
    return this.push(ascii ? 'alpha:ascii' : 'alpha')
  }
  alphaDash(ascii = false): this {
    return this.push(ascii ? 'alpha_dash:ascii' : 'alpha_dash')
  }
  alphaNum(ascii = false): this {
    return this.push(ascii ? 'alpha_num:ascii' : 'alpha_num')
  }
  ascii(): this {
    return this.push('ascii')
  }
  email(...styles: string[]): this {
    return this.push(styles.length > 0 ? `email:${styles.join(',')}` : 'email')
  }
  lowercase(): this {
    return this.push('lowercase')
  }
  uppercase(): this {
    return this.push('uppercase')
  }
  url(...protocols: string[]): this {
    return this.push(protocols.length > 0 ? `url:${protocols.join(',')}` : 'url')
  }
  activeUrl(): this {
    return this.push('active_url')
  }
  uuid(version?: number): this {
    return this.push(version === undefined ? 'uuid' : `uuid:${version}`)
  }
  ulid(): this {
    return this.push('ulid')
  }
  hexColor(): this {
    return this.push('hex_color')
  }
  maxLength(max: number): this {
    return this.push('string').push(`max:${max}`)
  }
  minLength(min: number): this {
    return this.push('string').push(`min:${min}`)
  }
  startsWith(...values: string[]): this {
    return this.push(`starts_with:${values.join(',')}`)
  }
  endsWith(...values: string[]): this {
    return this.push(`ends_with:${values.join(',')}`)
  }
  doesntStartWith(...values: string[]): this {
    return this.push(`doesnt_start_with:${values.join(',')}`)
  }
  doesntEndWith(...values: string[]): this {
    return this.push(`doesnt_end_with:${values.join(',')}`)
  }
  regex(pattern: RegExp | string): this {
    return this.push(`regex:${pattern instanceof RegExp ? pattern.toString() : pattern}`)
  }
  notRegex(pattern: RegExp | string): this {
    return this.push(`not_regex:${pattern instanceof RegExp ? pattern.toString() : pattern}`)
  }
  nullableMaxLength(max: number): this {
    return this.nullable().maxLength(max)
  }
  stringBetweenLength(min: number, max: number): this {
    return this.minLength(min).maxLength(max)
  }

  // ── numbers ─────────────────────────────────────────────

  numeric(strict = false): this {
    return this.push(strict ? 'numeric:strict' : 'numeric')
  }
  integer(strict = false): this {
    return this.push(strict ? 'integer:strict' : 'integer')
  }
  min(value: number): this {
    return this.push(`min:${value}`)
  }
  max(value: number): this {
    return this.push(`max:${value}`)
  }
  between(min: number, max: number): this {
    return this.push(`between:${min},${max}`)
  }
  gt(value: number): this {
    return this.push(`gt:${value}`)
  }
  gte(value: number): this {
    return this.push(`gte:${value}`)
  }
  lt(value: number): this {
    return this.push(`lt:${value}`)
  }
  lte(value: number): this {
    return this.push(`lte:${value}`)
  }
  digits(length: number): this {
    return this.push(`digits:${length}`)
  }
  digitsBetween(min: number, max: number): this {
    return this.push(`digits_between:${min},${max}`)
  }
  maxDigits(max: number): this {
    return this.push(`max_digits:${max}`)
  }
  minDigits(min: number): this {
    return this.push(`min_digits:${min}`)
  }
  multipleOf(divisor: number): this {
    return this.push(`multiple_of:${divisor}`)
  }
  decimal(places: number, maxPlaces?: number): this {
    return this.push(
      maxPlaces === undefined ? `decimal:${places}` : `decimal:${places},${maxPlaces}`,
    )
  }
  mustBePositive(): this {
    return this.push('numeric').push('min:0')
  }
  nullablePositive(): this {
    return this.nullable().mustBePositive()
  }

  // ── dates ───────────────────────────────────────────────

  date(): this {
    return this.push('date')
  }
  dateEquals(reference: string): this {
    return this.push(`date_equals:${reference}`)
  }
  dateFormat(...formats: string[]): this {
    return this.push(`date_format:${formats.join(',')}`)
  }
  before(reference: string): this {
    return this.push(`before:${reference}`)
  }
  beforeOrEqual(reference: string): this {
    return this.push(`before_or_equal:${reference}`)
  }
  after(reference: string): this {
    return this.push(`after:${reference}`)
  }
  afterOrEqual(reference: string): this {
    return this.push(`after_or_equal:${reference}`)
  }
  timezone(): this {
    return this.push('timezone')
  }
  asDateOfBirth(maxAge = 150): this {
    return this.custom((value) => {
      const time =
        typeof value === 'string' || value instanceof Date ? Date.parse(String(value)) : NaN
      if (Number.isNaN(time)) return 'Please enter a valid date of birth.'
      const date = new Date(time)
      const now = new Date()
      if (date.getTime() >= now.getTime()) return 'Date of birth must be in the past.'
      if (now.getFullYear() - date.getFullYear() > maxAge)
        return 'Date of birth is too far in the past.'
      return true
    })
  }

  // ── booleans ────────────────────────────────────────────

  accepted(): this {
    return this.push('accepted')
  }
  acceptedIf(otherValue: unknown, expected: unknown): this {
    return this.push(`accepted_if:${this.sibling(otherValue)},${String(expected)}`)
  }
  boolean(strict = false): this {
    return this.push(strict ? 'boolean:strict' : 'boolean')
  }
  declined(): this {
    return this.push('declined')
  }
  declinedIf(otherValue: unknown, expected: unknown): this {
    return this.push(`declined_if:${this.sibling(otherValue)},${String(expected)}`)
  }

  // ── arrays ──────────────────────────────────────────────

  array(...allowedKeys: string[]): this {
    return this.push(allowedKeys.length > 0 ? `array:${allowedKeys.join(',')}` : 'array')
  }
  listRule(): this {
    return this.push('list')
  }
  distinct(mode?: 'strict' | 'ignore_case'): this {
    return this.push(mode ? `distinct:${mode}` : 'distinct')
  }
  inArray(allowed: readonly unknown[]): this {
    return this.push(`in_array:${this.sibling([...allowed])}.*`)
  }
  containsRule(...values: unknown[]): this {
    return this.push('array').push(Rule.contains(values))
  }
  doesntContain(...values: unknown[]): this {
    return this.push('array').push(Rule.doesntContain(values))
  }
  requiredArrayKeys(...keys: string[]): this {
    return this.push(`required_array_keys:${keys.join(',')}`)
  }

  // ── files ───────────────────────────────────────────────

  file(): this {
    return this.push('file')
  }
  image(allowSvg = false): this {
    return this.push(allowSvg ? 'image:allow_svg' : 'image')
  }
  mimes(...types: string[]): this {
    return this.push(`mimes:${types.join(',')}`)
  }
  mimetypes(...types: string[]): this {
    return this.push(`mimetypes:${types.join(',')}`)
  }
  extensions(...exts: string[]): this {
    return this.push(`extensions:${exts.join(',')}`)
  }

  // ── comparison / cross-field ────────────────────────────

  same(otherValue: unknown): this {
    return this.push(`same:${this.sibling(otherValue)}`)
  }
  different(otherValue: unknown): this {
    return this.push(`different:${this.sibling(otherValue)}`)
  }
  confirmed(confirmationValue: unknown): this {
    this.siblings[`${FIELD}_confirmation`] = confirmationValue
    return this.push('confirmed')
  }
  mustMatch(value: unknown): this {
    return this.confirmed(value)
  }
  in(...values: unknown[]): this {
    return this.push(Rule.in(values))
  }
  notIn(...values: unknown[]): this {
    return this.push(Rule.notIn(values))
  }
  enum(values: readonly unknown[] | Record<string, string | number>): this {
    return this.push(Rule.enum(values))
  }

  // ── conditional (capture sibling values) ────────────────

  requiredIf(otherValue: unknown, expected: unknown): this {
    return this.push(`required_if:${this.sibling(otherValue)},${String(expected)}`)
  }
  requiredUnless(otherValue: unknown, expected: unknown): this {
    return this.push(`required_unless:${this.sibling(otherValue)},${String(expected)}`)
  }
  requiredWith(...others: unknown[]): this {
    return this.push(`required_with:${others.map((value) => this.sibling(value)).join(',')}`)
  }
  requiredWithAll(...others: unknown[]): this {
    return this.push(`required_with_all:${others.map((value) => this.sibling(value)).join(',')}`)
  }
  requiredWithout(...others: unknown[]): this {
    return this.push(`required_without:${others.map((value) => this.sibling(value)).join(',')}`)
  }
  requiredWithoutAll(...others: unknown[]): this {
    return this.push(`required_without_all:${others.map((value) => this.sibling(value)).join(',')}`)
  }
  prohibitedIf(otherValue: unknown, expected: unknown): this {
    return this.push(`prohibited_if:${this.sibling(otherValue)},${String(expected)}`)
  }
  prohibits(...others: unknown[]): this {
    return this.push(`prohibits:${others.map((value) => this.sibling(value)).join(',')}`)
  }

  // ── misc ────────────────────────────────────────────────

  ip(): this {
    return this.push('ip')
  }
  ipv4(): this {
    return this.push('ipv4')
  }
  ipv6(): this {
    return this.push('ipv6')
  }
  json(): this {
    return this.push('json')
  }
  macAddress(): this {
    return this.push('mac_address')
  }
  size(value: number): this {
    return this.push(`size:${value}`)
  }
  password(minLength = 8): this {
    return this.custom((value) => {
      const text = stringifyValue(value)
      if (text.length < minLength) {
        return `The ${this.label} field must be at least ${minLength} characters with letters and numbers.`
      }
      if (!/[a-zA-Z]/.test(text)) return 'Must contain at least one letter.'
      if (!/\d/.test(text)) return 'Must contain at least one number.'
      return true
    })
  }
  strongPassword(minLength = 8): this {
    return this.push(Password.min(minLength).letters().mixedCase().numbers().symbols())
  }
  asPhoneNumber(): this {
    return this.custom((value) =>
      /^[+]?[\d\s\-().]{7,20}$/.test(stringifyValue(value))
        ? true
        : 'Please enter a valid phone number.',
    )
  }
  notEmpty(): this {
    // Implicit so it runs even when the value is empty (the case it guards).
    return this.push({
      implicit: true,
      validate: (_attribute, value, fail) => {
        if (isEmpty(value)) fail('This field must not be empty.')
      },
    })
  }
  minPasswordLength(min = 8): this {
    return this.minLength(min)
  }
  maxPasswordLength(max = 100): this {
    return this.maxLength(max)
  }

  // ── extension API ───────────────────────────────────────

  custom(fn: SimpleRule): this {
    return this.push((_attribute, value, fail) => {
      const result = fn(value)
      if (result !== true) fail(result)
    })
  }

  rule(name: string, ...parameters: unknown[]): this {
    const fn = ValidationBuilder.customRules.get(name)
    if (!fn) {
      throw new Error(
        `[validation] Unknown custom rule "${name}". Register it with validation.extend('${name}', fn) first.`,
      )
    }
    return this.push((_attribute, value, fail) => {
      const result = fn(value, ...parameters)
      if (result !== true) fail(result)
    })
  }

  static extend(name: string, fn: CustomRuleFn): void {
    ValidationBuilder.customRules.set(name, fn)
  }
  static hasRule(name: string): boolean {
    return ValidationBuilder.customRules.has(name)
  }
  static removeRule(name: string): void {
    ValidationBuilder.customRules.delete(name)
  }
  static customRuleNames(): string[] {
    return [...ValidationBuilder.customRules.keys()]
  }
}

// Static chain entry points are generated from the instance prototype so the
// full API is available as both `validation.required()` and `new validation().required()`.
type ChainStarters = {
  [Method in keyof ValidationBuilder]: ValidationBuilder[Method] extends (
    ...args: infer Args
  ) => unknown
    ? (...args: Args) => ValidationBuilder
    : never
}

interface ValidationStatic extends ChainStarters {
  new (): ValidationBuilder
  extend(name: string, fn: CustomRuleFn): void
  hasRule(name: string): boolean
  removeRule(name: string): void
  customRuleNames(): string[]
}

const STATIC_OWN = new Set([
  'extend',
  'hasRule',
  'removeRule',
  'customRuleNames',
  'prototype',
  'length',
  'name',
])

/**
 * The public entry point. Usable statically (`validation.required()`) or as a
 * constructor (`new validation()`), and every chain is directly callable.
 */
export const validation = new Proxy(ValidationBuilder, {
  get(target, property, receiver): unknown {
    if (typeof property === 'string' && !STATIC_OWN.has(property) && !(property in target)) {
      const builder = new ValidationBuilder() as unknown as Record<string, unknown>
      const method = builder[property]
      if (typeof method === 'function') {
        return (...args: unknown[]): unknown =>
          (method as (...a: unknown[]) => unknown).apply(builder, args)
      }
    }
    return Reflect.get(target, property, receiver)
  },
}) as unknown as ValidationStatic

export { ValidationBuilder }

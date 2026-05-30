/**
 * The `Password` complexity rule object.
 *
 *   Password.min(8).letters().mixedCase().numbers().symbols().uncompromised()
 *
 * `uncompromised()` is asynchronous and requires a `compromised` resolver
 * (e.g. a k-anonymity HaveIBeenPwned lookup); use `validateAsync()`.
 */

import { isString } from '@/lib/helpers'
import type {
  ClosureRule,
  DataAwareRule,
  FailFn,
  ValidationRuleObject,
  ValidatorAwareRule,
} from '@/lib/types'
import type { Validator } from '@/lib/core/Validator'

type ExtraRule = ValidationRuleObject | ClosureRule

export class Password implements ValidationRuleObject, ValidatorAwareRule {
  private minLength = 8
  private maxLength: number | null = null
  private needsLetters = false
  private needsMixedCase = false
  private needsNumbers = false
  private needsSymbols = false
  private uncompromisedThreshold: number | null = null
  private readonly extraRules: ExtraRule[] = []
  private validator: Validator | null = null

  private static defaultFactory: (() => Password) | null = null

  private constructor(min: number) {
    this.minLength = min
  }

  static min(length: number): Password {
    return new Password(length)
  }

  /** Configure or retrieve the application-wide default password rule. */
  static defaults(factory?: () => Password): Password {
    if (factory) {
      Password.defaultFactory = factory
      return new Password(8)
    }
    return Password.defaultFactory ? Password.defaultFactory() : new Password(8)
  }

  setValidator(validator: Validator): void {
    this.validator = validator
  }

  max(length: number): this {
    this.maxLength = length
    return this
  }

  letters(): this {
    this.needsLetters = true
    return this
  }

  mixedCase(): this {
    this.needsMixedCase = true
    return this
  }

  numbers(): this {
    this.needsNumbers = true
    return this
  }

  symbols(): this {
    this.needsSymbols = true
    return this
  }

  uncompromised(threshold = 0): this {
    this.uncompromisedThreshold = threshold
    return this
  }

  /** Attach additional rule objects/closures to run alongside the password checks. */
  rules(rules: ExtraRule | readonly ExtraRule[]): this {
    const list: readonly ExtraRule[] = Array.isArray(rules)
      ? (rules as readonly ExtraRule[])
      : [rules as ExtraRule]
    this.extraRules.push(...list)
    return this
  }

  validate(attribute: string, value: unknown, fail: FailFn): void | Promise<void> {
    if (!isString(value)) {
      fail('The :attribute field must be a valid string.')
      return
    }
    if (Array.from(value).length < this.minLength) {
      fail(`The :attribute field must be at least ${this.minLength} characters.`)
    }
    if (this.maxLength !== null && Array.from(value).length > this.maxLength) {
      fail(`The :attribute field must not be greater than ${this.maxLength} characters.`)
    }
    if (this.needsLetters && !/\p{L}/u.test(value)) {
      fail('The :attribute field must contain at least one letter.')
    }
    if (this.needsMixedCase && !(/\p{Lu}/u.test(value) && /\p{Ll}/u.test(value))) {
      fail('The :attribute field must contain at least one uppercase and one lowercase letter.')
    }
    if (this.needsNumbers && !/\d/u.test(value)) {
      fail('The :attribute field must contain at least one number.')
    }
    if (this.needsSymbols && !/[^\p{L}\p{N}\s]/u.test(value)) {
      fail('The :attribute field must contain at least one symbol.')
    }
    const pending: Promise<void>[] = []

    // The breach check is the only asynchronous core part.
    const threshold = this.uncompromisedThreshold
    const resolver = this.validator?.getResolvers().compromised
    if (threshold !== null && resolver) {
      pending.push(
        Promise.resolve(resolver(value)).then((count) => {
          if (count > threshold) {
            fail(
              'The given :attribute has appeared in a data leak. Please choose a different :attribute.',
            )
          }
        }),
      )
    }

    for (const rule of this.extraRules) {
      const outcome = this.runExtraRule(rule, attribute, value, fail)
      if (outcome instanceof Promise) pending.push(outcome)
    }

    return pending.length > 0 ? Promise.all(pending).then(() => undefined) : undefined
  }

  private runExtraRule(
    rule: ExtraRule,
    attribute: string,
    value: unknown,
    fail: FailFn,
  ): void | Promise<void> {
    if (typeof rule === 'function') return rule(attribute, value, fail)
    if (this.validator) {
      if (isDataAware(rule)) rule.setData(this.validator.getData())
      if (isValidatorAware(rule)) rule.setValidator(this.validator)
    }
    return rule.validate(attribute, value, fail)
  }

  /** A string usable for the HTML `passwordrules` attribute. */
  toPasswordRulesString(): string {
    const parts = [`minlength: ${this.minLength}`]
    if (this.maxLength !== null) parts.push(`maxlength: ${this.maxLength}`)
    if (this.needsLetters || this.needsMixedCase) parts.push('required: lower; required: upper')
    if (this.needsNumbers) parts.push('required: digit')
    if (this.needsSymbols) parts.push('required: [-().&@?#]')
    return parts.join('; ')
  }
}

const isDataAware = (rule: ValidationRuleObject): rule is ValidationRuleObject & DataAwareRule =>
  'setData' in rule && typeof (rule as DataAwareRule).setData === 'function'

const isValidatorAware = (
  rule: ValidationRuleObject,
): rule is ValidationRuleObject & ValidatorAwareRule =>
  'setValidator' in rule && typeof (rule as ValidatorAwareRule).setValidator === 'function'

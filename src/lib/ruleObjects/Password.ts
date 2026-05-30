/**
 * The `Password` complexity rule object (Laravel parity).
 *
 *   Password.min(8).letters().mixedCase().numbers().symbols().uncompromised()
 *
 * `uncompromised()` is asynchronous and requires a `compromised` resolver
 * (e.g. a k-anonymity HaveIBeenPwned lookup); use `validateAsync()`.
 */

import { isString } from '@/lib/helpers'
import type { FailFn, ValidationRuleObject, ValidatorAwareRule } from '@/lib/types'
import type { Validator } from '@/lib/core/Validator'

export class Password implements ValidationRuleObject, ValidatorAwareRule {
  private minLength = 8
  private maxLength: number | null = null
  private needsLetters = false
  private needsMixedCase = false
  private needsNumbers = false
  private needsSymbols = false
  private uncompromisedThreshold: number | null = null
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

  validate(_attribute: string, value: unknown, fail: FailFn): void | Promise<void> {
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
    // The breach check is the only asynchronous part — stay synchronous otherwise.
    const threshold = this.uncompromisedThreshold
    const resolver = this.validator?.getResolvers().compromised
    if (threshold !== null && resolver) {
      const password = value
      return Promise.resolve(resolver(password)).then((count) => {
        if (count > threshold) {
          fail(
            'The given :attribute has appeared in a data leak. Please choose a different :attribute.',
          )
        }
      })
    }
    return undefined
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

/**
 * The rule object behind `Rule.in()` / `Rule.notIn()`. By default it delegates
 * to the built-in `in`/`not_in` rules (loose `String(a) === String(b)`
 * comparison, Laravel `in_array` parity) and reuses their messages exactly;
 * `.strict()` opts into exact type-and-value (`===`) membership instead.
 */

import type { FailFn, ValidationRuleObject, ValidatorAwareRule } from '@/types'
import type { Validator } from '@/core/Validator'
import { makeBuiltinRuleObject } from '@/ruleObjects/delegating'

export class InRule implements ValidationRuleObject, ValidatorAwareRule {
  private strictMode = false
  private validator: Validator | null = null
  private readonly values: readonly unknown[]
  private readonly ruleName: 'in' | 'not_in'
  private readonly delegate: ValidationRuleObject & ValidatorAwareRule

  constructor(values: readonly unknown[], ruleName: 'in' | 'not_in') {
    this.values = values
    this.ruleName = ruleName
    this.delegate = makeBuiltinRuleObject(ruleName, values.map(String))
  }

  /**
   * Require an exact type-and-value match (`===`) instead of the default
   * loose comparison, so `Rule.in([1, 2]).strict()` rejects the string `'1'`.
   */
  strict(strict = true): this {
    this.strictMode = strict
    return this
  }

  setValidator(validator: Validator): void {
    this.validator = validator
    this.delegate.setValidator(validator)
  }

  validate(attribute: string, value: unknown, fail: FailFn): void | Promise<void> {
    if (!this.strictMode) return this.delegate.validate(attribute, value, fail)
    const contains = this.containsStrict(attribute, value)
    const passed = this.ruleName === 'in' ? contains : !contains
    if (!passed) fail(this.failureMessage(attribute))
    return undefined
  }

  /** Mirrors the built-in `in` semantics, with `===` in place of `String()` equality. */
  private containsStrict(attribute: string, value: unknown): boolean {
    if (Array.isArray(value) && this.validator?.hasRule(attribute, 'array')) {
      return value.every(
        (item) => !Array.isArray(item) && this.values.some((allowed) => allowed === item),
      )
    }
    return !Array.isArray(value) && this.values.some((allowed) => allowed === value)
  }

  private failureMessage(attribute: string): string {
    if (!this.validator) return 'The selected :attribute is invalid.'
    return this.validator.buildBuiltinMessage(attribute, this.ruleName, this.values.map(String))
  }
}

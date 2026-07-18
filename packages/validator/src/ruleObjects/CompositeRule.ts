/**
 * Base for fluent rule builders (`Rule.string()`, `Rule.date()`) that compose
 * several built-in checks and report each failure with its native message.
 * Conditionable via `when`/`unless`.
 */

import { requireBuiltinRule } from '@/core/registry'
import type { FailFn, RuleContext, ValidationRuleObject, ValidatorAwareRule } from '@/types'
import type { Validator } from '@/core/Validator'

interface BuiltinCheck {
  readonly name: string
  readonly parameters: readonly string[]
}

export abstract class CompositeRule implements ValidationRuleObject, ValidatorAwareRule {
  protected readonly checks: BuiltinCheck[] = []
  protected validator: Validator | null = null

  setValidator(validator: Validator): void {
    this.validator = validator
  }

  protected add(name: string, ...parameters: string[]): this {
    this.checks.push({ name, parameters })
    return this
  }

  when(condition: boolean, then: (rule: this) => void, otherwise?: (rule: this) => void): this {
    if (condition) then(this)
    else otherwise?.(this)
    return this
  }

  unless(condition: boolean, then: (rule: this) => void, otherwise?: (rule: this) => void): this {
    return this.when(!condition, then, otherwise)
  }

  validate(attribute: string, value: unknown, fail: FailFn): void {
    const validator = this.validator
    if (validator === null) return
    for (const check of this.checks) {
      const context: RuleContext = {
        attribute,
        attributePattern: attribute,
        value,
        parameters: check.parameters,
        data: validator.getData(),
        validator,
      }
      if (requireBuiltinRule(check.name).validate(context) === false) {
        fail(validator.buildBuiltinMessage(attribute, check.name, check.parameters))
      }
    }
  }
}

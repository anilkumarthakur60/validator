/**
 * `Rule.anyOf([...])` — passes when the value satisfies any one of the
 * provided rulesets. Each ruleset is validated with an isolated sub-validator.
 */

import type {
  FailFn,
  FieldRuleDefinition,
  ValidationRuleObject,
  ValidatorAwareRule,
} from '@/lib/types'
import { Validator } from '@/lib/core/Validator'

export class AnyOf implements ValidationRuleObject, ValidatorAwareRule {
  private readonly rulesets: readonly FieldRuleDefinition[]
  private validator: Validator | null = null

  constructor(rulesets: readonly FieldRuleDefinition[]) {
    this.rulesets = rulesets
  }

  setValidator(validator: Validator): void {
    this.validator = validator
  }

  validate(attribute: string, value: unknown, fail: FailFn): void {
    const field = attribute.slice(attribute.lastIndexOf('.') + 1)
    for (const ruleset of this.rulesets) {
      const sub = Validator.make({ [field]: value }, { [field]: ruleset })
      if (this.validator) sub.withResolvers(this.validator.getResolvers())
      if (sub.passes()) return
    }
    fail('The :attribute field is invalid.')
  }
}

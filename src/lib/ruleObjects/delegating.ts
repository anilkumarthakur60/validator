/**
 * Adapter that turns a built-in rule into a rule object, so fluent helpers
 * like `Rule.in([...])` reuse the engine's logic and messages exactly.
 */

import type { FailFn, ValidationRuleObject, ValidatorAwareRule } from '@/lib/types'
import type { Validator } from '@/lib/core/Validator'
import { getBuiltinRule } from '@/lib/core/registry'

export const makeBuiltinRuleObject = (
  name: string,
  parameters: readonly string[],
): ValidationRuleObject & ValidatorAwareRule => {
  let validator: Validator | null = null
  return {
    setValidator(instance: Validator): void {
      validator = instance
    },
    validate(attribute: string, value: unknown, fail: FailFn): void | Promise<void> {
      const definition = getBuiltinRule(name)
      if (!definition || validator === null) return undefined
      const active = validator
      const context = {
        attribute,
        attributePattern: attribute,
        value,
        parameters,
        data: active.getData(),
        validator: active,
      }
      const handle = (passed: boolean): void => {
        if (!passed) fail(active.buildBuiltinMessage(attribute, name, parameters))
      }
      const result = definition.validate(context)
      if (result instanceof Promise) return result.then(handle)
      handle(result)
      return undefined
    },
  }
}

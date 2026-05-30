/**
 * Fluent image-dimensions rule object. Delegates to the built-in `dimensions`
 * rule (which decodes the image asynchronously in the browser).
 */

import type { FailFn, RuleContext, ValidationRuleObject, ValidatorAwareRule } from '@/lib/types'
import type { Validator } from '@/lib/core/Validator'
import { requireBuiltinRule } from '@/lib/core/registry'

export class Dimensions implements ValidationRuleObject, ValidatorAwareRule {
  private readonly constraints = new Map<string, string>()
  private validator: Validator | null = null

  setValidator(validator: Validator): void {
    this.validator = validator
  }

  width(value: number): this {
    return this.set('width', value)
  }
  height(value: number): this {
    return this.set('height', value)
  }
  minWidth(value: number): this {
    return this.set('min_width', value)
  }
  maxWidth(value: number): this {
    return this.set('max_width', value)
  }
  minHeight(value: number): this {
    return this.set('min_height', value)
  }
  maxHeight(value: number): this {
    return this.set('max_height', value)
  }
  ratio(value: number | string): this {
    return this.set('ratio', value)
  }
  minRatio(value: number | string): this {
    return this.set('min_ratio', value)
  }
  maxRatio(value: number | string): this {
    return this.set('max_ratio', value)
  }
  ratioBetween(min: number | string, max: number | string): this {
    return this.set('min_ratio', min).set('max_ratio', max)
  }

  private set(key: string, value: number | string): this {
    this.constraints.set(key, String(value))
    return this
  }

  async validate(attribute: string, value: unknown, fail: FailFn): Promise<void> {
    if (this.validator === null) return
    const parameters = [...this.constraints.entries()].map(([key, val]) => `${key}=${val}`)
    const context: RuleContext = {
      attribute,
      attributePattern: attribute,
      value,
      parameters,
      data: this.validator.getData(),
      validator: this.validator,
    }
    const passed = await requireBuiltinRule('dimensions').validate(context)
    if (!passed) fail('The :attribute field has invalid image dimensions.')
  }
}

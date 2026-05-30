/**
 * Fluent email rule builder (Laravel's `Rule::email()`).
 *
 *   Rule.email().rfcCompliant().validateMxRecord().preventSpoofing()
 *
 * MX validation (`validateMxRecord`) maps to the `dns` style, which in a
 * frontend context only verifies RFC formatting unless an MX resolver exists.
 */

import { requireBuiltinRule } from '@/lib/core/registry'
import { CompositeRule } from '@/lib/ruleObjects/CompositeRule'
import type { FailFn } from '@/lib/types'

export class EmailRule extends CompositeRule {
  private readonly styles = new Set<string>()

  rfcCompliant(strict = false): this {
    this.styles.add(strict ? 'strict' : 'rfc')
    return this
  }
  strict(): this {
    this.styles.add('strict')
    return this
  }
  validateMxRecord(): this {
    this.styles.add('dns')
    return this
  }
  preventSpoofing(): this {
    this.styles.add('spoof')
    return this
  }
  withNativeValidation(allowUnicode = false): this {
    this.styles.add(allowUnicode ? 'filter_unicode' : 'filter')
    return this
  }

  override validate(attribute: string, value: unknown, fail: FailFn): void {
    const validator = this.validator
    if (validator === null) return
    const parameters = this.styles.size > 0 ? [...this.styles] : ['rfc']
    const passed = requireBuiltinRule('email').validate({
      attribute,
      attributePattern: attribute,
      value,
      parameters,
      data: validator.getData(),
      validator,
    })
    if (passed === false) fail(validator.buildBuiltinMessage(attribute, 'email', parameters))
  }
}

/**
 * Fluent string rule builder.
 *
 *   Rule.string().min(3).max(255).alphaDash(true)
 */

import { CompositeRule } from '@/ruleObjects/CompositeRule'

export class StringRule extends CompositeRule {
  constructor() {
    super()
    this.add('string')
  }

  min(length: number): this {
    return this.add('min', String(length))
  }
  max(length: number): this {
    return this.add('max', String(length))
  }
  between(min: number, max: number): this {
    return this.add('between', String(min), String(max))
  }
  exactly(length: number): this {
    return this.add('size', String(length))
  }
  alpha(ascii = false): this {
    return ascii ? this.add('alpha', 'ascii') : this.add('alpha')
  }
  alphaDash(ascii = false): this {
    return ascii ? this.add('alpha_dash', 'ascii') : this.add('alpha_dash')
  }
  alphaNumeric(ascii = false): this {
    return ascii ? this.add('alpha_num', 'ascii') : this.add('alpha_num')
  }
  ascii(): this {
    return this.add('ascii')
  }
  lowercase(): this {
    return this.add('lowercase')
  }
  uppercase(): this {
    return this.add('uppercase')
  }
  startsWith(...values: string[]): this {
    return this.add('starts_with', ...values)
  }
  endsWith(...values: string[]): this {
    return this.add('ends_with', ...values)
  }
  doesntStartWith(...values: string[]): this {
    return this.add('doesnt_start_with', ...values)
  }
  doesntEndWith(...values: string[]): this {
    return this.add('doesnt_end_with', ...values)
  }
}

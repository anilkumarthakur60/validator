/**
 * The `Enum` rule object. Accepts an array of allowed values or a TypeScript
 * enum object (its values are used). Supports `only`/`except`/`when`.
 */

import { isArray } from '@/helpers'
import type { FailFn, ValidationRuleObject } from '@/types'

export type EnumSource = readonly unknown[] | Record<string, string | number>

const toValues = (source: EnumSource): unknown[] =>
  isArray(source) ? [...source] : Object.values(source)

export class Enum implements ValidationRuleObject {
  private allowed: unknown[]
  private strictMode = false

  constructor(source: EnumSource) {
    this.allowed = toValues(source)
  }

  /**
   * Require an exact type-and-value match (`===`) instead of the default
   * loose comparison (`String(a) === String(b)`, Laravel `in_array` parity),
   * so a numeric enum no longer matches its string form.
   */
  strict(strict = true): this {
    this.strictMode = strict
    return this
  }

  only(values: readonly unknown[]): this {
    const set = new Set(values)
    this.allowed = this.allowed.filter((value) => set.has(value))
    return this
  }

  except(values: readonly unknown[]): this {
    const set = new Set(values)
    this.allowed = this.allowed.filter((value) => !set.has(value))
    return this
  }

  when(condition: boolean, then: (rule: Enum) => void, otherwise?: (rule: Enum) => void): this {
    if (condition) then(this)
    else otherwise?.(this)
    return this
  }

  validate(_attribute: string, value: unknown, fail: FailFn): void {
    const matches = this.allowed.some(
      (allowed) => allowed === value || (!this.strictMode && String(allowed) === String(value)),
    )
    if (!matches) fail('The selected :attribute is invalid.')
  }
}

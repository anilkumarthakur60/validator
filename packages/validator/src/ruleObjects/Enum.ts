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

  constructor(source: EnumSource) {
    this.allowed = toValues(source)
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
      (allowed) => allowed === value || String(allowed) === String(value),
    )
    if (!matches) fail('The selected :attribute is invalid.')
  }
}

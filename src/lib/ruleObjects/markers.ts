/**
 * Structural markers that let the parser recognize special rule objects
 * (e.g. `Rule.forEach`) without creating an import cycle with the engine.
 */

import type { FieldRuleDefinition } from '@/lib/types'

export const FOR_EACH = Symbol('validation.forEach')

/** A `Rule.forEach` entry: yields per-element rules during expansion. */
export interface ForEachLike {
  readonly [FOR_EACH]: true
  resolve(value: unknown, attribute: string): FieldRuleDefinition
}

export const isForEach = (value: unknown): value is ForEachLike =>
  typeof value === 'object' && value !== null && FOR_EACH in value

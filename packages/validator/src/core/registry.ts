/**
 * Central registry of built-in rules plus the metadata the engine needs:
 * which rules are size-sensitive and which determine an attribute's size type.
 *
 * `registerRule` lets applications add globally-available named rules.
 */

import { presenceRules } from '@/rules/presence'
import { stringRules } from '@/rules/string'
import { numberRules } from '@/rules/number'
import { sizeRules } from '@/rules/size'
import { dateRules } from '@/rules/date'
import { booleanRules } from '@/rules/boolean'
import { arrayRules } from '@/rules/array'
import { fileRules } from '@/rules/file'
import { utilityRules } from '@/rules/utility'
import type { BuiltinDefinition } from '@/core/ruleDefinition'

const registry = new Map<string, BuiltinDefinition>(
  Object.entries({
    ...presenceRules,
    ...stringRules,
    ...numberRules,
    ...sizeRules,
    ...dateRules,
    ...booleanRules,
    ...arrayRules,
    ...fileRules,
    ...utilityRules,
  }),
)

export const getBuiltinRule = (name: string): BuiltinDefinition | undefined => registry.get(name)

/** Look up a rule that is required to exist, throwing for an unknown name. */
export const requireBuiltinRule = (name: string): BuiltinDefinition => {
  const definition = registry.get(name)
  if (!definition) throw new Error(`[validation] Unknown validation rule "${name}".`)
  return definition
}

export const hasBuiltinRule = (name: string): boolean => registry.has(name)

/** Register (or override) a globally-available built-in rule. */
export const registerRule = (name: string, definition: BuiltinDefinition): void => {
  registry.set(name, definition)
}

/** Size-sensitive rules whose message wording depends on the value type. */
export const SIZE_RULES: ReadonlySet<string> = new Set([
  'size',
  'min',
  'max',
  'between',
  'gt',
  'gte',
  'lt',
  'lte',
])

/** Rules that force an attribute into the "numeric" size category. */
export const NUMERIC_RULES: ReadonlySet<string> = new Set(['numeric', 'integer', 'decimal'])

/** Rules that force an attribute into the "file" size category. */
export const FILE_RULES: ReadonlySet<string> = new Set([
  'file',
  'image',
  'mimes',
  'mimetypes',
  'dimensions',
  'extensions',
])

/** Flow/flag pseudo-rules handled by the engine, not by validators. */
export const FLAG_RULES: ReadonlySet<string> = new Set([
  'nullable',
  'sometimes',
  'bail',
  'exclude',
  'exclude_if',
  'exclude_unless',
  'exclude_with',
  'exclude_without',
])

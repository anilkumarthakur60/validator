/**
 * Parses rule definitions (`'required|max:255'` or `['required', Rule, fn]`)
 * into a normalized, strongly-typed list the engine can execute.
 */

import type { ClosureRule, FieldRuleDefinition, RuleEntry, ValidationRuleObject } from '@/types'
import { type ForEachLike, isForEach } from '@/ruleObjects/markers'

/** A parsed built-in rule, e.g. `{ name: 'max', parameters: ['255'] }`. */
export interface ParsedBuiltinRule {
  readonly kind: 'builtin'
  readonly name: string
  readonly parameters: readonly string[]
  readonly raw: string
}

export interface ParsedObjectRule {
  readonly kind: 'object'
  readonly rule: ValidationRuleObject
}

export interface ParsedClosureRule {
  readonly kind: 'closure'
  readonly rule: ClosureRule
}

export interface ParsedForEachRule {
  readonly kind: 'foreach'
  readonly rule: ForEachLike
}

export type ParsedRule =
  | ParsedBuiltinRule
  | ParsedObjectRule
  | ParsedClosureRule
  | ParsedForEachRule

/** Rules whose parameters must not be comma-split (they may contain commas). */
const UNSPLIT_PARAMETER_RULES = new Set(['regex', 'not_regex'])

/** Normalize a rule's leading token to canonical lowercase snake_case. */
export const normalizeRuleName = (name: string): string =>
  name
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()

const parseRuleString = (rule: string): ParsedBuiltinRule => {
  const separatorIndex = rule.indexOf(':')
  if (separatorIndex === -1) {
    return { kind: 'builtin', name: normalizeRuleName(rule), parameters: [], raw: rule }
  }
  const name = normalizeRuleName(rule.slice(0, separatorIndex))
  const parameterString = rule.slice(separatorIndex + 1)
  const parameters = UNSPLIT_PARAMETER_RULES.has(name)
    ? [parameterString]
    : splitParameters(parameterString)
  return { kind: 'builtin', name, parameters, raw: rule }
}

const splitParameters = (parameterString: string): string[] => {
  if (parameterString === '') return []
  return parameterString.split(',').map((part) => part.trim())
}

const parseEntry = (entry: RuleEntry): ParsedRule => {
  if (typeof entry === 'string') return parseRuleString(entry)
  if (typeof entry === 'function') return { kind: 'closure', rule: entry }
  if (isForEach(entry)) return { kind: 'foreach', rule: entry }
  if (isRuleObject(entry)) return { kind: 'object', rule: entry }
  throw new TypeError(
    '[validation] Unsupported rule entry; expected string, function, or rule object.',
  )
}

const isRuleObject = (entry: unknown): entry is ValidationRuleObject =>
  typeof entry === 'object' &&
  entry !== null &&
  'validate' in entry &&
  typeof entry.validate === 'function'

/** Parse a single field's rule definition into a flat list of parsed rules. */
export const parseFieldRules = (definition: FieldRuleDefinition): ParsedRule[] => {
  if (typeof definition === 'string') {
    return definition
      .split('|')
      .filter((part) => part.length > 0)
      .map(parseRuleString)
  }
  if (Array.isArray(definition)) return (definition as readonly RuleEntry[]).map(parseEntry)
  // A single rule object / closure / forEach used directly as the definition.
  return [parseEntry(definition as RuleEntry)]
}

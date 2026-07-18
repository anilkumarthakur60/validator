/**
 * Parses rule definitions (`'required|max:255'` or `['required', Rule, fn]`)
 * into a normalized, strongly-typed list the engine can execute.
 */

import type { ClosureRule, FieldRuleDefinition, RuleEntry, ValidationRuleObject } from '@/types'
import { type ForEachLike, isForEach } from '@/ruleObjects/markers'
import { hasBuiltinRule } from '@/core/registry'

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
  ParsedBuiltinRule | ParsedObjectRule | ParsedClosureRule | ParsedForEachRule

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

/** The normalized rule name of a segment (`'max:3'` → `'max'`). */
const ruleNameOf = (segment: string): string => {
  const colon = segment.indexOf(':')
  return normalizeRuleName(colon === -1 ? segment : segment.slice(0, colon))
}

const isRegexSegment = (segment: string): boolean =>
  segment.includes(':') && UNSPLIT_PARAMETER_RULES.has(ruleNameOf(segment))

/** Whether a `/.../flags`-delimited pattern is still missing its closing `/`. */
const isUnclosedPattern = (segment: string): boolean => {
  const pattern = segment.slice(segment.indexOf(':') + 1)
  if (!pattern.startsWith('/')) return false
  return !/^\/(?:[^\\/]|\\.)*\/[a-z]*$/.test(pattern)
}

/** Whether a pipe-split segment belongs to the preceding regex segment's pattern. */
const absorbsSegment = (previous: string, segment: string): boolean => {
  if (isUnclosedPattern(previous)) return true
  const pattern = previous.slice(previous.indexOf(':') + 1)
  // Undelimited pattern: absorb anything that doesn't name a known rule.
  return !pattern.startsWith('/') && !hasBuiltinRule(ruleNameOf(segment))
}

/**
 * Re-join pipe-split segments that belong to a preceding `regex:`/`not_regex:`
 * pattern, so `'regex:/^a|b$/'` keeps its `|` intact. A `/.../`-delimited
 * pattern absorbs segments while its closing `/` is missing; an undelimited
 * pattern absorbs segments that don't name a known rule. A pattern left
 * unclosed after merging is a hard error (array syntax sidesteps the split).
 */
const mergeRegexSegments = (segments: readonly string[]): string[] => {
  const merged: string[] = []
  for (const segment of segments) {
    const previous = merged.length > 0 ? merged[merged.length - 1] : undefined
    if (previous !== undefined && isRegexSegment(previous) && absorbsSegment(previous, segment)) {
      merged[merged.length - 1] = `${previous}|${segment}`
    } else {
      merged.push(segment)
    }
  }
  const unclosed = merged.find((segment) => isRegexSegment(segment) && isUnclosedPattern(segment))
  if (unclosed !== undefined) {
    throw new Error(
      `[validation] Could not parse "${unclosed}" from a pipe-delimited rule string. ` +
        `Use array syntax for regex patterns containing "|", e.g. ['regex:/^a|b$/'].`,
    )
  }
  return merged
}

/** Parse a single field's rule definition into a flat list of parsed rules. */
export const parseFieldRules = (definition: FieldRuleDefinition): ParsedRule[] => {
  if (typeof definition === 'string') {
    return mergeRegexSegments(definition.split('|'))
      .filter((part) => part.length > 0)
      .map(parseRuleString)
  }
  if (Array.isArray(definition)) return (definition as readonly RuleEntry[]).map(parseEntry)
  // A single rule object / closure / forEach used directly as the definition.
  return [parseEntry(definition as RuleEntry)]
}

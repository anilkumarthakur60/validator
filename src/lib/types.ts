/**
 * Shared, fully-typed contracts for the validation library.
 *
 * The library is strictly typed: values under validation are always `unknown`
 * and narrowed inside rules — there is no `any` anywhere in the codebase.
 */

import type { Validator } from '@/lib/core/Validator'
import type { ForEachLike } from '@/lib/ruleObjects/markers'

/** A bag of data under validation, keyed by (possibly dotted) field names. */
export type ValidationData = Record<string, unknown>

/** A scalar that a validation message placeholder can be replaced with. */
export type Replaceable = string | number

/** Callback a rule object/closure invokes to record a failure message. */
export type FailFn = (message: string) => void

// ---------------------------------------------------------------------------
// Built-in rule contracts (engine-internal)
// ---------------------------------------------------------------------------

/** Everything a built-in rule needs to make a decision. */
export interface RuleContext {
  /** Fully-expanded attribute name, e.g. `users.0.email`. */
  readonly attribute: string
  /** The original (un-expanded) rule key, e.g. `users.*.email`. */
  readonly attributePattern: string
  /** The value under validation. */
  readonly value: unknown
  /** Rule parameters, already wildcard-substituted (e.g. `['users.0.name']`). */
  readonly parameters: readonly string[]
  /** The complete dataset under validation. */
  readonly data: ValidationData
  /** The owning validator (for cross-field lookups and config). */
  readonly validator: Validator
}

/** A synchronous built-in rule: returns `true` when the value passes. */
export type RuleInvokable = (ctx: RuleContext) => boolean

/** An asynchronous built-in rule (e.g. `exists`, `unique`). */
export type AsyncRuleInvokable = (ctx: RuleContext) => Promise<boolean>

/** Context handed to a per-rule message replacer. */
export interface ReplacerContext {
  readonly attribute: string
  readonly displayAttribute: string
  readonly rule: string
  readonly parameters: readonly string[]
  readonly value: unknown
  readonly data: ValidationData
  readonly validator: Validator
}

/** Replaces placeholders (`:min`, `:other`, …) in a message template. */
export type MessageReplacer = (message: string, ctx: ReplacerContext) => string

// ---------------------------------------------------------------------------
// Public rule-object contracts (Laravel parity)
// ---------------------------------------------------------------------------

/** A class-based rule (Laravel's `Illuminate\Contracts\Validation\ValidationRule`). */
export interface ValidationRuleObject {
  validate(attribute: string, value: unknown, fail: FailFn): void | Promise<void>
  /** When `true`, the rule runs even if the attribute is absent/empty. */
  readonly implicit?: boolean
}

/** A rule object that wants the full dataset injected before validating. */
export interface DataAwareRule {
  setData(data: ValidationData): void
}

/** A rule object that wants the validator instance injected before validating. */
export interface ValidatorAwareRule {
  setValidator(validator: Validator): void
}

/** A one-off closure rule. */
export type ClosureRule = (
  attribute: string,
  value: unknown,
  fail: FailFn,
) => void | Promise<void>

/** Any single entry in a field's rule list. */
export type RuleEntry = string | ValidationRuleObject | ClosureRule | ForEachLike

/** A field's rules: a `|`-delimited string, a single entry, or an array of entries. */
export type FieldRuleDefinition = RuleEntry | ReadonlyArray<RuleEntry>

/** The full rules schema passed to `Validator.make`. */
export type RulesSchema = Record<string, FieldRuleDefinition>

/** Custom messages: `rule` or `attribute.rule` → template. */
export type CustomMessages = Record<string, string>

/** Custom display names for attributes. */
export type CustomAttributes = Record<string, string>

/** A callback run after the main validation pass. */
export type AfterCallback = (validator: Validator) => void | Promise<void>

/** Signature shared by Quasar-style single-field rule functions. */
export type FieldRuleFn = (value: unknown) => true | string

// ---------------------------------------------------------------------------
// Async resolvers (database / network rules in a frontend context)
// ---------------------------------------------------------------------------

/** Resolver for `exists` — return whether the value(s) exist in the store. */
export type ExistsResolver = (query: DatabaseQuery) => boolean | Promise<boolean>

/** Resolver for `unique` — return whether the value is unique in the store. */
export type UniqueResolver = (query: DatabaseQuery) => boolean | Promise<boolean>

/** Resolver for `Password.uncompromised()` — return the breach count for a password. */
export type CompromisedResolver = (password: string) => number | Promise<number>

/** Resolver for `active_url` DNS checks. */
export type ActiveUrlResolver = (host: string) => boolean | Promise<boolean>

/** Resolver for `current_password` — return whether it matches the user's password. */
export type CurrentPasswordResolver = (
  password: string,
  guard?: string,
) => boolean | Promise<boolean>

/** Pluggable resolvers for rules that cannot run purely client-side. */
export interface ValidationResolvers {
  exists?: ExistsResolver
  unique?: UniqueResolver
  compromised?: CompromisedResolver
  activeUrl?: ActiveUrlResolver
  currentPassword?: CurrentPasswordResolver
}

/** Normalized description of an `exists`/`unique` query. */
export interface DatabaseQuery {
  readonly table: string
  readonly column: string
  readonly value: unknown
  readonly values: readonly unknown[]
  readonly attribute: string
  readonly ignore?: { id: unknown; column: string }
  readonly wheres: ReadonlyArray<{ column: string; value: unknown }>
}

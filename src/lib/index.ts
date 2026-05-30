/**
 * @hc/validation — a Laravel-compatible, strictly-typed validation library.
 *
 * Two complementary APIs share one engine:
 *  - {@link Validator} — full dataset validation (`Validator.make(data, rules)`).
 *  - {@link validation} — a chainable single-field builder for Quasar `:rules`.
 */

// ── Dataset validator core ──────────────────────────────────
export { Validator } from '@/lib/core/Validator'
export { MessageBag } from '@/lib/core/MessageBag'
export { ValidatedInput } from '@/lib/core/ValidatedInput'
export { ValidationException } from '@/lib/core/ValidationException'
export { registerRule, getBuiltinRule, hasBuiltinRule } from '@/lib/core/registry'

// ── Fluent single-field builder ─────────────────────────────
export { validation, ValidationBuilder } from '@/lib/fluent/builder'
export type { ValidationRule } from '@/lib/fluent/builder'

// ── Rule objects ────────────────────────────────────────────
export { Rule } from '@/lib/ruleObjects/Rule'
export { Password } from '@/lib/ruleObjects/Password'
export { Enum } from '@/lib/ruleObjects/Enum'
export type { EnumSource } from '@/lib/ruleObjects/Enum'
export { Dimensions } from '@/lib/ruleObjects/Dimensions'
export { FileRule } from '@/lib/ruleObjects/FileRule'
export { StringRule } from '@/lib/ruleObjects/StringRule'
export { DateRule } from '@/lib/ruleObjects/DateRule'
export { EmailRule } from '@/lib/ruleObjects/EmailRule'
export { CompositeRule } from '@/lib/ruleObjects/CompositeRule'
export { ExistsRule, UniqueRule } from '@/lib/ruleObjects/database'
export { AnyOf } from '@/lib/ruleObjects/AnyOf'

// ── Messages & helpers (for customization / i18n) ───────────
export { defaultMessages, formatMessage, FALLBACK_MESSAGE } from '@/lib/messages'
export type { MessageTemplate, TypedMessage, SizeType } from '@/lib/messages'
export * as helpers from '@/lib/helpers'
export * as rules from '@/lib/rules/index'

// ── Data utilities ──────────────────────────────────────────
export { dotGet, dotHas, dotSet, expandWildcards, flattenKeys } from '@/lib/core/data'

// ── Types ───────────────────────────────────────────────────
export type {
  ValidationData,
  RulesSchema,
  FieldRuleDefinition,
  RuleEntry,
  ClosureRule,
  ValidationRuleObject,
  DataAwareRule,
  ValidatorAwareRule,
  CustomMessages,
  CustomAttributes,
  AfterCallback,
  InvokableAfter,
  FailFn,
  FieldRuleFn,
  RuleContext,
  ReplacerContext,
  MessageReplacer,
  ValidationResolvers,
  DatabaseQuery,
  ExistsResolver,
  UniqueResolver,
  CompromisedResolver,
  ActiveUrlResolver,
  CurrentPasswordResolver,
} from '@/lib/types'

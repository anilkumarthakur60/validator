/**
 * @anil-labs/validator  an expressive, strictly-typed validation library.
 *
 * Two complementary APIs share one engine:
 *  - {@link Validator}  full dataset validation (`Validator.make(data, rules)`).
 *  - {@link validation}  a chainable single-field builder for Quasar `:rules`.
 */

// ── Dataset validator core ──────────────────────────────────
export { Validator } from '@/core/Validator'
export { MessageBag } from '@/core/MessageBag'
export { ValidatedInput } from '@/core/ValidatedInput'
export { ValidationException } from '@/core/ValidationException'
export { registerRule, getBuiltinRule, hasBuiltinRule } from '@/core/registry'
export type { BuiltinDefinition, RuleModule } from '@/core/ruleDefinition'
export type { MissingResolverBehavior } from '@/core/resolverPolicy'

// ── Fluent single-field builder ─────────────────────────────
export { validation, ValidationBuilder } from '@/fluent/builder'
export type { ValidationRule } from '@/fluent/builder'

// ── Rule objects ────────────────────────────────────────────
export { Rule } from '@/ruleObjects/Rule'
export { Password } from '@/ruleObjects/Password'
export { Enum } from '@/ruleObjects/Enum'
export type { EnumSource } from '@/ruleObjects/Enum'
export { Dimensions } from '@/ruleObjects/Dimensions'
export { FileRule } from '@/ruleObjects/FileRule'
export { StringRule } from '@/ruleObjects/StringRule'
export { DateRule } from '@/ruleObjects/DateRule'
export { EmailRule } from '@/ruleObjects/EmailRule'
export { CompositeRule } from '@/ruleObjects/CompositeRule'
export { ExistsRule, UniqueRule } from '@/ruleObjects/database'
export { InRule } from '@/ruleObjects/InRule'
export { AnyOf } from '@/ruleObjects/AnyOf'

// ── Messages & helpers (for customization / i18n) ───────────
export { defaultMessages, formatMessage, FALLBACK_MESSAGE } from '@/messages'
export type { MessageTemplate, TypedMessage, SizeType } from '@/messages'
export * as helpers from '@/helpers'
export * as rules from '@/rules/index'

// ── Data utilities ──────────────────────────────────────────
export { dotGet, dotHas, dotSet, expandWildcards, flattenKeys } from '@/core/data'

// ── Type inference ──────────────────────────────────────────
export type { InferRules, InferField } from '@/infer'

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
} from '@/types'

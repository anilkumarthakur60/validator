/**
 * The `Rule` facade — fluent constructors mirroring Laravel's
 * `Illuminate\Validation\Rule`.
 */

import { isEmpty } from '@/lib/helpers'
import type { ClosureRule, FieldRuleDefinition, RuleEntry, ValidationRuleObject } from '@/lib/types'
import { FOR_EACH, type ForEachLike } from '@/lib/ruleObjects/markers'
import { makeBuiltinRuleObject } from '@/lib/ruleObjects/delegating'
import { AnyOf } from '@/lib/ruleObjects/AnyOf'
import { Enum, type EnumSource } from '@/lib/ruleObjects/Enum'
import { Dimensions } from '@/lib/ruleObjects/Dimensions'
import { ExistsRule, UniqueRule } from '@/lib/ruleObjects/database'
import { FileRule } from '@/lib/ruleObjects/FileRule'
import { Password } from '@/lib/ruleObjects/Password'
import { StringRule } from '@/lib/ruleObjects/StringRule'
import { DateRule } from '@/lib/ruleObjects/DateRule'
import { EmailRule } from '@/lib/ruleObjects/EmailRule'

type Condition = boolean | (() => boolean)

const resolve = (condition: Condition): (() => boolean) =>
  typeof condition === 'function' ? condition : () => condition

const conditional = (
  active: () => boolean,
  message: string,
  failWhenEmpty: boolean,
): ValidationRuleObject => ({
  implicit: true,
  validate(_attribute: string, value: unknown, fail): void {
    if (!active()) return
    const empty = isEmpty(value)
    if (failWhenEmpty ? empty : !empty) fail(message)
  },
})

const REQUIRED = 'The :attribute field is required.'
const PROHIBITED = 'The :attribute field is prohibited.'

export const Rule = {
  in(values: readonly unknown[]): RuleEntry {
    return makeBuiltinRuleObject('in', values.map(String))
  },

  notIn(values: readonly unknown[]): RuleEntry {
    return makeBuiltinRuleObject('not_in', values.map(String))
  },

  contains(values: readonly unknown[]): RuleEntry {
    return makeBuiltinRuleObject('contains', values.map(String))
  },

  doesntContain(values: readonly unknown[]): RuleEntry {
    return makeBuiltinRuleObject('doesnt_contain', values.map(String))
  },

  requiredIf(condition: Condition): ValidationRuleObject {
    return conditional(resolve(condition), REQUIRED, true)
  },

  requiredUnless(condition: Condition): ValidationRuleObject {
    const active = resolve(condition)
    return conditional(() => !active(), REQUIRED, true)
  },

  prohibitedIf(condition: Condition): ValidationRuleObject {
    return conditional(resolve(condition), PROHIBITED, false)
  },

  prohibitedUnless(condition: Condition): ValidationRuleObject {
    const active = resolve(condition)
    return conditional(() => !active(), PROHIBITED, false)
  },

  excludeIf(condition: Condition): RuleEntry {
    return resolve(condition)() ? 'exclude' : noop
  },

  excludeUnless(condition: Condition): RuleEntry {
    return resolve(condition)() ? noop : 'exclude'
  },

  enum(source: EnumSource): Enum {
    return new Enum(source)
  },

  anyOf(rulesets: readonly FieldRuleDefinition[]): AnyOf {
    return new AnyOf(rulesets)
  },

  forEach(callback: (value: unknown, attribute: string) => FieldRuleDefinition): ForEachLike {
    return { [FOR_EACH]: true, resolve: callback }
  },

  exists(table: string, column?: string): ExistsRule {
    return new ExistsRule(table, column)
  },

  unique(table: string, column?: string): UniqueRule {
    return new UniqueRule(table, column)
  },

  dimensions(): Dimensions {
    return new Dimensions()
  },

  file(): FileRule {
    return FileRule.default()
  },

  password(min = 8): Password {
    return Password.min(min)
  },

  string(): StringRule {
    return new StringRule()
  },

  date(): DateRule {
    return new DateRule()
  },

  email(): EmailRule {
    return new EmailRule()
  },
}

const noop: ClosureRule = () => {
  /* intentional no-op */
}

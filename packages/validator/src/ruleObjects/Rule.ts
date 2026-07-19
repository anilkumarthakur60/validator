/**
 * The `Rule` facade — fluent constructors for the built-in rule objects.
 */

import { isEmpty } from '@/helpers'
import type { ClosureRule, FieldRuleDefinition, RuleEntry, ValidationRuleObject } from '@/types'
import { FOR_EACH, type ForEachLike } from '@/ruleObjects/markers'
import { makeBuiltinRuleObject } from '@/ruleObjects/delegating'
import { AnyOf } from '@/ruleObjects/AnyOf'
import { Enum, type EnumSource } from '@/ruleObjects/Enum'
import { Dimensions } from '@/ruleObjects/Dimensions'
import { ExistsRule, UniqueRule } from '@/ruleObjects/database'
import { InRule } from '@/ruleObjects/InRule'
import { FileRule } from '@/ruleObjects/FileRule'
import { Password } from '@/ruleObjects/Password'
import { StringRule } from '@/ruleObjects/StringRule'
import { DateRule } from '@/ruleObjects/DateRule'
import { EmailRule } from '@/ruleObjects/EmailRule'

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
  in(values: readonly unknown[]): InRule {
    return new InRule(values, 'in')
  },

  notIn(values: readonly unknown[]): InRule {
    return new InRule(values, 'not_in')
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

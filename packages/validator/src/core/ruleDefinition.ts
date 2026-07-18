/**
 * The contract every built-in rule module implements.
 *
 * Rules are pure decision functions over a {@link RuleContext}. Metadata flags
 * tell the engine how to treat each rule:
 *  - `implicit`: run even when the attribute is absent or empty.
 *  - `dependent`: the parameters reference other fields, so `*` wildcards in
 *    them are substituted against the current attribute before running.
 *  - `replace`: contributes message placeholder replacements (`:min`, `:other`…).
 */

import type { Replaceable, ReplacerContext, RuleContext } from '@/types'

export interface BuiltinDefinition {
  readonly validate: (ctx: RuleContext) => boolean | Promise<boolean>
  readonly implicit?: boolean
  readonly dependent?: boolean
  readonly replace?: (ctx: ReplacerContext) => Record<string, Replaceable>
}

export type RuleModule = Readonly<Record<string, BuiltinDefinition>>

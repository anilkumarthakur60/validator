/**
 * Type-aware size comparison rules: min, max, between, size, gt, gte, lt, lte.
 *
 * The "size" of a value depends on its kind (number → value, string → length,
 * array/object → count, file → kilobytes); the kind is derived from the
 * attribute's other rules via {@link Validator.getSizeType}.
 */

import { sizeOf } from '@/lib/helpers'
import { dotGet } from '@/lib/core/data'
import type { Replaceable, ReplacerContext, RuleContext } from '@/lib/types'
import type { RuleModule } from '@/lib/core/ruleDefinition'

const valueSize = (ctx: RuleContext): number => {
  const numericContext = ctx.validator.getSizeType(ctx.attribute) === 'numeric'
  return sizeOf(ctx.value, numericContext)
}

/** Resolve a gt/gte/lt/lte comparison operand (a field's size or a literal). */
const comparedSize = (ctx: RuleContext): number => {
  const numericContext = ctx.validator.getSizeType(ctx.attribute) === 'numeric'
  const reference = ctx.parameters[0] ?? ''
  const other = dotGet(ctx.data, reference)
  return other !== undefined ? sizeOf(other, numericContext) : Number(reference)
}

const param = (ctx: ReplacerContext, index: number): Replaceable => ctx.parameters[index] ?? ''

const comparisonValueReplacer = (ctx: ReplacerContext): Record<string, Replaceable> => {
  const numericContext = ctx.validator.getSizeType(ctx.attribute) === 'numeric'
  const reference = ctx.parameters[0] ?? ''
  const other = dotGet(ctx.data, reference)
  return { value: other !== undefined ? sizeOf(other, numericContext) : reference }
}

export const sizeRules: RuleModule = {
  size: {
    replace: (ctx) => ({ size: param(ctx, 0) }),
    validate: (ctx) => valueSize(ctx) === Number(ctx.parameters[0]),
  },

  min: {
    replace: (ctx) => ({ min: param(ctx, 0) }),
    validate: (ctx) => valueSize(ctx) >= Number(ctx.parameters[0]),
  },

  max: {
    replace: (ctx) => ({ max: param(ctx, 0) }),
    validate: (ctx) => valueSize(ctx) <= Number(ctx.parameters[0]),
  },

  between: {
    replace: (ctx) => ({ min: param(ctx, 0), max: param(ctx, 1) }),
    validate: (ctx) => {
      const size = valueSize(ctx)
      return size >= Number(ctx.parameters[0]) && size <= Number(ctx.parameters[1])
    },
  },

  gt: {
    dependent: true,
    replace: comparisonValueReplacer,
    validate: (ctx) => valueSize(ctx) > comparedSize(ctx),
  },
  gte: {
    dependent: true,
    replace: comparisonValueReplacer,
    validate: (ctx) => valueSize(ctx) >= comparedSize(ctx),
  },
  lt: {
    dependent: true,
    replace: comparisonValueReplacer,
    validate: (ctx) => valueSize(ctx) < comparedSize(ctx),
  },
  lte: {
    dependent: true,
    replace: comparisonValueReplacer,
    validate: (ctx) => valueSize(ctx) <= comparedSize(ctx),
  },
}

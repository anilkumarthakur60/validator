/**
 * Numeric rules (excluding size rules, which live in `size.ts`).
 * Rules: numeric, integer, decimal, digits, digits_between, max_digits,
 *          min_digits, multiple_of.
 */

import { decimalPlaces, digitCount, isInteger, isNumeric } from '@/helpers'
import type { Replaceable, ReplacerContext } from '@/types'
import type { RuleModule } from '@/core/ruleDefinition'

const param = (ctx: ReplacerContext, index: number): Replaceable => ctx.parameters[index] ?? ''

const allDigits = (value: unknown): boolean => /^\d+$/.test(String(value))

export const numberRules: RuleModule = {
  numeric: {
    validate: ({ value, parameters }) =>
      parameters[0] === 'strict'
        ? typeof value === 'number' && Number.isFinite(value)
        : isNumeric(value),
  },

  integer: {
    validate: ({ value, parameters }) =>
      parameters[0] === 'strict'
        ? typeof value === 'number' && Number.isInteger(value)
        : isInteger(value),
  },

  decimal: {
    replace: (ctx) => ({
      decimal: ctx.parameters.length > 1 ? `${param(ctx, 0)}-${param(ctx, 1)}` : param(ctx, 0),
    }),
    validate: ({ value, parameters }) => {
      if (!isNumeric(value)) return false
      const min = Number(parameters[0] ?? 0)
      const max = parameters[1] !== undefined ? Number(parameters[1]) : min
      const places = decimalPlaces(value)
      return places >= min && places <= max
    },
  },

  digits: {
    replace: (ctx) => ({ digits: param(ctx, 0) }),
    validate: ({ value, parameters }) =>
      allDigits(value) && String(value).length === Number(parameters[0]),
  },

  digits_between: {
    replace: (ctx) => ({ min: param(ctx, 0), max: param(ctx, 1) }),
    validate: ({ value, parameters }) => {
      if (!allDigits(value)) return false
      const length = String(value).length
      return length >= Number(parameters[0]) && length <= Number(parameters[1])
    },
  },

  max_digits: {
    replace: (ctx) => ({ max: param(ctx, 0) }),
    validate: ({ value, parameters }) =>
      isNumeric(value) && digitCount(value) <= Number(parameters[0]),
  },

  min_digits: {
    replace: (ctx) => ({ min: param(ctx, 0) }),
    validate: ({ value, parameters }) =>
      isNumeric(value) && digitCount(value) >= Number(parameters[0]),
  },

  multiple_of: {
    replace: (ctx) => ({ value: param(ctx, 0) }),
    validate: ({ value, parameters }) => {
      const divisor = Number(parameters[0])
      if (!isNumeric(value) || divisor === 0 || Number.isNaN(divisor)) return false
      const quotient = Number(value) / divisor
      return Math.abs(quotient - Math.round(quotient)) < 1e-9
    },
  },
}

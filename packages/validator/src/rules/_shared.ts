/**
 * Internal helpers shared across rule modules (cross-field comparison,
 * common replacer builders). Not part of the public API.
 */

import { isAccepted, isDeclined, isEmpty, parseDate, stringifyValue } from '@/helpers'
import { dotGet } from '@/core/data'
import type { Replaceable, ReplacerContext } from '@/types'

/** Loose equality between a field value and a string parameter. */
export const looseEquals = (value: unknown, parameter: string): boolean => {
  if (typeof value === 'boolean') {
    if (parameter === 'true' || parameter === '1') return value
    if (parameter === 'false' || parameter === '0') return !value
  }
  if (value === null || value === undefined) return parameter === ''
  return stringifyValue(value) === parameter
}

export const anyFieldEquals = (value: unknown, parameters: readonly string[]): boolean =>
  parameters.some((parameter) => looseEquals(value, parameter))

export const otherValue = (ctx: { data: Record<string, unknown> }, field: string): unknown =>
  dotGet(ctx.data, field)

export const isAcceptedValue = isAccepted
export const isDeclinedValue = isDeclined
export const fieldIsEmpty = isEmpty

/** `:other` + `:value` replacer (the other field's display name + current value). */
export const otherValueReplacer = (ctx: ReplacerContext): Record<string, Replaceable> => {
  const field = ctx.parameters[0] ?? ''
  return {
    other: ctx.validator.getDisplayableAttribute(field),
    value: ctx.validator.getDisplayableValue(field, dotGet(ctx.data, field)),
  }
}

/** `:other` + `:values` replacer (other field name + the expected values list). */
export const otherValuesReplacer = (ctx: ReplacerContext): Record<string, Replaceable> => {
  const field = ctx.parameters[0] ?? ''
  const values = ctx.parameters
    .slice(1)
    .map((value) => ctx.validator.getDisplayableValue(field, value))
  return { other: ctx.validator.getDisplayableAttribute(field), values: values.join(', ') }
}

/** `:values` replacer over a list of field references (display names, ` / `-joined). */
export const fieldListReplacer = (ctx: ReplacerContext): Record<string, Replaceable> => ({
  values: ctx.parameters.map((field) => ctx.validator.getDisplayableAttribute(field)).join(' / '),
})

/** `:values` replacer over literal parameter values (`, `-joined). */
export const literalValuesReplacer = (ctx: ReplacerContext): Record<string, Replaceable> => ({
  values: ctx.parameters.join(', '),
})

/** `:other` replacer (single referenced field's display name). */
export const otherFieldReplacer = (ctx: ReplacerContext): Record<string, Replaceable> => ({
  other: ctx.validator.getDisplayableAttribute(ctx.parameters[0] ?? ''),
})

/** `:date` replacer — literal when the param is a date, else the field's name. */
export const dateReplacer = (ctx: ReplacerContext): Record<string, Replaceable> => {
  const parameter = ctx.parameters[0] ?? ''
  return {
    date:
      parseDate(parameter) !== null ? parameter : ctx.validator.getDisplayableAttribute(parameter),
  }
}

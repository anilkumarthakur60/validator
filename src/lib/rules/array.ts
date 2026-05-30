/**
 * Array rules.
 * Rules: array, list, distinct, in_array, in_array_keys, contains,
 *          doesnt_contain.
 */

import { isPlainObject } from '@/lib/helpers'
import type { RuleModule } from '@/lib/core/ruleDefinition'
import { literalValuesReplacer, otherFieldReplacer } from '@/lib/rules/_shared'

const looseStringify = (value: unknown, ignoreCase: boolean): string => {
  const text = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value)
  return ignoreCase ? text.toLowerCase() : text
}

export const arrayRules: RuleModule = {
  array: {
    validate: ({ value, parameters }) => {
      if (Array.isArray(value)) {
        return parameters.length === 0 || value.every((_, i) => parameters.includes(String(i)))
      }
      if (isPlainObject(value)) {
        return (
          parameters.length === 0 || Object.keys(value).every((key) => parameters.includes(key))
        )
      }
      return false
    },
  },

  list: { validate: ({ value }) => Array.isArray(value) },

  distinct: {
    validate: ({ value, parameters, attributePattern, validator }) => {
      const ignoreCase = parameters.includes('ignore_case')
      const strict = parameters.includes('strict')
      const normalize = (item: unknown): string =>
        strict ? `${typeof item}:${looseStringify(item, false)}` : looseStringify(item, ignoreCase)

      // Direct array: ensure its own elements are unique.
      if (Array.isArray(value)) {
        const seen = value.map(normalize)
        return new Set(seen).size === seen.length
      }
      // Wildcard sibling form (`foo.*.id`): ensure this value is unique among siblings.
      if (attributePattern.includes('*')) {
        const siblings = validator.resolveWildcardValues(attributePattern).map(normalize)
        return siblings.filter((item) => item === normalize(value)).length <= 1
      }
      return true
    },
  },

  in_array: {
    dependent: true,
    replace: otherFieldReplacer,
    validate: ({ value, parameters, validator }) => {
      const pool = validator.resolveWildcardValues(parameters[0] ?? '')
      return pool.some((item) => item === value || String(item) === String(value))
    },
  },

  in_array_keys: {
    replace: literalValuesReplacer,
    validate: ({ value, parameters }) => {
      if (Array.isArray(value))
        return parameters.some((key) => /^\d+$/.test(key) && Number(key) < value.length)
      if (isPlainObject(value)) return parameters.some((key) => key in value)
      return false
    },
  },

  contains: {
    replace: literalValuesReplacer,
    validate: ({ value, parameters }) => {
      if (!Array.isArray(value)) return false
      const stringified = value.map((item) => String(item))
      return parameters.every((needle) => stringified.includes(needle))
    },
  },

  doesnt_contain: {
    replace: literalValuesReplacer,
    validate: ({ value, parameters }) => {
      if (!Array.isArray(value)) return false
      const stringified = value.map((item) => String(item))
      return !parameters.some((needle) => stringified.includes(needle))
    },
  },
}

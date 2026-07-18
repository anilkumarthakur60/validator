/**
 * Presence, requirement, prohibition, and exclusion rules.
 * Rules: required, required_*, filled, present, present_*, missing, missing_*,
 *          prohibited, prohibited_*, prohibits, accepted, accepted_if,
 *          declined, declined_if.
 *
 * Exclusion / flow rules (nullable, sometimes, bail, exclude*) are handled by
 * the engine itself and are not defined here.
 */

import { isEmpty } from '@/helpers'
import { dotHas } from '@/core/data'
import type { RuleModule } from '@/core/ruleDefinition'
import {
  anyFieldEquals,
  fieldListReplacer,
  isAcceptedValue,
  isDeclinedValue,
  literalValuesReplacer,
  looseEquals,
  otherFieldReplacer,
  otherValue,
  otherValueReplacer,
  otherValuesReplacer,
} from '@/rules/_shared'

const present = (data: Record<string, unknown>, attribute: string): boolean =>
  dotHas(data, attribute)

export const presenceRules: RuleModule = {
  required: {
    implicit: true,
    validate: ({ value }) => !isEmpty(value),
  },

  filled: {
    implicit: true,
    validate: ({ value, attribute, data }) => (present(data, attribute) ? !isEmpty(value) : true),
  },

  present: {
    implicit: true,
    validate: ({ attribute, data }) => present(data, attribute),
  },

  missing: {
    implicit: true,
    validate: ({ attribute, data }) => !present(data, attribute),
  },

  prohibited: {
    implicit: true,
    validate: ({ value }) => isEmpty(value),
  },

  // ── required_* ──────────────────────────────────────────
  required_if: {
    implicit: true,
    dependent: true,
    replace: otherValueReplacer,
    validate: ({ value, parameters, data }) => {
      const triggered = anyFieldEquals(
        otherValue({ data }, parameters[0] ?? ''),
        parameters.slice(1),
      )
      return triggered ? !isEmpty(value) : true
    },
  },

  required_if_accepted: {
    implicit: true,
    dependent: true,
    replace: otherFieldReplacer,
    validate: ({ value, parameters, data }) =>
      isAcceptedValue(otherValue({ data }, parameters[0] ?? '')) ? !isEmpty(value) : true,
  },

  required_if_declined: {
    implicit: true,
    dependent: true,
    replace: otherFieldReplacer,
    validate: ({ value, parameters, data }) =>
      isDeclinedValue(otherValue({ data }, parameters[0] ?? '')) ? !isEmpty(value) : true,
  },

  required_unless: {
    implicit: true,
    dependent: true,
    replace: otherValuesReplacer,
    validate: ({ value, parameters, data }) => {
      const matched = anyFieldEquals(otherValue({ data }, parameters[0] ?? ''), parameters.slice(1))
      return matched ? true : !isEmpty(value)
    },
  },

  required_with: {
    implicit: true,
    dependent: true,
    replace: fieldListReplacer,
    validate: ({ value, parameters, data }) =>
      parameters.some((field) => !isEmpty(otherValue({ data }, field))) ? !isEmpty(value) : true,
  },

  required_with_all: {
    implicit: true,
    dependent: true,
    replace: fieldListReplacer,
    validate: ({ value, parameters, data }) =>
      parameters.every((field) => !isEmpty(otherValue({ data }, field))) ? !isEmpty(value) : true,
  },

  required_without: {
    implicit: true,
    dependent: true,
    replace: fieldListReplacer,
    validate: ({ value, parameters, data }) =>
      parameters.some((field) => isEmpty(otherValue({ data }, field))) ? !isEmpty(value) : true,
  },

  required_without_all: {
    implicit: true,
    dependent: true,
    replace: fieldListReplacer,
    validate: ({ value, parameters, data }) =>
      parameters.every((field) => isEmpty(otherValue({ data }, field))) ? !isEmpty(value) : true,
  },

  required_array_keys: {
    implicit: true,
    // The parameters are literal array keys, not field references, so they
    // must not go through the display-attribute transform.
    replace: literalValuesReplacer,
    validate: ({ value, parameters }) => {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
      const keys = Object.keys(value)
      return parameters.every((key) => keys.includes(key))
    },
  },

  // ── present_* ───────────────────────────────────────────
  present_if: {
    implicit: true,
    dependent: true,
    replace: otherValueReplacer,
    validate: ({ attribute, parameters, data }) =>
      anyFieldEquals(otherValue({ data }, parameters[0] ?? ''), parameters.slice(1))
        ? present(data, attribute)
        : true,
  },

  present_unless: {
    implicit: true,
    dependent: true,
    replace: otherValueReplacer,
    validate: ({ attribute, parameters, data }) =>
      anyFieldEquals(otherValue({ data }, parameters[0] ?? ''), parameters.slice(1))
        ? true
        : present(data, attribute),
  },

  present_with: {
    implicit: true,
    dependent: true,
    replace: fieldListReplacer,
    validate: ({ attribute, parameters, data }) =>
      parameters.some((field) => present(data, field)) ? present(data, attribute) : true,
  },

  present_with_all: {
    implicit: true,
    dependent: true,
    replace: fieldListReplacer,
    validate: ({ attribute, parameters, data }) =>
      parameters.every((field) => present(data, field)) ? present(data, attribute) : true,
  },

  // ── missing_* ───────────────────────────────────────────
  missing_if: {
    implicit: true,
    dependent: true,
    replace: otherValueReplacer,
    validate: ({ attribute, parameters, data }) =>
      anyFieldEquals(otherValue({ data }, parameters[0] ?? ''), parameters.slice(1))
        ? !present(data, attribute)
        : true,
  },

  missing_unless: {
    implicit: true,
    dependent: true,
    replace: otherValueReplacer,
    validate: ({ attribute, parameters, data }) =>
      anyFieldEquals(otherValue({ data }, parameters[0] ?? ''), parameters.slice(1))
        ? true
        : !present(data, attribute),
  },

  missing_with: {
    implicit: true,
    dependent: true,
    replace: fieldListReplacer,
    validate: ({ attribute, parameters, data }) =>
      parameters.some((field) => present(data, field)) ? !present(data, attribute) : true,
  },

  missing_with_all: {
    implicit: true,
    dependent: true,
    replace: fieldListReplacer,
    validate: ({ attribute, parameters, data }) =>
      parameters.every((field) => present(data, field)) ? !present(data, attribute) : true,
  },

  // ── prohibited_* ────────────────────────────────────────
  prohibited_if: {
    implicit: true,
    dependent: true,
    replace: otherValueReplacer,
    validate: ({ value, parameters, data }) =>
      anyFieldEquals(otherValue({ data }, parameters[0] ?? ''), parameters.slice(1))
        ? isEmpty(value)
        : true,
  },

  prohibited_if_accepted: {
    implicit: true,
    dependent: true,
    replace: otherFieldReplacer,
    validate: ({ value, parameters, data }) =>
      isAcceptedValue(otherValue({ data }, parameters[0] ?? '')) ? isEmpty(value) : true,
  },

  prohibited_if_declined: {
    implicit: true,
    dependent: true,
    replace: otherFieldReplacer,
    validate: ({ value, parameters, data }) =>
      isDeclinedValue(otherValue({ data }, parameters[0] ?? '')) ? isEmpty(value) : true,
  },

  prohibited_unless: {
    implicit: true,
    dependent: true,
    replace: otherValuesReplacer,
    validate: ({ value, parameters, data }) =>
      anyFieldEquals(otherValue({ data }, parameters[0] ?? ''), parameters.slice(1))
        ? true
        : isEmpty(value),
  },

  prohibits: {
    implicit: true,
    dependent: true,
    replace: otherFieldReplacer,
    validate: ({ value, parameters, data }) => {
      if (isEmpty(value)) return true
      return parameters.every((field) => isEmpty(otherValue({ data }, field)))
    },
  },

  // ── accepted / declined ─────────────────────────────────
  accepted: {
    implicit: true,
    validate: ({ value }) => isAcceptedValue(value),
  },

  accepted_if: {
    implicit: true,
    dependent: true,
    replace: otherValueReplacer,
    validate: ({ value, parameters, data }) =>
      looseEquals(otherValue({ data }, parameters[0] ?? ''), parameters[1] ?? '')
        ? isAcceptedValue(value)
        : true,
  },

  declined: {
    implicit: true,
    validate: ({ value }) => isDeclinedValue(value),
  },

  declined_if: {
    implicit: true,
    dependent: true,
    replace: otherValueReplacer,
    validate: ({ value, parameters, data }) =>
      looseEquals(otherValue({ data }, parameters[0] ?? ''), parameters[1] ?? '')
        ? isDeclinedValue(value)
        : true,
  },
}

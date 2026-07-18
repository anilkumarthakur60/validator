/**
 * Utility & comparison rules.
 * Rules: confirmed, same, different, in, not_in, json, ip, ipv4, ipv6,
 *          mac_address, current_password, exists, unique.
 *
 * `exists`, `unique`, and `current_password` defer to pluggable async
 * resolvers; when no resolver is configured they pass with a one-time warning.
 */

import {
  isString,
  isValidIP,
  isValidIPv4,
  isValidIPv6,
  isValidJson,
  isValidMacAddress,
} from '@/helpers'
import { dotGet } from '@/core/data'
import type { DatabaseQuery, RuleContext } from '@/types'
import type { RuleModule } from '@/core/ruleDefinition'
import { otherFieldReplacer } from '@/rules/_shared'

const warned = new Set<string>()
const warnOnce = (rule: string): void => {
  if (warned.has(rule)) return
  warned.add(rule)
  console.warn(`[validation] No resolver configured for "${rule}"; the rule passes by default.`)
}

const lastSegment = (attribute: string): string => attribute.slice(attribute.lastIndexOf('.') + 1)

const buildQuery = (ctx: RuleContext): DatabaseQuery => {
  const table = ctx.parameters[0] ?? ''
  const columnParam = ctx.parameters[1]
  const column =
    columnParam && columnParam.toUpperCase() !== 'NULL' ? columnParam : lastSegment(ctx.attribute)
  const values = Array.isArray(ctx.value) ? ctx.value : [ctx.value]
  return { table, column, value: ctx.value, values, attribute: ctx.attribute, wheres: [] }
}

export const utilityRules: RuleModule = {
  confirmed: {
    dependent: true,
    validate: ({ value, parameters, attribute, data }) => {
      const field = parameters[0] ?? `${attribute}_confirmation`
      return value === dotGet(data, field)
    },
  },

  same: {
    dependent: true,
    replace: otherFieldReplacer,
    validate: ({ value, parameters, data }) => value === dotGet(data, parameters[0] ?? ''),
  },

  different: {
    dependent: true,
    replace: otherFieldReplacer,
    validate: ({ value, parameters, data }) => value !== dotGet(data, parameters[0] ?? ''),
  },

  in: {
    validate: ({ value, parameters, attribute, validator }) => {
      if (Array.isArray(value) && validator.hasRule(attribute, 'array')) {
        return value.every((item) => !Array.isArray(item) && parameters.includes(String(item)))
      }
      return !Array.isArray(value) && parameters.includes(String(value))
    },
  },

  not_in: {
    validate: ({ value, parameters }) =>
      !Array.isArray(value) && !parameters.includes(String(value)),
  },

  json: { validate: ({ value }) => isString(value) && isValidJson(value) },
  ip: { validate: ({ value }) => isString(value) && isValidIP(value) },
  ipv4: { validate: ({ value }) => isString(value) && isValidIPv4(value) },
  ipv6: { validate: ({ value }) => isString(value) && isValidIPv6(value) },
  mac_address: { validate: ({ value }) => isString(value) && isValidMacAddress(value) },

  current_password: {
    validate: ({ value, parameters, validator }) => {
      const resolver = validator.getResolvers().currentPassword
      if (!resolver) {
        warnOnce('current_password')
        return true
      }
      return isString(value) ? Promise.resolve(resolver(value, parameters[0])) : false
    },
  },

  exists: {
    validate: (ctx) => {
      const resolver = ctx.validator.getResolvers().exists
      if (!resolver) {
        warnOnce('exists')
        return true
      }
      return Promise.resolve(resolver(buildQuery(ctx)))
    },
  },

  unique: {
    validate: (ctx) => {
      const resolver = ctx.validator.getResolvers().unique
      if (!resolver) {
        warnOnce('unique')
        return true
      }
      return Promise.resolve(resolver(buildQuery(ctx)))
    },
  },
}

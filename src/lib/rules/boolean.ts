/**
 * Boolean rule. (`accepted`/`declined` and their `_if` variants live in
 * `presence.ts` because they are implicit.)
 */

import { isBooleanLike } from '@/lib/helpers'
import type { RuleModule } from '@/lib/core/ruleDefinition'

export const booleanRules: RuleModule = {
  boolean: {
    validate: ({ value, parameters }) =>
      parameters[0] === 'strict' ? value === true || value === false : isBooleanLike(value),
  },
}

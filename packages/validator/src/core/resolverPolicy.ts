/**
 * Policy for resolver-backed rules (`exists`, `unique`, `active_url`,
 * `current_password`) when no resolver is configured.
 *
 * The default (`'pass'`) keeps Laravel-frontend ergonomics: the rule passes
 * and a one-time warning is logged. Security-sensitive apps can opt into
 * `'fail'` (the field fails validation) or `'throw'` (a hard error naming the
 * rule and the missing resolver) via {@link Validator.onMissingResolver}.
 */

/** Engine behavior when a resolver-backed rule has no resolver configured. */
export type MissingResolverBehavior = 'pass' | 'fail' | 'throw'

let behavior: MissingResolverBehavior = 'pass'

const warned = new Set<string>()

/** Set the global missing-resolver behavior (see {@link Validator.onMissingResolver}). */
export const setMissingResolverBehavior = (next: MissingResolverBehavior): void => {
  behavior = next
}

/**
 * The outcome for a resolver-backed rule whose resolver is missing: `true`
 * (pass, with a one-time warning), `false` (fail), or a thrown `Error` naming
 * the rule and the resolver to register.
 */
export const missingResolverOutcome = (rule: string, resolver: string): boolean => {
  if (behavior === 'throw') {
    throw new Error(
      `[validation] No "${resolver}" resolver is configured for the "${rule}" rule. ` +
        `Register one with Validator.setGlobalResolvers() or withResolvers().`,
    )
  }
  if (behavior === 'fail') return false
  if (!warned.has(rule)) {
    warned.add(rule)
    console.warn(`[validation] No resolver configured for "${rule}"; the rule passes by default.`)
  }
  return true
}

/**
 * Compile-time type inference for rule schemas.
 *
 * Given a `Validator.make(data, rules)` call where `rules` is captured as a
 * `const` literal, {@link InferRules} maps the (Laravel-style) rule strings to
 * the TypeScript shape of the validated data — so `validated()`/`safe()` return
 * a precisely-typed object instead of `Record<string, unknown>`.
 *
 * Supported inference:
 *  - base type per field: `string|email|url|uuid|date|ip → string`,
 *    `integer|numeric|decimal → number`, `boolean|accepted|declined → boolean`,
 *    `array → unknown[]`, otherwise `unknown`.
 *  - `nullable` widens the leaf with `| null`.
 *  - a field is optional unless its rules include `required` (or `present`).
 *  - dotted keys (`author.name`) become nested objects; `*` segments
 *    (`users.*.email`) become arrays.
 *
 * Non-string rule entries (rule objects / closures) contribute no token
 * information and fall back to `unknown`, which is always safe.
 *
 * Note: the engine validates but does not coerce — inferred types reflect each
 * rule's *intended* type. This is exact for already-typed inputs (e.g. JSON
 * payloads); for string-form inputs (HTML forms) a numeric/boolean field's
 * runtime value may still be a string, so cast at the edge if needed.
 */

import type { FieldRuleDefinition, RulesSchema, ValidationData } from '@/types'

/* ── string / token utilities ─────────────────────────────── */

/** Split `S` by delimiter `D` into a union of the pieces. */
type SplitUnion<S extends string, D extends string> = S extends `${infer H}${D}${infer T}`
  ? H | SplitUnion<T, D>
  : S

/** The rule name of a token, dropping any `:params` suffix. */
type TokenName<T extends string> = T extends `${infer N}:${string}` ? N : T

/** The set of rule names present in a single rule-definition value. */
type Tokens<D> = D extends string
  ? TokenName<SplitUnion<D, '|'>>
  : D extends readonly (infer E)[]
    ? E extends string
      ? TokenName<SplitUnion<E, '|'>>
      : never
    : never

/** Whether the rule definition `D` contains the rule `Name`. */
type Has<D, Name extends string> = Name extends Tokens<D> ? true : false

/* ── leaf type from a field's rules ───────────────────────── */

type BaseType<D> =
  Has<D, 'array'> extends true
    ? unknown[]
    : Has<D, 'boolean'> extends true
      ? boolean
      : Has<D, 'accepted'> extends true
        ? boolean
        : Has<D, 'declined'> extends true
          ? boolean
          : Has<D, 'integer'> extends true
            ? number
            : Has<D, 'numeric'> extends true
              ? number
              : Has<D, 'decimal'> extends true
                ? number
                : Has<D, 'string'> extends true
                  ? string
                  : Has<D, 'email'> extends true
                    ? string
                    : Has<D, 'url'> extends true
                      ? string
                      : Has<D, 'uuid'> extends true
                        ? string
                        : Has<D, 'date'> extends true
                          ? string
                          : Has<D, 'ip'> extends true
                            ? string
                            : unknown

/** The leaf TS type for a field, accounting for `nullable`. */
type Leaf<D> = Has<D, 'nullable'> extends true ? BaseType<D> | null : BaseType<D>

/** Whether the field is optional (no `required`/`present` rule). */
type IsOptional<D> =
  Has<D, 'required'> extends true ? false : Has<D, 'present'> extends true ? false : true

/* ── path expansion (dots + wildcards) ────────────────────── */

/** Split a dotted key path into a tuple of segments. */
type SplitPath<S extends string> = S extends `${infer H}.${infer T}` ? [H, ...SplitPath<T>] : [S]

/** Build a nested type from a segment list; `*` segments become arrays. */
type FromSegments<Segs extends readonly string[], L, Opt extends boolean> = Segs extends [
  infer H extends string,
  ...infer T extends string[],
]
  ? H extends '*'
    ? FromSegments<T, L, Opt>[]
    : T extends []
      ? Opt extends true
        ? Partial<Record<H, L>>
        : Record<H, L>
      : Record<H, FromSegments<T, L, Opt>>
  : L

/* ── assembly ─────────────────────────────────────────────── */

type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never

/** Flatten an intersection into a single readable object type. */
type Prettify<T> = T extends object ? { [K in keyof T]: Prettify<T[K]> } & {} : T

/**
 * Infer the validated-data shape from a rules schema literal.
 * Falls back to {@link ValidationData} when `R` is not a literal.
 */
type InferResult<R extends RulesSchema> = Prettify<
  UnionToIntersection<
    {
      [K in keyof R & string]: FromSegments<SplitPath<K>, Leaf<R[K]>, IsOptional<R[K]>>
    }[keyof R & string]
  >
>

export type InferRules<R extends RulesSchema> = string extends keyof R
  ? ValidationData
  : InferResult<R> extends ValidationData
    ? InferResult<R>
    : ValidationData

/** Re-export for convenience when a caller wants the leaf type of one field. */
export type InferField<D extends FieldRuleDefinition> = Leaf<D>

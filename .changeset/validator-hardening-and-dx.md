---
'@anil-labs/validator': minor
---

Hardening and DX improvements (all backward-compatible; defaults unchanged):

- **Strict missing-resolver mode** — `Validator.onMissingResolver('pass' | 'fail' | 'throw')`
  configures what happens when a resolver-backed rule (`exists`, `unique`, `active_url`,
  `current_password`) runs without a configured resolver: `'pass'` (default) passes with a
  one-time warning, `'fail'` fails the field with the rule's normal message, `'throw'` throws
  an `Error` naming the rule and the missing resolver. New `MissingResolverBehavior` type export.
- **`timezone` rule parameters** — `timezone:all` (same as bare `timezone`) and
  `timezone:<Region>` (e.g. `timezone:Africa`) restricting identifiers to a region prefix,
  backed by `Intl.supportedValuesOf('timeZone')` with an Intl-constructor fallback. The
  unimplementable `timezone:per_country,…` variant now throws a clear "not supported" error.
- **Strict enum/in membership** — `Enum.strict()`, `Rule.in([...]).strict()` and
  `Rule.notIn([...]).strict()` require an exact type-and-value (`===`) match instead of the
  default loose `String(a) === String(b)` comparison. New `InRule` class export.
- **Rule-parse memo cache** — string rule definitions are parsed once and memoized (bounded
  FIFO cache, 500 entries, invalidated by `registerRule`), making repeated validations of the
  same schema (e.g. per-keystroke form validation) ~39x faster on the parsing hot path.
  Cached parses are deep-frozen; object/closure rule entries are never cached.
- **Literal-union inference for `in:`** — a field whose rules contain `in:a,b,c` now infers
  the validated type `'a' | 'b' | 'c'` instead of `unknown` (numeric/boolean/array rules
  still take precedence).

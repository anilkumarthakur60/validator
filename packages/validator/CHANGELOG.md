# @anil-labs/validator

## 0.3.0

### Minor Changes

- 81f7687: Hardening and DX improvements (all backward-compatible; defaults unchanged):

  - **Strict missing-resolver mode**  `Validator.onMissingResolver('pass' | 'fail' | 'throw')`
    configures what happens when a resolver-backed rule (`exists`, `unique`, `active_url`,
    `current_password`) runs without a configured resolver: `'pass'` (default) passes with a
    one-time warning, `'fail'` fails the field with the rule's normal message, `'throw'` throws
    an `Error` naming the rule and the missing resolver. New `MissingResolverBehavior` type export.
  - **`timezone` rule parameters**  `timezone:all` (same as bare `timezone`) and
    `timezone:<Region>` (e.g. `timezone:Africa`) restricting identifiers to a region prefix,
    backed by `Intl.supportedValuesOf('timeZone')` with an Intl-constructor fallback. The
    unimplementable `timezone:per_country,…` variant now throws a clear "not supported" error.
  - **Strict enum/in membership**  `Enum.strict()`, `Rule.in([...]).strict()` and
    `Rule.notIn([...]).strict()` require an exact type-and-value (`===`) match instead of the
    default loose `String(a) === String(b)` comparison. New `InRule` class export.
  - **Rule-parse memo cache**  string rule definitions are parsed once and memoized (bounded
    FIFO cache, 500 entries, invalidated by `registerRule`), making repeated validations of the
    same schema (e.g. per-keystroke form validation) ~39x faster on the parsing hot path.
    Cached parses are deep-frozen; object/closure rule entries are never cached.
  - **Literal-union inference for `in:`**  a field whose rules contain `in:a,b,c` now infers
    the validated type `'a' | 'b' | 'c'` instead of `unknown` (numeric/boolean/array rules
    still take precedence).

## 0.2.0

### Minor Changes

- 13a9cca: Laravel-parity fixes for presence, sizing, parsing, messages, dates, UUIDs, and numeric rules. Ten audited divergences from Laravel's validator semantics are corrected:

  - `required`, `filled`, and the whole presence family now treat whitespace-only strings as empty (Laravel trims strings for presence checks); sizing rules still see the untrimmed length.
  - Raw numbers are only sized numerically when the field has a numeric-type rule (`numeric`/`integer`/`decimal`); otherwise they are sized by string length with string-size message wording, so `{age: 1000000}` with `min:10` now fails like Laravel.
  - Pipe-string rules containing `regex:`/`not_regex:` patterns with `|` (e.g. `'required|regex:/^a|b$/'`) are re-merged instead of being mis-split; unresolvable patterns throw a clear error pointing to array syntax.
  - Message placeholder replacement inserts values literally, so inputs containing `$&`, `$'`, or `$1` no longer corrupt messages.
  - `required_array_keys` lists its keys literally (comma-joined) instead of running them through the display-attribute transform.
  - `date_format` rejects impossible calendar dates (e.g. `2021-02-31`) and honors backslash-escaped literal format characters.
  - `uuid:<version>` rejects the nil UUID; bare `uuid` still accepts it.
  - `not_in` is now the exact negation of `in`, so array values whose items are outside the list pass.
  - Booleans size like PHP's `strlen((string)$value)`: `true` → 1, `false` → 0, so `true` passes `min:1`.
  - `decimal:` counts true decimal places for values in scientific notation (`1e-7` → 7 places).

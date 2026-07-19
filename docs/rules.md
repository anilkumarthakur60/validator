# Available rules

Every built-in validation rule is implemented. Rules are written as
`name` or `name:param1,param2`, combined with `|` or as array entries.

[[toc]]

## Booleans

### accepted

Must be `"yes"`, `"on"`, `1`, `"1"`, `true`, or `"true"`.

### accepted_if

`accepted_if:other,value,...` — must be accepted when `other` equals a value.

### boolean

Castable to boolean: `true`, `false`, `1`, `0`, `"1"`, `"0"`. Use
`boolean:strict` to accept only real booleans.

### declined

Must be `"no"`, `"off"`, `0`, `"0"`, `false`, or `"false"`.

### declined_if

`declined_if:other,value,...` — must be declined when `other` equals a value.

## Strings

### active_url

A valid URL. With an `activeUrl` resolver, the host is checked for DNS records.

### alpha

Only letters. `alpha:ascii` restricts to `a-z`/`A-Z`.

### alpha_dash

Letters, numbers, dashes, underscores. `alpha_dash:ascii` for ASCII only.

### alpha_num

Letters and numbers. `alpha_num:ascii` for ASCII only.

### ascii

Only 7-bit ASCII characters.

### confirmed

Must match `{field}_confirmation` (or `confirmed:other` for a custom field).

### current_password

Must match the authenticated user's password (via the `currentPassword`
resolver). `current_password:guard` passes the guard name.

### different

`different:field` — must differ from another field.

### doesnt_start_with

`doesnt_start_with:foo,bar` — must not start with any of the values.

### doesnt_end_with

`doesnt_end_with:foo,bar` — must not end with any of the values.

### email

`email` (RFC by default), or styles: `email:rfc,strict,dns,spoof,filter,filter_unicode`.
See also the fluent [`Rule.email()`](/api#rule-email).

### ends_with

`ends_with:foo,bar` — must end with one of the values.

### enum

`Rule.enum(values)` — must be one of an array or TS enum's values. Comparison
is loose by default (`String(a) === String(b)`, Laravel `in_array` parity), so
a numeric enum also matches its string form; `Rule.enum(values).strict()`
requires an exact type-and-value match (`===`).

### hex_color

A valid hex color (`#fff`, `#ffffff`, `#ffffffff`).

### in

`in:foo,bar` or `Rule.in([...])`. Combined with `array`, every element must be
in the list. Comparison is loose by default; `Rule.in([...]).strict()` (and
`Rule.notIn([...]).strict()`) require an exact `===` match.

### ip / ipv4 / ipv6 {#ip}

A valid IP address (any / v4 / v6).

### json

A valid JSON string.

### lowercase / uppercase {#lowercase}

Must be entirely lower- / upper-case.

### mac_address

A valid MAC address.

### not_in

`not_in:foo,bar` or `Rule.notIn([...])`.

### not_regex

`not_regex:/pattern/` — must **not** match (PHP-style delimited pattern).

### regex

`regex:/pattern/` — must match a PHP-style delimited pattern. Patterns
containing `|` are safest in array syntax (`['required', 'regex:/^a|b$/']`);
in pipe strings the parser re-merges most such patterns and throws a clear
error when it cannot.

### same

`same:field` — must equal another field.

### starts_with

`starts_with:foo,bar` — must start with one of the values.

### string

Must be a string. Add `nullable` to also allow `null`. See fluent
[`Rule.string()`](/api#rule-string).

### ulid

A valid ULID.

### url

A valid URL. `url:http,https` restricts the protocol.

### uuid

A valid UUID. `uuid:4` requires a specific version — the nil UUID
(`00000000-…`) only passes the bare `uuid` rule, never a versioned one.

## Numbers

### between

`between:min,max` — size between min and max (inclusive); type-aware.

### decimal

`decimal:2` or `decimal:2,4` — numeric with the given decimal places.

### digits

`digits:n` — exactly `n` digits.

### digits_between

`digits_between:min,max` — digit count within range.

### gt / gte / lt / lte {#gt}

`gt:field|value` (and friends) — compare size against another field or a number.

### integer

An integer. `integer:strict` rejects numeric strings.

### max / min {#max}

`max:n` / `min:n` — size at most / at least `n`; type-aware. Numbers are sized
by numeric value only when the field also has a numeric-type rule (`numeric`,
`integer`, `decimal`); otherwise values are sized as string length, like Laravel.

### max_digits / min_digits {#max_digits}

`max_digits:n` / `min_digits:n` — digit-count bounds.

### multiple_of

`multiple_of:n` — must be a multiple of `n`.

### numeric

Numeric. `numeric:strict` accepts only number types.

### size

`size:n` — exact size (string length, number value, array count, file KB).

## Arrays

### array

A plain object/array. `array:key1,key2` restricts allowed keys.

### contains

`Rule.contains([...])` — array contains **all** of the given values.

### distinct

No duplicate values. Options: `distinct:strict`, `distinct:ignore_case`.

### doesnt_contain

`Rule.doesntContain([...])` — array contains **none** of the values.

### in_array

`in_array:other.*` — value exists among another field's values.

### in_array_keys

`in_array_keys:key1,key2` — array has at least one of the keys.

### list

An array with consecutive `0..n-1` keys.

### required_array_keys

`required_array_keys:foo,bar` — array must contain the given keys.

## Dates

### after / after_or_equal {#after}

`after:date|field` — must be after the date (literal, `today`/`tomorrow`/etc.,
or another field). See fluent [`Rule.date()`](/api#rule-date).

### before / before_or_equal {#before}

`before:date|field` — must be before the date.

### date

A valid, parseable date.

### date_equals

`date_equals:date` — equal to the given date.

### date_format

`date_format:Y-m-d` — matches one of the given PHP-style formats. Impossible
calendar dates (e.g. `2021-02-31`) are rejected, and `\`-escaped characters in
the format are treated as literals.

### timezone

A valid timezone identifier (e.g. `Asia/Kathmandu`), case-insensitively.
`timezone:all` is the same check; `timezone:<Region>` (e.g. `timezone:Africa`,
`timezone:America`) additionally requires the identifier to live in that
region. Laravel's `timezone:per_country,CC` variant needs a country database
and is **not** supported — it throws an error instead of silently passing.

## Files

### dimensions

`dimensions:min_width=100,ratio=3/2` — image dimension constraints. See
[`Rule.dimensions()`](/api#rule-dimensions).

### encoding

`encoding:utf-8` — string/file matches the encoding.

### extensions

`extensions:jpg,png` — user-assigned file extension.

### file

A successfully uploaded `File`.

### image

An image (jpg, jpeg, png, bmp, gif, webp). `image:allow_svg` permits SVG.

### mimes

`mimes:jpg,png` — extension-based MIME check.

### mimetypes

`mimetypes:image/*` — MIME-type check (wildcards allowed).

## Database

### exists

`exists:table,column` or `Rule.exists('table', 'column')`. Uses the `exists`
resolver.

### unique

`unique:table,column` or `Rule.unique('table')`. Supports `.ignore(id)`,
`.where(col, val)`, `.withoutTrashed()`. Uses the `unique` resolver.

## Utilities

### anyOf

`Rule.anyOf([ruleset, ...])` — passes if the value satisfies any ruleset.

### bail {#bail}

Stop running a field's rules after the first failure.

### exclude {#exclude}

Always remove the field from `validated()`.

### exclude_if {#exclude_if}

`exclude_if:other,value` — remove if `other` equals value. (Or
`Rule.excludeIf(bool|fn)`.)

### exclude_unless {#exclude_unless}

`exclude_unless:other,value` — remove unless `other` equals value.

### exclude_with {#exclude_with}

`exclude_with:other` — remove if `other` is present.

### exclude_without {#exclude_without}

`exclude_without:other` — remove if `other` is absent.

### filled

Must not be empty **when present**.

### missing / missing_if / missing_unless / missing_with / missing_with_all {#missing}

Field must be absent (optionally conditioned on other fields).

### nullable

The field may be `null` (skips later rules for `null`).

### present / present_if / present_unless / present_with / present_with_all {#present}

Field must exist in the input (may be empty), optionally conditioned.

### prohibited / prohibited_if / prohibited_if_accepted / prohibited_if_declined / prohibited_unless {#prohibited}

Field must be missing or empty, optionally conditioned.

### prohibits

`prohibits:other,...` — if this field is present, the others must be empty.

### required

Must be present and not empty. Whitespace-only strings count as empty
(Laravel's trim semantics).

### required_if / required_if_accepted / required_if_declined / required_unless {#required_if}

Conditionally required based on another field. (`Rule.requiredIf(bool|fn)` for
logic-based conditions.)

### required_with / required_with_all / required_without / required_without_all {#required_with}

Required based on the presence of other fields.

### sometimes

Only validate the field when it is present in the data.

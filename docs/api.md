# API reference

[[toc]]

## Validator

```ts
Validator.make<const R>(data, rules: R, messages?, attributes?): Validator<InferRules<R>>
Validator.setGlobalResolvers(resolvers): void
```

When `rules` is a literal, the validated-data methods (`validated()`,
`validate()`, `safe().all()`) are typed via [`InferRules`](/guide/type-inference).

### Configuration (chainable)

| Method | Description |
| --- | --- |
| `withResolvers(resolvers)` | Merge async resolvers |
| `setCustomMessages(messages)` | Merge custom messages |
| `setAttributeNames(attributes)` | Merge display names |
| `setValueMap(map)` | Friendly `:value` replacements |
| `stopOnFirstFailure(stop = true)` | Halt after the first failing attribute |
| `after(cb \| cb[] \| { __invoke })` | Post-validation hooks |
| `sometimes(field \| fields[], rules, condition)` | Conditionally add rules |

### Execution

| Sync | Async | Returns |
| --- | --- | --- |
| `passes()` | `passesAsync()` | `boolean` |
| `fails()` | `failsAsync()` | `boolean` |
| `validate()` | `validateAsync()` | validated data, or throws `ValidationException` |

### Results

| Method | Returns |
| --- | --- |
| `errors()` / `messages()` | [`MessageBag`](#messagebag) |
| `validated()` | validated subset of the data (typed — see [Type inference](/guide/type-inference)) |
| `safe()` | [`ValidatedInput`](#validatedinput) |
| `getData()` | a copy of the input data |

### Type inference {#inferrules}

```ts
import { type InferRules } from '@anil-labs/validator'

type T = InferRules<typeof rules> // shape of the validated data
```

See the [Type inference guide](/guide/type-inference) for the full mapping.

## MessageBag {#messagebag}

```ts
add(key, message): this
merge(bagOrRecord): this
has(key?): boolean      // wildcard-aware
hasAny(keys): boolean
missing(key): boolean
any(): boolean
first(key?): string
get(key): string[]      // wildcard-aware
all(): string[]
keys(): string[]
messages(): Record<string, string[]>
toArray(): Record<string, string[]>
isEmpty(): boolean
isNotEmpty(): boolean
count(): number
```

## ValidatedInput {#validatedinput}

```ts
all(): Record<string, unknown>
only(keys): Record<string, unknown>
except(keys): Record<string, unknown>
has(key): boolean       // dot-aware
get(key, fallback?): unknown
merge(extra): ValidatedInput
[Symbol.iterator]()     // iterable of [key, value]
```

## ValidationException {#validationexception}

Thrown by `validate()` / `validateAsync()` on failure.

```ts
exception.status // 422
exception.errorBag // 'default'
exception.errors() // Record<string, string[]>
exception.validator // the Validator instance
exception.message // "First message. (and N more errors)"
```

## Rule facade

```ts
import { Rule } from '@anil-labs/validator'

Rule.in(values) / Rule.notIn(values)
Rule.contains(values) / Rule.doesntContain(values)
Rule.requiredIf(bool | fn) / Rule.requiredUnless(...)
Rule.prohibitedIf(...) / Rule.prohibitedUnless(...)
Rule.excludeIf(...) / Rule.excludeUnless(...)
Rule.enum(arrayOrEnum)
Rule.anyOf([ruleset, ...])
Rule.forEach((value, attribute) => rules)
Rule.exists(table, column?) / Rule.unique(table, column?)
Rule.dimensions()
Rule.file()
Rule.password(min?)
Rule.string()
Rule.date()
Rule.email()
```

### Rule.string() {#rule-string}

```ts
Rule.string()
  .min(n).max(n).between(a, b).exactly(n)
  .alpha(ascii?).alphaDash(ascii?).alphaNumeric(ascii?).ascii()
  .lowercase().uppercase()
  .startsWith(...).endsWith(...).doesntStartWith(...).doesntEndWith(...)
  .when(cond, then, otherwise?).unless(cond, then, otherwise?)
```

### Rule.date() {#rule-date}

```ts
Rule.date()
  .format(...formats)
  .after(date).before(date).afterOrEqual(date).beforeOrEqual(date)
  .afterToday().beforeToday().todayOrAfter().todayOrBefore()
  .when(...).unless(...)
```

### Rule.email() {#rule-email}

```ts
Rule.email()
  .rfcCompliant(strict?)
  .strict()
  .validateMxRecord()
  .preventSpoofing()
  .withNativeValidation(allowUnicode?)
```

### Rule.dimensions() {#rule-dimensions}

```ts
Rule.dimensions()
  .width(n).height(n)
  .minWidth(n).maxWidth(n).minHeight(n).maxHeight(n)
  .ratio(n | 'w/h').minRatio(...).maxRatio(...).ratioBetween(min, max)
```

## Password

```ts
Password.min(n).max(n).letters().mixedCase().numbers().symbols()
Password.min(n).uncompromised(threshold = 0) // needs `compromised` resolver
Password.defaults(factory?) // configure / retrieve the app default
Password.min(n).rules([...extraRules])
Password.min(n).toPasswordRulesString()
```

## FileRule

```ts
FileRule.types(['mp3', 'wav']).min('1kb').max('10mb')
FileRule.image({ allowSvg?: boolean })
FileRule.default()
  .min(size).max(size).size(size) // number (KB) or '10mb'
  .extensions([...]).encoding('utf-8')
  .dimensions(Rule.dimensions()...)
```

## Enum

```ts
new Enum(arrayOrEnum)
  .only([...]).except([...])
  .when(cond, then, otherwise?)
```

## registerRule {#registerrule}

```ts
registerRule(name: string, definition: BuiltinDefinition): void
getBuiltinRule(name): BuiltinDefinition | undefined
hasBuiltinRule(name): boolean
```

### BuiltinDefinition

```ts
interface BuiltinDefinition {
  validate(ctx: RuleContext): boolean | Promise<boolean>
  implicit?: boolean // run even when empty/absent
  dependent?: boolean // parameters are field names (`*` substituted)
  replace?(ctx: ReplacerContext): Record<string, string | number>
}
```

### RuleContext {#rulecontext}

```ts
interface RuleContext {
  attribute: string // e.g. "users.0.email"
  attributePattern: string // e.g. "users.*.email"
  value: unknown
  parameters: readonly string[]
  data: Record<string, unknown>
  validator: Validator
}
```

## Resolvers

```ts
interface ValidationResolvers {
  exists?(query: DatabaseQuery): boolean | Promise<boolean>
  unique?(query: DatabaseQuery): boolean | Promise<boolean>
  compromised?(password: string): number | Promise<number>
  activeUrl?(host: string): boolean | Promise<boolean>
  currentPassword?(password: string, guard?: string): boolean | Promise<boolean>
}
```

## Rule object classes

Every builder on the `Rule` facade has a directly-exported class for advanced
composition and typing:

```ts
import {
  AnyOf, // Rule.anyOf(...) — passes when any branch passes
  CompositeRule, // combine several rule objects into one
  DateRule, // Rule.date()
  Dimensions, // Rule.dimensions()
  EmailRule, // Rule.email()
  ExistsRule, // Rule.exists() — resolver-backed
  StringRule, // Rule.string()
  UniqueRule, // Rule.unique() — resolver-backed
} from '@anil-labs/validator'
```

## Fluent builder

```ts
import { validation, ValidationBuilder } from '@anil-labs/validator'

validation.required().email().toRule() // (value) => true | string
validation.extend(name, fn) // register a named rule
validation.hasRule(name) / validation.removeRule(name) / validation.customRuleNames()
```

`ValidationBuilder` is the exported class behind `validation`, useful for
typing helpers that accept or return chains.

See [Fluent builder](/guide/fluent-builder) for the full method list.

## Helpers & utilities

```ts
import { helpers, dotGet, dotHas, dotSet, expandWildcards, flattenKeys, defaultMessages } from '@anil-labs/validator'

helpers.isValidEmailRfc('a@b.com')
dotGet({ a: { b: 1 } }, 'a.b') // 1
flattenKeys({ a: { b: 1 } }) // ['a.b'] — dotted leaf keys
```

### Message formatting

```ts
import { formatMessage, defaultMessages, FALLBACK_MESSAGE } from '@anil-labs/validator'
```

`formatMessage(template, replacements)` performs the `:attribute` / `:min` /
`:input`-style placeholder substitution used by the engine (values are
inserted literally, so `$&`-style patterns in data can't corrupt messages).
`FALLBACK_MESSAGE` is the template used when a rule has no message entry.

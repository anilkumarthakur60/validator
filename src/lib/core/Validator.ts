/**
 * The dataset validator — a faithful, strongly-typed validation engine.
 *
 * It validates a whole data object against a rules schema, supporting dot and
 * `*` wildcard notation, cross-field/dependent rules, implicit rules, `bail`,
 * `nullable`, `sometimes`, `exclude*`, conditional `sometimes()` rules,
 * `after()` hooks, custom messages/attributes, and async rules via resolvers.
 */

import {
  defaultMessages,
  FALLBACK_MESSAGE,
  formatMessage,
  type MessageTemplate,
  type SizeType,
} from '@/lib/messages'
import { isFile, isPlainObject, stringifyValue } from '@/lib/helpers'
import type {
  AfterCallback,
  InvokableAfter,
  CustomAttributes,
  CustomMessages,
  FieldRuleDefinition,
  Replaceable,
  ReplacerContext,
  RuleContext,
  RulesSchema,
  ValidationData,
  ValidationResolvers,
} from '@/lib/types'
import { MessageBag } from '@/lib/core/MessageBag'
import { ValidatedInput } from '@/lib/core/ValidatedInput'
import { ValidationException } from '@/lib/core/ValidationException'
import { dotGet, dotHas, dotSet, expandWildcards, replaceWildcardParameter } from '@/lib/core/data'
import { FILE_RULES, getBuiltinRule, NUMERIC_RULES, requireBuiltinRule } from '@/lib/core/registry'
import {
  parseFieldRules,
  type ParsedBuiltinRule,
  type ParsedClosureRule,
  type ParsedObjectRule,
  type ParsedRule,
} from '@/lib/core/RuleParser'

/** Conditional rule registered via {@link Validator.sometimes}. */
interface SometimesSpec {
  readonly attributes: readonly string[]
  readonly rules: ParsedRule[]
  readonly condition: (data: ValidationData, item: unknown) => boolean
}

/** A parsed rule that the engine actually executes (forEach is resolved away). */
type ExecutableRule = ParsedBuiltinRule | ParsedObjectRule | ParsedClosureRule

/** Normalized rules for a single, fully-expanded attribute. */
interface AttributeRules {
  readonly attribute: string
  readonly pattern: string
  readonly explicitKeys: readonly string[]
  readonly rules: ExecutableRule[]
  readonly ruleNames: ReadonlySet<string>
  readonly nullable: boolean
  readonly sometimes: boolean
  readonly bail: boolean
  readonly excludes: ParsedBuiltinRule[]
}

let globalResolvers: ValidationResolvers = {}

export class Validator {
  private readonly data: ValidationData
  private readonly schema: RulesSchema
  private customMessages: CustomMessages
  private customAttributes: CustomAttributes
  private valueMap: Record<string, Record<string, string>> = {}
  private resolvers: ValidationResolvers
  private readonly sometimesSpecs: SometimesSpec[] = []
  private readonly afterCallbacks: AfterCallback[] = []
  private stopOnFirstFailureFlag = false

  private bag = new MessageBag()
  private normalized: AttributeRules[] | null = null
  private excludedAttributes = new Set<string>()

  constructor(
    data: ValidationData,
    rules: RulesSchema,
    messages: CustomMessages = {},
    attributes: CustomAttributes = {},
  ) {
    this.data = structuredCloneSafe(data)
    this.schema = rules
    this.customMessages = { ...messages }
    this.customAttributes = { ...attributes }
    this.resolvers = { ...globalResolvers }
  }

  /** Create a validator instance (parity with `Validator::make`). */
  static make(
    data: ValidationData,
    rules: RulesSchema,
    messages: CustomMessages = {},
    attributes: CustomAttributes = {},
  ): Validator {
    return new Validator(data, rules, messages, attributes)
  }

  /** Register resolvers globally for every subsequently-created validator. */
  static setGlobalResolvers(resolvers: ValidationResolvers): void {
    globalResolvers = { ...resolvers }
  }

  // ── configuration ───────────────────────────────────────

  withResolvers(resolvers: ValidationResolvers): this {
    this.resolvers = { ...this.resolvers, ...resolvers }
    return this
  }

  setCustomMessages(messages: CustomMessages): this {
    this.customMessages = { ...this.customMessages, ...messages }
    return this
  }

  setAttributeNames(attributes: CustomAttributes): this {
    this.customAttributes = { ...this.customAttributes, ...attributes }
    return this
  }

  /** Configure user-friendly `:value` replacements. */
  setValueMap(map: Record<string, Record<string, string>>): this {
    this.valueMap = map
    return this
  }

  stopOnFirstFailure(stop = true): this {
    this.stopOnFirstFailureFlag = stop
    return this
  }

  /**
   * Register "after validation" hook(s): a single callback, an array of
   * callbacks, or invokable objects (`{ __invoke }`).
   */
  after(
    callback: AfterCallback | InvokableAfter | readonly (AfterCallback | InvokableAfter)[],
  ): this {
    const entries: readonly (AfterCallback | InvokableAfter)[] = Array.isArray(callback)
      ? (callback as readonly (AfterCallback | InvokableAfter)[])
      : [callback as AfterCallback | InvokableAfter]
    for (const entry of entries) {
      this.afterCallbacks.push(typeof entry === 'function' ? entry : (v) => entry.__invoke(v))
    }
    return this
  }

  sometimes(
    attribute: string | readonly string[],
    rules: FieldRuleDefinition,
    condition: (data: ValidationData, item: unknown) => boolean,
  ): this {
    this.sometimesSpecs.push({
      attributes: typeof attribute === 'string' ? [attribute] : attribute,
      rules: parseFieldRules(rules),
      condition,
    })
    this.normalized = null
    return this
  }

  // ── execution (sync) ────────────────────────────────────

  passes(): boolean {
    this.run(false)
    return this.bag.isEmpty()
  }

  fails(): boolean {
    return !this.passes()
  }

  /** Validate; throw {@link ValidationException} on failure, else return validated data. */
  validate(): ValidationData {
    if (this.fails()) throw new ValidationException(this)
    return this.validated()
  }

  // ── execution (async) ───────────────────────────────────

  async passesAsync(): Promise<boolean> {
    await this.run(true)
    return this.bag.isEmpty()
  }

  async failsAsync(): Promise<boolean> {
    return !(await this.passesAsync())
  }

  async validateAsync(): Promise<ValidationData> {
    if (await this.failsAsync()) throw new ValidationException(this)
    return this.validated()
  }

  // ── results ─────────────────────────────────────────────

  errors(): MessageBag {
    return this.bag
  }

  messages(): MessageBag {
    return this.bag
  }

  validated(): ValidationData {
    let result: ValidationData = {}
    // `requireNormalized()` yields unique attributes, so no de-dup is needed.
    for (const entry of this.requireNormalized()) {
      if (this.excludedAttributes.has(entry.attribute)) continue
      if (!dotHas(this.data, entry.attribute)) continue
      result = dotSet(result, entry.attribute, dotGet(this.data, entry.attribute))
    }
    return result
  }

  safe(): ValidatedInput {
    return new ValidatedInput(this.validated())
  }

  getData(): ValidationData {
    return structuredCloneSafe(this.data)
  }

  // ── helpers exposed to rules ────────────────────────────

  getResolvers(): ValidationResolvers {
    return this.resolvers
  }

  getValue(attribute: string): unknown {
    return dotGet(this.data, attribute)
  }

  resolveWildcardValues(pattern: string): unknown[] {
    return expandWildcards(this.data, pattern).map((entry) => dotGet(this.data, entry.attribute))
  }

  hasRule(attribute: string, ruleName: string): boolean {
    const entry = this.requireNormalized().find((item) => item.attribute === attribute)
    return entry?.ruleNames.has(ruleName) ?? false
  }

  getSizeType(attribute: string): SizeType {
    const entry = this.requireNormalized().find((item) => item.attribute === attribute)
    const names = entry?.ruleNames
    if (names) {
      for (const name of names) if (NUMERIC_RULES.has(name)) return 'numeric'
      if (names.has('array')) return 'array'
      for (const name of names) if (FILE_RULES.has(name)) return 'file'
    }
    const value = dotGet(this.data, attribute)
    if (typeof value === 'number') return 'numeric'
    if (Array.isArray(value)) return 'array'
    if (isFile(value)) return 'file'
    return 'string'
  }

  getDisplayableAttribute(attribute: string): string {
    const custom = this.customAttributes[attribute]
    if (custom !== undefined) return custom
    const wildcard = attribute.replace(/\.\d+(?=\.|$)/g, '.*')
    const wildcardCustom = this.customAttributes[wildcard]
    if (wildcardCustom !== undefined) return wildcardCustom
    return attribute.replace(/_/g, ' ')
  }

  getDisplayableValue(attribute: string, value: unknown): string {
    const perAttribute = this.valueMap[attribute]
    if (perAttribute) {
      const mapped = perAttribute[String(value)]
      if (mapped !== undefined) return mapped
    }
    if (typeof value === 'boolean') return value ? 'true' : 'false'
    if (value === null || value === undefined) return 'empty'
    return stringifyValue(value)
  }

  // ── normalization ───────────────────────────────────────

  private requireNormalized(): AttributeRules[] {
    this.normalized ??= this.normalize()
    return this.normalized
  }

  private normalize(): AttributeRules[] {
    const merged = new Map<string, AttributeRules>()

    const conditionalByAttribute = this.resolveSometimes()
    const consumed = new Set<string>()

    for (const [pattern, definition] of Object.entries(this.schema)) {
      const parsed = parseFieldRules(definition)
      for (const expanded of expandWildcards(this.data, pattern)) {
        const extra = conditionalByAttribute.get(expanded.attribute)
        if (extra) consumed.add(expanded.attribute)
        const entry = this.buildAttributeRules(expanded.attribute, pattern, expanded.explicitKeys, [
          ...parsed,
          ...(extra?.rules ?? []),
        ])
        const existing = merged.get(expanded.attribute)
        if (existing) {
          existing.rules.push(...entry.rules)
          existing.excludes.push(...entry.excludes)
        } else {
          merged.set(expanded.attribute, entry)
        }
      }
    }

    // Conditional rules for attributes not present in the schema. (Attributes
    // also in the schema were already merged above and are marked `consumed`.)
    for (const [attribute, spec] of conditionalByAttribute) {
      if (consumed.has(attribute)) continue
      merged.set(
        attribute,
        this.buildAttributeRules(attribute, attribute, spec.explicitKeys, spec.rules),
      )
    }

    return [...merged.values()]
  }

  private resolveSometimes(): Map<string, { rules: ParsedRule[]; explicitKeys: string[] }> {
    const byAttribute = new Map<string, { rules: ParsedRule[]; explicitKeys: string[] }>()
    for (const spec of this.sometimesSpecs) {
      for (const attribute of spec.attributes) {
        for (const expanded of expandWildcards(this.data, attribute)) {
          const item = this.itemForAttribute(expanded.attribute)
          if (!spec.condition(this.data, item)) continue
          const existing = byAttribute.get(expanded.attribute)
          if (existing) {
            existing.rules.push(...spec.rules)
          } else {
            byAttribute.set(expanded.attribute, {
              rules: [...spec.rules],
              explicitKeys: [...expanded.explicitKeys],
            })
          }
        }
      }
    }
    return byAttribute
  }

  /** The enclosing array element for a wildcard attribute (for `sometimes`). */
  private itemForAttribute(attribute: string): unknown {
    const parent = attribute.split('.').slice(0, -1).join('.')
    return parent === '' ? this.data : dotGet(this.data, parent)
  }

  private buildAttributeRules(
    attribute: string,
    pattern: string,
    explicitKeys: readonly string[],
    parsed: readonly ParsedRule[],
  ): AttributeRules {
    const rules: ExecutableRule[] = []
    const excludes: ParsedBuiltinRule[] = []
    const ruleNames = new Set<string>()
    let nullable = false
    let sometimes = false
    let bail = false

    // Expand `Rule.forEach` entries (recursively) into concrete rules.
    const expand = (entries: readonly ParsedRule[]): ExecutableRule[] =>
      entries.flatMap((rule) =>
        rule.kind === 'foreach'
          ? expand(parseFieldRules(rule.rule.resolve(dotGet(this.data, attribute), attribute)))
          : [rule],
      )

    for (const rule of expand(parsed)) {
      if (rule.kind !== 'builtin') {
        rules.push(rule)
        continue
      }
      const substituted = this.substituteParameters(rule, explicitKeys)
      switch (substituted.name) {
        case 'nullable':
          nullable = true
          break
        case 'sometimes':
          sometimes = true
          break
        case 'bail':
          bail = true
          break
        case 'exclude':
        case 'exclude_if':
        case 'exclude_unless':
        case 'exclude_with':
        case 'exclude_without':
          excludes.push(substituted)
          break
        default:
          rules.push(substituted)
          ruleNames.add(substituted.name)
      }
    }

    return {
      attribute,
      pattern,
      explicitKeys,
      rules,
      ruleNames,
      nullable,
      sometimes,
      bail,
      excludes,
    }
  }

  private substituteParameters(
    rule: ParsedBuiltinRule,
    explicitKeys: readonly string[],
  ): ParsedBuiltinRule {
    if (!rule.parameters.some((parameter) => parameter.includes('*'))) return rule
    return {
      ...rule,
      parameters: rule.parameters.map((parameter) =>
        replaceWildcardParameter(parameter, explicitKeys),
      ),
    }
  }

  // ── the validation engine ───────────────────────────────

  private run(async_: false): void
  private run(async_: true): Promise<void>
  private run(async_: boolean): void | Promise<void> {
    this.bag = new MessageBag()
    this.excludedAttributes = new Set()
    const entries = this.requireNormalized()

    // First pass: compute exclusions so dependent rules see a consistent view.
    for (const entry of entries) {
      if (this.isExcluded(entry)) this.excludedAttributes.add(entry.attribute)
    }

    if (async_) return this.runAsync(entries)
    this.runSync(entries)
    return undefined
  }

  private isExcluded(entry: AttributeRules): boolean {
    for (const exclude of entry.excludes) {
      const other = exclude.parameters[0] ?? ''
      const matches = looseFieldEquals(dotGet(this.data, other), exclude.parameters[1])
      if (exclude.name === 'exclude') return true
      if (exclude.name === 'exclude_if' && matches) return true
      if (exclude.name === 'exclude_unless' && !matches) return true
      if (exclude.name === 'exclude_with' && dotHas(this.data, other)) return true
      if (exclude.name === 'exclude_without' && !dotHas(this.data, other)) return true
    }
    return false
  }

  private runSync(entries: readonly AttributeRules[]): void {
    for (const entry of entries) {
      if (this.excludedAttributes.has(entry.attribute)) continue
      if (this.skipForSometimes(entry)) continue
      for (const rule of entry.rules) {
        const outcome = this.evaluate(entry, rule)
        if (outcome instanceof Promise) {
          throw new Error(
            `[validation] Rule on "${entry.attribute}" is asynchronous; use validateAsync()/passesAsync().`,
          )
        }
        if (this.afterRule(entry, outcome)) break
      }
      if (this.stopOnFirstFailureFlag && this.bag.isNotEmpty()) break
    }
    void this.runAfterCallbacks(false)
  }

  private async runAsync(entries: readonly AttributeRules[]): Promise<void> {
    for (const entry of entries) {
      if (this.excludedAttributes.has(entry.attribute)) continue
      if (this.skipForSometimes(entry)) continue
      for (const rule of entry.rules) {
        const outcome = await this.evaluate(entry, rule)
        if (this.afterRule(entry, outcome)) break
      }
      if (this.stopOnFirstFailureFlag && this.bag.isNotEmpty()) break
    }
    await this.runAfterCallbacks(true)
  }

  private skipForSometimes(entry: AttributeRules): boolean {
    return entry.sometimes && !dotHas(this.data, entry.attribute)
  }

  /** Returns `true` when remaining rules for the attribute should be skipped (bail). */
  private afterRule(entry: AttributeRules, passed: boolean): boolean {
    if (!passed && entry.bail && this.bag.has(entry.attribute)) return true
    return false
  }

  private evaluate(entry: AttributeRules, rule: ExecutableRule): boolean | Promise<boolean> {
    if (rule.kind === 'builtin') return this.evaluateBuiltin(entry, rule)
    if (rule.kind === 'object') return this.evaluateObject(entry, rule)
    return this.evaluateClosure(entry, rule)
  }

  private evaluateBuiltin(
    entry: AttributeRules,
    rule: ParsedBuiltinRule,
  ): boolean | Promise<boolean> {
    const definition = requireBuiltinRule(rule.name)
    const value = dotGet(this.data, entry.attribute)
    if (!this.shouldValidate(entry, value, Boolean(definition.implicit))) return true

    const context = this.buildContext(entry, rule, value)
    const result = definition.validate(context)
    if (result instanceof Promise) {
      return result.then((passed) => {
        if (!passed) this.addBuiltinFailure(entry, rule)
        return passed
      })
    }
    if (!result) this.addBuiltinFailure(entry, rule)
    return result
  }

  private evaluateObject(
    entry: AttributeRules,
    parsed: ParsedObjectRule,
  ): boolean | Promise<boolean> {
    const rule = parsed.rule
    const value = dotGet(this.data, entry.attribute)
    if (!this.shouldValidate(entry, value, Boolean(rule.implicit))) return true

    if (isDataAware(rule)) rule.setData(this.data)
    if (isValidatorAware(rule)) rule.setValidator(this)

    let passed = true
    const fail = (message: string): void => {
      passed = false
      this.bag.add(entry.attribute, this.formatExternalMessage(entry, message))
    }
    const outcome = rule.validate(entry.attribute, value, fail)
    if (outcome instanceof Promise) return outcome.then(() => passed)
    return passed
  }

  private evaluateClosure(
    entry: AttributeRules,
    parsed: ParsedClosureRule,
  ): boolean | Promise<boolean> {
    const value = dotGet(this.data, entry.attribute)
    if (!this.shouldValidate(entry, value, false)) return true

    let passed = true
    const fail = (message: string): void => {
      passed = false
      this.bag.add(entry.attribute, this.formatExternalMessage(entry, message))
    }
    const outcome = parsed.rule(entry.attribute, value, fail)
    if (outcome instanceof Promise) return outcome.then(() => passed)
    return passed
  }

  /** Whether the field is validatable: present-or-implicit, with nullable handling. */
  private shouldValidate(entry: AttributeRules, value: unknown, implicit: boolean): boolean {
    if (entry.nullable && value === null && !implicit) return false
    if (typeof value === 'string' && value.trim() === '') return implicit
    return dotHas(this.data, entry.attribute) || implicit
  }

  private buildContext(
    entry: AttributeRules,
    rule: ParsedBuiltinRule,
    value: unknown,
  ): RuleContext {
    return {
      attribute: entry.attribute,
      attributePattern: entry.pattern,
      value,
      parameters: rule.parameters,
      data: this.data,
      validator: this,
    }
  }

  // ── message resolution ──────────────────────────────────

  private addBuiltinFailure(entry: AttributeRules, rule: ParsedBuiltinRule): void {
    this.bag.add(
      entry.attribute,
      this.composeMessage(
        entry.attribute,
        entry.pattern,
        entry.explicitKeys,
        rule.name,
        rule.parameters,
      ),
    )
  }

  /** Build the message a built-in rule would produce (used by rule objects). */
  buildBuiltinMessage(
    attribute: string,
    ruleName: string,
    parameters: readonly string[] = [],
  ): string {
    return this.composeMessage(attribute, attribute, [], ruleName, parameters)
  }

  private composeMessage(
    attribute: string,
    pattern: string,
    explicitKeys: readonly string[],
    ruleName: string,
    parameters: readonly string[],
  ): string {
    const template = this.findTemplate(attribute, pattern, ruleName)
    const definition = getBuiltinRule(ruleName)
    const replacerContext: ReplacerContext = {
      attribute,
      displayAttribute: this.getDisplayableAttribute(attribute),
      rule: ruleName,
      parameters,
      value: dotGet(this.data, attribute),
      data: this.data,
      validator: this,
    }
    const replacements: Record<string, Replaceable> = {
      attribute: replacerContext.displayAttribute,
      input: this.getDisplayableValue(attribute, replacerContext.value),
      ...this.positionalReplacements(explicitKeys),
      ...(definition?.replace ? definition.replace(replacerContext) : {}),
    }
    return formatMessage(template, replacements)
  }

  private findTemplate(attribute: string, pattern: string, ruleName: string): string {
    const custom =
      this.customMessages[`${attribute}.${ruleName}`] ??
      this.customMessages[`${pattern}.${ruleName}`] ??
      this.customMessages[ruleName]
    if (custom !== undefined) return custom
    const fallback: MessageTemplate = defaultMessages[ruleName] ?? FALLBACK_MESSAGE
    return this.selectTyped(attribute, fallback)
  }

  private selectTyped(attribute: string, template: MessageTemplate): string {
    if (typeof template === 'string') return template
    // A typed template (object) is only ever defined for size rules, so the
    // value's size type selects the right wording.
    return template[this.getSizeType(attribute)]
  }

  private formatExternalMessage(entry: AttributeRules, message: string): string {
    return formatMessage(message, {
      attribute: this.getDisplayableAttribute(entry.attribute),
      ...this.positionalReplacements(entry.explicitKeys),
    })
  }

  private positionalReplacements(explicitKeys: readonly string[]): Record<string, Replaceable> {
    const numeric = explicitKeys.filter((key) => /^\d+$/.test(key)).map(Number)
    const ordinals = ['', 'second-', 'third-', 'fourth-', 'fifth-']
    const result: Record<string, Replaceable> = {}
    numeric.forEach((index, depth) => {
      const prefix = ordinals[depth] ?? `${depth + 1}th-`
      result[`${prefix}index`] = index
      result[`${prefix}position`] = index + 1
      if (depth === 0) result['ordinal-position'] = toOrdinal(index + 1)
    })
    return result
  }

  private runAfterCallbacks(async_: boolean): void | Promise<void> {
    if (this.afterCallbacks.length === 0) return undefined
    if (!async_) {
      for (const callback of this.afterCallbacks) void callback(this)
      return undefined
    }
    return (async () => {
      for (const callback of this.afterCallbacks) await callback(this)
    })()
  }
}

// ── module-private helpers ────────────────────────────────

const looseFieldEquals = (value: unknown, parameter: string | undefined): boolean => {
  if (parameter === undefined) return false
  if (typeof value === 'boolean') {
    if (parameter === 'true' || parameter === '1') return value
    if (parameter === 'false' || parameter === '0') return !value
  }
  return String(value) === parameter
}

const isDataAware = (rule: object): rule is { setData(data: ValidationData): void } =>
  'setData' in rule && typeof rule.setData === 'function'

const isValidatorAware = (rule: object): rule is { setValidator(validator: Validator): void } =>
  'setValidator' in rule && typeof rule.setValidator === 'function'

const toOrdinal = (n: number): string => {
  const suffixes = ['th', 'st', 'nd', 'rd']
  const value = n % 100
  return `${n}${suffixes[(value - 20) % 10] ?? suffixes[value] ?? suffixes[0]}`
}

const structuredCloneSafe = (data: ValidationData): ValidationData => {
  const clone = (value: unknown): unknown => {
    if (value instanceof Date || isFile(value)) return value
    if (Array.isArray(value)) return value.map(clone)
    if (isPlainObject(value)) {
      const result: Record<string, unknown> = {}
      for (const [key, val] of Object.entries(value)) result[key] = clone(val)
      return result
    }
    return value
  }
  return clone(data) as ValidationData
}

/**
 * Fluent file rule object (Laravel's `Illuminate\Validation\Rules\File`).
 *
 *   FileRule.types(['mp3', 'wav']).min('1kb').max('10mb')
 *   FileRule.image().max(2048).dimensions(Rule.dimensions().maxWidth(1000))
 *
 * Composes built-in file checks and reports each failure with its native
 * message.
 */

import { isFile } from '@/lib/helpers'
import type { FailFn, RuleContext, ValidationRuleObject, ValidatorAwareRule } from '@/lib/types'
import type { Validator } from '@/lib/core/Validator'
import { getBuiltinRule } from '@/lib/core/registry'
import { type Dimensions } from '@/lib/ruleObjects/Dimensions'

interface BuiltinCheck {
  readonly name: string
  readonly parameters: readonly string[]
}

const SIZE_UNITS: Readonly<Record<string, number>> = {
  kb: 1,
  mb: 1024,
  gb: 1_048_576,
  tb: 1_073_741_824,
}

/** Convert a size (number of kb, or `"10mb"`) into kilobytes. */
const toKilobytes = (size: number | string): number => {
  if (typeof size === 'number') return size
  const match = /^(\d+(?:\.\d+)?)\s*(kb|mb|gb|tb)?$/i.exec(size.trim())
  if (!match) return Number(size)
  const amount = Number(match[1])
  const unit = (match[2] ?? 'kb').toLowerCase()
  return amount * (SIZE_UNITS[unit] ?? 1)
}

export class FileRule implements ValidationRuleObject, ValidatorAwareRule {
  private readonly checks: BuiltinCheck[] = []
  private dimensionsRule: Dimensions | null = null
  private isImage = false
  private allowSvg = false
  private validator: Validator | null = null

  static types(extensions: readonly string[]): FileRule {
    const rule = new FileRule()
    rule.checks.push({ name: 'mimes', parameters: [...extensions] })
    return rule
  }

  static image(options: { allowSvg?: boolean } = {}): FileRule {
    const rule = new FileRule()
    rule.isImage = true
    rule.allowSvg = options.allowSvg ?? false
    return rule
  }

  static default(): FileRule {
    return new FileRule()
  }

  setValidator(validator: Validator): void {
    this.validator = validator
  }

  extensions(extensions: readonly string[]): this {
    this.checks.push({ name: 'extensions', parameters: [...extensions] })
    return this
  }

  min(size: number | string): this {
    this.checks.push({ name: 'min', parameters: [String(toKilobytes(size))] })
    return this
  }

  max(size: number | string): this {
    this.checks.push({ name: 'max', parameters: [String(toKilobytes(size))] })
    return this
  }

  size(size: number | string): this {
    this.checks.push({ name: 'size', parameters: [String(toKilobytes(size))] })
    return this
  }

  encoding(encoding: string): this {
    this.checks.push({ name: 'encoding', parameters: [encoding] })
    return this
  }

  dimensions(rule: Dimensions): this {
    this.dimensionsRule = rule
    return this
  }

  async validate(attribute: string, value: unknown, fail: FailFn): Promise<void> {
    const validator = this.validator
    if (validator === null) return
    if (!isFile(value)) {
      fail('The :attribute field must be a file.')
      return
    }
    if (this.isImage) {
      const imageCtx = this.context(validator, attribute, value, this.allowSvg ? ['allow_svg'] : [])
      const def = getBuiltinRule('image')
      if (def && !(await def.validate(imageCtx))) fail('The :attribute field must be an image.')
    }
    for (const check of this.checks) {
      const definition = getBuiltinRule(check.name)
      if (!definition) continue
      const passed = await definition.validate(
        this.context(validator, attribute, value, check.parameters),
      )
      if (!passed) fail(validator.buildBuiltinMessage(attribute, check.name, check.parameters))
    }
    if (this.dimensionsRule) {
      this.dimensionsRule.setValidator(validator)
      await this.dimensionsRule.validate(attribute, value, fail)
    }
  }

  private context(
    validator: Validator,
    attribute: string,
    value: unknown,
    parameters: readonly string[],
  ): RuleContext {
    return {
      attribute,
      attributePattern: attribute,
      value,
      parameters,
      data: validator.getData(),
      validator,
    }
  }
}

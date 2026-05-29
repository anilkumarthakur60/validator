/**
 * Fluent `exists` / `unique` rule objects. They build a normalized
 * {@link DatabaseQuery} and defer to the configured async resolver.
 */

import type {
  DatabaseQuery,
  FailFn,
  ValidationRuleObject,
  ValidatorAwareRule,
} from '@/lib/types'
import type { Validator } from '@/lib/core/Validator'

const lastSegment = (attribute: string): string => attribute.split('.').pop() ?? attribute

abstract class DatabaseRule implements ValidatorAwareRule {
  protected validator: Validator | null = null
  protected readonly wheres: Array<{ column: string; value: unknown }> = []
  protected readonly table: string
  protected readonly column: string | null

  protected constructor(table: string, column: string | null) {
    this.table = table
    this.column = column
  }

  setValidator(validator: Validator): void {
    this.validator = validator
  }

  where(column: string, value: unknown): this {
    this.wheres.push({ column, value })
    return this
  }

  protected buildQuery(attribute: string, value: unknown, extra: Partial<DatabaseQuery> = {}): DatabaseQuery {
    return {
      table: this.table,
      column: this.column ?? lastSegment(attribute),
      value,
      values: Array.isArray(value) ? value : [value],
      attribute,
      wheres: this.wheres,
      ...extra,
    }
  }
}

export class ExistsRule extends DatabaseRule implements ValidationRuleObject {
  constructor(table: string, column?: string) {
    super(table, column ?? null)
  }

  async validate(attribute: string, value: unknown, fail: FailFn): Promise<void> {
    const resolver = this.validator?.getResolvers().exists
    if (!resolver) return
    const ok = await resolver(this.buildQuery(attribute, value))
    if (!ok) fail('The selected :attribute is invalid.')
  }
}

export class UniqueRule extends DatabaseRule implements ValidationRuleObject {
  private ignoreSpec: { id: unknown; column: string } | null = null

  constructor(table: string, column?: string) {
    super(table, column ?? null)
  }

  ignore(id: unknown, column = 'id'): this {
    this.ignoreSpec = { id, column }
    return this
  }

  withoutTrashed(column = 'deleted_at'): this {
    return this.where(column, null)
  }

  async validate(attribute: string, value: unknown, fail: FailFn): Promise<void> {
    const resolver = this.validator?.getResolvers().unique
    if (!resolver) return
    const query = this.ignoreSpec
      ? this.buildQuery(attribute, value, { ignore: this.ignoreSpec })
      : this.buildQuery(attribute, value)
    const ok = await resolver(query)
    if (!ok) fail('The :attribute has already been taken.')
  }
}

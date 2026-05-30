/**
 * Fluent date rule builder.
 *
 *   Rule.date().format('Y-m-d').afterToday()
 *
 * Reference dates may be literal strings, relative keywords (`today`), or the
 * name of another field under validation.
 */

import { CompositeRule } from '@/lib/ruleObjects/CompositeRule'

export class DateRule extends CompositeRule {
  constructor() {
    super()
    this.add('date')
  }

  format(...formats: string[]): this {
    return this.add('date_format', ...formats)
  }
  after(date: string): this {
    return this.add('after', date)
  }
  before(date: string): this {
    return this.add('before', date)
  }
  afterOrEqual(date: string): this {
    return this.add('after_or_equal', date)
  }
  beforeOrEqual(date: string): this {
    return this.add('before_or_equal', date)
  }
  afterToday(): this {
    return this.add('after', 'today')
  }
  beforeToday(): this {
    return this.add('before', 'today')
  }
  todayOrAfter(): this {
    return this.add('after_or_equal', 'today')
  }
  todayOrBefore(): this {
    return this.add('before_or_equal', 'today')
  }
}

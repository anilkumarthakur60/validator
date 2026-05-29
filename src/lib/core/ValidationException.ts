/**
 * Thrown when `validate()`/`validateAsync()` fails, mirroring Laravel's
 * `Illuminate\Validation\ValidationException`.
 */

import type { Validator } from '@/lib/core/Validator'
import type { MessageBag } from '@/lib/core/MessageBag'

export class ValidationException extends Error {
  /** The validator instance that produced the failure. */
  readonly validator: Validator
  /** HTTP-style status code (parity with Laravel's default). */
  readonly status: number
  /** Optional named error bag. */
  readonly errorBag: string

  constructor(validator: Validator, status = 422, errorBag = 'default') {
    super(ValidationException.summarize(validator.errors()))
    this.name = 'ValidationException'
    this.validator = validator
    this.status = status
    this.errorBag = errorBag
    Object.setPrototypeOf(this, ValidationException.prototype)
  }

  /** All error messages keyed by attribute (parity with Laravel's `errors()`). */
  errors(): Record<string, string[]> {
    return this.validator.errors().messages()
  }

  private static summarize(bag: MessageBag): string {
    const first = bag.first()
    const remaining = bag.count() - 1
    if (first === '') return 'The given data was invalid.'
    return remaining > 0 ? `${first} (and ${remaining} more error${remaining > 1 ? 's' : ''})` : first
  }
}

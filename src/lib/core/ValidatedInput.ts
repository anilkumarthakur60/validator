/**
 * Wrapper around validated data. Supports `only`/`except`/`merge`,
 * array-like access, and iteration.
 */

import type { ValidationData } from '@/lib/types'
import { dotGet, dotHas, dotSet } from '@/lib/core/data'

export class ValidatedInput<T extends ValidationData = ValidationData>
  implements Iterable<[string, unknown]>
{
  private readonly input: T

  constructor(input: T) {
    this.input = { ...input }
  }

  /** The complete validated dataset. */
  all(): T {
    return { ...this.input }
  }

  /** Only the given (dot-aware) keys. */
  only(keys: readonly string[]): ValidationData {
    let result: ValidationData = {}
    for (const key of keys) {
      if (dotHas(this.input, key)) result = dotSet(result, key, dotGet(this.input, key))
    }
    return result
  }

  /** Everything except the given top-level keys. */
  except(keys: readonly string[]): ValidationData {
    const omit = new Set(keys)
    const result: ValidationData = {}
    for (const [key, value] of Object.entries(this.input)) {
      if (!omit.has(key)) result[key] = value
    }
    return result
  }

  /** A new instance with extra fields merged in. */
  merge(extra: ValidationData): ValidatedInput {
    return new ValidatedInput({ ...this.input, ...extra })
  }

  /** Whether a (dot-aware) key is present. */
  has(key: string): boolean {
    return dotHas(this.input, key)
  }

  /** Read a (dot-aware) key with an optional fallback. */
  get(key: string, fallback?: unknown): unknown {
    return this.has(key) ? dotGet(this.input, key) : fallback
  }

  [Symbol.iterator](): Iterator<[string, unknown]> {
    return Object.entries(this.input)[Symbol.iterator]()
  }
}

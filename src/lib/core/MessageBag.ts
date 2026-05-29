/**
 * Container for validation error messages, mirroring Laravel's
 * `Illuminate\Support\MessageBag`.
 */

export class MessageBag {
  private readonly store = new Map<string, string[]>()

  constructor(initial?: Readonly<Record<string, readonly string[]>>) {
    if (initial) {
      for (const [key, messages] of Object.entries(initial)) {
        this.store.set(key, [...messages])
      }
    }
  }

  /** Add a message for a key (deduplicated, preserving order). */
  add(key: string, message: string): this {
    const existing = this.store.get(key)
    if (existing) {
      if (!existing.includes(message)) existing.push(message)
    } else {
      this.store.set(key, [message])
    }
    return this
  }

  /** Merge another bag (or raw record) into this one. */
  merge(other: MessageBag | Readonly<Record<string, readonly string[]>>): this {
    const entries = other instanceof MessageBag ? other.messages() : other
    for (const [key, messages] of Object.entries(entries)) {
      for (const message of messages) this.add(key, message)
    }
    return this
  }

  /** Whether any messages exist for the key (supports `*` wildcards). */
  has(key?: string): boolean {
    if (key === undefined) return !this.isEmpty()
    return this.get(key).length > 0
  }

  /** The first message for a key, or the first overall when no key is given. */
  first(key?: string): string {
    if (key === undefined) {
      for (const messages of this.store.values()) {
        if (messages.length > 0) return messages[0] ?? ''
      }
      return ''
    }
    return this.get(key)[0] ?? ''
  }

  /** All messages for a key (supports `attachments.*` wildcards). */
  get(key: string): string[] {
    if (key.includes('*')) {
      const pattern = wildcardToRegExp(key)
      const matched: string[] = []
      for (const [storedKey, messages] of this.store.entries()) {
        if (pattern.test(storedKey)) matched.push(...messages)
      }
      return matched
    }
    return [...(this.store.get(key) ?? [])]
  }

  /** Every message across every key. */
  all(): string[] {
    const result: string[] = []
    for (const messages of this.store.values()) result.push(...messages)
    return result
  }

  /** The keys that currently hold messages. */
  keys(): string[] {
    return [...this.store.keys()]
  }

  /** All messages as a plain record. */
  messages(): Record<string, string[]> {
    const record: Record<string, string[]> = {}
    for (const [key, messages] of this.store.entries()) record[key] = [...messages]
    return record
  }

  /** Alias of {@link messages} matching Laravel's `toArray`. */
  toArray(): Record<string, string[]> {
    return this.messages()
  }

  isEmpty(): boolean {
    return this.store.size === 0
  }

  isNotEmpty(): boolean {
    return !this.isEmpty()
  }

  /** Total number of messages held across all keys. */
  count(): number {
    let total = 0
    for (const messages of this.store.values()) total += messages.length
    return total
  }
}

const wildcardToRegExp = (key: string): RegExp => {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '[^.]+')
  return new RegExp(`^${escaped}$`)
}

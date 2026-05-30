import { computed, ref, type ComputedRef, type Ref } from 'vue'
import type { FieldRuleFn } from '@/lib/types'

/**
 * Wraps a single reactive value and a fluent-builder rule function
 * (`validation.required().email().toRule()`) into live validation state.
 *
 * The rule re-runs automatically whenever the value changes — `error` is the
 * empty string while valid, otherwise the failure message.
 */
export interface Field<T> {
  value: Ref<T>
  touched: Ref<boolean>
  /** `true` when valid, otherwise the failure message. */
  result: ComputedRef<true | string>
  valid: ComputedRef<boolean>
  error: ComputedRef<string>
  /** Show the message only after the user has interacted. */
  showError: ComputedRef<boolean>
  touch: () => void
  reset: () => void
}

export function useField<T>(initial: T, rule: FieldRuleFn): Field<T> {
  const value = ref(initial) as Ref<T>
  const touched = ref(false)

  const result = computed<true | string>(() => rule(value.value))
  const valid = computed(() => result.value === true)
  const error = computed(() => (result.value === true ? '' : result.value))
  const showError = computed(() => touched.value && !valid.value)

  return {
    value,
    touched,
    result,
    valid,
    error,
    showError,
    touch: () => {
      touched.value = true
    },
    reset: () => {
      value.value = initial
      touched.value = false
    },
  }
}

/**
 * Default validation messages and the placeholder formatter.
 *
 * `defaultMessages` is exported mutably so applications can override copy
 * globally, e.g. `defaultMessages.required = 'This field is required.'`.
 *
 * Rules whose wording depends on the value type (`min`, `max`, `between`,
 * `size`, `gt`, `gte`, `lt`, `lte`) map to a {@link TypedMessage}.
 */

import type { Replaceable } from '@/types'

/** Size-sensitive message variants chosen by the value's type. */
export interface TypedMessage {
  readonly numeric: string
  readonly string: string
  readonly array: string
  readonly file: string
}

/** The four size contexts the validator distinguishes. */
export type SizeType = keyof TypedMessage

export type MessageTemplate = string | TypedMessage

export const defaultMessages: Record<string, MessageTemplate> = {
  accepted: 'The :attribute field must be accepted.',
  accepted_if: 'The :attribute field must be accepted when :other is :value.',
  active_url: 'The :attribute field must be a valid URL.',
  after: 'The :attribute field must be a date after :date.',
  after_or_equal: 'The :attribute field must be a date after or equal to :date.',
  alpha: 'The :attribute field must only contain letters.',
  alpha_dash: 'The :attribute field must only contain letters, numbers, dashes, and underscores.',
  alpha_num: 'The :attribute field must only contain letters and numbers.',
  any_of: 'The :attribute field is invalid.',
  array: 'The :attribute field must be an array.',
  ascii: 'The :attribute field must only contain single-byte alphanumeric characters and symbols.',
  before: 'The :attribute field must be a date before :date.',
  before_or_equal: 'The :attribute field must be a date before or equal to :date.',
  between: {
    numeric: 'The :attribute field must be between :min and :max.',
    file: 'The :attribute field must be between :min and :max kilobytes.',
    string: 'The :attribute field must be between :min and :max characters.',
    array: 'The :attribute field must have between :min and :max items.',
  },
  boolean: 'The :attribute field must be true or false.',
  confirmed: 'The :attribute field confirmation does not match.',
  contains: 'The :attribute field is missing a required value.',
  current_password: 'The password is incorrect.',
  date: 'The :attribute field must be a valid date.',
  date_equals: 'The :attribute field must be a date equal to :date.',
  date_format: 'The :attribute field must match the format :format.',
  decimal: 'The :attribute field must have :decimal decimal places.',
  declined: 'The :attribute field must be declined.',
  declined_if: 'The :attribute field must be declined when :other is :value.',
  different: 'The :attribute field and :other must be different.',
  digits: 'The :attribute field must be :digits digits.',
  digits_between: 'The :attribute field must be between :min and :max digits.',
  dimensions: 'The :attribute field has invalid image dimensions.',
  distinct: 'The :attribute field has a duplicate value.',
  doesnt_contain: 'The :attribute field contains a forbidden value.',
  doesnt_end_with: 'The :attribute field must not end with one of the following: :values.',
  doesnt_start_with: 'The :attribute field must not start with one of the following: :values.',
  email: 'The :attribute field must be a valid email address.',
  encoding: 'The :attribute field must use the :encoding encoding.',
  ends_with: 'The :attribute field must end with one of the following: :values.',
  enum: 'The selected :attribute is invalid.',
  exists: 'The selected :attribute is invalid.',
  extensions: 'The :attribute field must have one of the following extensions: :values.',
  file: 'The :attribute field must be a file.',
  filled: 'The :attribute field must have a value.',
  gt: {
    numeric: 'The :attribute field must be greater than :value.',
    file: 'The :attribute field must be greater than :value kilobytes.',
    string: 'The :attribute field must be greater than :value characters.',
    array: 'The :attribute field must have more than :value items.',
  },
  gte: {
    numeric: 'The :attribute field must be greater than or equal to :value.',
    file: 'The :attribute field must be greater than or equal to :value kilobytes.',
    string: 'The :attribute field must be greater than or equal to :value characters.',
    array: 'The :attribute field must have :value items or more.',
  },
  hex_color: 'The :attribute field must be a valid hexadecimal color.',
  image: 'The :attribute field must be an image.',
  in: 'The selected :attribute is invalid.',
  in_array: 'The :attribute field must exist in :other.',
  in_array_keys: 'The :attribute field must contain at least one of the following keys: :values.',
  integer: 'The :attribute field must be an integer.',
  ip: 'The :attribute field must be a valid IP address.',
  ipv4: 'The :attribute field must be a valid IPv4 address.',
  ipv6: 'The :attribute field must be a valid IPv6 address.',
  json: 'The :attribute field must be a valid JSON string.',
  list: 'The :attribute field must be a list.',
  lowercase: 'The :attribute field must be lowercase.',
  lt: {
    numeric: 'The :attribute field must be less than :value.',
    file: 'The :attribute field must be less than :value kilobytes.',
    string: 'The :attribute field must be less than :value characters.',
    array: 'The :attribute field must have less than :value items.',
  },
  lte: {
    numeric: 'The :attribute field must be less than or equal to :value.',
    file: 'The :attribute field must be less than or equal to :value kilobytes.',
    string: 'The :attribute field must be less than or equal to :value characters.',
    array: 'The :attribute field must not have more than :value items.',
  },
  mac_address: 'The :attribute field must be a valid MAC address.',
  max: {
    numeric: 'The :attribute field must not be greater than :max.',
    file: 'The :attribute field must not be greater than :max kilobytes.',
    string: 'The :attribute field must not be greater than :max characters.',
    array: 'The :attribute field must not have more than :max items.',
  },
  max_digits: 'The :attribute field must not have more than :max digits.',
  mimes: 'The :attribute field must be a file of type: :values.',
  mimetypes: 'The :attribute field must be a file of type: :values.',
  min: {
    numeric: 'The :attribute field must be at least :min.',
    file: 'The :attribute field must be at least :min kilobytes.',
    string: 'The :attribute field must be at least :min characters.',
    array: 'The :attribute field must have at least :min items.',
  },
  min_digits: 'The :attribute field must have at least :min digits.',
  missing: 'The :attribute field must be missing.',
  missing_if: 'The :attribute field must be missing when :other is :value.',
  missing_unless: 'The :attribute field must be missing unless :other is :value.',
  missing_with: 'The :attribute field must be missing when :values is present.',
  missing_with_all: 'The :attribute field must be missing when :values are present.',
  multiple_of: 'The :attribute field must be a multiple of :value.',
  not_in: 'The selected :attribute is invalid.',
  not_regex: 'The :attribute field format is invalid.',
  numeric: 'The :attribute field must be a number.',
  password: 'The :attribute field must be at least :min characters with letters and numbers.',
  present: 'The :attribute field must be present.',
  present_if: 'The :attribute field must be present when :other is :value.',
  present_unless: 'The :attribute field must be present unless :other is :value.',
  present_with: 'The :attribute field must be present when :values is present.',
  present_with_all: 'The :attribute field must be present when :values are present.',
  prohibited: 'The :attribute field is prohibited.',
  prohibited_if: 'The :attribute field is prohibited when :other is :value.',
  prohibited_if_accepted: 'The :attribute field is prohibited when :other is accepted.',
  prohibited_if_declined: 'The :attribute field is prohibited when :other is declined.',
  prohibited_unless: 'The :attribute field is prohibited unless :other is in :values.',
  prohibits: 'The :attribute field prohibits :other from being present.',
  regex: 'The :attribute field format is invalid.',
  required: 'The :attribute field is required.',
  required_array_keys: 'The :attribute field must contain entries for: :values.',
  required_if: 'The :attribute field is required when :other is :value.',
  required_if_accepted: 'The :attribute field is required when :other is accepted.',
  required_if_declined: 'The :attribute field is required when :other is declined.',
  required_unless: 'The :attribute field is required unless :other is in :values.',
  required_with: 'The :attribute field is required when :values is present.',
  required_with_all: 'The :attribute field is required when :values are present.',
  required_without: 'The :attribute field is required when :values is not present.',
  required_without_all: 'The :attribute field is required when none of :values are present.',
  same: 'The :attribute field and :other must match.',
  size: {
    numeric: 'The :attribute field must be :size.',
    file: 'The :attribute field must be :size kilobytes.',
    string: 'The :attribute field must be :size characters.',
    array: 'The :attribute field must contain :size items.',
  },
  starts_with: 'The :attribute field must start with one of the following: :values.',
  string: 'The :attribute field must be a string.',
  timezone: 'The :attribute field must be a valid timezone.',
  unique: 'The :attribute has already been taken.',
  uppercase: 'The :attribute field must be uppercase.',
  url: 'The :attribute field must be a valid URL.',
  ulid: 'The :attribute field must be a valid ULID.',
  uuid: 'The :attribute field must be a valid UUID.',
}

/** Fallback when no template exists for a rule. */
export const FALLBACK_MESSAGE = 'The :attribute field is invalid.'

/** Replace `:placeholder` tokens in a template, honoring capitalization. */
export const formatMessage = (
  template: string,
  replacements: Readonly<Record<string, Replaceable>>,
): string => {
  let result = template
  for (const [key, raw] of Object.entries(replacements)) {
    const value = String(raw)
    // Function-form replacements insert the value literally, so replacement
    // patterns in user data (`$&`, `$'`, `$1`, …) never corrupt the message.
    result = result
      .replace(new RegExp(`:${key.toUpperCase()}\\b`, 'g'), () => value.toUpperCase())
      .replace(
        new RegExp(`:${capitalize(key)}\\b`, 'g'),
        () => value.charAt(0).toUpperCase() + value.slice(1),
      )
      .replace(new RegExp(`:${key}\\b`, 'g'), () => value)
  }
  return result
}

const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1)

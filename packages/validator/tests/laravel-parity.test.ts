import { describe, expect, it } from 'vitest'
import { Validator } from '@/core/Validator'
import { parseFieldRules } from '@/core/RuleParser'
import { formatMessage } from '@/messages'
import { validation } from '@/fluent/builder'
import type { RulesSchema, ValidationData } from '@/types'

/** Pass a single field value through a rule, with optional sibling data. */
const ok = (value: unknown, rule: RulesSchema['f'], extra: ValidationData = {}): boolean =>
  Validator.make({ f: value, ...extra }, { f: rule }).passes()

/** The first error message a rule produces for a value. */
const firstError = (value: unknown, rule: RulesSchema['f']): string => {
  const v = Validator.make({ f: value }, { f: rule })
  v.passes()
  return v.errors().first('f')
}

describe('presence  whitespace-only strings are empty (Laravel trims)', () => {
  it('required / filled reject whitespace-only strings', () => {
    expect(ok('   ', 'required')).toBe(false)
    expect(ok('\t\n', 'required')).toBe(false)
    expect(ok('   ', 'filled')).toBe(false)
    expect(firstError('   ', 'required')).toBe('The f field is required.')
  })
  it('prohibited / required_with treat whitespace as absent', () => {
    expect(ok('   ', 'prohibited')).toBe(true)
    expect(ok('', 'required_with:o', { o: '   ' })).toBe(true)
    expect(ok('', 'required_with:o', { o: 'x' })).toBe(false)
  })
  it('nullable and non-implicit rules still skip whitespace values', () => {
    expect(ok('   ', 'nullable|email')).toBe(true)
    expect(ok('   ', 'size:3')).toBe(true) // non-implicit rules skip empty strings
  })
  it('the fluent builder agrees', () => {
    expect(validation.required().toRule()('   ')).not.toBe(true)
    expect(validation.notEmpty().toRule()('   ')).not.toBe(true)
  })
})

describe('sizing  numbers without a numeric-type rule use string length', () => {
  it('a raw number is sized by its string form', () => {
    expect(ok(1000000, 'min:10')).toBe(false)
    expect(ok(5, 'max:3')).toBe(true) // '5' is one character
    expect(ok(200, 'integer|max:100')).toBe(false) // integer is a numeric-type rule
  })
  it('the failure message uses string wording', () => {
    expect(firstError(1000000, 'min:10')).toBe('The f field must be at least 10 characters.')
  })
  it('a numeric-type rule restores numeric sizing', () => {
    expect(ok(1000000, 'numeric|min:10')).toBe(true)
    expect(firstError(5, 'numeric|min:10')).toBe('The f field must be at least 10.')
  })
})

describe('rule parsing  pipe strings with regex patterns containing "|"', () => {
  it('re-merges a delimited pattern split on "|"', () => {
    const rules = parseFieldRules('required|regex:/^a|b$/|max:5')
    expect(rules).toHaveLength(3)
    expect(rules[1]).toMatchObject({ name: 'regex', parameters: ['/^a|b$/'] })
    expect(rules[2]).toMatchObject({ name: 'max' })
    expect(parseFieldRules('not_regex:/^a|b$/')[0]).toMatchObject({
      name: 'not_regex',
      parameters: ['/^a|b$/'],
    })
    expect(parseFieldRules('regex:/^a|b$/i')[0]).toMatchObject({ parameters: ['/^a|b$/i'] })
    expect(parseFieldRules('regex:/a\\/b|c/')[0]).toMatchObject({ parameters: ['/a\\/b|c/'] })
  })
  it('re-merges an undelimited pattern when the tail is not a rule name', () => {
    expect(parseFieldRules('regex:^(a|b)$')[0]).toMatchObject({ parameters: ['^(a|b)$'] })
    expect(parseFieldRules('regex:\\d+|required')).toHaveLength(2)
  })
  it('validates end-to-end through the engine', () => {
    expect(ok('b', 'required|regex:/^a|b$/')).toBe(true)
    expect(ok('c', 'required|regex:/^a|b$/')).toBe(false)
  })
  it('throws an actionable error for an unterminated delimited pattern', () => {
    expect(() => parseFieldRules('regex:/^a|b')).toThrow(/array syntax/)
    expect(() => parseFieldRules('required|regex:/^a')).toThrow(/array syntax/)
  })
  it('array syntax keeps working untouched', () => {
    expect(parseFieldRules(['regex:/^a|b$/'])[0]).toMatchObject({ parameters: ['/^a|b$/'] })
    expect(ok('b', ['required', 'regex:/^a|b$/'])).toBe(true)
  })
})

describe('messages  replacement values are inserted literally', () => {
  it('formatMessage ignores replacement patterns in values', () => {
    expect(formatMessage('Got :input.', { input: '$&' })).toBe('Got $&.')
    expect(formatMessage('Got :input.', { input: "$'" })).toBe("Got $'.")
    expect(formatMessage('Got :input.', { input: '$1' })).toBe('Got $1.')
  })
  it('end-to-end via a custom :input message', () => {
    const v = Validator.make({ f: '$&' }, { f: 'in:a' }, { 'f.in': 'Got :input.' })
    v.passes()
    expect(v.errors().first('f')).toBe('Got $&.')
  })
})

describe('required_array_keys  :values lists literal keys', () => {
  it('does not run keys through the display-attribute transform', () => {
    expect(firstError({ first_name: 'a' }, 'required_array_keys:first_name,last_name')).toBe(
      'The f field must contain entries for: first_name, last_name.',
    )
  })
})

describe('date_format  calendar validity and escaped literals', () => {
  it('rejects impossible calendar dates', () => {
    expect(ok('2021-02-31', 'date_format:Y-m-d')).toBe(false)
    expect(ok('2021-04-31', 'date_format:Y-m-d')).toBe(false)
    expect(ok('2023-02-29', 'date_format:Y-m-d')).toBe(false)
    expect(ok('2024-02-29', 'date_format:Y-m-d')).toBe(true)
  })
  it('maps two-digit years like PHP (00–69 → 2000s)', () => {
    expect(ok('29.02.21', 'date_format:d.m.y')).toBe(false) // 2021 is not a leap year
    expect(ok('29.02.24', 'date_format:d.m.y')).toBe(true)
    expect(ok('29.02.96', 'date_format:d.m.y')).toBe(true) // 1996 was a leap year
  })
  it('defaults to a leap year when the format has no year', () => {
    expect(ok('29-02', 'date_format:d-m')).toBe(true)
    expect(ok('30-02', 'date_format:d-m')).toBe(false)
  })
  it('honors backslash-escaped literal characters', () => {
    expect(ok('2024Y', 'date_format:Y\\Y')).toBe(true)
    expect(ok('20242024', 'date_format:Y\\Y')).toBe(false)
    expect(ok('d', 'date_format:\\d')).toBe(true)
    expect(ok('05', 'date_format:\\d')).toBe(false)
  })
})

describe('uuid  the nil UUID satisfies no explicit version', () => {
  it('bare uuid accepts nil, uuid:<n> rejects it', () => {
    expect(ok('00000000-0000-0000-0000-000000000000', 'uuid')).toBe(true)
    expect(ok('00000000-0000-0000-0000-000000000000', 'uuid:4')).toBe(false)
  })
})

describe('not_in  the exact negation of in', () => {
  it('passes array values whose items are outside the list', () => {
    expect(ok(['z'], 'not_in:a,b')).toBe(true)
    expect(ok(['z'], ['array', 'not_in:a,b'])).toBe(true)
    expect(ok(['a'], ['array', 'not_in:a,b'])).toBe(false)
  })
  it('scalar behavior is unchanged', () => {
    expect(ok('z', 'not_in:a,b')).toBe(true)
    expect(ok('a', 'not_in:a,b')).toBe(false)
  })
  it('in remains untouched', () => {
    expect(ok(['a', 'b'], ['array', 'in:a,b'])).toBe(true)
    expect(ok(['c'], ['array', 'in:a,b'])).toBe(false)
    expect(ok(['a'], 'in:a')).toBe(false) // arrays without the array rule never satisfy in
  })
})

describe('sizing  booleans follow PHP strlen((string)$value)', () => {
  it('true sizes as 1, false as 0', () => {
    expect(ok(true, 'min:1')).toBe(true)
    expect(ok(false, 'min:1')).toBe(false)
    expect(ok(true, 'size:1')).toBe(true)
  })
})

describe('decimal  scientific notation is expanded', () => {
  it('counts true decimal places', () => {
    expect(ok(1e-7, 'decimal:7')).toBe(true)
    expect(ok(1e-7, 'decimal:0,2')).toBe(false)
    expect(ok(1.5e-3, 'decimal:4')).toBe(true)
  })
})

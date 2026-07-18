/**
 * Image-dimension coverage. `decodeImage` is captured at module load from the
 * global `createImageBitmap`, so we stub it BEFORE importing the library
 * (dynamic imports inside beforeAll, in this isolated test file).
 */
/* eslint-disable @typescript-eslint/consistent-type-imports -- `typeof import()` is the correct way to type lazily-imported modules */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

let validatorMod: typeof import('@/core/Validator')
let ruleMod: typeof import('@/ruleObjects/Rule')
let fileRuleMod: typeof import('@/ruleObjects/FileRule')
let dimsMod: typeof import('@/ruleObjects/Dimensions')

const bitmap = (width: number, height: number) => ({ width, height, close: vi.fn() })
const decoder = vi.fn(() => Promise.resolve(bitmap(800, 600)))

const png = (): File => new File(['x'], 'a.png', { type: 'image/png' })

beforeAll(async () => {
  vi.stubGlobal('createImageBitmap', decoder)
  validatorMod = await import('@/core/Validator')
  ruleMod = await import('@/ruleObjects/Rule')
  fileRuleMod = await import('@/ruleObjects/FileRule')
  dimsMod = await import('@/ruleObjects/Dimensions')
})

afterAll(() => {
  vi.unstubAllGlobals()
})

describe('dimensions (decoded 800×600)', () => {
  const check = (rule: unknown) =>
    validatorMod.Validator.make({ a: png() }, { a: [rule as never] }).passesAsync()

  it('built-in dimensions rule via string parameters', async () => {
    const v = validatorMod.Validator.make(
      { a: png() },
      { a: 'dimensions:min_width=100,max_width=1000,min_height=100,max_height=1000,ratio=4/3' },
    )
    expect(await v.passesAsync()).toBe(true)
    expect(await validatorMod.Validator.make({ a: 'x' }, { a: 'dimensions' }).failsAsync()).toBe(
      true,
    )
    // A malformed constraint (no `=`) is ignored.
    const malformed = validatorMod.Validator.make(
      { a: png() },
      { a: 'dimensions:min_width=10,garbage' },
    )
    expect(await malformed.passesAsync()).toBe(true)
  })

  it('exact + min/max constraints', async () => {
    expect(await check(ruleMod.Rule.dimensions().width(800).height(600))).toBe(true)
    expect(await check(ruleMod.Rule.dimensions().width(999))).toBe(false)
    expect(await check(ruleMod.Rule.dimensions().height(1))).toBe(false)
    expect(await check(ruleMod.Rule.dimensions().minWidth(100).maxWidth(1000))).toBe(true)
    expect(await check(ruleMod.Rule.dimensions().minWidth(900))).toBe(false)
    expect(await check(ruleMod.Rule.dimensions().maxWidth(700))).toBe(false)
    expect(await check(ruleMod.Rule.dimensions().minHeight(700))).toBe(false)
    expect(await check(ruleMod.Rule.dimensions().maxHeight(500))).toBe(false)
  })

  it('ratio constraints', async () => {
    expect(await check(ruleMod.Rule.dimensions().ratio('4/3'))).toBe(true)
    expect(await check(ruleMod.Rule.dimensions().ratio(2))).toBe(false)
    expect(await check(ruleMod.Rule.dimensions().ratioBetween(1, 2))).toBe(true)
    expect(await check(ruleMod.Rule.dimensions().minRatio(2))).toBe(false)
    expect(await check(ruleMod.Rule.dimensions().maxRatio(1))).toBe(false)
  })

  it('non-file fails, and decode errors fail', async () => {
    expect(
      await validatorMod.Validator.make(
        { a: 'x' },
        { a: [ruleMod.Rule.dimensions()] },
      ).failsAsync(),
    ).toBe(true)
    decoder.mockImplementationOnce(() => Promise.reject(new Error('bad image')))
    expect(await check(ruleMod.Rule.dimensions().width(800))).toBe(false)
  })

  it('FileRule.image().dimensions() decode path', async () => {
    const rule = fileRuleMod.FileRule.image()
      .max('5mb')
      .dimensions(ruleMod.Rule.dimensions().maxWidth(1000))
    expect(await validatorMod.Validator.make({ a: png() }, { a: [rule] }).passesAsync()).toBe(true)
    const tooWide = fileRuleMod.FileRule.image().dimensions(ruleMod.Rule.dimensions().maxWidth(10))
    expect(await validatorMod.Validator.make({ a: png() }, { a: [tooWide] }).failsAsync()).toBe(
      true,
    )
  })

  it('rule objects no-op without a validator', async () => {
    const fail = vi.fn()
    await new dimsMod.Dimensions().validate('a', png(), fail)
    await fileRuleMod.FileRule.default().validate('a', png(), fail)
    expect(fail).not.toHaveBeenCalled()
  })
})

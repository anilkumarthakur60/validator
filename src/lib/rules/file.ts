/**
 * File rules.
 * Laravel: file, image, mimes, mimetypes, extensions, dimensions, encoding.
 *
 * `dimensions` decodes the image (async) when a browser image decoder is
 * available; in non-browser contexts it cannot measure pixels and passes.
 */

import { fileExtension, isFile, isString } from '@/lib/helpers'
import type { RuleModule } from '@/lib/core/ruleDefinition'
import { literalValuesReplacer } from '@/lib/rules/_shared'

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'bmp', 'gif', 'webp']

interface ImageDecoder {
  (file: File): Promise<{ width: number; height: number }>
}

const decodeImage: ImageDecoder | null =
  typeof createImageBitmap === 'function'
    ? async (file) => {
        const bitmap = await createImageBitmap(file)
        const size = { width: bitmap.width, height: bitmap.height }
        bitmap.close()
        return size
      }
    : null

const parseDimensionConstraints = (parameters: readonly string[]): Map<string, string> => {
  const map = new Map<string, string>()
  for (const parameter of parameters) {
    const [key, val] = parameter.split('=')
    if (key !== undefined && val !== undefined) map.set(key.trim(), val.trim())
  }
  return map
}

const ratioOf = (raw: string): number => {
  if (raw.includes('/')) {
    const [w, h] = raw.split('/')
    return Number(w) / Number(h)
  }
  return Number(raw)
}

export const fileRules: RuleModule = {
  file: { validate: ({ value }) => isFile(value) },

  image: {
    validate: ({ value, parameters }) => {
      if (!isFile(value)) return false
      const allowSvg = parameters.includes('allow_svg')
      const ext = fileExtension(value)
      const allowed = allowSvg ? [...IMAGE_EXTENSIONS, 'svg'] : IMAGE_EXTENSIONS
      return allowed.includes(ext) || value.type.startsWith('image/')
    },
  },

  mimes: {
    replace: literalValuesReplacer,
    validate: ({ value, parameters }) => isFile(value) && parameters.includes(fileExtension(value)),
  },

  extensions: {
    replace: literalValuesReplacer,
    validate: ({ value, parameters }) =>
      isFile(value) && parameters.includes(fileExtension(value)),
  },

  mimetypes: {
    replace: literalValuesReplacer,
    validate: ({ value, parameters }) => {
      if (!isFile(value)) return false
      return parameters.some((type) =>
        type.endsWith('/*') ? value.type.startsWith(type.slice(0, -1)) : value.type === type,
      )
    },
  },

  encoding: {
    replace: (ctx) => ({ encoding: ctx.parameters.join(', ') }),
    validate: ({ value, parameters }) => {
      if (!isString(value)) return isFile(value)
      const encoding = (parameters[0] ?? 'utf-8').toLowerCase()
      if (encoding === 'ascii' || encoding === 'us-ascii') return /^[\x00-\x7F]*$/.test(value)
      if (encoding === 'utf-8' || encoding === 'utf8') {
        try {
          return new TextDecoder('utf-8', { fatal: true }).decode(new TextEncoder().encode(value)) === value
        } catch {
          return false
        }
      }
      return true
    },
  },

  dimensions: {
    validate: async ({ value, parameters }) => {
      if (!isFile(value)) return false
      if (decodeImage === null) return true
      let dims: { width: number; height: number }
      try {
        dims = await decodeImage(value)
      } catch {
        return false
      }
      const constraints = parseDimensionConstraints(parameters)
      const { width, height } = dims
      const check = (key: string, predicate: (limit: number) => boolean): boolean => {
        const raw = constraints.get(key)
        return raw === undefined || predicate(Number(raw))
      }
      if (!check('width', (w) => width === w)) return false
      if (!check('height', (h) => height === h)) return false
      if (!check('min_width', (w) => width >= w)) return false
      if (!check('min_height', (h) => height >= h)) return false
      if (!check('max_width', (w) => width <= w)) return false
      if (!check('max_height', (h) => height <= h)) return false
      const ratio = width / height
      const epsilon = 0.01
      const ratioRaw = constraints.get('ratio')
      if (ratioRaw !== undefined && Math.abs(ratio - ratioOf(ratioRaw)) > epsilon) return false
      const minRatio = constraints.get('min_ratio')
      if (minRatio !== undefined && ratio < ratioOf(minRatio) - epsilon) return false
      const maxRatio = constraints.get('max_ratio')
      if (maxRatio !== undefined && ratio > ratioOf(maxRatio) + epsilon) return false
      return true
    },
  },
}

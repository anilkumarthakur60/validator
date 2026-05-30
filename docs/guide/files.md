# Validating files

File rules operate on the global `File` object (browser, or Node ≥ 20).

## Individual rules

```ts
Validator.make(data, {
  avatar: 'required|file|mimes:jpg,png|max:2048', // 2048 KB
  photo: 'required|image|dimensions:min_width=100,min_height=100',
})
```

| Rule | Meaning |
| --- | --- |
| `file` | A `File` instance |
| `image` | jpg, jpeg, png, bmp, gif, webp (`image:allow_svg` to permit SVG) |
| `mimes:jpg,png` | Extension-based MIME check |
| `mimetypes:image/*` | MIME-type check (wildcards allowed) |
| `extensions:jpg,png` | User-assigned extension |
| `dimensions:...` | Image dimension constraints |
| `encoding:utf-8` | Character encoding |
| `size` / `min` / `max` / `between` | Size in **kilobytes** |

## The fluent `FileRule` builder

```ts
import { FileRule, Rule } from '@hc/validation'

Validator.make(data, {
  attachment: [FileRule.types(['mp3', 'wav']).min('1kb').max('10mb')],
  photo: [
    FileRule.image()
      .max('2mb')
      .dimensions(Rule.dimensions().maxWidth(1000).maxHeight(500)),
  ],
})
```

Sizes accept a number (KB) or a string with `kb`/`mb`/`gb`/`tb` suffixes.

## Image dimensions

```ts
import { Rule } from '@hc/validation'

Rule.dimensions()
  .minWidth(100)
  .maxWidth(1000)
  .minHeight(200)
  .ratio('3/2') // or .ratio(1.5)

Rule.dimensions().ratioBetween('1/2', '3/2')
```

::: warning Server-side dimensions
`dimensions` decodes the image with the browser's `createImageBitmap`. In Node
that API doesn't exist, so the rule **passes** (it can't measure). For real
server-side dimension checks, write a [custom rule](/guide/custom-rules) using a
library like `sharp` or `image-size`.
:::

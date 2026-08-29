import { Validator } from '@anil-labs/validator'

// The same engine works for whole-dataset validation (below) and for
// per-field rules  no framework required.
const mustFind = <T extends Element>(selector: string): T => {
  const el = document.querySelector<T>(selector)
  if (!el) throw new Error(`Demo markup is missing "${selector}"`)
  return el
}

const form = mustFind<HTMLFormElement>('#signup')
const output = mustFind<HTMLPreElement>('#output')

const showErrors = (errors: Record<string, string[]>): void => {
  document.querySelectorAll<HTMLDivElement>('.err[data-for]').forEach((el) => {
    const field = el.dataset['for'] ?? ''
    const messages = errors[field]
    el.textContent = messages?.[0] ?? ''
    const input = document.querySelector<HTMLInputElement>(`[name="${field}"]`)
    if (input) input.setAttribute('aria-invalid', messages ? 'true' : 'false')
  })
}

form.addEventListener('submit', (e) => {
  e.preventDefault()
  const data = Object.fromEntries(new FormData(form).entries())

  const validator = Validator.make(data, {
    name: 'required|string|min:2',
    email: 'required|email',
    password: 'required|string|min:8',
    password_confirmation: 'required|same:password',
  })

  if (validator.fails()) {
    showErrors(validator.errors().messages())
    output.textContent = JSON.stringify(
      { ok: false, errors: validator.errors().messages() },
      null,
      2,
    )
  } else {
    showErrors({})
    output.textContent = JSON.stringify({ ok: true, validated: validator.validated() }, null, 2)
  }
})

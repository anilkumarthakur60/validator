/**
 * Standalone demo for @hc/validation.
 *
 * Demonstrates both APIs against the same library, imported via the `@` alias:
 *  - the fluent builder for live, per-field Quasar-style rules
 *  - the dataset Validator for whole-form validation on submit
 */

import { validation } from '@/lib/fluent/builder'
import { Validator } from '@/lib/core/Validator'
import type { RulesSchema } from '@/lib/types'

interface Field {
  readonly name: string
  readonly label: string
  readonly type: string
  readonly placeholder: string
}

const fields: readonly Field[] = [
  { name: 'name', label: 'Name', type: 'text', placeholder: 'Ada Lovelace' },
  { name: 'email', label: 'Email (validated live)', type: 'email', placeholder: 'you@example.com' },
  { name: 'age', label: 'Age', type: 'number', placeholder: '18' },
  { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
  { name: 'password_confirmation', label: 'Confirm password', type: 'password', placeholder: '••••••••' },
]

const liveEmailRule = validation.nullable().email().toRule()

const app = document.querySelector<HTMLElement>('#app')
if (app) {
  app.innerHTML = `
    <h1>@hc/validation</h1>
    <p class="lead">A Laravel-compatible, strictly-typed validation library — two APIs, one engine.</p>

    <h2>Register form</h2>
    <form class="panel" id="form" novalidate>
      ${fields
        .map(
          (field) => `
        <div class="field">
          <label for="${field.name}">${field.label}</label>
          <input id="${field.name}" name="${field.name}" type="${field.type}" placeholder="${field.placeholder}" />
          <div class="msg" data-for="${field.name}"></div>
        </div>`,
        )
        .join('')}
      <button type="submit">Validate</button>
    </form>

    <h2>Validated output</h2>
    <pre id="output">Submit the form to see <code>validated()</code> output.</pre>
  `

  wireLiveEmail()
  wireSubmit()
}

function wireLiveEmail(): void {
  const email = document.querySelector<HTMLInputElement>('#email')
  const message = document.querySelector<HTMLElement>('[data-for="email"]')
  if (!email || !message) return
  email.addEventListener('input', () => {
    const result = liveEmailRule(email.value)
    if (result === true) {
      email.classList.toggle('valid', email.value !== '')
      email.classList.remove('invalid')
      message.textContent = email.value === '' ? '' : 'Looks good!'
      message.className = 'msg ok'
    } else {
      email.classList.add('invalid')
      email.classList.remove('valid')
      message.textContent = result
      message.className = 'msg error'
    }
  })
}

function wireSubmit(): void {
  const form = document.querySelector<HTMLFormElement>('#form')
  const output = document.querySelector<HTMLElement>('#output')
  if (!form || !output) return

  const schema: RulesSchema = {
    name: 'required|string|max:255',
    email: 'required|email',
    age: 'required|integer|between:18,120',
    password: 'required|min:8|confirmed',
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(form).entries())
    const validator = Validator.make(data, schema, {}, { password_confirmation: 'password confirmation' })

    for (const field of fields) clearMessage(field.name)

    if (validator.fails()) {
      for (const [key, messages] of Object.entries(validator.errors().messages())) {
        showMessage(key, messages[0] ?? 'Invalid.')
      }
      output.textContent = JSON.stringify(validator.errors().messages(), null, 2)
    } else {
      output.textContent = JSON.stringify(validator.validated(), null, 2)
    }
  })
}

function showMessage(field: string, text: string): void {
  const el = document.querySelector<HTMLElement>(`[data-for="${field}"]`)
  const input = document.querySelector<HTMLInputElement>(`#${field}`)
  if (el) {
    el.textContent = text
    el.className = 'msg error'
  }
  input?.classList.add('invalid')
}

function clearMessage(field: string): void {
  const el = document.querySelector<HTMLElement>(`[data-for="${field}"]`)
  const input = document.querySelector<HTMLInputElement>(`#${field}`)
  if (el) {
    el.textContent = ''
    el.className = 'msg'
  }
  input?.classList.remove('invalid')
}

import { Validator } from '@/lib/core/Validator'

// Minimal sanity check for the root workspace app. The full interactive
// showcase lives in the standalone `demo/` project (`npm run demo`).
const validator = Validator.make(
  { email: 'person@example.com' },
  { email: 'required|email' },
)

const app = document.querySelector<HTMLDivElement>('#app')
if (app) {
  app.innerHTML = `
    <h1>@hc/validation</h1>
    <p>Library workspace. Run <code>npm run demo</code> for the interactive showcase.</p>
    <p>Sanity check — <code>email</code> validates: <strong>${validator.passes()}</strong></p>
  `
}

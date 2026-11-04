import { useState, type FormEvent } from 'react'
import type { AuthSessionState } from '../application/auth-session-state'
import type { AuthSessionStore } from '../application/auth-session-store'
import { getAuthErrorMessage } from './auth-error-message'
import './auth-session.css'

type OwnerVerificationState = Extract<
  AuthSessionState,
  { status: 'verification-required-owner' }
>

type EmailVerificationProps = {
  state: OwnerVerificationState
  store: AuthSessionStore
}

export function EmailVerification({ state, store }: EmailVerificationProps) {
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) {
      return
    }
    const code = String(new FormData(event.currentTarget).get('code') ?? '')
    setBusy(true)
    await store.verifyEmail(code).catch(() => undefined)
    setBusy(false)
  }

  async function resend() {
    if (busy) {
      return
    }
    setBusy(true)
    await store.resendEmailCode().catch(() => undefined)
    setBusy(false)
  }

  return (
    <main className="auth-page auth-session-page">
      <section className="auth-card auth-session-card">
        <h1>Подтвердите email</h1>
        <p>Введите шестизначный код, отправленный на {state.session.account.email}</p>
        <form className="auth-form" onSubmit={submit}>
          <label className="auth-code-field">
            <span>Код подтверждения</span>
            <input
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
            />
          </label>
          <button className="auth-submit" type="submit" disabled={busy}>
            {busy ? 'Проверяем…' : 'Подтвердить'}
          </button>
          <button
            className="auth-forgot-password"
            type="button"
            disabled={busy}
            onClick={resend}
          >
            Отправить код повторно
          </button>
          <p className="auth-message" role="status">
            {getAuthErrorMessage(state.error) || state.message}
          </p>
        </form>
      </section>
    </main>
  )
}

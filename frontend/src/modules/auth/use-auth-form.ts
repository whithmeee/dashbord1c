import { useState, type FormEvent } from 'react'
import type { AuthSessionState } from './application/auth-session-state'
import type { AuthSessionStore } from './application/auth-session-store'
import { getAuthErrorMessage } from './react/auth-error-message'

type LoginState = Extract<
  AuthSessionState,
  { status: 'guest' | 'signing-in' }
>

export function useAuthForm(store: AuthSessionStore, state: LoginState) {
  const [localMessage, setLocalMessage] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state.status === 'signing-in') {
      return
    }
    const data = new FormData(event.currentTarget)
    setLocalMessage('')
    await store.login({
      login: String(data.get('login') ?? ''),
      password: String(data.get('password') ?? ''),
    }).catch(() => undefined)
  }

  function requestPasswordReset() {
    setLocalMessage('Восстановление пароля пока недоступно.')
  }

  return {
    message:
      localMessage || getAuthErrorMessage('error' in state ? state.error : undefined),
    submitting: state.status === 'signing-in',
    submit,
    requestPasswordReset,
  }
}

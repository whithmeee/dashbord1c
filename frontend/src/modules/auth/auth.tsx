import { motion } from 'motion/react'
import { ChevronRight } from 'lucide-react'
import { AuthField } from './auth-field'
import { OsminogLogo } from '../../shared/brand/osminog-logo'
import { useInterfaceMotion } from '../../shared/motion/use-interface-motion'
import { useAuthForm } from './use-auth-form'
import type { AuthSessionState } from './application/auth-session-state'
import type { AuthSessionStore } from './application/auth-session-store'
import './auth.css'
import './auth-interactions.css'

type AuthProps = {
  store: AuthSessionStore
  state: Extract<AuthSessionState, { status: 'guest' | 'signing-in' }>
}

export function Auth({ store, state }: AuthProps) {
  const { reducedMotion, movement } = useInterfaceMotion()
  const { message, submitting, submit, requestPasswordReset } = useAuthForm(
    store,
    state,
  )
  const reveal = {
    hidden: {
      opacity: 0,
      transform: reducedMotion ? 'none' : 'translateY(6px)',
    },
    visible: {
      opacity: 1,
      transform: reducedMotion ? 'none' : 'translateY(0)',
    },
  }

  return (
    <main className="auth-page" data-testid="auth-page">
      <motion.section
        className="auth-card"
        aria-labelledby="auth-title"
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: reducedMotion ? 0 : 0.03 }}
      >
        <div className="auth-brand">
          <OsminogLogo size={224} />
        </div>
        <motion.header
          className="auth-heading"
          variants={reveal}
          transition={movement}
        >
          <h1 id="auth-title">Добро пожаловать</h1>
          <p>Войдите в свой личный кабинет</p>
        </motion.header>
        <motion.form
          className="auth-form"
          onSubmit={submit}
          data-testid="auth-form"
          variants={reveal}
          transition={movement}
        >
          <div className="auth-fields">
            <AuthField name="login" label="Логин" />
            <AuthField name="password" label="Пароль" />
          </div>
          <button
            className="auth-submit"
            type="submit"
            disabled={submitting}
            data-testid="auth-submit"
          >
            {submitting ? 'Входим…' : 'Войти'}
          </button>
          <button
            className="auth-forgot-password"
            type="button"
            onClick={requestPasswordReset}
            data-testid="auth-forgot-password"
          >
            Забыли пароль?
            <ChevronRight size={14} aria-hidden="true" />
          </button>
          <p
            className="auth-message"
            role="status"
            aria-live="polite"
            data-testid="auth-message"
          >
            {message}
          </p>
        </motion.form>
      </motion.section>
    </main>
  )
}

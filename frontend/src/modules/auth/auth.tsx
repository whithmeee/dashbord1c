import { motion } from 'motion/react'
import { ChevronRight } from 'lucide-react'
import { AuthField } from './auth-field'
import authMark from '../../shared/brand/osminog-dark-blue.svg'
import { useInterfaceMotion } from '../../shared/motion/use-interface-motion'
import { useAuthForm } from './use-auth-form'
import './auth.css'
import './auth-interactions.css'

export function Auth() {
  const { reducedMotion, movement } = useInterfaceMotion()
  const { message, submit, requestPasswordReset } = useAuthForm()
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
          <span className="auth-brand-mark">
            <img className="auth-logo" src={authMark} alt="" />
          </span>
          <span className="auth-brand-name">Osminog Project</span>
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
            data-testid="auth-submit"
          >
            Войти
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

import { OsminogLogo } from '../../../shared/brand/osminog-logo'
import './auth-session.css'

type AuthStatusPageProps = {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function AuthStatusPage({
  title,
  description,
  actionLabel,
  onAction,
}: AuthStatusPageProps) {
  return (
    <main className="auth-page auth-session-page">
      <section className="auth-card auth-session-card" aria-live="polite">
        <div className="auth-brand">
          <OsminogLogo size={180} />
        </div>
        <h1>{title}</h1>
        <p>{description}</p>
        {actionLabel && onAction && (
          <button className="auth-submit" type="button" onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </section>
    </main>
  )
}

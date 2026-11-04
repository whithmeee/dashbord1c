import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react'
import './auth-field.css'

type AuthFieldProps = {
  name: 'login' | 'password'
  label: string
}

export function AuthField({ name, label }: AuthFieldProps) {
  const [visible, setVisible] = useState(false)
  const isPassword = name === 'password'
  const FieldIcon = isPassword ? LockKeyhole : UserRound

  return (
    <div className="auth-floating-field">
      <FieldIcon
        className="auth-field-icon"
        size={18}
        strokeWidth={1.8}
        aria-hidden="true"
      />
      <input
        id={`auth-${name}`}
        name={name}
        type={isPassword && !visible ? 'password' : 'text'}
        autoComplete={isPassword ? 'current-password' : 'username'}
        autoCapitalize="none"
        spellCheck={false}
        placeholder=" "
        required
        data-testid={`auth-${name}`}
      />
      <label htmlFor={`auth-${name}`}>{label}</label>
      {isPassword && (
        <button
          className="auth-password-toggle"
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
          aria-pressed={visible}
          aria-controls="auth-password"
          data-testid="auth-password-toggle"
        >
          <span>{visible ? <EyeOff size={19} /> : <Eye size={19} />}</span>
        </button>
      )}
    </div>
  )
}

import { useState, type FormEvent } from 'react'

export function useAuthForm() {
  const [message, setMessage] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('Авторизация пока не подключена.')
  }

  function requestPasswordReset() {
    setMessage('Восстановление пароля пока не подключено.')
  }

  return { message, submit, requestPasswordReset }
}

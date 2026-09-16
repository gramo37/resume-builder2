import { type FormEvent, useState } from 'react'
import { ApiError } from '@/shared/api/types'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { useLogin } from '../hooks/useLogin'
import styles from './LoginForm.module.css'

type FieldErrors = {
  email?: string
  password?: string
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }

  return 'Unable to sign in. Please try again.'
}

export function LoginForm() {
  const login = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  function validate(): boolean {
    const nextErrors: FieldErrors = {}

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address'
    }

    if (!password || password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters'
    }

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validate()) {
      return
    }

    login.mutate({
      email: email.trim(),
      password,
    })
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <Input
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={fieldErrors.email}
      />
      <Input
        label="Password"
        type="password"
        name="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={fieldErrors.password}
      />
      {login.isError ? <p className={styles.banner}>{getErrorMessage(login.error)}</p> : null}
      <Button type="submit" fullWidth loading={login.isPending}>
        Sign in
      </Button>
    </form>
  )
}

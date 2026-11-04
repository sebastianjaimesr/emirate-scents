/**
 * Página de inicio de sesión del panel de administración.
 */
import { useState, type FormEvent } from 'react'
import { Wordmark } from '../../components/brand/Wordmark'
import { AdminApiError, adminApi, errorMessage } from '../adminApi'
import { Alert, Button, TextField } from '../components/ui'
import { useAdminSession, type AdminUser } from '../session'

/** Formulario de acceso al panel: envía correo y contraseña y, si son correctos, abre la sesión. */
export function LoginPage({ notice }: { notice?: string }) {
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true)
    setError(undefined)
    try {
      const { admin } = await adminApi.post<{ admin: AdminUser }>('/auth/login', {
        email: form.get('email'),
        password: form.get('password'),
      })
      useAdminSession.getState().signIn(admin)
    } catch (caught) {
      setError(
        caught instanceof AdminApiError && caught.status === 0
          ? 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.'
          : errorMessage(caught),
      )
      setBusy(false)
    }
  }

  return (
    <main className="grid min-h-svh place-items-center bg-ink-950 px-4 py-12">
      <title>Iniciar sesión · Panel Emirate Scents</title>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-gold-500">
          <Wordmark />
          <p className="mt-4 text-xs font-semibold tracking-[0.3em] text-smoke-300 uppercase">
            Panel administrativo
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg bg-ivory-50 p-6 shadow-2xl"
          noValidate={false}
        >
          <h1 className="font-display text-3xl text-ink-950">Iniciar sesión</h1>
          {notice && <Alert tone="info">{notice}</Alert>}
          {error && <Alert>{error}</Alert>}
          <TextField
            label="Correo"
            name="email"
            type="email"
            autoComplete="username"
            required
            autoFocus
          />
          <TextField
            label="Contraseña"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
          <Button type="submit" busy={busy} className="w-full">
            Entrar
          </Button>
          <p className="text-xs text-smoke-500">
            ¿Olvidaste la contraseña? Se cambia desde la terminal del servidor con{' '}
            <code className="font-mono">npm run admin:crear -- --cambiar-contrasena</code>.
          </p>
        </form>
      </div>
    </main>
  )
}

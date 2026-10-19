/**
 * Estado de la sesión del administrador (comprobando, sin sesión o con sesión), compartido con Zustand.
 */
import { create } from 'zustand'

/** Administrador con sesión iniciada. */
export interface AdminUser {
  id: string
  email: string
  name: string
}

type SessionState =
  | { status: 'checking' }
  | { status: 'signed-out'; notice?: string }
  | { status: 'signed-in'; admin: AdminUser }

interface SessionStore {
  state: SessionState
  signIn: (admin: AdminUser) => void
  signOut: (notice?: string) => void
  /** La API respondió 401 con la sesión abierta: caducó (2 h sin actividad o 12 h en total). */
  expire: () => void
}

/**
 * Estado de la sesión del panel en la pantalla. Solo dice QUIÉN está conectado para pintar
 * la interfaz: la sesión real es la cookie HttpOnly, que React no puede leer, y la API
 * comprueba en cada petición si sigue vigente.
 */
export const useAdminSession = create<SessionStore>()((set, get) => ({
  state: { status: 'checking' },
  signIn: (admin) => set({ state: { status: 'signed-in', admin } }),
  signOut: (notice) => set({ state: { status: 'signed-out', notice } }),
  expire: () => {
    if (get().state.status === 'signed-in') {
      set({
        state: {
          status: 'signed-out',
          notice: 'Tu sesión caducó. Inicia sesión de nuevo para continuar.',
        },
      })
    }
  },
}))

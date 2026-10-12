/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base de la API. Por defecto "/api" (Vite la redirige al servidor en desarrollo). */
  readonly VITE_API_URL?: string
}

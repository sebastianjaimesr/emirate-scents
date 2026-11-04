/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base de la API. Por defecto "/api" (Vite la redirige al servidor en desarrollo). */
  readonly VITE_API_URL?: string
  /** "true" = vista previa sin servidor (GitHub Pages): catálogo del Canva y pedidos por WhatsApp. */
  readonly VITE_PREVIEW?: string
  /** Dirección pública de la tienda, terminada en "/" ("" en desarrollo). Ver vite.config.ts. */
  readonly VITE_SITE_URL: string
}

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// En desarrollo y en `npm run preview`, las peticiones a /api se redirigen al servidor
// Express (server/, puerto 4000). Así la tienda y la API parecen el mismo sitio y no hace
// falta configurar CORS en local.
const apiProxy = { '/api': 'http://localhost:4000' }

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { proxy: apiProxy },
  preview: { proxy: apiProxy },
})

/**
 * Límite de errores para la escena 3D.
 */
import { Component, type ReactNode } from 'react'

interface SceneErrorBoundaryProps {
  children: ReactNode
  /** Se llama si la escena falla al descargarse o al dibujarse. */
  onError: () => void
}

/**
 * Red de seguridad de la escena 3D: si algo falla (sin conexión al descargarla, una tarjeta
 * gráfica que no la soporta...), el error no rompe la página. El hero vuelve a su
 * composición de reserva y el resto de la tienda sigue funcionando.
 */
export class SceneErrorBoundary extends Component<SceneErrorBoundaryProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onError()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

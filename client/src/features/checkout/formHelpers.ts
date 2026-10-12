/** Estilo común de los campos del formulario de pedido. */
export const inputClass =
  'mt-1.5 min-h-12 w-full border border-ink-900/25 bg-ivory-50 px-3.5 text-base text-ink-950 placeholder:text-smoke-500/70 focus:border-ink-900 focus:outline-none aria-invalid:border-ruby-600'

/** Id del texto que describe el campo: el error si lo hay, si no la ayuda. */
export function describedBy(id: string, { hint, error }: { hint?: string; error?: string }) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined
}

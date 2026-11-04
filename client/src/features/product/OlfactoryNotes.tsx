/**
 * Pirámide olfativa del producto: notas de salida, corazón y fondo.
 */
import type { OlfactoryNotes as Notes } from '../../types/product'

const layers = [
  { key: 'top', label: 'Notas de salida', hint: 'Lo primero que percibes' },
  { key: 'heart', label: 'Notas de corazón', hint: 'El carácter de la fragancia' },
  { key: 'base', label: 'Notas de fondo', hint: 'La estela que permanece' },
] as const

/** Pirámide olfativa: salida, corazón y fondo. */
export function OlfactoryNotes({ notes }: { notes: Notes }) {
  return (
    <dl className="divide-y divide-sand-300 border-y border-sand-300">
      {layers.map(
        (layer) =>
          notes[layer.key].length > 0 && (
            <div key={layer.key} className="grid gap-1 py-4 sm:grid-cols-[11rem_1fr] sm:gap-6">
              <dt>
                <span className="block text-xs font-semibold tracking-[0.14em] text-ink-900 uppercase">
                  {layer.label}
                </span>
                <span className="text-xs text-smoke-500">{layer.hint}</span>
              </dt>
              <dd className="font-display text-xl text-ink-950">{notes[layer.key].join(' · ')}</dd>
            </div>
          ),
      )}
    </dl>
  )
}

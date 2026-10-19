/**
 * Gestión de las fotos de un producto en el panel (subir, ordenar, describir y borrar).
 */
import { ArrowLeft, ArrowRight, ImagePlus, Star, Trash2 } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { adminApi, errorMessage } from '../adminApi'
import type { AdminImage, AdminProduct } from '../types'
import { Alert, Button, ConfirmDialog, Panel } from './ui'

const MAX_BYTES = 8 * 1024 * 1024
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

/**
 * Fotos del producto: subir, elegir la principal, ordenar la galería, describirlas y borrarlas.
 * El servidor comprueba el archivo de nuevo: lo de aquí solo evita esperas inútiles.
 */
export function ProductImages({
  product,
  onChange,
}: {
  product: AdminProduct
  onChange: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState<string>()
  const [error, setError] = useState<string>()
  const [toDelete, setToDelete] = useState<AdminImage>()
  const [busy, setBusy] = useState(false)
  const images = product.images

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])]
    event.target.value = ''
    setError(undefined)
    for (const file of files) {
      if (!ACCEPTED.includes(file.type)) {
        setError(`${file.name}: formato no admitido. Usa JPG, PNG o WebP.`)
        continue
      }
      if (file.size > MAX_BYTES) {
        setError(`${file.name}: pesa más de 8 MB.`)
        continue
      }
      setUploading(file.name)
      try {
        const form = new FormData()
        form.append('imagen', file)
        await adminApi.post(`/products/${product.id}/images`, form)
      } catch (caught) {
        setError(`${file.name}: ${errorMessage(caught)}`)
      }
    }
    setUploading(undefined)
    onChange()
  }

  async function run(action: () => Promise<unknown>) {
    setBusy(true)
    setError(undefined)
    try {
      await action()
      onChange()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  const move = (index: number, to: number) => {
    const ids = images.map((image) => image.id)
    const [moved] = ids.splice(index, 1)
    ids.splice(to, 0, moved!)
    return run(() => adminApi.put(`/products/${product.id}/images/order`, { imageIds: ids }))
  }

  return (
    <Panel
      title={`Fotos (${images.length})`}
      actions={
        <>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(',')}
            multiple
            className="sr-only"
            id="subir-fotos"
            onChange={upload}
            disabled={Boolean(uploading)}
          />
          <Button
            variant="secondary"
            busy={Boolean(uploading)}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus aria-hidden="true" className="size-4" />
            {uploading ? `Subiendo ${uploading}…` : 'Subir fotos'}
          </Button>
        </>
      }
    >
      <p className="mb-4 text-sm text-smoke-500">
        JPG, PNG o WebP de hasta 8 MB. Se convierten a WebP en varios tamaños y se les quitan los
        datos de ubicación. La primera es la foto principal.
      </p>
      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}
      {images.length === 0 ? (
        <p className="rounded-md border border-dashed border-ink-900/20 p-6 text-center text-sm text-smoke-500">
          Sin fotos: la tienda muestra “Imagen próximamente”.
        </p>
      ) : (
        <ol className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image, index) => (
            <li key={image.id} className="overflow-hidden rounded-md border border-ink-900/10">
              <div className="relative aspect-[4/5] bg-cream-100">
                <img src={image.url} alt={image.alt} className="size-full object-cover" />
                {index === 0 && (
                  <span className="absolute top-2 left-2 rounded-full bg-gold-500 px-2.5 py-0.5 text-xs font-semibold text-ink-950 shadow">
                    Principal
                  </span>
                )}
              </div>
              <ImageAlt productId={product.id} image={image} onSaved={onChange} />
              <div className="flex items-center justify-between gap-1 border-t border-ink-900/10 p-1">
                <Button
                  variant="ghost"
                  className="px-2"
                  disabled={busy || index === 0}
                  onClick={() => move(index, index - 1)}
                  aria-label={`Mover la foto ${index + 1} antes`}
                >
                  <ArrowLeft aria-hidden="true" className="size-4" />
                </Button>
                {index > 0 && (
                  <Button
                    variant="ghost"
                    className="px-2"
                    disabled={busy}
                    onClick={() => move(index, 0)}
                    aria-label={`Hacer principal la foto ${index + 1}`}
                  >
                    <Star aria-hidden="true" className="size-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="px-2"
                  disabled={busy || index === images.length - 1}
                  onClick={() => move(index, index + 1)}
                  aria-label={`Mover la foto ${index + 1} después`}
                >
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  className="px-2 text-ruby-600"
                  disabled={busy}
                  onClick={() => setToDelete(image)}
                  aria-label={`Borrar la foto ${index + 1}`}
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="¿Borrar esta foto?"
        confirmLabel="Borrar foto"
        danger
        busy={busy}
        onCancel={() => setToDelete(undefined)}
        onConfirm={() =>
          run(() => adminApi.delete(`/products/${product.id}/images/${toDelete!.id}`)).then(() =>
            setToDelete(undefined),
          )
        }
      >
        Se borra del producto y del almacenamiento. No se puede deshacer.
      </ConfirmDialog>
    </Panel>
  )
}

/** Texto alternativo de una foto (lo leen los lectores de pantalla y Google). */
function ImageAlt({
  productId,
  image,
  onSaved,
}: {
  productId: string
  image: AdminImage
  onSaved: () => void
}) {
  const [value, setValue] = useState(image.alt)
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const changed = value.trim() !== image.alt

  async function save() {
    setBusy(true)
    setError(undefined)
    try {
      await adminApi.patch(`/products/${productId}/images/${image.id}`, { alt: value })
      onSaved()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="p-2">
      <label className="text-xs font-semibold text-smoke-500">
        Descripción de la foto
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          maxLength={200}
          className="mt-1 block w-full rounded border border-ink-900/20 px-2 py-1 text-xs text-ink-950"
        />
      </label>
      {error && <p className="mt-1 text-xs text-ruby-600">{error}</p>}
      {changed && (
        <Button
          variant="secondary"
          className="mt-1 min-h-8 w-full text-xs"
          busy={busy}
          onClick={save}
        >
          Guardar descripción
        </Button>
      )}
    </div>
  )
}

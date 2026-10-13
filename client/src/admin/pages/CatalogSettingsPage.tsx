import { Pencil, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { AdminApiError, adminApi, errorMessage } from '../adminApi'
import { slugify } from '../productForm'
import type { Brand, Category } from '../types'
import {
  Alert,
  Button,
  ConfirmDialog,
  Loading,
  PageTitle,
  Panel,
  TextField,
} from '../components/ui'

/** Categorías y marcas: crear, renombrar y borrar (solo si no tienen productos). */
export function CatalogSettingsPage() {
  return (
    <>
      <PageTitle
        title="Categorías y marcas"
        description="Una categoría o una marca con productos no se puede borrar: primero cambia esos productos."
      />
      <div className="mb-6">
        <Alert tone="info">
          El menú de la tienda muestra las cuatro categorías principales, cada una con su diseño y
          sus textos. Si creas una categoría nueva, sus productos se ven en el catálogo completo y
          en la búsqueda, pero no tendrá su propia sección en el menú hasta que se diseñe.
        </Alert>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <TaxonomyPanel kind="categories" />
        <TaxonomyPanel kind="brands" />
      </div>
    </>
  )
}

type Item = (Category | Brand) & { position?: number }

const texts = {
  categories: { title: 'Categorías', one: 'categoría', path: '/categories' },
  brands: { title: 'Marcas', one: 'marca', path: '/brands' },
}

function TaxonomyPanel({ kind }: { kind: 'categories' | 'brands' }) {
  const text = texts[kind]
  const [version, setVersion] = useState(0)
  const list = useAsyncData(`${kind}:${version}`, () => adminApi.get<{ items: Item[] }>(text.path))
  const [editing, setEditing] = useState<Item | null>(null)
  const [toDelete, setToDelete] = useState<Item>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const refresh = () => setVersion((value) => value + 1)

  async function remove() {
    if (!toDelete) return
    setBusy(true)
    setError(undefined)
    try {
      await adminApi.delete(`${text.path}/${toDelete.id}`)
      refresh()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
      setToDelete(undefined)
    }
  }

  return (
    <Panel title={text.title}>
      {error && (
        <div className="mb-3">
          <Alert>{error}</Alert>
        </div>
      )}
      {list.error ? (
        <Alert>{errorMessage(list.error)}</Alert>
      ) : !list.data ? (
        <Loading />
      ) : (
        <ul className="divide-y divide-ink-900/10">
          {list.data.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 py-2">
              <div className="text-sm">
                <span className="font-semibold">{item.name}</span>
                <span className="block text-xs text-smoke-500">
                  {item.slug} · {item.productCount} producto(s)
                </span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  className="px-2"
                  onClick={() => setEditing(item)}
                  aria-label={`Editar ${item.name}`}
                >
                  <Pencil aria-hidden="true" className="size-4" />
                </Button>
                {item.productCount === 0 && (
                  <Button
                    variant="ghost"
                    className="px-2 text-ruby-600"
                    onClick={() => setToDelete(item)}
                    aria-label={`Borrar ${item.name}`}
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <TaxonomyForm
        key={editing?.id ?? 'nueva'}
        kind={kind}
        item={editing}
        onDone={() => {
          setEditing(null)
          refresh()
        }}
        onCancel={() => setEditing(null)}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`¿Borrar la ${text.one} ${toDelete?.name ?? ''}?`}
        confirmLabel="Borrar"
        danger
        busy={busy}
        onConfirm={remove}
        onCancel={() => setToDelete(undefined)}
      >
        No tiene productos. Esta acción no se puede deshacer.
      </ConfirmDialog>
    </Panel>
  )
}

function TaxonomyForm({
  kind,
  item,
  onDone,
  onCancel,
}: {
  kind: 'categories' | 'brands'
  item: Item | null
  onDone: () => void
  onCancel: () => void
}) {
  const text = texts[kind]
  const [name, setName] = useState(item?.name ?? '')
  const [slug, setSlug] = useState(item?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(item))
  const [position, setPosition] = useState(String(item?.position ?? 0))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setErrors({})
    setError(undefined)
    const body = {
      name,
      slug,
      ...(kind === 'categories' && { position: Number(position) || 0 }),
    }
    try {
      if (item) await adminApi.patch(`${text.path}/${item.id}`, body)
      else await adminApi.post(text.path, body)
      setName('')
      setSlug('')
      setSlugTouched(false)
      onDone()
    } catch (caught) {
      if (caught instanceof AdminApiError) setErrors(caught.fieldErrors)
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mt-4 space-y-3 border-t border-ink-900/10 pt-4"
      aria-label={item ? `Editar ${text.one}` : `Nueva ${text.one}`}
    >
      <h3 className="font-sans text-sm font-bold">
        {item ? `Editar ${item.name}` : `Nueva ${text.one}`}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Nombre"
          required
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            if (!slugTouched) setSlug(slugify(event.target.value))
          }}
          error={errors.name}
        />
        <TextField
          label="Dirección"
          required
          value={slug}
          onChange={(event) => {
            setSlugTouched(true)
            setSlug(event.target.value)
          }}
          error={errors.slug}
          hint={kind === 'categories' ? `/catalogo/${slug}` : undefined}
        />
        {kind === 'categories' && (
          <TextField
            label="Orden en el menú"
            type="number"
            min={0}
            value={position}
            onChange={(event) => setPosition(event.target.value)}
            error={errors.position}
          />
        )}
      </div>
      {error && <Alert>{error}</Alert>}
      <div className="flex gap-2">
        <Button type="submit" busy={busy}>
          {item ? 'Guardar' : `Crear ${text.one}`}
        </Button>
        {item && (
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  )
}

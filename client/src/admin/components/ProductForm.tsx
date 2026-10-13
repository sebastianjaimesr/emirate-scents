import { useState, type FormEvent } from 'react'
import { audienceLabels, concentrationLabels } from '../../types/product'
import { slugify, type ProductFormValues } from '../productForm'
import type { Brand, Category } from '../types'
import { Alert, Button, Checkbox, Panel, SelectField, TextArea, TextField } from './ui'

interface ProductFormProps {
  initialValues: ProductFormValues
  isNew: boolean
  brands: Brand[]
  categories: Category[]
  fieldErrors: Record<string, string>
  formError?: string
  saved?: string
  saving: boolean
  onSubmit: (values: ProductFormValues) => void
}

/** Primer mensaje de error de un campo o de cualquiera de sus elementos (notesTop.0...). */
const errorFor = (errors: Record<string, string>, field: string) =>
  errors[field] ?? Object.entries(errors).find(([key]) => key.startsWith(`${field}.`))?.[1]

export function ProductForm({
  initialValues,
  isNew,
  brands,
  categories,
  fieldErrors,
  formError,
  saved,
  saving,
  onSubmit,
}: ProductFormProps) {
  const [values, setValues] = useState(initialValues)
  // Al crear, la dirección se genera sola a partir del nombre hasta que la edites a mano
  const [slugTouched, setSlugTouched] = useState(!isNew)

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) =>
    setValues((previous) => ({
      ...previous,
      [key]: value,
      ...(key === 'name' && !slugTouched && { slug: slugify(String(value)) }),
    }))
  const text = (key: keyof ProductFormValues) => ({
    value: values[key] as string,
    onChange: (event: { target: { value: string } }) => set(key, event.target.value as never),
    error: errorFor(fieldErrors, key),
  })

  const isEquivalence =
    categories.find((category) => category.id === values.categoryId)?.slug === 'equivalencias'

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-label="Datos del producto">
      <Panel title="Datos principales">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Nombre"
            required
            maxLength={80}
            {...text('name')}
            className="sm:col-span-2"
          />
          <TextField
            label="SKU"
            required
            placeholder="AR-0001"
            hint="AR- árabes, DS- diseñador, NI- nicho, EQ- equivalencias, y 4 números"
            {...text('sku')}
          />
          <TextField
            label="Dirección en la tienda"
            required
            hint={values.slug ? `/producto/${values.slug}` : 'Se crea a partir del nombre'}
            {...text('slug')}
            onChange={(event) => {
              setSlugTouched(true)
              set('slug', event.target.value)
            }}
          />
          <SelectField label="Marca" required {...text('brandId')}>
            <option value="">Elige una marca</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </SelectField>
          <SelectField label="Categoría" required {...text('categoryId')}>
            <option value="">Elige una categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </SelectField>
        </div>
      </Panel>

      <Panel title="Precio">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Precio (COP)"
            required
            inputMode="numeric"
            placeholder="285000"
            {...text('price')}
          />
          <TextField
            label="Precio anterior (COP)"
            inputMode="numeric"
            hint="Solo si el descuento es real. Déjalo vacío si no hay descuento."
            {...text('compareAtPrice')}
          />
        </div>
      </Panel>

      <Panel title="Detalles del perfume">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="Tamaño (ml)" inputMode="numeric" {...text('sizeMl')} />
          <SelectField label="Concentración" {...text('concentration')}>
            <option value="">Sin indicar</option>
            {Object.entries(concentrationLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectField>
          <SelectField label="Público" {...text('audience')}>
            <option value="">Sin indicar</option>
            {Object.entries(audienceLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Familia olfativa"
            placeholder="Oriental amaderada"
            {...text('olfactoryFamily')}
          />
          <TextField label="Notas de salida" hint="Separadas por comas" {...text('notesTop')} />
          <TextField label="Notas de corazón" hint="Separadas por comas" {...text('notesHeart')} />
          <TextField
            label="Notas de fondo"
            hint="Separadas por comas"
            {...text('notesBase')}
            className="sm:col-start-2"
          />
          {(isEquivalence || values.inspirationReference) && (
            <TextField
              label="Perfil olfativo de referencia"
              hint="Solo equivalencias. Se muestra como inspiración, nunca como el perfume original."
              className="sm:col-span-3"
              {...text('inspirationReference')}
            />
          )}
        </div>
      </Panel>

      <Panel title="Descripciones">
        <div className="grid gap-4">
          <TextField
            label="Descripción corta"
            maxLength={160}
            hint="Una línea para tarjetas y buscadores (necesaria para publicar)"
            {...text('shortDescription')}
          />
          <TextArea
            label="Descripción"
            maxLength={2000}
            rows={6}
            hint="Necesaria para publicar"
            {...text('description')}
          />
        </div>
      </Panel>

      <Panel title="Visibilidad e inventario">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <Checkbox
              label="Novedad"
              checked={values.isNew}
              onChange={(event) => set('isNew', event.target.checked)}
            />
            <Checkbox
              label="Recomendado por la casa"
              hint="Aparece primero en la vitrina del inicio"
              checked={values.isFeatured}
              onChange={(event) => set('isFeatured', event.target.checked)}
            />
            <Checkbox
              label="Producto DEMO"
              hint="Ficticio: se muestra con su etiqueta y no se puede pedir"
              checked={values.isDemo}
              onChange={(event) => set('isDemo', event.target.checked)}
            />
          </div>
          <div className="grid gap-4">
            {isNew && (
              <TextField
                label="Unidades iniciales"
                inputMode="numeric"
                hint="Quedan registradas como una entrada en el historial de inventario"
                {...text('initialStock')}
              />
            )}
            <TextField
              label="Avisar de stock bajo con"
              inputMode="numeric"
              hint="unidades o menos"
              {...text('lowStockThreshold')}
            />
          </div>
        </div>
      </Panel>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-end gap-3 border-t border-ink-900/10 bg-[#f4efe6]/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border">
        <div className="mr-auto min-w-0 flex-1">
          {formError && <Alert>{formError}</Alert>}
          {saved && !formError && <Alert tone="success">{saved}</Alert>}
        </div>
        <Button type="submit" busy={saving}>
          {isNew ? 'Crear borrador' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  )
}

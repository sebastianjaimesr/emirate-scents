/**
 * Formulario de compra: datos de entrega, método de pago y envío del pedido.
 */
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, LoaderCircle } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router'
import { colombianDepartments } from '../../data/colombia'
import { cx } from '../../lib/cx'
import { paymentMethodLabels, type PaymentMethod } from '../../types/order'
import { checkoutSchema, type CheckoutData, type CheckoutValues } from './checkoutSchema'
import { FormField } from './FormField'
import { describedBy, inputClass } from './formHelpers'

const paymentOptions: { value: PaymentMethod; description: string }[] = [
  {
    value: 'CONTRA_ENTREGA',
    description:
      'Pagas al recibir. Sujeto a la cobertura de tu ciudad; te lo confirmamos por WhatsApp.',
  },
  {
    value: 'ACORDAR_POR_WHATSAPP',
    description: 'Te contamos por WhatsApp las opciones de pago disponibles.',
  },
]

interface CheckoutFormProps {
  /** Motivo por el que no se puede enviar (productos DEMO o agotados), o null. */
  blockingReason: string | null
  isSubmitting: boolean
  onSubmit: (data: CheckoutData) => void
}

/** Datos de contacto y entrega. Valida al instante con las mismas reglas que la API. */
export function CheckoutForm({ blockingReason, isSubmitting, onSubmit }: CheckoutFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CheckoutValues, unknown, CheckoutData>({
    resolver: zodResolver(checkoutSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      phone: '',
      city: '',
      address: '',
      notes: '',
      website: '',
      dataConsent: false as unknown as true,
    },
  })
  const paymentMethod = useWatch({ control, name: 'paymentMethod' })

  const hints = {
    phone: 'Te escribiremos a este número por WhatsApp.',
    address: 'Incluye barrio, apartamento o referencias.',
  }
  const errorOf = (id: keyof CheckoutValues) => errors[id]?.message
  /** Atributos de accesibilidad de cada campo: estado inválido y texto de ayuda o error. */
  const a11y = (id: keyof CheckoutValues, hint?: string) => ({
    id,
    'aria-invalid': errorOf(id) ? true : undefined,
    'aria-describedby': describedBy(id, { hint, error: errorOf(id) }),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-10">
      <fieldset className="space-y-5">
        <legend className="mb-5 font-display text-3xl text-ink-950">Tus datos</legend>
        <FormField id="name" label="Nombre completo" error={errorOf('name')}>
          <input
            {...register('name')}
            {...a11y('name')}
            autoComplete="name"
            className={inputClass}
          />
        </FormField>
        <FormField
          id="phone"
          label="Celular (WhatsApp)"
          hint={hints.phone}
          error={errorOf('phone')}
        >
          <input
            {...register('phone')}
            {...a11y('phone', hints.phone)}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="300 123 4567"
            className={inputClass}
          />
        </FormField>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="mb-5 font-display text-3xl text-ink-950">Entrega</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="department" label="Departamento" error={errorOf('department')}>
            <select
              {...register('department')}
              {...a11y('department')}
              autoComplete="address-level1"
              defaultValue=""
              className={inputClass}
            >
              <option value="" disabled>
                Elige…
              </option>
              {colombianDepartments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </FormField>
          <FormField id="city" label="Ciudad o municipio" error={errorOf('city')}>
            <input
              {...register('city')}
              {...a11y('city')}
              autoComplete="address-level2"
              className={inputClass}
            />
          </FormField>
        </div>
        <FormField id="address" label="Dirección" hint={hints.address} error={errorOf('address')}>
          <input
            {...register('address')}
            {...a11y('address', hints.address)}
            autoComplete="street-address"
            placeholder="Calle 10 # 20-30, apto 401"
            className={inputClass}
          />
        </FormField>
        <FormField id="notes" label="Observaciones" optional error={errorOf('notes')}>
          <textarea
            {...register('notes')}
            {...a11y('notes')}
            rows={3}
            placeholder="Horario de entrega, portería, indicaciones…"
            className={cx(inputClass, 'py-3')}
          />
        </FormField>
      </fieldset>

      <fieldset aria-describedby={errors.paymentMethod ? 'payment-error' : undefined}>
        <legend className="mb-5 font-display text-3xl text-ink-950">Forma de pago</legend>
        <div className="grid gap-3">
          {paymentOptions.map((option) => (
            <label
              key={option.value}
              className={cx(
                'flex cursor-pointer gap-4 border p-4 transition-colors',
                paymentMethod === option.value
                  ? 'border-ink-900 bg-cream-100'
                  : 'border-ink-900/20 hover:border-ink-900/50',
              )}
            >
              <input
                {...register('paymentMethod')}
                type="radio"
                value={option.value}
                className="mt-1 size-4 accent-ink-900"
              />
              <span>
                <span className="block text-sm font-semibold text-ink-950">
                  {paymentMethodLabels[option.value]}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-smoke-500">
                  {option.description}
                </span>
              </span>
            </label>
          ))}
        </div>
        {errors.paymentMethod && (
          <p id="payment-error" className="mt-2 text-xs font-medium text-ruby-600">
            {errors.paymentMethod.message}
          </p>
        )}
      </fieldset>

      {/* Campo trampa: invisible para personas; si un robot lo llena, la API rechaza el pedido */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">No llenar este campo</label>
        <input {...register('website')} id="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label className="group flex cursor-pointer gap-3 text-sm leading-relaxed text-ink-900">
          <input
            {...register('dataConsent')}
            type="checkbox"
            aria-invalid={errors.dataConsent ? true : undefined}
            aria-describedby={errors.dataConsent ? 'consent-error' : undefined}
            className="peer sr-only"
          />
          <span className="mt-0.5 grid size-5 shrink-0 place-items-center border border-ink-900/40 transition-colors group-hover:border-ink-900 peer-checked:border-ink-900 peer-checked:bg-ink-900 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold-500 [&>svg]:hidden peer-checked:[&>svg]:block">
            <Check aria-hidden="true" className="size-3.5 text-ivory-50" strokeWidth={2.5} />
          </span>
          <span>
            Autorizo a Emirate Scents a usar mis datos para gestionar este pedido, según la{' '}
            <Link
              to="/politica-de-datos"
              target="_blank"
              className="font-semibold text-gold-700 underline underline-offset-2"
            >
              política de tratamiento de datos
            </Link>
            .
          </span>
        </label>
        {errors.dataConsent && (
          <p id="consent-error" className="mt-2 text-xs font-medium text-ruby-600">
            {errors.dataConsent.message}
          </p>
        )}
      </div>

      {blockingReason && (
        <p
          role="alert"
          className="border border-ruby-600/30 bg-ruby-600/5 px-4 py-3 text-sm leading-relaxed text-ink-900"
        >
          {blockingReason}{' '}
          <Link to="/carrito" className="font-semibold underline underline-offset-2">
            Volver al carrito
          </Link>
        </p>
      )}

      <button
        type="submit"
        disabled={Boolean(blockingReason) || isSubmitting}
        className="inline-flex min-h-14 w-full items-center justify-center gap-3 bg-gold-500 px-8 text-sm font-semibold tracking-[0.1em] text-ink-950 uppercase transition-colors hover:bg-gold-300 disabled:cursor-not-allowed disabled:bg-ink-900/10 disabled:text-smoke-500"
      >
        {isSubmitting && <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />}
        {isSubmitting ? 'Registrando pedido…' : 'Registrar pedido'}
      </button>
      <p className="text-center text-xs leading-relaxed text-smoke-500">
        Después te llevaremos a WhatsApp para confirmarlo. Nada se cobra en esta página.
      </p>
    </form>
  )
}

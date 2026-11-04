import type { ReactNode } from 'react'
import { Container } from '../components/ui/Container'
import { PageHeader } from '../components/ui/PageHeader'
import { PageMeta } from '../components/ui/PageMeta'
import { brand } from '../config/brand'
import { buildWhatsAppUrl } from '../lib/whatsapp'

/**
 * Debe coincidir con PRIVACY_POLICY_VERSION en server/src/config/policies.ts:
 * cada pedido guarda la versión que el cliente aceptó.
 */
export const PRIVACY_POLICY_VERSION = '2026-10-12-borrador'

/** Sección de la política de privacidad con su título. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-3xl text-ink-950">{title}</h2>
      <div className="space-y-3 text-base leading-relaxed text-ink-900">{children}</div>
    </section>
  )
}

/** Política de tratamiento de datos personales (Ley 1581 de 2012). BORRADOR. */
export function PrivacyPolicyPage() {
  return (
    <>
      <PageMeta
        title="Política de tratamiento de datos"
        description="Cómo Emirate Scents usa y protege los datos personales de sus clientes."
      />
      <PageHeader eyebrow="Legal" title="Tratamiento de datos personales" />
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl space-y-10">
          <p
            role="note"
            className="border border-ruby-600/30 bg-ruby-600/5 px-4 py-3 text-sm leading-relaxed text-ink-900"
          >
            <strong>Borrador pendiente de revisión.</strong> Este texto lo debe validar {brand.name}{' '}
            (idealmente con un asesor legal) y completar con sus datos de identificación antes de
            publicar la tienda.
          </p>

          <Section title="Responsable">
            <p>
              {brand.name}. Contacto: WhatsApp{' '}
              <a
                href={buildWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-gold-700 underline underline-offset-2"
              >
                {brand.whatsappDisplay}
              </a>
              .
            </p>
            <p className="text-smoke-500">
              Pendiente: razón social o nombre del titular, NIT o cédula, domicilio y correo
              electrónico.
            </p>
          </Section>

          <Section title="Qué datos recogemos">
            <p>
              Cuando registras un pedido: nombre, número de celular, departamento, ciudad, dirección
              de entrega, observaciones y la forma de pago que eliges.
            </p>
            <p>
              Tu carrito y tus favoritos se guardan solo en tu navegador; no los recibimos hasta que
              registras un pedido.
            </p>
          </Section>

          <Section title="Para qué los usamos">
            <ul className="list-disc space-y-1 pl-5">
              <li>Registrar, confirmar y gestionar tu pedido.</li>
              <li>Contactarte por WhatsApp sobre ese pedido: disponibilidad, envío y pago.</li>
              <li>Coordinar la entrega en la dirección que nos indicas.</li>
            </ul>
            <p>Solo los usamos para estas finalidades y no los vendemos.</p>
          </Section>

          <Section title="Tus derechos">
            <p>Según la Ley 1581 de 2012, puedes en cualquier momento y de forma gratuita:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Conocer, actualizar y rectificar tus datos.</li>
              <li>Pedir prueba de la autorización que nos diste.</li>
              <li>Saber cómo hemos usado tus datos.</li>
              <li>Revocar la autorización o pedir que eliminemos tus datos.</li>
              <li>
                Presentar quejas ante la Superintendencia de Industria y Comercio (SIC) después de
                haber hecho tu consulta o reclamo ante nosotros.
              </li>
            </ul>
          </Section>

          <Section title="Cómo ejercerlos">
            <p>
              Escríbenos por WhatsApp al {brand.whatsappDisplay} indicando tu nombre y tu solicitud.
              Respondemos las consultas en máximo 10 días hábiles y los reclamos en máximo 15 días
              hábiles, como establece la ley.
            </p>
          </Section>

          <Section title="Autorización y vigencia">
            <p>
              Al registrar un pedido marcas una casilla para autorizar este tratamiento; guardamos
              la fecha y la versión de esta política que aceptaste.
            </p>
            <p className="text-sm text-smoke-500">Versión: {PRIVACY_POLICY_VERSION}</p>
          </Section>
        </div>
      </Container>
    </>
  )
}

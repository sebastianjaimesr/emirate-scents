/**
 * Páginas de confianza: envíos, cambios y devoluciones, autenticidad y contacto.
 *
 * Regla: solo se escribe lo que el negocio YA hace o ya confirmó (pedidos por WhatsApp,
 * envío cotizado antes de despachar, pago contra entrega sujeto a confirmación, equivalencias
 * identificadas como tales). Nada de plazos, costos, garantías ni certificaciones inventadas.
 *
 * `pendingFromOwner` lista lo que falta decidir. NO se muestra en la tienda: es la lista de
 * tareas para el dueño (también en docs/premium/pendientes-del-negocio.md). Cuando haya una
 * respuesta, se añade como un párrafo más en `sections` y se quita de la lista.
 */
export interface InfoSection {
  title: string
  paragraphs: string[]
}

export interface InfoPage {
  slug: string
  /** Texto corto para menús y enlaces. */
  navLabel: string
  eyebrow: string
  title: string
  lead: string
  /** Descripción para buscadores (unos 150 caracteres). */
  metaDescription: string
  sections: InfoSection[]
  pendingFromOwner: string[]
}

export const infoPages: InfoPage[] = [
  {
    slug: 'envios',
    navLabel: 'Envíos',
    eyebrow: 'Ayuda',
    title: 'Envíos',
    lead: 'Cotizamos cada envío contigo antes de despachar, para que sepas el costo y el tiempo desde el principio.',
    metaDescription:
      'Cómo funcionan los envíos de Emirate Scents: cotización por WhatsApp antes de despachar y pago contra entrega sujeto a cobertura.',
    sections: [
      {
        title: 'Cómo se cotiza',
        paragraphs: [
          'Cuando nos escribes por WhatsApp con tu pedido, te preguntamos la ciudad de entrega y te confirmamos la cobertura, el costo del envío y el tiempo estimado antes de cerrar la compra.',
          'El total que ves en el carrito es estimado: no incluye el envío hasta que lo confirmemos contigo.',
        ],
      },
      {
        title: 'Pago contra entrega',
        paragraphs: [
          'Ofrecemos pago contra entrega sujeto a la cobertura y las condiciones de tu ciudad. Te lo confirmamos por WhatsApp antes de despachar.',
        ],
      },
    ],
    pendingFromOwner: [
      'Ciudades o regiones con cobertura',
      'Transportadora(s) que se usan',
      'Costo del envío o cómo se calcula (¿envío gratis desde algún monto?)',
      'Tiempos de entrega típicos por zona',
      'Si se entrega el mismo día en alguna ciudad',
    ],
  },
  {
    slug: 'cambios-y-devoluciones',
    navLabel: 'Cambios y devoluciones',
    eyebrow: 'Ayuda',
    title: 'Cambios y devoluciones',
    lead: 'Si algo no está bien con tu pedido, escríbenos por WhatsApp y lo revisamos contigo.',
    metaDescription:
      'Cambios y devoluciones en Emirate Scents: cómo reportar un problema con tu pedido por WhatsApp.',
    sections: [
      {
        title: 'Si tu pedido llega con un problema',
        paragraphs: [
          'Escríbenos por WhatsApp contándonos qué pasó (producto equivocado, frasco dañado, faltante) y, si puedes, envíanos una foto del producto y del empaque. Revisamos cada caso contigo.',
        ],
      },
      {
        title: 'Antes de comprar',
        paragraphs: [
          'Si tienes dudas sobre una fragancia, pregúntanos por WhatsApp antes de cerrar el pedido: te ayudamos a elegir y te confirmamos las condiciones de cambio que apliquen.',
        ],
      },
    ],
    pendingFromOwner: [
      'Plazo para pedir un cambio o devolución (días desde la entrega)',
      'Condiciones (¿frasco sellado?, ¿con empaque original?)',
      'Quién paga el envío de la devolución',
      'Si se devuelve el dinero, se cambia por otro producto o se da un saldo a favor',
      'Recordatorio legal: en Colombia aplican la garantía legal y el derecho de retracto de la Ley 1480 de 2011 en ventas a distancia; validar el texto con un asesor',
    ],
  },
  {
    slug: 'autenticidad',
    navLabel: 'Autenticidad',
    eyebrow: 'Confianza',
    title: 'Autenticidad y equivalencias',
    lead: 'Te decimos con claridad qué es cada producto: perfumes de su marca y equivalencias inspiradas en otros.',
    metaDescription:
      'Qué vende Emirate Scents: perfumes árabes con la marca de su fabricante y equivalencias identificadas como tales.',
    sections: [
      {
        title: 'Perfumes árabes',
        paragraphs: [
          'Cada perfume árabe se publica con la marca que aparece en su frasco (Lattafa, Armaf, Afnan…). Las fotos son las oficiales del fabricante o de distribuidores, con el fondo adaptado a la tienda.',
          'Si quieres saber más sobre la procedencia de un perfume antes de comprarlo, pregúntanos por WhatsApp.',
        ],
      },
      {
        title: 'Equivalencias',
        paragraphs: [
          'Una equivalencia es una fragancia inspirada en el perfil olfativo de un perfume conocido. No es el perfume original ni está asociada a esa marca.',
          'Por eso las mostramos siempre con el nombre "Inspirado en…", en su propia categoría y con imágenes de Emirate Scents, nunca con la foto del frasco original.',
        ],
      },
    ],
    pendingFromOwner: [
      'Proveedores o importadores (si el negocio quiere mencionarlos)',
      'Si se entrega factura o algún soporte de compra',
      'Si los perfumes de diseñador o nicho que se publiquen serán originales o solo equivalencias',
    ],
  },
  {
    slug: 'contacto',
    navLabel: 'Contacto',
    eyebrow: 'Emirate Scents',
    title: 'Contacto',
    lead: 'Te asesoramos por WhatsApp para elegir tu fragancia y confirmar tu pedido.',
    metaDescription:
      'Contacta a Emirate Scents por WhatsApp o Instagram para asesoría y pedidos de perfumes árabes y equivalencias.',
    sections: [
      {
        title: 'Cómo trabajamos',
        paragraphs: [
          'Emirate Scents es una tienda de perfumería árabe y de equivalencias. Atendemos cada pedido de forma personal: nos escribes, te asesoramos y confirmamos contigo disponibilidad, envío y pago antes de despachar.',
        ],
      },
    ],
    pendingFromOwner: [
      'Horario de atención',
      'Ciudad desde la que se despacha (¿hay tienda física o punto de entrega?)',
      'Correo electrónico de contacto',
      'Razón social o nombre del titular y NIT (también para la política de datos)',
    ],
  },
]

/** Busca una página de confianza por su dirección; undefined si no existe. */
export function findInfoPage(slug: string | undefined) {
  return infoPages.find((page) => page.slug === slug)
}

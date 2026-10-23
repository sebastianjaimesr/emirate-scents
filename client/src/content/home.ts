/**
 * Textos de la página de inicio.
 * Están separados de los componentes para que puedas editarlos sin tocar el diseño.
 * Son una PROPUESTA de redacción: revísalos y ajústalos a la voz de la marca.
 * Regla: no añadir cifras, testimonios ni promesas (envío gratis, cobertura nacional...)
 * que el negocio no haya confirmado.
 */
export const heroContent = {
  eyebrow: 'Perfumería árabe · Diseñador · Nicho',
  title: 'Fragancias que dejan huella',
  lead: 'Perfumes seleccionados para quienes entienden el aroma como una firma personal. Descubre la colección y pide con asesoría directa por WhatsApp.',
  primaryCta: 'Explorar la colección',
  secondaryCta: 'Descubrir perfumes',
  advice: '¿Necesitas ayuda para elegir? Te asesoramos por WhatsApp',
}

/** Secciones 3D del inicio (features/gallery, features/notesPyramid). */
export const sceneContent = {
  gallery: {
    eyebrow: 'La galería',
    title: 'Cada fragancia, en su pedestal',
  },
  pyramid: {
    eyebrow: 'Pirámide olfativa',
    title: 'Así se despliega cada perfume',
    lead: 'Las notas de salida se sienten primero; las de corazón, después; las de fondo son las que permanecen en la piel.',
  },
}

export const manifestoContent = {
  eyebrow: 'La casa',
  quote: 'Un perfume no se lleva: se recuerda.',
  body: 'En Emirate Scents reunimos la profundidad de la perfumería oriental, el carácter de las grandes casas de diseñador y la audacia de la perfumería de nicho. Te ayudamos a elegir la fragancia que habla por ti.',
}

/** Conocimiento general de perfumería; no describe productos concretos. */
export const olfactoryFamilies = [
  {
    name: 'Oud',
    description:
      'Madera resinosa y profunda, protagonista de la perfumería árabe. Cálida, intensa y de larga estela.',
  },
  {
    name: 'Ámbar',
    description:
      'Acorde dulce y envolvente de resinas, vainilla y bálsamos. Sensual y reconfortante.',
  },
  {
    name: 'Almizcle',
    description: 'Suave, limpio y cercano a la piel. Aporta sensualidad y prolonga la fragancia.',
  },
  {
    name: 'Rosa',
    description:
      'La flor emblemática de Oriente: desde la rosa de Taif hasta la rosa damascena, aterciopelada y luminosa.',
  },
  {
    name: 'Especias',
    description: 'Azafrán, cardamomo y pimienta: notas cálidas que dan carácter y presencia.',
  },
  {
    name: 'Cítricos',
    description: 'Bergamota, limón y mandarina abren muchas fragancias con frescura y luz.',
  },
] as const

export const orderSteps = [
  {
    title: 'Elige tu fragancia',
    description: 'Explora las categorías o cuéntanos qué tipo de aroma buscas.',
  },
  {
    title: 'Escríbenos por WhatsApp',
    description:
      'Envía tu pedido o tu consulta. Tú abres WhatsApp y decides cuándo enviar el mensaje.',
  },
  {
    title: 'Confirmamos tu pedido',
    description:
      'Verificamos disponibilidad, costo de envío y cobertura de pago contra entrega en tu ciudad antes de despachar.',
  },
] as const

export const faqs = [
  {
    question: '¿Cómo hago un pedido?',
    answer:
      'Escríbenos por WhatsApp con el perfume que te interesa. Tu pedido queda pendiente hasta que confirmemos la disponibilidad y las condiciones de entrega contigo.',
  },
  {
    question: '¿Qué métodos de pago aceptan?',
    answer:
      'Ofrecemos pago contra entrega, sujeto a la cobertura y las condiciones de tu ciudad. Te las confirmamos por WhatsApp antes de despachar.',
  },
  {
    question: '¿Hacen envíos a mi ciudad?',
    answer:
      'Cuéntanos tu ciudad por WhatsApp y te confirmaremos la cobertura, el costo y el tiempo de entrega antes de cerrar el pedido.',
  },
  {
    question: '¿Cómo sé si un perfume está disponible?',
    answer:
      'La disponibilidad se confirma siempre por WhatsApp antes de cerrar tu pedido, para que no te llevemos una sorpresa.',
  },
  {
    question: '¿Qué es una equivalencia?',
    answer:
      'Es una fragancia inspirada en el perfil olfativo de un perfume conocido. No es el perfume original ni está asociada a esa marca, y siempre la identificamos claramente como equivalencia.',
  },
] as const

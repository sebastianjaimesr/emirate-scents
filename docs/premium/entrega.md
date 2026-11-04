# Tienda premium · Entrega (Fases 3 a 5)

Fecha: 4 de noviembre de 2026. Plan aprobado: `docs/premium/fase-1-auditoria-y-plan.md` (PR #30).
Implementación: PR #31 (3A) y el PR de las fases 3B a 3E.

## 1. Resumen de las mejoras

| Fase                     | Qué cambió                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3A · Identidad y portada | Paleta pedida (negro `#111111`, oro `#C6A15B` como acento, crema `#F5F0E6`, grafito `#292929`). Portada con **Khamrah** como único protagonista (foto oficial recortada, luz cálida, reflejo, entrada suave) y botones "Explorar colección" / "Descubrir perfumes". En el celular el frasco es más pequeño para que título y botones quepan en la primera pantalla.    |
| 3B · Catálogo            | Filtro por **género** (Hombres, Mujeres, Unisex) y **colecciones** (Nuevos lanzamientos, Más vendidos, Ofertas) en la API, en la vista previa y en el panel de filtros. Solo aparecen cuando hay productos con ese dato real; el menú del celular y el pie de página muestran esos accesos con la misma regla. Orden **Relevancia**, que se usa por defecto al buscar. |
| 3C · Carrito y WhatsApp  | Campo opcional "Tu nombre" en el carrito: el mensaje saluda con el nombre y muestra el total por producto. El nombre no se guarda en ningún lado. El mensaje sigue diciendo "consultar" y "subtotal estimado": abrir WhatsApp no confirma ni paga nada.                                                                                                                |
| 3D · Confianza y SEO     | Páginas **Envíos, Cambios y devoluciones, Autenticidad y Contacto**, escritas solo con lo que el negocio ya hace. Imagen para redes con dirección completa, descripción, Twitter Card, dirección canónica por página, `noindex` en "no encontrada" y datos estructurados `Organization` y `Product`.                                                                   |
| 3E · Validación          | Pruebas nuevas (API, unitarias y en navegador), revisión en 5 tamaños de pantalla y botones táctiles más grandes.                                                                                                                                                                                                                                                      |

## 2. Archivos modificados (principales)

- Estilos y portada: `client/src/index.css`, `features/home/HeroSection.tsx`, `features/home/HeroShowcase.tsx`, `content/home.ts`, `content/hero-bottles.json`, `content/hero-images.json` (generado), `server/scripts/heroImages.ts`.
- Catálogo: `server/src/validators/catalog.ts`, `server/src/services/catalogService.ts`, `server/src/lib/text.ts` (`relevanceScore`), `client/src/features/catalog/*`, `services/productService.ts`, `services/preview/previewCatalog.ts`, `pages/CatalogPage.tsx`, `components/layout/useShopShortcuts.ts`, `MobileMenu.tsx`, `Footer.tsx`.
- WhatsApp: `client/src/lib/whatsapp.ts`, `features/cart/CartSummary.tsx`.
- Confianza y SEO: `content/infoPages.ts`, `pages/InfoPage.tsx`, `app/router.tsx`, `components/ui/PageMeta.tsx`, `lib/siteUrl.ts`, `pages/HomePage.tsx`, `pages/ProductPage.tsx`, `client/index.html`, `client/vite.config.ts`, `server/src/web/seo.ts`.
- Pruebas: `server/tests/catalog.test.ts`, `server/tests/fixtures.ts`, `server/src/lib/text.test.ts`, `client/src/features/catalog/catalogQuery.test.ts`, `client/src/lib/whatsapp.test.ts`, `client/src/content/heroBottles.test.ts`, `e2e/hero.spec.ts`, `e2e/tienda.spec.ts`.

## 3. Funcionalidades (todas reales, nada simulado)

- Lo que ya existía se conserva: buscador, filtros por marca/tamaño/familia/precio, orden, paginación, favoritos, carrito persistente, ficha con galería y relacionados, pedidos con base de datos y panel `/admin` (productos, fotos con vista previa, precios y precio anterior, inventario con historial, destacados, stock bajo, pedidos).
- Nuevo: género, colecciones especiales, relevancia, nombre en WhatsApp, páginas de confianza y SEO.

## 4. Pruebas realizadas (en este entorno, el 4-nov-2026)

- `npm run lint`, `npm run typecheck`, `npm run format:check`: sin errores.
- `npm test`: 56 pruebas de la tienda y 140 de la API, todas pasan.
- `npm run test:e2e` (Playwright, escritorio y celular, incluye accesibilidad con axe): 92 pasan y 4 se omiten por diseño (las de mouse en el celular).
- Vista previa de GitHub Pages compilada y recorrida en 320, 414, 768, 1366 y 1920 px (inicio, catálogo, ficha, carrito, contacto y búsqueda): sin desbordes horizontales ni errores de consola.
- Revisado a mano: mensaje de WhatsApp con nombre, datos estructurados, canónicas e imagen para redes.

## 5. Pendientes (no se pueden resolver sin el negocio)

1. **Datos de cada perfume**: género, ml, concentración, notas y descripción. Sin ellos, los filtros de género y tamaño no aparecen y la ficha se ve corta. Plantilla: `docs/catalogo/lociones-canva.csv`.
2. **Nuevos, más vendidos y ofertas**: se activan solos al marcar "Nuevo", "Más vendido" o poner un precio anterior mayor en el panel.
3. **Políticas**: lo que falta en cada página está en `pendingFromOwner` de `client/src/content/infoPages.ts` (cobertura, costos y tiempos de envío; plazo y condiciones de cambios; horario; correo; razón social y NIT). La política de datos sigue en borrador.
4. **Disponibilidad en la vista previa**: GitHub Pages no tiene inventario real (cada producto muestra 10 unidades para poder pedir). Con la API en Railway se usa el inventario real del panel.
5. **Fotos**: Nitro Red, Yum Yum y Bharara Rose tienen fuentes pequeñas o un render (ver `docs/catalogo/inventario-fotos.csv`). Las equivalencias usan frascos ilustrados (no se usan fotos del original). La red de este entorno no permite descargar fotos nuevas.
6. **Diseñador y Nicho** siguen con 0 productos: ¿hay originales o todo se vende como equivalencia?

## 6. Configuración

- `client/src/config/brand.ts`: WhatsApp (`573174096898`) e Instagram. Es el único lugar donde están.
- `client/src/content/hero-bottles.json`: perfume de la portada. Para cambiarlo, edítalo con otro perfume original del catálogo y ejecuta `npm run fotos:portada`.
- `VITE_SITE_URL` (opcional): dirección pública de la tienda. En GitHub Pages se calcula sola (`https://sebastianjaimesr.github.io/emirate-scents/`). Solo hace falta si la tienda pasa a un dominio propio: en ese caso también `PAGES_BASE=/`.
- `VITE_API_URL` (variable del repositorio en GitHub): dirección de la API en Railway. Sin ella, Pages publica la vista previa con pedidos por WhatsApp.

## 7. Ejecutar en tu computador

```bash
npm install
cp server/.env.example server/.env    # y ajusta la base de datos
npm run db:deploy && npm run db:seed
npm run dev                            # tienda en http://localhost:5173 y API en :4000
```

Pruebas: `npm test` · `npm run build && npm run test:e2e`.

## 8. Publicar

- **Tienda (GitHub Pages)**: se publica sola con cada merge a `main` (workflow "Tienda en GitHub Pages").
- **API, panel y base de datos (Railway)**: sigue `docs/rediseno/fase-8-publicacion.md`. Necesita tu cuenta de Railway y después la variable `VITE_API_URL` en GitHub.

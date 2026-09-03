# CHALLENGE — Home + Carrito + Admin (scaffold)

Home tipo tienda con la identidad editorial de CHALLENGE: fondo crema, ciruela
profundo, coral, cards de producto circulares, tipografía Fraunces (display) +
Work Sans (body). Incluye panel de administración, registro de ventas y
contabilidad.

## Qué incluye

- `app/page.tsx` — Home: hero con video en loop + grid de destacados + ubicación
- `app/productos/[slug]/page.tsx` — Página de detalle de cada producto
- `app/admin/page.tsx` — Panel para cargar productos y categorías (con PIN)
- `app/ventas/page.tsx` — Registro de ventas, escondido (con PIN)
- `app/contabilidad/page.tsx` — Totales por producto y medio de pago (con PIN)
- `lib/firebase.ts`, `lib/products.ts`, `lib/categories.ts`, `lib/sales.ts` —
  conexión y funciones contra Firestore (proyecto `paginachallengearg`)
- `store/cartStore.ts` — carrito con Zustand, persistido en localStorage
- `netlify.toml` (en la raíz del repo, fuera de esta carpeta) — para que
  cualquier cuenta de Netlify detecte sola la configuración de build

## Cómo desplegar (GitHub + Netlify)

1. Subí el contenido de esta carpeta a un repositorio de GitHub.
2. Asegurate de que exista un `netlify.toml` en la **raíz del repositorio**
   (no adentro de esta carpeta) con este contenido:

   ```toml
   [build]
     base = "challenge-home"
     command = "npm run build"
     publish = ".next"

   [[plugins]]
     package = "@netlify/plugin-nextjs"
   ```

   (Ajustá `base` al nombre real de la carpeta si la subiste con otro nombre.)
3. En Netlify: "Add new site" → "Import an existing project" → GitHub →
   elegís el repo → "Deploy". No hace falta tocar nada más a mano, Netlify lee
   el `netlify.toml` solo.
4. Publicá `firestore.rules` en Firebase Console → Firestore Database →
   pestaña Reglas → pegar y Publicar.

## Panel de administración (`/admin`)

Alta, edición y borrado de productos y categorías contra Firestore, dentro
de tu proyecto Firebase propio de CHALLENGE (`paginachallengearg`) —
separado de `facturapp-cf75f`, que es el que usás para FacturApp / Caja
Diaria / stock sync.

**Con PIN.** Pide un PIN simple antes de mostrar el panel (por defecto
`2580`, definido en `lib/adminAuth.ts` — cambialo ahí directo si querés
otro). Es un control básico, pensado para que no cualquiera entre de
casualidad, no una barrera fuerte. La sesión dura 12 horas (`localStorage`
del navegador).

### Categorías

Desde el panel podés crear categorías y asignarle una a cada producto.
Aparecen como pills de filtro arriba del grid de "Destacados" en la home
(no en el menú de arriba — ese quedó fijo con solo "Destacados").

### Mostrar/ocultar producto en la home

En el formulario de producto hay un checkbox "Mostrar este producto en la
home / Destacados", tildado por defecto. Si lo destildás, ese producto
sigue existiendo en el catálogo (podés seguir vendiéndolo desde `/ventas`,
por ejemplo) pero no aparece en la página pública. Útil para productos que
solo vendés en el local, o que todavía no querés publicar.

### Auditoría de cambios de stock

Si editás un producto ya cargado y cambiás el número de stock, aparece un
recuadro obligatorio con borde coral que pide **motivo del cambio** y
**firma (nombre de quien lo cambia)** — sin completar los dos, el botón de
guardar no deja pasar el cambio. No aplica al crear un producto nuevo, solo
al modificar el stock de uno existente.

Cada cambio válido queda guardado en una colección aparte de Firestore,
`challenge_stock_log` (producto, stock anterior, stock nuevo, motivo, firma,
fecha). Podés verlo en `/admin`, botón "Ver historial de cambios de stock"
al final de la página.

### Fotos y videos de producto

Se cargan pegando un **link (URL)**, no subiendo el archivo — así evitamos
depender de Firebase Storage, que exige tarjeta cargada (plan "Blaze")
incluso para uso gratuito.

- **URL de imagen**: es la foto principal, la que se ve en la card del
  catálogo y en el panel de ventas. Para conseguir el link, subís la foto a
  [imgur.com](https://imgur.com) (sin cuenta) y copiás el link directo
  (`i.imgur.com/....jpg`, no el link al álbum).
- **Fotos adicionales** (opcional): podés agregar todas las que quieras.
  Se suman como galería con miniaturas clickeables en la página de detalle
  del producto (no aparecen en la card chica del catálogo, solo la
  principal).
- **URL de video** (opcional): si la completás, se muestra en loop en vez
  de la foto principal — tanto en la card del catálogo, en la página de
  detalle, como en el grid de `/ventas`. Tiene que ser un link directo a un
  `.mp4`.

### Reglas de seguridad de Firestore

`challenge_productos`, `challenge_categorias` y `challenge_ventas` quedan
con lectura y escritura abiertas (necesario para que la home funcione sin
más configuración), y todo lo demás en la base bloqueado por defecto.

## Punto de venta (`/ventas`)

Página escondida — no aparece en ningún menú del sitio, solo accesible si
sabés la URL directa. Protegida con el mismo PIN que `/admin`.

Funciona como un punto de venta, no como un formulario:

- **Buscador** (por nombre o SKU) y **filtro por categoría** arriba del
  catálogo.
- **Grid de productos** con foto, precio y una etiqueta con el stock
  disponible en la esquina — tocás un producto y se agrega al carrito. Si
  no queda stock, la card se ve apagada y no se puede tocar.
- **Carrito** a la derecha: cada línea con cantidad ajustable (+/−, tope en
  el stock disponible), botón para quitar, y el total general.
- **Forma de pago**: Efectivo, Transferencia, Mercado Pago, Tarjeta o
  Mixto.
- **"Vender algo que no está en el catálogo"**: un modo manual desplegable
  para cargar algo puntual (descripción, precio, cantidad) que no vale la
  pena tener como producto permanente — no descuenta stock de nada, porque
  no está vinculado a ningún producto.
- **Confirmar venta**: guarda una venta por cada línea del carrito (misma
  fecha y forma de pago para todas), descuenta el stock correspondiente, y
  vacía el carrito.

**No genera factura oficial de AFIP** — es un registro interno.

### Stock sincronizado con el catálogo

Cada línea del carrito que corresponde a un producto del catálogo descuenta
automáticamente esa cantidad del stock al confirmar la venta — el mismo
número que se muestra en la página pública. La resta usa una transacción de
Firestore, así que dos ventas casi simultáneas no se pisan entre sí. Las
líneas del modo manual no tocan stock de ningún producto.

### Comprobante en PDF (no es factura oficial)

Al confirmar una venta, aparece un panel con dos botones:

- **Descargar comprobante (PDF)**: genera y descarga un PDF con diseño de
  marca (ciruela/coral, logo "CHALLENGE"), la dirección
  (Amenábar 1024, Colegiales, CABA), el WhatsApp de contacto, el detalle de
  productos/cantidades/precios, el total, la forma de pago, y un cartel
  bien visible que dice **"Este comprobante es un resumen interno y NO es
  una factura oficial de AFIP."**
- **Enviar por WhatsApp**: descarga el mismo PDF y abre WhatsApp con un
  mensaje ya escrito, listo para elegir el contacto del cliente (o
  directo a su número, si lo cargaste en el campo "Cliente" antes de
  confirmar la venta).

**Importante — esto no es 100% automático:** no existe una forma de que un
sitio web adjunte un archivo directamente dentro de un mensaje de WhatsApp
sin usar la API oficial de WhatsApp Business (que es un servicio pago
aparte, con más infraestructura). El botón hace lo más cercano posible: te
deja el PDF ya descargado y el chat ya abierto — solo falta que vos
adjuntes el archivo a mano (clip → elegir archivo descargado). Si en algún
momento querés que sea 100% automático, avisame y evaluamos sumar la API
de WhatsApp Business.

## Contabilidad (`/contabilidad`)

Otra página escondida, con el mismo PIN. Agrupa lo cargado en `/ventas` en:

- Total vendido y unidades vendidas del período elegido
- Total por producto (unidades y monto)
- Total por medio de pago (incluye Mixto)

Con filtros rápidos (Hoy / 7 días / Este mes / Todo).

## Pedido por WhatsApp

El botón del carrito ("Enviar pedido por WhatsApp") arma un mensaje con el
detalle del pedido y abre WhatsApp con el número del negocio
(`5491137952557`, configurado en `lib/whatsapp.ts`).

## Ubicación (mapa + link a Google)

Al final de la home hay una sección "Visitanos" con mapa de Google
embebido (dirección: Amenábar 1024, Colegiales, CABA — editable en
`components/LocationSection.tsx`), botón "Cómo llegar" y link a las
reseñas reales en Google Maps.

## Pendiente para el flujo completo

- Selector de color/talle real integrado al botón rápido "Agregar al
  carrito" de la home (hoy usa el primer color/talle; en la página de
  producto individual sí es seleccionable).
- Migrar el checkout de WhatsApp a Mercado Pago Checkout Pro.
- Botón de arrepentimiento y defensa del consumidor en el footer (requisito
  legal AR).
- Logo real de CHALLENGE en el comprobante PDF (hoy es solo texto "CHALLENGE"
  en la tipografía del sistema; falta insertar la imagen del logo).
- Vista del historial de auditoría de cambios de stock (motivo + firma) —
  hoy ese registro se guarda en Firestore (`challenge_stock_log`) pero solo
  se puede consultar entrando directo a Firebase Console, no hay pantalla
  en el sitio para verlo.

## Historial de ventas editable

En `/contabilidad`, debajo de los totales por producto y por medio de pago,
hay una lista con cada venta cargada: fecha, producto, cantidad, precio,
forma de pago y total. Cada fila tiene botones **Editar** y **Borrar**:

- **Editar** abre un formulario inline para cambiar fecha, cantidad, precio
  unitario o forma de pago. Si la venta está vinculada a un producto del
  catálogo, el stock se ajusta automáticamente por la diferencia (si
  bajaste la cantidad, repone; si la subiste, descuenta más).
- **Borrar** elimina la venta y, si estaba vinculada a un producto, le
  repone el stock completo de esa línea.

## Paleta

| Token | Hex | Uso |
|---|---|---|
| `--plum-950` | `#21101d` | títulos grandes, hero |
| `--plum-800` | `#3b1730` | texto de marca, botones outline |
| `--coral-500` | `#ff6a4d` | CTA principal, descuentos, hover |
| `--cream-50` | `#fbf8f4` | fondo general |
| `--gold-500` | `#c9a24b` | % OFF |

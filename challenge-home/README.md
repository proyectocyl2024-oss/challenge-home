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
Aparecen en el menú de arriba de la home (dinámico, se actualiza solo) y
como pills de filtro arriba del grid de "Destacados".

### Auditoría de cambios de stock

Si editás un producto ya cargado y cambiás el número de stock, aparece un
recuadro obligatorio con borde coral que pide **motivo del cambio** y
**firma (nombre de quien lo cambia)** — sin completar los dos, el botón de
guardar no deja pasar el cambio. No aplica al crear un producto nuevo, solo
al modificar el stock de uno existente.

Cada cambio válido queda guardado en una colección aparte de Firestore,
`challenge_stock_log` (producto, stock anterior, stock nuevo, motivo, firma,
fecha) — es de solo lectura después de creado, nadie puede editarlo ni
borrarlo, ni siquiera desde el panel. Sirve como historial por si en algún
momento hay que revisar quién cambió qué y por qué. Hoy no hay una pantalla
para *ver* ese historial dentro del sitio — si lo querés, avisame y le
armamos una vista (o mientras tanto se puede consultar directo en Firestore
Console → Datos → challenge_stock_log).

### Fotos y videos de producto

Se cargan pegando un **link (URL)**, no subiendo el archivo — así evitamos
depender de Firebase Storage, que exige tarjeta cargada (plan "Blaze")
incluso para uso gratuito.

- **URL de imagen**: para conseguir el link, subís la foto a
  [imgur.com](https://imgur.com) (sin cuenta) y copiás el link directo
  (`i.imgur.com/....jpg`, no el link al álbum).
- **URL de video** (opcional): si la completás, la card del producto muestra
  ese video en loop en vez de la foto. Tiene que ser un link directo a un
  `.mp4`.

### Reglas de seguridad de Firestore

`challenge_productos`, `challenge_categorias` y `challenge_ventas` quedan
con lectura y escritura abiertas (necesario para que la home funcione sin
más configuración), y todo lo demás en la base bloqueado por defecto.

## Registro de ventas (`/ventas`)

Página escondida — no aparece en ningún menú del sitio, solo accesible si
sabés la URL directa. Protegida con el mismo PIN que `/admin`.

Sirve para anotar cada venta a mano: fecha, producto (podés elegir uno ya
cargado en el catálogo o escribir uno nuevo), cantidad, precio, medio de
pago y una nota libre. **No genera factura oficial de AFIP** — es solo un
registro interno.

### Stock sincronizado con el catálogo

Cuando elegís un producto que ya está cargado en `/admin`, al registrar la
venta se descuenta automáticamente esa cantidad del stock — el mismo
número que se muestra en la página pública. Si borrás esa venta después,
el stock se repone. La resta/suma de stock usa una transacción de
Firestore, así que dos ventas casi simultáneas no se pisan entre sí.

## Contabilidad (`/contabilidad`)

Otra página escondida, con el mismo PIN. Agrupa lo cargado en `/ventas` en:

- Total vendido y unidades vendidas del período elegido
- Total por producto (unidades y monto)
- Total por medio de pago

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

## Paleta

| Token | Hex | Uso |
|---|---|---|
| `--plum-950` | `#21101d` | títulos grandes, hero |
| `--plum-800` | `#3b1730` | texto de marca, botones outline |
| `--coral-500` | `#ff6a4d` | CTA principal, descuentos, hover |
| `--cream-50` | `#fbf8f4` | fondo general |
| `--gold-500` | `#c9a24b` | % OFF |

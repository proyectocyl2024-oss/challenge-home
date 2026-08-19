# CHALLENGE — Home + Carrito (scaffold)

Home tipo tienda (inspirada en la estructura de challengearg.com) con la identidad
editorial de CHALLENGE: fondo crema, ciruela profundo, coral, cards de producto
circulares, tipografía Fraunces (display) + Work Sans (body).

## Qué incluye

- `app/page.tsx` — Home: hero + grid de destacados
- `app/layout.tsx` — layout raíz + fuentes
- `app/globals.css` — tokens de diseño (colores, tipografía, componentes)
- `components/Header.tsx` — header con nav y botón de carrito
- `components/ProductCard.tsx` — card circular con precio, descuento, cuotas, stock
- `components/FeaturedGrid.tsx` — grilla de sección
- `components/CartDrawer.tsx` — carrito lateral (drawer) con cantidades y subtotal
- `store/cartStore.ts` — estado global del carrito con Zustand (persistido en localStorage)
- `data/products.ts` — 6 productos de ejemplo (reemplazar por datos reales)

## Cómo integrarlo a tu proyecto Next.js existente

1. Copiá las carpetas `app/`, `components/`, `store/`, `data/` dentro de tu proyecto
   (mergeando con lo que ya tengas — no pisar tu `layout.tsx` si ya tiene lógica de
   Firebase Auth; agregarle el `<CartDrawer />` y los imports de fuente ahí).
2. Instalá zustand si todavía no lo tenés: `npm install zustand`.
3. Reemplazá `data/products.ts` por tu fuente real. Como charlamos, para arrancar
   son productos "a mano"; el siguiente paso natural es traerlos desde Firestore
   (la misma colección `facturapp_productos` que ya usás para stock).
4. Las imágenes están referenciadas en `/products/*.jpg` — poné esos archivos en
   `public/products/` o cambiá las rutas por URLs de Firebase Storage / CDN.

## Panel de administración (`/admin`)

Alta, edición y borrado de productos y categorías contra dos colecciones en
Firestore, dentro de tu proyecto Firebase propio de CHALLENGE
(`paginachallengearg`) — separado de `facturapp-cf75f`, que es el que usás
para FacturApp / Caja Diaria / stock sync.

**Con PIN.** Pide un PIN simple antes de mostrar el panel (por defecto `2580`,
definido en `lib/adminAuth.ts` — cambialo ahí directo si querés otro). Es un
control básico, pensado para que no cualquiera entre de casualidad, no una
barrera fuerte — el PIN vive en el código del frontend. Para un catálogo de
productos sin datos sensibles alcanza; si en algún momento necesitás más
seguridad, avisame. La sesión dura 12 horas (`localStorage` del navegador).

### Categorías

Desde el panel podés crear categorías (ej. "Ropa deporte", "Complementos") y
asignarle una a cada producto al cargarlo o editarlo. Aparecen en dos lugares:

- En el **menú de arriba** de la home, como links (`Header.tsx` las trae de
  Firestore automáticamente — no hay que tocar código para que un link nuevo
  aparezca cuando creás una categoría).
- Como **pills de filtro** arriba del grid de "Destacados".

Ambos apuntan al mismo filtro: hacer click en una categoría del menú lleva a
la home con esa categoría ya seleccionada. Si borrás una categoría, los
productos que la tenían asignada simplemente quedan sin categoría (no se
borran).

### Reglas de seguridad de Firestore

Tu proyecto `paginachallengearg` arrancó con las reglas por defecto de Firebase
("modo test"): dejan que **cualquiera con tu API key lea, edite y borre todo**
en la base, y además caducan a los 30 días (después de eso, se bloquea todo por
completo). Conviene reemplazarlas antes de cargar productos reales.

Te dejo las reglas en `firestore.rules`. Para aplicarlas: Firebase Console →
tu proyecto → Firestore Database → pestaña **Reglas** → pegás el contenido de
`firestore.rules` reemplazando lo que hay → **Publicar**.

Dejan `challenge_productos` y `challenge_categorias` con lectura y escritura
abiertas (lo necesita la home para mostrar el catálogo, y así no hay que
configurar nada más), y todo lo demás en la base bloqueado por las dudas.

### Fotos y videos de producto

Se cargan pegando un **link (URL)**, no subiendo el archivo — así evitamos
depender de Firebase Storage, que desde hace poco exige tener una tarjeta
cargada (plan "Blaze") incluso para uso gratuito.

- **URL de imagen**: obligatoria en la práctica. Para conseguir el link, subís
  la foto a un servicio gratuito como [imgur.com](https://imgur.com) (sin
  necesidad de cuenta) y copiás el link directo a la imagen. También podés
  usar una imagen que ya esté alojada en Mercado Libre o Tienda Nube.
- **URL de video** (opcional): si la completás, en la home la card del
  producto muestra ese video en loop en vez de la foto — igual que el video
  del hero. Tiene que ser un link directo a un archivo `.mp4` (no un link a
  YouTube — para eso habría que armarlo distinto, avisame si lo necesitás).

### Antes de correrlo

1. Las credenciales de `paginachallengearg` ya están cargadas en `lib/firebase.ts`.
   Si en algún momento rotás la API key o cambiás de proyecto, actualizalas ahí (o
   mejor, pasalas por variables de entorno `NEXT_PUBLIC_FIREBASE_*` en Netlify).
2. Instalá la dependencia nueva: `npm install firebase`.
3. Publicá `firestore.rules` en Firebase Console (ver arriba).
4. Las colecciones `challenge_productos` y `challenge_categorias` se crean
   solas apenas uses el panel — no hace falta crearlas a mano.

### Cómo funciona la home

`FeaturedGridLive` (client component) trae productos y categorías desde
Firestore al cargar la página. Si la colección de productos está vacía o
falla la conexión, muestra los 6 productos de ejemplo de `data/products.ts`
como fallback — así la home nunca queda en blanco mientras cargás el catálogo
real.

## Pedido por WhatsApp

El botón del carrito ("Enviar pedido por WhatsApp") arma un mensaje con el detalle
del pedido (producto, color, talle, cantidad, subtotal) y abre WhatsApp con el
número del negocio, todo listo para que el cliente solo tenga que apretar enviar.

Ya está configurado con el número real del negocio (`5491137952557`) en
`lib/whatsapp.ts`, constante `WHATSAPP_NUMBER`. Si en algún momento cambia,
se edita ahí directo.

Es un buen punto de partida mientras no está armado el checkout de Mercado Pago:
el pedido llega ordenado por WhatsApp y coordinás pago y envío a mano. Cuando
quieras, migramos esto a Checkout Pro para que el pago quede automatizado.

## Pendiente para el flujo completo

- Página de producto individual (`/productos/[slug]`) con selector de color/talle real
  (ahora mismo `addItem` toma el primer color y talle por defecto).
- Migrar `handleCheckout` en `CartDrawer.tsx` de WhatsApp a Mercado Pago Checkout Pro
  (crear preferencia desde una Netlify Function o API route y redirigir al init_point).
- Botón de arrepentimiento y defensa del consumidor en el footer (requisito legal AR,
  como en challengearg.com).

## Ubicación (mapa + link a Google)

Al final de la home hay una sección "Visitanos" con:

- Mapa de Google embebido (iframe, sin necesidad de API key ni facturación).
- Botón "Cómo llegar" → abre Google Maps con la ruta hacia el local.
- Link "Ver opiniones en Google" → lleva a la ficha real del local en Google
  Maps, donde se ven el rating y las reseñas actualizadas.

La dirección está fija en `components/LocationSection.tsx`, constante
`STORE_ADDRESS` (hoy: "Amenábar 1024, Colegiales, CABA"). Si el local se
muda, es la única línea que hay que tocar.

**Sobre las reseñas de Google:** no se pueden copiar/mostrar los comentarios
reales dentro de tu página — es contenido de terceros protegido y va contra
los términos de uso de Google hacerlo por fuera de su API oficial. El link
"Ver opiniones en Google" lleva directo a la ficha real, que siempre muestra
las reseñas actualizadas. Si más adelante querés mostrarlas *embebidas* en tu
propia página, se puede hacer con la API oficial de Google Places, pero
requiere activar facturación en Google Cloud (tiene capa gratuita) — avisame
si en algún momento querés ese nivel.

## Paleta

| Token | Hex | Uso |
|---|---|---|
| `--plum-950` | `#21101d` | títulos grandes, hero |
| `--plum-800` | `#3b1730` | texto de marca, botones outline |
| `--coral-500` | `#ff6a4d` | CTA principal, descuentos, hover |
| `--cream-50` | `#fbf8f4` | fondo general |
| `--gold-500` | `#c9a24b` | % OFF |

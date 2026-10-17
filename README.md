# Balance

Aplicación web para llevar las finanzas personales: registra ingresos y gastos, revisa el saldo mensual, organiza movimientos por categoría y define objetivos y límites de gasto.

## Requisitos

- Node.js 20.19 o posterior, o 22.12 o posterior.
- npm.

## Desarrollo

Instala las dependencias e inicia Vite:

```bash
npm install
npm run dev
```

Abre la URL que indique Vite, normalmente `http://localhost:5173`.

Para comprobar una compilación de producción y servirla localmente:

```bash
npm run build
npm run preview
```

## Uso

### Registrar movimientos

Pulsa **Añadir movimiento**, selecciona si es un gasto o un ingreso y completa el importe, categoría, fecha y método de pago. El concepto y la factura son opcionales.

También puedes pulsar **Fotografiar recibo** dentro del formulario. Balance intenta reconocer el importe, la fecha, la categoría y el método de pago; revisa y corrige las sugerencias antes de guardar. La foto queda adjunta al movimiento. El OCR se procesa en el navegador y puede necesitar conexión la primera vez para cargar sus recursos.

En móvil, desliza un movimiento a la izquierda para mostrar **Eliminar** o a la derecha para **Editar** y **Dividir**. La división está disponible para gastos y permite repartirlos en cuotas mensuales. En escritorio, usa la papelera de la tabla para eliminar.

### Consultar el mes

El panel superior permite elegir mes y año, buscar movimientos y filtrar por tipo y categoría. En la tabla de escritorio, pulsa **Fecha**, **Importe** o **Categoría** para ordenar; vuelve a pulsar para cambiar el sentido.

El resumen muestra ingresos, gastos y saldo. En el gráfico **¿En qué se va?**, pulsa **Topes** para fijar un máximo mensual por categoría. Las barras indican cuánto llevas gastado frente al límite. En **Ajustes de Perfil y Metas** puedes definir objetivos mensuales de ahorro e inversión.

### Perfiles y copias

Los perfiles separan los movimientos, las categorías y los ajustes de cada persona en este dispositivo. Usa el menú de perfil para cambiar o crear uno.

En **Exportar datos** puedes descargar:

- **CSV**: movimientos para hojas de cálculo.
- **PDF**: resumen y lista de movimientos.
- **JSON**: movimientos, categorías personalizadas y facturas adjuntas. Puedes importar una copia JSON desde **Importar copia**.

## Datos y privacidad

Sin iniciar sesión, los movimientos y ajustes se guardan en el almacenamiento local del navegador y las facturas en IndexedDB. Al iniciar sesión con Firebase, los perfiles, movimientos y ajustes también se sincronizan con la cuenta; los archivos de facturas nunca se suben y permanecen solo en el dispositivo donde se adjuntaron. Si borras los datos del sitio, puedes perder los archivos de facturas locales; exporta copias periódicamente.

La exportación JSON contiene los movimientos, las facturas adjuntas, las categorías personalizadas y los objetivos y topes mensuales del perfil activo. No incluye la lista ni el nombre de los perfiles.

La aplicación puede instalarse como PWA en navegadores compatibles. En producción, el service worker almacena la interfaz para poder abrirla tras una primera carga con conexión. Algunas funciones del navegador, como la cámara y las notificaciones, requieren permiso y pueden necesitar HTTPS. Las fotos adjuntas admiten PDF, JPG, PNG o WebP y un máximo de 10 MB.

### Sincronizar con Firebase

La sincronización requiere una cuenta de Firebase y conexión a Internet. En la consola de Firebase:

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/).
2. En **Configuración del proyecto → General**, añade una aplicación web con el icono `</>` y copia sus valores de configuración.
3. En **Authentication → Sign-in method**, activa **Correo electrónico/contraseña**.
4. En **Firestore Database**, crea una base de datos y publica las reglas de `firestore.rules` desde la pestaña **Reglas**.
5. En la raíz del proyecto, copia `.env.example` como `.env.local` y pega los valores de la aplicación web:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

6. Reinicia Vite (`npm run dev`). Pulsa el icono de nube, crea una cuenta y usa el mismo correo y contraseña en los demás dispositivos.

En el primer inicio de sesión se combinan los datos locales y los de la nube: se conservan los perfiles y movimientos únicos, y para IDs repetidos prevalece el dato que ya estaba en Firebase. Se sincronizan los perfiles, movimientos, categorías, metas y topes. Las facturas adjuntas se guardan solo en IndexedDB del dispositivo donde se añadieron; sus archivos no se suben a Firebase y no aparecen en otros dispositivos. Cada cuenta solo puede leer y modificar sus propios datos según las reglas incluidas en este proyecto. No publiques `.env.local`; las claves se mantienen fuera de Git por `.gitignore`.

### Aplicación nativa para iPhone

La integración nativa usa Capacitor y el plugin de hápticos para proporcionar vibración en iPhone. Safari como página web o PWA no ofrece esa API; en navegador la vibración solo funciona en dispositivos que admiten `navigator.vibrate`.

El proyecto nativo ya está incluido en `ios/`. Para instalar las dependencias,
sincronizar la aplicación y abrirla en Xcode, se necesita macOS:

```bash
npm install
npm run ios:sync
npm run ios:open
```

Después de cambiar la aplicación web, ejecuta `npm run ios:sync` para compilar y sincronizar los cambios con el proyecto iOS. `npm run ios:open` vuelve a abrir el proyecto en Xcode. La compilación, firma y ejecución en un iPhone requieren Xcode en macOS.

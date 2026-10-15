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

Los movimientos y ajustes se guardan en el almacenamiento local del navegador; las facturas se guardan en IndexedDB. No hay sincronización entre dispositivos ni cuentas con contraseña. Si borras los datos del sitio en el navegador, puedes perder la información local; exporta copias periódicamente.

La exportación JSON no incluye los perfiles ni los objetivos de ahorro, inversión y topes mensuales. Guarda esos ajustes por separado si necesitas recrearlos en otro dispositivo.

La aplicación puede instalarse como PWA en navegadores compatibles. En producción, el service worker almacena la interfaz para poder abrirla tras una primera carga con conexión. Algunas funciones del navegador, como la cámara y las notificaciones, requieren permiso y pueden necesitar HTTPS. Las fotos adjuntas admiten PDF, JPG, PNG o WebP y un máximo de 10 MB.

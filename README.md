# Wallet

Aplicacion web progresiva (PWA) para la gestion de finanzas personales, cuentas y movimientos.

## Caracteristicas principales

- Gestion de multiples cuentas y tarjetas personalizables (temas, redes de pago, fecha de creacion y congelacion).
- Registro de ingresos y gastos con categorias personalizadas, pagos a plazos y adjunto de justificantes.
- Control de topes mensuales por categoria, resumen de patrimonio total y analisis mensual.
- Modo privacidad con desenfoque de importes y bloqueo de acceso mediante PIN.
- Personalizacion visual con modo claro, modo oscuro, fondos de inicio y avatares de perfil.
- Exportacion en CSV, PDF y copia de seguridad en JSON, ademas de sincronizacion opcional en la nube y espacios compartidos.

## Requisitos

- Node.js 18 o superior
- npm

## Instalacion y uso

1. Instala las dependencias:

```bash
npm install
```

2. Inicia el servidor de desarrollo:

```bash
npm run dev
```

3. Genera la version de produccion:

```bash
npm run build
```

## Tecnologias

- React
- Vite
- Lucide React
- Almacenamiento local (`localStorage`) y sincronizacion opcional en la nube

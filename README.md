# Fin Wallet

Fin Wallet es una aplicación de finanzas personales con un frontend React/Vite y una API Node.js, Express y MongoDB/Mongoose. Mantiene el diseño Soft Feminine Neo-Brutalist y ofrece un modo local de respaldo cuando la API no está disponible.

## Estructura

```text
apps/
  frontend/   React, Vite y cliente HTTP
  backend/    Express, API REST, modelos Mongoose y seed
```

## Requisitos

- Node.js 20.19+ (Vite 8) y npm.
- MongoDB en ejecución. Las operaciones de ahorro usan transacciones; configura MongoDB como replica set de un nodo o usa MongoDB Atlas.

## Desarrollo local

1. Instala las dependencias desde la raíz:

   ```sh
   npm install
   ```

2. Copia `apps/backend/.env.example` como `apps/backend/.env` y ajusta `MONGODB_URI`. El valor de ejemplo requiere un replica set `rs0`.
3. Inicializa datos de demostración:

   ```sh
   npm run seed
   ```

4. Inicia frontend y backend juntos:

   ```sh
   npm run dev
   ```

El frontend corre en `http://localhost:5173` y la API en `http://localhost:4000`. Vite reenvía `/api` al backend. También puedes iniciar cada paquete por separado con `npm run dev:frontend` o `npm run dev:backend`.

## Scripts de workspace

- `npm run dev`: inicia ambos servicios.
- `npm run dev:frontend`: inicia Vite.
- `npm run dev:backend`: inicia Express con recarga.
- `npm run build`: compila el frontend.
- `npm run lint`: ejecuta ESLint en el frontend.
- `npm run seed`: reemplaza la base de datos con datos de demostración.

El seed borra las colecciones de Fin Wallet antes de insertar sus datos. No lo ejecutes sobre una base de datos con datos que quieras conservar.

## Persistencia y modo híbrido

Con la API disponible, el frontend carga y modifica los datos en MongoDB. Si el servidor no responde, usa el estado del navegador (`localStorage`) y muestra **Modo Local** en Configuración. El indicador también muestra **MongoDB API conectada** al sincronizar correctamente.

La variable opcional `VITE_API_URL` del frontend permite cambiar la ruta base de la API; por defecto es `/api`. No coloques secretos en variables `VITE_*`: se incorporan al bundle del navegador.

## Semilla y restauración

`npm run seed` y `POST /api/seed/reset` recrean categorías, medios de pago, metas, presupuestos, pagos recurrentes y movimientos de ejemplo. En `NODE_ENV=production`, el endpoint de restauración exige `SEED_RESET_TOKEN` en el servidor mediante el header `x-seed-reset-token`; el token nunca debe incluirse en el frontend.

## Seguridad de configuración

Los archivos `.env` y credenciales locales están excluidos por `.gitignore`. Los `.env.example` solo contienen valores de muestra y pueden versionarse. Usa secretos distintos por entorno y revoca cualquier credencial que se haya publicado accidentalmente.

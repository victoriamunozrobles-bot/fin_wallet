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

2. Copia `apps/backend/.env.example` como `apps/backend/.env`, configura `MONGODB_URI` y reemplaza `JWT_SECRET` por un valor aleatorio privado (por ejemplo, `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`). El valor de MongoDB de ejemplo requiere un replica set `rs0`.
3. Opcionalmente, carga datos de demostración:

   ```sh
   npm run seed
   ```

4. Inicia frontend y backend juntos:

   ```sh
   npm run dev
   ```

El frontend corre en `http://localhost:5173` y la API en `http://localhost:4000`. Vite reenvía `/api` al backend. También puedes iniciar cada paquete por separado con `npm run dev:frontend` o `npm run dev:backend`. Si MongoDB no está disponible, el proceso del frontend permanece activo para que puedas usar la autenticación y los datos en modo local.

Al abrir la app puedes crear una cuenta o iniciar sesión. Durante el desarrollo está disponible **Probar Demo Rápida**; crea datos de ejemplo aislados para esa cuenta demo. El primer registro en una base existente asocia los datos previos sin propietario a esa primera cuenta para conservar los datos de la instalación anterior.

## Scripts de workspace

- `npm run dev`: inicia ambos servicios.
- `npm run dev:frontend`: inicia Vite.
- `npm run dev:backend`: inicia Express con recarga.
- `npm run build`: compila el frontend.
- `npm run lint`: ejecuta ESLint en el frontend.
- `npm run seed`: reemplaza únicamente los datos de la cuenta demo.

El seed no borra información de otras cuentas.

## Persistencia y modo híbrido

Con la API disponible, el frontend carga y modifica los datos en MongoDB. Si el servidor no responde, usa el estado del navegador (`localStorage`) y muestra **Modo Local** en Configuración. El indicador también muestra **MongoDB API conectada** al sincronizar correctamente.

La variable opcional `VITE_API_URL` del frontend permite cambiar la ruta base de la API; por defecto es `/api`. No coloques secretos en variables `VITE_*`: se incorporan al bundle del navegador.

## Semilla y restauración

`npm run seed` restaura los datos de la cuenta demo. `POST /api/seed/reset` está autenticado y solo restaura los datos de la cuenta que hizo la solicitud. El inicio de sesión demo está deshabilitado en producción.

## Autenticación

La API usa JWT con expiración de siete días. `JWT_SECRET` debe configurarse con un secreto aleatorio fuera de producción; el secreto efímero de desarrollo invalida las sesiones al reiniciar el backend. Las colecciones financieras incluyen `userId`, y las lecturas, cambios, referencias y eliminaciones se limitan al usuario autenticado.

Si la API no está disponible, los formularios pueden crear e iniciar sesión con cuentas locales. Las contraseñas de respaldo se almacenan como derivaciones PBKDF2 con sal en el navegador; los movimientos locales se separan por cuenta.

## Seguridad de configuración

Los archivos `.env` y credenciales locales están excluidos por `.gitignore`. Los `.env.example` solo contienen valores de muestra y pueden versionarse. Usa secretos distintos por entorno y revoca cualquier credencial que se haya publicado accidentalmente.

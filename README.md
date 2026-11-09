# Fin Wallet

## 1. Información general

- **Nombre del proyecto:** Fin Wallet
- **Especialidad:** Web
- **Fuente del proyecto:** Idea de producto para organizar finanzas personales.
- **Link a la fuente original:** [Repositorio del proyecto en GitHub](https://github.com/victoriamunozrobles-bot/fin_wallet).
- **Link al proyecto publicado:** Pendiente de publicación; no hay una URL de despliegue documentada.

## 2. Objetivo

Fin Wallet ayuda a personas que quieren ordenar sus finanzas personales a entender cuánto pueden gastar y cómo avanzan hacia sus metas de ahorro.
Reúne movimientos, presupuestos y pagos recurrentes en un solo lugar, con alertas para anticipar excesos y una alternativa local cuando la API no está disponible.

## 3. Plan de trabajo

1. **Exploración inicial:** definir el problema y los flujos principales: consulta de saldos, registro de movimientos, presupuestos y ahorro.
2. **Preparación:** organizar el frontend, la API REST y la persistencia, y elegir el stack React/Vite, Node/Express y MongoDB.
3. **Construcción:** implementar autenticación, dashboard, movimientos, análisis, presupuestos, metas de ahorro, pagos recurrentes y modo local.
4. **Evaluación:** revisar los flujos principales y validar compilación y lint con los scripts disponibles; complementar con pruebas de uso y rendimiento antes de publicar.
5. **Conclusiones y próximos pasos:** desplegar la aplicación, documentar la URL pública y medir rendimiento y experiencia con usuarios.

## 4. Preguntas clave

- **¿Cómo se protege y recupera la información financiera si el dispositivo o la base de datos dejan de estar disponibles?** La API limita las operaciones a la cuenta autenticada y el modo local separa los datos por cuenta en el navegador. Sin embargo, los cambios locales no se sincronizan con MongoDB, por lo que no se recuperan automáticamente desde otro dispositivo; antes de publicar, implementaría y probaría copias de seguridad de la base de datos y una estrategia explícita de sincronización o exportación para los datos locales.
- **¿Cómo se mantendría la separación de datos por usuario y el rendimiento si crecieran la cantidad de cuentas y movimientos?** Las colecciones financieras se asocian a un `userId` y la API aplica autenticación y alcance por usuario. Para sostener el crecimiento, mediría el rendimiento con conjuntos de datos representativos y revisaría índices, paginación y consultas agregadas según los resultados; esto requiere pruebas de carga que todavía no están documentadas.
- **¿Qué validaciones y pruebas de usabilidad hacen falta antes de publicar la aplicación?** Validaría registro, inicio de sesión, aislamiento entre cuentas, creación y edición de movimientos, presupuestos, ahorro, pagos recurrentes y funcionamiento sin API. También probaría accesibilidad y comprensión de alertas con usuarios. El proyecto ofrece scripts de compilación y lint, pero no documenta una suite automatizada ni pruebas de rendimiento.

## 5. Qué se hizo y cómo

- **Frontend:** React 19 y Vite 8, con pantallas de inicio, transacciones, análisis, presupuestos y ahorro, y configuración.
- **Backend:** API REST con Node.js, Express y MongoDB mediante Mongoose. Los modelos financieros se asocian a una cuenta.
- **Autenticación:** JWT en la API y contraseñas con bcryptjs; el modo local usa almacenamiento del navegador y deriva las contraseñas con PBKDF2.
- **Funcionalidades:** registrar y editar movimientos, consultar el dashboard y análisis, administrar categorías y medios de pago, definir presupuestos y metas de ahorro, y procesar pagos recurrentes.
- **Persistencia y disponibilidad:** cuando la API responde, los datos se guardan en MongoDB; si no está disponible, la app permite operar en modo local con datos separados por cuenta.
- **Interfaz:** diseño Neo-Brutalista suave y demo con datos de ejemplo.

## 6. Resultados

Se entrega una aplicación web con registro e inicio de sesión, una vista general de las finanzas y módulos para movimientos, análisis, presupuestos, metas de ahorro, deudas y pagos recurrentes. Incluye alertas de presupuesto, progreso de ahorro y pagos automáticos; permite descargar el historial y ofrece una demo rápida. La aplicación puede seguir usándose en modo local cuando no responde la API, aunque en ese caso los cambios quedan en el navegador y no se sincronizan con MongoDB.


## 7. Conclusiones

El proyecto integra una experiencia frontend completa con una API y persistencia por usuario, y contempla tanto la disponibilidad de la API como el uso local. Como siguiente mejora, priorizaría desplegar la aplicación y documentar el proceso, ampliar las pruebas automatizadas y evaluar la sincronización y recuperación de datos del modo local. En una entrevista destacaría el diseño del modelo de finanzas personales y el comportamiento híbrido entre API y almacenamiento local.

## Documentación técnica

Fin Wallet es una aplicación de finanzas personales con un frontend React/Vite y una API Node.js, Express y MongoDB/Mongoose. Mantiene el diseño Neo-Brutalista suave y ofrece un modo local de respaldo cuando la API no está disponible.

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

La variable opcional `VITE_API_URL` del frontend permite cambiar la ruta base de la API; por defecto es `/api`.

## Semilla y restauración

`npm run seed` restaura los datos de la cuenta demo. `POST /api/seed/reset` está autenticado y solo restaura los datos de la cuenta que hizo la solicitud. El inicio de sesión demo está deshabilitado en producción.

## Autenticación

La API usa JWT con expiración de siete días. `JWT_SECRET` debe configurarse con un secreto aleatorio fuera de producción; el secreto efímero de desarrollo invalida las sesiones al reiniciar el backend. Las colecciones financieras incluyen `userId`, y las lecturas, cambios, referencias y eliminaciones se limitan al usuario autenticado.

Si la API no está disponible, los formularios pueden crear e iniciar sesión con cuentas locales. Las contraseñas de respaldo se almacenan como derivaciones PBKDF2 con sal en el navegador; los movimientos locales se separan por cuenta.

## Seguridad de configuración

Los archivos `.env` y credenciales locales están excluidos por `.gitignore`. Los `.env.example` solo contienen valores de muestra y pueden versionarse. Usa secretos distintos por entorno y revoca cualquier credencial que se haya publicado accidentalmente.

# Fin Wallet

Aplicación frontend para organizar finanzas personales con una estética editorial pastel y detalles neo-brutalistas. Los datos se guardan en el navegador; no se necesita una cuenta ni un servicio externo.

## Desarrollo

```sh
npm install
npm run dev
```

Validaciones disponibles:

```sh
npm run lint
npm run build
```

## Funcionalidades

- **Inicio:** saldo disponible (ingresos menos gastos y ahorros protegidos), alertas de presupuestos, últimos movimientos y pagos automáticos.
- **Transacciones:** lista y calendario mensual, búsqueda, filtros por fechas/categoría/tipo/medio de pago y edición o eliminación.
- **Análisis:** comparación mensual, desglose por categoría, tasa de ahorro, exportación CSV e impresión.
- **Presupuestos y ahorro:** topes por categoría, metas con abonos y retiros, y seguimiento de deudas o préstamos.
- **Configuración:** categorías y medios de pago personalizables, pagos automáticos, umbral preventivo, moneda y tema claro/oscuro.

El estado global vive en `src/context/FinanceContext.jsx` y persiste bajo la clave `fin-wallet-state-v1` de `localStorage`. Los pagos programados se evalúan al iniciar la app; el simulador manual registra el movimiento y una alerta en el historial.

La app inicia con movimientos de ejemplo editables para mostrar las vistas y gráficos. La moneda predeterminada es CLP y puede cambiarse desde Configuración.

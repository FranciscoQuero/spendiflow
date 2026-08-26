# Spendiflow

Spendiflow es una app móvil de control de gastos personales y familiares construida con React Native y Expo. Registra movimientos, cuentas, inversiones, deudas y huchas, y ayuda a planificar y cerrar cada mes con una visión clara del patrimonio y el ahorro.

## Funcionalidades

- **Transacciones**: gastos, ingresos y transferencias entre cuentas, con categorías y subcategorías personalizables, ámbito personal/negocio, notas y fecha.
- **Cuentas bancarias**: roles (personal, negocio, compartida, ahorro, otra), suelo mínimo (colchón que no se quiere tocar), titularidad parcial, archivado y historial de saldos.
- **Transferencias** entre cuentas propias, contabilizadas sin afectar al balance de ingresos/gastos.
- **Huchas** (provisiones): fondos con objetivo opcional para aportar y retirar dinero, con historial de movimientos.
- **Inversiones**: aportaciones, valor actual y rentabilidad calculada automáticamente.
- **Deudas**: propias o a favor, con cuotas, amortizaciones extra e interés opcional.
- **Recurrencias**: reglas de gastos, ingresos o transferencias periódicas con confirmación o descarte de cada vencimiento.
- **Cierre de mes**: actualización guiada de saldos y valores, con resumen de patrimonio neto y ahorro del mes.
- **Calendario financiero**: eventos y vencimientos planificados (impuestos, rentas, pagos puntuales) con avisos de próximos y vencidos.
- **Gráficas**: resumen por categoría y tendencia de gasto, filtrable por período y ámbito.
- **Exportar / importar**: copia de seguridad completa de los datos en un archivo, con validación al importar.
- **Idioma**: español e inglés, con traducción completa de la interfaz.
- **Tema claro / oscuro**: sigue el ajuste del sistema o se puede fijar manualmente desde Ajustes.

## Stack técnico

- [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/) (SDK 54)
- TypeScript en modo estricto
- [Zustand](https://github.com/pmndrs/zustand) para el estado global, persistido con AsyncStorage
- [React Navigation](https://reactnavigation.org/) (stack + bottom tabs)
- [i18n-js](https://github.com/fnando/i18n-js) para la internacionalización
- [react-native-chart-kit](https://github.com/indiespirit/react-native-chart-kit) para las gráficas
- Jest + `jest-expo` para los tests

## Cómo arrancar

```bash
npm install
npx expo start
```

Desde el menú de Expo puedes abrir la app en un emulador/simulador (iOS/Android) o en un dispositivo físico con Expo Go, escaneando el código QR.

Otros comandos disponibles:

```bash
npx expo start --ios       # abre directamente el simulador de iOS
npx expo start --android   # abre directamente el emulador de Android
npx expo start --web       # abre la versión web
```

## Cómo testear

```bash
npm test
```

Ejecuta la suite de Jest sobre `src/` (utilidades, hooks y store). Para comprobar el tipado y el estilo del código:

```bash
npx tsc --noEmit
npx expo lint
```

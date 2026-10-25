# Resultados históricos Backtest

La sección Resultados conserva la pantalla anterior y añade el selector «Backtest histórico». Componentes standalone con estilos propios; no se alteran los cálculos ni las consultas del módulo anterior. KNIME no se modifica.

## Configuración

`environment.backtestApiUrl` usa el mismo origen en producción. Vercel reenvía exclusivamente `/api/backtest/resultados` a `https://apianabet.herokuapp.com/api/backtest/resultados`, conservando la autenticación y las consultas; esto evita depender de la lista CORS del servidor histórico. La respuesta lleva `Cache-Control: private, no-store`. El desarrollo local conserva su URL de Heroku. `urlIntegracion` sigue apuntando a Render en producción. La nueva vista usa únicamente `GET /api/backtest/resultados`; envía la sesión de usuario mediante el interceptor existente, nunca un token ETL. Si Heroku no confía en el emisor de esa sesión, se muestra un error de autenticación y se requiere resolver esa confianza en el servidor antes de publicar.

Filtros: mercado, segmentos compatibles, liga, temporada, fechas y versión de política. Las solicitudes anteriores se cancelan al cambiar filtros para no mostrar resultados obsoletos. Detalle paginado de 25 filas. No se descarga el conjunto completo de aprobados al navegador.

Tres vistas: ranking mercado×liga con orden por ROI/aprobados/efectividad/ganancia; comparación mercado×segmento×liga; curva de ganancia acumulada, rentabilidad mensual y detalle. Se muestran pendientes, pronósticos y partidos únicos por separado. `null` se presenta como «Sin datos», incluyendo porcentajes sin evaluados. Ningún resultado pendiente se convierte en pérdida.

## Validación local

Compilación, sin sobrescribir el `dist` versionado:

```sh
NG_BUILD_MAX_WORKERS=4 npm run build -- --output-path=dist-vercel
```

Pruebas unitarias con HTTP simulado:

```sh
CHROME_BIN=/tmp/bettics-chromium npm test -- --watch=false --browsers=ChromeHeadless --ts-config=tsconfig.backtest-spec.json --include='src/app/main/account/pages/backtest/*.spec.ts'
```

La configuración específica excluye el fallo anterior de `app.component.spec.ts` por `AppComponent.title`, que permanece ajeno a este cambio. La compilación conserva advertencias anteriores de CommonJS y presupuestos CSS en otros componentes.

Prueba de navegador (requiere ambos repositorios hermanos y Playwright instalado):

```sh
BACKTEST_BASE_URL=http://127.0.0.1:4302 PLAYWRIGHT_MODULE=/opt/codex/cua_node/lib/node_modules/playwright node scripts/backtest-browser-smoke.cjs
```

Ejecutar con una instancia local de Angular o un servidor SPA que sirva `dist-vercel`. Todas las APIs externas son interceptadas; el test usa el cálculo real del backend con 100 pronósticos sintéticos. Comprueba filtros y segmentos, ranking, comparación, curva, paginación, pendientes, diseño móvil y retorno a Resultados actuales. Las hojas de fuentes externas se sustituyen por CSS vacío para permitir la carga local sin conectarse a Google Fonts; el resto de recursos externos se bloquea.

Las capturas se generan en `docs/screenshots/` y llevan el distintivo «Datos simulados · Validación local». No representan el rendimiento del backtest real ni prueban acceso a MongoDB.

## Publicación pendiente

La publicación está autorizada. La rama frontend parte de master y depende de las nuevas APIs de la rama backend `feature/backtest-resultados` (PR #2, basada en el PR #1). Mantener la escritura del backtest deshabilitada. El backend requiere verificar su configuración de lectura y autenticación en el proceso de publicación autorizado; los resultados que no pueda confirmar la consulta se muestran como pendientes.

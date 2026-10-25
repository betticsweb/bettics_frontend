# Resultados y Fiabilidad

Cambios exclusivamente frontend. No se modifican backend, MongoDB, ETL, mercados ni políticas. La ruta `/cuenta/resultados` conserva su componente y dependencias de routing, mostrando directamente Backtest histórico. Los servicios y APIs heredados se conservan; ya no se ejecutan las consultas de la antigua subpestaña al entrar en esta pantalla.

## Navegación y filtros persistentes

Las acciones de cada recomendación son tres íconos en la columna derecha: Estadísticas, Fiabilidad (escudo) y Ayuda. Fiabilidad comparte estilos, tooltip y foco accesible. La cuadrícula y sus breakpoints no cambian. El tamaño compacto de las acciones permite conservar el alto de la tarjeta; la prueba de navegador compara sus dimensiones con el diseño anterior.

`reliabilityParams` permite exclusivamente los cuatro mercados compatibles, distinguiendo totales del partido de totales de equipo y ganador de córners. HOME solo se asocia al equipo local. Rechaza períodos, líneas distintas, ambos marcan, ganador de goles, segmentos ausentes/ambiguos y N4 en mercados que no lo permiten. Los códigos N1–N4 se usan como segmentos, nunca como umbral o período. No cambia las reglas de recomendaciones.

Ejemplo de enlace:

```text
/cuenta/resultados?liga=Germany%20Bundesliga&mercado=CORNERS_OVER_85&segmento=N1&temporada=ultima&origen=fiabilidad
```

El destinatario resuelve la temporada de esa liga y sustituye `ultima` por el valor real en la URL sin crear una entrada extra en el historial. La recarga, enlaces compartidos y navegación atrás mantienen filtros, vista, orden, dirección y página. `temporada=todas` conserva explícitamente el histórico completo.

Mercado, segmento, liga, temporada, versión y fechas se envían a la API para afectar todos los indicadores, ranking, segmentos, curvas y detalle. Un contexto incompatible muestra un aviso y oculta los resultados específicos hasta que el usuario elija filtros; no se selecciona arbitrariamente otro mercado/segmento. Las selecciones dinámicas usan valores explícitos para que los controles permanezcan sincronizados con los filtros realmente aplicados.

## Temporada predeterminada

La API actual no informa un indicador de temporada en curso ni fechas de inicio/fin. Se usa el fallback solicitado: la temporada del pronóstico aprobado más reciente en los datos del alcance de liga y versión. Se obtiene con una consulta `limit=1` por liga/versión, sin descargar la colección ni aplicar el segmento/mercado durante esa resolución. Luego se consulta el conjunto realmente filtrado. Cambiar de liga vuelve a resolver su temporada; los años simples de Perú no se convierten en temporadas europeas. Si no hay datos o es necesario elegir versión, no se inventa una temporada ni se toma la de otra liga.

El catálogo general de temporadas continúa mostrando las opciones existentes de la API; elegir una sin aprobados para la liga muestra un conjunto vacío. Nunca se utilizan calendarios de temporada supuestos.

## Ranking y detalle

ROI es la primera columna numérica, antes de Aprobados, tanto en ranking como en comparación de segmentos. Se puede ordenar por mercado, liga, ROI, aprobados, efectividad y ganancia en ambas direcciones, con controles y encabezados accesibles. El orden se aplica a todas las filas agregadas devueltas por la API; los valores sin datos quedan al final. No se envían parámetros de orden nuevos que el backend no reconoce.

Evolución y detalle presenta primero la tabla individual, con fecha, equipos, mercado, segmento, selección, cuota, estadística real evaluada, resultado y ganancia. El marcador disponible se etiqueta Goles o Córners según el mercado y se muestra su suma; no se inventan estadísticas de otras categorías que la API no devuelve. Pendientes sin marcador muestran Sin resultado confirmado. La paginación sigue siendo del servidor, 25 filas; curva y mensual conservan las mismas respuestas y cálculos.

## Validación

- Compilación de producción con `--output-path=dist-vercel`, sin sobrescribir el dist versionado.
- 23 pruebas Angular enfocadas: mapeo, segmentos, temporadas, filtros efectivos, persistencia, orden, cancelación, errores y marcadores ausentes/cero.
- Navegador: íconos en orden vertical, tres columnas y tarjetas del mismo ancho/alto; N1/N2 y conjunto; controles sincronizados con URL/API; recarga y paginación; orden ascendente/descendente; aviso de mercado incompatible; vista móvil sin desbordamiento; ausencia de llamadas a Resultados actuales.
- Regresión de Estadísticas, popup de ayuda y navegación desde recomendaciones mediante el script existente.

Comandos:

```sh
NG_BUILD_MAX_WORKERS=4 npm run build -- --output-path=dist-vercel
CHROME_BIN=/tmp/bettics-tools/chromium npm test -- --watch=false --browsers=ChromeHeadless --ts-config=tsconfig.results-ux-spec.json --include='src/app/main/account/pages/backtest/*.spec.ts' --include='src/app/shared/utils/backtest-navigation.spec.ts'
RESULTS_BASE_URL=http://127.0.0.1:4305 PLAYWRIGHT_MODULE=/opt/codex/cua_node/lib/node_modules/playwright node scripts/results-reliability-browser.cjs
STATISTICS_BASE_URL=http://127.0.0.1:4305 PLAYWRIGHT_MODULE=/opt/codex/cua_node/lib/node_modules/playwright node scripts/statistics-browser-smoke.cjs
```

Los scripts de navegador requieren un servidor SPA local con la compilación y Playwright/Chromium; el de Fiabilidad utiliza las funciones del checkout hermano `bettics_backend`. Las respuestas HTTP son simuladas. Sus fixtures reproducen las cifras agregadas previamente verificadas en v70 para Bundesliga 2026/2027 (18/+19.61%, 12/+29.92%, conjunto 30/+23.73%), pero **los partidos y recomendaciones de las capturas son sintéticos**, no el feed privado real. La navegación desde una recomendación real autenticada no se presenta como verificada desde este entorno sin sesión. Las capturas llevan aviso de datos de prueba y se guardan en `docs/screenshots/results-ux/`.

El fallo previo de la suite general en `AppComponent.title` sigue separado y excluido de la configuración enfocada. No se alteran pruebas para ocultarlo. Las advertencias anteriores de CommonJS y presupuestos CSS ajenos a este módulo se conservan.

Publicación autorizada por el usuario si estas pruebas pasan: PR sobre master, Preview y después producción Vercel. La API de Resultados sigue pasando por la ruta segura del mismo origen; los otros módulos mantienen Render. No se requieren cambios en Heroku ni en la protección de escrituras.

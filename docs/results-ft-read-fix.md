# Lectura de tres mercados FT: causa y corrección

Diagnóstico sobre producción: www.bettics.com.pe servía runtime.a897df141d61f2e9.js y 317.17c4d1f6b5a5ffa1.js (master 66871dd). Ese bundle no contenía BTTS_YES, FT_HOME_WIN ni FT_AWAY_WIN, pero sí el mensaje «El mercado del enlace no tiene una correspondencia exacta». El frontend PR #4 aún no estaba publicado. Por eso las opciones retornadas por MongoDB aparecían en el selector y el cliente rechazaba el mercado antes de consultar sus resultados.

Heroku v71 ya incorpora esos códigos al contrato y motor, tanto parseQuery como settle; backtestAprobados continúa como colección madre y se usan intHomeScore/intAwayScore confirmados del mismo cruce que GOLES_OVER_25. No se necesita recargar MongoDB ni otro despliegue backend para resolver la lista local del frontend.

La publicación del PR #4 incorpora los tres códigos reales, sus etiquetas y segmentos N1–N3; Fiabilidad reconoce nombres de recomendación y códigos canónicos. Se conservan los cuatro mercados, el diseño y las tres tarjetas por fila. Valores de temporada 2026 y 2026/2027 se conservan literalmente. temporada=todas se persiste en URL y nunca se envía como filtro a la API: consulta todas las temporadas. El selector dinámico puede mantener cualquiera de los siete códigos.

Validación: 35 pruebas Angular, compilación y navegador con la API real del backend ejecutada sobre fixtures sintéticos. Tres mercados consultados individualmente, datos evaluados, ROI y marcador FT, detalle paginado, recarga de URL y temporadas. Las cantidades 2110/1230/260 informadas por el propietario se reproducen SOLO en fixtures para verificar la transmisión de filtros y la presentación; no son una comprobación privada de Atlas. La referencia de córners Bundesliga N1/N2 y el diseño siguen pasando.

La API privada desde este entorno devuelve 401 sin el JWT del usuario. No se afirma una nueva comprobación remota de los 23412 registros, su evaluación o ROI. Los enlaces de validación directa en una sesión existente son:

- /cuenta/resultados?mercado=BTTS_YES&temporada=todas
- /cuenta/resultados?mercado=FT_HOME_WIN&temporada=todas
- /cuenta/resultados?mercado=FT_AWAY_WIN&temporada=todas

No se modifica ningún documento, configuración Heroku ni interruptor de escritura. La protección del endpoint sin sesión sigue respondiendo 401. La verificación de despliegue se hace mediante estado Vercel y contenido de los bundles servidos por el dominio público, no solo mediante push.

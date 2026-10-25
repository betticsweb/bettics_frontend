# Tres mercados FT en el flujo existente

Se conserva R Source -> mismo CSV consolidado -> mismo Python Legacy -> mismo endpoint -> backtestAprobados. Se reconocen AMBOS_MARCAN_SI/YES, GANADOR_FT_LOCAL/HOME y GANADOR_FT_VISITANTE/AWAY, FT, linea null, segmentos estructuralmente N1–N3. La aprobación sigue exclusivamente en R, sin manifiestos adicionales. HT y BTTS No excluidos.

Fiabilidad conserva filtros persistentes y solo comprueba compatibilidad del backend desplegado; no exige otro proceso de aprobación. El motor usa goles FT confirmados y las agregaciones existentes. Diseño y cuatro mercados originales conservados. El listado de filas reales aparecerá al cargarse sus aprobados por el flujo habitual; no se simulan datos.

El único pendiente de generación es inspeccionar el R Source actual y su malla: esos archivos no están en los repositorios ni en los adjuntos. No es obligatorio recomendaciones_hist.csv ni un ETL alternativo. Ver documentación del PR backend #4 para las acciones mínimas por mercado.

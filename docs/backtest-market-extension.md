# Ampliación exclusivamente FT

Fiabilidad reconoce Ambos marcan Sí, ganador FT Local y ganador FT Visitante. HT y Ambos marcan No quedan excluidos. El segmento N1–N3 se conserva sin declarar su aprobación: se comprueba contra el catálogo de políticas verificadas del backend antes de enviar el filtro. Sin catálogo o política compatible se muestra un aviso sin ROI.

Los scripts Python originales adjuntos confirman Ambos equipos marcan con valorOpcionApuesta=0.5 como BTTS Sí. Se admite «Más de»/«Más de 0.5» únicamente para ese mercado exacto y valor 0.5; no se extrapola a goles totales. Ganador se identifica por selección explícita de equipo local/visitante. No se modifica el diseño ni la distribución de tres tarjetas.

La documentación detallada de fuentes, SHA de adjuntos, discrepancia cuotaSimple/cuotaCombinada y archivos R/CSV pendientes está en el PR backend #4. Los adjuntos son generadores Python de HTML, no reportes con filas ni políticas R N1–N3.

Pruebas enfocadas con API simulada y compilación; no se afirman datos nuevos reales de producción. La carga está bloqueada hasta comprobar las políticas y evidencia OOT. Los cuatro mercados actuales se conservan.

export interface MarketSelection {
  liga: string; equipoLocal: string; equipoVisitante: string;
  mercadoApuesta: string; opcionApuesta: string; valorOpcionApuesta: string;
  idHomeTeam?: string; idAwayTeam?: string;
}
const normalize = (value: string) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function marketContext(selection: MarketSelection) {
  const market = normalize(selection.mercadoApuesta);
  const option = normalize(selection.opcionApuesta);
  const tab = /corner|esquina/.test(market) ? 2 : /tarjeta/.test(market) ? 3 : /tiro|disparo/.test(market) ? 4 : /gol/.test(market) ? 1 : 0;
  const unit = ['', 'goles', 'córners', 'tarjetas', 'tiros a puerta'][tab];
  // Read the line from the selection, never from market identifiers such as (N123).
  const line = String(selection.valorOpcionApuesta || selection.opcionApuesta || '').replace(',', '.').match(/(?:^|\s)(\d+(?:\.\d+)?)(?:\s|$)/);
  const threshold = line ? Number(line[1]) : null;
  const direction = /menos|under/.test(option + ' ' + market) ? 'menos' : /mas|over/.test(option + ' ' + market) ? 'mas' : '';
  const scope = /local/.test(market) ? 'local' : /visita/.test(market) ? 'visita' : 'total';
  return {tab, unit, threshold, direction, scope};
}
export function statisticsParams(selection: MarketSelection) {
  const context = marketContext(selection);
  return {liga: selection.liga, equipoLocal: selection.equipoLocal, equipoVisitante: selection.equipoVisitante,
    idHomeTeam: selection.idHomeTeam || null, idAwayTeam: selection.idAwayTeam || null,
    mercado: selection.mercadoApuesta, opcion: selection.opcionApuesta,
    tab: context.tab || null, umbral: context.threshold, sentido: context.direction, alcance: context.scope};
}
export function explainMarket(selection: MarketSelection): string {
  const {tab, unit, threshold, direction, scope} = marketContext(selection);
  const market = normalize(selection.mercadoApuesta);
  const subject = scope === 'local' ? selection.equipoLocal : scope === 'visita' ? selection.equipoVisitante : 'los dos equipos en conjunto';
  const disclaimer = ' Es una estimación, no garantiza el resultado.';
  if (/ambos|anotan/.test(market)) return `Ambos marcan significa que cada equipo anota al menos un gol. Un 1–1 cumple «Sí»; un 1–0 cumple «No».${disclaimer}`;
  if (tab && threshold !== null && direction) {
    const over = direction === 'mas';
    const success = over ? Math.floor(threshold) + 1 : Math.max(0, Math.ceil(threshold) - 1);
    const failure = over ? Math.max(0, Math.ceil(threshold) - 1) : Math.floor(threshold) + 1;
    return `Se cuentan los ${unit} de ${subject}. «${over ? 'Más' : 'Menos'} de ${threshold}» se cumple con ${success} ${unit}; con ${failure} no se cumple.${Number.isInteger(threshold) ? ' Si el total coincide con la línea, la liquidación depende de las reglas del mercado.' : ''}${disclaimer}`;
  }
  if (/doble oportunidad/.test(market)) return `La doble oportunidad cubre dos resultados: 1X es victoria de ${selection.equipoLocal} o empate; X2 es empate o victoria de ${selection.equipoVisitante}; 12 es victoria de cualquiera, sin empate.${disclaimer}`;
  if (/ganador|resultado/.test(market)) return `1 significa victoria de ${selection.equipoLocal}, X empate y 2 victoria de ${selection.equipoVisitante}. Por ejemplo, 2–1 corresponde a 1 y 0–0 a X.${disclaimer}`;
  return `La selección es «${selection.mercadoApuesta}: ${selection.opcionApuesta} ${selection.valorOpcionApuesta || ''}». ${tab ? `Este mercado cuenta ${unit}.` : 'Consulta las reglas de este mercado para conocer cómo se liquida.'}${disclaimer}`;
}

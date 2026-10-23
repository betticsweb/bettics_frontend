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
function periodExplanation(selection: MarketSelection): string {
  const text = normalize(`${selection.mercadoApuesta} ${selection.opcionApuesta} ${selection.valorOpcionApuesta}`);
  const first = /primer(?:o)?\s*(?:tiempo|mitad)|1\s*(?:er|ro|[.°ºª])?\s*(?:tiempo|mitad)|primera\s*mitad|1\s*[ht]\b|first\s*half/.test(text);
  const second = /segund[oa]\s*(?:tiempo|mitad)|2\s*(?:do|[.°ºª])?\s*(?:tiempo|mitad)|2\s*[ht]\b|second\s*half/.test(text);
  if (first && second) return 'El mercado menciona ambos tiempos; revisa las condiciones de cada mitad por separado.';
  if (first) return 'Esta recomendación es solo del primer tiempo: se cuenta hasta el descanso, incluido su tiempo añadido. Lo que pase en el segundo tiempo no cuenta.';
  if (second) return 'Esta recomendación es solo del segundo tiempo, incluido su tiempo añadido. Se empieza a contar desde cero al volver del descanso; el primer tiempo no cuenta.';
  if (/partido completo|ganador del partido|tiempo (?:completo|reglamentario)|90\s*(?:min|minutos)|full\s*time|\bft\b|total (?:de )?(?:goles|corners|tiros|tarjetas)|ambos.*(?:marc|anot)|doble oportunidad|equipo con mas/.test(text)) return 'Esta recomendación es del partido completo: los 90 minutos y el tiempo añadido, sin prórroga ni penaltis, salvo que el mercado indique otras reglas.';
  // Codes such as (N1) identify markets; they do not establish a match period.
  return 'El nombre recibido no especifica el período. Confirma en el mercado si corresponde a una mitad o al partido completo; no se puede deducir del código entre paréntesis.';
}

export function explainMarket(selection: MarketSelection): string {
  const {tab, unit, threshold, direction, scope} = marketContext(selection);
  const market = normalize(selection.mercadoApuesta);
  const option = normalize(`${selection.opcionApuesta} ${selection.valorOpcionApuesta}`);
  const subject = scope === 'local' ? selection.equipoLocal : scope === 'visita' ? selection.equipoVisitante : 'los dos equipos en conjunto';
  const prefix = `${periodExplanation(selection)} `;
  const disclaimer = ' Los ejemplos se refieren únicamente al período del mercado. La recomendación no garantiza el resultado.';
  if (/handicap|asiatico|asiatica/.test(market) || (threshold !== null && !Number.isInteger(threshold * 2))) {
    return `${prefix}La selección es «${selection.mercadoApuesta}: ${selection.opcionApuesta} ${selection.valorOpcionApuesta || ''}». Este mercado puede incluir ajustes o dividir la apuesta entre dos líneas; confirma sus reglas de liquidación antes de interpretar el resultado.${disclaimer}`;
  }
  if (/ambos.*(?:marc|anot)|(?:marc|anot).*ambos/.test(market)) {
    const negative = /\bno\b/.test(option) || (direction === 'menos' && threshold === 0.5);
    return `${prefix}Ambos equipos marcan significa que ${selection.equipoLocal} y ${selection.equipoVisitante} anotan al menos un gol cada uno en ese período. ${negative ? 'La selección «No» se cumple con 1–0 o 0–0; no se cumple con 1–1.' : 'La selección afirmativa (Sí o más de 0.5 goles de cada equipo) se cumple con 1–1; no se cumple con 1–0 ni 0–0.'}${disclaimer}`;
  }
  if (tab && /equipo con mas|ganador|mas (?:corners|tiros de esquina|tarjetas|tiros a puerta)/.test(market) && !/total|mas de/.test(market)) {
    return `${prefix}Se comparan los ${unit} de cada equipo en ese período. La selección «${selection.opcionApuesta}» necesita que ese equipo tenga más ${unit} que su rival, no solo que supere una cantidad. Por ejemplo, con 6 de ${selection.equipoLocal} y 4 de ${selection.equipoVisitante}, gana ${selection.equipoLocal} en este mercado; con 4–6 gana ${selection.equipoVisitante}. Si quedan iguales, hay empate; su liquidación depende de las reglas del mercado.${disclaimer}`;
  }
  if (tab && threshold !== null && direction) {
    const over = direction === 'mas';
    const success = over ? Math.floor(threshold) + 1 : Math.max(0, Math.ceil(threshold) - 1);
    const failure = over ? Math.max(0, Math.ceil(threshold) - 1) : Math.floor(threshold) + 1;
    return `${prefix}Se cuentan los ${unit} de ${subject} en ese período. «${over ? 'Más' : 'Menos'} de ${threshold}» se cumple con ${success} ${success === 1 ? ({goles: 'gol', 'córners': 'córner', tarjetas: 'tarjeta', 'tiros a puerta': 'tiro a puerta'} as Record<string, string>)[unit] : unit}; con ${failure} no se cumple.${Number.isInteger(threshold) ? ' Si el total coincide con la línea, la liquidación depende de las reglas del mercado.' : ''}${disclaimer}`;
  }
  if (/doble oportunidad/.test(market)) return `${prefix}La doble oportunidad cubre dos resultados del período indicado: 1X es victoria de ${selection.equipoLocal} o empate; X2 es empate o victoria de ${selection.equipoVisitante}; 12 es victoria de cualquiera, sin empate. Por ejemplo, con 1–1 se cumplen 1X y X2, pero no 12.${disclaimer}`;
  if (/resultado exacto|marcador exacto/.test(market)) return `${prefix}El marcador debe coincidir exactamente con la selección, con los goles de ${selection.equipoLocal} primero y los de ${selection.equipoVisitante} después. Por ejemplo, seleccionar 2–1 se cumple con 2–1, pero no con 1–2 ni 3–1.${disclaimer}`;
  if (/ganador|resultado|1x2/.test(market)) return `${prefix}Se compara el marcador del período indicado: 1 significa victoria de ${selection.equipoLocal}, X empate y 2 victoria de ${selection.equipoVisitante}. Por ejemplo, 2–1 corresponde a 1 y 0–0 a X.${disclaimer}`;
  return `${prefix}La selección es «${selection.mercadoApuesta}: ${selection.opcionApuesta} ${selection.valorOpcionApuesta || ''}». ${tab ? `Este mercado cuenta ${unit}.` : 'Consulta las reglas de este mercado para conocer cómo se liquida.'}${disclaimer}`;
}

import { MarketSelection } from './recommendation-market';

export const BACKTEST_MARKETS: Record<string, { label: string; segments: string[] }> = {
  CORNERS_OVER_85: { label: 'Más de 8.5 córners', segments: ['N1','N2','N3','N4'] },
  CORNERS_UNDER_105: { label: 'Menos de 10.5 córners', segments: ['N1','N2','N3','N4'] },
  GOLES_OVER_25: { label: 'Más de 2.5 goles', segments: ['N1','N2','N3'] },
  CORNERS_LOCAL_GANA: { label: 'Local con más córners', segments: ['N1','N2','N3'] }
};
export const ADDITIONAL_MARKETS: Record<string,string> = {
  BTTS_YES:'Ambos marcan — Sí',
  FT_HOME_WIN:'Ganador FT — Local', FT_AWAY_WIN:'Ganador FT — Visitante'
};
export const isAdditionalMarket = (value: string): boolean => Object.prototype.hasOwnProperty.call(ADDITIONAL_MARKETS,value);
export const isBacktestMarket = (value: string): boolean => Object.prototype.hasOwnProperty.call(BACKTEST_MARKETS,value);
const text = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ');
export function reliabilityParams(selection: MarketSelection & { segmento?: string }) {
  const raw = String(selection.mercadoApuesta || '');
  const codes = [...raw.matchAll(/\(\s*(N\d+)\s*\)/gi)].map(m => m[1].toUpperCase());
  if (selection.segmento) codes.push(String(selection.segmento).trim().toUpperCase());
  const segments = [...new Set(codes)];
  const segment = segments.length === 1 && /^N[1-4]$/.test(segments[0]) ? segments[0] : null;
  const name = text(raw.replace(/\(\s*N\d+\s*\)/gi,''));
  const option = text(selection.opcionApuesta);
  const combined = text(name + ' ' + selection.opcionApuesta + ' ' + selection.valorOpcionApuesta).replace(/,/g,'.');
  let market: string | null = null;
  const unsupported = /handicap|asiatic|ambos|cada equipo|primer|segund|mitad|tiempo|\b(?:ht|1h|2h|1t|2t)\b/.test(combined);
  const teamSelection = /\blocal\b|visita|\bequipo\b|\bhome\b|\baway\b/.test(combined) || [selection.equipoLocal,selection.equipoVisitante].some(team=>text(team).length>2 && option.includes(text(team)));
  const canonical = Object.keys(BACKTEST_MARKETS).find(code => text(code) === name);
  if (!unsupported && (name === 'equipo con mas corners' || name === 'equipo con mas tiros de esquina' || canonical === 'CORNERS_LOCAL_GANA')) {
    if (option && text(selection.equipoLocal) && option === text(selection.equipoLocal) || ['home','local','1'].includes(option)) market = 'CORNERS_LOCAL_GANA';
  } else if (!unsupported && !teamSelection && canonical) {
    // Canonical codes are unambiguous; reject an explicitly contradictory option/line.
    const expected = canonical === 'CORNERS_UNDER_105' ? 'under' : 'over';
    const wrong = expected === 'over' ? /menos|under/ : /mas|over/;
    const numbers = [...combined.matchAll(/(?:^|\s)(\d+(?:\.\d+)?)(?=\s|$)/g)].map(m=>Number(m[1]));
    const line = canonical === 'CORNERS_OVER_85' ? 8.5 : canonical === 'CORNERS_UNDER_105' ? 10.5 : 2.5;
    if (!wrong.test(option) && numbers.every(n => n === line)) market = canonical;
  } else if (!unsupported && !teamSelection) {
    const over = /\bmas de\b|\bover\b/.test(combined), under = /\bmenos de\b|\bunder\b/.test(combined);
    const numbers = [...new Set([...combined.matchAll(/(?:^|\s)(\d+(?:\.\d+)?)(?=\s|$)/g)].map(m=>Number(m[1])))];
    const corners = /^(?:total(?: de)? (?:corners|tiros de esquina)|corners totales|(?:mas de|menos de|over|under) \d+(?:\.\d+)? (?:corners|tiros de esquina))$/.test(name);
    const goals = /^(?:total(?: de)? goles|goles totales|(?:mas de|over) \d+(?:\.\d+)? goles)$/.test(name);
    if (over !== under && numbers.length === 1) {
      if (corners && over && numbers[0] === 8.5) market = 'CORNERS_OVER_85';
      if (corners && under && numbers[0] === 10.5) market = 'CORNERS_UNDER_105';
      if (goals && over && numbers[0] === 2.5) market = 'GOLES_OVER_25';
    }
  }
  if (!market && !/handicap|asiatic|segundo/.test(name)) {
    if (/^(?:ambos equipos marcan|ambos marcan)$/.test(name)) {
      if (['si','yes'].includes(option) || /^(?:mas de|over)(?: 0[.,]5)?$/.test(option) && String(selection.valorOpcionApuesta).replace(',','.')==='0.5') market='BTTS_YES';
    }
    if (/^ganador del partido$/.test(name)) {
      if (['home','local','1'].includes(option) || !!text(selection.equipoLocal) && option===text(selection.equipoLocal)) market='FT_HOME_WIN';
      if (['away','visitante','2'].includes(option) || !!text(selection.equipoVisitante) && option===text(selection.equipoVisitante)) market='FT_AWAY_WIN';
    }
  }
  // Canonical identifiers from the CSV/API are also valid deep-link sources.
  const extraCode=Object.keys(ADDITIONAL_MARKETS).find(code=>text(code)===name);
  if(extraCode) {
    if(extraCode==='BTTS_YES') {
      if(['','si','yes'].includes(option) || /^(?:mas de|over)(?: 0[.,]5)?$/.test(option) && String(selection.valorOpcionApuesta).replace(',','.')==='0.5') market=extraCode;
    } else {
      const home=extraCode==='FT_HOME_WIN';
      const accepted=home?['','home','local','1']:['','away','visitante','2'];
      const team=text(home?selection.equipoLocal:selection.equipoVisitante);
      if(accepted.includes(option) || !!team&&option===team)market=extraCode;
    }
  }
  const compatible = market && isAdditionalMarket(market) ? !!segment && ['N1','N2','N3'].includes(segment) : market && segment && BACKTEST_MARKETS[market].segments.includes(segment);
  return {
    liga: selection.liga, mercado: market, segmento: compatible ? segment : null,
    temporada: 'ultima', origen: 'fiabilidad',
    aviso: !market ? 'mercado_no_compatible' : !compatible ? 'segmento_no_compatible' : null,
    recomendacion: raw.slice(0,200)
  };
}

// No calendar start/end dates are invented. The API currently supplies no in-progress flag.
// For a league, its newest actual approved match identifies the latest season in that league.
export function seasonFromData(response: any, league: string): string | null {
  const row = response?.detalle?.registros?.[0];
  if (!row || league && row.liga !== league) return null;
  return row.temporada ? String(row.temporada) : null;
}
export function sortedBacktestRows(rows: any[], field: string, direction: string, labels: Record<string,string>): any[] {
  const value = (row: any) => field === 'mercado' ? labels[row.mercado] || row.mercado : row[field];
  return [...rows].sort((a,b) => {
    const x=value(a), y=value(b);
    if (x === null || x === undefined) return y === null || y === undefined ? 0 : 1;
    if (y === null || y === undefined) return -1;
    const order = typeof x === 'string' ? x.localeCompare(String(y),'es',{numeric:true}) : x-y;
    return (direction === 'asc' ? order : -order) || String(a.liga).localeCompare(String(b.liga),'es') || String(a.segmento || '').localeCompare(String(b.segmento || ''));
  });
}

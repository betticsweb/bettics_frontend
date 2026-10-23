import { MarketSelection, marketContext } from './recommendation-market';

export type AnalysisKind = 'total' | 'both' | 'winner' | 'comparison' | 'unsupported';
export interface Analysis {
  tab: number; kind: AnalysisKind; period: string; scope: string;
  threshold: number | null; direction: string; result: string;
}
const clean = (value: any) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export function numberStat(value: any): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !/^\d+(?:\.\d+)?$/.test(value.trim())) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) && n >= 0 ? n : null;
}
export function analysisContext(selection: MarketSelection): Analysis {
  const context = marketContext(selection);
  const market = clean(selection.mercadoApuesta);
  const text = clean(`${selection.mercadoApuesta} ${selection.opcionApuesta}`);
  const first = /primer(?:o|a)?\s*(?:tiempo|mitad)|1\s*(?:er|ro|[.°ºª])?\s*(?:tiempo|mitad)|1\s*[ht]\b|first\s*half/.test(text);
  const second = /segund[oa]\s*(?:tiempo|mitad)|2\s*(?:do|[.°ºª])?\s*(?:tiempo|mitad)|2\s*[ht]\b|second\s*half/.test(text);
  const period = first && second ? 'primer/segundo tiempo' : first ? 'primer tiempo' : second ? 'segundo tiempo' : '';
  const option = clean(selection.opcionApuesta);
  const value = clean(selection.valorOpcionApuesta);
  let kind: AnalysisKind = !context.tab ? 'unsupported' : /ambos.*(?:marc|anot)|(?:marc|anot).*ambos|cada equipo.*(?:gol|marc|anot)|(?:gol|marc|anot).*cada equipo/.test(market) ? 'both' : /equipo con mas/.test(market) ? 'comparison' : context.tab === 5 ? 'winner' : 'total';
  let result = '';
  if (kind === 'both') {
    if (/\bno\b/.test(option + ' ' + value) || (context.direction === 'menos' && context.threshold === 0.5)) result = 'no';
    else if (/\bsi\b/.test(option + ' ' + value) || (context.direction === 'mas' && context.threshold === 0.5)) result = 'si';
  } else if (kind === 'winner' || kind === 'comparison') {
    const choices = [option, value];
    if (choices.some(x => x === '1' || x === 'local' || x === clean(selection.equipoLocal))) result = '1';
    else if (choices.some(x => x === '2' || x === 'visitante' || x === 'visita' || x === clean(selection.equipoVisitante))) result = '2';
    else if (choices.some(x => x === 'x' || x === 'empate')) result = 'X';
  }
  if (kind === 'total' && (context.threshold === null || !context.direction || !Number.isInteger(context.threshold * 2))) kind = 'unsupported';
  if (['both', 'winner', 'comparison'].includes(kind) && !result) kind = 'unsupported';
  return {...context, kind, period, result};
}
export function teamSide(row: any, id: any, name: string): 'Home' | 'Away' | null {
  if (id !== null && id !== undefined && id !== '') {
    if (String(row.idHomeTeam) === String(id)) return 'Home';
    if (String(row.idAwayTeam) === String(id)) return 'Away';
    if (row.idHomeTeam && row.idAwayTeam) return null;
  }
  if (name && clean(row.strHomeTeam) === clean(name)) return 'Home';
  if (name && clean(row.strAwayTeam) === clean(name)) return 'Away';
  return null;
}
export function evaluate(row: any, analysis: Analysis, home: {id: any; name: string}, away: {id: any; name: string}, focus: 'home' | 'away' | 'h2h'): boolean | null {
  if (analysis.period || analysis.kind === 'unsupported') return null;
  const keys = analysis.tab === 2 ? ['cornerKicksHome', 'cornerKicksAway'] : analysis.tab === 3 ? ['totalCardsHome', 'totalCardsAway'] : analysis.tab === 4 ? ['shotsonGoalHome', 'shotsonGoalAway'] : ['intHomeScore', 'intAwayScore'];
  const h = numberStat(row[keys[0]]), a = numberStat(row[keys[1]]);
  if (analysis.kind === 'both') return h === null || a === null ? null : ((h > 0 && a > 0) === (analysis.result === 'si'));
  if (analysis.kind === 'winner' || analysis.kind === 'comparison') {
    if (h === null || a === null) return null;
    const team = focus === 'away' ? away : home;
    const side = teamSide(row, team.id, team.name);
    if (!side) return null;
    const own = side === 'Home' ? h : a, rival = side === 'Home' ? a : h;
    if (analysis.result === 'X') return own === rival;
    const win = analysis.result === (focus === 'away' ? '2' : '1');
    return win ? own > rival : own < rival;
  }
  let n: number | null;
  if (analysis.scope === 'total') n = h === null || a === null ? null : h + a;
  else {
    const team = analysis.scope === 'local' ? home : away;
    const side = teamSide(row, team.id, team.name);
    n = side === 'Home' ? h : side === 'Away' ? a : null;
  }
  return n === null || analysis.threshold === null ? null : analysis.direction === 'menos' ? n < analysis.threshold : n > analysis.threshold;
}
export function frequency(results: Array<boolean | null>): string {
  const valid = results.filter(x => x !== null);
  const hits = valid.filter(x => x === true).length;
  return valid.length ? `${hits}/${valid.length} · ${Math.round(100 * hits / valid.length)} %` : 'Sin datos';
}

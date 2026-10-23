import { analysisContext, evaluate, frequency, numberStat } from './statistics-analysis';
import { statisticsParams } from './recommendation-market';
describe('Statistics recommendation calculations', () => {
  const selection = {liga: 'Liga', equipoLocal: 'A', equipoVisitante: 'B', mercadoApuesta: 'Total goles (N1)', opcionApuesta: 'Más de', valorOpcionApuesta: '2.5'};
  const home = {id: 'a', name: 'A'}, away = {id: 'b', name: 'B'};
  const row = {idHomeTeam: 'b', strHomeTeam: 'B', idAwayTeam: 'a', strAwayTeam: 'A', intHomeScore: 0, intAwayScore: 2, cornerKicksHome: 4, cornerKicksAway: 5};
  const context = (market: string, option: string, value = '') => analysisContext({...selection, mercadoApuesta: market, opcionApuesta: option, valorOpcionApuesta: value});
  const check = (analysis: any, match: any = row, focus: any = 'home') => evaluate(match, analysis, home, away, focus);
  for (const [market, tab] of [['Total goles', 1], ['Total córners', 2], ['Tarjetas', 3], ['Tiros a puerta', 4], ['Ganador del partido', 5], ['Ambos equipos marcan', 1]] as const) {
    it(`routes ${market} to its tab`, () => expect(statisticsParams({...selection, mercadoApuesta: market}).tab).toBe(tab));
  }
  it('compares totals above 8.5 and below 10.5 corners', () => {
    expect(check(context('Total córners', 'Más de', '8.5'))).toBeTrue();
    expect(check(context('Total córners', 'Menos de', '10.5'))).toBeTrue();
    expect(check(context('Total córners', 'Menos de', '8.5'))).toBeFalse();
  });
  it('does not confuse a comparison winner with a numeric total', () => {
    const c = context('Equipo con más córners (N3)', 'A', '');
    expect(c.kind).toBe('comparison');
    expect(check(c)).toBeTrue();
    expect(check(c, {...row, cornerKicksHome: 5}, 'away')).toBeFalse();
  });
  it('tracks an upcoming home team playing away in history', () => {
    expect(check(context('Ganador del partido', '1'))).toBeTrue();
    expect(check(context('Ganador del partido', '2'))).toBeFalse();
    expect(check(context('Goles local', 'Más de', '1.5'))).toBeTrue();
  });
  it('counts the same selection as a loss of the opposing team in its history', () => {
    expect(check(context('Ganador del partido', '1'), row, 'away')).toBeTrue();
    expect(check(context('Ganador del partido', '2'), row, 'away')).toBeFalse();
  });
  it('counts draws including zero goals', () => {
    expect(check(context('Ganador del partido', 'X'), {...row, intAwayScore: 0})).toBeTrue();
  });
  it('handles both teams scoring yes and no', () => {
    expect(check(context('Ambos marcan', 'Sí'))).toBeFalse();
    expect(check(context('Ambos marcan', 'No'))).toBeTrue();
    expect(check(context('Ambos marcan', 'Sí'), {...row, intHomeScore: 1})).toBeTrue();
    expect(check(context('Ambos marcan', 'No'), {...row, intHomeScore: 1})).toBeFalse();
    expect(check(context('Ambos marcan', 'Más de', '0.5'))).toBeFalse();
    expect(check(context('Goles de cada equipo', 'Más de', '0.5'))).toBeFalse();
    expect(check(context('Ambos marcan', 'Menos de', '0.5'))).toBeTrue();
  });
  for (const value of [null, undefined, '', ' ', 'abc', '2abc', NaN, Infinity, false, -1, 0.5]) {
    it(`rejects invalid statistic ${String(value)}`, () => {
      expect(numberStat(value)).toBeNull();
      expect(check(context('Ambos marcan', 'No'), {...row, intHomeScore: value})).toBeNull();
    });
  }
  it('retains numeric zero, excludes missing values and empty groups from denominators', () => {
    expect(numberStat('0')).toBe(0);
    expect(frequency([false, true, null])).toBe('1/2 · 50 %');
    expect(frequency([])).toBe('Sin datos');
    expect(frequency([null])).toBe('Sin datos');
    expect(frequency([false])).toBe('0/1 · 0 %');
  });
  for (const period of ['primer tiempo', 'segundo tiempo', '1T', '2H', 'primera mitad', 'segunda mitad']) {
    it(`never evaluates ${period} using final scores`, () => {
      expect(check(context(`Total goles ${period}`, 'Más de', '0.5'))).toBeNull();
      expect(check(context(`Ganador ${period}`, '1'))).toBeNull();
      expect(check(context(`Ambos marcan ${period}`, 'No'))).toBeNull();
    });
  }
  it('does not read N1/N2 codes as periods, results or lines', () => {
    const c = context('Ganador del partido (N2)', '');
    expect(c.period).toBe('');
    expect(c.result).toBe('');
    expect(c.kind).toBe('unsupported');
    expect(context('Total goles (N1)', 'Más de', '2.5').period).toBe('');
  });
  it('rejects unknown markets and unsupported compound lines', () => {
    expect(check(context('Mercado desconocido (N1)', 'Más de', '1.5'))).toBeNull();
    expect(check(context('Hándicap goles', 'Más de', '1.5'))).toBeNull();
    expect(check(context('Total goles', 'Más de', '2.25'))).toBeNull();
  });
  it('excludes histories where the selected team cannot be identified', () => {
    expect(check(context('Ganador del partido', '1'), {...row, idHomeTeam: 'c', idAwayTeam: 'd', strHomeTeam: 'C', strAwayTeam: 'D'})).toBeNull();
  });
});

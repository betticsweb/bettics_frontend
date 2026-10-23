import { explainMarket, marketContext, statisticsParams } from './recommendation-market';

describe('Recommendation market navigation', () => {
  const base = {liga: 'Liga 1', equipoLocal: 'Local', equipoVisitante: 'Visita', mercadoApuesta: 'Total Goles (N123)', opcionApuesta: 'Más de', valorOpcionApuesta: '2.5'};
  it('passes teams, league and the selected line without confusing market codes', () => {
    expect(statisticsParams(base)).toEqual(jasmine.objectContaining({liga: 'Liga 1', equipoLocal: 'Local', equipoVisitante: 'Visita', tab: 1, umbral: 2.5, sentido: 'mas', alcance: 'total'}));
  });
  it('supports decimal commas and under lines for away corners', () => {
    expect(marketContext({...base, mercadoApuesta: 'Corners Visita', opcionApuesta: 'Menos de', valorOpcionApuesta: '4,5'})).toEqual({tab: 2, unit: 'córners', threshold: 4.5, direction: 'menos', scope: 'visita'});
  });
  it('does not invent a numeric line for a winner', () => {
    expect(statisticsParams({...base, mercadoApuesta: 'Ganador (N123)', opcionApuesta: '1', valorOpcionApuesta: ''}).tab).toBeNull();
  });
  it('explains the selected total with winning and losing examples', () => {
    expect(explainMarket(base)).toContain('con 3 goles');
    expect(explainMarket(base)).toContain('con 2 no se cumple');
  });
  it('explains both teams scoring without treating it as a total line', () => {
    expect(explainMarket({...base, mercadoApuesta: 'Ambos anotan', opcionApuesta: 'Sí', valorOpcionApuesta: ''})).toContain('1–1');
  });
});

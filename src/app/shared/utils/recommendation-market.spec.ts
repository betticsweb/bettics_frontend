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
    expect(statisticsParams({...base, mercadoApuesta: 'Ganador (N123)', opcionApuesta: '1', valorOpcionApuesta: ''}).tab).toBe(5);
  });
  it('explains the selected total with winning and losing examples', () => {
    expect(explainMarket(base)).toContain('con 3 goles');
    expect(explainMarket(base)).toContain('con 2 no se cumple');
  });
  it('explains both teams scoring without treating it as a total line', () => {
    expect(explainMarket({...base, mercadoApuesta: 'Ambos anotan', opcionApuesta: 'Sí', valorOpcionApuesta: ''})).toContain('1–1');
  });
});

describe('Market help periods and settlement examples', () => {
  const base = {liga: 'Bundesliga', equipoLocal: 'Stuttgart', equipoVisitante: 'Borussia Mgladbach', mercadoApuesta: 'Gol en el primer tiempo (N1)', opcionApuesta: 'Mas de', valorOpcionApuesta: '0.5'};
  it('limits the first-half goal recommendation to the period before the break', () => {
    const text = explainMarket(base);
    expect(text).toContain('solo del primer tiempo');
    expect(text).toContain('segundo tiempo no cuenta');
    expect(text).toContain('con 1 gol; con 0 no se cumple');
    expect(text).not.toContain('recomendación es del partido completo');
  });
  for (const name of ['Goles primera mitad', 'Goles 1er tiempo', 'Goles 1T', 'Goles 1H', 'Goles first half']) {
    it(`recognizes the first-half label ${name}`, () => {
      expect(explainMarket({...base, mercadoApuesta: name})).toContain('solo del primer tiempo');
    });
  }
  it('starts second-half counting from zero after the break', () => {
    expect(explainMarket({...base, mercadoApuesta: 'Total goles segundo tiempo'})).toContain('Se empieza a contar desde cero');
  });
  it('uses the period for first-half winners as well as totals', () => {
    const text = explainMarket({...base, mercadoApuesta: 'Ganador primer tiempo', opcionApuesta: 'Stuttgart', valorOpcionApuesta: '1'});
    expect(text).toContain('solo del primer tiempo');
    expect(text).toContain('Se compara el marcador del período');
  });
  it('explains a standard total over the full match', () => {
    expect(explainMarket({...base, mercadoApuesta: 'Total de Goles (N1)', valorOpcionApuesta: '2.5'})).toContain('90 minutos y el tiempo añadido');
  });
  it('does not interpret N1 alone as a first-half marker', () => {
    expect(explainMarket({...base, mercadoApuesta: 'Mercado especial (N1)'})).toContain('no especifica el período');
  });
  it('compares corners rather than treating the winner identifier as a line', () => {
    const text = explainMarket({...base, mercadoApuesta: 'Equipo con mas corners (N3)', opcionApuesta: 'Stuttgart', valorOpcionApuesta: '1'});
    expect(text).toContain('Se comparan los córners');
    expect(text).toContain('más córners que su rival');
    expect(text).not.toContain('Más de 1');
  });
  it('explains under corners with a successful and unsuccessful count', () => {
    const text = explainMarket({...base, mercadoApuesta: 'Total de Tiros de esquina (N4)', opcionApuesta: 'Menos de', valorOpcionApuesta: '10.5'});
    expect(text).toContain('con 10 córners; con 11 no se cumple');
  });
  it('counts only the selected team for team totals', () => {
    expect(explainMarket({...base, mercadoApuesta: 'Goles Local primer tiempo'})).toContain('goles de Stuttgart');
  });
  it('explains the negative both-teams-scoring selection in the correct period', () => {
    const text = explainMarket({...base, mercadoApuesta: 'Ambos equipos marcan segundo tiempo', opcionApuesta: 'No', valorOpcionApuesta: ''});
    expect(text).toContain('solo del segundo tiempo');
    expect(text).toContain('«No» se cumple con 1–0 o 0–0');
  });
  it('distinguishes exact scores from a match winner', () => {
    const text = explainMarket({...base, mercadoApuesta: 'Marcador exacto primer tiempo', opcionApuesta: '2–1', valorOpcionApuesta: ''});
    expect(text).toContain('debe coincidir exactamente');
    expect(text).not.toContain('1 significa victoria');
  });
  it('avoids simple integer examples for split Asian lines', () => {
    expect(explainMarket({...base, valorOpcionApuesta: '2.25'})).toContain('dividir la apuesta entre dos líneas');
  });
});

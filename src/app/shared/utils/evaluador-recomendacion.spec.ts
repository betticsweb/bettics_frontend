import { evaluarRecomendacion, Partido, Recomendacion } from './evaluador-recomendacion';

describe('Evaluación de recomendaciones', () => {
  const partido: Partido = {
    matchId: '7811554', estadoOficial: 'FINALIZADO',
    golesLocal: 2, golesVisita: 1, cornersLocal: 6, cornersVisita: 5
  };
  const rec = (mercado: Recomendacion['mercado'], extra: Partial<Recomendacion> = {}): Recomendacion =>
    ({ matchId: partido.matchId, mercado, ...extra });
  const evaluar = (mercado: Recomendacion['mercado'], extra: Partial<Recomendacion> = {}, datos: Partido = partido) =>
    evaluarRecomendacion(rec(mercado, extra), datos).estado;

  it('aprueba más de 2.5 goles', () => expect(evaluar('GOLES_TOTAL', { linea: 2.5, operador: 'MAS' })).toBe('ACIERTO'));
  it('falla más de 3.5 goles', () => expect(evaluar('GOLES_TOTAL', { linea: 3.5, operador: 'MAS' })).toBe('FALLO'));
  it('aprueba menos de 3.5 goles', () => expect(evaluar('GOLES_TOTAL', { linea: 3.5, operador: 'MENOS' })).toBe('ACIERTO'));
  it('aprueba más de 8.5 córners', () => expect(evaluar('CORNERS_TOTAL', { linea: 8.5, operador: 'MAS' })).toBe('ACIERTO'));
  it('falla menos de 10.5 córners', () => expect(evaluar('CORNERS_TOTAL', { linea: 10.5, operador: 'MENOS' })).toBe('FALLO'));
  it('aprueba ambos marcan', () => expect(evaluar('BTTS_SI')).toBe('ACIERTO'));
  it('falla ambos no marcan', () => expect(evaluar('BTTS_NO')).toBe('FALLO'));
  it('aprueba ganador local', () => expect(evaluar('GANADOR_FT', { seleccion: 'LOCAL' })).toBe('ACIERTO'));
  it('falla ganador visitante', () => expect(evaluar('GANADOR_FT', { seleccion: 'VISITA' })).toBe('FALLO'));
  it('aprueba doble oportunidad 1X', () => expect(evaluar('DOBLE_OPORTUNIDAD', { seleccion: '1X' })).toBe('ACIERTO'));
  it('aprueba corners equipo local más 5.5', () => expect(evaluar('CORNERS_EQUIPO', { seleccion: 'LOCAL', operador: 'MAS', linea: 5.5 })).toBe('ACIERTO'));
  it('aprueba ganador corners local', () => expect(evaluar('CORNERS_GANADOR', { seleccion: 'LOCAL' })).toBe('ACIERTO'));
  it('no confunde un partido distinto', () => expect(evaluarRecomendacion(rec('GOLES_TOTAL',{linea:2.5,operador:'MAS'}), {...partido,matchId:'otro'}).estado).toBe('SIN_DATOS'));
  it('no evalúa partidos pendientes', () => expect(evaluar('GOLES_TOTAL', { linea:2.5,operador:'MAS' }, {...partido,estadoOficial:'PENDIENTE'})).toBe('PENDIENTE'));
  it('no evalúa partidos en curso', () => expect(evaluar('GOLES_TOTAL', { linea:2.5,operador:'MAS' }, {...partido,estadoOficial:'EN_JUEGO'})).toBe('PENDIENTE'));
  it('no inventa corners faltantes', () => expect(evaluar('CORNERS_TOTAL', { linea:8.5,operador:'MAS' }, {...partido,cornersVisita:null})).toBe('SIN_DATOS'));
  it('no inventa primer tiempo', () => expect(evaluar('GOLES_PRIMER_TIEMPO', {linea:0.5,operador:'MAS'})).toBe('SIN_DATOS'));
  it('informa devolución cuando el valor es igual a la línea', () => expect(evaluar('GOLES_TOTAL', {linea:3,operador:'MAS'})).toBe('DEVOLUCION'));
  it('maneja dos apuestas distintas para un mismo partido', () => {
    expect(evaluar('GOLES_TOTAL',{linea:2.5,operador:'MAS'})).toBe('ACIERTO');
    expect(evaluar('CORNERS_TOTAL',{linea:11.5,operador:'MAS'})).toBe('FALLO');
  });
  it('no considera terminado un partido suspendido', () => expect(evaluar('GOLES_TOTAL', {linea:2.5,operador:'MAS'}, {...partido,estadoOficial:'SUSPENDIDO'})).toBe('PENDIENTE'));
});

import { reliabilityParams, seasonFromData, sortedBacktestRows } from './backtest-navigation';
const selection={liga:'Germany Bundesliga',equipoLocal:'Local',equipoVisitante:'Visitante',mercadoApuesta:'Total corners (N1)',opcionApuesta:'Más de',valorOpcionApuesta:'8.5'};
describe('Fiabilidad navigation',()=>{
  it('maps total corners +8.5 and policy N1 without treating N1 as the line',()=>{
    expect(reliabilityParams(selection)).toEqual(jasmine.objectContaining({liga:'Germany Bundesliga',mercado:'CORNERS_OVER_85',segmento:'N1',temporada:'ultima',aviso:null}));
  });
  it('maps each supported full-match total with its exact selection and line',()=>{
    expect(reliabilityParams({...selection,mercadoApuesta:'Total de córners (N2)',opcionApuesta:'Menos de',valorOpcionApuesta:'10,5'}).mercado).toBe('CORNERS_UNDER_105');
    expect(reliabilityParams({...selection,mercadoApuesta:'Total goles (N3)',valorOpcionApuesta:'2.5'}).mercado).toBe('GOLES_OVER_25');
    expect(reliabilityParams({...selection,mercadoApuesta:'Más de 8.5 córners (N1)',opcionApuesta:'',valorOpcionApuesta:''}).mercado).toBe('CORNERS_OVER_85');
  });
  it('maps winner of corners only when the selected team is the home team',()=>{
    const home={...selection,mercadoApuesta:'Equipo con más corners (N1)',opcionApuesta:'Local',valorOpcionApuesta:'1'};
    expect(reliabilityParams(home).mercado).toBe('CORNERS_LOCAL_GANA');
    expect(reliabilityParams({...home,opcionApuesta:'Visitante'}).mercado).toBeNull();
  });
  it('rejects unsupported periods, team totals, BTTS, lines and markets',()=>{
    for(const change of [{mercadoApuesta:'Total corners primer tiempo (N1)'},{mercadoApuesta:'Total corners local (N1)'},{mercadoApuesta:'Ambos equipos marcan (N1)'},{valorOpcionApuesta:'9.5'},{mercadoApuesta:'Ganador del partido (N1)'}]){
      expect(reliabilityParams({...selection,...change}).mercado).toBeNull();
    }
  });
  it('rejects team-scoped options even when the market title says total corners',()=>{
    expect(reliabilityParams({...selection,opcionApuesta:'Local más de'}).mercado).toBeNull();
    expect(reliabilityParams({...selection,equipoLocal:'Bayern Munich',opcionApuesta:'Bayern Munich más de'}).mercado).toBeNull();
  });
  it('never guesses missing, contradictory or prohibited segments',()=>{
    expect(reliabilityParams({...selection,mercadoApuesta:'Total corners'}).segmento).toBeNull();
    expect(reliabilityParams({...selection,segmento:'N2'}).segmento).toBeNull();
    expect(reliabilityParams({...selection,mercadoApuesta:'Total goles (N4)',valorOpcionApuesta:'2.5'}).aviso).toBe('segmento_no_compatible');
    expect(reliabilityParams({...selection,mercadoApuesta:'Total corners (N5)'}).segmento).toBeNull();
  });
  it('accepts canonical codes and structured segments but rejects conflicting directions',()=>{
    expect(reliabilityParams({...selection,mercadoApuesta:'CORNERS_OVER_85',segmento:'N2'}).segmento).toBe('N2');
    expect(reliabilityParams({...selection,mercadoApuesta:'CORNERS_OVER_85 (N1)',opcionApuesta:'Menos de'}).mercado).toBeNull();
  });
});
describe('Backtest seasons and sorting',()=>{
  it('uses the newest actual league row instead of a different league global season list',()=>{
    const response={opciones:{temporadas:['2027/2028','2026/2027','2026']},detalle:{registros:[{liga:'Peru Primera Division',temporada:'2026'}]}};
    expect(seasonFromData(response,'Peru Primera Division')).toBe('2026');
    expect(seasonFromData(response,'Germany Bundesliga')).toBeNull();
    expect(seasonFromData({opciones:response.opciones,detalle:{registros:[]}},'')).toBeNull();
  });
  it('sorts all aggregate rows, keeping missing ROI last in both directions',()=>{
    const rows=[{liga:'B',roi:null},{liga:'C',roi:-10},{liga:'A',roi:20}];
    expect(sortedBacktestRows(rows,'roi','asc',{}).map(r=>r.roi)).toEqual([-10,20,null]);
    expect(sortedBacktestRows(rows,'roi','desc',{}).map(r=>r.roi)).toEqual([20,-10,null]);
    expect(rows[0].roi).toBeNull();
  });
  it('orders league and friendly market names in either direction',()=>{
    const rows=[{liga:'Z',mercado:'a'},{liga:'A',mercado:'b'}],labels={a:'Zeta',b:'Alfa'};
    expect(sortedBacktestRows(rows,'mercado','asc',labels)[0].mercado).toBe('b');
    expect(sortedBacktestRows(rows,'liga','desc',labels)[0].liga).toBe('Z');
  });
});
describe('Additional reliability market candidates',()=>{
  it('maps explicit BTTS selections without guessing approval segments',()=>{
    expect(reliabilityParams({...selection,mercadoApuesta:'Ambos equipos marcan (N2)',opcionApuesta:'Sí'})).toEqual(jasmine.objectContaining({mercado:'AMBOS_MARCAN_SI',segmento:'N2',temporada:'ultima'}));
    expect(reliabilityParams({...selection,mercadoApuesta:'Ambos equipos marcan (N1)',opcionApuesta:'No'}).mercado).toBe('AMBOS_MARCAN_NO');
    expect(reliabilityParams({...selection,mercadoApuesta:'Ambos equipos marcan (N1)',opcionApuesta:'Más de 0.5'}).mercado).toBeNull();
  });
  it('maps named home/away winners but never a draw or an invented HT line',()=>{
    expect(reliabilityParams({...selection,mercadoApuesta:'Ganador del partido (N1)',opcionApuesta:'Visitante'}).mercado).toBe('GANADOR_FT_VISITANTE');
    expect(reliabilityParams({...selection,mercadoApuesta:'Ganador del primer tiempo (N1)',opcionApuesta:'Local'}).mercado).toBe('GANADOR_HT_LOCAL');
    expect(reliabilityParams({...selection,mercadoApuesta:'Ganador del partido (N1)',opcionApuesta:'X'}).mercado).toBeNull();
    expect(reliabilityParams({...selection,mercadoApuesta:'Gol primer tiempo (N1)',opcionApuesta:'Más de',valorOpcionApuesta:'0.5'}).mercado).toBeNull();
  });
});

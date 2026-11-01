/** Evaluador puro de recomendaciones: exige ID y estado oficial. */
export type EstadoRecomendacion = 'ACIERTO'|'FALLO'|'PENDIENTE'|'SIN_DATOS'|'DEVOLUCION';
export type Mercado = 'GOLES_TOTAL'|'BTTS_SI'|'BTTS_NO'|'GANADOR_FT'|'DOBLE_OPORTUNIDAD'|'CORNERS_TOTAL'|'CORNERS_EQUIPO'|'CORNERS_GANADOR'|'GOLES_PRIMER_TIEMPO';
export type Seleccion = 'LOCAL'|'VISITA'|'EMPATE'|'1X'|'12'|'X2';
export interface Recomendacion { matchId:string; mercado:Mercado; operador?:'MAS'|'MENOS'; linea?:number; seleccion?:Seleccion; }
export interface Partido { matchId:string; estadoOficial:'FINALIZADO'|'PENDIENTE'|'EN_JUEGO'|'SUSPENDIDO'|'CANCELADO'|'DESCONOCIDO'; golesLocal?:number|null; golesVisita?:number|null; cornersLocal?:number|null; cornersVisita?:number|null; }
export interface Evaluacion { estado:EstadoRecomendacion; detalle:string; }
const r=(estado:EstadoRecomendacion,detalle:string):Evaluacion=>({estado,detalle});
const ok=(n:number|null|undefined):n is number=>typeof n==='number'&&Number.isInteger(n)&&n>=0;
function comparar(valor:number,rec:Recomendacion,tipo:string):Evaluacion{
 if(!Number.isFinite(rec.linea)||typeof rec.linea!=='number'||!rec.operador) return r('SIN_DATOS','Línea u operador no disponibles');
 if(valor===rec.linea)return r('DEVOLUCION',tipo+': '+valor+'; igual a la línea '+rec.linea);
 const acierto=rec.operador==='MAS'?valor>rec.linea:valor<rec.linea;
 return r(acierto?'ACIERTO':'FALLO',tipo+': '+valor+'; '+(rec.operador==='MAS'?'más de ':'menos de ')+rec.linea);
}
export function evaluarRecomendacion(rec:Recomendacion,partido?:Partido|null):Evaluacion{
 if(!rec.matchId||!partido||rec.matchId!==partido.matchId)return r('SIN_DATOS','Partido sin vinculación inequívoca por ID');
 if(partido.estadoOficial!=='FINALIZADO')return r('PENDIENTE','Partido '+partido.estadoOficial.toLowerCase());
 if(rec.mercado==='GOLES_PRIMER_TIEMPO')return r('SIN_DATOS','No hay datos confirmados del primer tiempo');
 const {golesLocal:gL,golesVisita:gV,cornersLocal:cL,cornersVisita:cV}=partido;
 if(['GOLES_TOTAL','BTTS_SI','BTTS_NO','GANADOR_FT','DOBLE_OPORTUNIDAD'].includes(rec.mercado)){
   if(!ok(gL)||!ok(gV))return r('SIN_DATOS','Marcador final no disponible');
   if(rec.mercado==='GOLES_TOTAL')return comparar(gL+gV,rec,'Goles totales');
   if(rec.mercado==='BTTS_SI'||rec.mercado==='BTTS_NO'){
    const ambos=gL>0&&gV>0;return r((rec.mercado==='BTTS_SI'?ambos:!ambos)?'ACIERTO':'FALLO','Marcador '+gL+'-'+gV+'; ambos marcan '+(ambos?'sí':'no'));
   }
   const gana:Seleccion=gL===gV?'EMPATE':gL>gV?'LOCAL':'VISITA';
   if(rec.mercado==='GANADOR_FT')return rec.seleccion&&['LOCAL','VISITA','EMPATE'].includes(rec.seleccion)?r(gana===rec.seleccion?'ACIERTO':'FALLO','Marcador '+gL+'-'+gV):r('SIN_DATOS','Selección de ganador inválida');
   const mapa:Record<string,Seleccion[]>={'1X':['LOCAL','EMPATE'],'12':['LOCAL','VISITA'],'X2':['EMPATE','VISITA']};
   return rec.seleccion&&mapa[rec.seleccion]?r(mapa[rec.seleccion].includes(gana)?'ACIERTO':'FALLO','Marcador '+gL+'-'+gV):r('SIN_DATOS','Doble oportunidad inválida');
 }
 if(!ok(cL)||!ok(cV))return r('SIN_DATOS','No hay córners oficiales completos');
 if(rec.mercado==='CORNERS_TOTAL')return comparar(cL+cV,rec,'Córners totales');
 if(rec.seleccion!=='LOCAL'&&rec.seleccion!=='VISITA')return r('SIN_DATOS','Equipo de córners no especificado');
 if(rec.mercado==='CORNERS_EQUIPO')return comparar(rec.seleccion==='LOCAL'?cL:cV,rec,'Córners del equipo');
 if(rec.mercado==='CORNERS_GANADOR'){
   if(cL===cV)return r('DEVOLUCION','Empate en córners '+cL+'-'+cV+'; confirmar regla de liquidación');
   return r((cL>cV?'LOCAL':'VISITA')===rec.seleccion?'ACIERTO':'FALLO','Córners '+cL+'-'+cV);
 }
 return r('SIN_DATOS','Mercado no implementado');
}
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { BacktestComponent } from './backtest.component';
import { environment } from 'src/environments/environment';
const league='Germany Bundesliga';
const options={mercados:['CORNERS_OVER_85','GOLES_OVER_25'],ligas:[league,'Peru Primera Division'],temporadas:['2025/2026','2026/2027','2026'],versiones:['V1']};
function response(overrides:any={}){return{opciones:options,resumen:{aprobados:1,partidos:1,evaluados:1,aciertos:1,pendientes:0,roi:50,ganancia:.5},ranking:[],segmentos:[],evolucion:[],mensual:[],detalle:{total:1,registros:[{liga:league,temporada:'2026/2027',fecha_partido:'2026-10-18'}]},...overrides};}
describe('Backtest results UX',()=>{
 let component:BacktestComponent,http:HttpTestingController,params:BehaviorSubject<any>,navigate:jasmine.Spy;
 beforeEach(()=>{
  params=new BehaviorSubject(convertToParamMap({temporada:'todas'}));
  navigate=jasmine.createSpy('navigate').and.callFake((_:any,extras:any)=>{params.next(convertToParamMap(extras.queryParams));return Promise.resolve(true);});
  TestBed.configureTestingModule({imports:[BacktestComponent,HttpClientTestingModule],providers:[{provide:ActivatedRoute,useValue:{queryParamMap:params}},{provide:Router,useValue:{navigate}}]});
  component=TestBed.createComponent(BacktestComponent).componentInstance;http=TestBed.inject(HttpTestingController);
 });
 afterEach(()=>{component.ngOnDestroy();http.verify();});
 const expectRequest=()=>http.expectOne(r=>r.url===environment.backtestApiUrl+'/api/backtest/resultados');
 it('blocks a new market when the backend has no verified catalogue',()=>{
  params.next(convertToParamMap({liga:league,mercado:'AMBOS_MARCAN_SI',segmento:'N1',temporada:'2026/2027',origen:'fiabilidad'}));
  component.ngOnInit();const probe=expectRequest();expect(probe.request.params.has('mercado')).toBeFalse();probe.flush(response());
  expect(component.ready).toBeFalse();expect(component.notice).toContain('API de Resultados');http.expectNone(()=>true);
 });
 it('uses exact new market filters only after a versioned policy is verified',()=>{
  params.next(convertToParamMap({liga:league,mercado:'AMBOS_MARCAN_SI',segmento:'N1',temporada:'2026/2027',origen:'fiabilidad'}));
  component.ngOnInit();const catalogue=[{mercado:'AMBOS_MARCAN_SI',version_politica:'V1',segmentos:['N1']}];
  expectRequest().flush(response({catalogo_mercados:catalogue}));
  const req=expectRequest();expect(req.request.params.get('mercado')).toBe('AMBOS_MARCAN_SI');expect(req.request.params.get('segmento')).toBe('N1');
  req.flush(response({catalogo_mercados:catalogue}));expect(component.ready).toBeTrue();
 });
 it('uses a read-only paginated API and preserves null values',()=>{
  component.ngOnInit();const req=expectRequest();expect(req.request.method).toBe('GET');expect(req.request.params.get('limit')).toBe('25');expect(req.request.params.has('temporada')).toBeFalse();req.flush(response());
  expect(component.format(null,' %')).toBe('Sin datos');expect(component.format(0,' %')).toBe('0 %');
 });
 it('applies persistent reliability filters to the API, not just controls',()=>{
  params.next(convertToParamMap({liga:league,mercado:'CORNERS_OVER_85',segmento:'N1',temporada:'2026/2027',origen:'fiabilidad',orden:'liga',direccion:'asc'}));
  component.ngOnInit();const req=expectRequest();for(const [key,value]of Object.entries({liga:league,mercado:'CORNERS_OVER_85',segmento:'N1',temporada:'2026/2027'}))expect(req.request.params.get(key)).toBe(value);
  for(const key of ['origen','direccion','orden'])expect(req.request.params.has(key)).toBeFalse();req.flush(response());expect(component.reliabilityContext).toBeTrue();
 });
 it('resolves the latest league season from actual data and persists the resolved season',()=>{
  params.next(convertToParamMap({liga:league,mercado:'CORNERS_OVER_85',segmento:'N1',temporada:'ultima',origen:'fiabilidad'}));component.ngOnInit();
  const probe=expectRequest();expect(probe.request.params.get('limit')).toBe('1');expect(probe.request.params.has('mercado')).toBeFalse();probe.flush(response());
  const actual=expectRequest();expect(actual.request.params.get('temporada')).toBe('2026/2027');expect(actual.request.params.get('segmento')).toBe('N1');actual.flush(response());
  expect(params.value.get('temporada')).toBe('2026/2027');expect(navigate.calls.mostRecent().args[1].replaceUrl).toBeTrue();
 });
 it('requests a league annual season rather than the global split-year season after changing league',()=>{
  component.ngOnInit();expectRequest().flush(response());component.filters['liga']='Peru Primera Division';component.change('liga');
  const probe=expectRequest();expect(probe.request.params.get('liga')).toBe('Peru Primera Division');probe.flush(response({detalle:{total:1,registros:[{liga:'Peru Primera Division',temporada:'2026'}]}}));
  const actual=expectRequest();expect(actual.request.params.get('temporada')).toBe('2026');actual.flush(response());
 });
 it('does not invent a season when a policy version must be selected',()=>{
  params.next(convertToParamMap({liga:league}));component.ngOnInit();expectRequest().flush(response({requiere_version:true,detalle:{total:0,registros:[]}}));
  expect(component.filters['temporada']).toBe('ultima');expect(component.ready).toBeFalse();expect(navigate).not.toHaveBeenCalled();
 });
 it('preserves an explicit all-seasons choice on reload',()=>{
  component.ngOnInit();const req=expectRequest();expect(req.request.params.get('limit')).toBe('25');req.flush(response());
  component.filters['direccion']='asc';component.setOrder();expect(params.value.get('temporada')).toBe('todas');http.expectNone(()=>true);
 });
 it('sorts rankings locally in both directions without unsupported API requests',()=>{
  component.ngOnInit();expectRequest().flush(response({ranking:[{liga:'A',mercado:'CORNERS_OVER_85',roi:20},{liga:'B',mercado:'CORNERS_OVER_85',roi:-10}]}));
  component.sort('roi');expect(component.rankedRows[0].roi).toBe(-10);expect(params.value.get('direccion')).toBe('asc');
  component.sort('roi');expect(component.rankedRows[0].roi).toBe(20);http.expectNone(()=>true);
 });
 it('keeps filters and pagination when switching analysis views',()=>{
  params.next(convertToParamMap({liga:league,segmento:'N2',temporada:'2026/2027'}));component.ngOnInit();expectRequest().flush(response({detalle:{total:60,registros:[]}}));
  component.setView('evolucion');http.expectNone(()=>true);expect(params.value.get('liga')).toBe(league);expect(params.value.get('vista')).toBe('evolucion');
  component.next(1);const req=expectRequest();expect(req.request.params.get('page')).toBe('2');expect(req.request.params.get('segmento')).toBe('N2');req.flush(response({detalle:{total:60,registros:[]}}));
 });
 it('cancels outdated requests when filters change',()=>{
  component.ngOnInit();const first=expectRequest();component.filters['mercado']='GOLES_OVER_25';component.change('mercado');expect(first.cancelled).toBeTrue();
  const next=expectRequest();expect(next.request.params.get('mercado')).toBe('GOLES_OVER_25');next.flush(response());
 });
 it('does not silently apply unsupported reliability markets or policy segments',()=>{
  params.next(convertToParamMap({liga:league,temporada:'ultima',origen:'fiabilidad',aviso:'mercado_no_compatible'}));component.ngOnInit();
  const req=expectRequest();expect(req.request.params.has('mercado')).toBeFalse();req.flush(response());expect(component.contextBlocked).toBeTrue();expect(component.data).toBeUndefined();expect(component.notice).toContain('mercado equivalente');
 });
 it('rejects incompatible deep-link segments and prototype names without showing unrelated results',()=>{
  params.next(convertToParamMap({mercado:'GOLES_OVER_25',segmento:'N4',temporada:'todas'}));component.ngOnInit();expectRequest().flush(response());expect(component.ready).toBeFalse();
  params.next(convertToParamMap({mercado:'__proto__',temporada:'todas'}));expectRequest().flush(response());expect(component.ready).toBeFalse();
 });
 it('reports an exact league mismatch without selecting another league',()=>{
  params.next(convertToParamMap({liga:'Bundesliga inexistente',temporada:'ultima'}));component.ngOnInit();expectRequest().flush(response({detalle:{total:0,registros:[]}}));expect(component.contextBlocked).toBeTrue();expect(component.notice).toContain('nombre exacto');
 });
 it('displays authentication failures without inventing results',()=>{
  component.ngOnInit();expectRequest().flush({},{status:401,statusText:'Unauthorized'});expect(component.error).toContain('no está autorizada');expect(component.data).toBeUndefined();
 });
 it('labels the actual score by market and never replaces missing scores with zero',()=>{
  expect(component.statistic({mercado:'CORNERS_OVER_85',marcador:'4–5'})).toBe('Córners: 4–5 · Total 9');
  expect(component.statistic({mercado:'GOLES_OVER_25',marcador:'0–3'})).toBe('Goles: 0–3 · Total 3');
  expect(component.statistic({})).toBe('Sin resultado confirmado');
 });
});

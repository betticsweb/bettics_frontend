import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BacktestComponent } from './backtest.component';
import { environment } from 'src/environments/environment';
describe('Backtest results',()=>{
 let component:BacktestComponent,http:HttpTestingController;
 beforeEach(()=>{TestBed.configureTestingModule({imports:[BacktestComponent,HttpClientTestingModule]});component=TestBed.createComponent(BacktestComponent).componentInstance;http=TestBed.inject(HttpTestingController);});
 afterEach(()=>{component.ngOnDestroy();http.verify();});
 it('uses only the dedicated read API and preserves null as Sin datos',()=>{component.load();const req=http.expectOne(r=>r.url===environment.backtestApiUrl+'/api/backtest/resultados');expect(req.request.method).toBe('GET');expect(req.request.params.get('limit')).toBe('25');req.flush({resumen:{roi:null}});expect(component.format(null,' %')).toBe('Sin datos');expect(component.format(0,' %')).toBe('0 %');expect(component.loading).toBeFalse();});
 it('removes incompatible N4 and resets pagination when market changes',()=>{component.page=3;component.filters['mercado']='GOLES_OVER_25';component.filters['segmento']='N4';component.change();const req=http.expectOne(()=>true);expect(req.request.params.has('segmento')).toBeFalse();expect(req.request.params.get('page')).toBe('1');req.flush({});});
 it('displays authentication failures without inventing metrics',()=>{component.load();http.expectOne(()=>true).flush({},{status:401,statusText:'Unauthorized'});expect(component.error).toContain('no está autorizada');expect(component.data).toBeUndefined();});
 it('cancels an older filter request and does not show stale results',()=>{component.load();const first=http.expectOne(()=>true);component.filters['liga']='Peru Primera Division';component.change();expect(first.cancelled).toBeTrue();const second=http.expectOne(()=>true);expect(second.request.params.get('liga')).toBe('Peru Primera Division');second.flush({resumen:{aprobados:0}});expect(component.data.resumen.aprobados).toBe(0);});
});

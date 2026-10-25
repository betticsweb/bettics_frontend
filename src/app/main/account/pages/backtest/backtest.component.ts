import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { environment } from 'src/environments/environment';

@Component({selector:'app-backtest',standalone:true,imports:[CommonModule,FormsModule],templateUrl:'./backtest.component.html',styleUrls:['./backtest.component.css']})
export class BacktestComponent implements OnInit, OnDestroy {
  labels: Record<string,string> = {CORNERS_OVER_85:'Más de 8.5 córners',CORNERS_UNDER_105:'Menos de 10.5 córners',GOLES_OVER_25:'Más de 2.5 goles',CORNERS_LOCAL_GANA:'Local con más córners'};
  filters: Record<string,string> = {mercado:'',segmento:'',liga:'',temporada:'',desde:'',hasta:'',version_politica:'',orden:'roi'};
  data: any; loading=false; error=''; view='resumen'; page=1;
  private request?: Subscription; private destroyed = new Subject<void>();
  constructor(private http: HttpClient) {}
  ngOnInit(): void { this.load(); }
  ngOnDestroy(): void { this.request?.unsubscribe(); this.destroyed.next(); this.destroyed.complete(); }
  get segments(): string[] { return ['GOLES_OVER_25','CORNERS_LOCAL_GANA'].includes(this.filters['mercado']) ? ['N1','N2','N3'] : ['N1','N2','N3','N4']; }
  change(): void { if(!this.segments.includes(this.filters['segmento'])) this.filters['segmento']=''; this.page=1; this.load(); }
  load(): void {
    this.request?.unsubscribe(); this.loading=true; this.error='';
    let params = new HttpParams().set('page',this.page).set('limit',25);
    for(const [key,value] of Object.entries(this.filters)) if(value) params=params.set(key,value);
    this.request=this.http.get<any>(environment.backtestApiUrl+'/api/backtest/resultados',{params}).pipe(takeUntil(this.destroyed)).subscribe({next:data=>{this.data=data;this.loading=false;},error:err=>{this.loading=false;this.error=err.status===401?'Tu sesión no está autorizada para consultar el histórico en Heroku.':'No se pudo consultar el histórico. Puedes volver a intentarlo.';}});
  }
  format(value: number|null|undefined, suffix=''): string { return value===null || value===undefined ? 'Sin datos' : value.toLocaleString('es-PE',{maximumFractionDigits:2})+suffix; }
  next(delta:number): void {this.page+=delta;this.load();}
  get points(): string {
    const rows=(this.data?.evolucion || []).filter((r:any)=>r.ganancia!==null);
    if(!rows.length) return '';
    const min=Math.min(0,...rows.map((r:any)=>r.ganancia)), max=Math.max(0,...rows.map((r:any)=>r.ganancia));
    return rows.map((r:any,i:number)=>`${20+i*860/Math.max(1,rows.length-1)},${170-(r.ganancia-min)*140/Math.max(1,max-min)}`).join(' ');
  }
}

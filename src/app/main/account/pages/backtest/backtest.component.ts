import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BACKTEST_MARKETS, ADDITIONAL_MARKETS, isAdditionalMarket, isBacktestMarket, seasonFromData, sortedBacktestRows } from 'src/app/shared/utils/backtest-navigation';

const API_FILTERS = ['mercado','segmento','liga','temporada','desde','hasta','version_politica'];
const SORTS = ['mercado','liga','roi','aprobados','efectividad','ganancia'];
@Component({selector:'app-backtest',standalone:true,imports:[CommonModule,FormsModule],templateUrl:'./backtest.component.html',styleUrls:['./backtest.component.css']})
export class BacktestComponent implements OnInit, OnDestroy {
  labels: Record<string,string> = {...ADDITIONAL_MARKETS,...Object.fromEntries(Object.entries(BACKTEST_MARKETS).map(([key,m])=>[key,m.label]))};
  filters: Record<string,string> = {mercado:'',segmento:'',liga:'',temporada:'ultima',desde:'',hasta:'',version_politica:'',orden:'roi',direccion:'desc'};
  data: any; catalog: any = {}; loading=false; error=''; notice=''; view='resumen'; page=1; contextBlocked=false;
  private request?: Subscription;
  private destroyed = new Subject<void>();
  private origin = ''; private advice = ''; private recommendation = ''; private invalid = '';
  private dataSignature = '';
  constructor(private http: HttpClient, private route: ActivatedRoute, private router: Router) {}
  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroyed)).subscribe(params=>{this.readUrl(params);this.load();});
  }
  ngOnDestroy(): void {this.request?.unsubscribe();this.destroyed.next();this.destroyed.complete();}
  private readUrl(params: ParamMap): void {
    this.invalid='';this.notice='';this.additionalVerified=false;
    for(const key of API_FILTERS) this.filters[key]=(params.get(key)||'').slice(0,200);
    this.filters['temporada']=params.get('temporada')==='todas'?'':params.get('temporada')||'ultima';
    this.filters['orden']=SORTS.includes(params.get('orden')||'')?params.get('orden')!:'roi';
    this.filters['direccion']=params.get('direccion')==='asc'?'asc':'desc';
    this.view=['resumen','segmentos','evolucion'].includes(params.get('vista')||'')?params.get('vista')!:'resumen';
    const page=Number(params.get('pagina')||1);this.page=Number.isSafeInteger(page)&&page>0&&page<=100000?page:1;
    this.origin=params.get('origen')||'';this.advice=params.get('aviso')||'';this.recommendation=(params.get('recomendacion')||'').slice(0,200);
    if(this.filters['mercado']&&!isBacktestMarket(this.filters['mercado'])&&!isAdditionalMarket(this.filters['mercado'])) this.invalid='El mercado del enlace no tiene una correspondencia exacta con el Backtest.';
    if(this.filters['segmento']&&!isAdditionalMarket(this.filters['mercado'])&&!this.segments.includes(this.filters['segmento'])) this.invalid='El segmento del enlace no es compatible con el mercado seleccionado.';
    if(this.origin==='fiabilidad'&&(!this.filters['mercado']||!this.filters['segmento']||!this.filters['liga']||this.advice)) {
      this.invalid=this.advice==='mercado_no_compatible'?'Esta recomendación no tiene un mercado equivalente en el Backtest. Selecciona un mercado para explorar el histórico.':'No se pudo identificar un segmento compatible de esta recomendación. Selecciona los filtros para explorar el histórico.';
    }
    for(const field of ['desde','hasta']) {
      const value=this.filters[field];
      if(value&&(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value)) this.invalid='El enlace contiene una fecha no válida.';
    }
    if(this.filters['desde']&&this.filters['hasta']&&this.filters['desde']>this.filters['hasta']) this.invalid='La fecha inicial debe ser anterior a la fecha final.';
    this.contextBlocked=!!this.invalid;
  }
  get segments(): string[] {if(isAdditionalMarket(this.filters['mercado']))return ['N1','N2','N3'];return isBacktestMarket(this.filters['mercado'])?BACKTEST_MARKETS[this.filters['mercado']].segments:['N1','N2','N3','N4'];}
  get markets(): string[] {return [...new Set([...(this.catalog.mercados||[]),...(this.filters['mercado']&&isBacktestMarket(this.filters['mercado'])?[this.filters['mercado']]:[])])];}
  get rankedRows(): any[] {return sortedBacktestRows(this.view==='segmentos'?this.data?.segmentos||[]:this.data?.ranking||[],this.filters['orden'],this.filters['direccion'],this.labels);}
  get ready(): boolean {return !!this.data&&!this.data.requiere_version&&!this.contextBlocked;}
  get reliabilityContext(): boolean {return this.origin==='fiabilidad'&&!this.contextBlocked;}
  private additionalVerified=false;
  private params(probe=false): HttpParams {
    let params=new HttpParams().set('page',probe?1:this.page).set('limit',probe?1:25);
    for(const key of probe?['liga','version_politica']:API_FILTERS) {
      const value=this.filters[key];if(value&&!(key==='temporada'&&value==='ultima'))params=params.set(key,value);
    }
    // Aggregate rows are already complete; display ordering is local, never sent as unsupported API filters.
    return params;
  }
  private urlState(): Record<string,string> {
    const state: Record<string,string>={temporada:this.filters['temporada']||'todas',orden:this.filters['orden'],direccion:this.filters['direccion'],vista:this.view,pagina:String(this.page)};
    for(const key of API_FILTERS)if(key!=='temporada'&&this.filters[key])state[key]=this.filters[key];
    if(this.origin)state['origen']=this.origin;
    if(this.advice)state['aviso']=this.advice;
    if(this.recommendation)state['recomendacion']=this.recommendation;
    return state;
  }
  private writeUrl(replaceUrl=false): void {
    void this.router.navigate([],{relativeTo:this.route,queryParams:this.urlState(),replaceUrl});
  }
  change(field=''): void {
    if(field==='liga')this.filters['temporada']='ultima';
    if(field==='mercado'&&!this.segments.includes(this.filters['segmento']))this.filters['segmento']='';
    this.origin='';this.advice='';this.recommendation='';this.page=1;this.writeUrl();
  }
  sort(field: string): void {
    this.filters['direccion']=this.filters['orden']===field?(this.filters['direccion']==='asc'?'desc':'asc'):['mercado','liga'].includes(field)?'asc':'desc';
    this.filters['orden']=field;this.writeUrl();
  }
  setOrder(): void {this.writeUrl();}
  setView(value: string): void {this.view=value;this.writeUrl();}
  scrollTo(id: string): void {document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'});}
  clearFilters(): void {for(const key of API_FILTERS)this.filters[key]='';this.filters['temporada']='ultima';this.origin='';this.advice='';this.recommendation='';this.page=1;this.writeUrl();}
  next(delta: number): void {this.page+=delta;this.writeUrl();}
  ariaSort(field: string): string {return this.filters['orden']===field?(this.filters['direccion']==='asc'?'ascending':'descending'):'none';}
  sortIndicator(field: string): string {return this.filters['orden']===field?(this.filters['direccion']==='asc'?' ↑':' ↓'):'';}
  load(): void {
    this.request?.unsubscribe();this.error='';
    this.notice=this.invalid;
    const resolve=this.filters['temporada']==='ultima';
    const additional=isAdditionalMarket(this.filters['mercado']);
    const probe=resolve||this.contextBlocked||additional&&!this.additionalVerified;
    const params=this.params(probe), signature=params.toString();
    if(!probe&&this.data&&this.dataSignature===signature){this.loading=false;return;}
    this.loading=true;
    this.request=this.http.get<any>(environment.backtestApiUrl+'/api/backtest/resultados',{params}).pipe(takeUntil(this.destroyed)).subscribe({
      next:data=>{
        if(additional) {
          const rules=(data.catalogo_mercados||[]).filter((r:any)=>r.mercado===this.filters['mercado']&&(!this.filters['version_politica']||!r.version_politica||r.version_politica===this.filters['version_politica']));
          if(!rules.some((r:any)=>(!this.filters['segmento']||r.segmentos?.includes(this.filters['segmento'])))) {this.notice='Este mercado o segmento todavía no está disponible en la API de Resultados. No se muestran porcentajes ni ROI.';this.contextBlocked=true;}
          else {this.additionalVerified=true;this.labels[this.filters['mercado']]=ADDITIONAL_MARKETS[this.filters['mercado']];}
        }
        this.catalog={...data.opciones,temporadas:(data.opciones?.temporadas||[]).map(String)};
        if(this.filters['liga']&&!(this.catalog.ligas||[]).includes(this.filters['liga'])) {
          this.notice='No hay una liga con este nombre exacto en el histórico aprobado. Selecciona una liga disponible.';this.contextBlocked=true;
        }
        if(this.filters['version_politica']&&!(this.catalog.versiones||[]).includes(this.filters['version_politica'])) {this.notice='La versión de política del enlace no está disponible.';this.contextBlocked=true;}
        if(this.contextBlocked){this.data=undefined;this.loading=false;return;}
        if(resolve&&!data.requiere_version){
          const season=seasonFromData(data,this.filters['liga']);
          this.filters['temporada']=season||'';
          this.writeUrl(true);return;
        }
        if(additional&&probe&&!resolve){this.load();return;}
        this.data=data;this.loading=false;this.dataSignature=probe?'':signature;
        if(!data.requiere_version&&this.page>Math.max(1,Math.ceil((data.detalle?.total||0)/25))){this.page=Math.max(1,Math.ceil(data.detalle.total/25));this.writeUrl(true);}
      },
      error:err=>{this.loading=false;this.error=err.status===401?'Tu sesión no está autorizada para consultar el histórico en Heroku.':'No se pudo consultar el histórico. Puedes volver a intentarlo.';}
    });
  }
  format(value: number|null|undefined,suffix=''): string {return value===null||value===undefined?'Sin datos':value.toLocaleString('es-PE',{maximumFractionDigits:2})+suffix;}
  statistic(row: any): string {
    const match=typeof row.marcador==='string'?row.marcador.match(/^(\d+)[–-](\d+)$/):null;
    if(!match)return 'Sin resultado confirmado';
    const unit=row.mercado.startsWith('CORNERS_')?'Córners':row.periodo==='HT'?'Goles HT':'Goles';
    return `${unit}: ${row.marcador} · Total ${Number(match[1])+Number(match[2])}`;
  }
  get points(): string {
    const rows=(this.data?.evolucion||[]).filter((r:any)=>r.ganancia!==null);if(!rows.length)return '';
    const min=Math.min(0,...rows.map((r:any)=>r.ganancia)),max=Math.max(0,...rows.map((r:any)=>r.ganancia));
    return rows.map((r:any,i:number)=>`${20+i*860/Math.max(1,rows.length-1)},${170-(r.ganancia-min)*140/Math.max(1,max-min)}`).join(' ');
  }
}

import { reliabilityParams } from 'src/app/shared/utils/backtest-navigation';
import { Component, OnInit, OnDestroy } from '@angular/core';
import Swal from 'sweetalert2';
import { Subject, takeUntil, timeout } from 'rxjs';
import { explainMarket, statisticsParams } from 'src/app/shared/utils/recommendation-market';
import { RecommendationsService } from '../../services/recommendations.service';

interface Selection {
  idHomeTeam?: string; idAwayTeam?: string; segmento?: string;
  liga: string; equipoLocal: string; equipoVisitante: string;
  mercadoApuesta: string; opcionApuesta: string; valorOpcionApuesta: string;
  cuotaSimple: string; fechaJuego: string;
}
interface Recommendation {
  detalle: Selection[]; date: string; odds: number; updated: string;
}

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.css']
})
export class ProfilePageComponent implements OnInit, OnDestroy {
  readonly statisticsParams = statisticsParams;
  readonly reliabilityParams = reliabilityParams;
  showHelp(detail: Selection): void {
    void Swal.fire({
      title: '¿Qué significa?',
      text: explainMarket(detail),
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#006738',
      showCloseButton: true,
      returnFocus: true
    });
  }
  private destroy$ = new Subject<void>();
  recomendaciones: Recommendation[] = [];
  filtered: Recommendation[] = [];
  leagues: string[] = [];
  loading = true;
  error = '';
  membership = '';
  updated = '';
  period = 'today';
  league = '';
  category = '';
  market = '';
  search = '';
  order = 'date';
  page = 1;
  readonly pageSize = 12;
  readonly periods = [{value: 'today', label: 'Hoy'}, {value: 'tomorrow', label: 'Mañana'}, {value: 'week', label: 'Próximos 7 días'}, {value: 'all', label: 'Todas las fechas'}];

  constructor(private service: RecommendationsService) {}
  ngOnInit(): void {
    try {
      const saved = JSON.parse(sessionStorage.getItem('recommendation-filters') || 'null');
      if (saved) {
        for (const key of ['period', 'league', 'category', 'market', 'search', 'order'] as const) {
          if (typeof saved[key] === 'string') this[key] = saved[key];
        }
      }
    } catch { /* Storage can be unavailable. */ }
    this.load();
  }
  load(): void {
    this.loading = true;
    this.error = '';
    this.membership = '';
    this.service.obtenerListado({fecha: '10/09/2022', pageSize: 20})
      .pipe(timeout(30000), takeUntil(this.destroy$))
      .subscribe({next: response => {
        this.loading = false;
        if (response.resStatus !== 'ok') {
          this.membership = response.resStatus || 'Necesitas una membresía para consultar las recomendaciones.';
          return;
        }
        this.recomendaciones = (response.resResult || []).map((item: any) => {
          const detalle: Selection[] = item.detalle || [];
          const dates = detalle.map(d => this.dateKey(d.fechaJuego)).filter(Boolean).sort();
          return {detalle, date: dates[0] || '', odds: Number(item._id?.cuotaCombinada ?? detalle[0]?.cuotaSimple) || 0, updated: String(item._id?.fechaRegistro || '')};
        }).filter((item: Recommendation) => item.detalle.length);
        this.leagues = Array.from(new Set(this.recomendaciones.flatMap(item => item.detalle.map(d => d.liga)).filter(Boolean))).sort();
        this.updated = this.recomendaciones.map(item => item.updated).filter(Boolean).sort().pop() || '';
        this.apply();
      }, error: () => { this.loading = false; this.error = 'No pudimos cargar las recomendaciones. Inténtalo de nuevo.'; }});
  }
  private dateKey(value: string): string {
    const match = String(value || '').match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : '';
  }
  private today(): string {
    const parts = new Intl.DateTimeFormat('en-US', {timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit'}).formatToParts(new Date());
    return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type)?.value).join('-');
  }
  private shift(date: string, days: number): string {
    const value = new Date(date + 'T12:00:00Z');
    value.setUTCDate(value.getUTCDate() + days);
    return value.toISOString().slice(0, 10);
  }
  private normalize(value: string): string {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }
  type(selection: Selection): string {
    const market = this.normalize(selection.mercadoApuesta);
    if (/corner|esquina/.test(market)) return 'Corners';
    if (/tarjeta/.test(market)) return 'Tarjetas';
    if (/gol|anotan/.test(market)) return 'Goles';
    if (/ganador|resultado|doble oportunidad/.test(market)) return 'Ganador';
    return 'Otros';
  }
  marketLabel(selection: Selection): string {
    return String(selection.mercadoApuesta || '').split(':')[0]
      .replace(/\s*\(N\d+\w*\)/gi, '').replace(/\s+/g, ' ').trim();
  }

  get markets(): string[] {
    return Array.from(new Set(this.recomendaciones.flatMap(item => item.detalle)
      .filter(selection => !this.category || this.type(selection) === this.category)
      .map(selection => this.marketLabel(selection)).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, 'es', {numeric: true}));
  }
  setCategory(): void {
    this.market = '';
    this.apply();
  }
  apply(): void {
    const today = this.today();
    const tomorrow = this.shift(today, 1);
    const end = this.shift(today, 6);
    const query = this.normalize(this.search.trim());
    this.filtered = this.recomendaciones.filter(item => {
      // Keep every selection of a combined recommendation visible.
      return item.detalle.some(d => {
        const date = this.dateKey(d.fechaJuego);
        const inPeriod = this.period === 'all' || (this.period === 'today' && date === today) || (this.period === 'tomorrow' && date === tomorrow) || (this.period === 'week' && date >= today && date <= end);
        return inPeriod && (!this.league || d.liga === this.league) && (!this.category || this.type(d) === this.category) && (!this.market || this.marketLabel(d) === this.market) && (!query || this.normalize(d.equipoLocal + ' ' + d.equipoVisitante).includes(query));
      });
    }).sort((a, b) => this.order === 'low' ? a.odds - b.odds : this.order === 'high' ? b.odds - a.odds : (a.date || '9999').localeCompare(b.date || '9999'));
    this.page = 1;
  }
  setPeriod(value: string): void { this.period = value; this.apply(); }
  reset(): void { this.period = 'today'; this.league = ''; this.category = ''; this.market = ''; this.search = ''; this.order = 'date'; this.apply(); }
  get pages(): number { return Math.ceil(this.filtered.length / this.pageSize); }
  get groups(): {date: string; items: Recommendation[]}[] {
    const rows = this.filtered.slice((this.page - 1) * this.pageSize, this.page * this.pageSize);
    const groups: {date: string; items: Recommendation[]}[] = [];
    rows.forEach(item => {
      const previous = groups[groups.length - 1];
      if (previous?.date === item.date) previous.items.push(item);
      else groups.push({date: item.date, items: [item]});
    });
    return groups;
  }
  trackGroup(_index: number, group: {date: string}): string { return group.date; }
  dateLabel(date: string): string {
    date = this.dateKey(date);
    return date ? new Intl.DateTimeFormat('es-PE', {timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric'}).format(new Date(date + 'T12:00:00Z')) : 'Fecha por confirmar';
  }
  ngOnDestroy(): void {
    try { sessionStorage.setItem('recommendation-filters', JSON.stringify({period: this.period, league: this.league, category: this.category, market: this.market, search: this.search, order: this.order})); } catch { /* Storage can be unavailable. */ }
    this.destroy$.next(); this.destroy$.complete(); }
}

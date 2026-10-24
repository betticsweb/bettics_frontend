import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, of } from 'rxjs';
import { EventLigaPageComponent } from './event-liga-page.component';
import { EventoLigaService } from '../../services/eventoLiga.service';
import { statisticsParams } from 'src/app/shared/utils/recommendation-market';

describe('Recommendation to statistics (simulated service)', () => {
  let fixture: ComponentFixture<EventLigaPageComponent>;
  let params: BehaviorSubject<any>;
  const base = {liga: 'Liga', equipoLocal: 'A', equipoVisitante: 'B', idHomeTeam: 'a', idAwayTeam: 'b', mercadoApuesta: 'Total córners', opcionApuesta: 'Más de', valorOpcionApuesta: '8.5'};
  const row = {dateEvent: '2026-10-20', idHomeTeam: 'b', strHomeTeam: 'B', idAwayTeam: 'a', strAwayTeam: 'A', intHomeScore: 0, intAwayScore: 2, cornerKicksHome: 4, cornerKicksAway: 5, totalCardsHome: 0, totalCardsAway: 1, shotsonGoalHome: 2, shotsonGoalAway: 3};
  beforeEach(async () => {
    params = new BehaviorSubject(statisticsParams(base));
    await TestBed.configureTestingModule({
      declarations: [EventLigaPageComponent], imports: [CommonModule, FormsModule, RouterTestingModule],
      providers: [
        {provide: ActivatedRoute, useValue: {queryParams: params}},
        {provide: EventoLigaService, useValue: {
          obtenerMaestros: () => of({resStatus: 'ok', strLeague: ['Liga']}),
          obtenerTemporadasByLiga: () => of({strSeason: ['2026']}),
          obtenerEquipos: () => of({strHomeTeam: [{_id: {idHomeTeam: 'a', strHomeTeam: 'A'}}], strAwayTeam: [{_id: {idAwayTeam: 'b', strAwayTeam: 'B'}}]}),
          obtenerResumenes: () => of({partidosLosDosEquipos: [{...row}], ultimos6Home: [{...row}, {...row, intHomeScore: null, cornerKicksAway: null}], ultimos6Away: [{...row}], soloLocal: [], soloVisita: []})
        }}
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(EventLigaPageComponent);
    fixture.detectChanges();
  });
  afterEach(() => fixture.destroy());
  function navigate(market: string, option = 'Más de', value = '2.5') {
    params.next(statisticsParams({...base, mercadoApuesta: market, opcionApuesta: option, valorOpcionApuesta: value}));
    fixture.detectChanges();
    return fixture.componentInstance;
  }
  for (const seasons of [['2025', '2026'], [2025, 2026], ['2025/2026', '2026/2027']]) {
    it(`loads teams and histories after selecting the latest season from ${JSON.stringify(seasons)}`, () => {
      const service = TestBed.inject(EventoLigaService);
      spyOn(service, 'obtenerTemporadasByLiga').and.returnValue(of({strSeason: seasons}));
      const teams = spyOn(service, 'obtenerEquipos').and.callThrough();
      const histories = spyOn(service, 'obtenerResumenes').and.callThrough();
      fixture.componentInstance.cargarTemporadas(true);
      fixture.detectChanges();
      expect(fixture.componentInstance.strSeasonSelected).toBe(seasons[1]);
      expect(teams).toHaveBeenCalledWith(jasmine.objectContaining({strSeason: seasons[1]}));
      expect(histories).toHaveBeenCalledWith(jasmine.objectContaining({strSeason: seasons[1], idHomeTeam: 'a', idAwayTeam: 'b'}));
      expect(fixture.componentInstance.partidosLosDosEquipos.length).toBe(1);
    });
  }
  it('clears teams from the previous league and loads the new league without a stale season', () => {
    const c = fixture.componentInstance;
    const service = TestBed.inject(EventoLigaService);
    const teams = spyOn(service, 'obtenerEquipos').and.callThrough();
    const histories = spyOn(service, 'obtenerResumenes').and.callThrough();
    c.strLeagueSelected = 'Peru Primera Division';
    c.cargarTemporadasEquipos();
    expect(c.strSeasonSelected).toBeNull();
    expect(c.strHomeTeamSelected).toBe('');
    expect(c.strAwayTeamSelected).toBe('');
    expect(teams).toHaveBeenCalledWith({strLeague: 'Peru Primera Division', strSeason: null});
    expect(histories).not.toHaveBeenCalled();
  });
  it('selects teams, league, corners and exact line with consistent green rows and denominator', () => {
    const c = fixture.componentInstance;
    expect(c.tabActual).toBe(2);
    expect(c.strLeagueSelected).toBe('Liga');
    expect(c.strHomeTeamSelected).toBe('a');
    expect(c.strAwayTeamSelected).toBe('b');
    expect(c.strMatchFilterSelected).toBe(8.5);
    expect(c.ultimos6Home.map(x => x.filtroAplicado)).toEqual([true, false]);
    expect(c.porcentajeFiltro.porcentajeUltimos6Home).toBe(':1/1 · 100 %');
    expect(fixture.nativeElement.querySelector('#corners-tab').classList.contains('active')).toBeTrue();
    expect(fixture.nativeElement.querySelector('#corners').classList.contains('active')).toBeTrue();
    expect(fixture.nativeElement.querySelector('#stats-direction')).toBeTruthy();
  });
  for (const [market, tab] of [['Total goles', 1], ['Tarjetas', 3], ['Tiros a puerta', 4], ['Ganador del partido', 5], ['Ambos marcan', 1]] as const) {
    it(`navigates to ${market}`, () => expect(navigate(market, tab === 5 ? '1' : market === 'Ambos marcan' ? 'Sí' : 'Más de', tab === 5 || market === 'Ambos marcan' ? '' : '2.5').tabActual).toBe(tab));
  }
  it('preselects the under direction from the recommendation', () => {
    const c = navigate('Total córners', 'Menos de', '10.5');
    expect(c.filterDirection).toBe('menos');
    expect(c.strMatchFilterSelected).toBe(10.5);
    expect(c.partidosLosDosEquipos[0].filtroAplicado).toBeTrue();
  });
  it('updates green rows and percentages when the comparison changes, preserving the line', () => {
    const c = fixture.componentInstance;
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('#stats-direction');
    select.value = 'menos';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(c.filterDirection).toBe('menos');
    expect(c.strMatchFilterSelected).toBe(8.5);
    expect(c.ultimos6Home.map(x => x.filtroAplicado)).toEqual([false, false]);
    expect(c.porcentajeFiltro.porcentajeUltimos6Home).toBe(':0/1 · 0 %');
    select.value = 'mas';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(c.ultimos6Home[0].filtroAplicado).toBeTrue();
    expect(c.porcentajeFiltro.porcentajeUltimos6Home).toBe(':1/1 · 100 %');
  });
  it('shows both-scoring No and zero as valid, excluding missing goals', () => {
    const c = navigate('Ambos marcan', 'No', '');
    expect(c.analysisMode).toBe('both');
    expect(c.resultSelection).toBe('no');
    expect(c.porcentajeFiltro.porcentajeUltimos6Home).toBe(':1/1 · 100 %');
    expect(c.porcentajeFiltro.porcentajeSoloLocal).toBe(':Sin datos');
    expect(fixture.nativeElement.textContent).toContain('Ambos marcan · Partido completo');
  });
  it('counts 1X2 by identity when the upcoming home team was away', () => {
    const c = navigate('Ganador del partido', '1', '');
    expect(c.analysisMode).toBe('winner');
    expect(c.ultimos6Home[0].filtroAplicado).toBeTrue();
    expect(c.ultimos6Away[0].filtroAplicado).toBeTrue();
    expect(c.groupExplanation('home')).toContain('victoria de A');
    expect(c.groupExplanation('away')).toContain('derrota de B');
  });
  for (const period of ['primer tiempo', 'segundo tiempo']) {
    it(`separates ${period} from final-score statistics`, () => {
      const c = navigate('Total goles ' + period, 'Más de', '0.5');
      expect(c.strMatchFilterSelected).toBe('');
      expect(c.partidosLosDosEquipos.some(x => x.filtroAplicado)).toBeFalse();
      expect(fixture.nativeElement.textContent).toContain('No hay datos disponibles del ' + period + ' para analizar esta recomendación');
      expect(fixture.nativeElement.textContent).toContain('Estadísticas generales del partido completo');
    });
  }
  it('does not apply an unknown recommendation to a compatible total', () => {
    const c = navigate('Mercado especial (N1)', 'Más de', '0.5');
    expect(c.unsupportedNotice).toContain('no es compatible');
    expect(c.strMatchFilterSelected).toBe('');
    expect(c.partidosLosDosEquipos.some(x => x.filtroAplicado)).toBeFalse();
  });
});

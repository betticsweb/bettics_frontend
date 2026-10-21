import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CarouselModule, OwlOptions } from 'ngx-owl-carousel-o';
import { Subject, takeUntil, timeout } from 'rxjs';
import { AccesoService } from 'src/app/main/auth/services/acceso.service';

interface Recomendacion {
  date_unix: string;
  liga: string;
  mercado: string;
  probabilidad: number | string;
  pais_imagen?: string;
  home_name: string;
  home_image?: string;
  away_name: string;
  away_image?: string;
}

@Component({
  selector: 'app-home-recommendations',
  standalone: true,
  imports: [CommonModule, CarouselModule],
  templateUrl: './home-recommendations.component.html',
  styleUrls: ['./home-recommendations.component.css']
})
export class HomeRecommendationsComponent implements OnInit, OnDestroy {
  recomendaciones: (Recomendacion & { fecha: string; fechaEtiqueta: string })[] = [];
  estado: 'cargando' | 'listo' | 'vacio' | 'error' = 'cargando';
  private readonly destroy$ = new Subject<void>();

  // Same public endpoint and pagination as the original home page.
  readonly opciones: OwlOptions = {
    items: 6,
    margin: 12,
    loop: true,
    dots: false,
    nav: false,
    autoplay: true,
    autoplayTimeout: 5000,
    autoplayHoverPause: true,
    smartSpeed: 300,
    responsive: {
      0: { items: 1 },
      420: { items: 2 },
      760: { items: 4 },
      1000: { items: 6 }
    }
  };

  constructor(private readonly accesoService: AccesoService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.estado = 'cargando';
    this.recomendaciones = [];
    this.accesoService.obtenerPartidosPriorizados({ pageNumber: 1, pageSize: 13 })
      .pipe(timeout(20000), takeUntil(this.destroy$))
      .subscribe({
        next: (respuesta: { resResult?: Recomendacion[] }) => {
          if (!Array.isArray(respuesta?.resResult)) {
            this.estado = 'error';
            return;
          }
          const partesHoy = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit'
          }).formatToParts(new Date());
          const hoy = ['year', 'month', 'day']
            .map(tipo => partesHoy.find(parte => parte.type === tipo)?.value).join('-');
          const formatoFecha = new Intl.DateTimeFormat('es-PE', {
            timeZone: 'UTC', day: 'numeric', month: 'long'
          });
          this.recomendaciones = respuesta.resResult.map(partido => ({
            ...partido, fecha: this.fechaClave(partido.date_unix)
          })).filter(partido => partido.fecha && partido.fecha >= hoy)
            .sort((a, b) => a.fecha.localeCompare(b.fecha))
            .map(partido => ({
              ...partido,
              fechaEtiqueta: formatoFecha.format(new Date(`${partido.fecha}T12:00:00Z`))
            }));
          this.estado = this.recomendaciones.length ? 'listo' : 'vacio';
        },
        error: () => {
          this.estado = 'error';
        }
      });
  }

  private fechaClave(valor: string): string {
    // The public API returns calendar dates as DD/MM/YYYY, not Unix timestamps.
    const partes = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(valor || '');
    if (!partes) return '';
    const [, dia, mes, anio] = partes;
    const fecha = new Date(Date.UTC(+anio, +mes - 1, +dia));
    if (fecha.getUTCFullYear() !== +anio || fecha.getUTCMonth() !== +mes - 1 || fecha.getUTCDate() !== +dia) return '';
    return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }

  ocultarImagen(event: Event): void {
    (event.target as HTMLImageElement).hidden = true;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

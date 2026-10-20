import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CarouselModule, OwlOptions } from 'ngx-owl-carousel-o';
import { Subject, takeUntil, timeout } from 'rxjs';
import { AccesoService } from 'src/app/main/auth/services/acceso.service';

interface Recomendacion {
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
  recomendaciones: Recomendacion[] = [];
  estado: 'cargando' | 'listo' | 'vacio' | 'error' = 'cargando';
  private readonly destroy$ = new Subject<void>();

  // Same public endpoint and pagination as the original home page.
  readonly opciones: OwlOptions = {
    items: 4,
    margin: 16,
    loop: false,
    dots: false,
    nav: false,
    autoplay: false,
    smartSpeed: 300,
    responsive: {
      0: { items: 1 },
      600: { items: 2 },
      1000: { items: 4 }
    }
  };

  constructor(private readonly accesoService: AccesoService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.estado = 'cargando';
    this.accesoService.obtenerPartidosPriorizados({ pageNumber: 1, pageSize: 13 })
      .pipe(timeout(20000), takeUntil(this.destroy$))
      .subscribe({
        next: (respuesta: { resResult?: Recomendacion[] }) => {
          if (!Array.isArray(respuesta?.resResult)) {
            this.estado = 'error';
            return;
          }
          this.recomendaciones = respuesta.resResult;
          this.estado = this.recomendaciones.length ? 'listo' : 'vacio';
        },
        error: () => {
          this.estado = 'error';
        }
      });
  }

  ocultarImagen(event: Event): void {
    (event.target as HTMLImageElement).hidden = true;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

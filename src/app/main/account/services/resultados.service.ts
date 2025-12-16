import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { Constantes } from 'src/app/core/data/constants';
import { ConvertDataService } from 'src/app/shared/service/convert-data.service';
import { SwalAlertService } from 'src/app/shared/service/swal-alert.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ResultadosService {

  urlAccesos = environment.urlIntegracion;

  constructor(private _httpClient: HttpClient,
    private _swalAlertService: SwalAlertService,
    private _convertDataHelper: ConvertDataService

  ) { }

  obtenerListado(criterioBusqueda: any): Observable<any> {
    const parametrosGet = this._convertDataHelper.obtenerParametrosGet(criterioBusqueda);
    const url = `${this.urlAccesos}${Constantes.api.account.Resultados}`;
    return this._httpClient.get<any>(
      url,
      { params: parametrosGet }
    ).
      pipe(
        map((resp: any) => {
          return resp;
        }),
        catchError(err => {
          this._swalAlertService.swalEventoUrgente({ mensaje: err.error.resStatus })
          throw new Error(err)
        })
      );
  }

  obtenerMaestros(criterioBusqueda: any): Observable<any> {
    const parametrosGet = this._convertDataHelper.obtenerParametrosGet(criterioBusqueda);
    const url = `${this.urlAccesos}${Constantes.api.account.MaestrosResultados}`;
    return this._httpClient.get<any>(
      url,
      { params: parametrosGet }
    ).
      pipe(
        map((resp: any) => {
          return resp;
        }),
        catchError(err => {
          this._swalAlertService.swalEventoUrgente({ mensaje: err.error.resStatus })
          throw new Error(err)
        })
      );
  }
}

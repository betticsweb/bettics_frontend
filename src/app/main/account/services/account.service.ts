import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { Constantes } from 'src/app/core/data/constants';
import { UsuarioModel } from 'src/app/core/models/usuario.model';
import { StatusCodeResponseHelper } from 'src/app/shared/service/status-response.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  usuarioConectado: UsuarioModel;
  urlAccesos = environment.urlIntegracion;

  constructor(
    private _httpClient: HttpClient,
    private _statusCodeResponseHelper: StatusCodeResponseHelper
  ) { }

  obtenerEntidad(id: String): Observable<any> {
    ;
    const url = `${this.urlAccesos + Constantes.api.usuario.Get}/${id}`;
    return this._httpClient
      .get<any>(url, {})
      .pipe(
        map((resp: any) => {
          return resp;
        }),
        catchError(err => {
          console.log(err);
          this._statusCodeResponseHelper.statusResponse({ mensaje: err.error.message })
          throw new Error(err)
        })
      );
  }

  obtenerSuscripcionEntidad(id: String): Observable<any> {
    const url = `${this.urlAccesos + Constantes.api.culqi.Get}/${id}`;
    return this._httpClient
      .get<any>(url, {})
      .pipe(
        map((resp: any) => {
          return resp;
        }),
        catchError(err => {
          console.log(err);
          this._statusCodeResponseHelper.statusResponse({ mensaje: err.error.message })
          throw new Error(err)
        })
      );
  }

  obtenerInfoBilleteraMovilPagado(id: String): Observable<any> {
    const url = `${this.urlAccesos + Constantes.api.culqi.GetOrder}/${id}`;
    return this._httpClient
      .get<any>(url, {})
      .pipe(
        map((resp: any) => {
          return resp;
        }),
        catchError(err => {
          console.log(err);
          this._statusCodeResponseHelper.statusResponse({ mensaje: err.error.message })
          throw new Error(err)
        })
      );
  }

  registrarSuscripcionEntidad(usuario: any): Observable<any> {
    const url = this.urlAccesos + Constantes.api.usuario.Suscripcion;
    console.log(usuario);

    return this._httpClient.post(url, usuario)
      .pipe(
        map((resp: any) => {
          return resp;
        }),
        catchError(err => {
          console.log(err);
          this._statusCodeResponseHelper.statusResponse(err);
          throw new Error(err)
        })
      )
  }

  cancelarSuscripcionEntidad(usuario: any): Observable<any> {
    const url = this.urlAccesos + Constantes.api.usuario.Cancelar;
    return this._httpClient.post(url, usuario)
      .pipe(
        map((resp: any) => {
          return resp;
        }),
        catchError(err => {
          console.log(err);
          this._statusCodeResponseHelper.statusResponse({ mensaje: err.error.message })
          throw new Error(err)
        })
      )
  }
}


import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable } from 'rxjs';
import { Constantes } from 'src/app/core/data/constants';
import { ResponseModel } from 'src/app/core/models/response.model';
import { SwalAlertService } from 'src/app/shared/service/swal-alert.service';
import { environment } from 'src/environments/environment';
import { JwtHelperService } from '@auth0/angular-jwt';
import { MensajeEmailModel } from 'src/app/core/models/mensajeEmailModel.model';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  usuarioConectado: MensajeEmailModel;
  urlAccesos = environment.urlIntegracion;

  constructor(private _httpClient: HttpClient,
    private _router: Router,
    private _swalAlertService: SwalAlertService,
    public jwtHelper: JwtHelperService
  ) {
    this.usuarioConectado = new MensajeEmailModel();
  }

  enviarMensajeSoporte(email: MensajeEmailModel): Observable<any> {
    const url = this.urlAccesos + Constantes.api.email.enviarmensajesoporte;

    return this._httpClient.post(url, email)
      .pipe(
        map((resp: any) => {
          return resp;
        }),
        catchError(err => {
          console.log(err);
          if (err.error.resError)
            this._swalAlertService.swalEventoUrgente({ mensaje: err.error.resError[0].message });
          else
            this._swalAlertService.swalEventoUrgente({ mensaje: err.error.msg });
          throw new Error(err)
        })
      )
  }

  cargarStorage(): void {

    if (localStorage.getItem('usuarioConectado')) {

      let data = localStorage.getItem('usuarioConectado');
      if (data)
        this.usuarioConectado = JSON.parse(data);
    } else {

    }
  }

  actualizarStore(): void {
    localStorage.setItem('usuarioConectado', JSON.stringify(this.usuarioConectado));
  }
}

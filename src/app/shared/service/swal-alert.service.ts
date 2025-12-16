import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class SwalAlertService {

  constructor() { }

  swalEventoExitoso(informacionSwal: { mensaje: any; }): void {
    Swal.fire({ 
      toast: true, 
      position: 'top-end', 
      showConfirmButton: false, 
      timer: 30000,   
      text: informacionSwal.mensaje, 
      icon: 'success',
      timerProgressBar: true,
      showCloseButton: true,
      background: '#CEF6CE',
    }); 
  }

  swalEventoUrgente(informacionSwal: { mensaje: any; }): void {
    Swal.fire({
      toast: true, 
      position: 'top-end', 
      showConfirmButton: false, 
      timer: 30000, 
      text: informacionSwal.mensaje, 
      icon: 'error',
      timerProgressBar: true,
      showCloseButton: true,
      color: '#ffffff',
      background: '#e30000',
    });
  }

  confirmarEliminar(informacionSwal: { titulo: any }): any {
    return Swal.fire({
        title: informacionSwal.titulo,
        text: 'Indique el motivo',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Si, eliminar!',
        cancelButtonText: 'No, cancelar!',
        input: 'textarea',
        inputAttributes: {
            autocapitalize: 'off',
        },
        preConfirm: (pComentario) => {
            if (String(pComentario) === '') {
                Swal.showValidationMessage(
                    'Debe ingresar un motivo'
                );
            }
            else {
                return pComentario;
            }
        },
        allowOutsideClick: () => !Swal.isLoading()
    });
}
}

import Swal from 'sweetalert2';
import { Injectable } from '@angular/core';
import { AuthService } from 'src/app/main/auth/services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class StatusCodeResponseHelper {

    constructor(
        private _authService: AuthService
        ) { }

    statusResponse(error: any): void {
        if (error.status === 500) {
            this.statusCode500(error);
        }
        else if (error.status === 400) {
            this.statusCode400(error);
        }
        else if (error.status === 401) {
            this._authService.logout();
            this.statusCode401();
        }
        else if (error.status === 404) {
            this.statusCode404();
        }
        else if (error.status === 409) {
            this.statusCode409(error);
        }
    }

    statusCode400(infoErrors: any): void {
        if (infoErrors.error.errors) {
            const arr = Object.keys(infoErrors.error.errors).map((key) => [key, infoErrors.error.errors[key]]);
            let errors = '';
            // tslint:disable-next-line: prefer-for-of
            for (let i = 0; i < arr.length; i++) {
                errors += arr[i][1] + '<br />';
            }
            Swal.fire({
                icon: 'warning',
                title: 'Advertencia del registro',
                showConfirmButton: true,
                html: errors
            });
        }
        else {
            let errors = 'Ocurrio un problema al procesar la información';
            Swal.fire({
                icon: 'warning',
                title: 'Advertencia del registro',
                showConfirmButton: true,
                html: errors
            });
        }

    }

    statusCode404(): void {
        Swal.fire({
            icon: 'warning',
            title: 'La entidad no fue encontrada.',
            showConfirmButton: true
        });
    }

    statusCode500(infoErrors: any): void {
        let errors = '';
        if(infoErrors.error.resError != null) {
            if(infoErrors.error.resError.length > 0){
                for (let i = 0; i < infoErrors.error.resError.length; i++) {
                    errors += infoErrors.error.resError[i].message + '<br />';
                }
            }
            else {
                if(infoErrors.error.resError.message != undefined){
                    errors += infoErrors.error.resError.message + '<br />';
                }
            }
        }
        if(errors == '') {
            errors = 'Ocurrio un problema al procesar la información.';
        }
        Swal.fire({
            icon: 'error',
            title: 'Advertencia del registro',
            showConfirmButton: true,
            html: errors
        });
    }

    statusCode409(infoErrors: any): void {
        let errors = '';
        if(infoErrors.error.resError != null) {
            for (let i = 0; i < infoErrors.error.resError.length; i++) {
                errors += infoErrors.error.resError[i].message + '<br />';
            }
        }
        else {
            errors = 'El código de la entidad se encuentra duplicado.';
        }
        Swal.fire({
            icon: 'warning',
            title: 'Advertencia del registro',
            showConfirmButton: true,
            html: errors
        });
    }

    statusCode401(): void {
        Swal.fire({
            icon: 'warning',
            title: 'Session terminada, ingrese nuevamente',
            showConfirmButton: true,
        });
    }
}


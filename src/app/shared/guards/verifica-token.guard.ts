import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';


@Injectable()
export class VerificaTokenGuard implements CanActivate {

    constructor(
        // public _accesoService: AccesoService,
        // public router: Router
    ) { }

    // canActivate(): Promise<boolean> | boolean {

    //     const token = this._accesoService.token;
    //     const payload = JSON.parse(atob(token.split('.')[1]));

    //     const expirado = this.expirado(payload.exp);

    //     if (expirado) {
    //         this.router.navigate(['/login']);
    //         return false;
    //     }

    //     return this.verificarRenuevacionToken(payload.exp);
    // }

    // verificarRenuevacionToken(fechaExp: number): Promise<boolean> {

    //     return new Promise((resolve, reject) => {

    //         const tokenExp = new Date(fechaExp * 1000);
    //         const ahora = new Date();

    //         ahora.setTime(ahora.getTime() + (1 * 60 * 60 * 1000));

    //         if (tokenExp.getTime() > ahora.getTime()) {
    //             resolve(true);
    //         } else {

    //             this._accesoService.renuevaToken()
    //                 .subscribe(() => {
    //                     resolve(true);
    //                 }, () => {
    //                     this.router.navigate(['/login']);
    //                     reject(false);
    //                 });

    //         }

    //     });

    // }
    // expirado(fechaExp: number): boolean {

    //     const ahora = new Date().getTime() / 1000;

    //     if (fechaExp < ahora) {
    //         return true;
    //     } else {
    //         return false;
    //     }
    // }
}

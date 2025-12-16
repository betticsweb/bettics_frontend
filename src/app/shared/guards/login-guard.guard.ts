import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from 'src/app/main/auth/services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class LoginGuardGuard  {

    constructor(
        private _authService: AuthService,
        public router: Router
    ) { }

    token: string;
    listadoAccesos: any;

    canActivate(): boolean {
        // if (this._authService.isAuthenticated()) {

        //     const resultado = this._authService.revisarAccesosRuta(state.url);
        //     console.log(resultado);
        //     if (resultado) {
        //         return true;
        //     }
        //     else {
        //         return false;
        //         //this.router.navigate(['/**']);
        //     }
        // } else {
        //     this.router.navigate(['/auth/login']);
        //     return false;
        // }

        if (!this._authService.isAuthenticated()) {
            this.router.navigate(['/auth/login']);
            return false;
        }
        return true;
    }
}

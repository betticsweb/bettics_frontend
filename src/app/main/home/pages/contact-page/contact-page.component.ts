import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MensajeEmailModel } from 'src/app/core/models/mensajeEmailModel.model';
import { EmailService } from 'src/app/main/auth/services/email.service';
import { SwalAlertService } from 'src/app/shared/service/swal-alert.service';

@Component({
  selector: 'app-contact-page',
  templateUrl: './contact-page.component.html',
  styleUrls: ['./contact-page.component.css']
})
export class ContactPageComponent implements OnInit {

  formularioEntidad: FormGroup;
  submitted = false;
  _unsubscribeAll: Subject<any>;

  constructor(
    private _formBuilder: FormBuilder,
    private _swalAlertService: SwalAlertService,
    private _emailService: EmailService
  ) {
    this._unsubscribeAll = new Subject();
  }

  ngOnInit(
  ): void {
    this.formularioEntidad = this.crearFormularioEntidad();
  }

  get f(): { [key: string]: AbstractControl } {
    return this.formularioEntidad.controls;
  }

  enviarEmail(): void {

    this.submitted = true
    if (this.formularioEntidad.invalid) {
      return;
    }
    let data = this.formularioEntidad.getRawValue() as MensajeEmailModel;
    this._emailService.enviarMensajeSoporte(data)
      .pipe(
        takeUntil(this._unsubscribeAll)
      )
      .subscribe((response) => {
        this._swalAlertService.swalEventoExitoso({ mensaje: 'Hemos recibido su mensaje exitosamente, pronto le estaremos contestando.' });
        this.formularioEntidad.reset();
      });
  }

  crearFormularioEntidad(): FormGroup {
    return this._formBuilder.group({
      to: ["", [Validators.required, Validators.email, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')]],
      name: ["", [Validators.required]],
      text: ["", [Validators.required]],
      subject: ["Soporte Bettics"],
    });
  }

}

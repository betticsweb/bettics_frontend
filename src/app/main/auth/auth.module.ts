import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { RegisterPageComponent } from './pages/register-page/register-page.component';
import { AuthRoutingModule } from './auth-routing.module';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxMaskModule, IConfig } from 'ngx-mask'
import { ResetPasswordPageComponent } from './pages/reset-password/reset-password.component';
import { NgxIntlTelInputModule } from 'ngx-intl-tel-input';
const maskConfigFunction: () => Partial<IConfig> = () => {
  return {
    validation: false,
  };
};

@NgModule({
  declarations: [
    LoginPageComponent,
    RegisterPageComponent,
    ResetPasswordPageComponent
  ],
  imports: [
    CommonModule,
    AuthRoutingModule,
    NgxMaskModule.forRoot(maskConfigFunction),
    ReactiveFormsModule,
    NgxIntlTelInputModule
  ],
})
export class AuthModule { }

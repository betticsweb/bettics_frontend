import { DOCUMENT } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FuseSplashScreenService } from './shared/service/splash-screen.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  private _unsubscribeAll: Subject<any>;

  constructor(
    @Inject(DOCUMENT) public document: any,
    public _fuseSplashScreenService: FuseSplashScreenService
  ) {

    // Set the private defaults
    this._unsubscribeAll = new Subject();
  }

}

import { DOCUMENT } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FuseSplashScreenService } from './shared/service/splash-screen.service';
import { Subject } from 'rxjs';
import { inject } from '@vercel/analytics';
import { environment } from 'src/environments/environment';

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

    if (environment.production && ['bettics.com.pe', 'www.bettics.com.pe'].includes(this.document.location.hostname)) {
      inject({
        mode: 'production',
        beforeSend: event => {
          const url = new URL(event.url);
          url.search = '';
          url.hash = '';
          return { ...event, url: url.toString() };
        }
      });
    }
  }

}

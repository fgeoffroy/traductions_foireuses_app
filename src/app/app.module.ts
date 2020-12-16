import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { HttpClientModule } from '@angular/common/http';
import { IonicStorageModule } from '@ionic/storage';
import { SQLite } from '@ionic-native/sqlite/ngx';

import { environment } from 'src/environments/environment';
import { AngularFireModule } from '@angular/fire';
import { NgCircleProgressModule } from 'ng-circle-progress';

import { pageTransition } from './page-transition';



@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule,
    IonicModule.forRoot({ navAnimation: pageTransition }),
    AppRoutingModule,
    IonicStorageModule.forRoot(),
    HttpClientModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    NgCircleProgressModule.forRoot({
      // set defaults here
      radius: 40,
      space: -10,
      outerStrokeWidth: 10,
      // outerStrokeGradient: true,
      // outerStrokeColor: "#4882c2",
      // outerStrokeGradientStopColor: "#4882c2",
      outerStrokeColor: "#abbf7a",
      innerStrokeColor: "#e7e8ea",
      innerStrokeWidth: 10,
      animationDuration: 200,
      units: "/100",
      unitsFontSize: '12',
      showSubtitle: false,
      startFromZero: false,
    }),
  ],
  providers: [
    StatusBar,
    SplashScreen,
    SQLite,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Ng5SliderModule } from 'ng5-slider';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MapComponent } from './map/map.component';
import { MapService } from './map.service';
import { PopupService } from './popup.service';
import { ShapeService } from './shape.service';
import { NotifierModule } from "angular-notifier";

@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    Ng5SliderModule,
    NotifierModule.withConfig({position: {
 
      horizontal: {
     
        /**
         * Defines the horizontal position on the screen
         * @type {'left' | 'middle' | 'right'}
         */
        position: 'left',
     
        /**
         * Defines the horizontal distance to the screen edge (in px)
         * @type {number} 
         */
        distance: 12
     
      },
     
      vertical: {
     
        /**
         * Defines the vertical position on the screen
         * @type {'top' | 'bottom'}
         */
        position: 'bottom',
     
        /**
         * Defines the vertical distance to the screen edge (in px)
         * @type {number} 
         */
        distance: 12,
     
        /**
         * Defines the vertical gap, existing between multiple notifications (in px)
         * @type {number} 
         */
        gap: 10
     
      }
     
    },
    behaviour: {
 
      /**
       * Defines whether each notification will hide itself automatically after a timeout passes
       * @type {number | false}
       */
      autoHide: 5000,
     
      /**
       * Defines what happens when someone clicks on a notification
       * @type {'hide' | false}
       */
      onClick: false,
     
      /**
       * Defines what happens when someone hovers over a notification
       * @type {'pauseAutoHide' | 'resetAutoHide' | false}
       */
      onMouseover: 'pauseAutoHide',
     
      /**
       * Defines whether the dismiss button is visible or not
       * @type {boolean} 
       */
      showDismissButton: true,
     
      /**
       * Defines whether multiple notification will be stacked, and how high the stack limit is
       * @type {number | false}
       */
      stacking: 4
     
    }
  })
  ],
  providers: [MapService,
              PopupService,
              ShapeService],
  bootstrap: [AppComponent]
})
export class AppModule { }

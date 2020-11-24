import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FingerDrawPageRoutingModule } from './finger-draw-routing.module';

import { GameViewPage } from './game-view.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FingerDrawPageRoutingModule
  ],
  declarations: [GameViewPage]
})
export class GameViewPageModule {}
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FingerDrawPageRoutingModule } from './finger-draw-routing.module';

import { FingerDrawPage } from './finger-draw.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FingerDrawPageRoutingModule
  ],
  declarations: [FingerDrawPage]
})
export class FingerDrawPageModule {}

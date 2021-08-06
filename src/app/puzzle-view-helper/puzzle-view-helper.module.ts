import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PuzzleViewHelperPageRoutingModule } from './puzzle-view-helper-routing.module';

import { PuzzleViewHelperPage } from './puzzle-view-helper.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PuzzleViewHelperPageRoutingModule
  ],
  declarations: [PuzzleViewHelperPage]
})
export class PuzzleViewHelperPageModule {}

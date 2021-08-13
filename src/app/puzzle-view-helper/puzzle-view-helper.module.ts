import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PuzzleViewHelperPageRoutingModule } from './puzzle-view-helper-routing.module';

import { PuzzleViewHelperPage } from './puzzle-view-helper.page';
import { PuzzleService } from '../services/puzzle.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PuzzleViewHelperPageRoutingModule
  ],
  declarations: [PuzzleViewHelperPage],
  providers:[PuzzleService]
})
export class PuzzleViewHelperPageModule {}

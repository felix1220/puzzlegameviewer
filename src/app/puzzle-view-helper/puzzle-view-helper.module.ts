import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PuzzleViewHelperPageRoutingModule } from './puzzle-view-helper-routing.module';

import { PuzzleViewHelperPage } from './puzzle-view-helper.page';
import { PuzzleService } from '../services/puzzle.service';
import { ComponentsModule } from '../components/components.module';
import {ProgressBarModule} from "angular-progress-bar"

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PuzzleViewHelperPageRoutingModule,
    ComponentsModule,
    ProgressBarModule
  ],
  declarations: [
    PuzzleViewHelperPage
  ],
  providers:[PuzzleService]
})
export class PuzzleViewHelperPageModule {}

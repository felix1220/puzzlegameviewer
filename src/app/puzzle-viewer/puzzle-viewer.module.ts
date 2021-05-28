import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PuzzleViewerPageRoutingModule } from './puzzle-viewer-routing.module';

import { PuzzleViewerPage } from './puzzle-viewer.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PuzzleViewerPageRoutingModule
  ],
  declarations: [PuzzleViewerPage]
})
export class PuzzleViewerPageModule {}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PuzzlegamePageRoutingModule } from './puzzlegame-routing.module';

import { PuzzlegamePage } from './puzzlegame.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PuzzlegamePageRoutingModule
  ],
  declarations: [PuzzlegamePage]
})
export class PuzzlegamePageModule {}

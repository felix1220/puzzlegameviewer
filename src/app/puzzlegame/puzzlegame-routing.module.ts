import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PuzzlegamePage } from './puzzlegame.page';

const routes: Routes = [
  {
    path: '',
    component: PuzzlegamePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PuzzlegamePageRoutingModule {}

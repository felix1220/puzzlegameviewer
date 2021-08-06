import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PuzzleViewHelperPage } from './puzzle-view-helper.page';

const routes: Routes = [
  {
    path: '',
    component: PuzzleViewHelperPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PuzzleViewHelperPageRoutingModule {}

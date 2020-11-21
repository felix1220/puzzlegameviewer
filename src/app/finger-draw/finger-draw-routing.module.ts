import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FingerDrawPage } from './finger-draw.page';

const routes: Routes = [
  {
    path: '',
    component: FingerDrawPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FingerDrawPageRoutingModule {}

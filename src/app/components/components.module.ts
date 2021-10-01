import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressbarComponent } from './progressbar/progressbar.component';
import { StopwatchComponent } from './stopwatch/stopwatch.component';


@NgModule({
  declarations: [ProgressbarComponent,StopwatchComponent],
  exports:[ProgressbarComponent, StopwatchComponent],
  imports: [
    CommonModule
  ]
})
export class ComponentsModule { }

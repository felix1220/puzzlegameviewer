import { Component, Input, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-stopwatch',
  templateUrl: './stopwatch.component.html',
  styleUrls: ['./stopwatch.component.scss'],
})
export class StopwatchComponent implements OnInit, OnDestroy {
  milliCntr: number = 0;
  secondsCntr: number = 0;
  minuteCntr: number = 0;
  hourCntr: number=0;
  timerRef:any;
  running: boolean = false;
  @Input() shouldStart:boolean = false;

  constructor() { 
    

    
  }

  ngOnInit() {

    this.startTimer();
  }

  startTimer() {
    //this.running = !this.running;
    if (this.shouldStart) {
      //this.startText = 'Stop';
     // const startTime = Date.now() - (this.secondsCntr || 0);
      this.timerRef = setInterval(() => {
        //this.milliCntr = Date.now() - startTime;
        //if(this.milliCntr % 1000 === 0) {
          this.secondsCntr++;
       // }
        if(this.secondsCntr % 60 === 0 && this.secondsCntr > 0) {
          this.minuteCntr++;
          this.secondsCntr = 0;
        }
        if(this.minuteCntr % 60 === 0 && this.minuteCntr > 0) {
          this.hourCntr++;
          this.minuteCntr = 0;
        }
      }, 1000);
    } else if(this.timerRef) {
      //this.startText = 'Resume';
      clearInterval(this.timerRef);
    }
  }
  clearTimer() {
    this.running = false;
    //this.startText = 'Start';
    //this.counter = undefined;
    this.secondsCntr = 0;
    clearInterval(this.timerRef);
  }
  ngOnDestroy() {
    clearInterval(this.timerRef);
  }

}

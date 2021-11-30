import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-stopwatch',
  templateUrl: './stopwatch.component.html',
  styleUrls: ['./stopwatch.component.scss'],
})
export class StopwatchComponent implements OnInit, OnDestroy, OnChanges {
  milliCntr: number = 0;
  secondsCntr: number = 0;
  minuteCntr: number = 0;
  hourCntr: number=0;
  timerRef:any;
  running: boolean = false;
  pauseClock: boolean = false;
  @Input() shouldStart:boolean = false;
  @Input() pause: boolean = false;
  @Input() done: boolean = false;
  @Input() setRand: number = 0;
  
  constructor() {
    
  }

  ngOnInit() {

    this.startTimer();
  }

  startTimer() {
    //this.running = !this.running;
    console.log('When loading => ', this.shouldStart)
    if (this.shouldStart) {
      //this.startText = 'Stop';
     // const startTime = Date.now() - (this.secondsCntr || 0);
     this.setUpTimer();
    } /*else if(this.timerRef) {
      //this.startText = 'Resume';
      clearInterval(this.timerRef);
    }*/
  }
  ngOnChanges(changes: SimpleChanges) {
    //debugger;
    console.log('Stop watch => ',changes);
    /*if(changes.shouldStart && changes.shouldStart.currentValue){
      this.clearTimer();
      this.setUpTimer();
    }*/
    if(changes.setRand && changes.setRand.currentValue > .05) {
      if(!this.timerRef) {
        console.log('First time!! => ', this.timerRef);
        this.setUpTimer();
       
      } else {
        this.calcTime(changes.setRand.currentValue);
      }
      
    }
    if(changes.pause && changes.pause.currentValue) {
      //this.clearTimer();
      this.pauseClock = true;
    }
    if(changes.pause && !changes.pause.currentValue) {
      this.pauseClock= false;
    }
    if(changes.done && changes.done.currentValue) {
      this.clearTimer();
    }
    /*if(changes.shouldStart && changes.howManyFound && changes.howManyFound.currentValue > 0 && !changes.shouldStart.currentValue) {
      this.clearTimer();
      this.setUpTimer();
    } else if(changes.shouldStart && changes.howManyFound && changes.howManyFound.currentValue > 0 && changes.shouldStart.currentValue){
      this.setUpTimer();
    }
    if(changes.pause && changes.pause.currentValue) {
      //this.clearTimer();
      this.pauseClock = true;
    }*/

  }
  calcTime(newRand: number): void {
    const penalty = Math.floor(((this.hourCntr * 120) + (this.minuteCntr * 60 ) + this.secondsCntr) * newRand);
    const seconds = Math.floor(penalty / 120);
    console.log(' the parameters => ', this.hourCntr, this.minuteCntr, this.secondsCntr, penalty)
    if(seconds > 60) {
      this.minuteCntr = Math.floor(seconds/60);
      this.secondsCntr = seconds - (this.minuteCntr * 60);
    } else {
      this.secondsCntr = penalty;
    }
  }
  setUpTimer(): void {
    this.timerRef = setInterval(() => {
      if(!this.pauseClock) {
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
      }
      //this.milliCntr = Date.now() - startTime;
      //if(this.milliCntr % 1000 === 0) {
    
    }, 1500);
  }
  clearTimer() {
    this.running = false;
    //this.startText = 'Start';
    //this.counter = undefined;
    this.secondsCntr = 0;
    this.minuteCntr=0;
    this.hourCntr=0;
    if(this.timerRef) {
      clearInterval(this.timerRef);
    }
    
  }
  ngOnDestroy() {
    clearInterval(this.timerRef);
  }

}

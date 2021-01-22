import { Component, OnDestroy, OnInit } from '@angular/core';
import { interval, Subscription, timer } from 'rxjs';
import { BlockType } from '../models/blockTypes';
import { Pixel } from '../models/pixel';
import { Point2D } from '../models/point';
import { Puzzle } from '../models/puzzle';
import { PuzzleService } from '../services/puzzle.service';
import { DirectionType } from '../models/directions';
import { highlight } from '../models/highlight';
import { Line } from '../models/line';
import { highlighter } from '../models/highlighter';
import { debugOutputAstAsTypeScript } from '@angular/compiler';
import { LoaderService } from '../services/loader/loader.service';
import * as Fireworks from './../utils/fireworks';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-game-view',
  templateUrl: './game-view.component.html',
  styleUrls: ['./game-view.component.scss']
})
export class GameViewPage implements OnInit, OnDestroy {

  canvasRef :HTMLCanvasElement;
  canvas2:HTMLCanvasElement;
  puzzleSubscribe:Subscription;
  context:CanvasRenderingContext2D;
  context2:CanvasRenderingContext2D;
  puzzleStyle: string;
  cellWidth: number;
  mod: number;
  allPixles: Pixel[];
  adjSections: any = {};
  localPuzzles: Puzzle[];
  numOfCols: number =10;
  fontBig: string = 'bold 55px Courier';
  inLargeMode: boolean = false;
  sections:Point2D[][];
  sectionPicked: any;
  statusMove: boolean = true;
  statusHighlight: boolean = false;
  isMouseDown: boolean = false;
  initialDown: Point2D;
  largeHash: any = {};
  selectDir: DirectionType = DirectionType.None;
  currSelectionQueue: highlighter;
  subPuzzlePts: any[] = [];
  subScriptionTimer: Subscription; 
  displayErrModal: boolean = false;
  testWords: any[] = [];
  allSelections: highlighter[] = [];
  allSmallSelections: highlighter[] = [];
  subSelections: highlighter[] = [];
  fireWorks: any = null;

  constructor(private puzzleService: PuzzleService, private loaderSvc: LoaderService) { 
    this.allPixles = [];
    this.initialDown = new Point2D(0,0);
    this.loaderSvc.create('Loading Puzzle...');
  }

  ngOnInit() {
    // this.loaderSvc.present();
    this.canvasRef = <HTMLCanvasElement>document.getElementById('canvasPuzzle');
    this.context = this.canvasRef.getContext('2d');
    this.canvas2 = <HTMLCanvasElement>document.getElementById('canvas2');
     this.context2 = this.canvas2.getContext('2d');

    this.loadCanvasMouseEvents();
    this.loadCanvasTouchEvents();
    
     this.puzzleSubscribe = this.puzzleService.loadPuzzles().subscribe( (puzzleData: Puzzle[]) => {
     
        this.localPuzzles = puzzleData;
        this.puzzleStyle = puzzleData[0].Style;
        this.cellWidth = puzzleData[0].Font + puzzleData[0].Spacing;
        this.mod = puzzleData[0].modulus;
        this.testWords = this.convertWordsToArray(puzzleData[0].words);
        this.populatePixelArray(puzzleData[0].content);
        this.sections = this.buildSections(puzzleData[0].sections);
        this.buildAdjacentSections();
        this.showStandardMode();
       
        
        this.loaderSvc.dismiss();
        // console.log('content bytes =>', this.localPuzzles);
    });
  }
  private convertWordsToArray(words: string[]): any[] {
    const collector: any[] = [];
    words.forEach( w => {
      const splitWord = w.split(',');
      let corner = splitWord[2].split(':');
      const onlyPts: any[] = [];
      onlyPts.push(new Point2D(+corner[0], +corner[1]))
      corner = splitWord[3].split(':');
      onlyPts.push(new Point2D(+corner[0], +corner[1]));
      corner = splitWord[4].split(':');
      onlyPts.push(new Point2D(+corner[0], +corner[1]));
      corner = splitWord[5].split(':');
      onlyPts.push(new Point2D(+corner[0], +corner[1]));
      collector.push({
        key: splitWord[1],
        word: splitWord[0],
        points:onlyPts,
        translatedPoints: null
      });

    });
    return collector;
  }
  private fireWorksAnime(): void {
    this.fireWorks = new Fireworks(this.canvas2, this.context2);
    this.fireWorks.getAsWebElement();
    const steps = interval(100);
    steps.pipe(take(50))
    .subscribe( num => {
      console.log('star steps => ', num);
      
    },
    () => console.log('Error happened!'),
    () => {
      this.fireWorks.cancelAnimation();
      // this.fireWorksRunning = false;
    })
  }
  private displaySelectionsByUser(selectionCoords: highlight): void {
    if (selectionCoords && !selectionCoords.start) {
      return;
    }
    this.context.beginPath();
    this.context.save();
    this.context.lineWidth = 2;
    this.context.moveTo(selectionCoords.start.start.x, selectionCoords.start.start.y);
    this.context.lineTo(selectionCoords.start.end.x, selectionCoords.start.end.y);
         selectionCoords.top.forEach((l) => {
      
          this.context.moveTo(l.start.x, l.start.y);
          this.context.lineTo(l.end.x, l.end.y);
        
      });
        selectionCoords.bottom.forEach((l) => {
      
        this.context.moveTo(l.start.x, l.start.y);
        this.context.lineTo(l.end.x, l.end.y);
      
    });
    this.context.moveTo(selectionCoords.end.start.x, selectionCoords.end.start.y);
    this.context.lineTo(selectionCoords.end.end.x, selectionCoords.end.end.y);
    this.context.stroke();
    this.context.restore();
  }
  buildHighlighter(positions: Point2D[], selectDir:DirectionType, largeWidth: number): highlight {
    
  
    const highlightStruct:highlight = new highlight();
    const first = positions[0];
    const last = positions[positions.length-1];

    if( selectDir === DirectionType.horizontalRight || selectDir === DirectionType.diagonalUpRight ||
        selectDir === DirectionType.diagonalDownRight || selectDir === DirectionType.horizontalLeft) {
          highlightStruct.start = new Line(
            new Point2D(first.x, first.y),
            new Point2D(first.x, first.y - largeWidth)
          );
          if (selectDir === DirectionType.horizontalLeft) {
            highlightStruct.start = new Line(
              new Point2D(first.x + largeWidth, first.y),
              new Point2D(first.x + largeWidth, first.y - largeWidth)
            );
            highlightStruct.end = new Line (
              new Point2D(last.x, last.y),
              new Point2D(last.x, last.y - largeWidth) 
             );
             highlightStruct.top = [];
             highlightStruct.top.push(
               new Line(
                 new Point2D(first.x + largeWidth, first.y - largeWidth),
                 new Point2D(last.x, last.y - largeWidth)
               )
             );
             highlightStruct.bottom = [];
             highlightStruct.bottom.push(
                  new Line(
                    new Point2D(first.x + largeWidth, first.y),
                    new Point2D(last.x, last.y)
                  )
                )
          } else if (selectDir === DirectionType.horizontalRight) { 
            highlightStruct.end = new Line (
              new Point2D(last.x + largeWidth, last.y),
              new Point2D(last.x + largeWidth, last.y - largeWidth)
            );
            highlightStruct.top = [];
            highlightStruct.top.push(
              new Line(
                new Point2D(first.x, first.y - largeWidth),
                new Point2D(last.x + largeWidth, last.y - largeWidth)
              )
            );
            highlightStruct.bottom = [];
            highlightStruct.bottom.push(
              new Line(
                new Point2D(first.x, first.y),
                new Point2D(last.x + largeWidth, last.y)
              )
            );
          } else if(selectDir === DirectionType.diagonalUpRight || selectDir === DirectionType.diagonalDownRight) {
            highlightStruct.end =new Line(
              new Point2D(last.x + largeWidth, last.y),
              new Point2D(last.x + largeWidth, last.y - largeWidth)
            )
            highlightStruct.top = [];
            highlightStruct.top.push(
              new Line(
                new Point2D(first.x, first.y - largeWidth),
                new Point2D(first.x + (largeWidth *.50), first.y - largeWidth)
              ),
              new Line(
                new Point2D(first.x + (largeWidth * .50), first.y - largeWidth),
                new Point2D(last.x + (largeWidth * .50), last.y - largeWidth)
              ),
              new Line(
                new Point2D(last.x + (largeWidth * .50), last.y - largeWidth),
                new Point2D(last.x + largeWidth, last.y - largeWidth)
              )
            );
            highlightStruct.bottom = [];
            highlightStruct.bottom.push(
              new Line(
                new Point2D(first.x, first.y),
                new Point2D(first.x + (largeWidth * .50), first.y)
              ),
              new Line(
                new Point2D(first.x + (largeWidth * .50), first.y),
                new Point2D(last.x + (largeWidth * .50), last.y)
              ),
              new Line(
                new Point2D(last.x + (largeWidth * .50), last.y),
                new Point2D(last.x + largeWidth, last.y)
              )
            )
          }
     } else if( selectDir === DirectionType.verticalDown) {
       highlightStruct.start = new Line(
         new Point2D(first.x, first.y - largeWidth),
         new Point2D(first.x + largeWidth, first.y - largeWidth)
       );
       highlightStruct.end = new Line(
        new Point2D(last.x, last.y),
        new Point2D(last.x + largeWidth, last.y)
       );
       highlightStruct.top = [];
       highlightStruct.top.push(
        new Line(
          new Point2D(first.x, first.y - largeWidth),
          new Point2D(last.x, last.y)
        )
       );
       highlightStruct.bottom = [];
       highlightStruct.bottom.push(
        new Line(
          new Point2D(first.x + largeWidth, first.y - largeWidth),
          new Point2D(last.x + largeWidth, last.y)
        )
       );
     } else if(selectDir === DirectionType.verticalUp) {
      highlightStruct.start = new Line(
        new Point2D(first.x, first.y),
        new Point2D(first.x + largeWidth, first.y)
      );
      highlightStruct.end = new Line(
        new Point2D(last.x, last.y - largeWidth),
         new Point2D(last.x + largeWidth, last.y - largeWidth)
      );
      highlightStruct.top = [];
      highlightStruct.top.push(
        new Line(
          new Point2D(first.x, first.y),
          new Point2D(last.x, last.y - largeWidth)
        )
      )
      highlightStruct.bottom = [];
      highlightStruct.bottom.push(
                new Line(
                  new Point2D(first.x + largeWidth, first.y),
                  new Point2D(last.x + largeWidth, last.y - largeWidth)
                )
              )
     }  else if (selectDir === DirectionType.diagonalUpLeft) {
        highlightStruct.start = new Line(
          new Point2D(first.x + largeWidth, first.y),
          new Point2D(first.x + largeWidth, first.y - largeWidth)
        );
        highlightStruct.end = new Line(
          new Point2D(last.x, last.y),
          new Point2D(last.x , last.y - largeWidth)
        );
        highlightStruct.bottom = [];
        highlightStruct.bottom.push(
          new Line(
            new Point2D(first.x + largeWidth, first.y),
            new Point2D( first.x , first.y)
          ),
          new Line(
            new Point2D(first.x , first.y),
            new Point2D(last.x + (largeWidth * .50), last.y)
           ),
           new Line(
            new Point2D(last.x + (largeWidth * .50), last.y),
            new Point2D(last.x,last.y)
           )
        );
        highlightStruct.top = [];
        highlightStruct.top.push(
          new Line(
            new Point2D(first.x + largeWidth, first.y - largeWidth),
            new Point2D(first.x + largeWidth * .30, first.y - largeWidth)
          ),
          new Line(
            new Point2D(first.x + largeWidth * .30, first.y - largeWidth),
            new Point2D(last.x + largeWidth * .30, last.y - largeWidth)
          ),
          new Line(
            new Point2D(last.x + largeWidth * .30, last.y - largeWidth),
            new Point2D(last.x, last.y - largeWidth)
          )

        );
     } else if (selectDir === DirectionType.diagonalDownLeft) {
        highlightStruct.start = new Line(
                new Point2D(first.x + largeWidth, first.y),
                new Point2D(first.x + largeWidth, first.y - largeWidth)
        );
        highlightStruct.end = new Line(
          new Point2D(last.x, last.y),
          new Point2D(last.x , last.y - largeWidth)
        );
        highlightStruct.bottom = [];
        highlightStruct.bottom.push(
          new Line(
           new Point2D(first.x + largeWidth, first.y),
           new Point2D(first.x + largeWidth * .20, first.y)
          ),
          new Line(
           new Point2D(first.x + largeWidth * .20, first.y),
           new Point2D(last.x + largeWidth * .50 , last.y)
          ),
          new Line(
           new Point2D(last.x + largeWidth * .50, last.y),
           new Point2D(last.x, last.y)
          )
       );
       highlightStruct.top = [];
       highlightStruct.top.push(
         new Line(
           new Point2D(first.x + largeWidth, first.y - largeWidth),
           new Point2D(first.x + largeWidth * .20, first.y - largeWidth)
         ),
         new Line(
           new Point2D(first.x + largeWidth * .20, first.y - largeWidth),
           new Point2D(last.x + largeWidth * .50, last.y - largeWidth)
         ),
         new Line(
           new Point2D(last.x + largeWidth *.50, last.y - largeWidth),
           new Point2D(last.x, last.y - largeWidth)
         )
       );
     }
     return highlightStruct;
  }
  resetSelectionQueue(): void {
    this.currSelectionQueue = null;
   
    /*this.currSelectionQueue = new highlighter(this.buildHighlighter);
    this.currSelectionQueue.points = [];
    this.currSelectionQueue.ids = [];
    this.currSelectionQueue.dir = DirectionType.None;*/
  }
  backToMainScreen(): void {
    this.inLargeMode = false;
    this.resetSelectionQueue();
    this.context.clearRect(0, 0, this.canvasRef.width, this.canvasRef.height);
    this.mergeSelections();
    this.showStandardMode();
    this.renderWords();
    this.subSelections = [];
    
  }
  private showStandardMode() {
    this.loadDataToCanvas();
        
    //this.displaySectionOutline();
  }
  private withInBounds(start: Point2D, end: Point2D, checkWidth: number): boolean {
   // debugger;
    const midX1 = (start.x + checkWidth) / 2;
    const midY1 = (start.y + checkWidth) / 2;
    const midX2 = (end.x + checkWidth) / 2;
    const midY2 = (end.y + checkWidth) / 2;
    const a = midX1 - midX2;
    const b  = midY1 - midY2;
    const c = Math.floor(Math.sqrt( a*a + b*b ));
    return c <= 40;

  }
  private findDir(start: Point2D, end: Point2D): DirectionType {
    // debugger;
    let subDir: DirectionType = DirectionType.None;
            if (start.y === end.y && end.x - start.x > 1) {
              subDir = DirectionType.horizontalRight;
            } else if (start.y === end.y && end.x - start.x < 0) {
              subDir = DirectionType.horizontalLeft
            } else if (start.x === end.x && end.y - start.y < 0) {
              subDir = DirectionType.verticalUp;
            }
            else if (start.x === end.x && end.y - start.y > 1) {
              subDir = DirectionType.verticalDown;
            } else if (end.x - start.x > 1 && end.y - start.y < 0) {
              subDir = DirectionType.diagonalUpRight;
            } else if (end.x - start.x > 1 && end.y - start.y > 0) {
              subDir = DirectionType.diagonalDownRight;
            } else if (end.x - start.x < 0 && end.y - start.y < 0) {
              subDir = DirectionType.diagonalUpLeft;
            } else if (end.x - start.x < 0 && end.y - start.y > 0) {
              subDir = DirectionType.diagonalDownLeft
            }
              return subDir;
  }
  private userSelections(pos: Point2D): void {
    const largeWidth = Math.floor(this.canvasRef.width / this.numOfCols);
    
    if(!this.currSelectionQueue) {
      this.currSelectionQueue = new highlighter(this.buildHighlighter);
      this.currSelectionQueue.points = [];
      this.currSelectionQueue.ids = [];
      this.startTimer();
    }
    
    //console.log('All sub points => ', this.subPuzzlePts, pos, largeWidth);
    this.subPuzzlePts.forEach(pt => {
      ////debugger;
      if(pt.position.x < pos.x && pos.x < pt.position.x + largeWidth && 
        pt.position.y - largeWidth < pos.y && pos.y < pt.position.y) {
          console.log('Check user selection =>', this.currSelectionQueue, pt);
          if(this.currSelectionQueue.points.length === 0) {
            
            this.currSelectionQueue.points.push(new Point2D(pt.position.x, pt.position.y));
            this.currSelectionQueue.ids.push(pt.id);
          } else {
            const currDir = this.findDir(this.currSelectionQueue.points[this.currSelectionQueue.points.length-1],pt.position);
            if( currDir !== DirectionType.None && currDir) {
              // debugger;
              if(this.currSelectionQueue.dir && this.currSelectionQueue.dir === currDir &&
                this.withInBounds(this.currSelectionQueue.points[this.currSelectionQueue.points.length-1], pt.position, largeWidth)) {
                 
                this.currSelectionQueue.points.push(new Point2D(pt.position.x, pt.position.y));
                this.currSelectionQueue.ids.push(pt.id);
              } else if(!this.currSelectionQueue.dir){
                this.currSelectionQueue.dir = currDir;
                this.currSelectionQueue.points.push(new Point2D(pt.position.x, pt.position.y));
                this.currSelectionQueue.ids.push(pt.id);
              } else {
                //thow error and cleanup
                console.log('Error...stop cheating!!');
                this.displayErrModal = true;
              }
            }
          }
        }
    });
  }
  private startTimer(): void {
    if(!this.currSelectionQueue){
      return;
    }
    console.log('Before Timer => ', new Date().toLocaleTimeString());
    const source = timer(6000);
    this.subScriptionTimer = source.subscribe(val => {
      console.log(val);
      console.log('After Timer => ', new Date().toLocaleTimeString());
      // debugger;
      const onlyLetters =  this.currSelectionQueue.ids.map(p => p.letter).join('');
      if(onlyLetters === this.testWords[0].word){
        this.currSelectionQueue.keySet = this.testWords[0].key;
        this.currSelectionQueue.oldPoints = this.testWords[0].points;
        console.log('Word has matched!!', this.currSelectionQueue);
        this.allSelections.push(this.currSelectionQueue);
        this.subSelections.push(this.currSelectionQueue);
      } else {
        console.log('Word did not match!!');
      }
      if(this.subScriptionTimer){
        this.subScriptionTimer.unsubscribe();
      }
      this.resetSelectionQueue();
    });

  }
  private loadCanvasMouseEvents(): void {
    this.canvasRef.onmouseup = (evt) => {
      this.isMouseDown = false;
    }
    this.canvasRef.onmousedown = (evt) => {
      const pt = this.getMousePos(evt);
      this.isMouseDown = true;
      if(this.statusMove && !this.inLargeMode) {
        this.context.clearRect(0, 0, this.canvasRef.width, this.canvasRef.height);
        this.showStandardMode();
        this.renderWords();
        
       
      }
      if (this.statusHighlight && this.inLargeMode) {
        this.context.clearRect(0, 0, this.canvasRef.width, this.canvasRef.height);
        const largeWidth = Math.floor(this.canvasRef.width / this.numOfCols);
        
        this.userSelections(pt);
        this.displayLargeAll();
        

          const selectObj = this.buildHighlighter(this.currSelectionQueue.points,this.currSelectionQueue.dir, largeWidth);
          this.displaySelectionsByUser(selectObj);
          this.displayAllSectionsUser();
          /*if(this.allSelections.length) {
            this.allSelections.forEach( selec => {
              const result = this.buildHighlighter(selec.points, selec.dir, largeWidth);
              this.displaySelectionsByUser(result);
            });
          }
          if(this.subSelections.length) {
            this.subSelections.forEach( selec => {
              const result = this.buildHighlighter(selec.points, selec.dir, largeWidth);
              this.displaySelectionsByUser(result);
            });
          }*/
        
       
      }
      if(this.statusMove && this.inLargeMode) {
        //move large letters
        this.context.clearRect(0, 0, this.canvasRef.width, this.canvasRef.height);
        this.displayLargeAll();
        this.displayAllSectionsUser();
        // this.renderWords();
        /*if(this.allSelections.length) {
          const largeWidth = Math.floor(this.canvasRef.width / this.numOfCols);
          this.allSelections.forEach( selec => {
            const result = this.buildHighlighter(selec.points, selec.dir, largeWidth);
            this.displaySelectionsByUser(result);
          });
        }
        if(this.subSelections.length) {
          const largeWidth = Math.floor(this.canvasRef.width / this.numOfCols);
          this.subSelections.forEach( selec => {
            const result = this.buildHighlighter(selec.points, selec.dir, largeWidth);
            this.displaySelectionsByUser(result);
          });
        }
        */
      }
      if(!this.statusMove && !this.inLargeMode) {
        this.inLargeMode = true;
        this.sectionPicked = this.filterSections(pt);
        console.log('Section found => ', this.sectionPicked);
        this.context.clearRect(0, 0, this.canvasRef.width, this.canvasRef.height);
        this.setUpLargeLettersPos(this.sectionPicked);
        this.displayLargeLetters(this.sectionPicked);
        this.statusMove = true;
        this.statusHighlight = false;
        this.throwToggleStatus();
        this.displayAllSectionsUser();
      }
    
      this.initialDown = new Point2D(pt.x, pt.y);
    }
    this.canvasRef.onmousemove = (evt) => {
      const pt = this.getMousePos(evt);
     
      if(!this.inLargeMode && !this.statusMove) {
        //highlight sections
        this.context.clearRect(0, 0, this.canvasRef.width, this.canvasRef.height);
        const currSection = this.filterSections(pt);
       
        this.loadDataToCanvas();
        if(currSection) {
          const subPixels = <Pixel[]> currSection.subPixels;
          this.displayPartialSection(subPixels);
          
        }
        this.renderWords();
        
      }
      if(this.statusMove && !this.inLargeMode && this.isMouseDown) {
        this.context.clearRect(0, 0, this.canvasRef.width, this.canvasRef.height);
        let deltaX = pt.x - this.initialDown.x;
        let deltaY = pt.y - this.initialDown.y;
        this.initialDown = new Point2D(pt.x, pt.y);
        this.updatePuzzlePosition(deltaX, deltaY);
        this.mergeSelections();
        // this.updateSelectedWords(deltaX, deltaY);
        // console.log('The updatedWords => ', this.allSelections[0].points);
        this.showStandardMode();
        this.renderWords();
      }
      if(this.statusMove && !this.inLargeMode && !this.isMouseDown) {
        this.context.clearRect(0, 0, this.canvasRef.width, this.canvasRef.height);
        this.showStandardMode();
        this.renderWords();
      }
      if(this.inLargeMode && this.statusMove) {
        let deltaX = pt.x - this.initialDown.x;
          let deltaY = pt.y - this.initialDown.y;
        if(this.isMouseDown) { 
          this.context.clearRect(0, 0, this.canvasRef.width, this.canvasRef.height); 
          this.initialDown = new Point2D(pt.x, pt.y);
          this.updateLargeDeltas(deltaX, deltaY);
          this.displayLargeAll();
          this.sectionPicked = null;
          this.updateSelectedLargeDeltas(deltaX, deltaY);
        } else if (this.sectionPicked){
          this.context.clearRect(0, 0, this.canvasRef.width, this.canvasRef.height);
          this.displayLargeLetters(this.sectionPicked)
        }
        this.displayAllSectionsUser();
        /*if(this.allSelections.length) {
         
          const largeWidth = Math.floor(this.canvasRef.width / this.numOfCols);
          this.allSelections.forEach( selec => {
            const result = this.buildHighlighter(selec.points, selec.dir, largeWidth);
            this.displaySelectionsByUser(result);
          });
        }
        if(this.subSelections.length) {
         
          const largeWidth = Math.floor(this.canvasRef.width / this.numOfCols);
          this.subSelections.forEach( selec => {
            const result = this.buildHighlighter(selec.points, selec.dir, largeWidth);
            this.displaySelectionsByUser(result);
          });
        }
        */
        
      }
      if(this.inLargeMode && this.statusHighlight){
        // if(this.isMouseDown) {
          this.context.clearRect(0, 0, this.canvasRef.width, this.canvasRef.height);
          const largeWidth = Math.floor(this.canvasRef.width / this.numOfCols);
          this.displayLargeAll();
          if(this.currSelectionQueue && this.currSelectionQueue.points) {
              const selectObj = this.buildHighlighter(this.currSelectionQueue.points,this.currSelectionQueue.dir, largeWidth);
              this.displaySelectionsByUser(selectObj)
          }
          this.displayAllSectionsUser();
          /*if(this.allSelections.length) {
            this.allSelections.forEach( selec => {
              const result = this.buildHighlighter(selec.points, selec.dir, largeWidth);
              this.displaySelectionsByUser(result);
            });
          }
          // console.log('Showing subsection => ', this.subSelections);
          if(this.subSelections.length) {
            this.subSelections.forEach( selec => {
              const result = this.buildHighlighter(selec.points, selec.dir, largeWidth);
              this.displaySelectionsByUser(result);
              // console.log('Showing subsection => ', result);
            });
          }*/
       // }
        
      }
    }
  }
  private updateLargeDeltas(deltaX: number, deltaY: number) {
    for (const key in this.largeHash) {
      if (this.largeHash.hasOwnProperty(key)){
        this.largeHash[key].translatedPts.forEach(pt => {
          pt.x = pt.x + deltaX;
          pt.y = pt.y + deltaY;
        });
      }
    }
  }
  private updateSelectedLargeDeltas(deltaX: number, deltaY: number): void {
    this.allSelections.forEach( selec => {
     selec.points.forEach(pt => {
       pt.x = pt.x + deltaX;
       pt.y = pt.y + deltaY;
     }) 
    });
  }
  private setUpLargeLettersPos(startingRect: any): void {
    let hashFunc = this.localPuzzles[0].sectionHash[startingRect.key];
    this.largeHash = {};
    let sectionResult = hashFunc(BlockType.center);
   // this.displayLargeLetters(sectionResult);
    this.largeHash[startingRect.key] = {
                                          ...sectionResult
                                      }
    const keyArr = startingRect.key.split('-');
    let row = +keyArr[0];
    let col = +keyArr[1];
    //top
    const topKey = (row-1) + '-' + col;
    if(this.localPuzzles[0].sectionHash[topKey]) {
      hashFunc = this.localPuzzles[0].sectionHash[topKey];
      sectionResult = hashFunc(BlockType.top);
     // this.displayLargeLetters(sectionResult);
      this.largeHash[topKey] = {
                                              ...sectionResult
                                            }
      console.log('Top =>' , topKey);
    }
    //top right
    const topRightKey = (row-1) + '-' + (col+1);
    if(this.localPuzzles[0].sectionHash[topRightKey]) {
      hashFunc = this.localPuzzles[0].sectionHash[topRightKey];
      sectionResult = hashFunc(BlockType.rightTop);
      // this.displayLargeLetters(sectionResult);
      this.largeHash[topRightKey] = {
                                             ...sectionResult
                                            }
       console.log('Top Right => ' , topRightKey);
    }
    //top left
    const topLeftKey = (row-1) + '-' + (col-1);
    if(this.localPuzzles[0].sectionHash[topLeftKey]) {
      hashFunc = this.localPuzzles[0].sectionHash[topLeftKey];
      sectionResult = hashFunc(BlockType.leftTop);
     // this.displayLargeLetters(sectionResult);
      this.largeHash[topLeftKey] = {
                                                 ...sectionResult
                                                }
       console.log('Top Left => ' , topLeftKey);
                                              
    }
    //right
    const rightKey = row + '-' + (col+1);
    if(this.localPuzzles[0].sectionHash[rightKey]) {
      hashFunc = this.localPuzzles[0].sectionHash[rightKey];
      sectionResult = hashFunc(BlockType.right);
     // this.displayLargeLetters(sectionResult);
      this.largeHash[rightKey] = {
                                              ...sectionResult
                                          }
      console.log('Right => ' , rightKey);
    }
    //left
    const leftKey = row + '-' + (col-1);
    if(this.localPuzzles[0].sectionHash[leftKey]) {
      //debugger;
      hashFunc = this.localPuzzles[0].sectionHash[leftKey];
      sectionResult = hashFunc(BlockType.left);
      // this.displayLargeLetters(sectionResult);
      this.largeHash[leftKey] = {
                                             ...sectionResult
                                            }
       console.log('Left => ' , leftKey);
    }
    //bottom
    const bottomKey = (row+1) + '-' + col
    if(this.localPuzzles[0].sectionHash[bottomKey]) {
      hashFunc = this.localPuzzles[0].sectionHash[bottomKey];
      sectionResult = hashFunc(BlockType.bottom);
     //  this.displayLargeLetters(sectionResult);
      this.largeHash[bottomKey] = {
                                               ...sectionResult
                                            }
       console.log('Bottom => ' , bottomKey);
    }
    //right bottom
    const rightBottomKey = (row+1) + '-' + (col+1);
    if(this.localPuzzles[0].sectionHash[rightBottomKey]) {
      hashFunc = this.localPuzzles[0].sectionHash[rightBottomKey];
      sectionResult = hashFunc(BlockType.bottomRight);
     // this.displayLargeLetters(sectionResult);
      this.largeHash[rightBottomKey] = {
                                              ...sectionResult
                                              }
       console.log('Bottom Right => ' , rightBottomKey);
    }
    //left bottom
    const leftBottomKey = (row+1) + '-' + (col-1)
    if(this.localPuzzles[0].sectionHash[leftBottomKey]) {
      hashFunc = this.localPuzzles[0].sectionHash[leftBottomKey];
      sectionResult = hashFunc(BlockType.bottomLeft);
      // this.displayLargeLetters(sectionResult);
      this.largeHash[leftBottomKey] = {
                                                  ...sectionResult
                                                 }
       console.log('Bottom Left => ' , leftBottomKey);
    }
    
  }
  private updatePuzzlePosition(deltaX: number, deltaY: number): void {
    this.allPixles.forEach(pixel => {
      let oldX = pixel.position.x;
      let oldY = pixel.position.y;
      pixel.position = new Point2D(oldX + deltaX, oldY + deltaY);
    })
  }
  private updateSelectedWords(deltaX: number, deltaY: number): void {
    this.allSelections.forEach( selec => {
     selec.points = selec.points.map(pt => {
        return {
          x: pt.x + deltaX,
          y: pt.y + deltaY
        }
      });
      /*selec.points.forEach( pt => {
        const oldX = pt.x;
        const oldY = pt.y;
        pt = new Point2D(oldX + deltaX,  oldY + deltaY);
        // pt.x = oldX + deltaX;
        // pt.y = oldY + deltaY;
      });*/
    });
  }
  private displayLargeAll(): void {
    for (const key in this.largeHash) {
      if (this.largeHash.hasOwnProperty(key)){
        this.displayLargeLetters(this.largeHash[key])
      }
    }
  }
  private displayAllSectionsUser(): void {
    if(this.allSelections.length) {
      const largeWidth = Math.floor(this.canvasRef.width / this.numOfCols);
      for (const key in this.largeHash) {
        if (this.largeHash.hasOwnProperty(key)){
          this.largeHash[key].words.forEach(w => {
            const localWords = this.allSelections.filter( f => f.getKey === w.key);
            localWords.forEach( l => {
              const result = this.buildHighlighter(w.translatedPoints, l.dir, largeWidth);
             this.displaySelectionsByUser(result);
            })
          })
        }
      }
    }
  }
  private displayLargeLetters(section: any): void {
    this.context.beginPath();
    this.context.save();
    section.translatedPts.forEach( (pt,i) => {
      const realPixel = section.subPixels[i] as Pixel;
      let strRgb = `rgba(${realPixel.red},${realPixel.green},${realPixel.blue},1.0)`;
      this.context.font = this.fontBig;
      this.context.fillStyle = strRgb;
      this.context.fillText(realPixel.letter, pt.x, pt.y);
     // console.log('The points => ', pt.x, pt.y);
      this.context.stroke();
    });
    this.context.restore();
  }
  private filterSections(points: Point2D): any {
    let foundSect:any = null;
    for (const key in this.localPuzzles[0].sectionHash) {
      if (this.localPuzzles[0].sectionHash.hasOwnProperty(key)) {
        const hashFunc = this.localPuzzles[0].sectionHash[key];
        const subPuzzleResult = hashFunc(BlockType.center);
        const section = subPuzzleResult.subPixels as Pixel[];
        if(points.x >= section[0].position.x && points.x <= section[section.length-1].position.x && points.y >= section[0].position.y &&
        points.y <= section[section.length-1].position.y) {
          foundSect = subPuzzleResult;
          break;
        }
      }
    }
    return foundSect;
  }
  private getMousePos = (evt) => {
    var rect = this.canvasRef.getBoundingClientRect();

    //return new vector2d(evt.clientX - rect.left,evt.clientY - rect.top,-1,-1);
    return new Point2D(evt.clientX - rect.left, evt.clientY - rect.top);
  }
  private loadCanvasTouchEvents(): void {
    this.canvasRef.ontouchstart = (evt) => {
      const touch = evt.touches[0];
      
      var mouseEvent = new MouseEvent("mousedown", {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.canvasRef.dispatchEvent(mouseEvent);
    }
    this.canvasRef.ontouchmove = (evt) => {
      const touch = evt.touches[0];
      const mouseEvent = new MouseEvent("mousemove", {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
     this.canvasRef.dispatchEvent(mouseEvent);
    }
    this.canvasRef.ontouchend = (evt) => {
      const mouseEvent = new MouseEvent("mouseup", {});
      this.canvasRef.dispatchEvent(mouseEvent);
    }
  }
  private buildAdjacentSections(): void {
    let row = 0;
    let col = 0;
    this.sections.forEach( (section,i) => {
      if(section[0].x === 0 && section[0].y > 0){
        col = 0;
        row++;
      }
      
      //console.log('One section at a time => ', section);
      const filterdSec = this.allPixles.filter( pix => pix.position.x >= section[0].x && pix.position.x <= section[2].x - this.cellWidth && pix.position.y >= section[0].y  && pix.position.y <= section[2].y - this.cellWidth)
      /*if(row === 0) {
        console.log('One section at a time => ', filterdSec);
      }*/
      // this.adjSections[row + '-' + col] = filterdSec;
      const f = (key:string, sec:Pixel[], bagOfWords: any[]) => {
      const newWidth = Math.floor(this.canvasRef.width / this.numOfCols);
      let translateX = 0, translateY = newWidth;
      console.log('New width =>', newWidth);
      return (slot:BlockType) => {
        switch(slot) {
          case BlockType.top: {
            translateY -= this.numOfCols * newWidth;
            break;
          }
          case BlockType.right: {
            translateX += this.numOfCols * newWidth;
            break;
          }
          case BlockType.left: {
            translateX -= this.numOfCols * newWidth;
            break;
          }
          case BlockType.bottom: {
            translateY += this.numOfCols * newWidth;
            break;
          }
          case BlockType.rightTop: {
            translateX += this.numOfCols * newWidth;
            translateY -= this.numOfCols * newWidth;
            break;
          }
          case BlockType.leftTop: {
            translateX -= this.numOfCols * newWidth;
            translateY -= this.numOfCols * newWidth;
            break;
          }
          case BlockType.bottomRight: {
            translateX += this.numOfCols * newWidth;
            translateY += this.numOfCols * newWidth;
            break;
          }
          case BlockType.bottomLeft: { //bottomLeft
            translateY += this.numOfCols * newWidth;
            translateX -= this.numOfCols * newWidth;
            break;
          }
          default: {
            translateY = newWidth;
            translateX = 0;
          }
    
        }
        let firstCell = sec[0];
        const filteredWords = bagOfWords.filter( b => b.key === key);
        filteredWords.forEach(w => {
          w.translatedPoints = [];
          let deltaPos = w.points.map( oldRect => {
            return new Point2D((oldRect.position.x  - firstCell.position.x) / this.cellWidth, (oldRect.position.y - firstCell.position.y) / this.cellWidth);
          });
          deltaPos.forEach( p => {
            w.translatedPts.push(new Point2D((p.x * newWidth + translateX), (p.y * newWidth + translateY)))
          });
        });
       
        let deltaCurrent  = sec.map( oldRect => {
          return new Point2D((oldRect.position.x  - firstCell.position.x) / this.cellWidth, (oldRect.position.y - firstCell.position.y) / this.cellWidth);
        });
        const translatedPts: Point2D[] = [];
        deltaCurrent.forEach( p => {
          translatedPts.push(new Point2D((p.x * newWidth + translateX), (p.y * newWidth + translateY)))
        });
          return {
            key: key,
            translatedPts: translatedPts,
            subPixels: sec,
            words: filteredWords
          }
        }
      }
      this.adjSections[row + '-' + col] = f(row + '-' + col, filterdSec, this.testWords);
      col++;
    });
    this.localPuzzles[0].sectionHash = this.adjSections;
  }
  private mergeSelections(): void {
    this.allSmallSelections = [];
    this.allSelections.forEach(sec => {
      const newObj =  new highlighter(this.buildHighlighter);
      newObj.points = [];
      newObj.ids = [];
      sec.ids.forEach( subId => {
        const foundItem = this.allPixles.find(x => x.id === subId.id)
        newObj.points.push(foundItem.position);
        newObj.ids.push(foundItem);
        newObj.dir = sec.dir;

      });
      this.allSmallSelections.push(newObj);
    });
  }
  private renderWords(): void {
    this.allSmallSelections.forEach( selec => {
      const result = this.buildHighlighter(selec.points, selec.dir, this.cellWidth);
      this.displaySelectionsByUser(result);
    });
  }
  private displayPartialSection(outline: Pixel[]): void {
    this.context.beginPath();
    this.context.save();
    this.context.moveTo(outline[0].position.x, outline[0].position.y - this.cellWidth);
    this.context.lineTo(outline[outline.length-1].position.x + this.cellWidth, outline[0].position.y - this.cellWidth);
    this.context.moveTo(outline[outline.length-1].position.x + this.cellWidth, outline[0].position.y - this.cellWidth);
    this.context.lineTo(outline[outline.length-1].position.x + this.cellWidth, outline[outline.length-1].position.y);
    this.context.moveTo(outline[outline.length-1].position.x + this.cellWidth, outline[outline.length-1].position.y);
    this.context.lineTo(outline[0].position.x,  outline[outline.length-1].position.y );
    this.context.moveTo(outline[0].position.x,  outline[outline.length-1].position.y);
    this.context.lineTo(outline[0].position.x, outline[0].position.y - this.cellWidth);
    
    this.context.stroke();
    this.context.restore();
  }
  private displaySectionOutline(): void {
    this.context.beginPath();
    this.context.save();
    this.sections.forEach( section => {
      this.context.moveTo(section[0].x, section[0].y);
      this.context.lineTo(section[1].x, section[1].y);
      this.context.moveTo(section[1].x, section[1].y);
      this.context.lineTo(section[2].x, section[2].y);
      this.context.moveTo(section[2].x, section[2].y);
      this.context.lineTo(section[3].x, section[3].y);
      this.context.moveTo(section[3].x, section[3].y);
      this.context.lineTo(section[0].x, section[0].y);

    });
    this.context.stroke();
    this.context.restore();
  }
  private buildSections(sections: any[]): Point2D[][] {
    const transformMap = sections.map( (sec:string) => {
      const fourArr = sec.split(':');
      const pointLocals: Point2D[] = [];
      fourArr.forEach( pt => {
        const points = pt.split(',');
        pointLocals.push(new Point2D(+points[0],+points[1]))
      });
      return pointLocals;

    });
    return transformMap;

  }
  private populatePixelArray(rawData: string): void {
    const eachPixelArr = rawData.split(' ');
    let id = 0;
    eachPixelArr.forEach( pixelStr => {
     
      const pixelArr = pixelStr.split(',');
      const newPixel = new Pixel(pixelArr[0], +pixelArr[3], +pixelArr[4], +pixelArr[5], id);
      newPixel.position = new Point2D(+pixelArr[1], +pixelArr[2]);
      this.allPixles.push(newPixel);
      id++;
    });
  }
  private loadDataToCanvas(): void {
    this.context.beginPath();
    this.context.save();
    
    this.allPixles.forEach( pixel => {
          
          let strRgb = `rgba(${pixel.red},${pixel.green},${pixel.blue},1.0)`;
          this.context.font = this.puzzleStyle;
          this.context.fillStyle = strRgb;
          this.context.fillText(pixel.letter, pixel.position.x, pixel.position.y);
          this.context.stroke();
    })
    this.context.restore();
  }
  private loadSubPoints(): void {
    const width = this.canvasRef.width;
    const height = this.canvasRef.height;

    for (const key in this.largeHash) {
      if (this.largeHash.hasOwnProperty(key)){
        this.largeHash[key].translatedPts.forEach((pt, i) => {
          if(pt.x >= 0 && pt.x <= width && pt.y >= 0 && pt.y <= height) {
            const partitionPixel = {
              id:this.largeHash[key].subPixels[i],
              position: pt
            }
            this.subPuzzlePts.push(partitionPixel);
          }
        });
      }
    }
  }
  throwToggleStatus(): void {
    const moveElem = document.getElementById('moveCanvas');
    const highlightElem = document.getElementById('highlightCanvas');
    if(this.statusMove) {
      
      moveElem.classList.add('highlight');
      moveElem.classList.remove('pale');
      highlightElem.classList.add('pale');
      highlightElem.classList.remove('hightlight');
    } else {
     
      highlightElem.classList.add('highlight');
      highlightElem.classList.remove('pale');
      moveElem.classList.remove('highlight');
      moveElem.classList.add('pale');
    }
  }
  toggleStatus(event): void {
    
    event.srcElement.classList.add('highlight');
    event.srcElement.classList.remove('pale')
    if (event.srcElement.id === 'moveCanvas') {
      const highlightElem = document.getElementById('highlightCanvas');
      highlightElem.classList.add('pale');
      highlightElem.classList.remove('highlight')
      this.statusMove = true;
      this.statusHighlight = false;
     
    }
    else {
      const moveElem = document.getElementById('moveCanvas');
      moveElem.classList.add('pale');
      moveElem.classList.remove('highlight');
      this.statusMove = false;
      this.statusHighlight = true;
      if(this.inLargeMode) {
        this.loadSubPoints();
      }
      //console.log(' Highlight =>', this.puzzelSections);
    }
     
  }
  closeOops(): void {
    this.displayErrModal = false;
  }
  ngOnDestroy(): void {
    if(this.puzzleSubscribe) {
      this.puzzleSubscribe.unsubscribe();
    }
    if(this.subScriptionTimer) {
      this.subScriptionTimer.unsubscribe();
    }
  }
}

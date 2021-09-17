import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Subscription, timer } from 'rxjs';
import { Pixel } from '../models/pixel';
import { Location } from '../models/location';
import { Point2D } from '../models/point';
import { Puzzle } from '../models/puzzle';
import { LoaderService } from '../services/loader/loader.service';
import { PuzzleService } from '../services/puzzle.service';
import { Platform } from '@ionic/angular';
import { JitSummaryResolver, ThrowStmt } from '@angular/compiler';
import { Section } from '../models/section';
import { PuzzleImports } from '../models/puzzleImports';
import { DirectionType } from '../models/directions';
import { highlight } from '../models/highlight';
import { Line } from '../models/line';

@Component({
  selector: 'app-puzzle-view-helper',
  templateUrl: './puzzle-view-helper.page.html',
  styleUrls: ['./puzzle-view-helper.page.scss'],
})
export class PuzzleViewHelperPage implements OnInit, AfterViewInit, OnDestroy {

  canvasRef :HTMLCanvasElement;
  puzzleSubscribe:Subscription;
  context:CanvasRenderingContext2D;
  puzzleStyle: string;
  cellWidth: number;
  mod: number;
  initialDown: Point2D;
  allPixles: Pixel[];
  displayLarge: boolean = false;
  isMouseDown: boolean = false;
  statusMove: boolean = true;
  inLargeMode: boolean = false;
  statusHighlight: boolean = false; 
  plainPixels: Pixel[] = [];
  plainLocations: Location[] = [];
  plainSections: any = {};
  puzzleConstants:PuzzleImports;
  sections: any[][] = [];
  hitBlock: Pixel[] = [];
  hitSection: string = '';
  hitCorner: Pixel;
  largeLayout: Location[][] = [];
  currSelectionQueue: Location[] = [];
  filteredLocations: Location[] = [];
  displayErrModal:boolean = false;
  subScriptionTimer: Subscription; 
  searchWords: string[] = [];
  isTimerStarted: boolean = false;
  mainPuzzleLocations: Location[][] = [];

  constructor(private puzzleService: PuzzleService, 
    private loaderSvc: LoaderService,
    private platform: Platform) {

      this.allPixles = [];
      this.initialDown = new Point2D(0,0);
      this.loaderSvc.create('Loading Puzzle...');

     }

  ngOnInit() {
    const currentPlantForms = this.platform.platforms();
        if(currentPlantForms.includes("mobile") || currentPlantForms.includes("iphone")) {
          this.displayLarge = false;
        } else {
          this.displayLarge = true;
        }
        console.log('Platforms => ', this.platform.platforms(), this.displayLarge);
  }

  ngAfterViewInit(): void {
    this.canvasRef = <HTMLCanvasElement>document.getElementById('canvasPuzzle');
    this.context = this.canvasRef.getContext('2d');
    this.puzzleSubscribe = this.puzzleService.loadPuzzles().subscribe( (puzzleData: Puzzle[]) => {
      if(!this.displayLarge) {
        this.puzzleStyle = puzzleData[0].Style;
        this.cellWidth = puzzleData[0].Font + puzzleData[0].Spacing;
        //this.cellWidthTest = this.cellWidth;
      } else {
        this.puzzleStyle = puzzleData[0].StyleLarge;
        this.cellWidth = puzzleData[0].FontLarge + puzzleData[0].SpacingLarge;
        //this.normalizeWidth = puzzleData[0].Font + puzzleData[0].Spacing;
        //this.cellWidthTest = this.cellWidth;
      }
      this.puzzleConstants = new PuzzleImports(this.puzzleStyle, this.cellWidth,0 );
      this.buildAbstractLayer(puzzleData[0].contentSm);
      this.buildSections();
      this.prepNormalView();
      //this.prepSections();
      this.loadDataToCanvas();
      this.drawBoundary();
      this.loadCanvasMouseEvents();
      this.loaderSvc.dismiss();
      this.searchWords = this.convertWordsToArray(puzzleData[0].words)
    });

  }
  private getMousePos = (evt) => {
    var rect = this.canvasRef.getBoundingClientRect();

    //return new vector2d(evt.clientX - rect.left,evt.clientY - rect.top,-1,-1);
    return new Point2D(evt.clientX - rect.left, evt.clientY - rect.top);
  }
  private showStandardMode() {
    this.context.clearRect(0, 0, this.canvasRef.width, this.canvasRef.height);
    this.loadDataToCanvas();
        
    //this.displaySectionOutline();
  }
  private updatePuzzlePosition(deltaX: number, deltaY: number): void {
    this.allPixles.forEach(pixel => {
      let oldX = pixel.position.x;
      let oldY = pixel.position.y;
      pixel.position = new Point2D(oldX + deltaX, oldY + deltaY);
    })
  }
  private loadCanvasMouseEvents(): void {
    this.canvasRef.onmousedown = (evt) => {
      const pt = this.getMousePos(evt);
      this.isMouseDown = true;
      if(this.statusMove && !this.inLargeMode) {
        
        this.showStandardMode();
        this.renderWords();
      
      }
      if(this.statusHighlight && !this.inLargeMode) {
        
        this.inLargeMode = true;
        this.statusMove = true;
        this.statusHighlight = false;
        this.throwToggleStatus();
        this.showSection();
       // this.renderWords();
       this.displayAllSelectionsUser();
      }
      if(this.statusHighlight && this.inLargeMode) {
        this.showSection();
        this.processLetterHighlight(pt);
        
      }
      this.initialDown = new Point2D(pt.x, pt.y);
    };
    this.canvasRef.onmousemove = (evt) => {
      const pt = this.getMousePos(evt);
      if(this.isMouseDown && this.statusMove && !this.inLargeMode) {
        let deltaX = pt.x - this.initialDown.x;
        let deltaY = pt.y - this.initialDown.y;
        this.initialDown = new Point2D(pt.x, pt.y);
        this.updatePuzzlePosition(deltaX, deltaY);
        this.updateSectionPosition(deltaX, deltaY);
        this.showStandardMode();
        this.renderWords();
      }
      if(!this.isMouseDown && this.statusHighlight && !this.inLargeMode) {
        this.showStandardMode();
        this.displaySections(pt);
        this.renderWords();
      }
      if(!this.isMouseDown && this.statusMove && this.inLargeMode) {
        this.showSection();
        this.filterDownLarge();
        this.displayAllSelectionsUser();
      }
      if(this.isMouseDown && this.statusMove && this.inLargeMode) {
        let deltaX = pt.x - this.initialDown.x;
        let deltaY = pt.y - this.initialDown.y;
        this.initialDown = new Point2D(pt.x, pt.y);
        this.updateLargeLetters(deltaX, deltaY);
        this.showSection();
        this.filterDownLarge();
        this.displayAllSelectionsUser();
      }
    };
    this.canvasRef.onmouseup = (evt) => {
      this.isMouseDown = false;
    }
  }
  backToMainScreen(): void {
    this.inLargeMode = false;
    this.statusMove = true;
    this.throwToggleStatus();
    this.showStandardMode();
    this.renderWords();
    
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
  ngOnDestroy(): void {
    if(this.puzzleSubscribe) {
      this.puzzleSubscribe.unsubscribe();
    }
    if(this.subScriptionTimer) {
      this.subScriptionTimer.unsubscribe();
    }
  }
  closeOops(): void {
    this.displayErrModal = false;
  }
  private convertWordsToArray(words: string[]): string[] {
    const newWords = words.map( word => word.split(','))
    const firstWords = newWords.map(word => word[0]);
    firstWords.sort();
    console.log('Incoming words => ', firstWords);
    return firstWords;
  }
  private checkSelectdWord(selectedWord: string): boolean {
    return this.searchWords.some( w => w.toLocaleLowerCase() === selectedWord.toLocaleLowerCase())
  }
  private processLetterHighlight(pt:Point2D): void {
    const numOfCols = 10;
    const newWidth = Math.floor(this.canvasRef.width / numOfCols);
    const letter = this.filteredLocations.find(f => f.point.x < pt.x && pt.x < f.point.x + newWidth && (f.point.y - newWidth) < pt.y && pt.y < f.point.y );
    console.log('Letter Location found => ', letter);
    if(letter) {
      if(!this.isTimerStarted) {
        this.startTimer();
        this.isTimerStarted = true;
      }
      if(this.currSelectionQueue.length < 1) {
        this.currSelectionQueue.push(letter)
      } else {
        const len = this.currSelectionQueue.length;
        const currDir = this.findDir(this.currSelectionQueue[0].point, letter.point);
        if( this.currSelectionQueue.length && currDir !== DirectionType.None && currDir && this.withInBounds(this.currSelectionQueue[len-1].point, letter.point, newWidth)) {
          letter.dir = currDir;
          letter.width = newWidth;
          this.currSelectionQueue[0].dir = currDir;
          this.currSelectionQueue[0].width = newWidth;
          this.currSelectionQueue.push(letter);
          letter.dir = currDir;
          letter.width = newWidth;
          console.log('What is the fucking queue => ', this.currSelectionQueue)
          const justPoints = this.currSelectionQueue.map(m => m.point);
          const selectObj = this.buildHighlighter(justPoints, currDir, newWidth);
          this.displaySelectionsByUser(selectObj);
        } else {
          console.log('Error...stop cheating!!');
          this.displayErrModal = true;
        }
      }
    }
  }
  private getMyLetter(id: any): string {
    const pixel = this.plainPixels.find( p => p.id === id);
    return pixel.letter;
  }
  private startTimer(): void {
    setTimeout(() => {
      let word = '';
      this.currSelectionQueue.forEach( w => {
        const letter = this.getMyLetter(w.id)
        if(letter) {
          word = word + letter;
        }
      });
    
      if(this.checkSelectdWord(word)) {
        this.mainPuzzleLocations.push(this.currSelectionQueue);
        this.currSelectionQueue = [];
        console.log('Right word!!! ', word);
      } else {
        //error message wrong word
        console.log('Wrong word!!! ', word);
        this.currSelectionQueue = [];
      }
      this.isTimerStarted = false;
    },6000);
    
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
   private renderWords(): void {
    this.mainPuzzleLocations.forEach( selec => {
      const newMappings = selec.map( (l:Location) => {
        const updatedLocation =  this.allPixles.find(f => f.id === l.id)
        return {
          point: updatedLocation.position,
          section: l.section,
          id: l.id,
          dir: l.dir,
          width: l.width
        };
      });
      
      const points = newMappings.map( m => m.point)
      const result = this.buildHighlighter(points, newMappings[0].dir, this.puzzleConstants.cellWidth);
      this.displaySelectionsByUser(result);
    });
  }
   private displayAllSelectionsUser(): void {
    if(!this.mainPuzzleLocations.length) {
      return;
    }
    const flatLocations = [].concat.apply([],this.largeLayout);
    
     this.mainPuzzleLocations.forEach(h => {
       const newMappings = h.map( (l:Location) => {
        const updatedLocation = flatLocations.find(f => f.id === l.id)
            return {
              ...updatedLocation,
              dir: l.dir,
              width: l.width
            }
         });
        // console.log('Flat locations => ', this.mainPuzzleLocations);
       const points = newMappings.map( m => m.point)
       const newHighLiight = this.buildHighlighter(points, newMappings[0].dir, newMappings[0].width)
      
      this.displaySelectionsByUser(newHighLiight);  
     });
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
  private buildHighlighter(positions: Point2D[], selectDir:DirectionType, largeWidth: number): highlight {
    
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
  private updateSectionPosition(deltaX: number, deltaY: number): void {
    //console.log('What are the sections => ', this.sections);
    for(let i=0; i < this.sections.length; i++) {
      const section  = this.sections[i];
      section.forEach(s => {
        if( s instanceof Point2D) {
          s.x = s.x + deltaX;
          s.y = s.y + deltaY;
        }
      
      });
    }
  }
  private displaySections(currPos:Point2D): void {
    this.context.beginPath();
    this.context.save();
    //console.log('Current pos => ', currPos);
    //this.sections.forEach( section => {
      for(let i=0; i < this.sections.length; i++) {
        const section  = this.sections[i];
     
       // if(i === 0)
          // console.log(currPos.x > section[0].x , '(' + currPos.x + ',' + section[0].x + ')', currPos.x < section[1].x, '(' + currPos.x + ',' + section[1].x + ')', currPos.y > section[0].y, '(' + currPos.y + ',' + section[0].y + ')', currPos.y < section[1].y, '(' + currPos.y + ',' + section[1].y + ')')

        if(currPos.x > section[0].x && currPos.x < section[1].x && currPos.y > section[0].y && currPos.y < section[3].y) {
          console.log('Got a hit!!')
          this.context.moveTo(section[0].x , section[0].y);
          this.context.lineTo(section[1].x, section[1].y);
          this.context.moveTo(section[1].x , section[1].y);
          this.context.lineTo(section[2].x , section[2].y);
          this.context.moveTo(section[2].x , section[2].y);
          this.context.lineTo(section[3].x , section[3].y);
          this.context.moveTo(section[3].x , section[3].y);
          this.context.lineTo(section[0].x , section[0].y);
          this.hitSection = section[4];
          this.processBlock(section);
        
          break;
        }
      }//end for
    //});
     this.context.stroke();
    this.context.restore();
  }
  private processBlock(sectionBlock: Point2D[]): void {
    const minX = sectionBlock[0].x;
    const maxX = sectionBlock[1].x;
    const minY = sectionBlock[0].y;
    const maxY = sectionBlock[3].y;

    this.hitBlock = this.allPixles.filter( f => f.position.x >= minX && f.position.x <= maxX && f.position.y >= minY && f.position.y <= maxY );
    const justXs = this.hitBlock.map( m => m.position.x);
    const justYs = this.hitBlock.map( m => m.position.y);
    justXs.sort((a, b) => a - b);
    justYs.sort((a, b) => a - b);
   
    let yIter = 0;
    while(yIter < justYs.length) {
      this.hitCorner = this.hitBlock.find(f => f.position.x === justXs[0] && f.position.y === justYs[yIter])
      if(this.hitCorner) {
        console.log(' The left corner => ', this.hitCorner, justXs[0], justYs[yIter]);
        break;
      }
      yIter++;
    }

   
    console.log('Hit block section => ', this.hitBlock);
    this.prepLargeSelection();
    //console.log('Hit Block end => ', this.hitBlock[this.hitBlock.length-1].section);
  }
  private prepSections(): void {
    for (const key in this.plainSections) {
      if (this.plainSections.hasOwnProperty(key)){
        let pointsLs = [];
        const minX  = this.plainSections[key].minX * this.puzzleConstants.cellWidth;
        const minY = this.plainSections[key].minY * this.puzzleConstants.cellWidth - this.puzzleConstants.cellWidth;
        const maxX = this.plainSections[key].maxX * this.puzzleConstants.cellWidth + this.puzzleConstants.cellWidth;
        const maxY = this.plainSections[key].maxY * this.puzzleConstants.cellWidth;
        pointsLs.push(new Point2D(minX, minY));
        pointsLs.push(new Point2D(maxX, minY));
        pointsLs.push(new Point2D(maxX, maxY));
        pointsLs.push(new Point2D(minX, maxY));
        pointsLs.push(key);
        this.sections.push(pointsLs);
      }
    }
  }
  private loadDataToCanvas(): void {
   
    this.context.beginPath();
    this.context.save();
    
    this.allPixles.forEach( pixel => {
          
          let strRgb = `rgba(${pixel.red},${pixel.green},${pixel.blue},1.0)`;
          this.context.font = this.puzzleConstants.puzzleStyle;
          this.context.fillStyle = strRgb;
          this.context.fillText(pixel.letter, pixel.position.x, pixel.position.y);
          this.context.stroke();
    })
    this.context.restore();
  }
  private prepNormalView(): void {
      this.plainLocations.forEach( l => {
        //debugger;
        const pixel = this.plainPixels.find( f => f.id === l.id)
        pixel.position = new Point2D(l.point.x * this.puzzleConstants.cellWidth, l.point.y * this.puzzleConstants.cellWidth);
        this.allPixles.push(pixel);
      }); 
  }
  private processColors(colorsArr: any[]): any[] {
    const len = colorsArr.length - 1;
    const posObjArr:any[] = [];
    for (let i = 0; i < len; i++) {
        if (i + 2 < len) {
            posObjArr.push({
                r: +colorsArr[i],
                g: +colorsArr[i + 1],
                b: +colorsArr[i + 2]
            });
            i += 2;
        }
    }
    return posObjArr;
  }
  private updateLargeLetters(deltaX: number, deltaY: number): void {
    this.largeLayout.forEach((layoutArr:Location[]) => {
      layoutArr.forEach((local:Location) => {
        local.point.x = local.point.x + deltaX;
        local.point.y = local.point.y + deltaY;
      });
    });
  }
  private filterDownLarge(): void {
    this.filteredLocations = [];
    const width = this.canvasRef.width;
    const height = this.canvasRef.height;
    this.largeLayout.forEach((layoutArr:Location[]) => {
      const result = layoutArr.filter( f => f.point.x >= 0 && f.point.x < width && f.point.y > 0 && f.point.y < height);
      this.filteredLocations = [...this.filteredLocations, ...result];
      /*layoutArr.forEach((local:Location) => {

      })*/
    });
  }
  private showSection(): void {
    this.context.clearRect(0, 0, this.canvasRef.width, this.canvasRef.height);
    this.context.beginPath();
    this.context.save();
    const fontBig: string = 'bold 80px Courier';
    this.largeLayout.forEach((layoutArr:Location[]) => {
      layoutArr.forEach((local:Location) => {
        const pixel = this.plainPixels.find( f => f.id === local.id);
        let strRgb = `rgba(${pixel.red},${pixel.green},${pixel.blue},1.0)`;
        this.context.font = fontBig;
        this.context.fillStyle = strRgb;
        this.context.fillText(pixel.letter, local.point.x, local.point.y);
      });
    });
    this.context.stroke();
    this.context.restore();
  }
  private collectTopSection(originalKey: string): any {
    const topBlockArr = originalKey.split('-');
    const topRow = +topBlockArr[0];
    const topCol = +topBlockArr[1];
    const newTopKey = (topRow-1) + '-' + topCol;
    let cornerX, cornerY = 0;
    if(this.plainSections[newTopKey]) {
      const maxX = this.plainSections[newTopKey].maxX;
      const maxY = this.plainSections[newTopKey].maxY;
      //cornerX = this.plainSections[this.hitSection].cornerX - maxX;
      cornerY = this.plainSections[originalKey].cornerY - maxY;
      cornerX = 0;

    } else {
      //cornerX = this.plainSections[originalKey].cornerX;
      cornerX = 0;
      cornerY = this.plainSections[originalKey].cornerY;
    }
    return {
      cornerX: cornerX,
      cornerY: cornerY
    };
  }
  private findMaxMin(key:string): any {
    const justPixels = this.allPixles.filter( f => f.section === key);
    const justXs = justPixels.map( m => m.position.x);
    const justYs = justPixels.map( m => m.position.y);
    const cloneXs = [...justXs];
    const cloneYs = [...justYs];
    justXs.sort((a, b) => a - b);
    justYs.sort((a, b) => a - b);
    cloneXs.sort((a, b) => b - a);
    cloneYs.sort((a, b) => b - a);
    const borders = {
      minX:justXs[0],
      minY: justYs[0],
      maxX: cloneXs[0],
      maxY: cloneYs[0],
      justXs: justXs,
      justYs: justYs
    }
    return borders;
  
  }
  private diagonalMeasure(originalKey: string, direction: DirectionType): any {
    let row = -1;
    let col = -1;
    const keyArr = originalKey.split('-');
    let borders: any = {};
    if(direction === DirectionType.diagonalUpLeft) {
      row = +keyArr[0] - 1;
      col = +keyArr[1] - 1;
    } else if (direction === DirectionType.diagonalUpRight) {
      row = +keyArr[0] - 1;
      col = +keyArr[1] + 1;
    } else if(direction === DirectionType.diagonalDownLeft) {
      row = +keyArr[0] + 1;
      col = +keyArr[1] - 1;
    } else if(direction === DirectionType.diagonalDownRight) {
      row = +keyArr[0] + 1;
      col = +keyArr[1] + 1;
    }
    const newKey = row + '-' + col;
    let hitStarter:Pixel = null;
    let originalStart:Pixel = null;
    let topLeftborders: any = null;
    if(this.plainSections[newKey]) {
      topLeftborders = this.findMaxMin(newKey)
      let yIter = 0;
      while(yIter < topLeftborders.justYs.length) {
        hitStarter = this.allPixles.find( s => s.position.x === topLeftborders.justXs[0] && s.position.y === topLeftborders.justYs[yIter])
        if(hitStarter) {
          break;
        }
        yIter++;
      }
      borders = this.findMaxMin(originalKey);
      yIter = 0;
      while(yIter < borders.justYs.length) {
        originalStart = this.allPixles.find( s => s.position.x === borders.justXs[0] && s.position.y === borders.justYs[yIter])
        if(originalStart) {
          break;
        }
        yIter++;
      }
    }
    /* this.context.fillStyle = "#000000";
      this.context.beginPath();
      this.context.arc(hitStarter.position.x, hitStarter.position.y, 12, 0, 2 * Math.PI);
      this.context.fill();
      //this.context.stroke();*/
    //debugger;
    const radian45 = 45 * (Math.PI/180);
    if(direction === DirectionType.diagonalUpLeft) {
      //borders.diffX = this.plainSections[originalKey].cornerX - borders.minX;
      //borders.diffY = this.plainSections[originalKey].cornerY - borders.minY;
      //var dist = Math.sqrt( Math.pow((x1-x2), 2) + Math.pow((y1-y2), 2) );
      //borders.distance = Math.sqrt(Math.pow(originalStart.position.x - hitStarter.position.x, 2) + Math.pow(originalStart.position.y - hitStarter.position.y, 2)) / this.puzzleConstants.cellWidth;
      borders.distance = Math.sqrt(Math.pow(borders.minX - topLeftborders.minX, 2) + Math.pow(borders.minY - topLeftborders.minY, 2)) / this.puzzleConstants.cellWidth;
      borders.diffX = Math.ceil(Math.cos(radian45) * borders.distance)
      borders.diffY = Math.ceil(Math.sin(radian45) * borders.distance)
      console.log('Northwest square => ',borders.diffX, borders.diffY);
      borders.newDeltas = this.calcDeltas(borders.minX, borders.minY, newKey, direction)

    } else if(direction === DirectionType.diagonalUpRight) {
      borders.distance = Math.sqrt(Math.pow(borders.minX - topLeftborders.minX, 2) + Math.pow(borders.minY - topLeftborders.minY, 2)) / this.puzzleConstants.cellWidth;
      borders.diffX = Math.ceil(Math.cos(radian45) * borders.distance)
      borders.diffY = Math.ceil(Math.sin(radian45) * borders.distance)
      console.log('Northeast square => ',borders.diffX, borders.diffY, borders.maxX, borders.minY);
      borders.newDeltas = this.calcDeltas(borders.maxX, borders.minY, newKey, direction)
    } else if(direction === DirectionType.diagonalDownRight) {
      borders.distance = Math.sqrt(Math.pow(borders.minX - topLeftborders.minX, 2) + Math.pow(borders.minY - topLeftborders.minY, 2)) / this.puzzleConstants.cellWidth;
      borders.diffX = Math.ceil(Math.cos(radian45) * borders.distance)
      borders.diffY = Math.ceil(Math.sin(radian45) * borders.distance)
      console.log('Northeast square => ',borders.diffX, borders.diffY, borders.maxX, borders.minY);
      borders.newDeltas = this.calcDeltas(borders.maxX, borders.maxY, newKey, direction)
    } else if(direction === DirectionType.diagonalDownLeft) {
      borders.distance = Math.sqrt(Math.pow(borders.minX - topLeftborders.minX, 2) + Math.pow(borders.minY - topLeftborders.minY, 2)) / this.puzzleConstants.cellWidth;
      borders.diffX = Math.ceil(Math.cos(radian45) * borders.distance)
      borders.diffY = Math.ceil(Math.sin(radian45) * borders.distance)
      console.log('Northeast square => ',borders.diffX, borders.diffY, borders.maxX, borders.minY);
      borders.newDeltas = this.calcDeltas(borders.minX, borders.maxY, newKey, direction)
    }
    return borders;
  }
  private calcDeltas(posX: number, posY: number, key: string, direction: DirectionType): any[] {
    const deltas:Location[] =  [];
   const pixels = this.allPixles.filter(f => f.section === key);
   pixels.forEach(p => {
     let deltaX = 0;
     let deltaY = 0;
     if(direction === DirectionType.diagonalUpLeft) {
        deltaX = (posX - p.position.x) / this.puzzleConstants.cellWidth;
        deltaY = (posY - p.position.y) / this.puzzleConstants.cellWidth;
     } else if(direction === DirectionType.diagonalUpRight) {
       console.log('delta Calc => ', p.position.x / this.puzzleConstants.cellWidth, posY / this.puzzleConstants.cellWidth);
        deltaX =  p.position.x / this.puzzleConstants.cellWidth - posX / this.puzzleConstants.cellWidth;
        deltaY = p.position.y / this.puzzleConstants.cellWidth - posY / this.puzzleConstants.cellWidth;
     } else if(direction === DirectionType.diagonalDownRight) {
      deltaX =  p.position.x / this.puzzleConstants.cellWidth - posX / this.puzzleConstants.cellWidth;
      deltaY = p.position.y / this.puzzleConstants.cellWidth - posY / this.puzzleConstants.cellWidth;
     } else if(direction === DirectionType.diagonalDownLeft) {
      deltaX =  p.position.x / this.puzzleConstants.cellWidth - posX / this.puzzleConstants.cellWidth;
      deltaY = p.position.y / this.puzzleConstants.cellWidth - posY / this.puzzleConstants.cellWidth;
     }
     deltas.push(new Location(new Point2D(deltaX, deltaY), p.section, p.id))
    
   });
   console.log('the section => ', key, this.plainSections);
   //this.plainSections[key].deltas = [...deltas];
   return deltas;
  }
  private prepLargeSelection(): void {
    this.largeLayout = [];
    let tempLocals:Location[] = [];
    const numOfCols = 10;
    const newWidth = Math.floor(this.canvasRef.width / numOfCols);
    console.log('New Width => ', newWidth);
    /*const secLocations = this.plainLocations.filter( f=> f.section === this.hitSection);
    secLocations.forEach( (local:Location) => {
      const p = new Point2D(local.point.x * newWidth, local.point.y * newWidth + newWidth);
      const l = new Location(p, local.section, local.id);
      tempLocals.push(l);
    });*/
    //check for top block
    let cornerConstraints = this.collectTopSection(this.hitSection);
    this.plainSections[this.hitSection].deltas.forEach((local:Location) => {
      const p = new Point2D( (  cornerConstraints.cornerX + local.point.x ) * newWidth, (cornerConstraints.cornerY + local.point.y) * newWidth + newWidth);
      const l = new Location(p, local.section, local.id);
      tempLocals.push(l);
    });
    const justXs = tempLocals.map( t => t.point.x);
    const justYs = tempLocals.map( t => t.point.y); 
    const cloneXs = [...justXs];
    const cloneYs = [...justYs];
    justXs.sort((a, b) => a - b);
    justYs.sort((a, b) => a - b);
    cloneXs.sort((a, b) => b - a);
    cloneYs.sort((a, b) => b - a);
    this.largeLayout.push(tempLocals);
    const sectionArr = this.hitSection.split('-');
    const row = +sectionArr[0];
    const col = +sectionArr[1];
    console.log('The Max X => ', cloneXs[0]);

    //lets check to the right
    let rightCol =  col + 1;
    let newSectionRight = row + '-' + rightCol;
    //const rightSection = this.plainSections.find( f => f.section === newSectionRight)
    if(this.plainSections[newSectionRight]) {
      tempLocals = [];
      cornerConstraints = this.collectTopSection(newSectionRight);
      const slideRight = cloneXs[0] + newWidth;
      this.plainSections[newSectionRight].deltas.forEach((local:Location) => {
        //const p = new Point2D((cornerConstraints.cornerX + local.point.x) * newWidth , (cornerConstraints.cornerY + local.point.y) * newWidth + newWidth);
        const p = new Point2D(local.point.x * newWidth + slideRight, (cornerConstraints.cornerY + local.point.y) * newWidth + newWidth);
        const l = new Location(p, newSectionRight, local.id);
       tempLocals.push(l);
      });
      this.largeLayout.push(tempLocals);
    }
    console.log('Showing prep large => ', this.largeLayout);
    
    //lets check to the left
    let leftCol = col - 1;
    let leftXs = []
    let newSectionLeft = row + '-' + leftCol;
    //const leftSection = this.plainLocations.find( f => f.section === newSectionLeft);
    if(this.plainSections[newSectionLeft]) {
      tempLocals = [];
      cornerConstraints = this.collectTopSection(newSectionLeft);
      // const leftLocationLs = this.plainLocations.filter( f => f.section === newSectionLeft);
      this.plainSections[newSectionLeft].deltas.forEach((local:Location) => {
        const p = new Point2D(local.point.x * newWidth,  (cornerConstraints.cornerY + local.point.y) * newWidth + newWidth);
        const l = new Location(p, local.section, local.id);
        tempLocals.push(l);
      });
    
      leftXs = tempLocals.map( m => m.point.x);
      leftXs.sort((a, b) => b - a);
      //const slideLeft = leftXs[0] - newWidth;
      tempLocals.forEach((local:Location) => {
        local.point.x = local.point.x - leftXs[0] - newWidth;
      });
      this.largeLayout.push(tempLocals);
    }//end if
    
    //lets check bottom
    let bottomRow = row + 1;
    let sectionBottom = bottomRow + '-' + col;
    //const bottomLocation = this.plainLocations.find( f => f.section === sectionBottom);
    if(this.plainSections[sectionBottom]) {
      tempLocals = [];
      cornerConstraints = this.collectTopSection(sectionBottom);
      //const bottomLocationLs = this.plainLocations.filter(f => f.section === sectionBottom);
      this.plainSections[sectionBottom].deltas.forEach((local:Location) => {
        const p = new Point2D((cornerConstraints.cornerX + local.point.x) * newWidth, ((cornerConstraints.cornerY + local.point.y) * newWidth) + cloneYs[0]);
        const l = new Location(p, local.section, local.id);
        tempLocals.push(l);
      });
      this.largeLayout.push(tempLocals);
    }
    
    //lets check top
    let topRow = row - 1;
    let leftYs = [];
    let sectionTop = topRow + '-' + col;
    //const topLocation = this.plainLocations.find( f => f.section === sectionTop);
    if(this.plainSections[sectionTop]){
      tempLocals = [];
      cornerConstraints = this.collectTopSection(sectionTop);
      //const topLocationsLs = this.plainLocations.filter( f => f.section === sectionTop);
      this.plainSections[sectionTop].deltas.forEach((local:Location) => {
        const p = new Point2D((cornerConstraints.cornerX + local.point.x) * newWidth, (cornerConstraints.cornerY + local.point.y) * newWidth + newWidth);
        const l = new Location(p, local.section, local.id);
        tempLocals.push(l);
      });
      leftYs = tempLocals.map( m => m.point.y);
      leftYs.sort((a, b) => b - a);
      tempLocals.forEach((local:Location) => {
        local.point.y = local.point.y - leftYs[0] + newWidth;
      });
      this.largeLayout.push(tempLocals);
    }
    //lets check top right
    topRow = row - 1;
    rightCol =  col + 1;
    let sectionTopRight = topRow + '-' + rightCol;
    //const topRightLocations = this.plainLocations.find( f => f.section === sectionTopRight);
    if(this.plainSections[sectionTopRight]) {
      tempLocals = [];
      //cornerConstraints = this.collectTopSection(sectionTopRight);
      //const slideRight = cloneXs[0] + newWidth;
      //const topRightLocationsLs = this.plainLocations.filter( f => f.section === sectionTopRight);
      const rightDiag = this.diagonalMeasure(this.hitSection, DirectionType.diagonalUpRight);
     
      rightDiag.newDeltas.forEach((local:Location) => {
        //const p = new Point2D((cornerConstraints.cornerX + local.point.x) * newWidth + slideRight, ((cornerConstraints.cornerY + local.point.y) * newWidth + newWidth) - leftYs[0] + newWidth);
        const p = new Point2D( cloneXs[0] + (local.point.x * newWidth) , justYs[0] + (local.point.y * newWidth));
        const l = new Location(p, local.section, local.id);
        tempLocals.push(l);
      });
      console.log('the northeast deltas => ', tempLocals);
      this.largeLayout.push(tempLocals);
    }
    //lets check bottom right
    bottomRow = row + 1;
    rightCol =  col + 1;
    let sectionBottomRight = bottomRow + '-' + rightCol;
    //const bottomRightLocations = this.plainLocations.find( f => f.section === sectionBottomRight);
    if(this.plainSections[sectionBottomRight]) {
      tempLocals = [];
      //cornerConstraints = this.collectTopSection(sectionBottom);
      const rightDownDiag = this.diagonalMeasure(this.hitSection, DirectionType.diagonalDownRight);
      const slideRight = cloneXs[0] + newWidth;
      //const bottomRightLocationsLs = this.plainLocations.filter( f => f.section === sectionBottomRight);
      rightDownDiag.newDeltas.forEach((local:Location) => { 
        //const p = new Point2D((cornerConstraints.cornerX + local.point.x) * newWidth + slideRight, ((cornerConstraints.cornerX + local.point.y) * newWidth + newWidth) + cloneYs[0]);
        const p = new Point2D( cloneXs[0] + (local.point.x * newWidth) , cloneYs[0] + (local.point.y * newWidth));
        const l = new Location(p, local.section, local.id);
        tempLocals.push(l);
      });
      this.largeLayout.push(tempLocals);
    }
    
    //lets check top left
    leftCol = col - 1;
    topRow = row - 1;
    let sectionTopLeft = topRow + '-' + leftCol;
    //const topLeftLocations = this.plainLocations.find( f => f.section === sectionTopLeft);
    if(this.plainSections[sectionTopLeft]) {
      tempLocals = [];
      //cornerConstraints = this.collectTopSection(sectionTopLeft);
      const leftDiag = this.diagonalMeasure(this.hitSection, DirectionType.diagonalUpLeft);
      //const startX = justXs[0] - (leftDiag.diffX * newWidth);
      //const startY = justYs[0] - (leftDiag.diffY * newWidth);
      //const topLeftLocationsLs = this.plainLocations.filter( f => f.section === sectionTopLeft);
      leftDiag.newDeltas.forEach((local:Location) => {
        const p = new Point2D( justXs[0] - (local.point.x * newWidth) , justYs[0] - (local.point.y * newWidth));
        const l = new Location(p, local.section, local.id);
        tempLocals.push(l);
      });
     
     /* tempLocals.forEach((local:Location) => {
        local.point.x = local.point.x - (leftDiag.diffX * newWidth);
        local.point.y = local.point.y - (leftDiag.diffY * newWidth)
      
      });*/
    
      this.largeLayout.push(tempLocals);
    }
    //lets check bottom left
    leftCol = col - 1;
    bottomRow = row + 1;
    let sectionBottomLeft = bottomRow + '-' + leftCol;
    //const sectionBottomLeftLocations = this.plainLocations.find( f => f.section === sectionBottomLeft);
    if(this.plainSections[sectionBottomLeft]) {
      tempLocals = [];
      //cornerConstraints = this.collectTopSection(sectionBottomLeft);
      //const bottomLeftLocationLs = this.plainLocations.filter( f =>  f.section === sectionBottomLeft);
      const leftDownDiag = this.diagonalMeasure(this.hitSection, DirectionType.diagonalDownLeft);
      leftDownDiag.newDeltas.forEach((local:Location) => {
        //const p = new Point2D((cornerConstraints.cornerX + local.point.x) * newWidth , ((cornerConstraints.cornerY + local.point.y) * newWidth) + cloneYs[0]);
        const p = new Point2D( justXs[0] + (local.point.x * newWidth) , cloneYs[0] + (local.point.y * newWidth));
        const l = new Location(p, local.section, local.id);
        tempLocals.push(l);
      });
      /*tempLocals.forEach((local:Location) => {
        local.point.x = local.point.x - leftXs[0] + newWidth + newWidth + newWidth;
      });*/
      this.largeLayout.push(tempLocals);
    }
    

  }
  private drawBoundary(): void {
    let re = /[0-9]+/;
    let sectionsClean = this.plainLocations.filter(m =>  re.test(m.section));
    let sections = sectionsClean.map( m => m.section);

    let unique = (a:string[]) => [...new Set(a)];
    sections = unique(sections);
    //this.context.beginPath();
    //this.context.save();

    sections.forEach(section => {
      let pointsLs = [];
      const sectionLocal = this.plainLocations.filter( f => f.section === section);
      const points = sectionLocal.map(m => m.point);
      const onlyXs = points.map( m => m.x);
      const onlyYs = points.map( m => m.y);
      const cloneXs = [...onlyXs];
      const cloneYs = [...onlyYs];
      onlyXs.sort((a, b) => a - b);
      onlyYs.sort((a, b) => a - b);
      cloneXs.sort((a, b) => b - a);
      cloneYs.sort((a, b) => b - a);
      const minX = onlyXs[0] * this.puzzleConstants.cellWidth;
      const minY = onlyYs[0] * this.puzzleConstants.cellWidth - this.puzzleConstants.cellWidth;
      const maxX = cloneXs[0] * this.puzzleConstants.cellWidth  + this.puzzleConstants.cellWidth;
      const maxY = cloneYs[0] * this.puzzleConstants.cellWidth;
      /*this.context.moveTo(onlyXs[0],onlyYs[0]);
      this.context.lineTo(cloneXs[0], cloneYs[0]);
      this.context.moveTo(onlyXs[0] * this.puzzleConstants.cellWidth, onlyYs[0] * this.puzzleConstants.cellWidth);
      this.context.lineTo(cloneXs[0] * this.puzzleConstants.cellWidth, cloneYs[0] * this.puzzleConstants.cellWidth);*/
      pointsLs.push(new Point2D(minX, minY));
      pointsLs.push(new Point2D(maxX, minY));
      pointsLs.push(new Point2D(maxX, maxY));
      pointsLs.push(new Point2D(minX, maxY));
      pointsLs.push(section);
      this.sections.push(pointsLs);
    });
   
    //this.context.restore();
    //this.context.stroke();
  }
  private buildSections(): void {
    let re = /[0-9]+/;
    let sectionsClean = this.plainLocations.filter(m =>  re.test(m.section));
    let sections = sectionsClean.map( m => m.section);

    let unique = (a:string[]) => [...new Set(a)];
    sections = unique(sections);
    //build hashtable
    //debugger;
    sections.forEach(section => {
      //debugger;
      const secLocations = this.plainLocations.filter( f => f.section === section);
      const onlyXs = secLocations.map( m => m.point.x);
      const onlyYs = secLocations.map( m => m.point.y);
      const cloneXs = [...onlyXs];
      const cloneYs = [...onlyYs];
      onlyXs.sort((a, b) => a - b);
      onlyYs.sort((a, b) => a - b);
      cloneXs.sort((a, b) => b - a);
      cloneYs.sort((a, b) => b - a);
      let yIter = 0;
      let hitStarter:Location = null;
      while(yIter < onlyYs.length) {
        hitStarter = secLocations.find( s => s.point.x === onlyXs[0] && s.point.y === onlyYs[yIter])
        if(hitStarter) {
          break;
        }
        yIter++;
      } 
     
      this.plainSections[section] = new Section(onlyXs[0],cloneXs[0],onlyXs[0],cloneYs[0], section);
      this.plainSections[section].cornerX = hitStarter.point.x;
      this.plainSections[section].cornerY = hitStarter.point.y;
      const deltas:Location[] =  [];
      secLocations.forEach( p => {
        const deltaX =   (p.point.x - hitStarter.point.x);
        const deltaY =   (p.point.y - hitStarter.point.y);
        //deltas.push(new Point2D(deltaX, deltaY));
        deltas.push(new Location(new Point2D(deltaX, deltaY), p.section, p.id))
      });
      this.plainSections[section].deltas = [...deltas];
    });
    console.log('Show sections => ', this.plainSections);
  }
  private processLocations(positionsArr: any[]): Location[] {
    const len = positionsArr.length - 1;
    const tempLocals:Location[] = []
    for (let i = 0; i < len; i++) {
      if (i + 1 < len) {
        const p = new Point2D(+positionsArr[i], +positionsArr[i + 1]);
        const l = new Location(p, positionsArr[i + 2]);
        //this.plainLocations.push(l);
        tempLocals.push(l);
        i+=2;
      }
    }//end for loop
    return tempLocals;
  }
  private buildAbstractLayer(rawData: string): void {
    const rawPixelArr = rawData.split(' ');
    //debugger;
    rawPixelArr.forEach( (pixelStr,iter) => {
      const pixelArr = pixelStr.split(':');
      if(pixelArr[1]) {
            const positionsArr = pixelArr[1].split(',');
            //debugger;
            const letter = pixelArr[0];
            const colorsArr = pixelArr[2].split(',');
            const newColors = this.processColors(colorsArr);
            const locals = this.processLocations(positionsArr);
           newColors.forEach((p,i) => {
             const indx = this.plainPixels.length ? i + this.plainPixels.length : i;
            const color = newColors[i];
            //console.log('Here are the colors => ', color);
            if(color) {
              const newId = this.plainPixels.length + '-' + i.toString();
              const newPixel = new Pixel(letter, color.r, color.g, color.b, newId);
              //debugger;
              if(locals[i]) {
                locals[i].id = newId;
                newPixel.section = locals[i].section;
                this.plainPixels.push(newPixel);
                const cloneLocal = {
                    ...locals[i]
                };
                this.plainLocations.push(cloneLocal);
              }
             
              //const lastEntry = this.plainLocations.length - 1;
              //this.plainLocations[indx].id = indx.toString();
            }
          
          });
      }
      

    });
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
     
      //console.log(' Highlight =>', this.puzzelSections);
    }
     
  }
  guid(): string {
    /* const chars = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"];
     let str = "";
     for(var i=0; i<36; i++) {
       str = str + ((i == 8 || i == 13 || i == 18 || i == 23) ? "-" : chars[Math.floor(Math.random()*chars.length)]);
     };
     return str;*/
     const ho = (n, p) => n.toString(16).padStart(p, 0); /// Return the hexadecimal text representation of number `n`, padded with zeroes to be of length `p`
     const view = new DataView(new ArrayBuffer(16)); /// Create a view backed by a 16-byte buffer
     crypto.getRandomValues(new Uint8Array(view.buffer)); /// Fill the buffer with random data
     view.setUint8(6, (view.getUint8(6) & 0xf) | 0x40); /// Patch the 6th byte to reflect a version 4 UUID
     view.setUint8(8, (view.getUint8(8) & 0x3f) | 0x80); /// Patch the 8th byte to reflect a variant 1 UUID (version 4 UUIDs are)
     return `${ho(view.getUint32(0), 8)}-${ho(view.getUint16(4), 4)}-${ho(view.getUint16(6), 4)}-${ho(view.getUint16(8), 4)}-${ho(view.getUint32(10), 8)}${ho(view.getUint16(14), 4)}`;
   }

}

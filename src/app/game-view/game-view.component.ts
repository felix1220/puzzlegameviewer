import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { BlockType } from '../models/blockTypes';
import { Pixel } from '../models/pixel';
import { Point2D } from '../models/point';
import { Puzzle } from '../models/puzzle';
import { PuzzleService } from '../services/puzzle.service';
import { DirectionType } from '../models/directions';
import { highlight } from '../models/highlight';
import { Line } from '../models/line';

@Component({
  selector: 'app-game-view',
  templateUrl: './game-view.component.html',
  styleUrls: ['./game-view.component.scss']
})
export class GameViewPage implements OnInit {

  canvasRef :HTMLCanvasElement;
  puzzleSubscribe:Subscription;
  context:CanvasRenderingContext2D;
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

  constructor(private puzzleService: PuzzleService) { 
    this.allPixles = [];
    this.initialDown = new Point2D(0,0);
  }

  ngOnInit() {
    this.canvasRef = <HTMLCanvasElement>document.getElementById('canvasPuzzle');
    this.context = this.canvasRef.getContext('2d');
    
    this.loadCanvasMouseEvents();
    
     this.puzzleSubscribe = this.puzzleService.loadPuzzles().subscribe( (puzzleData: Puzzle[]) => {
     
        this.localPuzzles = puzzleData;
        this.puzzleStyle = puzzleData[0].Style;
        this.cellWidth = puzzleData[0].Font + puzzleData[0].Spacing;
        this.mod = puzzleData[0].modulus;
        this.populatePixelArray(puzzleData[0].content);
        this.sections = this.buildSections(puzzleData[0].sections);
        this.buildAdjacentSections();
        this.showStandardMode();
        
        // console.log('content bytes =>', this.localPuzzles);
    });
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
                new Point2D(first.x + largeWidth *.20, first.y - largeWidth)
              ),
              new Line(
                new Point2D(first.x + largeWidth * .20, first.y - largeWidth),
                new Point2D(last.x + largeWidth * .20, last.y - largeWidth)
              ),
              new Line(
                new Point2D(last.x, last.y - largeWidth),
                new Point2D(last.x + largeWidth, last.y - largeWidth)
              )
            );
            highlightStruct.bottom = [];
            highlightStruct.bottom.push(
              new Line(
                new Point2D(first.x, first.y),
                new Point2D(first.x + largeWidth * .20, first.y)
              ),
              new Line(
                new Point2D(first.x + largeWidth * .20, first.y),
                new Point2D(last.x, last.y)
              ),
              new Line(
                new Point2D(last.x, last.y),
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
            new Point2D( first.x + largeWidth * .20, first.y)
          ),
          new Line(
            new Point2D(first.x + largeWidth * .20, first.y),
            new Point2D(last.x + largeWidth, last.y)
           ),
           new Line(
            new Point2D(last.x + largeWidth, last.y),
            new Point2D(last.x,last.y)
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
            new Point2D(last.x + largeWidth, last.y - largeWidth)
          ),
          new Line(
            new Point2D(last.x + largeWidth, last.y - largeWidth),
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
           new Point2D(last.x + largeWidth * .50 , this.currentSelectedQueue[this.currentSelectedQueue.length-1].position.y)
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
  backToMainScreen(): void {
    this.inLargeMode = false;
    this.context.clearRect(0, 0, this.canvasRef.width, this.canvasRef.height);
    this.showStandardMode();
  }
  private showStandardMode() {
    this.loadDataToCanvas();
        
    //this.displaySectionOutline();
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
        
       
      }
      if(this.statusMove && this.inLargeMode) {
        //move large letters
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
        
      }
      if(this.statusMove && !this.inLargeMode && this.isMouseDown) {
        this.context.clearRect(0, 0, this.canvasRef.width, this.canvasRef.height);
        let deltaX = pt.x - this.initialDown.x;
        let deltaY = pt.y - this.initialDown.y;
        this.initialDown = new Point2D(pt.x, pt.y);
        this.updatePuzzlePosition(deltaX, deltaY);
        this.showStandardMode();
      }
      if(this.statusMove && !this.inLargeMode && !this.isMouseDown) {
        this.context.clearRect(0, 0, this.canvasRef.width, this.canvasRef.height);
        this.showStandardMode();
      }
      if(this.inLargeMode && this.statusMove) {
        if(this.isMouseDown) { 
          this.context.clearRect(0, 0, this.canvasRef.width, this.canvasRef.height);
          let deltaX = pt.x - this.initialDown.x;
          let deltaY = pt.y - this.initialDown.y;
          this.initialDown = new Point2D(pt.x, pt.y);
          this.updateLargeDeltas(deltaX, deltaY);
          this.displayLargeAll();
          this.sectionPicked = null;
        } else if (this.sectionPicked){
          this.context.clearRect(0, 0, this.canvasRef.width, this.canvasRef.height);
          this.displayLargeLetters(this.sectionPicked)
        }
        
      }
      if(this.inLargeMode && this.statusHighlight){

      }
    }
  }
  private updateLargeDeltas(deltaX: number, deltaY: number) {
    for (const key in this.largeHash) {
      if (this.largeHash.hasOwnProperty(key)){
        this.largeHash[key].translatedPts.forEach(pt => {
          pt.x = pt.x + deltaX;
          pt.y = pt.y + deltaY
        });
      }
    }
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
  private displayLargeAll(): void {
    for (const key in this.largeHash) {
      if (this.largeHash.hasOwnProperty(key)){
        this.displayLargeLetters(this.largeHash[key])
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
      const filterdSec = this.allPixles.filter( pix => pix.position.x >= section[0].x && pix.position.x <= section[2].x - this.cellWidth && pix.position.y >= section[0].y && pix.position.y <= section[2].y - this.cellWidth)
      // this.adjSections[row + '-' + col] = filterdSec;
      const f = (key:string, sec:Pixel[]) => {
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
            subPixels: sec
          }
        }
      }
      this.adjSections[row + '-' + col] = f(row + '-' + col, filterdSec);
      col++;
    });
    this.localPuzzles[0].sectionHash = this.adjSections;
  }
  private displayPartialSection(outline: Pixel[]): void {
    this.context.beginPath();
    this.context.save();
    this.context.moveTo(outline[0].position.x, outline[0].position.y - this.cellWidth);
    this.context.lineTo(outline[outline.length-1].position.x + this.cellWidth, outline[0].position.y - this.cellWidth);
    this.context.moveTo(outline[outline.length-1].position.x + this.cellWidth, outline[0].position.y - this.cellWidth);
    this.context.lineTo(outline[outline.length-1].position.x + this.cellWidth, outline[outline.length-1].position.y - this.cellWidth);
    this.context.moveTo(outline[outline.length-1].position.x + this.cellWidth, outline[outline.length-1].position.y - this.cellWidth);
    this.context.lineTo(outline[0].position.x,  outline[outline.length-1].position.y - this.cellWidth );
    this.context.moveTo(outline[0].position.x,  outline[outline.length-1].position.y - this.cellWidth);
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
      //console.log(' Highlight =>', this.puzzelSections);
    }
     
  }
  ngOnDestroy(): void {
    if(this.puzzleSubscribe) {
      this.puzzleSubscribe.unsubscribe();
    }
  }

}
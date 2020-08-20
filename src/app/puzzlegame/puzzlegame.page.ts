import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Point2D } from '../models/point';
import { Pixel } from '../models/pixel';
import { PuzzleService } from '../services/puzzle.service';
import { first } from 'rxjs/operators';
import { ThrowStmt } from '@angular/compiler';
import { Repaint } from '../models/repaint';
import { BlockType } from '../models/blockTypes';


@Component({
  selector: 'app-puzzlegame',
  templateUrl: './puzzlegame.page.html',
  styleUrls: ['./puzzlegame.page.scss'],
})
export class PuzzlegamePage implements OnInit {

  canvasRef :HTMLCanvasElement;
  puzzleSubscribe:Subscription;
  context:CanvasRenderingContext2D;
  statusMove: boolean = true;
  statusHightlight: boolean = false;
  initialDown: Point2D;
  leftUpperLimit: Point2D;
  isMouseDown: boolean = false;
  allPixles: Pixel[];
  puzzleStyle: string = '';
  fourCorners: any;
  isMoveVialation: boolean = false;
  cellWidth = 0;
  mod = 0;
  numOfCols = 10;
  puzzelSections: { [key: string]: Pixel[] }
  repaintLargeLetters: Repaint;
  transformedLetters: Repaint;
  inLargeMode:boolean = false;

  constructor(private puzzleService: PuzzleService) { 
    this.allPixles= new Array<Pixel>();
    this.initialDown = new Point2D(0,0);
    this.leftUpperLimit = new Point2D(0,0);
    this.puzzelSections = {};
  }

  ngOnInit() {
    this.canvasRef = <HTMLCanvasElement>document.getElementById('canvas');
    this.context = this.canvasRef.getContext('2d');
    this.puzzleSubscribe = this.puzzleService.loadPuzzles().subscribe( puzzleData => {
      // console.log('content bytes =>', puzzleData);
      this.puzzleStyle = puzzleData[0].Style;
      this.cellWidth = puzzleData[0].Font + puzzleData[0].Spacing;
      this.mod = puzzleData[0].modulus;
      this.populatePixelArray(puzzleData[0].content);
      this.loadDataToCanvas();
      this.fourCorners = this.edgeCases();
     
      this.setUpMoveLimit();
      this.buildSections();
    });
    this.loadCanvasEvents();
  }
  private edgeCases(): any {
    const firstRect = this.allPixles[0];
    const lastRect = this.allPixles[this.allPixles.length - 1];
    const topRight = this.allPixles.find( x => x.position.x === lastRect.position.x && x.position.y === firstRect.position.y);
    const bottomLeft = this.allPixles.find(x => x.position.x === firstRect.position.x && x.position.y === lastRect.position.y);
    // console.log('Top Right =>', topRight);
    // console.log('Bottom Right =>', bottomLeft);
    return {
      topLeft: firstRect,
      topRight: topRight,
      bottomLeft: bottomLeft,
      bottomRight: lastRect
    }
  }
  private buildSections(): void {
    
    let numCols = this.allPixles.filter( x => x.position.x === this.allPixles[0].position.x).length;
    let numRows = this.allPixles.filter( x => x.position.y === this.allPixles[0].position.y).length;
    let holdSections = new Array<Pixel>();
    const howManySectionsAcross = Math.ceil(numCols / this.numOfCols);
    const howManySectionsDown = Math.ceil(numRows / this.numOfCols);
    let startX = 0;
    let startY = 0;
    let copyStartX = startX;
    let copyStartY = startY;
    let w=0,h=0;
    while( h < howManySectionsDown) {
      w = 0;
      while( w < howManySectionsAcross) {
        let i = 0;
        while ( i < this.numOfCols) {
          let p = 0;
          while ( p < this.numOfCols) {
            if (!this.allPixles[startX]) {
              break;
            }
            holdSections.push(this.allPixles[startX]);
            p++;
            startX++;
          }
          startX = copyStartX + (this.mod + 1 );
          copyStartX = startX;  
          i++;
        }
       // debugger;
       if(!holdSections[0]) {
         break;
       }
       const topRect = holdSections[0].id;
       const leftBottomRect = holdSections[0 + this.numOfCols - 1].id;
       const topRightRect = holdSections[holdSections.length - 1 - (this.numOfCols - 1)].id;
       const rightBottomRect = holdSections[holdSections.length - 1].id
       this.puzzelSections[topRect + ',' + topRightRect + ',' + rightBottomRect + ',' + leftBottomRect +
                           ',' + h + ',' + w] = holdSections;
       holdSections = [];
       
       // startX = topRightRect + (this.mod + 1 );
       copyStartX = startX;  
       w++;
      }
      startY = copyStartY + this.numOfCols;
      startX = startY;
      copyStartY = startY;
      copyStartX = startX;
      h++;
    }


  }
  private setUpMoveLimit(): void  {
    const percLimit = .05;
    const chunkWidth = Math.floor(this.canvasRef.width * percLimit);
    const chunkHeight = Math.floor(this.canvasRef.height * percLimit);
    const rightPosX = this.canvasRef.width - chunkWidth;
    const rightPosY =  chunkHeight;
    const topRightRect = new Pixel();
    topRightRect.position = new Point2D(rightPosX, rightPosY);
    const topLeftRect = new Pixel();
    topLeftRect.position = new Point2D(0 + chunkWidth, 0 + chunkWidth);
    const bottomRightRect = new Pixel();
    bottomRightRect.position = new Point2D(this.canvasRef.width - chunkWidth, this.canvasRef.height - chunkHeight)
    const bottomLeftRect = new Pixel();
    bottomLeftRect.position = new Point2D(0 + chunkWidth, this.canvasRef.height - chunkHeight);
    
    this.fourCorners = {
      ...this.fourCorners,
      topRightLimit: topRightRect,
      bottomRightLimit: bottomRightRect,
      topLeftLimit: topLeftRect,
      bottomLeftLimit: bottomLeftRect
    }
    // console.log('the four corners =>', this.fourCorners);

    
  }
  private checkIfCanMove(currPt: Point2D): void {
    const deltaX = currPt.x - this.leftUpperLimit.x;
    const deltaY = currPt.y - this.leftUpperLimit.y;
    this.isMoveVialation = currPt.x > this.fourCorners.topLeftLimit.position.x &&
                           currPt.y > this.fourCorners.topLeftLimit.position.y
                           && deltaX < 0 && deltaY < 0;

    this.leftUpperLimit = new Point2D(currPt.x, currPt.y);
    console.log(deltaX, deltaY, this.leftUpperLimit);
   // console.log(currPt, this.fourCorners.topLeftLimit, this.isMoveVialation);
    /*const topLeftRect = this.allPixles.find( x => x.id === this.fourCorners.topLeft.id);
    const topRightRect = this.allPixles.find(x => x.id === this.fourCorners.topRight.id);
    const bottomLeftRect = this.allPixles.find(x => x.id === this.fourCorners.bottomLeft.id);
    const bottomRightRect = this.allPixles.find( x => x.id === this.fourCorners.bottomRight.id);
    this.isMoveVialation = (topLeftRect.position.x > this.fourCorners.topLeftLimit.position.x
                           && topLeftRect.position.y > this.fourCorners.topLeftLimit.position.y)*/
                           /*|| (topRightRect.position.x < this.fourCorners.topRightLimit.position.x
                           && topRightRect.position.y > this.fourCorners.topRightLimit.position.y)
                           || (bottomRightRect.position.x < this.fourCorners.bottomRightLimit.position.x
                           && bottomRightRect.position.y < this.fourCorners.bottomRightLimit.position.y)
                           || (bottomLeftRect.position.x > this.fourCorners.bottomLeftLimit.positiion.x
                           && bottomLeftRect.position.y < this.fourCorners.bottomLeftLimit.positiion.y)*/
  }
  // load events function
  private loadCanvasEvents(): void {
    this.canvasRef.onmousemove = (evt) => {
     
      const pt = this.getMousePos(evt);
     
      if (this.statusMove && this.inLargeMode && this.isMouseDown) {
        this.context.clearRect(0, 0, this.canvasRef.width, this.canvasRef.height);
        let deltaX = pt.x - this.initialDown.x;
        let deltaY = pt.y - this.initialDown.y;
        this.initialDown = new Point2D(pt.x, pt.y);
        this.updateLargeLettersPos(deltaX, deltaY);
        this.largeLettersInit();
      }
      else if (this.isMouseDown && this.statusMove && !this.isMoveVialation && !this.inLargeMode) {
        this.context.clearRect(0, 0, this.canvasRef.width, this.canvasRef.height);
                
                let deltaX = pt.x - this.initialDown.x;
                let deltaY = pt.y - this.initialDown.y;
                this.initialDown = new Point2D(pt.x, pt.y);
                if(this.allPixles[0].position.x > this.fourCorners.topLeftLimit.position.x &&
                  this.allPixles[0].position.y > this.fourCorners.topLeftLimit.position.y) {
                    deltaX = -this.allPixles[0].position.x
                    deltaY = -this.allPixles[0].position.y
                    this.initialDown = new Point2D(0, 0);
                    this.isMouseDown = false;
                  } else if (this.fourCorners.bottomLeft.position.x > this.fourCorners.bottomLeftLimit.position.x && 
                              this.fourCorners.bottomLeft.position.y < this.fourCorners.bottomLeftLimit.position.y) {
                                deltaX = -this.allPixles[0].position.x
                                deltaY = -this.allPixles[0].position.y
                                this.initialDown = new Point2D(0, 0);
                                this.isMouseDown = false;
                  }
                this.updatePuzzlePosition(deltaX, deltaY);
                this.loadDataToCanvas();
               
      }
      else if (this.statusHightlight) {
        this.context.clearRect(0, 0, this.canvasRef.width, this.canvasRef.height);
        this.loadDataToCanvas();
        this.displayOutline(pt);
      }
     // console.log("In Mouse Moving =>" , this.isMouseDown);
    }
    this.canvasRef.onmousedown = (evt) => {
      this.isMouseDown = true;
      const currPos = this.getMousePos(evt);
      if (this.statusHightlight && !this.inLargeMode) {
        this.inLargeMode = true;
        this.statusMove = true;
        this.statusHightlight = false;
        this.displayOutline(currPos, true);
        this.prepLargeLetters();
        this.throwToggleStatus();
        console.log(this.transformedLetters.center);
        this.context.clearRect(0, 0, this.canvasRef.width, this.canvasRef.height);
        this.largeLettersInit();
      } 
        this.initialDown = new Point2D(currPos.x, currPos.y);
      
      
      // console.log('From mouse is down =>', this.isMouseDown);

    }
    this.canvasRef.onmouseup = (evt) => {
      this.isMouseDown = false;
      this.isMoveVialation = false;
    }
  }
  private updatePuzzlePosition(deltaX: number, deltaY: number): void {
    this.allPixles.forEach(pixel => {
      let oldX = pixel.position.x;
      let oldY = pixel.position.y;
      pixel.position = new Point2D(oldX + deltaX, oldY + deltaY);
    })
  }
  private updateLargeLettersPos(deltaX: number, deltaY: number): void {
    this.transformedLetters.center = this.updatePixelsHelper(this.transformedLetters.center, deltaX, deltaY);
    this.transformedLetters.top = this.updatePixelsHelper(this.transformedLetters.top, deltaX, deltaY);
    this.transformedLetters.right = this.updatePixelsHelper(this.transformedLetters.right, deltaX, deltaY);
    this.transformedLetters.left = this.updatePixelsHelper(this.transformedLetters.left, deltaX, deltaY);
    this.transformedLetters.bottom = this.updatePixelsHelper(this.transformedLetters.bottom, deltaX, deltaY);
    this.transformedLetters.topRight = this.updatePixelsHelper(this.transformedLetters.topRight, deltaX, deltaY);
    this.transformedLetters.topLeft = this.updatePixelsHelper(this.transformedLetters.topLeft, deltaX, deltaY);
    this.transformedLetters.bottomLeft = this.updatePixelsHelper(this.transformedLetters.bottomLeft, deltaX, deltaY);
    this.transformedLetters.bottomRight = this.updatePixelsHelper(this.transformedLetters.bottomRight, deltaX, deltaY);
  }
  private updatePixelsHelper(pixelBlock: Pixel[], deltaX: number, deltaY: number): Pixel[] {
    pixelBlock.forEach(pixel => {
      let oldX = pixel.position.x;
      let oldY = pixel.position.y;
      pixel.position = new Point2D(oldX + deltaX, oldY + deltaY);
    })
    return pixelBlock;
  }
  private prepLargeLetters(): void {
    this.transformedLetters = new Repaint();
    this.transformedLetters.center = [];
    this.transformedLetters.top = [];
    this.transformedLetters.right = [];
    this.transformedLetters.left = [];
    this.transformedLetters.bottom = [];
    this.transformedLetters.topRight = [];
    this.transformedLetters.topLeft = [];
    this.transformedLetters.bottom = [];
    this.transformedLetters.bottomLeft = [];
    this.transformedLetters.bottomRight = [];
    let firstCell = this.repaintLargeLetters.center[0];
    let deltaCurrent  = this.repaintLargeLetters.center.map( oldRect => {
      return new Point2D((oldRect.position.x  - firstCell.position.x) / this.cellWidth, (oldRect.position.y - firstCell.position.y) / this.cellWidth);
    });

     // console.log(deltaCurrent);
    this.transformedLetters.center = this.loadLargeLetters(this.repaintLargeLetters.center, deltaCurrent, BlockType.center);
    
     if(this.repaintLargeLetters.top.length > 0) {
      firstCell = this.repaintLargeLetters.top[0];
      deltaCurrent  = this.repaintLargeLetters.top.map( oldRect => {
        return new Point2D((oldRect.position.x  - firstCell.position.x) / this.cellWidth, (oldRect.position.y - firstCell.position.y) / this.cellWidth);
      });
      this.transformedLetters.top = this.loadLargeLetters(this.repaintLargeLetters.top, deltaCurrent, BlockType.top);
    }
    if(this.repaintLargeLetters.right.length > 0) {
      firstCell = this.repaintLargeLetters.right[0];
      deltaCurrent  = this.repaintLargeLetters.right.map( oldRect => {
        return new Point2D((oldRect.position.x  - firstCell.position.x) / this.cellWidth, (oldRect.position.y - firstCell.position.y) / this.cellWidth);
      });
      this.transformedLetters.right = this.loadLargeLetters(this.repaintLargeLetters.right, deltaCurrent, BlockType.right);
    }
    if(this.repaintLargeLetters.left.length > 0) {
      firstCell = this.repaintLargeLetters.left[0];
      deltaCurrent  = this.repaintLargeLetters.left.map( oldRect => {
        return new Point2D((oldRect.position.x  - firstCell.position.x) / this.cellWidth, (oldRect.position.y - firstCell.position.y) / this.cellWidth);
      });
      this.transformedLetters.left = this.loadLargeLetters(this.repaintLargeLetters.left, deltaCurrent, BlockType.left);
    }
    if(this.repaintLargeLetters.bottom.length > 0) {
      firstCell = this.repaintLargeLetters.bottom[0];
      deltaCurrent  = this.repaintLargeLetters.bottom.map( oldRect => {
        return new Point2D((oldRect.position.x  - firstCell.position.x) / this.cellWidth, (oldRect.position.y - firstCell.position.y) / this.cellWidth);
      });
      this.transformedLetters.bottom = this.loadLargeLetters(this.repaintLargeLetters.bottom, deltaCurrent, BlockType.bottom);
    }
    if(this.repaintLargeLetters.topRight.length > 0) {
      firstCell = this.repaintLargeLetters.topRight[0];
      deltaCurrent  = this.repaintLargeLetters.topRight.map( oldRect => {
        return new Point2D((oldRect.position.x  - firstCell.position.x) / this.cellWidth, (oldRect.position.y - firstCell.position.y) / this.cellWidth);
      });
      this.transformedLetters.topRight = this.loadLargeLetters(this.repaintLargeLetters.topRight, deltaCurrent, BlockType.rightTop);
    }
    if(this.repaintLargeLetters.topLeft.length > 0) {
      firstCell = this.repaintLargeLetters.topLeft[0];
      deltaCurrent  = this.repaintLargeLetters.topLeft.map( oldRect => {
        return new Point2D((oldRect.position.x  - firstCell.position.x) / this.cellWidth, (oldRect.position.y - firstCell.position.y) / this.cellWidth);
      });
      this.transformedLetters.topLeft = this.loadLargeLetters(this.repaintLargeLetters.topLeft, deltaCurrent, BlockType.leftTop);
    }
    if(this.repaintLargeLetters.bottomRight.length > 0) {
      firstCell = this.repaintLargeLetters.bottomRight[0];
       deltaCurrent  = this.repaintLargeLetters.bottomRight.map( oldRect => {
        return new Point2D((oldRect.position.x  - firstCell.position.x) / this.cellWidth, (oldRect.position.y - firstCell.position.y) / this.cellWidth);
      });
      this.transformedLetters.bottomRight = this.loadLargeLetters(this.repaintLargeLetters.bottomRight, deltaCurrent, BlockType.bottomRight);
    }
    if(this.repaintLargeLetters.bottomLeft.length > 0) {
      firstCell = this.repaintLargeLetters.bottomLeft[0];
      deltaCurrent  = this.repaintLargeLetters.bottomLeft.map( oldRect => {
        return new Point2D((oldRect.position.x  - firstCell.position.x) / this.cellWidth, (oldRect.position.y - firstCell.position.y) / this.cellWidth);
      });
      this.transformedLetters.bottomLeft = this.loadLargeLetters(this.repaintLargeLetters.bottomLeft, deltaCurrent, BlockType.bottomLeft);
    }
  }
  private loadLargeLetters( originalBlock: Pixel[], deltas: Point2D[], slot: BlockType): Pixel[] {
   
    const newBlock: Pixel[] = new Array<Pixel>();
    const newWidth = Math.floor(this.canvasRef.width / this.numOfCols);
    let translateX = 0, translateY = newWidth;
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
    deltas.forEach((rect, i) => {
      newBlock.push ( new Pixel(
        originalBlock[i].letter,
        originalBlock[i].red,
        originalBlock[i].green,
        originalBlock[i].blue,
        i,
        new Point2D(rect.x * newWidth + translateX,rect.y * newWidth + translateY))
      )
    })

    return newBlock;
  }
  private largeLettersInit (): void {
    const fontStyle = 'bold 55px Courier';
    // debugger;
    this.displayLargeLetters(this.transformedLetters.center, fontStyle);
    this.displayLargeLetters(this.transformedLetters.top, fontStyle);
    this.displayLargeLetters(this.transformedLetters.topRight, fontStyle);
    this.displayLargeLetters(this.transformedLetters.topLeft, fontStyle);
    this.displayLargeLetters(this.transformedLetters.right, fontStyle);
    this.displayLargeLetters(this.transformedLetters.left, fontStyle);
    this.displayLargeLetters(this.transformedLetters.bottom, fontStyle);
    this.displayLargeLetters(this.transformedLetters.bottomLeft, fontStyle);
    this.displayLargeLetters(this.transformedLetters.bottomRight, fontStyle);
  }
  private displayLargeLetters(cellBlock: Pixel[], styleFormat: string): void {
    this.context.beginPath();
    this.context.save();
    
    cellBlock.forEach( pixel => {
          
          let strRgb = `rgba(${pixel.red},${pixel.green},${pixel.blue},1.0)`;
          this.context.font = styleFormat;
          this.context.fillStyle = strRgb;
          this.context.fillText(pixel.letter, pixel.position.x, pixel.position.y);
          this.context.stroke();
    })
    this.context.restore();
  } 
  private displayOutline(mousePt: Point2D, loadSection: boolean = false): void {
    for(var index in this.puzzelSections) {
      const outlines = index.split(',');
      const topRect = this.allPixles[+outlines[0]];
      const topRightRect = this.allPixles[+outlines[1]];
      const bottomRect = this.allPixles[+outlines[2]];
      const bottomLeftRect = this.allPixles[+outlines[3]]
      
      if ( mousePt.x > topRect.position.x && mousePt.x < bottomRect.position.x &&
        mousePt.y > topRect.position.y && mousePt.y < bottomRect.position.y) {
          this.context.beginPath();
          this.context.moveTo(topRect.position.x, topRect.position.y - this.cellWidth);
          this.context.lineTo(topRightRect.position.x + this.cellWidth, topRightRect.position.y - this.cellWidth);
          this.context.moveTo(topRightRect.position.x + this.cellWidth, topRightRect.position.y - this.cellWidth);
          this.context.lineTo(bottomRect.position.x + this.cellWidth, bottomRect.position.y);
          this.context.moveTo(bottomRect.position.x + this.cellWidth, bottomRect.position.y);
          this.context.lineTo(bottomLeftRect.position.x, bottomLeftRect.position.y);
          this.context.moveTo(bottomLeftRect.position.x, bottomLeftRect.position.y);
          this.context.lineTo(topRect.position.x, topRect.position.y - this.cellWidth);
          this.context.stroke();
          if(loadSection) {
            this.fillRepaintCanvas(index);
          }
          break;
        }
    }
    
  }
  private fillRepaintCanvas(index: string): void {
    this.repaintLargeLetters = new Repaint();
    this.repaintLargeLetters.center = [];
    this.repaintLargeLetters.top = [];
    this.repaintLargeLetters.right = [];
    this.repaintLargeLetters.left = [];
    this.repaintLargeLetters.bottom = [];
    this.repaintLargeLetters.topRight = [];
    this.repaintLargeLetters.topLeft = [];
    this.repaintLargeLetters.bottom = [];
    this.repaintLargeLetters.bottomLeft = [];
    this.repaintLargeLetters.bottomRight = [];
    const indexArr = index.split(',');
    const row = +indexArr[4];
    const col = +indexArr[5];
    this.repaintLargeLetters.center = this.puzzelSections[index];
    let searchTrm = '';
    if( row > 0) {
      searchTrm = ',' + (row-1) + ',' + col;
      this.repaintLargeLetters.top = this.justFindBlock(searchTrm);
      searchTrm = ',' + (row-1) + ',' + (col+1);
      let result = this.justFindBlock(searchTrm)
      if (result)
       this.repaintLargeLetters.topRight = result;
      searchTrm = ',' + (row-1) + ',' + (col-1);
      result = this.justFindBlock(searchTrm)
      if (result)
       this.repaintLargeLetters.topLeft = result;


    }
    searchTrm = ',' + row + ',' + (col+1);
    let result = this.justFindBlock(searchTrm);
    if(result) {
      this.repaintLargeLetters.right = result;
    }
    searchTrm = ',' + row + ',' + (col-1);
    result = this.justFindBlock(searchTrm);
    if(result) {
      this.repaintLargeLetters.left = result;
    }
    searchTrm = ',' + (row+1) + ',' + (col+1);
    result = this.justFindBlock(searchTrm);
    if(result) {
      this.repaintLargeLetters.bottomRight = result;
    }
    searchTrm = ',' + (row+1) + ',' + (col);
    result = this.justFindBlock(searchTrm);
    if(result) {
      this.repaintLargeLetters.bottom = result;
    }
    searchTrm = ',' + (row+1) + ',' + (col-1);
    result = this.justFindBlock(searchTrm);
    if(result) {
      this.repaintLargeLetters.bottomLeft = result;
    }
    searchTrm = ',' + row + ',' + (col-1);
    result = this.justFindBlock(searchTrm);
    if(result) {
      this.repaintLargeLetters.left = result;
    }

  }
  private justFindBlock(search: string): Pixel[] {
    let foundCell:Pixel[] = new Array<Pixel>();
    for( let index in this.puzzelSections) {
      if(index.match(new RegExp(search,'g'))) {
        foundCell = this.puzzelSections[index];
        break;
      }
    }
    return foundCell;
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
  private getMousePos = (evt) => {
    var rect = this.canvasRef.getBoundingClientRect();

    //return new vector2d(evt.clientX - rect.left,evt.clientY - rect.top,-1,-1);
    return new Point2D(evt.clientX - rect.left, evt.clientY - rect.top);
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
      this.statusHightlight = false;
     
    }
    else {
      const moveElem = document.getElementById('moveCanvas');
      moveElem.classList.add('pale');
      moveElem.classList.remove('highlight');
      this.statusMove = false;
      this.statusHightlight = true;
      //console.log(' Highlight =>', this.puzzelSections);
    }
     

    //this.statusMove = !this.statusMove;
    //this.statusHightlight = !this.statusHightlight;
  }
  private lengthInUtf8Bytes(str: string): number {
    // Matches only the 10.. bytes that are non-initial characters in a multi-byte sequence.
    return encodeURI(str).split(/%..|./).length - 1;
    // var m = encodeURIComponent(str).match(/%[89ABab]/g);
    // return str.length + (m ? m.length : 0);
  }
}

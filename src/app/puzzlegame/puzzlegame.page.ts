import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Point2D } from '../models/point';
import { Pixel } from '../models/pixel';
import { PuzzleService } from '../services/puzzle.service';
import { ɵTestingCompilerFactory } from '@angular/core/testing';
import { first } from 'rxjs/operators';
import { runInThisContext } from 'vm';

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
  isMouseDown: boolean = false;
  allPixles: Pixel[];
  puzzleStyle: string = '';
  fourCorners: any;
  isMoveVialation: boolean = false;
  cellWidth = 0;
  mod = 0;
  numOfCols = 8;
  puzzleSections = [];

  constructor(private puzzleService: PuzzleService) { 
    this.allPixles= new Array<Pixel>();
    this.initialDown = new Point2D(0,0);
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
    });
    this.loadCanvasEvents();
  }
  private edgeCases(): any {
    const firstRect = this.allPixles[0];
    const lastRect = this.allPixles[this.allPixles.length - 1];
    const topRight = this.allPixles.find( x => x.position.x === lastRect.position.x && x.position.y === firstRect.position.y);
    const bottomLeft = this.allPixles.find(x => x.position.x === firstRect.position.x && x.position.y === lastRect.position.y);
    console.log('Top Right =>', topRight);
    console.log('Bottom Right =>', bottomLeft);
    return {
      topLeft: firstRect,
      topRight: topRight,
      bottomLeft: bottomLeft,
      bottomRight: lastRect
    }
  }
  private buildSections(): void {
    let startX = this.allPixles[0].position.x - this.cellWidth;
    let endX = this.allPixles[this.allPixles.length - 1].position.x + this.cellWidth;
    let startY = this.allPixles[0].position.y - this.cellWidth;
    let endY = this.allPixles[this.allPixles.length - 1].position.y + this.cellWidth;
    const width = endX - startX;
    const height = endY - startY;
    const howManySectionsAcross = width / this.numOfCols;
    const howManySectionsDown = height / this.numOfCols;
    let copyStartY = startY;
    let w=0,h=0;
    while( h < howManySectionsDown) {
      w = 0;
      while( w < howManySectionsAcross) {
        endX = startX + (this.mod + 1 ) * this.numOfCols;
        endY = startY + this.numOfCols;
        const blockIds = this.allPixles.filter(x => x.position.x > startX && x.position.x < endX
                                              && x.position.y > startY && x.position.y < endY)
        w++;
        startY = copyStartY;
        this.puzzleSections.push(blockIds);
        startX = blockIds[blockIds.length - 1].position.x + this.cellWidth;
      }
      startY = startY + 8;
      copyStartY = startY;
      h++;
    }


  }
  private setUpMoveLimit(): void  {
    const percLimit = .25;
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
    console.log('the four corners =>', this.fourCorners);

    
  }
  private checkIfCanMove(): void {
    const topLeftRect = this.allPixles.find( x => x.id === this.fourCorners.topLeft.id);
    const topRightRect = this.allPixles.find(x => x.id === this.fourCorners.topRight.id);
    const bottomLeftRect = this.allPixles.find(x => x.id === this.fourCorners.bottomLeft.id);
    const bottomRightRect = this.allPixles.find( x => x.id === this.fourCorners.bottomRight.id);
    this.isMoveVialation = topLeftRect.position.x > this.fourCorners.topLeftLimit.position.x
                           || topLeftRect.position.y > this.fourCorners.topLeftLimit.position.y
                           || topRightRect.position.x < this.fourCorners.topRightLimit.position.x
                           || topRightRect.position.y > this.fourCorners.topRightLimit.position.y
                           || bottomRightRect.position.x < this.fourCorners.bottomRightLimit.position.x
                           || bottomRightRect.position.y < this.fourCorners.bottomRightLimit.position.y
                           || bottomLeftRect.position.x > this.fourCorners.bottomLeftLimit.positiion.x
                           || bottomLeftRect.position.y < this.fourCorners.bottomLeftLimit.positiion.y
  }
  private loadCanvasEvents(): void {
    this.canvasRef.onmousemove = (evt) => {
      
      if (this.isMouseDown && this.statusMove && !this.isMoveVialation) {
                this.context.clearRect(0, 0, this.canvasRef.width, this.canvasRef.height);
                const pt = this.getMousePos(evt);
                const deltaX = pt.x - this.initialDown.x;
                const deltaY = pt.y - this.initialDown.y;
                this.initialDown = new Point2D(pt.x, pt.y);
                this.updatePuzzlePosition(deltaX, deltaY);
                this.loadDataToCanvas();
                this.checkIfCanMove();
      }
      else if (this.statusHightlight) {
        this.context.clearRect(0, 0, this.canvasRef.width, this.canvasRef.height);
        const pt = this.getMousePos(evt);
        this.loadDataToCanvas();
      }
     // console.log("In Mouse Moving =>" , this.isMouseDown);
    }
    this.canvasRef.onmousedown = (evt) => {
      this.isMouseDown = true;
      const currPos = this.getMousePos(evt);
      this.initialDown = new Point2D(currPos.x, currPos.y);
      // console.log('From mouse is down =>', this.isMouseDown);

    }
    this.canvasRef.onmouseup = (evt) => {
      this.isMouseDown = false;
    }
  }
  private updatePuzzlePosition(deltaX: number, deltaY: number): void {
    this.allPixles.forEach(pixel => {
      let oldX = pixel.position.x;
      let oldY = pixel.position.y;
      pixel.position = new Point2D(oldX + deltaX, oldY + deltaY);
    })
  }
  private displayOutline(mousePt: Point2D): void {
     this.puzzleSections.forEach(elementArr => {
       //get the first
       const firstElem = elementArr[0] as Pixel;
       const lastElem = elementArr[elementArr.length - 1] as Pixel;
       if (mousePt.x > firstElem.position.x && mousePt.x < lastElem.position.x 
           && mousePt.y > firstElem.position.y && mousePt.y < lastElem.position.y) {
            this.context.beginPath();
            this.context.moveTo(firstElem.position.x, firstElem.position.y);
            this.context.lineTo( lastElem.position.x, firstElem.position.y);
            this.context.moveTo(lastElem.position.x, firstElem.position.y);
            this.context.lineTo(lastElem.position.x, lastElem.position.y);
            this.context.moveTo(lastElem.position.x, lastElem.position.y);
            this.context.lineTo(firstElem.position.x, lastElem.position.y);
            this.context.moveTo(firstElem.position.x, lastElem.position.y);
            this.context.lineTo(firstElem.position.x, firstElem.position.y);
            this.context.stroke();

       }
     });
  }
  private populatePixelArray(rawData: string): void {
    const eachPixelArr = rawData.split(' ');
    eachPixelArr.forEach( pixelStr => {
      let id = 0;
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
    }
     

    //this.statusMove = !this.statusMove;
    //this.statusHightlight = !this.statusHightlight;
  }
  private lengthInUtf8Bytes(str): number {
    // Matches only the 10.. bytes that are non-initial characters in a multi-byte sequence.
    return encodeURI(str).split(/%..|./).length - 1;
    // var m = encodeURIComponent(str).match(/%[89ABab]/g);
    // return str.length + (m ? m.length : 0);
  }
}

import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Pixel } from '../models/pixel';
import { Point2D } from '../models/point';
import { PuzzleService } from '../services/puzzle.service';


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

  constructor(private puzzleService: PuzzleService) { 
    this.allPixles = [];
  }

  ngOnInit() {
    this.canvasRef = <HTMLCanvasElement>document.getElementById('canvasPuzzle');
    this.context = this.canvasRef.getContext('2d');
    this.puzzleSubscribe = this.puzzleService.loadPuzzles().subscribe( puzzleData => {
      this.puzzleStyle = puzzleData[0].Style;
      this.cellWidth = puzzleData[0].Font + puzzleData[0].Spacing;
      this.mod = puzzleData[0].modulus;
      this.populatePixelArray(puzzleData[0].content);
      this.loadDataToCanvas();
      const sections = this.buildSections(puzzleData[0].sections);
      this.displaySectionOutline(sections);
      this.buildAdjacentSections(sections);
      console.log('content bytes =>', this.adjSections);
    });
  }
  private loadCanvasMouseEvents(): void {
    this.canvasRef.onmousedown = (evt) => {
      const pt = this.getMousePos(evt);
      this.filterSections(pt);

    }
  }
  private filterSections(points: Point2D): Pixel[] {
    let foundSect:Pixel[] = null;
    for (const key in this.adjSections) {
      if (this.adjSections.hasOwnProperty(key)) {
        const section = this.adjSections[key] as Pixel[];
        if(points.x >= section[0].position.x && points.x <= section[section.length-1].position.x && points.y >= section[0].position.y &&
        points.y <= section[section.length-1].position.y) {
          foundSect = section;
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
  private buildAdjacentSections(sections: Point2D[][]): void {
    let row = 0;
    let col = 0;
    sections.forEach( (section,i) => {
      if(section[0].x === 0 && section[0].y > 0){
        col = 0;
        row++;
      }
      const filterdSec = this.allPixles.filter( pix => pix.position.x >= section[0].x && pix.position.x <= section[2].x - this.cellWidth && pix.position.y >= section[0].y && pix.position.y <= section[2].y)
      this.adjSections[row + '-' + col] = filterdSec;
      col++;
    });
  }
  private displaySectionOutline(sections: Point2D[][]): void {
    this.context.beginPath();
    this.context.save();
    sections.forEach( section => {
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

}

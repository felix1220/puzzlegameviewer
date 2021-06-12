import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Pixel } from '../models/pixel';
import { Point2D } from '../models/point';
import { Puzzle } from '../models/puzzle';
import { LoaderService } from '../services/loader/loader.service';
import { PuzzleService } from '../services/puzzle.service';

@Component({
  selector: 'app-puzzle-viewer',
  templateUrl: './puzzle-viewer.page.html',
  styleUrls: ['./puzzle-viewer.page.scss'],
})
export class PuzzleViewerPage implements OnInit {

  canvasRef :HTMLCanvasElement;
  puzzleSubscribe:Subscription;
  context:CanvasRenderingContext2D;
  puzzleStyle: string;
  cellWidth: number;
  mod: number;
  allPixles: Pixel[];
  isMouseDown: boolean = false;
  initialDown: Point2D;
  sectionGrp:any = {};
  
  constructor(private puzzleService: PuzzleService, 
              private loaderSvc: LoaderService) { 
                this.allPixles = [];
                this.initialDown = new Point2D(0,0);
                this.loaderSvc.create('Loading Puzzle...');
    }

  ngOnInit() {
    this.canvasRef = <HTMLCanvasElement>document.getElementById('canvasPuzzle');
    this.context = this.canvasRef.getContext('2d');
        this.puzzleSubscribe = this.puzzleService.loadPuzzles().subscribe( (puzzleData: Puzzle[]) => {
        this.puzzleStyle = puzzleData[0].Style;
        this.cellWidth = puzzleData[0].Font + puzzleData[0].Spacing;
        this.mod = puzzleData[0].modulus;
        this.populatePixelCompress(puzzleData[0].contentSm);
        this.showStandardMode();
        this.loaderSvc.dismiss();
    });
  }
  private showStandardMode() {
    this.loadDataToCanvas();
        
    //this.displaySectionOutline();
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
  private populatePixelCompress(rawData: string): void {
    console.log('--new compress flow--')
    const eachPixelArr = rawData.split(' ');
    const lessOf = [];
    lessOf.push(eachPixelArr[0]);
    lessOf.push(eachPixelArr[1]);
    debugger;
    let id = 0;
    eachPixelArr.forEach( pixelStr => {
     
      const pixelArr = pixelStr.split(':');
      const positionsArr = pixelArr[1].split(',');
       const colorsArr = pixelArr[2].split(',');
       const newPositions = this.processPositions(positionsArr);
        const newColors = this.processColors(colorsArr);
        for(let i =0; i < newPositions.length; i++) {
          const color = newColors[i];
          const newPixel = new Pixel(pixelArr[0], color.r, color.g, color.b, id);
          newPixel.position = new Point2D(newPositions[i].x * this.cellWidth, newPositions[i].y * this.cellWidth);
          newPixel.section = newPositions[i].section;
          this.allPixles.push(newPixel);
          id++;
        }
    
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
  private processPositions(positionsArr: any[]): any[] {
    const len = positionsArr.length - 1;
    const posObjArr:any[] = []
    let cntr = 0;
    for (let i = 0; i < len; i++) {
        if (i + 1 < len) {
            posObjArr.push({
                x: +positionsArr[i],
                y: +positionsArr[i + 1],
                section:+positionsArr[i + 2]
            });
            const lastObj = posObjArr[posObjArr.length - 1];
            if (!this.sectionGrp[lastObj.section]) {
              this.sectionGrp[lastObj.section] = [];
              this.sectionGrp[lastObj.section].push(lastObj);
            } else {
              this.sectionGrp[lastObj.section].push(lastObj);
            }
            i+=2
        }
        cntr++;
    }
    return posObjArr;
  }

}

import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Pixel } from '../models/pixel';
import { Point2D } from '../models/point';
import { Puzzle } from '../models/puzzle';
import { LoaderService } from '../services/loader/loader.service';
import { PuzzleService } from '../services/puzzle.service';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-puzzle-viewer',
  templateUrl: './puzzle-viewer.page.html',
  styleUrls: ['./puzzle-viewer.page.scss'],
})
export class PuzzleViewerPage implements OnInit, AfterViewInit {

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
  displayLarge: boolean = false;
  puzzleInfo: Puzzle[] = [];
  sections: Point2D[][] = [];
  cellWidthTest: number;
  
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
  private loadCanvasMouseEvents(): void {
    this.canvasRef.onmousemove = (evt) => {
      const pt = this.getMousePos(evt);
      this.showStandardMode();
      this.displaySections(pt);
    }
  }

  ngAfterViewInit(): void {
    this.canvasRef = <HTMLCanvasElement>document.getElementById('canvasPuzzle');
    this.context = this.canvasRef.getContext('2d');

    this.puzzleSubscribe = this.puzzleService.loadPuzzles().subscribe( (puzzleData: Puzzle[]) => {
          this.puzzleInfo = puzzleData;
          //this.processSections(this.puzzleInfo[0].sections);
         
          if(!this.displayLarge) {
          this.puzzleStyle = puzzleData[0].Style;
          this.cellWidth = puzzleData[0].Font + puzzleData[0].Spacing;
          //this.cellWidthTest = this.cellWidth;
        } else {
          this.puzzleStyle = puzzleData[0].StyleLarge;
          this.cellWidth = puzzleData[0].FontLarge + puzzleData[0].SpacingLarge;
          //this.cellWidthTest = this.cellWidth;
        }
        console.log('Calc cellwidth => ', this.cellWidthTest, this.puzzleStyle);
        this.mod = puzzleData[0].modulus;
        this.populatePixelCompress(this.puzzleInfo[0].contentSm);
        this.buildSectionDimensions();
        this.processSectionsCalc();
        this.showStandardMode();
        this.loaderSvc.dismiss();
        this.loadCanvasMouseEvents();
        console.log('Lets look at => ', this.sectionGrp);
        
    });
    
    
   }
   private getMousePos = (evt) => {
    var rect = this.canvasRef.getBoundingClientRect();

    //return new vector2d(evt.clientX - rect.left,evt.clientY - rect.top,-1,-1);
    return new Point2D(evt.clientX - rect.left, evt.clientY - rect.top);
  }
  private buildSectionDimensions(): void {
    for (const key in this.sectionGrp) {
      if (this.sectionGrp.hasOwnProperty(key)){
        const dimensions = this.findMinMax(this.sectionGrp[key].raw)
        this.sectionGrp[key].dimensions = dimensions;
      }
    }
  }
  private showStandardMode() {
    this.loadDataToCanvas();
        
    //this.displaySectionOutline();
  }
  private processSectionsCalc(): void {
    for(const key in this.sectionGrp) {
      let pointsLs = [];
      if(this.sectionGrp.hasOwnProperty(key)) {
        let pixel = this.allPixles.find( p => p.id === this.sectionGrp[key].dimensions.topLeftCorner.id);
        const ptTopLeft = {...pixel.position };
        pixel = this.allPixles.find( p => p.id === this.sectionGrp[key].dimensions.topRightCorner.id);
        const ptTopRight = {...pixel.position};
        pixel = this.allPixles.find( p => p.id === this.sectionGrp[key].dimensions.bottomRightCorner.id);
        const ptBottomRight = {...pixel.position}
        pixel = this.allPixles.find( p => p.id === this.sectionGrp[key].dimensions.bottomLeftCorner.id);
        const ptBottomLeft = {...pixel.position }
        pointsLs.push(
          ptTopLeft,
          ptTopRight,
          ptBottomRight,
          ptBottomLeft
        );
        //console.log('Dimensions => ', key, pointsLs);
        this.sections.push(pointsLs);
      }
    }
  }
  /*private processSections(sections:string[]): void {
    sections.forEach( section => {
      const lines = section.split(':');
      let pointsLs = [];
      lines.forEach( line => {
       const points = line.split(',');
       pointsLs.push(new Point2D(+points[0], +points[1]));
      });
      this.sections.push(pointsLs);
    });
  }*/
  private displaySections(currPos:Point2D): void {
    this.context.beginPath();
    this.context.save();
    //this.sections.forEach( section => {
      for(let i=0; i < this.sections.length; i++) {
        const section  = this.sections[i];
        if(currPos.x > section[0].x && currPos.x < section[1].x && currPos.y > section[0].y && currPos.y < section[3].y) {
          this.context.moveTo(section[0].x , section[0].y);
          this.context.lineTo(section[1].x, section[1].y);
          this.context.moveTo(section[1].x , section[1].y);
          this.context.lineTo(section[2].x , section[2].y);
          this.context.moveTo(section[2].x , section[2].y);
          this.context.lineTo(section[3].x , section[3].y);
          this.context.moveTo(section[3].x , section[3].y);
          this.context.lineTo(section[0].x , section[0].y);
          
          break;
        }
      }//end for
    //});
    this.context.stroke();
    this.context.restore();
  }
  private loadDataToCanvas(): void {
    this.context.clearRect(0, 0, this.canvasRef.width, this.canvasRef.height);
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
    //debugger;
    let id = 0;
    eachPixelArr.forEach( pixelStr => {
      if(pixelStr) {
          const pixelArr = pixelStr.split(':');
          //debugger;
          const positionsArr = pixelArr[1].split(',');
          const colorsArr = pixelArr[2].split(',');
          const newPositions = this.processPositions(positionsArr);
            const newColors = this.processColors(colorsArr);
            for(let i =0; i < newPositions.length; i++) {
              const color = newColors[i];
              const newPixel = new Pixel(pixelArr[0], color.r, color.g, color.b, newPositions[i].id);
              newPixel.position = new Point2D(newPositions[i].x * this.cellWidth, newPositions[i].y * this.cellWidth);
              newPixel.section = newPositions[i].section;
              this.allPixles.push(newPixel);
              id++;
            }
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
  private findMinMax(data: any[]): any {
    let lowestX = Number.POSITIVE_INFINITY;
    let highestX = Number.NEGATIVE_INFINITY;
    let tmpX;
    let lowestY= Number.POSITIVE_INFINITY;
    let highestY = Number.NEGATIVE_INFINITY;
    let tmpY;
    for (let i=data.length-1; i>=0; i--) {
      tmpX = data[i].x;
      if (tmpX < lowestX) lowestX = tmpX;
      if (tmpX > highestX) highestX = tmpX;

      tmpY = data[i].y;
      if (tmpY < lowestY) lowestY = tmpY;
      if (tmpY > highestY) highestY = tmpY;
    }
    const topLeftCorner = data.find( d => d.x === lowestX && d.y === lowestY);
    const topRightCorner = data.find( d => d.x === highestX && d.y === lowestY);
    const bottomRightCorner = data.find( d => d.x === highestX && d.y === highestY);
    const bottomLeftCorner = data.find( d => d.x === lowestX && d.y === highestY);
    return {
      topLeftCorner: topLeftCorner,
      topRightCorner: topRightCorner,
      bottomRightCorner: bottomRightCorner,
      bottomLeftCorner: bottomLeftCorner
    }
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
                section:positionsArr[i + 2],
                id: this.guid()
            });
            const lastObj = posObjArr[posObjArr.length - 1];
            if (!this.sectionGrp[lastObj.section]) {
              this.sectionGrp[lastObj.section] = {
                raw:[]
              };
              this.sectionGrp[lastObj.section].raw.push(lastObj);
            } else {
              this.sectionGrp[lastObj.section].raw.push(lastObj);
            }
            i+=2
        }
        cntr++;
    }
    return posObjArr;
  }
  guid(): string {
    const chars = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"];
    let str = "";
    for(var i=0; i<36; i++) {
      str = str + ((i == 8 || i == 13 || i == 18 || i == 23) ? "-" : chars[Math.floor(Math.random()*chars.length)]);
    };
    return str;
  }

}

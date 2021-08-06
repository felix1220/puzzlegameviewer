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
  statusMove: boolean = true;
  statusHighlight: boolean = false; 
  initialDown: Point2D;
  sectionGrp:any = {};
  displayLarge: boolean = false;
  puzzleInfo: Puzzle[] = [];
  sections: any[][] = [];
  cellWidthTest: number;
  normalizeWidth: number;
  hitBlock: Pixel[] = [];
  inLargeMode: boolean = false;

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
    this.canvasRef.onmousedown = (evt) => {
      const pt = this.getMousePos(evt);
      this.isMouseDown = true;
      if(this.statusMove && !this.inLargeMode) {
        this.showStandardMode();
      }
      if(this.statusHighlight && !this.inLargeMode) {
        this.inLargeMode = true;
        this.statusMove = true;
       // this.showSection();
       //debugger;
         this.sectionBuilder();
      }
      this.initialDown = new Point2D(pt.x, pt.y);
    }
    this.canvasRef.onmouseup = (evt) => {
      this.isMouseDown = false;
    }
    this.canvasRef.onmousemove = (evt) => {
      const pt = this.getMousePos(evt);
      if(this.isMouseDown && this.statusMove && !this.inLargeMode) {
        let deltaX = pt.x - this.initialDown.x;
        let deltaY = pt.y - this.initialDown.y;
        this.initialDown = new Point2D(pt.x, pt.y);
        this.updatePuzzlePosition(deltaX, deltaY);
        this.updateSectionPosition(deltaX, deltaY);
        this.showStandardMode();
        //this.loadSectionsNew();
        //this.findSection(pt);
      }
      if(!this.isMouseDown && this.statusHighlight && !this.inLargeMode) {
        this.showStandardMode();
        this.displaySections(pt);
      }
      if(this.inLargeMode && this.statusMove) {
       // this.showSection();
       this.sectionBuilder();
      }
      //if(!this.hitBlock.length) {
       // this.showStandardMode();
       // this.displaySections(pt);
     /* } else {
        this.showSection();
      }*/
    
    }
  }

  ngAfterViewInit(): void {
    this.canvasRef = <HTMLCanvasElement>document.getElementById('canvasPuzzle');
    this.context = this.canvasRef.getContext('2d');

    this.puzzleSubscribe = this.puzzleService.loadPuzzles().subscribe( (puzzleData: Puzzle[]) => {
          this.puzzleInfo = puzzleData;
         
          if(!this.displayLarge) {
          this.puzzleStyle = puzzleData[0].Style;
          this.cellWidth = puzzleData[0].Font + puzzleData[0].Spacing;
          //this.cellWidthTest = this.cellWidth;
        } else {
          this.puzzleStyle = puzzleData[0].StyleLarge;
          this.cellWidth = puzzleData[0].FontLarge + puzzleData[0].SpacingLarge;
          this.normalizeWidth = puzzleData[0].Font + puzzleData[0].Spacing;
          //this.cellWidthTest = this.cellWidth;
        }
        console.log('Calc cellwidth => ', this.cellWidthTest, this.puzzleStyle);
        this.mod = puzzleData[0].modulus;
        this.populatePixelCompress(this.puzzleInfo[0].contentSm);
        this.processAllMins();
        this.processSections();
        console.log('Lets look at => ', this.sections);
        this.showStandardMode();
        //this.loadSectionsNew();
        this.loaderSvc.dismiss();
        this.loadCanvasMouseEvents();
       
        
    });
    
    
   }
   private getMousePos = (evt) => {
    var rect = this.canvasRef.getBoundingClientRect();

    //return new vector2d(evt.clientX - rect.left,evt.clientY - rect.top,-1,-1);
    return new Point2D(evt.clientX - rect.left, evt.clientY - rect.top);
  }
  private showStandardMode() {
    this.loadDataToCanvas();
        
    //this.displaySectionOutline();
  }
  private sectionBuilder(): void {
    this.context.clearRect(0, 0, this.canvasRef.width, this.canvasRef.height);
    //lets build all adjacent sections
    const sectionContainer = [...this.hitBlock];
    let sectionKey = this.hitBlock[0].section;
    this.showSection(sectionKey, sectionContainer);
    const keyParts = sectionKey.split('-');
    let row = +keyParts[0];
    let column = +keyParts[1];
    row += 1;
    sectionKey = row.toString() + '-' + column.toString();
    debugger;
    if(this.sectionGrp[sectionKey]) {
      const block = this.sectionGrp[sectionKey];
      const hitPixels = this.allPixles.filter( f => f.position.x >= block.minX && f.position.x <= block.maxX && f.position.y >= block.minY && f.position.y <= block.maxY );
      this.showSection(sectionKey, hitPixels,false,true,false,false);
    }

  }
  private showSection(sectionKey: string, sectionContainer: Pixel[], addX: boolean = false, addY: boolean = false, reduceX: boolean = false, reduceY: boolean = false): void {
    
    this.context.beginPath();
    this.context.save();
    const fontBig: string = 'bold 80px Courier';
    const numOfCols = 10;
    const newWidth = Math.floor(this.canvasRef.width / numOfCols);
    console.log('New Width => ', newWidth);
    let theSection = this.sectionGrp[sectionKey];
    //const hitSection = this.sectionGrp[this.hitBlock[0].section];
    //let theSection = this.sectionGrp[this.hitBlock[0].section];
    const originalSection = this.sectionGrp[sectionKey].raw;
    
    /*theSection = {
      ...theSection,
      minX:hitSection.minX,
      minY:minY,
      maxX:0,
      maxY:0,
      minXSrc:0,
      minYSrc:0,
      maxXSrc:0,
      maxYSrc:0
    }*/

    let newBlock = sectionContainer.map( m => {

      const originalP = originalSection.find( f => f.id === m.id);
   
      return {
        ...m,
        originalPosition: originalP ? new Point2D(originalP.x - theSection.minXSrc, originalP.y - theSection.minYSrc) : new Point2D(-1,-1)
      }
    });
    console.log('new block => ', newBlock);
    let maxDeltaY = 0;
   
    newBlock = newBlock.map( n => {
      return {
        ...n,
        expandPos: new Point2D( n.originalPosition.x * newWidth, n.originalPosition.y * newWidth + newWidth)
      }
    });
    if(addY) {
        const justYs = newBlock.map( m => m.expandPos.y);
        justYs.sort((a, b) => b - a);
        maxDeltaY = justYs[0];
    }
   newBlock.forEach( (pixel,i) => {
          //if(i < 4) {
           
            let strRgb = `rgba(${pixel.red},${pixel.green},${pixel.blue},1.0)`;
            //console.log(pixel.originalPosition.x * newWidth, newWidth, pixel.originalPosition.y * newWidth, newWidth, strRgb);
            this.context.font = fontBig;
            this.context.fillStyle = strRgb;
            this.context.fillText(pixel.letter, pixel.expandPos.x, pixel.expandPos.y + maxDeltaY);
            
         // }
       
    });
    this.context.stroke();
    this.context.restore();
  }
  private updatePuzzlePosition(deltaX: number, deltaY: number): void {
    this.allPixles.forEach(pixel => {
      let oldX = pixel.position.x;
      let oldY = pixel.position.y;
      pixel.position = new Point2D(oldX + deltaX, oldY + deltaY);
    })
  }
  private updateSectionPosition(deltaX: number, deltaY: number): void {
    this.sections = [];
    let re = /[0-9]+/;
    for (const key in this.sectionGrp) {
      if (this.sectionGrp.hasOwnProperty(key)){
        if(re.test(key)) {
          let pointsLs = [];
          this.sectionGrp[key].minX = this.sectionGrp[key].minX + deltaX;
          this.sectionGrp[key].maxX = this.sectionGrp[key].maxX + deltaX;
          this.sectionGrp[key].minY = this.sectionGrp[key].minY + deltaY;
          this.sectionGrp[key].maxY = this.sectionGrp[key].maxY + deltaY;
          pointsLs.push(new Point2D(this.sectionGrp[key].minX, this.sectionGrp[key].minY));
          pointsLs.push(new Point2D(this.sectionGrp[key].maxX, this.sectionGrp[key].minY));
          pointsLs.push(new Point2D(this.sectionGrp[key].maxX, this.sectionGrp[key].maxY));
          pointsLs.push(new Point2D(this.sectionGrp[key].minX, this.sectionGrp[key].maxY));
          pointsLs.push(key);
          this.sections.push(pointsLs);
        }
        
      }
    }
  }
  private processSections(): void {
    let re = /[0-9]+/;
    for (const key in this.sectionGrp) {
      if (this.sectionGrp.hasOwnProperty(key)){
        if(re.test(key)) {
          let pointsLs = [];

          pointsLs.push(new Point2D(this.sectionGrp[key].minX, this.sectionGrp[key].minY));
          pointsLs.push(new Point2D(this.sectionGrp[key].maxX, this.sectionGrp[key].minY));
          pointsLs.push(new Point2D(this.sectionGrp[key].maxX, this.sectionGrp[key].maxY));
          pointsLs.push(new Point2D(this.sectionGrp[key].minX, this.sectionGrp[key].maxY));
          pointsLs.push(key);
          this.sections.push(pointsLs);
        }
      }
    }
  }
  /*private processSections(sections:string[]): void {
    sections.forEach( section => {
      const lines = section.split(':');
      let pointsLs = [];
      lines.forEach( line => {
       const points = line.split(',');
       if(this.displayLarge) {
         const normalizeX = Math.floor(+points[0] / this.normalizeWidth);
         const normalizeY = Math.floor(+points[1] / this.normalizeWidth);

        pointsLs.push(new Point2D(normalizeX * this.cellWidth, normalizeY * this.cellWidth));
       } else {
        pointsLs.push(new Point2D(+points[0], +points[1]));
       }
       
      });
      this.sections.push(pointsLs);
    });
  }*/
  private findSection(currPos: Point2D): void {
    console.log('All sections => ', this.sections);
    for(let i=0; i < this.sections.length; i++) {
      const section  = this.sections[i];
      if(currPos.x > section[0].x && currPos.x < section[1].x && currPos.y > section[0].y && currPos.y < section[3].y) {
        console.log(currPos.x + ' > ' + section[0].x + ',' + currPos.x + ' < ' + section[1].x, section[4]);
        console.log(currPos.y + ' > ' + section[0].y + ',' + currPos.y + ' < ' + section[3].y, this.sectionGrp['1-3'], this.sectionGrp['2-0']);
        //this.processBlock(section);
        break;
      }
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
    console.log('Hit block section => ', this.hitBlock[0].section);
    //console.log('Hit Block end => ', this.hitBlock[this.hitBlock.length-1].section);
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
          const newPositions = this.processPositions(positionsArr, id, pixelArr[0]);
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
  private processAllMins(): void {
    for (const key in this.sectionGrp) {
      if (this.sectionGrp.hasOwnProperty(key)){
        //debugger;
        const raw = this.sectionGrp[key].raw;
        const onlyXs = raw.map( m => m.x);
        const cloneXs = [...onlyXs];
        const onlyYs = raw.map( m => m.y);
        const cloneYs = [...onlyYs];
        onlyXs.sort((a, b) => a - b);
        onlyYs.sort((a, b) => a - b);
        cloneXs.sort((a, b) => b - a);
        cloneYs.sort((a, b) => b - a);
       const minX  = onlyXs[0] * this.cellWidth;
       const minY = onlyYs[0] * this.cellWidth - this.cellWidth;
       const maxX = cloneXs[0] * this.cellWidth + this.cellWidth;
       const maxY = cloneYs[0] * this.cellWidth;
       
        this.sectionGrp[key].minX = minX;
        this.sectionGrp[key].minY = minY;
        this.sectionGrp[key].maxX = maxX;
        this.sectionGrp[key].maxY = maxY;
        this.sectionGrp[key].minXSrc = onlyXs[0];
        this.sectionGrp[key].minYSrc = onlyYs[1];
        this.sectionGrp[key].maxXSrc = cloneXs[0];
        this.sectionGrp[key].maxYSrc = cloneYs[0];

      }
    }
  }
  private loadSectionsNew(): void {

    this.context.beginPath();
    this.context.save();

    for (const key in this.sectionGrp) {
      if (this.sectionGrp.hasOwnProperty(key) && (key=== '1-3' || key === '2-0')){
        const raw = this.sectionGrp[key].raw;
        const onlyXs = raw.map( m => m.x);
        const cloneXs = [...onlyXs];
        const onlyYs = raw.map( m => m.y);
        const cloneYs = [...onlyYs];
        onlyXs.sort((a, b) => a - b);
        onlyYs.sort((a, b) => a - b);
        cloneXs.sort((a, b) => b - a);
        cloneYs.sort((a, b) => b - a);
        const minX  = onlyXs[0] * this.cellWidth;
        const minY = onlyYs[0] * this.cellWidth - this.cellWidth;
        const maxX = cloneXs[0] * this.cellWidth + this.cellWidth;
        const maxY = cloneYs[0] * this.cellWidth;
  
   
          this.context.moveTo(minX , minY);
          this.context.lineTo(maxX, minY);
          this.context.moveTo(maxX , minY);
          this.context.lineTo(maxX , maxY);
          this.context.moveTo(minX , minY);
          this.context.lineTo(minX , maxY);
          this.context.moveTo(minX,maxY);
          this.context.lineTo(maxX , maxY);
          /*this.context.moveTo(minX , maxY);
          this.context.lineTo(minX , minY);*/
      }
    }
    
      
     this.context.stroke();
    this.context.restore();
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
  private processPositions(positionsArr: any[], incr:number, letter: string): any[] {
    const len = positionsArr.length - 1;
    const posObjArr:any[] = []
    let cntr = 0;
    let minX = 10000;
    let minY = 10000;
    for (let i = 0; i < len; i++) {
        if (i + 1 < len) {
            posObjArr.push({
                x: +positionsArr[i],
                y: +positionsArr[i + 1],
                section:positionsArr[i + 2],
                id: this.guid(),
                letter: letter
            });

            const lastObj = posObjArr[posObjArr.length - 1];
           
            if (!this.sectionGrp[lastObj.section]) {
              this.sectionGrp[lastObj.section] = {
                raw:[],
                minX:minX,
                minY:minY,
                maxX:0,
                maxY:0,
                minXSrc:0,
                minYSrc:0,
                maxXSrc:0,
                maxYSrc:0
              };
              this.sectionGrp[lastObj.section].raw.push(lastObj);
            } else {
              this.sectionGrp[lastObj.section].raw.push(lastObj);
            }
            i+=2
        }
        cntr++;
    }
    this.sectionGrp[posObjArr[0].section].minX = minX;
    this.sectionGrp[posObjArr[0].section].minY = minY;
    return posObjArr;
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

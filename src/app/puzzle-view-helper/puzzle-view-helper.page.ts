import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Pixel } from '../models/pixel';
import { Location } from '../models/location';
import { Point2D } from '../models/point';
import { Puzzle } from '../models/puzzle';
import { LoaderService } from '../services/loader/loader.service';
import { PuzzleService } from '../services/puzzle.service';
import { Platform } from '@ionic/angular';
import { ThrowStmt } from '@angular/compiler';
import { Section } from '../models/section';
import { PuzzleImports } from '../models/puzzleImports';

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
  largeLayout: Location[][] = [];

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
        this.showStandardMode();
      }
      if(!this.isMouseDown && this.statusHighlight && !this.inLargeMode) {
        this.showStandardMode();
        this.displaySections(pt);
      }
    };
    this.canvasRef.onmouseup = (evt) => {
      this.isMouseDown = false;
    }
  }
  
  ngOnDestroy(): void {
    if(this.puzzleSubscribe) {
      this.puzzleSubscribe.unsubscribe();
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
    console.log('Hit block section => ', this.hitSection);
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
    this.context.clearRect(0, 0, this.canvasRef.width, this.canvasRef.height);
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
  private prepLargeSelection(): void {
    this.largeLayout = [];
    let tempLocals:Location[] = [];
    const numOfCols = 10;
    const newWidth = Math.floor(this.canvasRef.width / numOfCols);
    console.log('New Width => ', newWidth);
    const secLocations = this.plainLocations.filter( f=> f.section === this.hitSection);
    secLocations.forEach( (local:Location) => {
      const p = new Point2D(local.point.x * newWidth, local.point.y * newWidth + newWidth);
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
    //lets check to the right
    let rightCol =  col + 1;
    let newSectionRight = row + '-' + rightCol;
    const rightSection = this.plainLocations.find( f => f.section === newSectionRight)
    if(rightSection) {
      tempLocals = [];
      const rightLocationLs = this.plainLocations.filter( f => f.section === newSectionRight)
      rightLocationLs.forEach((local:Location) => {
        const p = new Point2D(local.point.x * newWidth + cloneXs[0], local.point.y * newWidth + newWidth);
        const l = new Location(p, local.section, local.id);
        tempLocals.push(l);
      });
      this.largeLayout.push(tempLocals);
    }
    //lets check to the left
    let leftCol = col - 1;
    let newSectionLeft = row + '-' + leftCol;
    const leftSection = this.plainLocations.find( f => f.section === newSectionLeft);
    if(leftSection) {
      tempLocals = []
      const leftLocationLs = this.plainLocations.filter( f => f.section === newSectionLeft);
      leftLocationLs.forEach((local:Location) => {
        const p = new Point2D(local.point.x * newWidth, local.point.y * newWidth + newWidth);
        const l = new Location(p, local.section, local.id);
        tempLocals.push(l);
      });
      const leftXs = tempLocals.map( m => m.point.x);
      leftXs.sort((a, b) => b - a);
      tempLocals.forEach((local:Location) => {
        local.point.x = local.point.x - leftXs[0];
      });
      this.largeLayout.push(tempLocals);
    }//end if
    //lets check bottom
    let bottomRow = row + 1;
    let sectionBottom = row + '-' + bottomRow;
    const bottomLocation = this.plainLocations.find( f => f.section === sectionBottom);
    if(bottomLocation) {
      tempLocals = [];
      const bottomLocationLs = this.plainLocations.filter(f => f.section === sectionBottom);
      bottomLocationLs.forEach((local:Location) => {
        const p = new Point2D(local.point.x * newWidth, (local.point.y * newWidth + newWidth) + cloneYs[0]);
        const l = new Location(p, local.section, local.id);
        tempLocals.push(l);
      });
      this.largeLayout.push(tempLocals);
    }
    //lets check top
    let topRow = row - 1;
    let sectionTop = row + '-' + topRow;
    const topLocation = this.plainLocations.find( f => f.section === sectionTop);
    if(topLocation){
      tempLocals = [];
      const topLocationsLs = this.plainLocations.filter( f => f.section === sectionTop);
      topLocationsLs.forEach((local:Location) => {
        const p = new Point2D(local.point.x * newWidth, local.point.y * newWidth + newWidth);
        const l = new Location(p, local.section, local.id);
        tempLocals.push(l);
      });
      const leftYs = tempLocals.map( m => m.point.y);
      leftYs.sort((a, b) => b - a);
      tempLocals.forEach((local:Location) => {
        local.point.y = local.point.y - leftYs[0];
      });
      this.largeLayout.push(tempLocals);
    }
    //lets check top right
    

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
     
      this.plainSections[section] = new Section(onlyXs[0],cloneXs[0],onlyXs[0],cloneYs[0]);
      const deltas:Point2D[] =  [];
      secLocations.forEach( p => {
        const deltaX = p.point.x - onlyXs[0];
        const deltaY = p.point.y - onlyYs[0];
        deltas.push(new Point2D(deltaX, deltaY));
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
              const newId = this.guid();
              const newPixel = new Pixel(letter, color.r, color.g, color.b, newId);
              //debugger;
              if(locals[i]) {
                locals[i].id = newId;
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

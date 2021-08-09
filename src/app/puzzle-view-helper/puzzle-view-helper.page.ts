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
  statusHighlight: boolean = false; 
  plainPixels: Pixel[];
  plainLocations: Location[];
  plainSections: any;
  puzzleConstants:PuzzleImports;

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
    });

  }
  ngOnDestroy(): void {
    if(this.puzzleSubscribe) {
      this.puzzleSubscribe.unsubscribe();
    }
  }
  private prepNormalView(): void {
    
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
  private buildSections(): void {
    let sections = this.plainLocations.map(m => m.section);
    let unique = (a:string[]) => [...new Set(a)];
    sections = unique(sections);
    //build hashtable
    sections.forEach(section => {
      const secLocations = this.plainLocations.filter( f => f.section === section);
      const onlyXs = secLocations.map( m => m.point.x);
      const onlyYs = secLocations.map( m => m.point.y);
      const cloneXs = [...onlyXs];
      const cloneYs = [...onlyYs];
      cloneXs.sort((a, b) => b - a);
      cloneYs.sort((a, b) => b - a);
      this.plainSections[section] = new Section(onlyXs[0],cloneXs[0],onlyXs[0],cloneYs[0]);
      const deltas:Point2D[] =  [];
      this.plainLocations.filter( p => {
        const deltaX = p.point.x - onlyXs[0];
        const deltaY = p.point.y - onlyYs[0];
        deltas.push(new Point2D(deltaX, deltaY));
      });
      this.plainSections[section].deltas = [...deltas];
    });

  }
  private processLocations(positionsArr: any[]): void {
    const len = positionsArr.length - 1;
    for (let i = 0; i < len; i++) {
      if (i + 1 < len) {
        const p = new Point2D(+positionsArr[i], +positionsArr[i + 1]);
        const l = new Location(p, positionsArr[i + 2]);
        this.plainLocations.push(l);
      }
    }//end for loop
  }
  private buildAbstractLayer(rawData: string): void {
    const rawPixelArr = rawData.split(' ');
    rawPixelArr.forEach( (pixelStr,i) => {
      const pixelArr = pixelStr.split(':');
      const positionsArr = pixelArr[1].split(',');
      const letter = positionsArr[0];
      const colorsArr = pixelArr[2].split(',');
      const newColors = this.processColors(colorsArr);
      this.processLocations(positionsArr);
      pixelArr.forEach((p,i) => {
        const color = newColors[i];
        const newPixel = new Pixel(letter, color.r, color.g, color.b, i.toString());
        this.plainPixels.push(newPixel);
        this.plainLocations[i].id = i.toString();
      });

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

}

import { BlockType } from './blockTypes';
import { DirectionType } from './directions';
import { Point2D } from './point';

export class Pixel {
    id: string;
    letter: string;
    red: number;
    green: number;
    blue: number;
    position: Point2D;
    largeWidth: number;
    directionType: DirectionType;
    section: string;
    originalPosition?: Point2D;
    expandPos?: Point2D;
    constructor (l: string ='', r: number=0, g:number=0, b:number=0, id: string="", 
                pos=undefined, largeWidth=0, direction=DirectionType.None, section='') {
        this.letter = l;
        this.red = r;
        this.green = g;
        this.blue = b;
        this.id = id;
        this.position = pos;
        this.largeWidth = largeWidth;
        this.directionType = direction;
        this.section = section;
    }
}
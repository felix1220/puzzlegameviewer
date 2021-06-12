import { BlockType } from './blockTypes';
import { DirectionType } from './directions';
import { Point2D } from './point';

export class Pixel {
    id: number;
    letter: string;
    red: number;
    green: number;
    blue: number;
    position: Point2D;
    largeWidth: number;
    directionType: DirectionType;
    section: number;
    constructor (l: string ='', r: number=0, g:number=0, b:number=0, id: number=0, 
                pos=undefined, largeWidth=0, direction=DirectionType.None, section=0) {
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
import { Point2D } from './point';

export class Pixel {
    id: number;
    letter: string;
    red: number;
    green: number;
    blue: number;
    position: Point2D;
    largeWidth: number;
    constructor (l: string ='', r: number=0, g:number=0, b:number=0, id: number=0, pos=undefined, largeWidth=0) {
        this.letter = l;
        this.red = r;
        this.green = g;
        this.blue = b;
        this.id = id;
        this.position = pos;
        this.largeWidth = largeWidth;
    }
}
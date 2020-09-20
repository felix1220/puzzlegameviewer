import { Line } from './line';

export class highlight {
    start: Line;
    end: Line;
    top: Line[];
    bottom: Line[];
    constructor(start: Line= undefined, end: Line = undefined, top: Line[] = undefined, bottom: Line[] = undefined) {
        this.start = start;
        this.end = end;
        this.top = top;
        this.bottom = bottom;
    }
    
}
import { Point2D } from './point';

export class Line {
    start: Point2D;
    end: Point2D;
    constructor(s: Point2D, e: Point2D) {
        this.start = s;
        this.end = e;
    }
}
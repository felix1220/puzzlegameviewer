import { Point2D } from "./point";

export class Section {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    deltas: Point2D[];
    constructor(minX: number, maxX: number, minY: number, maxY: number) {
        this.minX = minX;
        this.maxX = maxX;
        this.minY = minY;
        this.maxY = maxY;
    }
}
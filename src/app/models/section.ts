import { Point2D } from "./point";
import { Location } from "./location"

export class Section {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    cornerX: number;
    cornerY: number;
    section: string;
    deltas: Location[];
    constructor(minX: number, maxX: number, minY: number, maxY: number, section: string) {
        this.minX = minX;
        this.maxX = maxX;
        this.minY = minY;
        this.maxY = maxY;
        this.section = section;
    }
}
import { Point2D } from "./point";

export class Location {
    point: Point2D;
    section: string;
    id: string;
    constructor(point: Point2D, section: string, id: string = "") {
        this.point = point;
        this.section = section;
        this.id = id;
    }
}
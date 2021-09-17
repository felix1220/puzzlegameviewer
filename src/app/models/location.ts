import { DirectionType } from "./directions";
import { Point2D } from "./point";

export class Location {
    point: Point2D;
    section: string;
    id: string;
    dir?: DirectionType
    width?: number;
    constructor(point: Point2D, section: string, id: string = "") {
        this.point = point;
        this.section = section;
        this.id = id;
    }
}
import { DirectionType } from './directions';
import { Point2D } from './point';

export class highlighter {
    private _f: Function;
    private _points: Point2D[];
    private _selectDir: DirectionType;
    private _ids: any[];
    private _key: string;
    private _oldPoints: Point2D[];

    constructor(f: Function) {
        this._f = f;
    }
    public getFunc(): Function {
        return this._f;
    }
    public get points() {
        return this._points;
    }
    public set points(pointsLs: Point2D[]){
        this._points = pointsLs;
    }
    public get dir(){
        return this._selectDir;
    }
    public set dir(selectDir: DirectionType) {
        this._selectDir = selectDir;
    }
    public set ids(ids: any[]) {
        this._ids = ids;
    }
    public get ids() {
        return this._ids;
    }
    public set keySet(key: string) {
        this._key = key;
    }
    public get getKey(){
        return this._key;
    }
    public set oldPoints(points: Point2D[]) {
        this._oldPoints = points;
    }
    public get oldPoints(){
        return this._oldPoints;
    }
}
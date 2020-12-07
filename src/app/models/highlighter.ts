export class highlighter {
    private _f: Function;
    constructor(f: Function) {
        this._f = f;
    }
    public getFunc(): Function {
        return this._f;
    }
}
export class PuzzleImports {
    puzzleStyle: string;
    cellWidth: number;
    normalizeWidth: number;
    constructor(puzzleStyle:string="", cellWidth:number =0, normalizedWidth:number=0) {
        this.puzzleStyle = puzzleStyle;
        this.cellWidth = cellWidth;
        this.normalizeWidth = normalizedWidth;
    }
}
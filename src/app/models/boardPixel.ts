import { highlight } from './highlight';
import { Pixel } from './pixel';

export class BoardPixel {
    mark:highlight;
    words: Pixel[];
    constructor(words:Pixel[] = undefined, mark:highlight = undefined) {
        this.words = words;
        this.mark = mark;

    }
}

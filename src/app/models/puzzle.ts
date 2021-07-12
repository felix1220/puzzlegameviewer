export interface Puzzle {
    Font: number;
    Spacing: number;
    Style:string;
    content: string;
    name: string;
    modulus: number;
    sections: string[];
    sectionHash: any;
    words:string[];
    contentSm: string;
    FontLarge: number;
    SpacingLarge: number;
    StyleLarge: string;
    sectionWidth: number;
}
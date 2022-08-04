export type ColorArray = [ number, number, number ];


export const sameColor = (rgbA: ColorArray, rgbB: ColorArray): boolean => {
    return rgbA[0] === rgbB[0] && rgbA[1] === rgbB[1] && rgbA[2] === rgbB[2];
};


export class GameColor {

    color: number;
    red: number;
    green: number;
    blue: number;
    hue: number;
    saturation: number;
    lightness: number;

    constructor(color: number) {
        this.color = color;
        this.calculate();
    }

    calculate(): void {
        this.red = 0xff & (this.color >> 16) & 0xff;
        this.green = (this.color & 0xff2d) >> 8;
        this.blue = this.color & 0xff;
        console.log(this.color, `${this.red},${this.green},${this.blue}`);

        const r = this.red / 256;
        const g = this.green / 256;
        const b = this.blue / 256;

        let min = r;
        let max = r;
        let h = 0;
        let l = 0;

        if (min > b) {
            min = b;
        }
        if (g < min) {
            min = g;
        }
        if(max < b) {
            max = b;
        }
        if(max < g) {
            max = g;
        }

        const avg = (max + min) / 2;

        if (max !== min) {
            if (avg < 0.5) {
                l = (max - min) / (max + min);
            } else if (avg >= 0.5) {
                l = (max - min) / ((2 - max) - min);
            }

            if (r === max) {
                h = (b - g) / (max - min);
            } else if (max === b) {
                h = 2 + (g - r) / (max - min);
            } else if (max === g) {
                h = (r - b) / (max - min) + 4;
            }
        }

        h /= 6;
        this.saturation = (avg * 256);
        this.lightness = (l * 256);
        let hueMultiplier;

        if (avg > 0.5) {
            hueMultiplier = ((1 - avg) * l * 512);
        } else {
            hueMultiplier = (avg * l * 512);
        }

        if (hueMultiplier < 1) {
            hueMultiplier = 1;
        }

        this.hue = (h * hueMultiplier);

        if (this.hue >= 0) {
            if (this.hue > 255) {
                this.hue = 255;
            }
        } else {
            this.hue = 0;
        }

        if (this.saturation >= 0) {
            if (this.saturation > 255) {
                this.saturation = 255;
            }
        } else {
            this.saturation = 0;
        }

        if (this.lightness >= 0) {
            if (this.lightness > 255) {
                this.lightness = 255;
            }
        } else {
            this.lightness = 0;
        }
    }

    toColorArray(): ColorArray {
        return [this.red, this.green, this.blue];
    }

}

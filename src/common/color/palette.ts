import { adjustBrightness, adjustBrightnessArray } from "./brightness";
import { ColorArray } from "./game-color";

export function createPaletteItem(brightness: number, x: number, y: number, hue: number, lightness: number) {
    let intensity = x / 128.0;
    let red = intensity;
    let green = intensity;
    let blue = intensity;

    if (lightness != 0.0) {
        let a;
        if (intensity < 0.5) {
            a = intensity * (1.0 + lightness);
        } else {
            a = intensity + lightness - intensity * lightness;
        }
        let b = 2.0 * intensity - a;
        let fRed = hue + 0.3333333333333333;
        if (fRed > 1.0) {
            fRed--;
        }
        let fGreen = hue;
        let fBlue = hue - 0.3333333333333333;
        if (fBlue < 0.0) {
            fBlue++;
        }
        if (6.0 * fRed < 1.0) {
            red = b + (a - b) * 6.0 * fRed;
        } else if (2.0 * fRed < 1.0) {
            red = a;
        } else if (3.0 * fRed < 2.0) {
            red = b + (a - b) * (0.6666666666666666 - fRed) * 6.0;
        } else {
            red = b;
        }
        if (6.0 * fGreen < 1.0) {
            green = b + (a - b) * 6.0 * fGreen;
        } else if (2.0 * fGreen < 1.0) {
            green = a;
        } else if (3.0 * fGreen < 2.0) {
            green = b + (a - b) * (0.6666666666666666 - fGreen) * 6.0;
        } else {
            green = b;
        }
        if (6.0 * fBlue < 1.0) {
            blue = b + (a - b) * 6.0 * fBlue;
        } else if (2.0 * fBlue < 1.0) {
            blue = a;
        } else if (3.0 * fBlue < 2.0) {
            blue = b + (a - b) * (0.6666666666666666 - fBlue) * 6.0;
        } else {
            blue = b;
        }
    }

    const outR = (red * 256.0) | 0;
    const outG = (green * 256.0) | 0;
    const outB = (blue * 256.0) | 0;
    
    return adjustBrightnessArray([ outR, outG, outB ], brightness);
}

function createPalette(brightness: number) {
    const p: ColorArray[] = new Array(65536);

    let index = 0;

    for (let y = 0; y < 512; y++) {
        let hue = (y >> 3) / 64.0 + 0.0078125;
        let lightness = (y & 0x7) / 8.0 + 0.0625;

        for (let x = 0; x < 128; x++) {
            const rgb = createPaletteItem(brightness, x, y, hue, lightness);

            p[index++] = rgb;
        }
    }

    return p;
}

export const palette = createPalette(0.8);
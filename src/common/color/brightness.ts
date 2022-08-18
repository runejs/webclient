import { ColorArray } from "./game-color";

export function adjustBrightness(color: number, intensity: number) {
    let r = (color >> 16) / 256.0;
    let g = ((color >> 8) & 0xff) / 256.0;
    let b = (color & 0xff) / 256.0;
    r = Math.pow(r, intensity);
    g = Math.pow(g, intensity);
    b = Math.pow(b, intensity);
    const outR = (r * 256.0) | 0;
    const outB = (g * 256.0) | 0;
    const outC = (b * 256.0) | 0;
    return (outR << 16) + (outB << 8) + outC;
}

export function adjustBrightnessArray(color: ColorArray, intensity: number) {
    let [r, g, b] = color;

    r /= 256.0;
    g /= 256.0;
    b /= 256.0;

    r = Math.pow(r, intensity);
    g = Math.pow(g, intensity);
    b = Math.pow(b, intensity);

    const outR = (r * 256.0) | 0;
    const outB = (g * 256.0) | 0;
    const outC = (b * 256.0) | 0;
    
    return [ outR, outB, outC ] as ColorArray;
}
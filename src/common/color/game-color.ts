export type ColorArray = [ number, number, number ];


export const sameColor = (rgbA: ColorArray, rgbB: ColorArray): boolean => {
    return rgbA[0] === rgbB[0] && rgbA[1] === rgbB[1] && rgbA[2] === rgbB[2];
};


export function hueToRGB(p: number, q: number, h: number): number {
    if (h < 0) {
        h += 1;
    }

    if (h > 1) {
        h -= 1;
    }

    if (6 * h < 1) {
        // console.log("BRANCH A ", p + (q - p) * 6 * h);
        return p + (q - p) * 6 * h;
    }

    if (2 * h < 1) {
        // console.log("BRANCH B ", q);
        return q;
    }

    if (3 * h < 2) {
        // console.log("BRANCH C ", p + (q - p) * 6 * (2 / 3 - h));
        return p + (q - p) * 6 * (2 / 3 - h);
    }

    // console.log("BRANCH D ", p);
    return p;
}

export function hslIntToColorArray(hslInt: number): ColorArray {
    const h = (hslInt >> 10) & 0x3f;
    const s = (hslInt >> 7) & 7;
    const l = hslInt & 0x7f;

    return hslToColorArray(h, s, l);
}

// TODO investigate this further, from RuneColor
export function hslToColorArray(h: number, s: number, l: number): ColorArray {
    let r: number;
    let g: number;
    let b: number;

    if (s === 0) {
        b = l;
        g = b;
        r = g; // achromatic
    } else {
        let q =
            l < 0.5
                ? l * (1 + s)
                : l +
                  s -
                  l * s;
        let p = 2 * l - q;
        r = hueToRGB(p, q, h + 1 / 3);
        g = hueToRGB(p, q, h);
        b = hueToRGB(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export class RS2Color {
    public readonly hue: number;
    public readonly saturation: number;
    public readonly lightness: number;
    public readonly hueMultiplier: number;

    constructor(
        hue: number,
        saturation: number,
        lightness: number,
        hueMultiplier: number
    ) {
        this.hue = hue;
        this.saturation = saturation;
        this.lightness = lightness;
        this.hueMultiplier = hueMultiplier;
    }

    get rgb(): ColorArray {
        return hslToColorArray(this.hue, this.saturation, this.lightness);
    }

    public static rs2hsbToRgb(RS2HSB: number): ColorArray {
        const decode_hue = (RS2HSB >> 10) & 63;
        const decode_saturation = (RS2HSB >> 7) & 7;
        const decode_brightness = RS2HSB & 127;
        return RS2Color.hsbToRgb(decode_hue / 63, decode_saturation / 7, decode_brightness / 127);
    }

    public static hsbToRgb(hue: number, saturation: number, brightness: number): ColorArray {
        let r = 0, g = 0, b = 0;
        if (saturation === 0) {
            r = g = b = (brightness * 255 + 0.5);
        } else {
            let h = (hue - Math.floor(hue)) * 6;
            let f = h - Math.floor(h);
            let p = brightness * (1.0 - saturation);
            let q = brightness * (1.0 - saturation * f);
            let t = brightness * (1.0 - (saturation * (1 - f)));
            switch (h) {
            case 0:
                r = (brightness * 255 + 0.5);
                g = (t * 255 + 0.5);
                b = (p * 255 + 0.5);
                break;
            case 1:
                r = (q * 255 + 0.5);
                g = (brightness * 255 + 0.5);
                b = (p * 255 + 0.5);
                break;
            case 2:
                r = (p * 255 + 0.5);
                g = (brightness * 255 + 0.5);
                b = (t * 255 + 0.5);
                break;
            case 3:
                r = (p * 255 + 0.5);
                g = (q * 255 + 0.5);
                b = (brightness * 255 + 0.5);
                break;
            case 4:
                r = (t * 255 + 0.5);
                g = (p * 255 + 0.5);
                b = (brightness * 255 + 0.5);
                break;
            case 5:
                r = (brightness * 255 + 0.5);
                g = (p * 255 + 0.5);
                b = (q * 255 + 0.5);
                break;
            }
        }
        return [ r, g, b ];
    }

    public static fromRGBInt(rgb: number): RS2Color {
        const r = ((rgb >> 16) & 0xff) / 256;
        const g = ((rgb >> 8) & 0xff) / 256;
        const b = (rgb & 0xff) / 256;

        let minC = r;
        if (g < minC) {
            minC = g;
        }
        if (b < minC) {
            minC = b;
        }

        let maxC = r;
        if (g > maxC) {
            maxC = g;
        }
        if (b > maxC) {
            maxC = b;
        }

        let h = 0;
        let s = 0;

        let l = (maxC + minC) / 2.0;

        let outLightness = (l * 256.0) | 0;

        if (maxC !== minC) {
            if (l < 0.5) {
                s = (maxC - minC) / (maxC + minC);
            }
            if (l >= 0.5) {
                s = (-minC + maxC) / (-minC + (-maxC + 2.0));
            }
            if (r === maxC) {
                h = (-b + g) / (-minC + maxC);
            } else if (maxC === g) {
                h = 2.0 + (b - r) / (maxC - minC);
            } else if (maxC === b) {
                h = (r - g) / (-minC + maxC) + 4.0;
            }
        }

        h /= 6.0;

        if (outLightness >= 0) {
            if (outLightness > 255) {
                outLightness = 255;
            }
        } else {
            outLightness = 0;
        }

        let outHueMultiplier = 0;
        let outSaturation = 0;

        if (l > 0.5) {
            outHueMultiplier = ((-l + 1.0) * s * 512.0) | 0;
        } else {
            outHueMultiplier = (l * s * 512.0) | 0;
        }
        outSaturation = (256.0 * s) | 0;
        if (outHueMultiplier < 1) {
            outHueMultiplier = 1;
        }
        const outHue = (h * outHueMultiplier) | 0;
        if (outSaturation >= 0) {
            if (outSaturation > 255) {
                outSaturation = 255;
            }
        } else {
            outSaturation = 0;
        }

        return new RS2Color(
            outHue,
            outSaturation,
            outLightness,
            outHueMultiplier
        );
    }
}

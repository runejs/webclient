import { PNG } from "pngjs/browser";
import { toRgb } from "../sprites/sprite-transcoder";

// TODO high/low memory ?
export const TEXTURE_SIZE = 128;

export const TEXTURE_INTENSITY = 0.7;

export class Texture {
    id: number;
    rgb: number;
    opaque: boolean;
    spriteIds: number[];
    renderTypes: number[];
    colors: number[];
    direction: number;
    speed: number;

    pixels: number[] = [];

    constructor(
        textureId: number,
        rgb: number,
        opaque: boolean,
        spriteIds: number[],
        renderTypes: number[],
        colors: number[],
        direction: number,
        speed: number
    ) {
        this.id = textureId;
        this.rgb = rgb;
        this.opaque = opaque;
        this.spriteIds = spriteIds;
        this.renderTypes = renderTypes;
        this.colors = colors;
        this.direction = direction;
        this.speed = speed;
    }

    /**
     * First converts the Sprite into a base64 PNG image.
     */
    public async toBase64(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            const png = this.toPng();

            try {
                png.pack();

                const chunks = [];

                png.on("data", (chunk) => {
                    chunks.push(chunk);
                });
                png.on("end", () => {
                    const str = Buffer.concat(chunks).toString("base64");
                    resolve(str);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Converts the Sprite into a PNG image and returns the resulting PNG object.
     */
    public toPng(): PNG {
        const png = new PNG({
            width: TEXTURE_SIZE,
            height: TEXTURE_SIZE,
            filterType: -1,
        });

        for (let x = 0; x < TEXTURE_SIZE; x++) {
            for (let y = 0; y < TEXTURE_SIZE; y++) {
                const pixel = this.pixels[TEXTURE_SIZE * y + x];
                const [r, g, b] = toRgb(pixel);

                const pngIndex = (TEXTURE_SIZE * y + x) << 2;

                png.data[pngIndex] = r;
                png.data[pngIndex + 1] = g;
                png.data[pngIndex + 2] = b;
                png.data[pngIndex + 3] = pixel >> 24;
            }
        }

        return png;
    }
}

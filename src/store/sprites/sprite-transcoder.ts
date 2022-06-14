import { ByteBuffer } from '@runejs/common';
import { store } from '../store';


export interface SpriteState {
    spritePackName?: string;
    spriteIndex?: number;
    maxWidth?: number;
    maxHeight?: number;
    offsetX?: number;
    offsetY?: number;
    width?: number;
    height?: number;
    pixelIdx?: number[];
    palette?: number[];
    pixels?: number[];
    pngData?: Uint8ClampedArray;
}


export type RgbColor = [ number, number, number ];


export const toRgb = (color: number): RgbColor => {
    color >>>= 0;
    const b = color & 0xFF,
        g = (color & 0xFF00) >>> 8,
        r = (color & 0xFF0000) >>> 16;
    return [ r, g, b ];
};


export class SpriteTranscoder {

    static readonly sprites = new Map<string, SpriteState[]>();

    static async getSprites(spriteName: string): Promise<SpriteState[]> {
        if(!SpriteTranscoder.sprites.has(spriteName)) {
            const spritePack = await SpriteTranscoder.decode(spriteName);
            SpriteTranscoder.sprites.set(spriteName, spritePack);
        }

        return SpriteTranscoder.sprites.get(spriteName);
    }

    static async getSprite(spritePackName: string, spriteIndex: number): Promise<SpriteState> {
        const spritePack = await SpriteTranscoder.getSprites(spritePackName);
        return spritePack[spriteIndex];
    }

    static async decode(spriteName: string): Promise<SpriteState[]> {
        const fileData = new ByteBuffer(await store.get(8, spriteName));
        // const fileData = this.store.decompress(compressedFileData);

        fileData.readerIndex = (fileData.length - 2);
        const spriteCount = fileData.get('short', 'u');
        const sprites: SpriteState[] = new Array(spriteCount);

        fileData.readerIndex = (fileData.length - 7 - spriteCount * 8);
        const width = fileData.get('short', 'u');
        const height = fileData.get('short', 'u');
        const paletteLength = fileData.get('byte', 'u') + 1;

        for (let i = 0; i < spriteCount; i++) {
            const sprite = sprites[i] = {} as SpriteState;
            sprite.spritePackName = spriteName;
            sprite.spriteIndex = i;
            sprite.width = width;
            sprite.height = height;
        }

        for (let i = 0; i < spriteCount; i++) {
            sprites[i].offsetX = fileData.get('short', 'u');
        }
        for (let i = 0; i < spriteCount; i++) {
            sprites[i].offsetY = fileData.get('short', 'u');
        }
        for (let i = 0; i < spriteCount; i++) {
            sprites[i].width = fileData.get('short', 'u');
        }
        for (let i = 0; i < spriteCount; i++) {
            sprites[i].height = fileData.get('short', 'u');
        }

        fileData.readerIndex = (fileData.length - 7 - spriteCount * 8 - (paletteLength - 1) * 3);
        const palette: number[] = new Array(paletteLength);

        for (let i = 1; i < paletteLength; i++) {
            palette[i] = fileData.get('int24');

            if (palette[i] === 0) {
                palette[i] = 1;
            }
        }

        fileData.readerIndex = 0;

        for (let i = 0; i < spriteCount; i++) {
            const sprite = sprites[i];
            const spriteWidth = sprite.width;
            const spriteHeight = sprite.height;
            const dimension = spriteWidth * spriteHeight;
            const pixelPaletteIndexes: number[] = new Array(dimension);
            const pixelAlphas: number[] = new Array(dimension);
            sprite.palette = palette;

            const flags = fileData.get('byte', 'u');

            if ((flags & 0b01) === 0) {
                for (let j = 0; j < dimension; j++) {
                    pixelPaletteIndexes[j] = fileData.get('byte');
                }
            } else {
                for (let x = 0; x < spriteWidth; x++) {
                    for (let y = 0; y < spriteHeight; y++) {
                        pixelPaletteIndexes[spriteWidth * y + x] = fileData.get('byte');
                    }
                }
            }

            if ((flags & 0b10) === 0) {
                for (let j = 0; j < dimension; j++) {
                    const index = pixelPaletteIndexes[j];
                    if (index !== 0) {
                        pixelAlphas[j] = 0xff;
                    }
                }
            } else {
                if ((flags & 0b01) === 0) {
                    for (let j = 0; j < dimension; j++) {
                        pixelAlphas[j] = fileData.get('byte');
                    }
                } else {
                    for (let x = 0; x < spriteWidth; x++) {
                        for (let y = 0; y < spriteHeight; y++) {
                            pixelAlphas[spriteWidth * y + x] = fileData.get('byte');
                        }
                    }
                }
            }

            sprite.pixelIdx = pixelPaletteIndexes;
            sprite.pixels = new Array(dimension);

            for (let j = 0; j < dimension; j++) {
                const index = pixelPaletteIndexes[j] & 0xff;
                sprite.pixels[j] = palette[index] | (pixelAlphas[j] << 24);
            }
        }

        return sprites;
    }

    static toPng(sprite: SpriteState): Uint8ClampedArray {
        sprite.pngData = new Uint8ClampedArray(sprite.width * sprite.height * 4);
        for(let x = 0; x < sprite.width; x++) {
            for(let y = 0; y < sprite.height; y++) {
                const pixel = sprite.pixels[sprite.width * y + x];
                const [ r, g, b ] = toRgb(pixel);
                const pngIndex = (sprite.width * y + x) << 2;

                sprite.pngData[pngIndex] = r;
                sprite.pngData[pngIndex + 1] = g;
                sprite.pngData[pngIndex + 2] = b;
                sprite.pngData[pngIndex + 3] = pixel >> 24;
            }
        }

        return sprite.pngData;
    }

}

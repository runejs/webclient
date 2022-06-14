import { SpriteState, SpriteTranscoder, toRgb } from '../sprites/sprite-transcoder';


export type FontName = 'p11_full' | 'p12_full' | 'b12_full' | 'q8_full' |
    'lunar_alphabet' | 'lunar_alphabet_lrg';

export const fontNames: FontName[] = [
    'p11_full',
    'p12_full',
    'b12_full',
    'q8_full',
    'lunar_alphabet',
    'lunar_alphabet_lrg',
];


export class Font {

    static fonts = new Map<string, Font>();

    readonly fontName: string;

    private sprites: SpriteState[];

    constructor(public readonly name: string) {
        this.fontName = name;
    }

    async load(): Promise<Font> {
        this.sprites = await SpriteTranscoder.getSprites(this.fontName);
        Font.fonts.set(this.fontName, this);
        return this;
    }

    drawString(
        canvasId: string,
        string: string,
        textColor: number = 0xffffff,
        dropShadow: boolean = false
    ): void {
        const canvasElement = document.getElementById(canvasId) as HTMLCanvasElement;
        const dropShadowOffset = dropShadow ? 1 : 0;
        canvasElement.width = this.getStringWidth(string) + dropShadowOffset;
        canvasElement.height = this.getStringHeight(string) + dropShadowOffset;

        const ctx = canvasElement.getContext('2d',
            { colorSpace: 'display-p3', alpha: true });

        const characters = string.split('');
        let x: number = 0;

        for (const char of characters) {
            const charPixels = this.getCharPixels(char, textColor, dropShadow);
            const charSprite = this.getSprite(char);
            const charWidth = charSprite.width + dropShadowOffset;
            const charHeight = charSprite.height + dropShadowOffset;
            const y = charSprite.offsetY;

            ctx.putImageData(
                new ImageData(
                    charPixels,
                    charWidth,
                    charHeight,
                    { colorSpace: 'display-p3'}
                ), x, y
            );

            x += charSprite.width;
        }
    }

    getCharPixels(
        char: string | number,
        color: number = 0xffffff,
        dropShadow: boolean = false
    ): Uint8ClampedArray | null {
        const sprite = this.getSprite(char);
        if (!sprite) {
            return null;
        }

        const dropShadowOffset = dropShadow ? 1 : 0;
        const totalWidth = sprite.width + dropShadowOffset;
        const totalHeight = sprite.height + dropShadowOffset;

        const charPixelData = sprite.pngData?.length ?
            sprite.pngData : SpriteTranscoder.toPng(sprite);
        const pixels = new Uint8ClampedArray((totalWidth * totalHeight) * 4);

        if (!sprite.pngData?.length) {
            sprite.pngData = charPixelData;
        }

        const [ r, g, b ] = toRgb(color);

        if (dropShadow) {
            for (let x = 0; x < sprite.width; x++) {
                for (let y = 0; y < sprite.height; y++) {
                    const charIdx = (sprite.width * y + x) << 2;
                    const pixelIdx = (totalWidth * (y + 1) + (x + 1)) << 2;

                    if(charPixelData[charIdx] !== 0) {
                        pixels[pixelIdx] = 0;
                        pixels[pixelIdx + 1] = 0;
                        pixels[pixelIdx + 2] = 0;
                        pixels[pixelIdx + 3] = 255;
                    }
                }
            }
        }

        for (let x = 0; x < sprite.width; x++) {
            for (let y = 0; y < sprite.height; y++) {
                const charIdx = (sprite.width * y + x) << 2;
                const pixelIdx = (totalWidth * y + x) << 2;

                if(charPixelData[charIdx] !== 0) {
                    pixels[pixelIdx] = r;
                    pixels[pixelIdx + 1] = g;
                    pixels[pixelIdx + 2] = b;
                    pixels[pixelIdx + 3] = 255;
                }
            }
        }

        return pixels;
    }

    getStringHeight(string: string): number {
        // We set the default font height to uppercase A for reference
        let height = this.getCharHeight('A');

        if (height === 0) {
            throw new Error('Default height couldn\'t be defined!');
        }

        for (const char of string.split('')) {
            const sprite = this.getSprite(char);
            if (!sprite) {
                continue;
            }

            // Character is above the standard line of text, for example ' characters
            if (sprite.offsetY < 0) {
                height = height + Math.abs(sprite.offsetY);
                continue;
            }

            // Add the offset to the char height to check for overflowing characters like g, y, j, etc
            const charHeight = sprite.height + sprite.offsetY;
            height = Math.max(height, charHeight);
        }

        return height;
    }

    getStringWidth(string: string): number {
        const widths = string.split('').map(stringChar => this.getCharWidth(stringChar));
        return widths.reduce((a, b) => a + b, 0);
    }

    getCharHeight(char: string | number): number {
        return this.getSprite(char)?.height || 0;
    }

    getCharWidth(char: string | number): number {
        return this.getSprite(char)?.width || 0;
    }

    getSprite(char: string | number): SpriteState | null {
        if(typeof char === 'string') {
            char = char.charCodeAt(0);
        }

        try {
            return this.sprites[char] || null;
        } catch(error) {
            console.error(`Error loading glyph ${char}`, error);
            return null;
        }
    }

}

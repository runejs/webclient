import { ByteBuffer } from "@runejs/common";
import { adjustBrightness } from "../../common/color/brightness";
import { SpriteState } from "../sprites/sprite-transcoder";
import { store } from "../store";
import { Texture, TEXTURE_INTENSITY, TEXTURE_SIZE } from "./texture";

function resizeToLibSize(s: SpriteState) {
    const imgWidth = s.width;
    const imgHeight = s.height;
    const maxWidth = TEXTURE_SIZE;
    const maxHeight = TEXTURE_SIZE;

    // TODO ?
    const xDrawOffset = 0;
    const yDrawOffset = 0;

    if (imgWidth === maxWidth && imgHeight === maxHeight) {
        return s;
    }

    const resizedPixels = new Array<number>(maxWidth * maxHeight);
    let pixelCount = 0;
    for (let y = 0; y < imgHeight; y++) {
        for (let x = 0; x < imgWidth; x++) {
            resizedPixels[x + xDrawOffset + (y + yDrawOffset) * maxWidth] =
                s.pixels[pixelCount++];
        }
    }

    const newSprite: SpriteState = {
        ...s,

        width: maxWidth,
        height: maxHeight,
        pixels: resizedPixels,
    };

    return newSprite;
}

export class TextureFileDecoder {
    static readonly textureFiles = new Map<number, Texture>();

    static async decode(textureId: number) {
        if (TextureFileDecoder.textureFiles.has(textureId)) {
            return TextureFileDecoder.textureFiles.get(textureId);
        }

        const textureData = new ByteBuffer(await store.get(9, "0", textureId));

        if (!textureData) {
            console.error(`Failed to load texture file ${textureId}`);

            return null;
        }

        console.log(`Loading texture file ${textureId}`, textureData);

        const rgb = textureData.get("short", "unsigned", "be");
        const opaque = textureData.get("byte", "unsigned") === 1;
        const spriteCount = textureData.get("byte", "unsigned");

        const spriteIds: number[] = [];

        for (let i = 0; i < spriteCount; i++) {
            spriteIds[i] = textureData.get("short", "unsigned", "be");
        }

        const renderTypes: number[] = [];

        if (spriteCount > 1) {
            for (let i = 0; i < spriteCount - 1; i++) {
                renderTypes[i] = textureData.get("byte", "unsigned");
            }
        }

        if (spriteCount > 1) {
            for (let x = 0; x < spriteCount - 1; x++) {
                // junk?
                const junk = textureData.get("byte", "unsigned");
            }
        }

        const colors: number[] = [];

        for (let i = 0; i < spriteCount; i++) {
            colors[i] = textureData.get("int", "signed", "be");
        }

        const direction = textureData.get("byte", "unsigned");
        const speed = textureData.get("byte", "unsigned");

        const texture = new Texture(
            textureId,
            rgb,
            opaque,
            spriteIds,
            renderTypes,
            colors,
            direction,
            speed
        );

        TextureFileDecoder.textureFiles.set(textureId, texture);

        await TextureFileDecoder.render(texture);

        return texture;
    }

    static async render(texture: Texture) {
        const size = TEXTURE_SIZE as number;

        const sprites: SpriteState[] = [];

        for (const spriteId of texture.spriteIds) {
            const sprite = await store.getSprite(spriteId.toString(), 0);

            sprites.push(sprite);
        }

        let colorCount = size * size;
        texture.pixels = new Array<number>(colorCount * 4);

        for (let i = 0; i < texture.spriteIds.length; i++) {
            const sprite = resizeToLibSize(sprites[i]);

            const spritePixels = sprite.pixelIdx;
            const spritePalette = sprite.palette;
            const color = texture.colors[i];

            if ((color & ~0xffffff) === 0x3000000) {
                const non_green = color & 0xff00ff;
                const g = (color >> 8) & 0xff;
                for (let p = 0; p < spritePalette.length; p++) {
                    let palette = spritePalette[p];
                    if ((palette & 0xffff) === palette >> 8) {
                        palette &= 0xff;
                        spritePalette[p] =
                            (((non_green * palette) >> 8) & 0xff00ff) |
                            ((g * palette) & 0xff00);
                    }
                }
            }

            for (let p = 0; p < spritePalette.length; p++) {
                spritePalette[p] = adjustBrightness(
                    spritePalette[p],
                    TEXTURE_INTENSITY
                );
            }

            let renderType;
            if (i === 0) {
                renderType = 0;
            } else {
                renderType = texture.renderTypes[i - 1];
            }

            if (renderType === 0) {
                if (sprite.width === size) {
                    for (let p = 0; p < colorCount; p++) {
                        texture.pixels[p] =
                            spritePalette[spritePixels[p] & 0xff];
                    }
                } else if (sprite.width === 64 && size === 128) {
                    let index = 0;
                    for (let y = 0; y < size; y++) {
                        for (let x = 0; x < size; x++) {
                            texture.pixels[index++] =
                                spritePalette[
                                    spritePixels[(x >> 1) + ((y >> 1) << 6)] &
                                        0xff
                                ];
                        }
                    }
                } else if (sprite.width === 128 && size === 64) {
                    let index = 0;
                    for (let y = 0; y < size; y++) {
                        for (let x = 0; x < size; x++) {
                            texture.pixels[index++] =
                                spritePalette[
                                    spritePixels[(x << 1) + ((y << 1) << 7)] &
                                        0xff
                                ];
                        }
                    }
                } else {
                    throw new Error();
                }
            }
        }

        for (let i = 0; i < colorCount; i++) {
            texture.pixels[i] &= 0xf8f8ff;

            const pixel = texture.pixels[i];
            texture.pixels[i + colorCount] = (pixel - (pixel >>> 3)) & 0xf8f8ff;
            texture.pixels[i + colorCount + colorCount] =
                (pixel - (pixel >>> 2)) & 0xf8f8ff;
            texture.pixels[i + colorCount + colorCount + colorCount] =
                (pixel - (pixel >>> 2) - (pixel >>> 3)) & 0xf8f8ff;
        }
    }
}

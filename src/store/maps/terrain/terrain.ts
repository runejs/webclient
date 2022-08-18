import { calculateVertexHeight } from "./height";
import { MapFile } from "../map-file";
import { MapFileDecoder } from "../map-file-decoder";
import { Overlay, Underlay } from "./floor";
import { Position } from "../position";
import { TileModel, TilePaint } from "./child";
import { Constants } from "../scene/constants";
import { TerrainTile } from "./terrain-tile";
import { getSurroundingDataIds } from "../id";
import { iadd } from "../../../common/math";
import { ColorArray } from "../../../common/color";
import { shouldSkipTileFromColor } from "../scene/utils/skipTile";

export class Terrain {
    private position: Position;

    // [4][105][105]
    private tiles: TerrainTile[][][] = new Array(4);

    constructor(position: Position) {
        this.position = position;

        for (let level = 0; level < Constants.MAX_Z; level++) {
            this.tiles[level] = new Array(Constants.SCENE_SIZE + 1);

            for (let x = 0; x < Constants.SCENE_SIZE + 1; x++) {
                this.tiles[level][x] = new Array(Constants.SCENE_SIZE + 1);
            }
        }
    }

    /**
     * Update the centre coordinate of the terrain
     *
     * @param position The new position
     */
    setPosition(position: Position) {
        this.position = position;
    }

    /**
     * Get the tile at the given coordinates
     *
     * @param level The level of the tile
     * @param tileX The x coordinate of the tile
     * @param tileY The y coordinate of the tile
     * @returns The tile
     */
    getTile(level: number, tileX: number, tileY: number): TerrainTile {
        return this.tiles[level][tileX][tileY];
    }

    /**
     * Construct a 104x104 region around the current position
     */
    async loadRegion() {
        const chunkX = this.position.chunkX + 6;
        const chunkLocalX = this.position.chunkLocalX;
        const chunkY = this.position.chunkY + 6;
        const chunkLocalY = this.position.chunkLocalY;

        const baseX = (chunkX - 6) * 8;
        const baseY = (chunkY - 6) * 8;

        const { terrainIds, coordinates } = getSurroundingDataIds(
            chunkX,
            chunkLocalX,
            chunkY,
            chunkLocalY
        );

        const { overlays, underlayIds, overlayPaths, overlayOrientations } =
            this.createFloorArrays();

        for (let pointer = 0; pointer < terrainIds.length; pointer++) {
            const offsetX = (coordinates[pointer] >> 8) * 64 - baseX;
            const offsetY = (coordinates[pointer] & 0xff) * 64 - baseY;

            const terrainId = terrainIds[pointer];

            const mapFile = await MapFileDecoder.decode(terrainId);

            await this.renderTerrainBlock(
                mapFile,
                overlays,
                underlayIds,
                overlayPaths,
                overlayOrientations,
                baseX,
                baseY,
                offsetX,
                offsetY
            );
        }

        await this.renderTileChildren(
            overlays,
            underlayIds,
            overlayPaths,
            overlayOrientations
        );
    }

    /**
     * Creates [4][105][105] arrays for the tile contents
     *
     * It goes up to 105 because the adjacent (out-of-sight) tiles are used to render row 104.
     */
    private createFloorArrays() {
        const underlayIds = this.createRegionArray<number>();
        const overlays = this.createRegionArray<Overlay>();
        const overlayPaths = this.createRegionArray<number>();
        const overlayOrientations = this.createRegionArray<number>();

        return { underlayIds, overlays, overlayPaths, overlayOrientations };
    }

    private createRegionArray<T>(): T[][][] {
        const array: T[][][] = new Array(Constants.MAX_Z);

        for (let level = 0; level < Constants.MAX_Z; level++) {
            array[level] = this.createSinglePlaneRegionArray<T>();
        }

        return array;
    }

    private createSinglePlaneRegionArray<T>(): T[][] {
        const array: T[][] = this.createSingleDimensionRegionArray();

        for (let x = 0; x < Constants.SCENE_SIZE + 1; x++) {
            array[x] = this.createSingleDimensionRegionArray();
        }

        return array;
    }

    private createSingleDimensionRegionArray<T>(): T[] {
        return new Array<T>(Constants.SCENE_SIZE + 1);
    }

    private async renderTerrainBlock(
        mapFile: MapFile,
        overlays: Overlay[][][],
        underlayIds: number[][][],
        overlayPaths: number[][][],
        overlayOrientations: number[][][],
        baseX: number,
        baseY: number,
        offsetX: number,
        offsetY: number
    ) {
        for (let plane = 0; plane < 4; plane++) {
            for (let tileX = 0; tileX < 64; tileX++) {
                for (let tileY = 0; tileY < 64; tileY++) {
                    const sceneX = tileX + offsetX;
                    const sceneY = tileY + offsetY;

                    // only render tiles that are in the current region
                    if (
                        sceneX < 0 ||
                        sceneY < 0 ||
                        sceneX > Constants.SCENE_SIZE ||
                        sceneY > Constants.SCENE_SIZE
                    ) {
                        continue;
                    }

                    await this.renderTerrainTile(
                        mapFile,
                        overlays,
                        underlayIds,
                        overlayPaths,
                        overlayOrientations,
                        tileX,
                        tileY,
                        sceneX,
                        sceneY,
                        baseX,
                        baseY,
                        plane
                    );
                }
            }
        }
    }

    private async renderTerrainTile(
        mapFile: MapFile,
        overlays: Overlay[][][],
        underlayIds: number[][][],
        overlayPaths: number[][][],
        overlayOrientations: number[][][],
        mapTileX: number,
        mapTileY: number,
        x: number,
        y: number,
        baseX: number,
        baseY: number,
        plane: number
    ) {
        // get the height of the tile from the terrain data
        const mapTileHeight = mapFile.tiles.heights[plane][mapTileX][mapTileY];

        let height = mapTileHeight;

        // some tiles height is calculated using perlin noise
        if (mapTileHeight === null) {
            height =
                -calculateVertexHeight(
                    baseX + x + 0xe3b7b,
                    baseY + y + 0x87cce
                ) * 8;
        }

        if (!this.tiles[plane][x][y]) {
            this.tiles[plane][x][y] = new TerrainTile(plane, x, y);
        }

        this.tiles[plane][x][y].setHeight(height);

        const underlayId = mapFile.tiles.underlayIds[plane][mapTileX][mapTileY];
        const overlayId = mapFile.tiles.overlayIds[plane][mapTileX][mapTileY];

        underlayIds[plane][x][y] = underlayId;

        // TODO maybe not -1 here??
        overlays[plane][x][y] =
            overlayId > 0 ? await Overlay.decode(overlayId - 1) : null;

        overlayPaths[plane][x][y] =
            mapFile.tiles.overlayPaths[plane][mapTileX][mapTileY];
        overlayOrientations[plane][x][y] =
            mapFile.tiles.overlayOrientations[plane][mapTileX][mapTileY];
    }

    private async renderTileChildren(
        overlays: Overlay[][][],
        underlayIds: number[][][],
        overlayPaths: number[][][],
        overlayOrientations: number[][][]
    ) {
        for (let plane = 0; plane < Constants.MAX_Z; plane++) {
            const shadowIntensity = this.createSinglePlaneRegionArray<number>();
            const lightIntensity = this.createSinglePlaneRegionArray<number>();

            const directionalLightIntensityInitial = 96;
            const specularDistributionFactor = 768;
            const directionalLightX = -50;
            const directionalLightZ = -10;
            const directionalLightY = -50;

            const directionalLightLength =
                Math.sqrt(
                    directionalLightX * directionalLightX +
                        directionalLightZ * directionalLightZ +
                        directionalLightY * directionalLightY
                ) | 0;

            const specularDistribution =
                ((specularDistributionFactor * directionalLightLength) >> 8) |
                0;

            for (let x = 1; x < Constants.SCENE_SIZE - 1; x++) {
                for (let y = 1; y < Constants.SCENE_SIZE - 1; y++) {
                    const heightDifferenceX =
                        this.tiles[plane][x + 1][y].getHeight() -
                        this.tiles[plane][x - 1][y].getHeight();
                    const heightDifferenceY =
                        this.tiles[plane][x][y + 1].getHeight() -
                        this.tiles[plane][x][y - 1].getHeight();

                    const normalisedLength =
                        Math.sqrt(
                            heightDifferenceX * heightDifferenceX +
                                0x10000 +
                                heightDifferenceY * heightDifferenceY
                        ) | 0;

                    const normalisedX =
                        ((heightDifferenceX << 8) / normalisedLength) | 0;
                    const normalisedZ = (0x10000 / normalisedLength) | 0;
                    const normalisedY =
                        ((heightDifferenceY << 8) / normalisedLength) | 0;

                    const directionalLightIntensity =
                        (directionalLightIntensityInitial +
                            (directionalLightX * normalisedX +
                                directionalLightZ * normalisedZ +
                                directionalLightY * normalisedY) /
                                specularDistribution) |
                        0;
                    const weightedShadowIntensity = iadd(
                        shadowIntensity[x - 1][y] >> 2,
                        iadd(
                            shadowIntensity[x + 1][y] >> 3,
                            iadd(
                                shadowIntensity[x][y - 1] >> 2,
                                iadd(
                                    shadowIntensity[x][y + 1] >> 3,
                                    shadowIntensity[x][y] >> 1
                                )
                            )
                        )
                    );

                    lightIntensity[x][y] =
                        directionalLightIntensity - weightedShadowIntensity;
                }
            }

            const blendedHue = this.createSingleDimensionRegionArray<number>();
            const blendedSaturation =
                this.createSingleDimensionRegionArray<number>();
            const blendedLightness =
                this.createSingleDimensionRegionArray<number>();
            const blendedHueMultiplier =
                this.createSingleDimensionRegionArray<number>();
            const blendDirectionTracker =
                this.createSingleDimensionRegionArray<number>();

            for (let y = 0; y < Constants.SCENE_SIZE; y++) {
                blendedHue[y] = 0;
                blendedSaturation[y] = 0;
                blendedLightness[y] = 0;
                blendedHueMultiplier[y] = 0;
                blendDirectionTracker[y] = 0;
            }

            for (let x = -5; x < Constants.SCENE_SIZE + 5; x++) {
                for (let y = 0; y < Constants.SCENE_SIZE; y++) {
                    const positiveX = x + 5;
                    if (positiveX >= 0 && positiveX < Constants.SCENE_SIZE) {
                        const underlayId = underlayIds[plane][positiveX][y];

                        if (underlayId > 0) {
                            const underlay = await Underlay.decode(
                                underlayId - 1
                            );

                            blendedHue[y] = blendedHue[y] + underlay.color.hue;
                            blendedSaturation[y] =
                                blendedSaturation[y] +
                                underlay.color.saturation;
                            blendedLightness[y] =
                                blendedLightness[y] + underlay.color.lightness;
                            blendedHueMultiplier[y] =
                                blendedHueMultiplier[y] +
                                underlay.color.hueMultiplier;
                            blendDirectionTracker[y] =
                                blendDirectionTracker[y] + 1;
                        }
                    }

                    const negativeX = x - 5;
                    if (negativeX >= 0 && negativeX < Constants.SCENE_SIZE) {
                        const underlayId = underlayIds[plane][negativeX][y];

                        if (underlayId > 0) {
                            const underlay = await Underlay.decode(
                                underlayId - 1
                            );

                            blendedHue[y] = blendedHue[y] - underlay.color.hue;
                            blendedSaturation[y] =
                                blendedSaturation[y] -
                                underlay.color.saturation;
                            blendedLightness[y] =
                                blendedLightness[y] - underlay.color.lightness;
                            blendedHueMultiplier[y] =
                                blendedHueMultiplier[y] -
                                underlay.color.hueMultiplier;
                            blendDirectionTracker[y] =
                                blendDirectionTracker[y] - 1;
                        }
                    }
                }

                // ignore the outer edge of tiles
                if (x < 1 || x >= Constants.SCENE_SIZE - 1) {
                    continue;
                }

                let underlayBlendHue = 0;
                let underlayBlendSaturation = 0;
                let underlayBlendLightness = 0;
                let underlayBlendHueMultiplier = 0;
                let underlayBlendDirection = 0;

                for (let y = -5; y < Constants.SCENE_SIZE + 5; y++) {
                    const positiveY = y + 5;
                    if (positiveY >= 0 && positiveY < Constants.SCENE_SIZE) {
                        underlayBlendHue += blendedHue[positiveY];
                        underlayBlendSaturation += blendedSaturation[positiveY];
                        underlayBlendLightness += blendedLightness[positiveY];
                        underlayBlendHueMultiplier +=
                            blendedHueMultiplier[positiveY];
                        underlayBlendDirection +=
                            blendDirectionTracker[positiveY];
                    }
                    const negativeY = y - 5;
                    if (negativeY >= 0 && negativeY < Constants.SCENE_SIZE) {
                        underlayBlendHue -= blendedHue[negativeY];
                        underlayBlendSaturation -= blendedSaturation[negativeY];
                        underlayBlendLightness -= blendedLightness[negativeY];
                        underlayBlendHueMultiplier -=
                            blendedHueMultiplier[negativeY];
                        underlayBlendDirection -=
                            blendDirectionTracker[negativeY];
                    }

                    // ignore the outer edge of tiles
                    if (y < 1 || y >= Constants.SCENE_SIZE - 1) {
                        continue;
                    }

                    if (!this.tiles[plane][x][y]) {
                        this.tiles[plane][x][y] = new TerrainTile(plane, x, y);
                    }

                    const tile = this.tiles[plane][x][y];

                    const overlay = overlays[plane][x][y];
                    const underlayId = underlayIds[plane][x][y];

                    if (plane > 0) {
                        // culling here
                    }

                    if (underlayId > 0 || overlay) {
                        const vertexHeightSW = this.getTile(
                            plane,
                            x,
                            y
                        ).getHeight();
                        const vertexHeightSE = this.getTile(
                            plane,
                            x + 1,
                            y
                        ).getHeight();
                        const vertexHeightNE = this.getTile(
                            plane,
                            x + 1,
                            y + 1
                        ).getHeight();
                        const vertexHeightNW = this.getTile(
                            plane,
                            x,
                            y + 1
                        ).getHeight();

                        const lightIntensitySW = lightIntensity[x][y];
                        const lightIntensitySE = lightIntensity[x + 1][y];
                        const lightIntensityNE = lightIntensity[x + 1][y + 1];
                        const lightIntensityNW = lightIntensity[x][y + 1];

                        if (overlay) {
                            /**
                             * Rendering a TileModel
                             */

                            const shape = overlayPaths[plane][x][y] + 1;
                            const orientation =
                                overlayOrientations[plane][x][y];

                            let textureId = overlay.texture;

                            let overlayColor: number;

                            if (textureId >= 0) {
                                overlayColor = -1;
                            } else if (shouldSkipTileFromColor(overlay.color.rgb)) {
                                overlayColor = -2;
                                textureId = -1;
                            } else {
                                overlayColor = generateHSL(
                                    overlay.color.hue,
                                    overlay.color.saturation,
                                    overlay.color.lightness
                                );
                            }

                            const flat =
                                vertexHeightSW === vertexHeightSE &&
                                vertexHeightSW === vertexHeightNE &&
                                vertexHeightSW === vertexHeightNW;

                            function getUnderlayColorArr(lightIntensity: number) {
                                return hslToRgbArray(mixLightnessSignedHSL(overlayColor, lightIntensity));
                            }
                                
                            function getUnderlayColor(lightIntensity: number) {
                                return mixLightnessSignedHSL(overlayColor, lightIntensity);
                            }
                            
                            function getOverlayColor(lightIntensity: number) {
                                return mixLightnessHSL(overlayColor, lightIntensity);
                            }

                            if (shape === 1) {
                                // render plain tile
                                tile.setTilePaint(
                                    new TilePaint(
                                        getUnderlayColorArr(lightIntensityNE),
                                        getUnderlayColorArr(lightIntensityNW),
                                        getUnderlayColorArr(lightIntensitySE),
                                        getUnderlayColorArr(lightIntensitySW),
                                        flat,
                                        textureId
                                    )
                                );
                            } else {
                                const tileModel = new TileModel(
                                    x,
                                    y,
                                    vertexHeightNE,
                                    vertexHeightNW,
                                    vertexHeightSE,
                                    vertexHeightSW,

                                    // TODO these colours need moving into RGB
                                    getUnderlayColor(lightIntensityNE),
                                    getOverlayColor(lightIntensityNE),
                                    getUnderlayColor(lightIntensityNW),
                                    getOverlayColor(lightIntensityNW),
                                    getUnderlayColor(lightIntensitySE),
                                    getOverlayColor(lightIntensitySE),
                                    getUnderlayColor(lightIntensitySW),
                                    getOverlayColor(lightIntensitySW),

                                    shape,
                                    orientation,
                                    textureId
                                );

                                tile.setTileModel(tileModel);
                            }
                        } else {
                            /**
                             * Rendering a TilePaint
                             */

                            const h =
                                ((underlayBlendHue * 256) /
                                    underlayBlendHueMultiplier) |
                                0;
                            const s =
                                (underlayBlendSaturation /
                                    underlayBlendDirection) |
                                0;
                            const l =
                                (underlayBlendLightness /
                                    underlayBlendDirection) |
                                0;

                            const underlayColor = generateHSL(h, s, l);

                            const colorSW = hslToRgbArray(
                                mixLightnessHSL(underlayColor, lightIntensitySW)
                            );
                            const colorSE = hslToRgbArray(
                                mixLightnessHSL(underlayColor, lightIntensitySE)
                            );
                            const colorNE = hslToRgbArray(
                                mixLightnessHSL(underlayColor, lightIntensityNE)
                            );
                            const colorNW = hslToRgbArray(
                                mixLightnessHSL(underlayColor, lightIntensityNW)
                            );

                            // render plain tile
                            tile.setTilePaint(
                                new TilePaint(
                                    colorNE,
                                    colorNW,
                                    colorSE,
                                    colorSW,
                                    false,
                                    -1
                                )
                            );
                        }
                    }
                }
            }
        }
    }
}

function generateHSL(h: number, s: number, l: number) {
    if (l > 179) {
        s /= 2;
    }

    if (l > 192) {
        s /= 2;
    }

    if (l > 217) {
        s /= 2;
    }

    if (l > 243) {
        s /= 2;
    }

    return (((h / 4) << 10) + ((s / 32) << 7) + l / 2) | 0;
}

function mixLightnessHSL(hslInt: number, lightness: number) {
    lightness = (((hslInt & 0x7f) * lightness) / 128) | 0;

    if (lightness < 2) {
        lightness = 2;
    } else if (lightness > 126) {
        lightness = 126;
    }

    return (hslInt & 0xff80) + lightness;
}

function mixLightnessSignedHSL(hslInt: number, lightness: number) {
    if (hslInt === -2) {
        return 12345678;
    }

    if (hslInt === -1) {
        if (lightness < 0) lightness = 0;
        else if (lightness > 127) lightness = 127;
        lightness = 127 - lightness;
        return lightness;
    }

    lightness = (((hslInt & 0x7f) * lightness) / 128) | 0;

    if (lightness < 2) {
        lightness = 2;
    } else if (lightness > 126) {
        lightness = 126;
    }

    return (hslInt & 0xff80) + lightness;
}

function hslToRgbArray(hsl: number) {
    const h = (hsl >> 10) & 0x3f;
    const s = (hsl >> 7) & 7;
    const l = hsl & 0x7f;

    const rgb: ColorArray = [
        ((h / 63) * 255) | 0,
        ((s / 7) * 255) | 0,
        ((l / 127) * 255) | 0,
    ];

    return rgb;
}

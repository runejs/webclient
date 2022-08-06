import { calculateVertexHeight } from "./height";
import { MapFile } from "../map-file";
import { MapFileDecoder } from "../map-file-decoder";
import { Overlay, Underlay } from "./floor";
import { Position } from "../position";
import { TilePaint } from "./child";
import { Constants } from "../scene/constants";
import { TerrainTile } from "./terrain-tile";
import { getSurroundingDataIds } from "../id";

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

    setPosition(position: Position) {
        this.position = position;
    }

    getTile(tileZ: number, tileX: number, tileY: number) {
        return this.tiles[tileZ][tileX][tileY];
    }

    // Landscape.loadRegion
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

        const { overlays, underlays } = this.createFloorArrays();

        for (let pointer = 0; pointer < terrainIds.length; pointer++) {
            const offsetX = (coordinates[pointer] >> 8) * 64 - baseX;
            const offsetY = (coordinates[pointer] & 0xff) * 64 - baseY;

            const terrainId = terrainIds[pointer];

            const mapFile = await MapFileDecoder.decode(terrainId);

            await this.renderTerrainBlock(
                mapFile,
                overlays,
                underlays,
                (chunkX - 6) * 8,
                (chunkY - 6) * 8,
                offsetX,
                offsetY
            );
        }

        this.renderTilePaints(overlays, underlays);
    }

    // [4][105][105]
    private createFloorArrays() {
        const underlays: Underlay[][][] = new Array(4);
        const overlays: Overlay[][][] = new Array(4);

        for (let level = 0; level < Constants.MAX_Z; level++) {
            underlays[level] = new Array(Constants.SCENE_SIZE + 1);
            overlays[level] = new Array(Constants.SCENE_SIZE + 1);

            for (let x = 0; x < Constants.SCENE_SIZE + 1; x++) {
                underlays[level][x] = new Array(Constants.SCENE_SIZE + 1);
                overlays[level][x] = new Array(Constants.SCENE_SIZE + 1);
            }
        }

        return { underlays, overlays };
    }

    private async renderTerrainBlock(
        mapFile: MapFile,
        overlays: Overlay[][][],
        underlays: Underlay[][][],
        regionX_maybe: number,
        regionY_maybe: number,
        offsetX: number,
        offsetY: number
    ) {
        for (let plane = 0; plane < 4; plane++) {
            for (let tileX = 0; tileX < 64; tileX++) {
                for (let tileY = 0; tileY < 64; tileY++) {
                    await this.renderTerrainTile(
                        mapFile,
                        overlays,
                        underlays,
                        tileX,
                        tileY,
                        offsetX,
                        offsetY,
                        regionX_maybe,
                        regionY_maybe,
                        plane
                    );
                }
            }
        }
    }

    private async renderTerrainTile(
        mapFile: MapFile,
        overlays: Overlay[][][],
        underlays: Underlay[][][],
        tileX: number,
        tileY: number,
        offsetX: number,
        offsetY: number,
        regionX: number,
        regionY: number,
        plane: number
    ) {
        const x = tileX + offsetX;
        const y = tileY + offsetY;

        // only render tiles that are in the current region
        if (
            x < 0 ||
            y < 0 ||
            x > Constants.SCENE_SIZE ||
            y > Constants.SCENE_SIZE
        ) {
            return;
        }

        // get the height of the tile from the terrain data
        const mapTileHeight = mapFile.tiles.heights[plane][tileX][tileY];

        let height = mapTileHeight;

        // some tiles height is calculated using perlin noise
        if (mapTileHeight === null) {
            height =
                -calculateVertexHeight(
                    x + regionX + 0xe3b7b,
                    y + regionY + 0x87cce
                ) * 8;
        }

        if (!this.tiles[plane][x][y]) {
            this.tiles[plane][x][y] = new TerrainTile(plane, x, y);
        }

        this.tiles[plane][x][y].setHeight(height);

        const underlayId = mapFile.tiles.underlayIds[plane][tileX][tileY];
        const overlayId = mapFile.tiles.overlayIds[plane][tileX][tileY];

        underlays[plane][x][y] =
            underlayId > 0 ? await Underlay.decode(underlayId) : null;
        overlays[plane][x][y] =
            overlayId > 0 ? await Overlay.decode(overlayId) : null;
    }

    private renderTilePaints(
        overlays: Overlay[][][],
        underlays: Underlay[][][]
    ) {
        for (let plane = 0; plane < Constants.MAX_Z; plane++) {
            // ignore the outer edge of tiles
            for (let x = 1; x < Constants.SCENE_SIZE; x++) {
                for (let y = 1; y < Constants.SCENE_SIZE; y++) {
                    if (!this.tiles[plane][x][y]) {
                        this.tiles[plane][x][y] = new TerrainTile(plane, x, y);
                    }

                    const tile = this.tiles[plane][x][y];

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

                    const overlay = overlays[plane][x][y];
                    const underlay = underlays[plane][x][y];

                    if (underlay || overlay) {
                        // blend lighting here

                        if (plane > 0) {
                            // culling here
                        }

                        if (!overlay) {
                            // render plain tile
                            tile.setTilePaint(
                                new TilePaint(
                                    underlay.color.toColorArray(),
                                    underlay.color.toColorArray(),
                                    underlay.color.toColorArray(),
                                    underlay.color.toColorArray(),
                                    false
                                )
                            );
                        } else {
                            // render shaped tile (or plane tile if no clipping paths)
                            const clippingPath = 1;

                            // TODO shaped tiles

                            const flat =
                                vertexHeightSW == vertexHeightSE &&
                                vertexHeightSW == vertexHeightNE &&
                                vertexHeightSW == vertexHeightNW;

                            if (overlay.texture && overlay.texture !== -1) {
                                // TODO handle textures
                                tile.setTilePaint(
                                    new TilePaint(
                                        [203, 192, 255],
                                        [203, 192, 255],
                                        [203, 192, 255],
                                        [203, 192, 255],
                                        flat
                                    )
                                );
                            }

                            if (overlay.color) {
                                tile.setTilePaint(
                                    new TilePaint(
                                        overlay.color.toColorArray(),
                                        overlay.color.toColorArray(),
                                        overlay.color.toColorArray(),
                                        overlay.color.toColorArray(),
                                        flat
                                    )
                                );
                            }
                        }
                    }
                }
            }
        }
    }
}

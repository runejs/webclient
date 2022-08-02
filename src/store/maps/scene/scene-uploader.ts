import { MapFile } from "../map-file";
import { TilePaint } from "./child";
import { Constants } from "./constants";
import { Scene } from "./scene";
import { Tile } from "./tile";

const LOCAL_COORD_BITS = 7;

const Perspective = {
    LOCAL_TILE_SIZE: 1 << LOCAL_COORD_BITS, // 128 - size of a tile in local coordinates

    SCENE_SIZE: 104, // in tiles
};

function getHeight(heights: number[][][], level: number, x: number, y: number): number {
    if (level >= heights.length) {
        return 0;
    }

    const heightLevel = heights[level];

    if (x >= heightLevel.length) {
        return 0;
    }

    const heightX = heightLevel[x];

    if (y >= heightX.length) {
        return 0;
    }

    return heightX[y] / 3;
}

export function uploadScene(
    mapFile: MapFile,
    scene: Scene,
    vertices: number[],
    colors: number[],
) {
    for (let z = 0; z < Constants.MAX_Z; ++z) {
        for (let x = 0; x < Constants.SCENE_SIZE; ++x) {
            for (let y = 0; y < Constants.SCENE_SIZE; ++y) {
                const tile = scene.getTiles()[z][x][y];

                if (tile) {
                    upload(mapFile, tile, vertices, colors);
                }
            }
        }
    }
}

function upload(mapFile: MapFile, tile: Tile, vertices: number[], colors: number[]) {
    const bridge = tile.getBridge();

    if (bridge) {
        upload(mapFile, bridge, vertices, colors);
    }

    const tilePaint = tile.getTilePaint();

    if (tilePaint) {
        // manage buffer offsets

        const len = uploadTilePaint(mapFile, tile, tilePaint, vertices, colors);

        // manage offset
    }

    // model
    // wall object
    // ground object
    // decorative object
    // game objects
}

function uploadTilePaint(
    mapFile: MapFile,
    t: Tile,
    tile: TilePaint,
    vertices: number[],
    colors: number[],
): number {
    const {
        tiles: { heights: tileHeights },
    } = mapFile;

    const tileZ = t.getPlane();
    const tileX = t.getX();
    const tileY = t.getY();

    const localX = tileX * Perspective.LOCAL_TILE_SIZE;
    const localY = tileY * Perspective.LOCAL_TILE_SIZE;

    const swHeight = getHeight(tileHeights, tileZ, tileX, tileY);
    const seHeight = getHeight(tileHeights, tileZ, tileX + 1, tileY);
    const neHeight = getHeight(tileHeights, tileZ, tileX + 1, tileY + 1);
    const nwHeight = getHeight(tileHeights, tileZ, tileX, tileY + 1);

    const neColor = tile.colorNE;
    const nwColor = tile.colorNW;
    const seColor = tile.colorSE;
    const swColor = tile.colorSW;

    // TODO what is 12345678 in colours we understand
    // if (neColor === 12345678) {
    //     return 0;
    // }

    // 0,0
    const vertexDx = localX;
    const vertexDy = localY;
    const vertexDz = swHeight;
    const c1 = swColor;

    // 1,0
    const vertexCx = localX + Perspective.LOCAL_TILE_SIZE;
    const vertexCy = localY;
    const vertexCz = seHeight;
    const c2 = seColor;

    // 1,1
    const vertexAx = localX + Perspective.LOCAL_TILE_SIZE;
    const vertexAy = localY + Perspective.LOCAL_TILE_SIZE;
    const vertexAz = neHeight;
    const c3 = neColor;

    // 0,1
    const vertexBx = localX;
    const vertexBy = localY + Perspective.LOCAL_TILE_SIZE;
    const vertexBz = nwHeight;
    const c4 = nwColor;

    vertices.push(vertexAx, vertexAz, vertexAy);
    colors.push(...c3);
    vertices.push(vertexBx, vertexBz, vertexBy);
    colors.push(...c4);
    vertices.push(vertexCx, vertexCz, vertexCy);
    colors.push(...c2);

    vertices.push(vertexDx, vertexDz, vertexDy);
    colors.push(...c1);
    vertices.push(vertexCx, vertexCz, vertexCy);
    colors.push(...c2);
    vertices.push(vertexBx, vertexBz, vertexBy);
    colors.push(...c4);

    return 6;
}

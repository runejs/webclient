import { BufferGeometry } from "three";
import { Terrain, TerrainTile } from "../terrain";
import { Constants } from "./constants";
import { uploadTileModel, uploadTilePaint } from "./uploaders";

/**
 * To enable TileModel rendering, set this to true
 */
const RENDER_TILE_MODELS = false;

export async function uploadTerrain(
    terrain: Terrain,
    geometry: BufferGeometry,
    offset: number,
    vertices: number[],
    colors: number[],
    uvs: number[],
) {
    // TODO render other planes
    let z = 0;
    // for (let z = 0; z < Constants.MAX_Z; ++z) {
    for (let x = 0; x < Constants.SCENE_SIZE; ++x) {
        for (let y = 0; y < Constants.SCENE_SIZE; ++y) {
            const tile = terrain.getTile(z, x, y);

            if (tile) {
                const { offset: newOffset } = await upload(
                    terrain,
                    tile,
                    geometry,
                    offset,
                    vertices,
                    colors,
                    uvs,
                );

                offset = newOffset;
            }
        }
    }
    // }
}

async function upload(
    terrain: Terrain,
    tile: TerrainTile,
    geometry: BufferGeometry,
    offset: number,
    vertices: number[],
    colors: number[],
    uvs: number[],
) {
    // TODO bridges
    // const bridge = tile.getBridge();
    // if (bridge) {
    //     const { length } = await upload(terrain, tile, bridge, vertices, colors);
    // }

    const tilePaint = tile.getTilePaint();

    if (tilePaint) {
        const { length, textureId } = await uploadTilePaint(
            terrain,
            tile,
            tilePaint,
            vertices,
            colors,
            uvs,
        );

        geometry.addGroup(offset, length, textureId + 1);

        offset += length;
    }

    if (RENDER_TILE_MODELS) {
        const tileModel = tile.getTileModel();
        
        if (tileModel) {
            const { length, textureId } = uploadTileModel(terrain, tile, tileModel, vertices, colors, uvs);
        
            geometry.addGroup(offset, length, textureId + 1);
        
            offset += length;
        }
    }


    // TODO other items - or should they live elsewhere `GameWorld`?
    // model
    // wall object
    // ground object
    // decorative object
    // game objects

    return { offset };
}

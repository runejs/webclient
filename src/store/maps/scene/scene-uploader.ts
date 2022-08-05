import { Terrain, TilePaint, TerrainTile } from "../terrain";
import { Constants } from "./constants";
import { uploadTilePaint } from "./uploaders";

export function uploadScene(
    terrain: Terrain,
    vertices: number[],
    colors: number[],
) {
    // TODO render other planes
    let z = 0;
    // for (let z = 0; z < Constants.MAX_Z; ++z) {
        for (let x = 0; x < Constants.SCENE_SIZE; ++x) {
            for (let y = 0; y < Constants.SCENE_SIZE; ++y) {
                const tile = terrain.getTile(z, x, y);

                if (tile) {
                    upload(terrain, tile, vertices, colors);
                }
            }
        }
    // }
}

function upload(terrain: Terrain, tile: TerrainTile, vertices: number[], colors: number[]) {
    // const bridge = tile.getBridge();

    // if (bridge) {
    //     upload(terrain, tile, bridge, vertices, colors);
    // }

    const tilePaint = tile.getTilePaint();

    if (tilePaint) {
        // manage buffer offsets

        const len = uploadTilePaint(terrain, tile, tilePaint, vertices, colors);

        // manage offset
    }

    // model
    // wall object
    // ground object
    // decorative object
    // game objects
}



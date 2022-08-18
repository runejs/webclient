import { Terrain, TerrainTile, TilePaint } from "../../terrain";
import { Constants } from "../constants";
import { shouldSkipTileFromColor } from "../utils/skipTile";

/**
 * Upload a `TilePaint` for a given `TerrainTile` to the 3D arrays
 * 
 * @param terrain The parent Terrain
 * @param swTile The parent TerrainTile
 * @param tilePaint The TilePaint to upload
 * @param vertices The output vertex array
 * @param colors The output color array
 * @param uvs The output UV array
 * @returns `length` as number of vertices added, `textureId` as the texture id for the tile
 */
export async function uploadTilePaint(
    terrain: Terrain,
    swTile: TerrainTile,
    tilePaint: TilePaint,
    vertices: number[],
    colors: number[],
    uvs: number[],
) {
    const tileX = swTile.getX();
    const tileY = swTile.getY();
    const tileZ = swTile.getPlane();

    // looks like the RS client skips the outer edge of the region (I guess so it can match up heights from adjacent tiles without going out of bounds)
    if (tileX < 1 || tileX >= Constants.SCENE_SIZE - 1 || tileY < 1 || tileY >= Constants.SCENE_SIZE - 1) {
        return { length: 0, textureId: -1 };
    }

    const seTile = terrain.getTile(tileZ, tileX + 1, tileY);
    const neTile = terrain.getTile(tileZ, tileX + 1, tileY + 1);
    const nwTile = terrain.getTile(tileZ, tileX, tileY + 1);

    const localX = (tileX - 1) * Constants.LOCAL_TILE_SIZE;
    const localY = (tileY - 1) * Constants.LOCAL_TILE_SIZE;

    const swHeight = swTile.getHeight();
    const seHeight = seTile.getHeight();
    const neHeight = neTile.getHeight();
    const nwHeight = nwTile.getHeight();

    const { colorSW, colorSE, colorNE, colorNW } = tilePaint;

    if (shouldSkipTileFromColor(colorNE)) {
        return { length: 0, textureId: -1 };
    }

    // 0,0
    const vertexSWx = localX;
    const vertexSWy = localY;
    const vertexSWz = swHeight;

    // 1,0
    const vertexSEx = localX + Constants.LOCAL_TILE_SIZE;
    const vertexSEy = localY;
    const vertexSEz = seHeight;

    // 1,1
    const vertexNEx = localX + Constants.LOCAL_TILE_SIZE;
    const vertexNEy = localY + Constants.LOCAL_TILE_SIZE;
    const vertexNEz = neHeight;

    // 0,1
    const vertexNWx = localX;
    const vertexNWy = localY + Constants.LOCAL_TILE_SIZE;
    const vertexNWz = nwHeight;

    // push the vertices as 2 triangles
    vertices.push(vertexNEx, vertexNEz, vertexNEy);
    colors.push(...colorNE);
    uvs.push(1, 0, 1);
    vertices.push(vertexNWx, vertexNWz, vertexNWy);
    colors.push(...colorNW);
    uvs.push(0, 0, 1);
    vertices.push(vertexSEx, vertexSEz, vertexSEy);
    colors.push(...colorSE);
    uvs.push(1, 0, 0);

    vertices.push(vertexSWx, vertexSWz, vertexSWy);
    colors.push(...colorSW);
    uvs.push(0, 0, 0);
    vertices.push(vertexSEx, vertexSEz, vertexSEy);
    colors.push(...colorSE);
    uvs.push(1, 0, 0);
    vertices.push(vertexNWx, vertexNWz, vertexNWy);
    colors.push(...colorNW);
    uvs.push(0, 0, 1);

    return {
        length: 6,
        textureId : tilePaint.textureId
    };
}

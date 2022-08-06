import { Terrain, TerrainTile, TilePaint } from "../../terrain";
import { Constants } from "../constants";
import { shouldSkipTileFromColor } from "../utils/skipTile";

export function uploadTilePaint(
    terrain: Terrain,
    swTile: TerrainTile,
    tilePaint: TilePaint,
    vertices: number[],
    colors: number[],
): number {
    const tileX = swTile.getX();
    const tileY = swTile.getY();
    const tileZ = swTile.getPlane();

    // looks like the RS client skips the outer edge of the region (I guess so it can match up heights from adjacent tiles without going out of bounds)
    if (tileX < 1 || tileX >= Constants.SCENE_SIZE - 1 || tileY < 1 || tileY >= Constants.SCENE_SIZE - 1) {
        return 0;
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
        return 0;
    }

    // 0,0
    const vertexDx = localX;
    const vertexDy = localY;
    const vertexDz = swHeight;
    const c1 = colorSW;

    // 1,0
    const vertexCx = localX + Constants.LOCAL_TILE_SIZE;
    const vertexCy = localY;
    const vertexCz = seHeight;
    const c2 = colorSE;

    // 1,1
    const vertexAx = localX + Constants.LOCAL_TILE_SIZE;
    const vertexAy = localY + Constants.LOCAL_TILE_SIZE;
    const vertexAz = neHeight;
    const c3 = colorNE;

    // 0,1
    const vertexBx = localX;
    const vertexBy = localY + Constants.LOCAL_TILE_SIZE;
    const vertexBz = nwHeight;
    const c4 = colorNW;

    // push the vertices as 2 triangles
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

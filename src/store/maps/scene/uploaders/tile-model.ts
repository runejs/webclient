import { iadd } from "../../../../common/math";
import { Terrain, TerrainTile, TileModel } from "../../terrain";
import { Constants } from "../constants";

export function uploadTileModel(
    terrain: Terrain,
    tile: TerrainTile,
    tileModel: TileModel,
    vertices: number[],
    colors: number[],
    uvs: number[],
) {
    const tileX = tile.getX();
    const tileY = tile.getY();

    const {
        faceX,
        faceY,
        faceZ,
        vertexX,
        vertexY,
        vertexZ,
        triangleColorA,
        triangleColorB,
        triangleColorC,
        triangleTextureId,
    } = tileModel.getRenderInfo();

    const faceCount = faceX.length;

    const localX = (tileX - 1) * Constants.LOCAL_TILE_SIZE;
    const localY = (tileY - 1) * Constants.LOCAL_TILE_SIZE;

    let textureId = -1;

    let counter = 0;
    for (let i = 0; i < faceCount; i++) {
        const triangleA = faceX[i];
        const triangleB = faceY[i];
        const triangleC = faceZ[i];

        const colorA = triangleColorA[i];
        const colorB = triangleColorB[i];
        const colorC = triangleColorC[i];

        // TODO use shouldSkipTileFromColor
        if (colorA === 12345678) {
            continue;
        }

        counter += 3;

        const vertexXA = iadd(localX, vertexX[triangleA]);
        const vertexZA = iadd(localY, vertexZ[triangleA]);
        const vertexXB = iadd(localX, vertexX[triangleB]);
        const vertexZB = iadd(localY, vertexZ[triangleB]);
        const vertexXC = iadd(localX, vertexX[triangleC]);
        const vertexZC = iadd(localY, vertexZ[triangleC]);

        // TODO map these colors properly
        // TODO look at drawShadedTrianglefrom 435

        vertices.push(vertexXA, vertexY[triangleA], vertexZA);
        // colors.push(...palette[(( colorA << 15 ) >> 7) >> 8]);
        colors.push(0, 0, 255);
        uvs.push((vertexXA / 128) | 0, (vertexZA / 128) | 0, 0);

        vertices.push(vertexXB, vertexY[triangleB], vertexZB);
        // colors.push(...palette[(( colorB << 15 ) >> 7) >> 8]);
        colors.push(0, 0, 255);
        uvs.push((vertexXB / 128) | 0, (vertexZB / 128) | 0, 0);

        vertices.push(vertexXC, vertexY[triangleC], vertexZC);
        // colors.push(...palette[(( colorC << 15 ) >> 7) >> 8]);
        colors.push(0, 0, 255);
        uvs.push((vertexXC / 128) | 0, (vertexZC / 128) | 0, 0);

        if (triangleTextureId !== null) {
            textureId = triangleTextureId[i];
        }
    }

    return {
        length: counter,
        textureId,
    };
}

import { ByteBuffer } from '@runejs/common';
import { MapFile } from './map-file';
import { store } from '../store';
import { perlinNoise } from './perlin-noise';


export class MapFileTranscoder {

    static readonly mapFiles = new Map<string, MapFile>();

    static async decode(mapFileName: string): Promise<MapFile | null> {
        if (MapFileTranscoder.mapFiles.has(mapFileName)) {
            return MapFileTranscoder.mapFiles.get(mapFileName);
        }

        const fileData = new ByteBuffer(await store.get(5, mapFileName));
        if (!fileData) {
            return null;
        }

        const mapFile = new MapFile(mapFileName);
        const offsetX = 0;
        const offsetY = 0;

        const {
            heights,
            overlayPaths,
            overlayOrientations,
            overlayIds,
            underlayIds,
            settings
        } = mapFile.tiles;

        for (let level = 0; level < 4; level++) {
            heights[level] = new Array(64);
            overlayPaths[level] = new Array(64);
            overlayOrientations[level] = new Array(64);
            overlayIds[level] = new Array(64);
            underlayIds[level] = new Array(64);
            settings[level] = new Array(64);

            for (let x = 0; x < 64; x++) {
                heights[level][x] = new Array(64);
                overlayPaths[level][x] = new Uint8Array(64);
                overlayOrientations[level][x] = new Uint8Array(64);
                overlayIds[level][x] = new Uint8Array(64);
                underlayIds[level][x] = new Uint8Array(64);
                settings[level][x] = new Uint8Array(64);

                for (let y = 0; y < 64; y++) {
                    heights[level][x][y] = 0;
                    overlayPaths[level][x][y] = 0;
                    overlayOrientations[level][x][y] = 0;
                    overlayIds[level][x][y] = 0;
                    underlayIds[level][x][y] = 0;
                    settings[level][x][y] = 0;
                }
            }
        }

        for (let level = 0; level < 4; level++) {
            for (let x = 0; x < 64; x++) {
                for (let y = 0; y < 64; y++) {
                    mapFile.tiles.settings[level][x][y] = 0;

                    let runLoop = true;

                    while (runLoop) {
                        const opcode = fileData.get('byte', 'u');

                        if (opcode === 0) {
                            if(level === 0) {
                                mapFile.tiles.heights[0][x][y] = -MapFileTranscoder.calculateVertexHeight(offsetX + x + 932731, offsetY + 556238 + y) * 8;
                            } else {
                                mapFile.tiles.heights[level][x][y] = mapFile.tiles.heights[level - 1][x][y] - 240;
                            }
                            runLoop = false;
                            break;
                        } else if (opcode === 1) {
                            let tileHeight = fileData.get('byte', 'u');
                            if (tileHeight === 1) {
                                tileHeight = 0;
                            }

                            if (level !== 0) {
                                mapFile.tiles.heights[level][x][y] = mapFile.tiles.heights[level - 1][x][y] - (8 * tileHeight);
                            } else {
                                mapFile.tiles.heights[0][x][y] = 8 * -tileHeight;
                            }
                            runLoop = false;
                            break;
                        } else if (opcode <= 49) {
                            mapFile.tiles.overlayIds[level][x][y] = fileData.get('byte');
                            mapFile.tiles.overlayPaths[level][x][y] = (opcode - 2) / 4;
                            mapFile.tiles.overlayOrientations[level][x][y] = opcode - 2 & 3;
                        } else if (opcode <= 81) {
                            mapFile.tiles.settings[level][x][y] = opcode - 49;
                        } else {
                            mapFile.tiles.underlayIds[level][x][y] = opcode - 81;
                        }
                    }
                }
            }
        }

        MapFileTranscoder.mapFiles.set(mapFileName, mapFile);
        return mapFile;
    }

    static calculateVertexHeight(x: number, y: number): number {
        let vertexHeight = (perlinNoise(x + 45365, y + 91923, 4) - 128 +
            (perlinNoise(x + 10294, y + 37821, 2) - 128 >> 1) +
            (perlinNoise(x, y, 1) - 128 >> 2));
        vertexHeight = (vertexHeight * 0.3) + 35;

        if (vertexHeight < 10) {
            vertexHeight = 10;
        } else if (vertexHeight > 60) {
            vertexHeight = 60;
        }

        return vertexHeight;
    }

}

import { ByteBuffer } from '@runejs/common';
import { MapFile } from './map-file';
import { store } from '../store';


const cosineTable = new Array(2048);
const sineTable = new Array(2048);

for (let i = 0; i < 2048; i++) {
    // Pre-calculate sin and cos to save memory
    //
    // Circumference / Cuts = Cut radians
    // Cuts defines how many angles around the circle we want to store, so in this case:
    // PI * 2 / 2048 = 0.0030679615 radians
    //
    // Furthermore, 65536 * x is something we call fixed point arithmetics. It is used to store decimals as an integer instead of a double.
    // 65536 = 2^16, so 16 is the scaling factor
    // The original value can be restored by dividing x by (2^scalingFactor) or just bit-shifting x right by the scaling factor
    // Note that when bit-shifting, you lose all the decimals, and only get the whole number. This is the most common
    // practice wherever the sin and cos tables are used in the client
    //
    // Also, don't forget your basic maths: sin(x) = the length of the opposite side, cos(x) = the length of the adjacent side
    // sin(x) + cos(x) = r
    sineTable[i] = (65536.0 * Math.sin(i * 0.0030679615));
    cosineTable[i] = (65536.0 * Math.cos(i * 0.0030679615));
}

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
                        const dataOpcode = fileData.get('byte', 'u');

                        if (dataOpcode === 0) {
                            if(level === 0) {
                                mapFile.tiles.heights[0][x][y] = -MapFileTranscoder.calculateTileHeight(offsetX + x + 932731, offsetY + 556238 + y) * 8;
                            } else {
                                mapFile.tiles.heights[level][x][y] = -240 + mapFile.tiles.heights[level + -1][x][y];
                            }
                            runLoop = false;
                            break;
                        } else if (dataOpcode === 1) {
                            let tileHeight = fileData.get('byte', 'u');
                            if (tileHeight === 1) {
                                tileHeight = 0;
                            }

                            if (level !== 0) {
                                mapFile.tiles.heights[level][x][y] = mapFile.tiles.heights[-1 + level][x][y] + -(8 * tileHeight);
                            } else {
                                mapFile.tiles.heights[0][x][y] = 8 * -tileHeight;
                            }
                            runLoop = false;
                            break;
                        } else if (dataOpcode <= 49) {
                            mapFile.tiles.overlayIds[level][x][y] = fileData.get('byte');
                            mapFile.tiles.overlayPaths[level][x][y] = (dataOpcode - 2) / 4;
                            mapFile.tiles.overlayOrientations[level][x][y] = dataOpcode - 2 & 3;
                        } else if (dataOpcode <= 81) {
                            mapFile.tiles.settings[level][x][y] = dataOpcode - 49;
                        } else {
                            mapFile.tiles.underlayIds[level][x][y] = dataOpcode - 81;
                        }
                    }
                }
            }
        }

        MapFileTranscoder.mapFiles.set(mapFileName, mapFile);
        return mapFile;
    }

    static method32(arg0: number, arg1: number, arg2: number, arg4: number): number {
        const i = 65536 + -cosineTable[1024 * arg4 / arg1] >> 1;
        return ((65536 + -i) * arg0 >> 16) + (arg2 * i >> 16);
    }

    static method884(arg0: number, arg1: number): number {
        let i = 57 * arg1 + arg0;
        i ^= i << 13;
        const i_2_ = (1376312589 + (i * i * 15731 + 789221) * i) & 0x7fffffff;
        return (i_2_ >> 19) & 0xff;
    }

    static method157(arg1: number, arg2: number): number {
        const i = MapFileTranscoder.method884(-1 + arg1, -1 + arg2) +
            MapFileTranscoder.method884(1 + arg1, arg2 - 1) +
            MapFileTranscoder.method884(-1 + arg1, 1 + arg2) +
            MapFileTranscoder.method884(1 + arg1, arg2 + 1);
        const i_126_ = MapFileTranscoder.method884(arg1 - 1, arg2) +
            MapFileTranscoder.method884(arg1 + 1, arg2) -
            (-MapFileTranscoder.method884(arg1, arg2 - 1) +
                -MapFileTranscoder.method884(arg1, 1 + arg2));
        const i_127_ = MapFileTranscoder.method884(arg1, arg2);
        return i / 16 - (-(i_126_ / 8) - i_127_ / 4);
    }

    static method160(arg0: number, arg2: number, arg3: number): number {
        const i = arg0 & -1 + arg2;
        const i_0_ = arg3 / arg2;
        const i_1_ = arg2 - 1 & arg3;
        const i_2_ = arg0 / arg2;
        const i_3_ = MapFileTranscoder.method157(i_2_, i_0_);
        const i_4_ = MapFileTranscoder.method157(1 + i_2_, i_0_);
        const i_5_ = MapFileTranscoder.method157(i_2_, 1 + i_0_);
        const i_6_ = MapFileTranscoder.method157(1 + i_2_, 1 + i_0_);
        const i_7_ = MapFileTranscoder.method32(i_3_, arg2, i_4_, i);
        const i_8_ = MapFileTranscoder.method32(i_5_, arg2, i_6_, i);
        return MapFileTranscoder.method32(i_7_, arg2, i_8_, i_1_);
    }

    static calculateTileHeight(x: number, y: number): number {
        let i = -128 + MapFileTranscoder.method160(x + 45365, 4, 91923 + y) -
            (-(MapFileTranscoder.method160(x + 10294, 2, 37821 + y) - 128 >> 1) +
                -(-128 + MapFileTranscoder.method160(x, 1, y) >> 2));
        i = 35 + (0.3 * i);
        if (i >= 10) {
            if (i > 60)
                i = 60;
        } else
            i = 10;
        return i;
    }

}

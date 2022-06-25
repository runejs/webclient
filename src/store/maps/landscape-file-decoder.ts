import { LandscapeFile, LandscapeObject } from './landscape-file';
import { ByteBuffer } from '@runejs/common';
import { store } from '../store';


export class LandscapeFileDecoder {

    static readonly landscapeFiles = new Map<string, LandscapeFile>();

    static async decode(landscapeFileName: string): Promise<LandscapeFile | null> {
        if (LandscapeFileDecoder.landscapeFiles.has(landscapeFileName)) {
            return LandscapeFileDecoder.landscapeFiles.get(landscapeFileName);
        }

        const fileData = new ByteBuffer(await store.get(5, landscapeFileName));
        if (!fileData) {
            return null;
        }

        const landscapeFile = new LandscapeFile(landscapeFileName);

        let gameObjectKey = -1;

        while (true) {
            const objectKeyAccumulator = fileData.get('smart_short');

            if (objectKeyAccumulator === 0) {
                break;
            }

            gameObjectKey += objectKeyAccumulator;
            let objectCoords = 0;

            while (true) {
                const objectCoordsAccumulator = fileData.get('smart_short');

                if (objectCoordsAccumulator === 0) {
                    break;
                }

                objectCoords += objectCoordsAccumulator - 1;

                const objectMetadata = fileData.get('byte', 'u');
                const mapWorldX = (landscapeFile.x & 0xff) * 64;
                const mapWorldY = landscapeFile.y * 64;

                landscapeFile.objects.push(new LandscapeObject(gameObjectKey,
                    ((objectCoords >> 6) & 0x3f) + mapWorldX, (objectCoords & 0x3f) + mapWorldY,
                    (objectCoords >> 12) & 0x3, objectMetadata >> 2, objectMetadata & 0x3));
            }
        }

        LandscapeFileDecoder.landscapeFiles.set(landscapeFileName, landscapeFile);
        return landscapeFile;
    }

}

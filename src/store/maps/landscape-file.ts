import { RegionFileBase } from './region-file-base';

export class LandscapeObject {
    gameObjectKey: number;
    x: number;
    y: number;
    level: number;
    type: number;
    orientation: number;

    constructor(gameObjectKey?: number, x?: number, y?: number,
                level?: number, type?: number, orientation?: number) {
        this.gameObjectKey = gameObjectKey;
        this.x = x;
        this.y = y;
        this.level = level;
        this.type = type;
        this.orientation = orientation;
    }
}


export class LandscapeFile extends RegionFileBase {
    objects: LandscapeObject[] = [];
}

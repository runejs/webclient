import { Node } from "../../../common/collection";
import { DecorativeObject, GameObject, GroundItem, GroundObject, WallObject } from "./child";

export class Tile extends Node {
    private bridge: Tile;
    private wallObject: WallObject;
    private decorativeObject: DecorativeObject;
    private groundObject: GroundObject;
    private groundItem: GroundItem;
    private gameObjects: GameObject[];
    private plane: number;
    private x: number;
    private y: number;
    
    constructor(plane: number, x: number, y: number) {
        super();
        
        this.plane = plane;
        this.x = x;
        this.y = y;
    }

    getPlane(): number {
        return this.plane;
    }

    getX(): number {
        return this.x;
    }

    getY(): number {
        return this.y;
    }

    getBridge(): Tile {
        return this.bridge;
    }

    getWallObject(): WallObject {
        return this.wallObject;
    }

    getDecorativeObject(): DecorativeObject {
        return this.decorativeObject;
    }

    getGroundObject(): GroundObject {
        return this.groundObject;
    }

    getGroundItem(): GroundItem {
        return this.groundItem;
    }

    getGameObject(): GameObject[] {
        return this.gameObjects;
    }
}
import { Node } from "../../../common/collection";
import { DecorativeObject, GameObject, GroundItem, GroundObject, TileModel, TilePaint, WallObject } from "./child";

export class Tile extends Node {
    private bridge: Tile;
    private underlay: TilePaint;
    private overlay: TileModel;
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

    getTilePaint(): TilePaint {
        return this.underlay;
    }

    setTilePaint(tilePaint: TilePaint): void {
        this.underlay = tilePaint;
    }

    getTileModel(): TileModel {
        return this.overlay;
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
import { Node } from "../../../common/collection";
import { TileModel, TilePaint } from "./child";

export class TerrainTile extends Node {
    private plane: number;
    private x: number;
    private y: number;

    private height: number = 0;

    private underlay: TilePaint = null;
    private overlay: TileModel = null;
    
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

    getTilePaint(): TilePaint {
        return this.underlay;
    }

    setTilePaint(tilePaint: TilePaint): void {
        this.underlay = tilePaint;
    }

    getTileModel(): TileModel {
        return this.overlay;
    }

    setTileModel(tileModel: TileModel): void {
        this.overlay = tileModel;
    }

    // heights come in negative from the cache.. should we store them as positive instead?
    getHeight(): number {
        return -this.height;
    }

    setHeight(height: number): void {
        this.height = height;
    }
}
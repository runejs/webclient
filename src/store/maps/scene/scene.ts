import { TilePaint } from "./child";
import { Constants } from "./constants";
import { Tile } from "./tile";

export class Scene {
    tiles: Tile[][][];

    constructor() {
        this.tiles = new Array(Constants.MAX_Z);

        for (let z = 0; z < Constants.MAX_Z; ++z) {
            this.tiles[z] = new Array(Constants.SCENE_SIZE);

            for (let x = 0; x < Constants.SCENE_SIZE; ++x) {
                this.tiles[z][x] = new Array(Constants.SCENE_SIZE);
            }
        }
    }

    getTiles(): Tile[][][] {
        return this.tiles;
    }

    renderTilePaint(z: number, x: number, y: number, tile: TilePaint) {
        for (let _z = z; _z >= 0; _z--) {
            if (this.tiles[_z][x][y] == null) {
                this.tiles[_z][x][y] = new Tile(_z, x, y);
            }
        }

        this.tiles[z][x][y].setTilePaint(tile);
    }

    static async create() {
        const scene = new Scene();

        // for (let z = 0; z < Constants.MAX_Z; z++) {
        const z = 0;
        for (let x = -5; x < Constants.SCENE_SIZE + 5; x++) {
            // lighting / blending goes here

            if (x >= 1 && x < Constants.SCENE_SIZE - 1) {
                // for (let y = -5; y < 10; y++) {
                for (let y = -5; y < Constants.SCENE_SIZE + 5; y++) {
                    // more light blending goes here

                    if (y >= 1 && y < Constants.SCENE_SIZE - 1) {
                        // TODO where is correct responsibility for this?
                        const tile = new TilePaint(
                            [0, 255, 0],
                            [255, 0, 0],
                            [0, 255, 0],
                            [255, 0, 0],
                            false
                        );

                        scene.renderTilePaint(z, x, y, tile);
                    }
                }
            }
        }
        // }

        return scene;
    }
}

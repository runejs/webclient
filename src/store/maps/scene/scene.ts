import { ColorArray } from "../../../common/color";
import { MapFile } from "../map-file";
import { Overlay } from "../overlay";
import { Underlay } from "../underlay";
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

    static async create(mapFile: MapFile) {
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
                        const color = await Scene.getTileColor(mapFile, z, x, y);
                        
                        const tile = new TilePaint(
                            color,
                            color,
                            color,
                            color,
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

    static async getTileColor(mapFile: MapFile, z: number, x: number, y: number) {
        const overlayColor = await Scene.getOverlayColor(mapFile, z, x, y);

        if (overlayColor) {
            return overlayColor;
        }

        return Scene.getUnderlayColor(mapFile, z, x, y);
    }


    static async getOverlayColor(mapFile: MapFile, z: number, x: number, y: number) {
        const { tiles: { overlayIds } } = mapFile;
        let overlayColor: ColorArray = [0, 0, 0];

        if (!overlayIds[z] || !overlayIds[z][x]) {
            return overlayColor;
        }

        const overlayId = overlayIds[z][x][y];

        if (!overlayId) {
            return null;
        }

        try {
            const overlay = await Overlay.decode(overlayId);

            if (overlay?.color) {
                const { red, green, blue } = overlay.color;
                overlayColor = [red, green, blue];
            }
        } catch (err) {
            // console.error(err);
        }

        return overlayColor;
    }

    static async getUnderlayColor(mapFile: MapFile, z: number, x: number, y: number) {
        const { tiles: { underlayIds } } = mapFile;
        let underlayColor: ColorArray = [25, 150, 6];

        if (!underlayIds[z] || !underlayIds[z][x]) {
            return underlayColor;
        }

        const underlayId = underlayIds[z][x][y];

        try {
            const underlay = await Underlay.decode(underlayId);

            if (underlay?.color) {
                const { red, green, blue } = underlay.color;
                underlayColor = [red, green, blue];
            }
        } catch (err) {
            // console.error(err);
        }

        return underlayColor;
    }
}

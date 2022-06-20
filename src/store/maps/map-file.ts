import { RegionFileBase } from './region-file-base';


export type TileDataArray = Uint8Array[][];


export class MapTileData {

    heights: number[][][] = new Array(4);
    settings: TileDataArray = new Array(4);
    overlayIds: TileDataArray = new Array(4);
    overlayPaths: TileDataArray = new Array(4);
    overlayOrientations: TileDataArray = new Array(4);
    underlayIds: TileDataArray = new Array(4);

}


export class MapFile extends RegionFileBase {
    tiles = new MapTileData();
}

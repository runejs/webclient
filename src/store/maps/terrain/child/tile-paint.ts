import { ColorArray } from "../../../../common/color";

/**
 * Represents a tile with 4 corner vertices and 4 corner colors
 */
export class TilePaint {
    constructor(
        public readonly colorNE: ColorArray,
        public readonly colorNW: ColorArray,
        public readonly colorSE: ColorArray,
        public readonly colorSW: ColorArray,
        public readonly flat: boolean,
        public readonly textureId: number,
    ) {
        
    }
}
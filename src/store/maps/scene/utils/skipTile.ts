import { ColorArray } from "../../../../common/color";

/**
 * some tiles are skipped based on NE color (int 12345678)
 */
export function shouldSkipTileFromColor(color: ColorArray) {
    return (color[0] === 78 && color[1] === 97 && color[2] === 188);
}
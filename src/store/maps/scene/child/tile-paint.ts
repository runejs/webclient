import { ColorArray } from "../../../../common/color";

export class TilePaint {
    constructor(
        public colorNE: ColorArray,
        public colorNW: ColorArray,
        public colorSE: ColorArray,
        public colorSW: ColorArray,
        public flat: boolean,
    ) {
        
    }
}
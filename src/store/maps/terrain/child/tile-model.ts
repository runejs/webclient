import { Constants } from "../../scene/constants";

const TILE_MODEL_POINT_DATA: number[][] = [
    [1, 3, 5, 7],
    [1, 3, 5, 7],
    [1, 3, 5, 7],
    [1, 3, 5, 7, 6],
    [1, 3, 5, 7, 6],
    [1, 3, 5, 7, 6],
    [1, 3, 5, 7, 6],
    [1, 3, 5, 7, 2, 6],
    [1, 3, 5, 7, 2, 8],
    [1, 3, 5, 7, 2, 8],
    [1, 3, 5, 7, 11, 12],
    [1, 3, 5, 7, 11, 12],
    [1, 3, 5, 7, 13, 14],
];
const TILE_MODEL_ELEMENT_DATA: number[][] = [
    [0, 1, 2, 3, 0, 0, 1, 3],
    [1, 1, 2, 3, 1, 0, 1, 3],
    [0, 1, 2, 3, 1, 0, 1, 3],
    [0, 0, 1, 2, 0, 0, 2, 4, 1, 0, 4, 3],
    [0, 0, 1, 4, 0, 0, 4, 3, 1, 1, 2, 4],
    [0, 0, 4, 3, 1, 0, 1, 2, 1, 0, 2, 4],
    [0, 1, 2, 4, 1, 0, 1, 4, 1, 0, 4, 3],
    [0, 4, 1, 2, 0, 4, 2, 5, 1, 0, 4, 5, 1, 0, 5, 3],
    [0, 4, 1, 2, 0, 4, 2, 3, 0, 4, 3, 5, 1, 0, 4, 5],
    [0, 0, 4, 5, 1, 4, 1, 2, 1, 4, 2, 3, 1, 4, 3, 5],
    [0, 0, 1, 5, 0, 1, 4, 5, 0, 1, 2, 4, 1, 0, 5, 3, 1, 5, 4, 3, 1, 4, 2, 3],
    [1, 0, 1, 5, 1, 1, 4, 5, 1, 1, 2, 4, 0, 0, 5, 3, 0, 5, 4, 3, 0, 4, 2, 3],
    [1, 0, 5, 4, 1, 0, 1, 5, 0, 0, 4, 3, 0, 4, 5, 3, 0, 5, 2, 3, 0, 1, 2, 5],
];

/**
 * Represents a tile with more than the 4 corner vertices
 */
export class TileModel {
    private vertexX: number[];
    private vertexY: number[];
    private vertexZ: number[];
    // TODO should these be ColorArray instead?
    private triangleHSLA: number[];
    private triangleHSLB: number[];
    private triangleHSLC: number[];
    private faceX: number[];
    private faceY: number[];
    private faceZ: number[];
	private triangleTextureId: number[] | null = null;

    // TODO underlay/overlay rgb for minimap

    constructor(
        tileX: number,
        tileY: number,

        heightNE: number,
        heightNW: number,
        heightSE: number,
        heightSW: number,

        underlayNE: number,
        overlayNE: number,
        underlayNW: number,
        overlayNW: number,
        underlaySE: number,
        overlaySE: number,
        underlaySW: number,
        overlaySW: number,

        shape: number,
        rotation: number,
        textureId: number,
    ) {

        const mesh = TILE_MODEL_POINT_DATA[shape];

        this.vertexX = new Array<number>(mesh.length);
        this.vertexY = new Array<number>(mesh.length);
        this.vertexZ = new Array<number>(mesh.length);

        const vertexColourOverlays = new Array<number>(mesh.length);
        const vertexColourUnderlays = new Array<number>(mesh.length);

        const HALF_TILE = (Constants.LOCAL_TILE_SIZE / 2) | 0;
        const QUARTER_TILE = (Constants.LOCAL_TILE_SIZE / 4) | 0;
        const THREE_QUARTER_TILE = ((Constants.LOCAL_TILE_SIZE * 3) / 4) | 0;

        for (let vertex = 0; vertex < mesh.length; vertex++) {
            let vertexType = mesh[vertex];

			if ((vertexType & 1) === 0 && vertexType <= 8) {
                vertexType = (vertexType - rotation - rotation - 1 & 7) + 1;
            }

			if (vertexType > 8 && vertexType <= 12) {
                vertexType = (vertexType - 9 - rotation & 3) + 9;
            }

			if (vertexType > 12 && vertexType <= 16) {
                vertexType = (vertexType - 13 - rotation & 3) + 13;
            }

            let vertexX: number;
            let vertexY: number;
            let vertexZ: number;
            let vertexColourOverlay: number;
            let vertexColourUnderlay: number;
            
			if (vertexType === 1) {
				vertexX = 0;
				vertexZ = 0;
				vertexY = heightSW;
				vertexColourOverlay = overlaySW;
				vertexColourUnderlay = underlaySW;
			} else if (vertexType === 2) {
				vertexX = HALF_TILE;
				vertexZ = 0;
				vertexY = heightSW + heightSE >> 1;
				vertexColourOverlay = overlaySW + overlaySE >> 1;
				vertexColourUnderlay = underlaySW + underlaySE >> 1;
			} else if (vertexType === 3) {
				vertexX = Constants.LOCAL_TILE_SIZE;
				vertexZ = 0;
				vertexY = heightSE;
				vertexColourOverlay = overlaySE;
				vertexColourUnderlay = underlaySE;
			} else if (vertexType === 4) {
				vertexX = Constants.LOCAL_TILE_SIZE;
				vertexZ = HALF_TILE;
				vertexY = heightSE + heightNE >> 1;
				vertexColourOverlay = overlaySE + overlayNE >> 1;
				vertexColourUnderlay = underlaySE + underlayNE >> 1;
			} else if (vertexType === 5) {
				vertexX = Constants.LOCAL_TILE_SIZE;
				vertexZ = Constants.LOCAL_TILE_SIZE;
				vertexY = heightNE;
				vertexColourOverlay = overlayNE;
				vertexColourUnderlay = underlayNE;
			} else if (vertexType === 6) {
				vertexX = HALF_TILE;
				vertexZ = Constants.LOCAL_TILE_SIZE;
				vertexY = heightNE + heightNW >> 1;
				vertexColourOverlay = overlayNE + overlayNW >> 1;
				vertexColourUnderlay = underlayNE + underlayNW >> 1;
			} else if (vertexType === 7) {
				vertexX = 0;
				vertexZ = Constants.LOCAL_TILE_SIZE;
				vertexY = heightNW;
				vertexColourOverlay = overlayNW;
				vertexColourUnderlay = underlayNW;
			} else if (vertexType === 8) {
				vertexX = 0;
				vertexZ = HALF_TILE;
				vertexY = heightNW + heightSW >> 1;
				vertexColourOverlay = overlayNW + overlaySW >> 1;
				vertexColourUnderlay = underlayNW + underlaySW >> 1;
			} else if (vertexType === 9) {
				vertexX = HALF_TILE;
				vertexZ = QUARTER_TILE;
				vertexY = heightSW + heightSE >> 1;
				vertexColourOverlay = overlaySW + overlaySE >> 1;
				vertexColourUnderlay = underlaySW + underlaySE >> 1;
			} else if (vertexType === 10) {
				vertexX = THREE_QUARTER_TILE;
				vertexZ = HALF_TILE;
				vertexY = heightSE + heightNE >> 1;
				vertexColourOverlay = overlaySE + overlayNE >> 1;
				vertexColourUnderlay = underlaySE + underlayNE >> 1;
			} else if (vertexType === 11) {
				vertexX = HALF_TILE;
				vertexZ = THREE_QUARTER_TILE;
				vertexY = heightNE + heightNW >> 1;
				vertexColourOverlay = overlayNE + overlayNW >> 1;
				vertexColourUnderlay = underlayNE + underlayNW >> 1;
			} else if (vertexType === 12) {
				vertexX = QUARTER_TILE;
				vertexZ = HALF_TILE;
				vertexY = heightNW + heightSW >> 1;
				vertexColourOverlay = overlayNW + overlaySW >> 1;
				vertexColourUnderlay = underlayNW + underlaySW >> 1;
			} else if (vertexType === 13) {
				vertexX = QUARTER_TILE;
				vertexZ = QUARTER_TILE;
				vertexY = heightSW;
				vertexColourOverlay = overlaySW;
				vertexColourUnderlay = underlaySW;
			} else if (vertexType === 14) {
				vertexX = THREE_QUARTER_TILE;
				vertexZ = QUARTER_TILE;
				vertexY = heightSE;
				vertexColourOverlay = overlaySE;
				vertexColourUnderlay = underlaySE;
			} else if (vertexType === 15) {
				vertexX = THREE_QUARTER_TILE;
				vertexZ = THREE_QUARTER_TILE;
				vertexY = heightNE;
				vertexColourOverlay = overlayNE;
				vertexColourUnderlay = underlayNE;
			} else {
				vertexX = QUARTER_TILE;
				vertexZ = THREE_QUARTER_TILE;
				vertexY = heightNW;
				vertexColourOverlay = overlayNW;
				vertexColourUnderlay = underlayNW;
			}

            this.vertexX[vertex] = vertexX | 0;
            this.vertexY[vertex] = vertexY | 0;
            this.vertexZ[vertex] = vertexZ | 0;
            vertexColourOverlays[vertex] = vertexColourOverlay;
            vertexColourUnderlays[vertex] = vertexColourUnderlay;

            // console.log(`vCO, vCU: ${vertexColourOverlay} , ${vertexColourUnderlay}`);
        }

        const elements = TILE_MODEL_ELEMENT_DATA[shape];
        const vertexCount = elements.length / 4;

        this.faceX = new Array<number>(vertexCount);
        this.faceY = new Array<number>(vertexCount);
        this.faceZ = new Array<number>(vertexCount);
        this.triangleHSLA = new Array<number>(vertexCount);
        this.triangleHSLB = new Array<number>(vertexCount);
        this.triangleHSLC = new Array<number>(vertexCount);

        if (textureId !== -1) {
            this.triangleTextureId = new Array<number>(vertexCount);
        }

        let offset = 0;
        for (let vertex = 0; vertex < vertexCount; vertex++) {
			const overlayOrUnderlay = elements[offset];
			let idxA = elements[offset + 1];
			let idxB = elements[offset + 2];
			let idxC = elements[offset + 3];
			offset += 4;

			if (idxA < 4) {
                idxA = idxA - rotation & 3;
            }
			if (idxB < 4) {
                idxB = idxB - rotation & 3;
            }
			if (idxC < 4) {
                idxC = idxC - rotation & 3;
            }
            this.faceX[vertex] = idxA | 0;
            this.faceY[vertex] = idxB | 0;
            this.faceZ[vertex] = idxC | 0;

			if (overlayOrUnderlay === 0) {
                this.triangleHSLA[vertex] = vertexColourOverlays[idxA];
                this.triangleHSLB[vertex] = vertexColourOverlays[idxB];
                this.triangleHSLC[vertex] = vertexColourOverlays[idxC];

				if (this.triangleTextureId != null) {
                    this.triangleTextureId[vertex] = -1;
                }
			} else {
                this.triangleHSLA[vertex] = vertexColourUnderlays[idxA];
                this.triangleHSLB[vertex] = vertexColourUnderlays[idxB];
                this.triangleHSLC[vertex] = vertexColourUnderlays[idxC];

				if (this.triangleTextureId != null) {
                    this.triangleTextureId[vertex] = textureId;
                }
			}
        }
    }

    public getRenderInfo() {
        return {
            faceX: this.faceX,
            faceY: this.faceY,
            faceZ: this.faceZ,
            vertexX: this.vertexX,
            vertexY: this.vertexY,
            vertexZ: this.vertexZ,
            triangleColorA: this.triangleHSLA,
            triangleColorB: this.triangleHSLB,
            triangleColorC: this.triangleHSLC,
            triangleTextureId: this.triangleTextureId,
        };
    }
}

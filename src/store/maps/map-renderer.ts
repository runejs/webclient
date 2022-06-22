import { MapFileTranscoder } from './map-file.transcoder';
import { MapFile } from './map-file';
import {
    BufferAttribute,
    DoubleSide,
    Material,
    Mesh,
    MeshPhongMaterial,
    PlaneBufferGeometry
} from 'three';
import { ModelRenderer } from '../models/model-renderer';
import { game } from '../../common/game/game';


// @todo use single plane geometry for all map drawing to utilize built-in tile smoothing
//  between map regions
export class MapRenderer {

    mapFile: MapFile;
    mapX: number;
    mapY: number;
    drawOffsetX: number = 0;
    drawOffsetY: number = 0;
    geometry: PlaneBufferGeometry;
    materials: Material[];
    planeMesh: Mesh;

    constructor(mapX: number, mapY: number, drawOffsetX = 0, drawOffsetY = 0) {
        this.mapX = mapX;
        this.mapY = mapY;
        this.drawOffsetX = drawOffsetX;
        this.drawOffsetY = drawOffsetY;
    }

    render(): void {
        const vertices = [];
        const colors = [];
        const { heights } = this.mapFile.tiles;
        const level = 0;

        for (let y = 63; y >= 0; y--) {
            for (let x = 0; x < 64; x++) {
                let height = heights[level][x][y];

                if(height === undefined || height === null || isNaN(height)) {
                    height = 0;
                }

                colors.push(81, 92, 14);
                vertices.push(x * 64, -height / 2, -(y * 64));
            }
        }

        this.geometry.addGroup(0, vertices.length * 3, 0);
        this.planeMesh.geometry.setAttribute('position',
            new BufferAttribute(new Float32Array(vertices), 3));
        this.planeMesh.geometry.setAttribute('color',
            new BufferAttribute(new Float32Array(colors), 3));
        this.planeMesh.geometry.computeVertexNormals();
    }

    createPlane(): void {
        this.geometry = new PlaneBufferGeometry(
            64, 64, 63, 63);

        // this.geometry.rotateX( -Math.PI / 2);

        this.materials = [new MeshPhongMaterial({
            vertexColors: true,
            side: DoubleSide,
            // transparent: true,
            // opacity: 0.7,
            // flatShading: true,
            // color: new Color(165, 42, 42),
            // wireframe: true,
        })];

        this.planeMesh = new Mesh(this.geometry, this.materials);
        this.planeMesh.name = this.mapName;

        let planeDrawX = -52;
        let planeDrawY = 52;

        const drawOffsetX = (this.drawOffsetX * 100);
        const drawOffsetY = (this.drawOffsetY * 100);

        planeDrawX += drawOffsetX;
        planeDrawY -= drawOffsetY;

        console.log(`Render ${this.mapName} @ ${planeDrawX},${planeDrawY}`);

        this.planeMesh.position.set(planeDrawX, 0, planeDrawY);
        // this.planeMesh.rotation.set(0,-Math.PI / 2,0);
        this.planeMesh.scale.set(ModelRenderer.MODEL_SCALE, ModelRenderer.MODEL_SCALE, ModelRenderer.MODEL_SCALE);

        game.scene.add(this.planeMesh);

    }

    async loadMap(): Promise<void> {
        this.mapFile = await MapFileTranscoder.decode(this.mapName);
    }

    get mapName(): string {
        return `m${this.mapX}_${this.mapY}`;
    }

}

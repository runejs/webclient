import { MapFileDecoder } from "./map-file-decoder";
import { MapFile } from "./map-file";
import {
    BufferAttribute,
    BufferGeometry,
    Color,
    DoubleSide,
    Material,
    Mesh,
    MeshBasicMaterial,
    MeshPhongMaterial,
    PlaneBufferGeometry,
} from "three";
import { ModelRenderer } from "../models/model-renderer";
import { game } from "../../common/game/game";
import { Overlay } from "./overlay";
import { Underlay } from "./underlay";
import { ColorArray, GameColor, sameColor } from "../../common/color";
import { TextureFileDecoder } from "./texture-file-decoder";
import { store } from "../store";
import { Scene } from "./scene";
import { uploadScene } from "./scene/scene-uploader";

export class MapRenderer {
    mapFile: MapFile;
    scene: Scene;
    mapX: number;
    mapY: number;
    drawOffsetX: number = 0;
    drawOffsetY: number = 0;

    constructor(mapX: number, mapY: number, drawOffsetX = 0, drawOffsetY = 0) {
        this.mapX = mapX;
        this.mapY = mapY;
        this.drawOffsetX = drawOffsetX;
        this.drawOffsetY = drawOffsetY;
    }

    get mapName(): string {
        return `m${this.mapX}_${this.mapY}`;
    }

    async loadMap(): Promise<void> {
        this.mapFile = await MapFileDecoder.decode(this.mapName);
        this.scene = await Scene.create();
    }

    async render() {
        let planeDrawX = -52;
        let planeDrawY = 52;

        const drawOffsetX = this.drawOffsetX * 101;
        const drawOffsetY = this.drawOffsetY * 101;

        planeDrawX += drawOffsetX;
        planeDrawY -= drawOffsetY;

        const vertices: number[] = [];
        const colors: number[] = [];

        uploadScene(this.mapFile, this.scene, vertices, colors);

        vertices.reverse();

        const mappedColors = colors.map(c => c / 255);
        mappedColors.reverse();

        const geometry = new BufferGeometry();
        geometry.setAttribute(
            "position",
            new BufferAttribute(new Float32Array(vertices), 3)
        );
        geometry.setAttribute(
            "color",
            new BufferAttribute(new Float32Array(mappedColors), 3)
        );
        geometry.computeVertexNormals();
 
        const material = new MeshBasicMaterial({
            vertexColors: true,
            side: DoubleSide,
            // wireframe: true,
            // color: new Color(165, 42, 42),
        });
        
        const planeMesh = new Mesh(geometry, material);
        planeMesh.name = this.mapName;

        planeMesh.position.set(planeDrawX, 0, planeDrawY);
        planeMesh.scale.set(
            ModelRenderer.MODEL_SCALE,
            ModelRenderer.MODEL_SCALE,
            ModelRenderer.MODEL_SCALE
        );

        game.scene.add(planeMesh);
    }
}

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

    async render(): Promise<void> {
        const vertices = [];
        const overlayColors = [];
        const underlayColors = [];
        const colors = [];
        const { heights, overlayIds, underlayIds } = this.mapFile.tiles;
        const level = 0;
        let faceIndex = 0;

        for (let y = 63; y >= 0; y--) {
            for (let x = 0; x < 64; x++) {
                const overlayId = overlayIds[level][x][y];
                const underlayId = underlayIds[level][x][y];
                let overlayColor: ColorArray = [ 0, 0, 0 ];
                let underlayColor: ColorArray = [ 25, 150, 6 ];

                try {
                    const overlay = await Overlay.decode(overlayId);

                    if(overlay?.color) {
                        const { red, green, blue } = overlay.color;
                        overlayColor = [ red, green, blue ];
                    }
                } catch (err) {
                    // console.error(err);
                }

                try {
                    const underlay = await Underlay.decode(underlayId);

                    if(underlay?.color) {
                        const { red, green, blue } = underlay.color;
                        underlayColor = [ red, green, blue ];
                    }
                } catch (err) {
                    // console.error(err);
                }

                overlayColors.push(...overlayColor);
                underlayColors.push(...underlayColor);

                colors.push(...(overlayId === 0 ? underlayColor : overlayColor));

                let height = heights[level][x][y];

                if (height === undefined || height === null || isNaN(height)) {
                    height = 1;
                }

                vertices.push(x * 64, height / 3, -(y * 64));

                faceIndex++;
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

        const drawOffsetX = (this.drawOffsetX * 101);
        const drawOffsetY = (this.drawOffsetY * 101);

        planeDrawX += drawOffsetX;
        planeDrawY -= drawOffsetY;

        console.log(`Render ${this.mapName} @ ${planeDrawX},${planeDrawY}`);

        this.planeMesh.position.set(planeDrawX, 0, planeDrawY);
        this.planeMesh.scale.set(ModelRenderer.MODEL_SCALE, ModelRenderer.MODEL_SCALE, ModelRenderer.MODEL_SCALE);

        game.scene.add(this.planeMesh);

    }

    async loadMap(): Promise<void> {
        this.mapFile = await MapFileDecoder.decode(this.mapName);
    }

    get mapName(): string {
        return `m${this.mapX}_${this.mapY}`;
    }

}

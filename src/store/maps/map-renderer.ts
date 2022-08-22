import {
    BufferAttribute,
    BufferGeometry,
    DoubleSide,
    Material,
    Mesh,
    MeshPhongMaterial,
    Vector3,
} from "three";
import { ModelRenderer } from "../models/model-renderer";
import { game } from "../../common/game/game";
import { uploadTerrain } from "./scene/scene-uploader";
import { Terrain } from "./terrain";
import { store } from "../store";

export class MapRenderer {
    drawOffsetX: number = 0;
    drawOffsetY: number = 0;

    constructor(drawOffsetX = 0, drawOffsetY = 0) {
        this.drawOffsetX = drawOffsetX;
        this.drawOffsetY = drawOffsetY;
    }

    async render(terrain: Terrain) {
        // shift the terrain by half a tile so that the center of the tile is at the origin
        const halfTile = (128 / 2);
        const drawOffsetToCentre = (128 * 51) - halfTile;

        let planeDrawX = -drawOffsetToCentre + this.drawOffsetX;
        let planeDrawY = drawOffsetToCentre + this.drawOffsetY;

        // these are the values passed to ThreeJS
        const vertices: number[] = [];
        const colors: number[] = [];
        const uvs: number[] = [];

        const geometry = new BufferGeometry();
        let offset = 0;

        await uploadTerrain(terrain, geometry, offset, vertices, colors, uvs);

        vertices.reverse();
        colors.reverse();
        uvs.reverse();

        geometry.setAttribute(
            "position",
            new BufferAttribute(new Float32Array(vertices), 3)
        );
        geometry.setAttribute(
            "color",
            new BufferAttribute(new Float32Array(colors), 3)
        );
        geometry.setAttribute(
            "uv",
            new BufferAttribute(new Float32Array(uvs), 2)
        );

        geometry.computeVertexNormals();

        const materials = await this.createMaterials();

        const planeMesh = new Mesh(geometry, materials);
        planeMesh.name = "Map";

        planeMesh.position.set(planeDrawX * ModelRenderer.MODEL_SCALE, 0, planeDrawY * ModelRenderer.MODEL_SCALE);
        planeMesh.scale.set(
            ModelRenderer.MODEL_SCALE,
            ModelRenderer.MODEL_SCALE,
            ModelRenderer.MODEL_SCALE
        );

        // rotate the map so that the coordinate system is correct
        planeMesh.rotateOnAxis(new Vector3(0, 1, 0), degrees_to_radians(90));

        game.scene.add(planeMesh);
    }

    /**
     * Creates an array of materials to use
     *
     * 0 is the default material
     * 1-... are the game textures (textureId + 1)
     *
     * @returns
     */
    async createMaterials() {
        const defaultMaterial = new MeshPhongMaterial({
            vertexColors: true,
            side: DoubleSide,
            // wireframe: true,
            // color: new Color(233, 165, 128),
        });

        const materials: Material[] = [
            defaultMaterial,
        ];

        for (let i = 0; i <= 51; i++) {
            const material = await store.getTextureMaterial(i);

            materials.push(material);
        }

        return materials;
    }
}

function degrees_to_radians(degrees) {
    const pi = Math.PI;
    return degrees * (pi / 180);
}

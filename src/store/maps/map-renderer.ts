import {
    BufferAttribute,
    BufferGeometry,
    DoubleSide,
    Mesh,
    MeshPhongMaterial,
    Vector3,
} from "three";
import { ModelRenderer } from "../models/model-renderer";
import { game } from "../../common/game/game";
import { uploadScene } from "./scene/scene-uploader";
import { Terrain } from "./terrain";

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

        const vertices: number[] = [];
        const colors: number[] = [];

        uploadScene(terrain, vertices, colors);

        vertices.reverse();
        colors.reverse();

        const geometry = new BufferGeometry();
        geometry.setAttribute(
            "position",
            new BufferAttribute(new Float32Array(vertices), 3)
        );
        geometry.setAttribute(
            "color",
            new BufferAttribute(new Float32Array(colors), 3)
        );

        geometry.computeVertexNormals();
 
        const material = new MeshPhongMaterial({
            vertexColors: true,
            side: DoubleSide,
            // wireframe: true,
            // color: new Color(233, 165, 128),
        });
        
        const planeMesh = new Mesh(geometry, material);
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
}

function degrees_to_radians(degrees)
{
  var pi = Math.PI;
  return degrees * (pi/180);
}

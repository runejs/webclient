import {
    BufferAttribute,
    BufferGeometry,
    Color,
    DoubleSide,
    Material,
    Mesh,
    MeshBasicMaterial,
    TextureLoader,
} from "three";
import { Rs2Model } from "./rs2-model";
import { ModelColor } from "./model-color";
import { game } from "../../common/game/game";
import { store } from "../store";
import { Texture } from "../maps/texture";

export class ModelRenderer {
    static MODEL_SCALE = 0.025;
    private static FACE_SHADED = 0;
    private static FACE_DEFAULT = 1;

    rsModelMesh: Mesh | null = null;

    removeRsModelMesh(): void {
        if (!this.rsModelMesh) {
            return;
        }
        if (this.rsModelMesh.material instanceof Material) {
            this.rsModelMesh.material.dispose();
        } else {
            this.rsModelMesh.material.forEach((item) => item.dispose());
        }
        this.rsModelMesh.geometry.dispose();
        game.scene.remove(this.rsModelMesh);
    }

    async createRsModelMesh(model: Rs2Model) {
        model.applyLighting(64, 768, -50, -10, -50, true);
        model.computeTextureUVs();

        const geometry = new BufferGeometry();
        const materials = new Array<Material>();

        // the default material
        materials.push(
            new MeshBasicMaterial({
                side: DoubleSide,
                flatShading: true,
                vertexColors: true,
            } as any)
        );

        const vertices = [];
        const normals = [];
        const colors = [];
        const uvs = [];

        // temporary
        let faceIndex = 0;
        const materialIndices = [];
        let lastMaterialIndex = -1;
        let lastGroup: any = null;

        for (let i = 0; i < model.faceCount; i++) {
            const faceType =
                model.faceTypes == null ? 0 : model.faceTypes[i] & 0x3;
            let faceA: number;
            let faceB: number;
            let faceC: number;
            switch (faceType) {
                case ModelRenderer.FACE_SHADED:
                case ModelRenderer.FACE_DEFAULT:
                    faceA = model.faceIndicesA[i];
                    faceB = model.faceIndicesB[i];
                    faceC = model.faceIndicesC[i];
                    break;
                default:
                    throw new Error("Unhandled face type: " + faceType);
            }

            // vertices and normals
            for (const vertex of [faceA, faceB, faceC]) {
                vertices.push(model.verticesX[vertex] || 0);
                vertices.push(-model.verticesY[vertex] || 0);
                vertices.push(model.verticesZ[vertex] || 0);

                const vertexNormal = model.vertexNormals[vertex];
                normals.push(vertexNormal.x);
                normals.push(vertexNormal.y);
                normals.push(vertexNormal.z);
            }

            // colors
            let materialIndex = 0;
            const faceColor = model.faceColors[i];
            switch (faceType) {
                case ModelRenderer.FACE_SHADED:
                    const rgb = ModelColor.hsbToRgb(faceColor);
                    const shadowedColorX = new Color(
                        ModelColor.shade(
                            rgb,
                            ModelColor.hsbToRgb(model.faceColorsX[i])
                        )
                    );
                    const shadowedColorY = new Color(
                        ModelColor.shade(
                            rgb,
                            ModelColor.hsbToRgb(model.faceColorsY[i])
                        )
                    );
                    const shadowedColorZ = new Color(
                        ModelColor.shade(
                            rgb,
                            ModelColor.hsbToRgb(model.faceColorsZ[i])
                        )
                    );
                    for (const color of [
                        shadowedColorX,
                        shadowedColorY,
                        shadowedColorZ,
                    ]) {
                        colors.push(color.r);
                        colors.push(color.g);
                        colors.push(color.b);
                    }
                    break;
                case ModelRenderer.FACE_DEFAULT:
                    const colorXYZ = new Color(
                        ModelColor.hsbToRgb(model.faceColorsX[i])
                    );
                    for (const color of [colorXYZ, colorXYZ, colorXYZ]) {
                        colors.push(color.r);
                        colors.push(color.g);
                        colors.push(color.b);
                    }
                    break;
            }

            // uvs
            if (model.faceTextures) {
                const u = model.faceTextureU[i];
                const v = model.faceTextureV[i];
                for (let l = 0; l < 3; l++) {
                    uvs.push(u[l]);
                    uvs.push(v[l]);
                }

                // materials
                const textureId = model.faceTextures[i];
                if (textureId !== -1) {
                    materialIndex = materialIndices[textureId];
                    if (materialIndex === undefined) {
                        const texture = await store.getTexture(textureId);

                        if (texture) {
                            materialIndices[textureId] = materialIndex =
                                materials.length;
                            materials.push(this.createTextureMaterial(texture));
                        } else {
                            materialIndex = 0;
                        }
                    }
                }
            }

            if (materialIndex !== lastMaterialIndex) {
                lastMaterialIndex = materialIndex;
                if (lastGroup != null) {
                    lastGroup.count = faceIndex * 3 - lastGroup.start;
                    geometry.addGroup(
                        lastGroup.start,
                        lastGroup.count,
                        lastGroup.materialIndex
                    );
                }
                lastGroup = {
                    start: faceIndex * 3,
                    count: 0,
                    materialIndex: lastMaterialIndex,
                };
            }
            faceIndex++;
        }

        if (lastGroup != null) {
            lastGroup.count = faceIndex * 3 - lastGroup.start;
            geometry.addGroup(
                lastGroup.start,
                lastGroup.count,
                lastGroup.materialIndex
            );
        }

        geometry.setAttribute(
            "position",
            new BufferAttribute(new Float32Array(vertices), 3)
        );
        geometry.setAttribute(
            "normal",
            new BufferAttribute(new Float32Array(normals), 3)
        );
        geometry.setAttribute(
            "color",
            new BufferAttribute(new Float32Array(colors), 3)
        );
        geometry.setAttribute(
            "uv",
            new BufferAttribute(new Float32Array(uvs), 2)
        );

        const mesh = new Mesh(geometry, materials);
        mesh.rotateY(Math.PI);
        const scale = ModelRenderer.MODEL_SCALE;
        mesh.scale.set(scale, scale, scale);

        this.rsModelMesh = mesh;
        game.scene.add(mesh);

        return mesh;
    }

    private createTextureMaterial(texture: Texture): Material {
        const material = new MeshBasicMaterial({
            side: DoubleSide,
            vertexColors: true,
        });
        texture.toBase64().then((value) => {
            material.map = new TextureLoader().load(
                "data:image/png;base64," + value
            );

            material.needsUpdate = true;
        });
        return material;
    }
}

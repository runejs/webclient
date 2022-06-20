import {
    BufferAttribute,
    BufferGeometry, Color,
    DoubleSide,
    GridHelper,
    Material,
    Mesh, MeshBasicMaterial,
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
    AxesHelper, DirectionalLight
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Rs2Model } from './rs2-model';
import { ModelColor } from './model-color';

export class ModelRenderer {

    static MODEL_SCALE = 0.025;
    private static FACE_SHADED = 0;
    private static FACE_DEFAULT = 1;

    private canvas: HTMLCanvasElement;

    renderer: WebGLRenderer;
    camera: PerspectiveCamera;
    controls: OrbitControls;
    scene: Scene;
    rsModelMesh: Mesh | null = null;
    frameId: number = null;

    destroy(): void {
        if (this.frameId != null) {
            cancelAnimationFrame(this.frameId);
        }
    }

    createScene(canvas: HTMLCanvasElement): void {
        // The first step is to get the reference of the canvas element from our HTML document
        this.canvas = canvas;

        // create the WebGL renderer
        this.renderer = new WebGLRenderer({
            canvas: this.canvas,
            // alpha: true,
            // antialias: true
        });
        this.renderer.setSize(512, 334);

        // create the scene
        this.scene = new Scene();

        // create the camera
        this.camera = new PerspectiveCamera(
            75, 512 / 334, 0.1, 1000
        );
        this.camera.position.x = -60;
        this.camera.position.y = 50;
        this.camera.position.z = 0;

        this.scene.add(this.camera);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        // const size = 15;
        // const divisions = 15;
        // const gridHelper = new GridHelper(size, divisions);
        // this.scene.add(gridHelper);

        const axis = new AxesHelper(200);
        this.scene.add(axis);
    }

    removeRsModelMesh(): void {
        if (!this.rsModelMesh) {
            return;
        }
        if (this.rsModelMesh.material instanceof Material) {
            this.rsModelMesh.material.dispose();
        } else {
            this.rsModelMesh.material.forEach(item => item.dispose());
        }
        this.rsModelMesh.geometry.dispose();
        this.scene.remove(this.rsModelMesh);
    }

    createRsModelMesh(model: Rs2Model): void {
        model.applyLighting(64, 768, -50, -10, -50, true);
        model.computeTextureUVs();

        const geometry = new BufferGeometry();
        const materials = new Array<Material>();

        // the default material
        materials.push(new MeshBasicMaterial({
            side: DoubleSide,
            flatShading: true,
            vertexColors: true
        } as any));

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
            const faceType = model.faceTypes == null ? 0 : (model.faceTypes[i] & 0x3);
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
                    throw new Error('Unhandled face type: ' + faceType);
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
                    const shadowedColorX = new Color(ModelColor.shade(rgb, ModelColor.hsbToRgb(model.faceColorsX[i])));
                    const shadowedColorY = new Color(ModelColor.shade(rgb, ModelColor.hsbToRgb(model.faceColorsY[i])));
                    const shadowedColorZ = new Color(ModelColor.shade(rgb, ModelColor.hsbToRgb(model.faceColorsZ[i])));
                    for(const color of [shadowedColorX, shadowedColorY, shadowedColorZ]) {
                        colors.push(color.r);
                        colors.push(color.g);
                        colors.push(color.b);
                    }
                    break;
                case ModelRenderer.FACE_DEFAULT:
                    const colorXYZ = new Color(ModelColor.hsbToRgb(model.faceColorsX[i]));
                    for(const color of [colorXYZ, colorXYZ, colorXYZ]) {
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
                /* const textureId = model.faceTextures[i];
                if (textureId !== -1) {
                    materialIndex = materialIndices[textureId];
                    if (materialIndex === undefined) {
                        const texture = textureStore.getTexture(textureId);
                        if (texture) {
                            materialIndices[textureId] = materialIndex = materials.length;
                            texture.generatePixels(fileStore.spriteStore);
                            materials.push(this.createTextureMaterial(texture));
                        } else {
                            materialIndex = 0;
                        }
                    }
                } */
            }

            if (materialIndex !== lastMaterialIndex) {
                lastMaterialIndex = materialIndex;
                if (lastGroup != null) {
                    lastGroup.count = (faceIndex * 3) - lastGroup.start;
                    geometry.addGroup(lastGroup.start, lastGroup.count, lastGroup.materialIndex);
                }
                lastGroup = { start: faceIndex * 3, count: 0, materialIndex: lastMaterialIndex };
            }
            faceIndex++;
        }

        if (lastGroup != null) {
            lastGroup.count = (faceIndex * 3) - lastGroup.start;
            geometry.addGroup(lastGroup.start, lastGroup.count, lastGroup.materialIndex);
        }

        geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
        geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
        geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));
        geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));

        const mesh = new Mesh(geometry, materials);
        mesh.rotateY(Math.PI);
        const scale = ModelRenderer.MODEL_SCALE;
        mesh.scale.set(scale, scale, scale);

        this.rsModelMesh = mesh;
        this.scene.add(mesh);
    }

    getMeshFromRsModel(model: Rs2Model): Mesh {
        model.applyLighting(64, 768, -50, -10, -50, true);
        model.computeTextureUVs();

        const geometry = new BufferGeometry();
        const materials = new Array<Material>();

        // the default material
        materials.push(new MeshBasicMaterial({
            side: DoubleSide,
            vertexColors: true
        }));

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
            const faceType = model.faceTypes == null ? 0 : (model.faceTypes[i] & 0x3);
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
                    throw new Error('Unhandled face type: ' + faceType);
            }

            // vertices and normals
            for (const vertex of [faceA, faceB, faceC]) {
                vertices.push(model.verticesX[vertex] || 0);
                vertices.push(-model.verticesY[vertex] || 0);
                vertices.push(model.verticesZ[vertex] || 0);

                const vertexNormal = model.vertexNormals[vertex];
                normals.push(vertexNormal.x || 0);
                normals.push(-vertexNormal.y || 0);
                normals.push(vertexNormal.z || 0);
            }

            // colors
            let materialIndex = 0;
            switch (faceType) {
                case ModelRenderer.FACE_SHADED:
                    const shadowedColorX = new Color(ModelColor.hsbToRgb(model.faceColorsX[i]));
                    const shadowedColorY = new Color(ModelColor.hsbToRgb(model.faceColorsY[i]));
                    const shadowedColorZ = new Color(ModelColor.hsbToRgb(model.faceColorsZ[i]));
                    for(const color of [shadowedColorX, shadowedColorY, shadowedColorZ]) {
                        colors.push(color.r);
                        colors.push(color.g);
                        colors.push(color.b);
                    }
                    break;
                case ModelRenderer.FACE_DEFAULT:
                    const colorXYZ = new Color(ModelColor.hsbToRgb(model.faceColorsX[i]));
                    for(const color of [colorXYZ, colorXYZ, colorXYZ]) {
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
                /*const textureId = model.faceTextures[i];
                if (textureId !== -1) {
                    materialIndex = materialIndices[textureId];
                    if (materialIndex === undefined) {
                        const texture = textureStore.getTexture(textureId);
                        if (texture) {
                            materialIndices[textureId] = materialIndex = materials.length;
                            texture.generatePixels(fileStore.spriteStore);
                            materials.push(this.createTextureMaterial(texture));
                        } else {
                            materialIndex = 0;
                        }
                    }
                }*/
            }

            if (materialIndex !== lastMaterialIndex) {
                lastMaterialIndex = materialIndex;
                if (lastGroup != null) {
                    lastGroup.count = (faceIndex * 3) - lastGroup.start;
                    geometry.addGroup(lastGroup.start, lastGroup.count, lastGroup.materialIndex);
                }
                lastGroup = { start: faceIndex * 3, count: 0, materialIndex: lastMaterialIndex };
            }
            faceIndex++;
        }

        if (lastGroup != null) {
            lastGroup.count = (faceIndex * 3) - lastGroup.start;
            geometry.addGroup(lastGroup.start, lastGroup.count, lastGroup.materialIndex);
        }

        geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
        geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
        geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));
        geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));

        const mesh = new Mesh(geometry, materials);
        mesh.rotateY(Math.PI);
        const scale = ModelRenderer.MODEL_SCALE;
        mesh.scale.set(scale, scale, scale);

        return mesh;
    }

    /*createTextureMaterial(texture: Texture): Material {
        const material = new MeshBasicMaterial({
            side: DoubleSide,
            vertexColors: true
        });
        texture.toBase64().then(value => {
            material.map = new TextureLoader().load('data:image/png;base64,' + value);
            material.needsUpdate = true;
        });
        return material;
    }*/

    animate(): void {
        if (document.readyState !== 'loading') {
            this.render();
        } else {
            window.addEventListener('DOMContentLoaded', () => {
                this.render();
            });
        }
        window.addEventListener('resize', () => {
            this.resize();
        });
    }

    render(): void {
        this.frameId = requestAnimationFrame(() => {
            this.render();
        });
        this.renderer.render(this.scene, this.camera);
    }

    resize(): void {
        const width = 512;
        const height = 334;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }

}

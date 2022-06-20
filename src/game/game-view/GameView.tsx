import './GameView.scss';
import { createRef, useEffect, useState } from 'react';
import Text from '../../store/fonts/Text';
import { store } from '../../store';
import { ModelRenderer } from '../../store/models/model-renderer';
import { MapFileTranscoder } from '../../store/maps/map-file.transcoder';
import {
    BufferAttribute, Color, DirectionalLight, DoubleSide,
    Mesh,
    MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial, MeshStandardMaterial,
    PlaneBufferGeometry,
} from 'three';


const GameView = () => {
    const canvasRef = createRef<HTMLCanvasElement>();
    const [ loading, setLoading ] = useState(true);

    useEffect(() => {
        const modelRenderer = new ModelRenderer();
        modelRenderer.createScene(canvasRef.current);
        modelRenderer.controls.listenToKeyEvents(document.body);

        const testRenderer = async () => {
            const model1 = await store.getModel(2635);
            const model2 = await store.getModel(363);
            modelRenderer.removeRsModelMesh();
            modelRenderer.createRsModelMesh(model1);
            modelRenderer.createRsModelMesh(model2);

            // tutorial island center map
            const mapFile = await MapFileTranscoder.decode('m48_48');

            const geometry = new PlaneBufferGeometry(64, 64, 63, 63);

            const material = [new MeshPhongMaterial({
                vertexColors: true,
                side: DoubleSide,
                // transparent: true,
                // opacity: 0.7,
                flatShading: true,
                // color: new Color(165, 42, 42),
                // wireframe: true,
            })];

            const plane = new Mesh(geometry, material);
            plane.name = 'Terrain';

            const vertices = [];
            const colors = [];
            const { heights } = mapFile.tiles;
            const level = 0;

            for (let y = 0; y < 64; y++) {
                for (let x = 0; x < 64; x++) {
                    let height = heights[level][x][y];

                    if(height === undefined || height === null || isNaN(height)) {
                        height = 0;
                    }

                    colors.push(81, 92, 14);
                    vertices.push(x * 64, -height / 2, -(y * 64));
                }
            }

            geometry.addGroup(0, vertices.length * 3, 0);

            plane.rotation.set(0,-Math.PI / 2,0);
            plane.position.set(-52, 0, -52);

            plane.geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
            plane.geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));
            plane.geometry.computeVertexNormals();

            plane.scale.set(ModelRenderer.MODEL_SCALE, ModelRenderer.MODEL_SCALE, ModelRenderer.MODEL_SCALE);

            modelRenderer.scene.add(plane);

            modelRenderer.animate();

            const light = new DirectionalLight(0xffffff, 0.0025);
            light.position.set(-60, 50, 0);
            modelRenderer.scene.add(light);
        };

        testRenderer().catch(console.error).finally(() => setLoading(false));
    }, []);

    return (
        <div className="rjs-game-view">
            <canvas id="gameview" className="rjs-game-view-canvas" ref={canvasRef}/>
            { loading && (
                <Text font="p12_full" className="rjs-loading-text" align="center">
                    Loading - please wait...
                </Text>
            )}
        </div>
    );
};

export default GameView;

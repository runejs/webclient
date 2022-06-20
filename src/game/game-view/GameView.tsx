import './GameView.scss';
import { createRef, useEffect, useState } from 'react';
import Text from '../../store/fonts/Text';
import { store } from '../../store';
import { ModelRenderer } from '../../store/models/model-renderer';
import { MapFileTranscoder } from '../../store/maps/map-file.transcoder';
import {
    BufferAttribute,
    BufferGeometry,
    DoubleSide,
    EdgesGeometry,
    LineBasicMaterial,
    LineSegments,
    Material,
    Mesh,
    MeshBasicMaterial,
    MeshLambertMaterial,
    MeshPhongMaterial, PlaneBufferGeometry,
    PlaneGeometry,
    WireframeGeometry
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

            // tutorial island center
            const mapFile = await MapFileTranscoder.decode('m48_48');

            console.log(mapFile.tiles.heights);

            const geometry = new PlaneBufferGeometry(64, 64, 63, 63);
            // const geometry = new PlaneGeometry(64, 64, 63, 63);
            // const geometry = new BufferGeometry();

            geometry.rotateX( -Math.PI / 2);

            const material = new MeshLambertMaterial({
                color: '#57b2cd',
                transparent: false,
                wireframe: true,
            });

            const plane = new Mesh(geometry, material);
            plane.name = 'Terrain';

            const vertices = [];
            const colors = [];

            for (let y = 0; y < 64; y++) {
                for (let x = 0; x < 64; x++) {
                    let height = mapFile.tiles.heights[0][x][y];
                    if (height === undefined || height === null || isNaN(height)) {
                        height = 0;
                    }

                    colors.push(255);
                    colors.push(255);
                    colors.push(255);
                    vertices.push(x * 64);
                    vertices.push(-height);
                    vertices.push(-(y * 64));
                }
            }

            plane.rotation.set(0,-Math.PI / 2,0);
            plane.position.set(-54, 0, -54);
            plane.geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
            plane.geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));
            plane.geometry.computeVertexNormals();

            plane.scale.set(ModelRenderer.MODEL_SCALE, ModelRenderer.MODEL_SCALE, ModelRenderer.MODEL_SCALE);

            modelRenderer.scene.add(plane);

            modelRenderer.animate();
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

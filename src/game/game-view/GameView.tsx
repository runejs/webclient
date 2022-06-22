import './GameView.scss';
import { createRef, useEffect, useState } from 'react';
import Text from '../../store/fonts/Text';
import { store } from '../../store';
import { ModelRenderer } from '../../store/models/model-renderer';
import { MapFileTranscoder } from '../../store/maps/map-file.transcoder';
import {
    BufferAttribute,
    DirectionalLight,
    DoubleSide,
    Mesh,
    MeshPhongMaterial,
    PlaneBufferGeometry,
} from 'three';
import { game } from '../../common/game/game';
import { MapRenderer } from '../../store/maps/map-renderer';


const GameView = () => {
    const canvasRef = createRef<HTMLCanvasElement>();
    const [ loading, setLoading ] = useState(true);

    useEffect(() => {
        if (game.sceneCreated) {
            return;
        }

        game.createScene(canvasRef.current);
        game.controls.listenToKeyEvents(document.body);

        const testRenderer = async () => {
            const modelRenderer = new ModelRenderer();
            const model1 = await store.getModel(2635);
            const model2 = await store.getModel(363);
            modelRenderer.removeRsModelMesh();
            modelRenderer.createRsModelMesh(model1);
            modelRenderer.createRsModelMesh(model2);

            let renderedMaps: number = 0;
            let failedMaps: number = 0;

            for (let x = -3; x <= 3; x++) {
                for (let y = -3; y <= 3; y++) {
                    try {
                        const mapRenderer = new MapRenderer(50 + x, 50 + y, x, y);
                        await mapRenderer.loadMap();
                        mapRenderer.createPlane();
                        mapRenderer.render();
                        renderedMaps++;
                    } catch (err) {
                        console.error(err);
                        failedMaps++;
                    }
                }
            }

            console.log(`Rendered ${renderedMaps}${failedMaps ? `, ${failedMaps} failed to load` : ''}`);

            game.animateScene();
        };

        testRenderer().catch(console.error).finally(() => setLoading(false));

        return () => {
            game.destroy();
        };
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

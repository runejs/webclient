import './GameView.scss';
import { createRef, useEffect, useState } from 'react';
import Text from '../../store/fonts/Text';
import { store } from '../../store';
import { ModelRenderer } from '../../store/models/model-renderer';
import { game } from '../../common/game/game';
import { MapRenderer, oldMapRenderer } from '../../store/maps/map-renderer';

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

            const renderMap = async (x: number, y: number, offsetX: number = 0, offsetY: number = 0) => {
                const mapRenderer = new MapRenderer(x, y, offsetX, offsetY);
                await mapRenderer.loadMap();
                await mapRenderer.render();
                renderedMaps++;
            };

            // await renderMap(50, 50);

            const x = 0;
            const y = 0;
            // for (let x = -3; x <= 3; x++) {
            //     for (let y = -3; y <= 3; y++) {
                    try {
                        await renderMap(50 + x, 50 + y, x, y);
                    } catch (err) {
                        console.error(err);
                        failedMaps++;
                    }
            //     }
            // }

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

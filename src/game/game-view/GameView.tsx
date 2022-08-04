import './GameView.scss';
import { createRef, useEffect, useState } from 'react';
import Text from '../../store/fonts/Text';
import { store } from '../../store';
import { ModelRenderer } from '../../store/models/model-renderer';
import { game } from '../../common/game/game';
import { MapRenderer, Terrain, Position } from '../../store/maps';

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

            const terrain = new Terrain(new Position(3230, 3234, 0));
            await terrain.loadRegion();

            const mapRenderer = new MapRenderer(0, 0);
            await mapRenderer.render(terrain);

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

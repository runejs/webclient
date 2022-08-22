import './GameView.scss';
import { createRef, useEffect, useState } from 'react';
import Text from '../../store/fonts/Text';
import { store } from '../../store';
import { ModelRenderer } from '../../store/models/model-renderer';
import { game } from '../../common/game/game';
import { MapRenderer, Terrain, Position } from '../../store/maps';
import { Vector3 } from 'three';
import { TextureFileDecoder } from '../../store/maps/texture-file-decoder';

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
            const phat = await store.getModel(2635);
            modelRenderer.createRsModelMesh(phat);
            // modelRenderer.removeRsModelMesh();

            const firecape = await store.getModel(9638);
            const firecapeMesh = await modelRenderer.createRsModelMesh(firecape);
            firecapeMesh.position.add(new Vector3(0, 10, 0));

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

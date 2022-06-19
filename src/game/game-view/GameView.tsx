import './GameView.scss';
import { createRef, useEffect, useState } from 'react';
import Text from '../../store/fonts/Text';
import { store } from '../../store';
import { ModelRenderer } from '../../store/models/model-renderer';


const GameView = () => {
    const canvasRef = createRef<HTMLCanvasElement>();
    const [ loading, setLoading ] = useState(true);

    useEffect(() => {
        const modelRenderer = new ModelRenderer();
        modelRenderer.createScene(canvasRef.current);
        modelRenderer.animate();
        modelRenderer.controls.listenToKeyEvents(document.body);

        const render = async () => {
            const model1 = await store.getModel(2635);
            const model2 = await store.getModel(363);
            modelRenderer.removeRsModelMesh();
            modelRenderer.createRsModelMesh(model1);
            modelRenderer.createRsModelMesh(model2);
        };

        render().catch(console.error);

        setLoading(false);
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

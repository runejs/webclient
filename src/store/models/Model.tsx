import { createRef, useEffect, useState } from 'react';
import { WebGLRenderer } from 'three';
import { ModelRenderer } from './model-renderer';
import { Rs2Model } from './rs2-model';
import { Rs2ModelTranscoder } from './rs2-model.transcoder';
import { store } from '../store';

let modelCanvasId: number = 0;


export interface ModelProps {
    modelId: number;
}

const Model = (props: ModelProps) => {
    const canvasRef = createRef<HTMLCanvasElement>();
    const [ canvasId ] = useState(() => `rjs-model-${modelCanvasId++}`);

    useEffect(() => {
        const modelRenderer = new ModelRenderer();

        const render = async () => {
            const model = await store.getModel(props.modelId);
            modelRenderer.removeRsModelMesh();
            modelRenderer.createRsModelMesh(model);
        };

        render().catch(console.error);
    }, []);

    return (
        <div className="rjs-model">
            <canvas ref={canvasRef} id={canvasId} className="rjs-model-canvas"/>
        </div>
    );
};

export default Model;

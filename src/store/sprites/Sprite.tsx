import { useEffect, useState } from 'react';
import { SpriteState, toRgb } from './sprite-transcoder';
import { store } from '../store';


let spriteCounter: number = 0;

export interface SpriteProps {
    name: string;
    index?: number;
    canvasId?: string;
    className?: string;
}


const Sprite = (props: SpriteProps) => {
    const [ canvasId, setCanvasId ] = useState(() =>
        props.canvasId || `sprite-${props.name}-${spriteCounter++}`);

    const [ spriteState, setSpriteState ] = useState<SpriteState>(() => ({}));

    useEffect(() => setCanvasId(
        props.canvasId || `sprite-${props.name}-${spriteCounter++}`
    ), [ props.canvasId, props.name ]);

    useEffect(() => {
        const spriteFetcher = async () => {
            setSpriteState(await store.getSprite(props.name, props.index || 0));
        };

        spriteFetcher().catch(console.error);
    }, [ props.name, props.index, canvasId ]);

    useEffect(() => {
        if (!spriteState || !Object.keys(spriteState)?.length) {
            return;
        }

        const canvasElement = document.getElementById(canvasId) as HTMLCanvasElement;
        canvasElement.width = spriteState.width;
        canvasElement.height = spriteState.height;

        const ctx = canvasElement.getContext('2d', { colorSpace: 'display-p3', alpha: true });

        ctx.clearRect(0, 0, spriteState.width, spriteState.height);
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, spriteState.width, spriteState.height);

        const canvasImage = ctx.getImageData(0, 0,
            spriteState.width, spriteState.height, { colorSpace: 'display-p3' });

        for(let x = 0; x < spriteState.width; x++) {
            for(let y = 0; y < spriteState.height; y++) {
                const pixel = spriteState.pixels[spriteState.width * y + x];
                const [ r, g, b ] = toRgb(pixel);
                const pngIndex = (spriteState.width * y + x) << 2;
                if (pixel >> 24 === 0) {
                    canvasImage.data[pngIndex + 3] = 0;
                } else {
                    canvasImage.data[pngIndex] = r;
                    canvasImage.data[pngIndex + 1] = g;
                    canvasImage.data[pngIndex + 2] = b;
                }
            }
        }

        ctx.putImageData(canvasImage, 0, 0);
    }, [ spriteState ]);

    return <canvas id={canvasId} className={props.className}/>;
};

export default Sprite;

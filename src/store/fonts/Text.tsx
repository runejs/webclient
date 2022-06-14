import './Text.scss';
import { useContext, useEffect, useState } from 'react';
import { Font, FontName } from './font';
import { StoreContext } from '../store';


let textCanvasId: number = 0;

export interface TextProps {
    font: FontName;
    color?: number;
    align?: 'center' | 'left' | 'right';
    children?: string;
    className?: string;
    dropShadow?: boolean;
}

const Text = (props: TextProps) => {
    const [ canvasId ] = useState(() => `rjs-text-${textCanvasId++}`);
    const storeState = useContext(StoreContext);
    const { font: fontName, children: text, className, align, color, dropShadow } = props;

    useEffect(() => {
        if (!storeState.fontsLoaded) {
            console.warn('Fonts not yet loaded.');
            return;
        }

        const font = Font.fonts.get(fontName);
        if (!font) {
            console.warn(`Font ${fontName} not yet loaded.`);
            return;
        }

        font.drawString(canvasId, text, color || 0xffffff, dropShadow || false);
    }, [ fontName, text, color, dropShadow, storeState ]);

    return (
        <canvas id={canvasId} className={
            `rjs-text${className ? ` ${className}` : ''}${align ? ` rjs-${align}` : ''
        }`} />
    );
};

export default Text;

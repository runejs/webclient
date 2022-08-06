import { ByteBuffer } from '@runejs/common';
import { store } from '../../../store';
import { GameColor } from '../../../../common/color';


export class Overlay {

    static readonly overlays = new Map<number, Overlay>();

    color: GameColor;
    secondaryColor: GameColor;
    texture: number = -1;
    hideOverlay: boolean = true;

    static async decode(overlayId: number): Promise<Overlay | null> {
        if (overlayId === undefined || overlayId === null) {
            return null;
        }

        if (Overlay.overlays.has(overlayId)) {
            return Overlay.overlays.get(overlayId);
        }

        try {
            const bytes = await store.get(2, 4, overlayId);
            if (!bytes?.length) {
                return null;
            }

            const fileData = new ByteBuffer(bytes);
            if (!fileData?.length) {
                return null;
            }

            const overlay = new Overlay();

            while (true) {
                const opcode = fileData.get('byte', 'u');

                if (opcode === 0) {
                    break;
                }

                if (opcode === 1) {
                    overlay.color = new GameColor(fileData.get('int24'));
                    // console.log(`overlay(${overlayId}).color = `, overlay.color);
                } else if (opcode === 2) {
                    overlay.texture = fileData.get('byte', 'u');
                } else if (opcode === 5) {
                    overlay.hideOverlay = false;
                } else if (opcode === 7) {
                    overlay.secondaryColor = new GameColor(fileData.get('int24'));
                    // console.log(`overlay(${overlayId}).color = `, overlay.secondaryColor);
                }
            }

            Overlay.overlays.set(overlayId, overlay);
            return overlay;
        } catch (err) {
            Overlay.overlays.set(overlayId, null);
            return null;
        }
    }

}

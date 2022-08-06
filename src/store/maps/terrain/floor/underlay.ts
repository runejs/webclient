import { ByteBuffer } from '@runejs/common';
import { store } from '../../../store';
import { GameColor } from '../../../../common/color';


export class Underlay {

    static readonly underlays = new Map<number, Underlay>();

    color: GameColor;

    static async decode(underlayId: number): Promise<Underlay | null> {
        if (underlayId === undefined || underlayId === null) {
            return null;
        }

        if (Underlay.underlays.has(underlayId)) {
            return Underlay.underlays.get(underlayId);
        }

        try {
            const bytes = await store.get(2, 1, underlayId);
            if (!bytes?.length) {
                return null;
            }

            const fileData = new ByteBuffer(bytes);
            if (!fileData?.length) {
                return null;
            }

            const underlay = new Underlay();

            while (true) {
                const opcode = fileData.get('byte', 'u');

                if (opcode === 0) {
                    break;
                }

                if (opcode === 1) {
                    underlay.color = new GameColor(fileData.get('int24'));
                    // console.log(`underlay(${ underlayId }).color = `, underlay.color);
                }
            }

            Underlay.underlays.set(underlayId, underlay);
            return underlay;
        } catch (err) {
            Underlay.underlays.set(underlayId, null);
            return null;
        }
    }

}

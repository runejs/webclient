const Prefixes = {
    terrain: 'm',
    object: 'l',
}

export const getMapId = (type: 'terrain' | 'object', x: number, y: number) => `${Prefixes[type]}${x}_${y}`

/**
 * Get the surrounding terrain and object IDs for a given position
 * @param chunkX
 * @param chunkLocalX
 * @param chunkY
 * @param chunkLocalY
 * @returns
 */
export function getSurroundingDataIds(
    chunkX: number,
    chunkLocalX: number,
    chunkY: number,
    chunkLocalY: number
) {
    const terrainIds: string[] = [];
    const coordinates: number[] = [];

    // TODO
    const objectIds = [];

    for (let x = ((-6 + chunkX) / 8) | 0; x <= (6 + chunkX) / 8; x++) {
        for (let y = ((-6 + chunkY) / 8) | 0; (6 + chunkY) / 8 >= y; y++) {
            const coords = y + (x << 8);

            terrainIds.push(`m${x}_${y}`);
            coordinates.push(coords);
        }
    }

    return {
        terrainIds,
        coordinates,
        objectIds,
    };
}
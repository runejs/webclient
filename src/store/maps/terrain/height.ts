import { iadd } from "../../../common/math";
import { perlinNoise } from "../perlin-noise";

export function calculateVertexHeight(x: number, y: number): number {
    let vertexHeight = iadd(
        -128,
        iadd(
            perlinNoise(x + 45365, 91923 + y, 4),
            -iadd(
                -((perlinNoise(x + 10294, 37821 + y, 2) - 128) >> 1),
                -((-128 + perlinNoise(x, y, 1)) >> 2)
            )
        )
    );
    vertexHeight = 35 + ((0.3 * vertexHeight) | 0);

    if (vertexHeight >= 10) {
        if (vertexHeight > 60) vertexHeight = 60;
    } else vertexHeight = 10;

    return vertexHeight;
}

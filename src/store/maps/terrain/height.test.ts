import { calculateVertexHeight } from "./height";

describe("calculateVertexHeight", () => {
    test("when given x,y as 0,0", () => {
        const x = 0;
        const y = 0;

        const result = calculateVertexHeight(x, y);

        expect(result).toEqual(43);
    });

    test("when given x,y as reasonable values [1]", () => {
        const regionX = 3168;
        const regionY = 3168;
        const x = 2;
        const y = 31;

        const result = calculateVertexHeight(
            regionX + x + 932731,
            regionY + y + 556238
        );

        expect(result).toEqual(15);
    });
});

import { perlinNoise, randomNoise, randomNoiseWeightedSum } from "./perlin-noise";

describe('perlinNoise', () => {
    describe("when scale is 1", () => {
        const scale = 1;

        test('when given x,y as 0,0', () => {
            const x = 0;
            const y = 0;
    
            const result = perlinNoise(x, y, scale);
    
            expect(result).toEqual(128);
        });
    
        test('when given x,y as reasonable values [1]', () => {
            const regionX = 3168;
            const regionY = 3168;
            const x = 2;
            const y = 31;
    
            const result = perlinNoise(regionX + x + 932731, regionY + y + 556238, scale);
    
            expect(result).toEqual(114);
        });
    });

    describe("when scale is 4", () => {
        const scale = 4;

        test('when given x,y as 0,0', () => {
            const x = 0;
            const y = 0;
    
            const result = perlinNoise(x, y, scale);
    
            expect(result).toEqual(128);
        });
    
        test('when given x,y as reasonable values [1]', () => {
            const regionX = 3168;
            const regionY = 3168;
            const x = 2;
            const y = 31;
    
            const result = perlinNoise(regionX + x + 932731, regionY + y + 556238, scale);
    
            expect(result).toEqual(122);
        });
    });
});

describe("randomNoiseWeightedSum", () => {
    test("test 1", () => {
        const result = randomNoiseWeightedSum(11341, 22980);

        expect(result).toEqual(170);
    })

    test("test 2", () => {
        const result = randomNoiseWeightedSum(5147, 18910);

        expect(result).toEqual(127);
    })

    test("test 3", () => {
        const result = randomNoiseWeightedSum(1, 1);

        expect(result).toEqual(119);
    })

    test("test 4", () => {
        const result = randomNoiseWeightedSum(245316, 162840);

        expect(result).toEqual(80);
    })
})

describe("randomNoise", () => {
    test("test 1", () => {
        const result = randomNoise(11341, 22980);

        expect(result).toEqual(209);
    })

    test("test 2", () => {
        const result = randomNoise(5147, 18910);

        expect(result).toEqual(214);
    })

    test("test 3", () => {
        const result = randomNoise(1, 1);

        expect(result).toEqual(53);
    })

    test("test 4", () => {
        const result = randomNoise(245316, 162840);

        expect(result).toEqual(32);
    })
})
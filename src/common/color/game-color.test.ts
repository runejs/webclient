import { RS2Color } from "./game-color";

describe("RS2Color", () => {
    describe("fromRgbInt", () => {
        describe("for color 0x4b3e14", () => {
            const c = 0x4b3e14;

            it("should return a correctly decoded HSL", () => {
                const color = RS2Color.fromRGBInt(c);

                expect(color.hue).toBe(7);
                expect(color.saturation).toBe(148);
                expect(color.lightness).toBe(47);
                expect(color.hueMultiplier).toBe(55);
            });
        });

        describe("for color 0x125841", () => {
            const c = 0x125841;

            it("should return a correctly decoded HSL", () => {
                const color = RS2Color.fromRGBInt(c);

                expect(color.hue).toBe(31);
                expect(color.saturation).toBe(169);
                expect(color.lightness).toBe(53);
                expect(color.hueMultiplier).toBe(70);
            });
        });
    });

    describe("get rgb", () => {
        describe("for color 0x4b3e14", () => {
            const c = 0x4b3e14;

            it("should return correct rgb", () => {
                const color = RS2Color.fromRGBInt(c);

                const res = color.rgb;

                expect(res).toEqual([ 0x4b, 0x3e, 0x14 ]);
            });
        });
    })
});

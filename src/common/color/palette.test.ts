import { createPaletteItem } from "./palette";

describe("palette", () => {
    describe("createPaletteItem", () => {
        const y = 0;
        const x = 1;

        const brightness = 0.8;
        const hue = 0.0078125;
        const lightness = 0.0625;

        test("should return correct value", () => {
            const rgb = createPaletteItem(brightness, x, y, hue, lightness);

            expect(rgb).toEqual(328451);
        })
    })
})
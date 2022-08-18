import { TileModel } from "./tile-model";

describe("TileModel", () => {
    describe("when constructed", () => {
        const overlayColorA = 10283;
        const underlayColorA = 10283;
        const overlayColorB = 10291;
        const underlayColorB = 10291;
        const overlayColorC = 10304;
        const underlayColorC = 10304;
        const overlayColorD = 10286;
        const underlayColorD = 10286;

        const textureId = -1;

        describe("when shape is 2", () => {
            const shape = 2;

            describe("when rotation is 3", () => {
                const rotation = 3;

                test("should compute correct colors", () => {
                    const tileModel = new TileModel(
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,

                        underlayColorD,
                        overlayColorD,
                        underlayColorC,
                        overlayColorC,
                        underlayColorB,
                        overlayColorB,
                        underlayColorA,
                        overlayColorA,

                        shape,
                        rotation,
                        textureId
                    );

                    const { triangleColorA, triangleColorB, triangleColorC } =
                        tileModel.getRenderInfo();

                    expect(triangleColorA).toEqual([10286, 10291]);
                    expect(triangleColorB).toEqual([10304, 10286]);
                    expect(triangleColorC).toEqual([10283, 10283]);
                });

                test("should compute the correct vertices", () => {                    
                    const tileModel = new TileModel(
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,

                        underlayColorD,
                        overlayColorD,
                        underlayColorC,
                        overlayColorC,
                        underlayColorB,
                        overlayColorB,
                        underlayColorA,
                        overlayColorA,

                        shape,
                        rotation,
                        textureId
                    );

                    const { vertexX, vertexY, vertexZ } =
                        tileModel.getRenderInfo();

                    expect(vertexX).toEqual([0, 128, 128, 0]);
                    expect(vertexY).toEqual([0, 0, 0, 0]);
                    expect(vertexZ).toEqual([0, 0, 128, 128]);
                });
            });
        });
    });
});

const cosineTable = new Array(2048);
const sineTable = new Array(2048);

for (let i = 0; i < 2048; i++) {
    // Pre-calculate sin and cos to save memory
    //
    // Circumference / Cuts = Cut radians
    // Cuts defines how many angles around the circle we want to store, so in this case:
    // PI * 2 / 2048 = 0.0030679615 radians
    //
    // Furthermore, 65536 * x is something we call fixed point arithmetics.
    // It is used to store decimals as an integer instead of a double.
    // 65536 = 2^16, so 16 is the scaling factor

    // The original value can be restored by dividing x by (2^scalingFactor) or just
    // bit-shifting x right by the scaling factor

    // Note that when bit-shifting, you lose all the decimals, and only get the
    // whole number. This is the most common practice wherever the sin and cos
    // tables are used in the client
    //
    // Also, don't forget your basic maths: sin(x) = the length of the opposite side,
    // cos(x) = the length of the adjacent side
    // sin(x) + cos(x) = r

    sineTable[i] = (65536.0 * Math.sin(i * 0.0030679615));
    cosineTable[i] = (65536.0 * Math.cos(i * 0.0030679615));
}


const interpolate = (a: number, b: number, delta: number, scale: number): number => {
    const i = 65536 + -cosineTable[1024 * delta / scale] >> 1;
    return ((65536 + -i) * a >> 16) + (b * i >> 16);
};


const randomNoise = (x: number, y: number): number => {
    let i = 57 * y + x;
    i ^= i << 13;
    const noise = (1376312589 + (i * i * 15731 + 789221) * i) & 0x7fffffff;
    return (noise >> 19) & 0xff;
};


const randomNoiseWeightedSum = (x: number, y: number): number => {
    const dist2 = randomNoise(x - 1, y - 1) + randomNoise(x + 1, y - 1) +
        randomNoise(x - 1, y + 1) + randomNoise(x + 1, y + 1);
    const dist1 = randomNoise(x - 1, y) + randomNoise(x + 1, y) +
        randomNoise(x, y - 1) + randomNoise(x, y + 1);
    const local = randomNoise(x, y);
    return dist2 / 16 + dist1 / 8 + local / 4;
};


export const perlinNoise = (x: number, y: number, scale: number): number => {
    const scaledX = x / scale;
    const scaledY = y / scale;
    const muX = x & scale - 1;
    const muY = y & scale - 1;
    const a = randomNoiseWeightedSum(scaledX, scaledY);
    const b = randomNoiseWeightedSum(scaledX + 1, scaledY);
    const c = randomNoiseWeightedSum(scaledX, scaledY + 1);
    const d = randomNoiseWeightedSum(scaledX + 1, scaledY + 1);
    const i1 = interpolate(a, b, muX, scale);
    const i2 = interpolate(c, d, muX, scale);
    return interpolate(i1, i2, muY, scale);
};


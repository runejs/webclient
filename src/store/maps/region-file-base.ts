export abstract class RegionFileBase {
    x: number;
    y: number;

    private _name: string;

    constructor(name: string) {
        this.name = name;
    }

    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
        if (value && value.includes('_')) {
            const [ x, y ] = value.substring(1)
                .split('_')
                .map(s => Number(s));
            if (x !== undefined && x !== null && !isNaN(x)) {
                this.x = x;
            }
            if (y !== undefined && y !== null && !isNaN(y)) {
                this.y = y;
            }
        }
    }
}

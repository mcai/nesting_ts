export class Vector2d {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    get length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    subtract(v: Vector2d): Vector2d {
        return new Vector2d(this.x - v.x, this.y - v.y);
    }

    add(v: Vector2d): Vector2d {
        return new Vector2d(this.x + v.x, this.y + v.y);
    }
}

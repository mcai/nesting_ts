import {Angle} from "./Angle";

export class Vector2d {
    x: number
    y: number

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    static xAxis: Vector2d = new Vector2d(1.0, 0.0);

    static yAxis: Vector2d = new Vector2d(0.0, 1.0);

    get length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    get orthogonal(): Vector2d {
        return new Vector2d(-this.y, this.x);
    }

    equals(other: Vector2d, tolerance?: number): boolean {
        if (tolerance != undefined && tolerance < 0.0) {
            throw new Error("epsilon < 0");
        }

        if (tolerance != undefined) {
            return Math.abs(other.x - this.x) < tolerance && Math.abs(other.y - this.y) < tolerance;
        }

        return this.x == other.x && this.y == other.y;
    }

    multiply(d: number): Vector2d {
        return new Vector2d(this.x * d, this.y * d);
    }

    divide(d: number): Vector2d {
        return new Vector2d(this.x / d, this.y / d);
    }

    static fromPolar(radius: number, angle: Angle): Vector2d {
        if (radius < 0.0) {
            throw new Error("Expected a radius greater than or equal to zero.");
        }

        return new Vector2d(radius * Math.cos(angle.radians), radius * Math.sin(angle.radians));
    }

    isParallelTo(other: Vector2d, tolerance: number = 1E-10): boolean {
        return Math.abs(1.0 - Math.abs(this.normalize().dotProduct(other.normalize()))) <= tolerance;
    }

    isParallelToByAngle(other: Vector2d, tolerance: Angle): boolean {
        let angle = this.angleTo(other);
        return angle < tolerance || Angle.fromRadians(Math.PI).subtract(angle).lt(tolerance);
    }

    isIsPerpendicularTo(other: Vector2d, tolerance: number = 1E-10): boolean {
        return Math.abs(this.normalize().dotProduct(other.normalize())) < tolerance;
    }

    isIsPerpendicularToByAngle(other: Vector2d, tolerance: Angle): boolean {
        return Math.abs(this.angleTo(other).radians - Math.PI / 2.0) < tolerance.radians;
    }

    signedAngleTo(other: Vector2d, clockWise: boolean = false, returnNegative: boolean = false): Angle {
        let num1 = clockWise ? -1 : 1;
        let num2 = Math.atan2(this.y, this.x);
        if (num2 < 0.0)
            num2 += 2.0 * Math.PI;
        let num3 = Math.atan2(other.y, other.x);
        if (num3 < 0.0)
            num3 += 2.0 * Math.PI;
        let num4 = num1 * (num3 - num2);
        if (num4 < 0.0 && !returnNegative)
            num4 += 2.0 * Math.PI;
        if (num4 > Math.PI && returnNegative)
            num4 -= 2.0 * Math.PI;
        return Angle.fromRadians(num4);
    }

    angleTo(other: Vector2d) {
        return Angle.fromRadians(Math.abs(Math.atan2(this.x * other.y - other.x * this.y, this.x * other.x + this.y * other.y)));
    }

    rotate(angle: Angle): Vector2d {
        let num1 = Math.cos(angle.radians);
        let num2 = Math.sin(angle.radians);
        return new Vector2d(this.x * num1 - this.y * num2, this.x * num2 + this.y * num1);
    }

    dotProduct(other: Vector2d): number {
        return this.x * other.x + this.y * other.y;
    }

    crossProduct(other: Vector2d): number {
        return this.x * other.y - this.y * other.x;
    }

    projectOn(other: Vector2d): Vector2d {
        return other.multiply(this.dotProduct(other) / other.dotProduct(other));
    }

    normalize(): Vector2d {
        let length = this.length;
        return new Vector2d(this.x / length, this.y / length);
    }

    scaleBy(d: number) {
        return new Vector2d(d * this.x, d * this.y);
    }

    negate(): Vector2d {
        return new Vector2d(-1.0 * this.x, -1.0 * this.y);
    }

    subtract(v: Vector2d): Vector2d {
        return new Vector2d(this.x - v.x, this.y - v.y);
    }

    add(v: Vector2d): Vector2d {
        return new Vector2d(this.x + v.x, this.y + v.y);
    }
}


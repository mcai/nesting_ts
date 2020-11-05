import {Angle} from "./Angle";

export class Vector2d {
    X: number
    Y: number

    constructor(x: number, y: number) {
        this.X = x;
        this.Y = y;
    }

    static XAxis: Vector2d = new Vector2d(1.0, 0.0);

    static YAxis: Vector2d = new Vector2d(0.0, 1.0);

    get Length(): number {
        return Math.sqrt(this.X * this.X + this.Y * this.Y);
    }

    get Orthogonal(): Vector2d {
        return new Vector2d(-this.Y, this.X);
    }

    Equals(other: Vector2d, tolerance?: number): boolean {
        if (tolerance != undefined && tolerance < 0.0) {
            throw new Error("epsilon < 0");
        }

        if (tolerance != undefined) {
            return Math.abs(other.X - this.X) < tolerance && Math.abs(other.Y - this.Y) < tolerance;
        }

        return this.X == other.X && this.Y == other.Y;
    }

    Multiply(d: number): Vector2d {
        return new Vector2d(this.X * d, this.Y * d);
    }

    Divide(d: number): Vector2d {
        return new Vector2d(this.X / d, this.Y / d);
    }

    static FromPolar(radius: number, angle: Angle): Vector2d {
        if (radius < 0.0) {
            throw new Error("Expected a radius greater than or equal to zero.");
        }

        return new Vector2d(radius * Math.cos(angle.Radians), radius * Math.sin(angle.Radians));
    }

    IsParallelTo(other: Vector2d, tolerance: number = 1E-10): boolean {
        return Math.abs(1.0 - Math.abs(this.Normalize().DotProduct(other.Normalize()))) <= tolerance;
    }

    IsParallelToByAngle(other: Vector2d, tolerance: Angle): boolean {
        let angle = this.AngleTo(other);
        return angle < tolerance || Angle.FromRadians(Math.PI).Subtract(angle).Lt(tolerance);
    }

    IsPerpendicularTo(other: Vector2d, tolerance: number = 1E-10): boolean {
        return Math.abs(this.Normalize().DotProduct(other.Normalize())) < tolerance;
    }

    IsPerpendicularToByAngle(other: Vector2d, tolerance: Angle): boolean {
        return Math.abs(this.AngleTo(other).Radians - Math.PI / 2.0) < tolerance.Radians;
    }

    SignedAngleTo(other: Vector2d, clockWise: boolean = false, returnNegative: boolean = false): Angle {
        let num1 = clockWise ? -1 : 1;
        let num2 = Math.atan2(this.Y, this.X);
        if (num2 < 0.0)
            num2 += 2.0 * Math.PI;
        let num3 = Math.atan2(other.Y, other.X);
        if (num3 < 0.0)
            num3 += 2.0 * Math.PI;
        let num4 = num1 * (num3 - num2);
        if (num4 < 0.0 && !returnNegative)
            num4 += 2.0 * Math.PI;
        if (num4 > Math.PI && returnNegative)
            num4 -= 2.0 * Math.PI;
        return Angle.FromRadians(num4);
    }

    AngleTo(other: Vector2d) {
        return Angle.FromRadians(Math.abs(Math.atan2(this.X * other.Y - other.X * this.Y, this.X * other.X + this.Y * other.Y)));
    }

    Rotate(angle: Angle): Vector2d {
        let num1 = Math.cos(angle.Radians);
        let num2 = Math.sin(angle.Radians);
        return new Vector2d(this.X * num1 - this.Y * num2, this.X * num2 + this.Y * num1);
    }

    DotProduct(other: Vector2d): number {
        return this.X * other.X + this.Y * other.Y;
    }

    CrossProduct(other: Vector2d): number {
        return this.X * other.Y - this.Y * other.X;
    }

    ProjectOn(other: Vector2d): Vector2d {
        return other.Multiply(this.DotProduct(other) / other.DotProduct(other));
    }

    Normalize(): Vector2d {
        let length = this.Length;
        return new Vector2d(this.X / length, this.Y / length);
    }

    ScaleBy(d: number) {
        return new Vector2d(d * this.X, d * this.Y);
    }

    Negate(): Vector2d {
        return new Vector2d(-1.0 * this.X, -1.0 * this.Y);
    }

    Subtract(v: Vector2d): Vector2d {
        return new Vector2d(this.X - v.X, this.Y - v.Y);
    }

    Add(v: Vector2d): Vector2d {
        return new Vector2d(this.X + v.X, this.Y + v.Y);
    }
}


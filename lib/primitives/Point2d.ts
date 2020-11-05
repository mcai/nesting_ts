import {Vector2d} from "./Vector2d";
import {Angle} from "./Angle";
import Enumerable from "linq";

export class Point2d {
    X: number
    Y: number

    constructor(x: number, y: number) {
        this.X = x;
        this.Y = y;
    }

    static get origin(): Point2d {
        return new Point2d(0.0, 0.0);
    }

    Add(vector: Vector2d): Point2d {
        return new Point2d(this.X + vector.X, this.Y + vector.Y);
    }

    Subtract(vector: Vector2d): Point2d {
        return new Point2d(this.X - vector.X, this.Y - vector.Y);
    }

    SubtractByPoint(other: Point2d): Vector2d {
        return new Vector2d(this.X - other.X, this.Y - other.Y);
    }

    Equals(other: Point2d, tolerance?: number): boolean {
        if (tolerance != undefined && tolerance < 0.0) {
            throw new Error("epsilon < 0");
        }

        if (tolerance != undefined) {
            return Math.abs(other.X - this.X) < tolerance && Math.abs(other.Y - this.Y) < tolerance;
        }

        return this.X == other.X && this.Y == other.Y;
    }

    static FromPolar(radius: number, angle: Angle) {
        if (radius < 0.0) {
            throw new Error("Expected a radius greater than or equal to zero.");
        }

        return new Point2d(radius * Math.cos(angle.Radians), radius * Math.sin(angle.Radians));
    }

    static Centroid(points: Point2d[]): Point2d {
        let enumerable = Enumerable.from(points);

        return new Point2d(
            enumerable.average(point => point.X),
            enumerable.average(point => point.Y)
        )
    }

    static MidPoint(point1: Point2d, point2: Point2d): Point2d {
        return Point2d.Centroid([point1, point2]);
    }

    VectorTo(otherPoint: Point2d): Vector2d {
        return otherPoint.SubtractByPoint(this);
    }

    DistanceTo(otherPoint: Point2d): number {
        return this.VectorTo(otherPoint).Length;
    }

    ToVector2d(): Vector2d {
        return new Vector2d(this.X, this.Y);
    }
}

import {Vector2d} from "./Vector2d";
import {Angle} from "./Angle";
import Enumerable from "linq";

export class Point2d {
    x: number
    y: number

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    static get origin(): Point2d {
        return new Point2d(0.0, 0.0);
    }

    add(vector: Vector2d): Point2d {
        return new Point2d(this.x + vector.x, this.y + vector.y);
    }

    subtract(vector: Vector2d): Point2d {
        return new Point2d(this.x - vector.x, this.y - vector.y);
    }

    subtractByPoint(other: Point2d): Vector2d {
        return new Vector2d(this.x - other.x, this.y - other.y);
    }

    equals(other: Point2d, tolerance?: number): boolean {
        if (tolerance != undefined && tolerance < 0.0) {
            throw new Error("epsilon < 0");
        }

        if (tolerance != undefined) {
            return Math.abs(other.x - this.x) < tolerance && Math.abs(other.y - this.y) < tolerance;
        }

        return this.x == other.x && this.y == other.y;
    }

    static fromPolar(radius: number, angle: Angle) {
        if (radius < 0.0) {
            throw new Error("Expected a radius greater than or equal to zero.");
        }

        return new Point2d(radius * Math.cos(angle.radians), radius * Math.sin(angle.radians));
    }

    static centroid(points: Point2d[]): Point2d {
        let enumerable = Enumerable.from(points);

        return new Point2d(
            enumerable.average(point => point.x),
            enumerable.average(point => point.y)
        )
    }

    static midPoint(point1: Point2d, point2: Point2d): Point2d {
        return Point2d.centroid([point1, point2]);
    }

    vectorTo(otherPoint: Point2d): Vector2d {
        return otherPoint.subtractByPoint(this);
    }

    distanceTo(otherPoint: Point2d): number {
        return this.vectorTo(otherPoint).length;
    }

    toVector2d(): Vector2d {
        return new Vector2d(this.x, this.y);
    }
}

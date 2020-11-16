import { Vector2d } from "./Vector2d";
import { Point2d } from "./Point2d";
import { Vector2dExtensions } from "./Vector2dExtensions";

export class Point2dExtensions {
    static add(point: Point2d, vector: Vector2d): Point2d {
        return {
            X: point.X + vector.X,
            Y: point.Y + vector.Y,
        };
    }

    static subtract(point: Point2d, other: Point2d): Vector2d {
        return {
            X: point.X - other.X,
            Y: point.Y - other.Y,
        };
    }

    static vectorTo(point: Point2d, otherPoint: Point2d): Vector2d {
        return this.subtract(otherPoint, point);
    }

    static distanceTo(point: Point2d, otherPoint: Point2d): number {
        return Vector2dExtensions.getLength(this.vectorTo(point, otherPoint));
    }
}

import { Vector2d } from "./Vector2d";

export class Point2d {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    add(vector: Vector2d): Point2d {
        return new Point2d(this.x + vector.x, this.y + vector.y);
    }

    subtractByVector(vector: Vector2d): Point2d {
        return new Point2d(this.x - vector.x, this.y - vector.y);
    }

    subtract(other: Point2d): Vector2d {
        return new Vector2d(this.x - other.x, this.y - other.y);
    }

    vectorTo(otherPoint: Point2d): Vector2d {
        return otherPoint.subtract(this);
    }

    distanceTo(otherPoint: Point2d): number {
        return this.vectorTo(otherPoint).length;
    }

    toVector2d(): Vector2d {
        return new Vector2d(this.x, this.y);
    }
}

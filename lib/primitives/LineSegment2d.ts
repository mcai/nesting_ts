import {Point2d} from "./Point2d";
import {Vector2d} from "./Vector2d";
import {Angle} from "./Angle";

export class LineSegment2d {
    startPoint: Point2d
    endPoint: Point2d

    constructor(startPoint: Point2d, endPoint: Point2d) {
        this.startPoint = startPoint;
        this.endPoint = endPoint;
    }

    get length(): number {
        return this.startPoint.distanceTo(this.endPoint);
    }

    get direction(): Vector2d {
        return this.startPoint.vectorTo(this.endPoint).normalize();
    }

    equals(other: LineSegment2d, tolerance?: number): boolean {
        if (tolerance != undefined) {
            return this.startPoint.equals(other.startPoint, tolerance) && this.endPoint.equals(other.endPoint, tolerance);
        }

        return this.startPoint == other.startPoint && this.endPoint == other.endPoint;
    }

    translateBy(vector: Vector2d): LineSegment2d {
        let vector2D1 = this.startPoint.toVector2d().add(vector);
        let vector2D2 = this.endPoint.toVector2d().add(vector);
        return new LineSegment2d(new Point2d(vector2D1.x, vector2D1.y), new Point2d(vector2D2.x, vector2D2.y));
    }

    lineTo(p: Point2d): LineSegment2d {
        return new LineSegment2d(this.closestPointTo(p), p);
    }

    closestPointTo(p: Point2d): Point2d {
        let num = this.startPoint.vectorTo(p).dotProduct(this.direction);
        if (num < 0.0)
            num = 0.0;
        let length = this.length;
        if (num > length)
            num = length;
        return this.startPoint.add(this.direction.multiply(num));
    }

    tryIntersect(other: LineSegment2d, tolerance: Angle): [boolean, Point2d] {
        if (this.isParallelTo(other, tolerance)) {
            return [false, Point2d.origin];
        }
        let startPoint1 = this.startPoint;
        let startPoint2 = other.startPoint;
        let other1 = this.startPoint.vectorTo(this.endPoint);
        let other2 = other.startPoint.vectorTo(other.endPoint);
        let num1 = (startPoint2.subtractByPoint(startPoint1)).crossProduct(other2) / other1.crossProduct(other2);
        let num2 = (startPoint1.subtractByPoint(startPoint2)).crossProduct(other1) / other2.crossProduct(other1);
        let intersection = startPoint1.add(other1.multiply(num1));
        return [0.0 <= num1 && num1 <= 1.0 && 0.0 <= num2 && num2 <= 1.0, intersection];
    }

    isParallelTo(other: LineSegment2d, tolerance: Angle): boolean {
        return this.direction.isParallelToByAngle(other.direction, tolerance);
    }
}

import {Point2d} from "./Point2d";
import {Vector2d} from "./Vector2d";
import {Angle} from "./Angle";

export class LineSegment2d {
    StartPoint: Point2d
    EndPoint: Point2d

    constructor(startPoint: Point2d, endPoint: Point2d) {
        this.StartPoint = startPoint;
        this.EndPoint = endPoint;
    }

    get Length(): number {
        return this.StartPoint.DistanceTo(this.EndPoint);
    }

    get Direction(): Vector2d {
        return this.StartPoint.VectorTo(this.EndPoint).Normalize();
    }

    Equals(other: LineSegment2d, tolerance?: number): boolean {
        if (tolerance != undefined) {
            return this.StartPoint.Equals(other.StartPoint, tolerance) && this.EndPoint.Equals(other.EndPoint, tolerance);
        }

        return this.StartPoint == other.StartPoint && this.EndPoint == other.EndPoint;
    }

    TranslateBy(vector: Vector2d): LineSegment2d {
        let vector2D1 = this.StartPoint.ToVector2d().Add(vector);
        let vector2D2 = this.EndPoint.ToVector2d().Add(vector);
        return new LineSegment2d(new Point2d(vector2D1.X, vector2D1.Y), new Point2d(vector2D2.X, vector2D2.Y));
    }

    LineTo(p: Point2d): LineSegment2d {
        return new LineSegment2d(this.ClosestPointTo(p), p);
    }

    ClosestPointTo(p: Point2d): Point2d {
        let num = this.StartPoint.VectorTo(p).DotProduct(this.Direction);
        if (num < 0.0)
            num = 0.0;
        let length = this.Length;
        if (num > length)
            num = length;
        return this.StartPoint.Add(this.Direction.Multiply(num));
    }

    TryIntersect(other: LineSegment2d, tolerance: Angle): [boolean, Point2d] {
        if (this.IsParallelTo(other, tolerance)) {
            return [false, Point2d.origin];
        }
        let startPoint1 = this.StartPoint;
        let startPoint2 = other.StartPoint;
        let other1 = this.StartPoint.VectorTo(this.EndPoint);
        let other2 = other.StartPoint.VectorTo(other.EndPoint);
        let num1 = (startPoint2.SubtractByPoint(startPoint1)).CrossProduct(other2) / other1.CrossProduct(other2);
        let num2 = (startPoint1.SubtractByPoint(startPoint2)).CrossProduct(other1) / other2.CrossProduct(other1);
        let intersection = startPoint1.Add(other1.Multiply(num1));
        return [0.0 <= num1 && num1 <= 1.0 && 0.0 <= num2 && num2 <= 1.0, intersection];
    }

    IsParallelTo(other: LineSegment2d, tolerance: Angle): boolean {
        return this.Direction.IsParallelToByAngle(other.Direction, tolerance);
    }
}

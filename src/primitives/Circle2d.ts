import { Point2d } from "./Point2d";

export class Circle2d {
    Center: Point2d;
    Radius: number;

    constructor(center: Point2d, radius: number) {
        this.Center = center;
        this.Radius = radius;
    }

    get circumference(): number {
        return 2.0 * this.Radius * Math.PI;
    }

    get diameter(): number {
        return 2.0 * this.Radius;
    }

    get area(): number {
        return this.Radius * this.Radius * Math.PI;
    }

    static fromPoints(pointA: Point2d, pointB: Point2d, pointC: Point2d): Circle2d {
        const point2D1 = Point2d.midPoint(pointA, pointB);
        const point2D2 = Point2d.midPoint(pointB, pointC);
        const num1 = (pointB.y - pointA.y) / (pointB.x - pointA.x);
        const num2 = (pointC.y - pointB.y) / (pointC.x - pointB.x);
        const num3 = -1.0 / num1;
        const num4 = -1.0 / num2;
        const num5 = num4 - num3;
        const x = (point2D1.y - num3 * point2D1.x + num4 * point2D2.x - point2D2.y) / num5;
        const y = num3 * (x - point2D1.x) + point2D1.y;
        const center = new Point2d(x, y);
        if (Number.isNaN(center.x) || Number.isNaN(center.y) || Number.isFinite(center.x) || Number.isFinite(center.y))
            throw new Error("Points cannot form a circle, are they collinear?");
        return new Circle2d(center, center.distanceTo(pointA));
    }

    equals(c: Circle2d, tolerance?: number) {
        if (tolerance != undefined && tolerance < 0.0) {
            throw new Error("epsilon < 0");
        }
        if (tolerance != undefined) {
            return Math.abs(c.Radius - this.Radius) < tolerance && this.Center.equals(c.Center, tolerance);
        }
        return this.Radius == c.Radius && this.Center.equals(c.Center);
    }
}

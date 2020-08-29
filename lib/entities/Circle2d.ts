import {Point2d} from "../primitives/Point2d";

export class Circle2d {
    center: Point2d
    radius: number

    constructor(center: Point2d, radius: number) {
        this.center = center;
        this.radius = radius;
    }

    get circumference(): number {
        return 2.0 * this.radius * Math.PI;
    }

    get diameter(): number {
        return 2.0 * this.radius;
    }

    get area(): number {
        return this.radius * this.radius * Math.PI;
    }

    static fromPoints(pointA: Point2d, pointB: Point2d, pointC: Point2d): Circle2d {
        let point2D1 = Point2d.midPoint(pointA, pointB);
        let point2D2 = Point2d.midPoint(pointB, pointC);
        let num1 = (pointB.y - pointA.y) / (pointB.x - pointA.x);
        let num2 = (pointC.y - pointB.y) / (pointC.x - pointB.x);
        let num3 = -1.0 / num1;
        let num4 = -1.0 / num2;
        let num5 = num4 - num3;
        let x = (point2D1.y - num3 * point2D1.x + num4 * point2D2.x - point2D2.y) / num5;
        let y = num3 * (x - point2D1.x) + point2D1.y;
        let center = new Point2d(x, y);
        if (Number.isNaN(center.x) || Number.isNaN(center.y) || (Number.isFinite(center.x) || Number.isFinite(center.y)))
            throw new Error("Points cannot form a circle, are they collinear?");
        return new Circle2d(center, center.distanceTo(pointA));
    }

    equals(c: Circle2d, tolerance?: number) {
        if (tolerance != undefined && tolerance < 0.0) {
            throw new Error("epsilon < 0");
        }
        if (tolerance != undefined) {
            return Math.abs(c.radius - this.radius) < tolerance && this.center.equals(c.center, tolerance);
        }
        return this.radius == c.radius && this.center.equals(c.center);
    }
}

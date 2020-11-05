import {Point2d} from "../primitives/Point2d";

export class Circle2d {
    Center: Point2d
    Radius: number

    constructor(center: Point2d, radius: number) {
        this.Center = center;
        this.Radius = radius;
    }

    get Circumference(): number {
        return 2.0 * this.Radius * Math.PI;
    }

    get Diameter(): number {
        return 2.0 * this.Radius;
    }

    get Area(): number {
        return this.Radius * this.Radius * Math.PI;
    }

    static FromPoints(pointA: Point2d, pointB: Point2d, pointC: Point2d): Circle2d {
        let point2D1 = Point2d.MidPoint(pointA, pointB);
        let point2D2 = Point2d.MidPoint(pointB, pointC);
        let num1 = (pointB.Y - pointA.Y) / (pointB.X - pointA.X);
        let num2 = (pointC.Y - pointB.Y) / (pointC.X - pointB.X);
        let num3 = -1.0 / num1;
        let num4 = -1.0 / num2;
        let num5 = num4 - num3;
        let x = (point2D1.Y - num3 * point2D1.X + num4 * point2D2.X - point2D2.Y) / num5;
        let y = num3 * (x - point2D1.X) + point2D1.Y;
        let center = new Point2d(x, y);
        if (Number.isNaN(center.X) || Number.isNaN(center.Y) || (Number.isFinite(center.X) || Number.isFinite(center.Y)))
            throw new Error("Points cannot form a circle, are they collinear?");
        return new Circle2d(center, center.DistanceTo(pointA));
    }

    Equals(c: Circle2d, tolerance?: number) {
        if (tolerance != undefined && tolerance < 0.0) {
            throw new Error("epsilon < 0");
        }
        if (tolerance != undefined) {
            return Math.abs(c.Radius - this.Radius) < tolerance && this.Center.Equals(c.Center, tolerance);
        }
        return this.Radius == c.Radius && this.Center.Equals(c.Center);
    }
}

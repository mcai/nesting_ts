import {Point2d} from "../primitives/Point2d";
import {Angle} from "../primitives/Angle";
import {Vector2d} from "../primitives/Vector2d";

export class BulgeHelper {
    static getPointAtAngle(center: Point2d, radius: number, angle: Angle): Point2d {
        return center.add(Vector2d.xAxis.rotate(angle).multiply(radius));
    }

    static angleFromXAxisTo(p1: Point2d, p2: Point2d): Angle {
        return Vector2d.xAxis.signedAngleTo(p2.subtractByPoint(p1));
    }

    static signedBulgeRadius(startPoint: Point2d, endPoint: Point2d, bulge: number) {
        return startPoint.distanceTo(endPoint) * (1.0 + bulge * bulge) / 4.0 / bulge;
    }

    static bulgeToArc(startPoint: Point2d, endPoint: Point2d, bulge: number)
        : {center: Point2d, radius: number, startAngle: Angle, endAngle: Angle} {
        let radius = BulgeHelper.signedBulgeRadius(startPoint, endPoint, bulge);

        let startEndAngle = BulgeHelper.angleFromXAxisTo(startPoint, endPoint);

        let angleToCenter = startEndAngle.add(Angle.fromRadians(Math.PI / 2 - Math.atan(bulge) * 2));

        let center = BulgeHelper.getPointAtAngle(startPoint, radius, angleToCenter);

        let startAngle = BulgeHelper.angleFromXAxisTo(center, startPoint);
        let endAngle = BulgeHelper.angleFromXAxisTo(center, endPoint);

        return {
            center: center,
            radius: Math.abs(radius),
            startAngle: startAngle,
            endAngle: endAngle
        };
    }

    static getBulgeFromMidPoint(startPoint: Point2d, midPoint: Point2d, endPoint: Point2d) {
        let v0 = startPoint.vectorTo(midPoint);
        let v1 = midPoint.vectorTo(endPoint);

        let distance1 = startPoint.distanceTo(midPoint);
        let distance2 = midPoint.distanceTo(endPoint);

        let angle = Math.acos(v0.dotProduct(v1) / (distance1 * distance2));

        return (v0.crossProduct(v1) >= 0 ? 1 : -1) * Math.tan(angle / 2.0);
    }

    static getBulgeFromCenter(startPoint: Point2d, endPoint: Point2d, center: Point2d, clockwise: boolean = false) {
        var startAngle = BulgeHelper.angleFromXAxisTo(center, startPoint);
        var endAngle = BulgeHelper.angleFromXAxisTo(center, endPoint);

        if (clockwise)
        {
            [startAngle, endAngle] = [endAngle, startAngle];
        }

        var angle = endAngle.subtract(startAngle);
        var bulge = Math.tan(angle.normalized().radians / 4.0);

        bulge = !clockwise ? bulge : -bulge;

        return bulge;
    }
}

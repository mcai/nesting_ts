import { Point2d } from "../primitives/Point2d";
import { Angle } from "../primitives/Angle";
import { Vector2d } from "../primitives/Vector2d";

export class BulgeHelper {
    static GetPointAtAngle(center: Point2d, radius: number, angle: Angle): Point2d {
        return center.add(Vector2d.xAxis.rotate(angle).multiply(radius));
    }

    static AngleFromXAxisTo(p1: Point2d, p2: Point2d): Angle {
        return Vector2d.xAxis.signedAngleTo(p2.subtractByPoint(p1));
    }

    static SignedBulgeRadius(startPoint: Point2d, endPoint: Point2d, bulge: number) {
        return (startPoint.distanceTo(endPoint) * (1.0 + bulge * bulge)) / 4.0 / bulge;
    }

    static BulgeToArc(
        startPoint: Point2d,
        endPoint: Point2d,
        bulge: number,
    ): { center: Point2d; radius: number; startAngle: Angle; endAngle: Angle } {
        const radius = BulgeHelper.SignedBulgeRadius(startPoint, endPoint, bulge);

        const startEndAngle = BulgeHelper.AngleFromXAxisTo(startPoint, endPoint);

        const angleToCenter = startEndAngle.add(Angle.fromRadians(Math.PI / 2 - Math.atan(bulge) * 2));

        const center = BulgeHelper.GetPointAtAngle(startPoint, radius, angleToCenter);

        const startAngle = BulgeHelper.AngleFromXAxisTo(center, startPoint);
        const endAngle = BulgeHelper.AngleFromXAxisTo(center, endPoint);

        return {
            center: center,
            radius: Math.abs(radius),
            startAngle: startAngle,
            endAngle: endAngle,
        };
    }

    static GetBulgeFromMidPoint(startPoint: Point2d, midPoint: Point2d, endPoint: Point2d) {
        const v0 = startPoint.vectorTo(midPoint);
        const v1 = midPoint.vectorTo(endPoint);

        const distance1 = startPoint.distanceTo(midPoint);
        const distance2 = midPoint.distanceTo(endPoint);

        const angle = Math.acos(v0.dotProduct(v1) / (distance1 * distance2));

        return (v0.crossProduct(v1) >= 0 ? 1 : -1) * Math.tan(angle / 2.0);
    }

    static GetBulgeFromCenter(startPoint: Point2d, endPoint: Point2d, center: Point2d, isClockwise: boolean = false) {
        let startAngle = BulgeHelper.AngleFromXAxisTo(center, startPoint);
        let endAngle = BulgeHelper.AngleFromXAxisTo(center, endPoint);

        if (isClockwise) {
            [startAngle, endAngle] = [endAngle, startAngle];
        }

        const angle = endAngle.subtract(startAngle);
        let bulge = Math.tan(angle.normalized().radians / 4.0);

        bulge = !isClockwise ? bulge : -bulge;

        return bulge;
    }
}

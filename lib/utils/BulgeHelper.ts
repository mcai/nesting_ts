import {Point2d} from "../primitives/Point2d";
import {Angle} from "../primitives/Angle";
import {Vector2d} from "../primitives/Vector2d";

export class BulgeHelper {
    static GetPointAtAngle(center: Point2d, radius: number, angle: Angle): Point2d {
        return center.Add(Vector2d.XAxis.Rotate(angle).Multiply(radius));
    }

    static AngleFromXAxisTo(p1: Point2d, p2: Point2d): Angle {
        return Vector2d.XAxis.SignedAngleTo(p2.SubtractByPoint(p1));
    }

    static SignedBulgeRadius(startPoint: Point2d, endPoint: Point2d, bulge: number) {
        return startPoint.DistanceTo(endPoint) * (1.0 + bulge * bulge) / 4.0 / bulge;
    }

    static BulgeToArc(startPoint: Point2d, endPoint: Point2d, bulge: number)
        : {center: Point2d, radius: number, startAngle: Angle, endAngle: Angle} {
        let radius = BulgeHelper.SignedBulgeRadius(startPoint, endPoint, bulge);

        let startEndAngle = BulgeHelper.AngleFromXAxisTo(startPoint, endPoint);

        let angleToCenter = startEndAngle.Add(Angle.FromRadians(Math.PI / 2 - Math.atan(bulge) * 2));

        let center = BulgeHelper.GetPointAtAngle(startPoint, radius, angleToCenter);

        let startAngle = BulgeHelper.AngleFromXAxisTo(center, startPoint);
        let endAngle = BulgeHelper.AngleFromXAxisTo(center, endPoint);

        return {
            center: center,
            radius: Math.abs(radius),
            startAngle: startAngle,
            endAngle: endAngle
        };
    }

    static GetBulgeFromMidPoint(startPoint: Point2d, midPoint: Point2d, endPoint: Point2d) {
        let v0 = startPoint.VectorTo(midPoint);
        let v1 = midPoint.VectorTo(endPoint);

        let distance1 = startPoint.DistanceTo(midPoint);
        let distance2 = midPoint.DistanceTo(endPoint);

        let angle = Math.acos(v0.DotProduct(v1) / (distance1 * distance2));

        return (v0.CrossProduct(v1) >= 0 ? 1 : -1) * Math.tan(angle / 2.0);
    }

    static GetBulgeFromCenter(startPoint: Point2d, endPoint: Point2d, center: Point2d, isClockwise: boolean = false) {
        var startAngle = BulgeHelper.AngleFromXAxisTo(center, startPoint);
        var endAngle = BulgeHelper.AngleFromXAxisTo(center, endPoint);

        if (isClockwise)
        {
            [startAngle, endAngle] = [endAngle, startAngle];
        }

        var angle = endAngle.Subtract(startAngle);
        var bulge = Math.tan(angle.Normalized().Radians / 4.0);

        bulge = !isClockwise ? bulge : -bulge;

        return bulge;
    }
}

import { Point2d } from "./Point2d";
import IntPoint = ClipperLib.IntPoint;

export class IntPointExtensions {
    static scaledUp(point2d: Point2d, scale: number) {
        return new IntPoint(point2d.x * scale, point2d.y * scale);
    }

    static scaledDown(intPoint: IntPoint, scale: number) {
        return new Point2d(intPoint.X / scale, intPoint.Y / scale);
    }
}

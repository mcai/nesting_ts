import { Point2d } from "./Point2d";
import Enumerable from "linq";
import Clipper = ClipperLib.Clipper;
import { IntPointExtensions } from "./IntPointExtensions";
import { Settings } from "../utils/Settings";

export class Point2dExtensions {
    static getSignedArea(points: Point2d[]) {
        const clipper = new Clipper();

        const polygon = Enumerable.from(points)
            .select((x) => IntPointExtensions.scaledUp(x, Settings.clipperScale))
            .toArray();

        return clipper.Area(polygon) / Settings.clipperScale / Settings.clipperScale;
    }
}

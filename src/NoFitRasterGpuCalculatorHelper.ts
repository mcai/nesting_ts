import { Point2d } from "./Point2d";
import { Settings } from "./Settings";

export class NoFitRasterGpuCalculatorHelper {
    noFitRaster(
        boardDots: Point2d[],
        stationaryDots: Point2d[],
        orbitingDots: Point2d[],
        orbitingDotsMinimumPoint: Point2d,
    ): Point2d[] {
        let result: Point2d[] = [];

        boardDots.forEach((dot) => {
            const newOrbitingDots = orbitingDots.map((x) => x.add(dot.subtract(orbitingDotsMinimumPoint)));

            if (
                NoFitRasterGpuCalculatorHelper.rasterIntersects(
                    stationaryDots,
                    newOrbitingDots,
                    Settings.gapBetweenDots,
                )
            ) {
                result = [...result, dot];
            }
        });

        return result;
    }

    private static rasterIntersects(a: Point2d[], b: Point2d[], tolerance: number): boolean {
        a.forEach((p1) => {
            b.forEach((p2) => {
                if (p1.distanceTo(p2) < tolerance) {
                    return true;
                }
            });
        });

        return false;
    }
}

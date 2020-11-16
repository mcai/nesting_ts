import { Point2d } from "../geometry/Point2d";
import { Settings } from "../Settings";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { SimpleFormatting } from "../utils/SimpleFormatting";
import moment from "moment";
import { Point2dExtensions } from "../geometry/Point2dExtensions";

export class NoFitRasterGpuCalculatorHelper {
    static listen(port: number) {
        const app = express();

        app.use(express.json({ limit: "100mb" }));
        app.use(express.urlencoded({ limit: "100mb", extended: true }));

        app.use(cors());

        app.use((req, res, next) => {
            const path = req.path;
            const method = req.method;
            const params = JSON.stringify(req.params);
            const query = JSON.stringify(req.query);
            const body = JSON.stringify(req.body);
            const now = SimpleFormatting.toFormattedDateTimeString(moment());

            console.debug(
                `[${now} SimpleServer] call: path=${path},method=${method},params=${params},query=${query},body=${body}`,
            );

            next();
        });

        app.post(`/rest/noFitRaster`, async (req, res) => {
            const { boardDotsJson, stationaryDotsJson, orbitingDotsJson, orbitingDotsMinimumPointJson } = req.body;

            const boardDots = JSON.parse(boardDotsJson as any);
            const stationaryDots = JSON.parse(stationaryDotsJson as any);
            const orbitingDots = JSON.parse(orbitingDotsJson as any);
            const orbitingDotsMinimumPoint = JSON.parse(orbitingDotsMinimumPointJson as any);

            const result = this.noFitRaster(boardDots, stationaryDots, orbitingDots, orbitingDotsMinimumPoint);

            return res.json(result);
        });

        const server = createServer(app);

        server.listen(port, () => {
            const now = SimpleFormatting.toFormattedDateTimeString(moment());
            console.debug(`[${now} NoFitRasterGpuCalculatorHelper] listening: port=${port}`);
        });
    }

    private static noFitRaster(
        boardDots: Point2d[],
        stationaryDots: Point2d[],
        orbitingDots: Point2d[],
        orbitingDotsMinimumPoint: Point2d,
    ): Point2d[] {
        let result: Point2d[] = [];

        boardDots.forEach((dot) => {
            const newOrbitingDots = orbitingDots.map((orbitingDot) =>
                Point2dExtensions.add(orbitingDot, Point2dExtensions.subtract(dot, orbitingDotsMinimumPoint)),
            );

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
        for (const p1 of a) {
            for (const p2 of b) {
                if (Point2dExtensions.distanceTo(p1, p2) < tolerance) {
                    return true;
                }
            }
        }

        return false;
    }
}

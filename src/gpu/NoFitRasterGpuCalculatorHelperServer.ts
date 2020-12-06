import express from "express";
import cors from "cors";
import { createServer } from "http";
import { SimpleFormatting } from "../utils/SimpleFormatting";
import moment from "moment";
import { time } from "./GPUHelper";
import { NoFitRasterGpuCalculatorHelper } from "./NoFitRasterGpuCalculatorHelper";
import { noFitPolygon } from "../geometry/nfp";

export class NoFitRasterGpuCalculatorHelperServer {
    static listen(port: number) {
        const app = express();

        app.use(express.json({ limit: "100mb" }));
        app.use(express.urlencoded({ limit: "100mb", extended: true }));

        app.use(cors());

        app.post(`/rest/noFitPolygon`, async (req, res) => {
            const { stationaryIntPolygonJson, orbitingIntPolygonJson } = req.body;

            const stationaryPolygon = JSON.parse(stationaryIntPolygonJson as any);
            const orbitingPolygon = JSON.parse(orbitingIntPolygonJson as any);

            const result = time(
                (result: any) =>
                    `noFitPolygon:固定配件:${stationaryPolygon.length}个顶点,` +
                    `自由配件:${orbitingPolygon.length}个顶点,` +
                    `结果:${result.length}个顶点,`,
                () =>
                    noFitPolygon(
                        stationaryPolygon.map((dot: any) => [dot.X, dot.Y]),
                        orbitingPolygon.map((dot: any) => [dot.X, dot.Y]),
                    ),
            );

            return res.json(result.map((dot: any) => ({ X: dot[0], Y: dot[1] })));
        });

        app.post(`/rest/rasterDifference`, async (req, res) => {
            const { aIntJson, bIntJson } = req.body;

            const a = JSON.parse(aIntJson as any);
            const b = JSON.parse(bIntJson as any);

            const result = time(
                (result) => `rasterDifference,a:${a.length}个顶点,b:${b.length}个顶点,结果:${result.length}个顶点`,
                () =>
                    NoFitRasterGpuCalculatorHelper.rasterDifference(
                        a.map((dot: any) => [dot.X, dot.Y]),
                        b.map((dot: any) => [dot.X, dot.Y]),
                    ),
            );

            return res.json(result.map((dot: any) => ({ X: dot[0], Y: dot[1] })));
        });

        const server = createServer(app);

        server.listen(port, () => {
            const now = SimpleFormatting.toFormattedDateTimeString(moment());
            console.debug(`[${now} NoFitRasterGpuCalculatorHelperServer] listening: port=${port}`);
        });
    }
}

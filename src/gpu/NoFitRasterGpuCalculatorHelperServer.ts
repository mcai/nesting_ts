import express from "express";
import cors from "cors";
import { createServer } from "http";
import { SimpleFormatting } from "../utils/SimpleFormatting";
import moment from "moment";
import { time } from "./GPUHelper";
import { NoFitRasterGpuCalculatorHelper } from "./NoFitRasterGpuCalculatorHelper";

export class NoFitRasterGpuCalculatorHelperServer {
    static listen(port: number) {
        const app = express();

        app.use(express.json({ limit: "100mb" }));
        app.use(express.urlencoded({ limit: "100mb", extended: true }));

        app.use(cors());

        app.post(`/rest/noFitRaster`, async (req, res) => {
            const { boardDotsJson, stationaryDotsJson, orbitingDotsJson, orbitingDotsMinimumPointJson } = req.body;

            const boardDots = JSON.parse(boardDotsJson as any);
            const stationaryDots = JSON.parse(stationaryDotsJson as any);
            const orbitingDots = JSON.parse(orbitingDotsJson as any);
            const orbitingDotsMinimumPoint = JSON.parse(orbitingDotsMinimumPointJson as any);

            const result = time(
                `noFitRaster:板材:${boardDots.length}个顶点,` +
                    `固定配件:${stationaryDots.length}个顶点,` +
                    `自由配件:${orbitingDots.length}个顶点,`,
                () =>
                    NoFitRasterGpuCalculatorHelper.noFitRaster(
                        boardDots,
                        stationaryDots,
                        orbitingDots,
                        orbitingDotsMinimumPoint,
                    ),
            );

            return res.json(result);
        });

        app.post(`/rest/rasterDifference`, async (req, res) => {
            const { aJson, bJson } = req.body;

            const a = JSON.parse(aJson as any);
            const b = JSON.parse(bJson as any);

            const result = time(`rasterDifference,a:${a.length}个顶点,b:${b.length}个顶点,`, () =>
                NoFitRasterGpuCalculatorHelper.rasterDifference(a, b),
            );

            return res.json(result);
        });

        const server = createServer(app);

        server.listen(port, () => {
            const now = SimpleFormatting.toFormattedDateTimeString(moment());
            console.debug(`[${now} NoFitRasterGpuCalculatorHelperServer] listening: port=${port}`);
        });
    }
}

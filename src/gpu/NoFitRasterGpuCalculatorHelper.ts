import { Settings } from "../utils/Settings";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { SimpleFormatting } from "../utils/SimpleFormatting";
import moment from "moment";
import { GPU } from "gpu.js";

export class NoFitRasterGpuCalculatorHelper {
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

            const result = this.noFitRaster(boardDots, stationaryDots, orbitingDots, orbitingDotsMinimumPoint);

            return res.json(result);
        });

        const server = createServer(app);

        server.listen(port, () => {
            const now = SimpleFormatting.toFormattedDateTimeString(moment());
            console.debug(`[${now} NoFitRasterGpuCalculatorHelper] listening: port=${port}`);
        });
    }

    private static gpu = new GPU({
        mode: "gpu",
    });

    private static noFitRaster(
        boardDots: { X: number; Y: number }[],
        stationaryDots: { X: number; Y: number }[],
        orbitingDots: { X: number; Y: number }[],
        orbitingDotsMinimumPoint: { X: number; Y: number },
    ): { X: number; Y: number }[] {
        const boardDotsX = boardDots.map((x) => x.X);
        const boardDotsY = boardDots.map((x) => x.Y);

        const stationaryDotsX = stationaryDots.map((x) => x.X);
        const stationaryDotsY = stationaryDots.map((x) => x.Y);

        const orbitingDotsX = orbitingDots.map((x) => x.X);
        const orbitingDotsY = orbitingDots.map((x) => x.Y);

        const [orbitingDotsMinimumPointX, orbitingDotsMinimumPointY] = [
            orbitingDotsMinimumPoint.X,
            orbitingDotsMinimumPoint.Y,
        ];

        const { resultX, resultY } = this._noFitRaster(
            boardDotsX,
            boardDotsY,
            stationaryDotsX,
            stationaryDotsY,
            orbitingDotsX,
            orbitingDotsY,
            orbitingDotsMinimumPointX,
            orbitingDotsMinimumPointY,
            Settings.gapBetweenDots,
        );

        return resultX.map((value, index) => ({ X: value, Y: resultY[index] }));
    }

    private static _noFitRaster(
        boardDotsX: number[],
        boardDotsY: number[],

        stationaryDotsX: number[],
        stationaryDotsY: number[],

        orbitingDotsX: number[],
        orbitingDotsY: number[],

        orbitingDotsMinimumPointX: number,
        orbitingDotsMinimumPointY: number,

        gapBetweenDots: number,
    ): { resultX: number[]; resultY: number[] } {
        let resultX: number[] = [];
        let resultY: number[] = [];

        for (let i = 0; i < boardDotsX.length; i++) {
            let found = false;

            for (let j = 0; j < stationaryDotsX.length; j++) {
                if (found) {
                    break;
                }

                for (let k = 0; k < orbitingDotsX.length; k++) {
                    const distance = Math.sqrt(
                        (orbitingDotsX[k] + boardDotsX[i] - orbitingDotsMinimumPointX - stationaryDotsX[j]) *
                            (orbitingDotsX[k] + boardDotsX[i] - orbitingDotsMinimumPointX - stationaryDotsX[j]) +
                            (orbitingDotsY[k] + boardDotsY[i] - orbitingDotsMinimumPointY - stationaryDotsY[j]) *
                                (orbitingDotsY[k] + boardDotsY[i] - orbitingDotsMinimumPointY - stationaryDotsY[j]),
                    );

                    if (distance < gapBetweenDots) {
                        found = true;
                        break;
                    }
                }
            }

            if (found) {
                resultX = [...resultX, boardDotsX[i]];
                resultY = [...resultY, boardDotsY[i]];
            }
        }

        return { resultX, resultY };
    }
}

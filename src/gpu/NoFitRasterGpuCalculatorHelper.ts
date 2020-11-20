import { Settings } from "../utils/Settings";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { SimpleFormatting } from "../utils/SimpleFormatting";
import moment from "moment";
import { GPU } from "gpu.js";
import { time } from "./GPUHelper";

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

            const result = time(`noFitRaster`, () =>
                this.noFitRaster(boardDots, stationaryDots, orbitingDots, orbitingDotsMinimumPoint),
            );

            return res.json(result);
        });

        app.post(`/rest/rasterDifference`, async (req, res) => {
            const { aJson, bJson } = req.body;

            const a = JSON.parse(aJson as any);
            const b = JSON.parse(bJson as any);

            const result = time(`rasterDifference`, () => this.rasterDifference(a, b));

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
        const kernelFunc = this.gpu
            .createKernel(function (
                boardDotsX: number[],
                boardDotsY: number[],

                stationaryDotsX: number[],
                stationaryDotsY: number[],

                orbitingDotsX: number[],
                orbitingDotsY: number[],

                orbitingDotsMinimumPointX: number,
                orbitingDotsMinimumPointY: number,

                gapBetweenDots: number,
            ) {
                for (let j = 0; j < this.constants.numStationaryDots; j++) {
                    for (let k = 0; k < this.constants.numOrbitingDots; k++) {
                        const distance = Math.sqrt(
                            (orbitingDotsX[k] +
                                boardDotsX[this.thread.x] -
                                orbitingDotsMinimumPointX -
                                stationaryDotsX[j]) *
                                (orbitingDotsX[k] +
                                    boardDotsX[this.thread.x] -
                                    orbitingDotsMinimumPointX -
                                    stationaryDotsX[j]) +
                                (orbitingDotsY[k] +
                                    boardDotsY[this.thread.x] -
                                    orbitingDotsMinimumPointY -
                                    stationaryDotsY[j]) *
                                    (orbitingDotsY[k] +
                                        boardDotsY[this.thread.x] -
                                        orbitingDotsMinimumPointY -
                                        stationaryDotsY[j]),
                        );

                        if (distance < gapBetweenDots) {
                            return 1;
                        }
                    }
                }

                return 0;
            })
            .setOutput([boardDotsX.length])
            .setConstants({
                numStationaryDots: stationaryDotsX.length,
                numOrbitingDots: orbitingDotsX.length,
            });

        const out: any = kernelFunc(
            boardDotsX,
            boardDotsY,
            stationaryDotsX,
            stationaryDotsY,
            orbitingDotsX,
            orbitingDotsY,
            orbitingDotsMinimumPointX,
            orbitingDotsMinimumPointY,
            gapBetweenDots,
        );

        return {
            resultX: boardDotsX.filter((value, index) => out[index] == 1),
            resultY: boardDotsY.filter((value, index) => out[index] == 1),
        };
    }

    private static _rasterDifference(
        aX: number[],
        aY: number[],

        bX: number[],
        bY: number[],

        gapBetweenDots: number,
    ): { resultX: number[]; resultY: number[] } {
        const kernelFunc = this.gpu
            .createKernel(function (
                aX: number[],
                aY: number[],

                bX: number[],
                bY: number[],

                gapBetweenDots: number,
            ) {
                for (let k = 0; k < this.constants.numB; k++) {
                    const distance = Math.sqrt(
                        (bX[k] - aX[this.thread.x]) * (bX[k] - aX[this.thread.x]) +
                            (bY[k] - aY[this.thread.x]) * (bY[k] - aY[this.thread.x]),
                    );

                    if (distance < gapBetweenDots) {
                        return 0;
                    }
                }

                return 1;
            })
            .setOutput([aX.length])
            .setConstants({
                numB: bX.length,
            });

        const out: any = kernelFunc(aX, aY, bX, bY, gapBetweenDots);

        return {
            resultX: aX.filter((value, index) => out[index] == 1),
            resultY: aY.filter((value, index) => out[index] == 1),
        };
    }

    private static rasterDifference(
        a: { X: number; Y: number }[],
        b: { X: number; Y: number }[],
    ): { X: number; Y: number }[] {
        const aX = a.map((x) => x.X);
        const aY = a.map((x) => x.Y);

        const bX = b.map((x) => x.X);
        const bY = b.map((x) => x.Y);

        const { resultX, resultY } = this._rasterDifference(aX, aY, bX, bY, Settings.gapBetweenDots);

        return resultX.map((value, index) => ({ X: value, Y: resultY[index] }));
    }
}

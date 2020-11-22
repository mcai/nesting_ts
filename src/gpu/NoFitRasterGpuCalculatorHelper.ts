import { GPU } from "gpu.js";
import { Settings } from "../utils/Settings";

export class NoFitRasterGpuCalculatorHelper {
    private static gpu = new GPU({
        mode: "gpu",
    });

    static noFitRaster(
        boardDots: [number, number][],
        stationaryDots: [number, number][],
        orbitingDots: [number, number][],
        orbitingDotsMinimumPoint: [number, number],
    ): [number, number][] {
        const kernelFunc = this.gpu
            .createKernel(function (
                boardDots: [number, number][],
                stationaryDots: [number, number][],
                orbitingDots: [number, number][],
                orbitingDotsMinimumPoint: [number, number],
                gapBetweenDots: number,
            ) {
                for (let j = 0; j < this.constants.numStationaryDots; j++) {
                    for (let k = 0; k < this.constants.numOrbitingDots; k++) {
                        const distance = Math.sqrt(
                            (orbitingDots[k][0] +
                                boardDots[this.thread.x][0] -
                                orbitingDotsMinimumPoint[0] -
                                stationaryDots[j][0]) *
                                (orbitingDots[k][0] +
                                    boardDots[this.thread.x][0] -
                                    orbitingDotsMinimumPoint[0] -
                                    stationaryDots[j][0]) +
                                (orbitingDots[k][1] +
                                    boardDots[this.thread.x][1] -
                                    orbitingDotsMinimumPoint[1] -
                                    stationaryDots[j][1]) *
                                    (orbitingDots[k][1] +
                                        boardDots[this.thread.x][1] -
                                        orbitingDotsMinimumPoint[1] -
                                        stationaryDots[j][1]),
                        );

                        if (distance < gapBetweenDots) {
                            return 1;
                        }
                    }
                }

                return 0;
            })
            .setOutput([boardDots.length])
            .setConstants({
                numStationaryDots: stationaryDots.length,
                numOrbitingDots: orbitingDots.length,
            });

        const out: any = kernelFunc(
            boardDots,
            stationaryDots,
            orbitingDots,
            orbitingDotsMinimumPoint,
            Settings.gapBetweenDots,
        );

        return boardDots.filter((value, index) => out[index] == 1);
    }

    static rasterDifference(a: [number, number][], b: [number, number][]): [number, number][] {
        const kernelFunc = this.gpu
            .createKernel(function (a: [number, number][], b: [number, number][], gapBetweenDots: number) {
                for (let k = 0; k < this.constants.numB; k++) {
                    const distance = Math.sqrt(
                        (b[k][0] - a[this.thread.x][0]) * (b[k][0] - a[this.thread.x][0]) +
                            (b[k][1] - a[this.thread.x][1]) * (b[k][1] - a[this.thread.x][1]),
                    );

                    if (distance < gapBetweenDots) {
                        return 0;
                    }
                }

                return 1;
            })
            .setOutput([a.length])
            .setConstants({
                numB: b.length,
            });

        const out: any = kernelFunc(a, b, Settings.gapBetweenDots);

        return a.filter((value, index) => out[index] == 1);
    }
}

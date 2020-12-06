import { GPU } from "gpu.js";
import { gapBetweenDots } from "../utils/Settings";

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
                        const x1 = orbitingDots[k][0] + boardDots[this.thread.x][0];
                        const x2 = orbitingDotsMinimumPoint[0] + stationaryDots[j][0];
                        const y1 = orbitingDots[k][1] + boardDots[this.thread.x][1];
                        const y2 = orbitingDotsMinimumPoint[1] + stationaryDots[j][1];

                        const distance = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
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

        const out: any = kernelFunc(boardDots, stationaryDots, orbitingDots, orbitingDotsMinimumPoint, gapBetweenDots);

        return boardDots.filter((value, index) => out[index] == 1);
    }

    static rasterDifference(a: [number, number][], b: [number, number][]): [number, number][] {
        const kernelFunc = this.gpu
            .createKernel(function (a: [number, number][], b: [number, number][], gapBetweenDots: number) {
                for (let k = 0; k < this.constants.numB; k++) {
                    const x1 = b[k][0];
                    const x2 = a[this.thread.x][0];
                    const y1 = b[k][1];
                    const y2 = a[this.thread.x][1];

                    const distance = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));

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

        const out: any = kernelFunc(a, b, gapBetweenDots);

        return a.filter((value, index) => out[index] == 1);
    }
}

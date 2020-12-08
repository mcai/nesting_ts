import { Point, pointInPolygon, Polygon, polygonBounds } from "geometric";
import { GPU } from "gpu.js";
import Shape from "@doodle3d/clipper-js";

const gpu = new GPU({
    mode: "gpu",
});

export function rasterize(bounds: [Point, Point]): Point[] {
    let dots: Point[] = [];

    const boundsSize = [bounds[1][0] - bounds[0][0], bounds[1][1] - bounds[0][1]];

    for (let i = 0; i <= boundsSize[0]; i++) {
        for (let j = 0; j <= boundsSize[1]; j++) {
            dots = [...dots, [bounds[0][0] + i, bounds[0][1] + j]];
        }
    }

    return dots;
}

export function noFitRaster(
    boardDots: [number, number][],
    stationaryDots: [number, number][],
    orbitingDots: [number, number][],
): [number, number][] {
    const kernelFunc = gpu
        .createKernel(function (
            boardDots: [number, number][],
            stationaryDots: [number, number][],
            orbitingDots: [number, number][],
            orbitingDotsMinimumPoint: [number, number],
        ) {
            for (let k = 0; k < this.constants.numOrbitingDots; k++) {
                const x1 = orbitingDots[k][0] + boardDots[this.thread.y][0];
                const x2 = orbitingDotsMinimumPoint[0] + stationaryDots[this.thread.x][0];
                const y1 = orbitingDots[k][1] + boardDots[this.thread.y][1];
                const y2 = orbitingDotsMinimumPoint[1] + stationaryDots[this.thread.x][1];

                if (x1 == x2 && y1 == y2) {
                    return 1;
                }
            }

            return 0;
        })
        .setOutput([stationaryDots.length, boardDots.length])
        .setConstants({
            numOrbitingDots: orbitingDots.length,
        });

    const orbitingDotsBounds = polygonBounds(orbitingDots);

    if (!orbitingDotsBounds) {
        return [];
    }

    const orbitingDotsMinimumPoint = orbitingDotsBounds[0];

    const out: any = kernelFunc(boardDots, stationaryDots, orbitingDots, orbitingDotsMinimumPoint);

    return boardDots.filter((value, index) => out[index].some((x: number) => x == 1));
}

export function rasterDifference(a: [number, number][], b: [number, number][]): [number, number][] {
    const kernelFunc = gpu
        .createKernel(function (a: [number, number][], b: [number, number][]) {
            for (let k = 0; k < this.constants.numB; k++) {
                const x1 = b[k][0];
                const x2 = a[this.thread.x][0];
                const y1 = b[k][1];
                const y2 = a[this.thread.x][1];

                if (x1 == x2 && y1 == y2) {
                    return 0;
                }
            }

            return 1;
        })
        .setOutput([a.length])
        .setConstants({
            numB: b.length,
        });

    const out: any = kernelFunc(a, b);

    return a.filter((value, index) => out[index] == 1);
}

export function noFitPolygon(stationaryPolygon: Polygon, orbitingPolygon: Polygon): [number, number][] {
    const stationaryBounds = polygonBounds(stationaryPolygon);
    const orbitingBounds = polygonBounds(orbitingPolygon);

    if (!stationaryBounds || !orbitingBounds) {
        return [];
    }

    const stationaryBoundsSize = [
        stationaryBounds[1][0] - stationaryBounds[0][0],
        stationaryBounds[1][1] - stationaryBounds[0][1],
    ];

    const orbitingBoundsSize = [
        orbitingBounds[1][0] - orbitingBounds[0][0],
        orbitingBounds[1][1] - orbitingBounds[0][1],
    ];

    const boardBounds: [Point, Point] = [
        [stationaryBounds[0][0] - orbitingBoundsSize[0], stationaryBounds[0][1] - orbitingBoundsSize[1]],
        [stationaryBounds[0][0] + stationaryBoundsSize[0], stationaryBounds[0][1] + stationaryBoundsSize[1]],
    ];

    const boardDots = rasterize(boardBounds);

    const stationaryDots = boardDots.filter((x) => pointInPolygon(x, stationaryPolygon));
    const orbitingDots = boardDots.filter((x) => pointInPolygon(x, orbitingPolygon));

    return noFitRaster(boardDots, stationaryDots, orbitingDots);
}

export function testClipper() {
    const subjectPaths = [
        [
            { X: 30, Y: 30 },
            { X: 10, Y: 30 },
            { X: 10, Y: 10 },
            { X: 30, Y: 10 },
        ],
    ];
    const clipPaths = [
        [
            { X: 20, Y: 20 },
            { X: 0, Y: 20 },
            { X: 0, Y: 0 },
            { X: 20, Y: 0 },
        ],
    ];

    const subject = new Shape(subjectPaths, true);
    const clip = new Shape(clipPaths, true);

    const result = subject.intersect(clip);

    console.log(JSON.stringify(result));
}

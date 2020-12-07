import { Point, pointInPolygon, Polygon, polygonBounds } from "geometric";
import { NoFitRasterGpuCalculatorHelper } from "../gpu/NoFitRasterGpuCalculatorHelper";

export type Vector = [number, number];

export function pointAddVector(a: Point, b: Vector): Point {
    return [a[0] + b[0], a[1] + b[1]];
}

export function pointSubtractVector(a: Point, b: Vector): Point {
    return [a[0] - b[0], a[1] - b[1]];
}

export function vectorTo(from: Point, to: Point): Vector {
    return [to[0] - from[0], to[1] - from[1]];
}

export function getRasterPoints(bounds: [Point, Point]): Point[] {
    let dots: Point[] = [];

    const boundsSize = vectorTo(bounds[0], bounds[1]);

    for (let i = 0; i <= boundsSize[0]; i++) {
        for (let j = 0; j <= boundsSize[1]; j++) {
            dots = [...dots, pointAddVector(bounds[0], [i, j])];
        }
    }

    return dots;
}

export function noFitPolygon(stationaryPolygon: Polygon, orbitingPolygon: Polygon): [number, number][] {
    const stationaryBounds = polygonBounds(stationaryPolygon);
    const orbitingBounds = polygonBounds(orbitingPolygon);

    if (!stationaryBounds || !orbitingBounds) {
        return [];
    }

    const stationaryBoundsSize = vectorTo(stationaryBounds[0], stationaryBounds[1]);
    const orbitingBoundsSize = vectorTo(orbitingBounds[0], orbitingBounds[1]);

    const boardBounds: [Point, Point] = [
        pointSubtractVector(stationaryBounds[0], orbitingBoundsSize),
        pointAddVector(stationaryBounds[0], stationaryBoundsSize),
    ];

    const boardDots = getRasterPoints(boardBounds);

    const stationaryDots = boardDots.filter((x) => pointInPolygon(x, stationaryPolygon));
    const orbitingDots = boardDots.filter((x) => pointInPolygon(x, orbitingPolygon));

    return NoFitRasterGpuCalculatorHelper.noFitRaster(boardDots, stationaryDots, orbitingDots);
}

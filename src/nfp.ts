import { Point, pointInPolygon, Polygon, polygonArea, polygonBounds } from "geometric";
import { GPU } from "gpu.js";
import {
    angleNormalize,
    Entity,
    Part,
    partMoveTo,
    partNestingBounds,
    partRotate,
    pointDistanceTo,
    polygonClean,
    polygonClosestPointTo,
    polygonOffset,
    polygonSimplify,
    vectorAdd,
    vectorSubtract,
} from "./primitives";
import { origin } from "./nesting";
import { noFitPolygonTolerance, partToPartGap, sinkHoleCutterDiameter, tolerance } from "./utils";

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

export function noFitRaster(boardDots: Point[], stationaryDots: Point[], orbitingDots: Point[]): Point[] {
    const kernelFunc = gpu
        .createKernel(function (
            boardDots: Point[],
            stationaryDots: Point[],
            orbitingDots: Point[],
            orbitingDotsMinimumPoint: Point,
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

export function rasterDifference(a: Point[], b: Point[]): Point[] {
    const kernelFunc = gpu
        .createKernel(function (a: Point[], b: Point[]) {
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

export function noFitPolygon(stationaryPolygon: Polygon, orbitingPolygon: Polygon): Polygon {
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

export function noFitPolygons(
    stationaryPartOutsideLoopExtentsPoints: Point[],
    orbitingPartOutsideLoopExtentsPoints: Point[],
    raster: boolean,
): Polygon[] {
    if (!raster) {
        // TODO
        throw new Error("not supported");
    }

    const stationaryPolygons = polygonOffset(stationaryPartOutsideLoopExtentsPoints, partToPartGap).map((x) =>
        polygonClean(polygonSimplify(x), noFitPolygonTolerance),
    );

    const orbitingPolygon = polygonSimplify(orbitingPartOutsideLoopExtentsPoints);

    return stationaryPolygons.map((x) => noFitPolygon(x, orbitingPolygon));
}

export function innerFitPolygons(
    stationaryPartInsideLoopExtentsPoints: Point[],
    orbitingPartOutsideLoopExtentsPoints: Point[],
    raster: boolean,
): Polygon[] {
    if (!raster) {
        // TODO
        throw new Error("not supported");
    }

    stationaryPartInsideLoopExtentsPoints = polygonSimplify(stationaryPartInsideLoopExtentsPoints);

    const orbitingPolygons = polygonOffset(orbitingPartOutsideLoopExtentsPoints, partToPartGap).map((x) =>
        polygonClean(polygonSimplify(x), noFitPolygonTolerance),
    );

    if (!stationaryPartInsideLoopExtentsPoints || !orbitingPolygons) {
        return [];
    }

    if (polygonArea(stationaryPartInsideLoopExtentsPoints, true) < 0) {
        stationaryPartInsideLoopExtentsPoints = stationaryPartInsideLoopExtentsPoints.reverse();
    }

    for (let i = 0; i < orbitingPolygons.length; i++) {
        const orbitingPolygon = orbitingPolygons[i];
        if (polygonArea(orbitingPolygon, true) < 0) {
            orbitingPolygons[i] = orbitingPolygon.reverse();
        }
    }

    const outside = polygonOffset(stationaryPartInsideLoopExtentsPoints, tolerance)[0];
    const inside = stationaryPartInsideLoopExtentsPoints.reverse();

    const outsideLastPoint = outside[outside.length - 1];

    const insideFirstPoint = polygonClosestPointTo(inside, outsideLastPoint);
    const indexOfInsideFirstPoint = inside.indexOf(insideFirstPoint);
    const inside1 = [...inside.slice(indexOfInsideFirstPoint + 1), ...inside.slice(0, indexOfInsideFirstPoint)];

    const stationaryPolygon = [...outside, ...inside1];

    const orbitingPartOutsideLoopBoundingBox = polygonBounds(orbitingPartOutsideLoopExtentsPoints) ?? [origin, origin];

    function isWithinBounds(nfp: Polygon): boolean {
        return orbitingPartOutsideLoopExtentsPoints.every((x) =>
            pointInPolygon(
                vectorAdd(x, vectorSubtract(nfp[0], orbitingPartOutsideLoopBoundingBox[0])),
                stationaryPartInsideLoopExtentsPoints,
            ),
        );
    }

    return orbitingPolygons.map((x) => noFitPolygon(stationaryPolygon, x)).filter((x) => isWithinBounds(x));
}

export function _innerFitPolygons(stationaryPartInsideLoop: Entity, orbitingPartOutsideLoop: Entity, raster: boolean) {
    const stationaryPartInsideLoopIsCircle = stationaryPartInsideLoop.isCircle;
    const orbitingPartOutsideLoopIsCircle = orbitingPartOutsideLoop.isCircle;

    if (stationaryPartInsideLoopIsCircle && orbitingPartOutsideLoopIsCircle) {
        const newCircleIsLessThanOrEqualToCutterDiameter =
            (orbitingPartOutsideLoop.circleDiameter ?? 0.0) <= sinkHoleCutterDiameter + tolerance;

        if (newCircleIsLessThanOrEqualToCutterDiameter) {
            return [];
        }
    }

    if (
        polygonArea(stationaryPartInsideLoop.extentsPoints, false) <
        polygonArea(orbitingPartOutsideLoop.extentsPoints, false)
    ) {
        return [];
    }

    return innerFitPolygons(stationaryPartInsideLoop.extentsPoints, orbitingPartOutsideLoop.extentsPoints, raster);
}

export function _noFitPolygonsAndInnerFitPolygons(
    stationaryPart: Part,
    orbitingPart: Part,
    raster: boolean,
): { noFitPolygons: Polygon[]; innerFitPolygons: Polygon[] } {
    if (pointDistanceTo(partNestingBounds(stationaryPart)[0], origin) > 0.1) {
        throw new Error();
    }

    if (pointDistanceTo(partNestingBounds(orbitingPart)[0], origin) > 0.1) {
        throw new Error();
    }

    const noFitPolygons1 = noFitPolygons(
        stationaryPart.outsideLoop.extentsPoints,
        orbitingPart.outsideLoop.extentsPoints,
        raster,
    );

    let innerFitPolygons1: Polygon[] = [];

    stationaryPart.insideLoops.forEach((stationaryPartInsideLoop) => {
        innerFitPolygons1 = [
            ...innerFitPolygons1,
            ..._innerFitPolygons(stationaryPartInsideLoop, orbitingPart.outsideLoop, true),
        ];
    });

    return {
        noFitPolygons: noFitPolygons1,
        innerFitPolygons: innerFitPolygons1,
    };
}

export function noFitPolygonsAndInnerFitPolygons(
    nestedPart: Part,
    notNestedPart: Part,
    nestingRotationInDegrees: number,
    raster: boolean,
): { noFitPolygons: Polygon[]; innerFitPolygons: Polygon[] } {
    const rotation = angleNormalize(nestingRotationInDegrees);

    return _noFitPolygonsAndInnerFitPolygons(
        partMoveTo(nestedPart, origin),
        partMoveTo(partRotate(partMoveTo(notNestedPart, origin), rotation), origin),
        raster,
    );
}

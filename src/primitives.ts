import { Point, pointRotate, Polygon, polygonArea } from "geometric";
import { clipperScale, partToPartGap, tolerance } from "./utils";
import Shape from "@doodle3d/clipper-js";

export function pointDistanceTo(a: Point, b: Point): number {
    return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
}

export function vectorAdd(a: [number, number], b: [number, number]): [number, number] {
    return [a[0] + b[0], a[1] + b[1]];
}

export function vectorSubtract(a: [number, number], b: [number, number]): [number, number] {
    return [a[0] - b[0], a[1] - b[1]];
}

export function angleNormalize(angle: number): number {
    const normalized = angle % 360.0;
    return normalized < 0.0 ? 360.0 + normalized : normalized;
}

export function polygonsToShape(polygons: Polygon[]): Shape {
    return new Shape(
        polygons.map((polygon) => polygon.map((p) => ({ X: p[0], Y: p[1] }))),
        true,
    );
}

export function shapeToPolygons(shape: Shape): Polygon[] {
    return shape.paths.map((polygon) => polygon.map((p) => [p.X, p.Y]));
}

export function polygonOffset(points: Polygon, delta: number): Polygon[] {
    if (!points) {
        return [];
    }

    return shapeToPolygons(
        polygonsToShape([points]).offset(delta, {
            jointType: "jtRound",
            endType: "etClosedPolygon",
            miterLimit: 2.0,
            roundPrecision: tolerance * clipperScale,
        }),
    );
}

export function polygonSimplify(points: Polygon): Polygon {
    if (!points) {
        return [];
    }

    const simplifiedPolygons = shapeToPolygons(polygonsToShape([points]).simplify("pftNonZero"));

    if (!simplifiedPolygons) {
        return [];
    }

    return simplifiedPolygons.sort((x) => polygonArea(x, false)).reverse()[0];
}

export function polygonClean(points: Polygon, tolerance: number): Polygon {
    return shapeToPolygons(polygonsToShape([points]).clean(tolerance * clipperScale))[0];
}

export interface Entity {
    layer: string;
    nestingId: string;
    nestingKey: string;
    nestingRotationInDegrees?: string;
    extentsPoints: Point[];
    bounds: [Point, Point];
}

export function entityWithLayer(entity: Entity, layer: string): Entity {
    return {
        ...entity,
        layer: layer,
    };
}

export function entityWithNestingMetaData(
    entity: Entity,
    nestingId: string,
    nestingKey: string,
    nestingRotationInDegrees: string,
): Entity {
    return {
        ...entity,
        nestingId: nestingId,
        nestingKey: nestingKey,
        nestingRotationInDegrees: nestingRotationInDegrees,
    };
}

export function entityTranslate(entity: Entity, vector: [number, number]): Entity {
    return {
        ...entity,
        extentsPoints: entity.extentsPoints.map((x) => [x[0] + vector[0], x[1] + vector[1]]),
        bounds: entity.bounds.map((x) => [x[0] + vector[0], x[1] + vector[1]]) as [Point, Point],
    };
}

export function entityRotate(entity: Entity, angle: number): Entity {
    return {
        ...entity,
        nestingRotationInDegrees: entity.nestingRotationInDegrees
            ? `${angleNormalize(parseFloat(entity.nestingRotationInDegrees) + angle)}`
            : undefined,
        extentsPoints: entity.extentsPoints.map((x) => pointRotate(x, angle)),
        bounds: entity.bounds.map((x) => pointRotate(x, angle)) as [Point, Point],
    };
}

export interface Part {
    outsideLoop: Entity;
    insideLoops: Entity[];
}

export function boundsSize(bounds: [Point, Point]): [number, number] {
    return [bounds[1][0] - bounds[0][0], bounds[1][1] - bounds[0][1]];
}

export function boundsOffset(bounds: [Point, Point], delta: number): [Point, Point] {
    return [
        [bounds[0][0] - delta, bounds[0][1] - delta],
        [bounds[1][0] + 2 * delta, bounds[1][1] + 2 * delta],
    ];
}

export function boundsExtentsPoints(bounds: [Point, Point]) {
    const size = boundsSize(bounds);
    return [bounds[0], vectorAdd(bounds[0], [size[0], 0]), bounds[1], vectorAdd(bounds[0], [0, size[1]])];
}

export function boundsFromMinimumPointAndSize(minimumPoint: Point, size: [number, number]): [Point, Point] {
    return [minimumPoint, [minimumPoint[0] + size[0], minimumPoint[1] + size[1]]];
}

export function partNestingBounds(part: Part): [Point, Point] {
    return boundsOffset(part.outsideLoop.bounds, partToPartGap / 2);
}

export function partWithNestingMetaData(
    part: Part,
    nestingId: string,
    nestingKey: string,
    nestingRotationInDegrees: string,
): Part {
    return {
        ...part,
        outsideLoop: entityWithNestingMetaData(part.outsideLoop, nestingId, nestingKey, nestingRotationInDegrees),
    };
}

export function partTranslate(part: Part, vector: [number, number]): Part {
    return {
        outsideLoop: entityTranslate(part.outsideLoop, vector),
        insideLoops: part.insideLoops.map((insideLoop) => entityTranslate(insideLoop, vector)),
    };
}

export function partMoveTo(part: Part, point: Point): Part {
    const nestingBoundMinimumPoint = partNestingBounds(part)[0];
    return partTranslate(part, [point[0] - nestingBoundMinimumPoint[0], point[1] - nestingBoundMinimumPoint[1]]);
}

export function partRotate(part: Part, angle: number): Part {
    return {
        outsideLoop: entityRotate(part.outsideLoop, angle),
        insideLoops: part.insideLoops.map((insideLoop) => entityRotate(insideLoop, angle)),
    };
}

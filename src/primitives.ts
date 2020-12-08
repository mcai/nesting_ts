import { Point, pointRotate } from "geometric";
import { partToPartGap } from "./utils";

export function angleNormalize(angle: number): number {
    const normalized = angle % 360.0;
    return normalized < 0.0 ? 360.0 + normalized : normalized;
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

export function entityTranslate(entity: Entity, vector: [number, number]) {
    return {
        ...entity,
        extentsPoints: entity.extentsPoints.map((x) => [x[0] + vector[0], x[1] + vector[1]]),
        bounds: entity.bounds.map((x) => [x[0] + vector[0], x[1] + vector[1]]),
    };
}

export function entityRotate(entity: Entity, angle: number) {
    return {
        ...entity,
        nestingRotationInDegrees: entity.nestingRotationInDegrees
            ? `${angleNormalize(parseFloat(entity.nestingRotationInDegrees) + angle)}`
            : undefined,
        extentsPoints: entity.extentsPoints.map((x) => pointRotate(x, angle)),
        bounds: entity.bounds.map((x) => pointRotate(x, angle)),
    };
}

export interface Part {
    outsideLoop: Entity;
    insideLoops: Entity[];
}

export function boundsOffset(bounds: [Point, Point], delta: number): [Point, Point] {
    return [
        [bounds[0][0] - delta, bounds[0][1] - delta],
        [bounds[1][0] + 2 * delta, bounds[1][1] + 2 * delta],
    ];
}

export function partNestingBounds(part: Part): [Point, Point] {
    return boundsOffset(part.outsideLoop.bounds, partToPartGap / 2);
}

import {
    angleNormalize,
    boundsExtentsPoints,
    boundsFromMinimumPointAndSize,
    boundsSize,
    Part,
    partMoveTo,
    partNestingBounds,
    partRotate,
    polygonTranslateByVector,
    vectorSubtract,
} from "./primitives";
import { Point, Polygon, polygonArea, polygonBounds } from "geometric";
import RBush from "rbush";
import { partToSheetGap } from "./utils";
import { adaptiveDifference, noFitPolygonsAndInnerFitPolygons, rasterize } from "./nfp";

export const origin: Point = [0.0, 0.0];

export interface Nesting {
    id: number;
    sheetWidth: number;
    sheetHeight: number;
    alreadyNestedParts: Part[];
    alreadyCutBoundaryParts: Part[];
}

export interface DesignDocumentPart {
    nestingId: number;
    part: Part;
}

function getEmbeddedPartsDictionary(parts: Part[]): { [outsideLoopNestingId: string]: Part[] } {
    const result: { [outsideLoopNestingId: string]: Part[] } = {};

    const tree = new RBush();

    tree.load(
        parts.map((part) => {
            const nestingBounds = partNestingBounds(part);

            return {
                minX: nestingBounds[0][0],
                minY: nestingBounds[0][1],
                maxX: nestingBounds[1][0],
                maxY: nestingBounds[1][1],
                part: part,
            };
        }),
    );

    parts.forEach((part) => {
        const nestingBounds = partNestingBounds(part);

        result[part.outsideLoop.nestingId] = (tree.search({
            minX: nestingBounds[0][0],
            minY: nestingBounds[0][1],
            maxX: nestingBounds[1][0],
            maxY: nestingBounds[1][1],
        }) as any[]).map((x) => x.part);
    });

    return result;
}

function nestByBoundingBoxes(
    notNestedPart: Part,
    rotation: number,
    nestedParts: Part[],
    nestedPartsBounds: [Point, Point],
    sheetBounds: [Point, Point],

    embeddedPartsDictionary: { [outsideLoopNestingId: string]: Part[] },

    raster: boolean,
): {
    bestRotation?: number;
    bestLocation?: Point;
    bestEmbeddingPart?: Part;
} {
    let bestRotation: number | undefined = undefined;
    let bestLocation: Point | undefined = undefined;
    let bestEmbeddingPart: Part | undefined = undefined;

    notNestedPart = partMoveTo(partRotate(notNestedPart, rotation), origin);

    const sheetInnerFitBoundsSize: [number, number] = vectorSubtract(
        vectorSubtract(boundsSize(sheetBounds), boundsSize(partNestingBounds(notNestedPart))),
        [partToSheetGap, partToSheetGap],
    );

    const sheetInnerFitBounds: [Point, Point] = boundsFromMinimumPointAndSize(sheetBounds[0], sheetInnerFitBoundsSize);

    let sheetInnerFitPolygon = boundsExtentsPoints(sheetBounds);

    if (polygonArea(sheetInnerFitPolygon, true) > 0) {
        sheetInnerFitPolygon = sheetInnerFitPolygon.reverse();
    }

    const sheetInnerFitDots = rasterize(sheetInnerFitBounds);

    let safeAreas: {
        embeddingPart?: Part;
        locations: Point[];
    }[];

    if (nestedParts) {
        safeAreas = nestedParts.flatMap((nestedPart) => {
            let embeddedPartNoFitPolygons: Polygon[] = [];

            if (nestedPart.outsideLoop.nestingId in embeddedPartsDictionary) {
                embeddedPartNoFitPolygons = embeddedPartsDictionary[
                    nestedPart.outsideLoop.nestingId
                ].flatMap((embeddedPart) =>
                    noFitPolygonsAndInnerFitPolygons(
                        embeddedPart,
                        notNestedPart,
                        angleNormalize(Number(notNestedPart.outsideLoop.nestingRotationInDegrees)),
                        raster,
                    ).noFitPolygons.map((noFitPolygon) =>
                        polygonTranslateByVector(
                            noFitPolygon,
                            vectorSubtract(partNestingBounds(embeddedPart)[0], origin),
                        ),
                    ),
                );
            }

            return adaptiveDifference(
                noFitPolygonsAndInnerFitPolygons(
                    nestedPart,
                    notNestedPart,
                    angleNormalize(Number(notNestedPart.outsideLoop.nestingRotationInDegrees)),
                    raster,
                ).innerFitPolygons.map((innerFitPolygon) =>
                    polygonTranslateByVector(innerFitPolygon, vectorSubtract(partNestingBounds(nestedPart)[0], origin)),
                ),
                embeddedPartNoFitPolygons,
                raster,
            ).map((x) => ({
                embeddingPart: nestedPart,
                locations: x,
            }));
        });

        const nestedPartNoFitPolygons = nestedParts.flatMap((nestedPart) =>
            noFitPolygonsAndInnerFitPolygons(
                nestedPart,
                notNestedPart,
                angleNormalize(Number(notNestedPart.outsideLoop.nestingRotationInDegrees)),
                raster,
            ).noFitPolygons.map((noFitPolygon) =>
                polygonTranslateByVector(noFitPolygon, vectorSubtract(partNestingBounds(nestedPart)[0], origin)),
            ),
        );

        safeAreas = [
            ...safeAreas,
            ...adaptiveDifference(
                [raster ? sheetInnerFitDots : sheetInnerFitPolygon],
                nestedPartNoFitPolygons,
                raster,
            ).map((x) => ({
                embeddingPart: undefined,
                locations: x,
            })),
        ];
    } else {
        safeAreas = [
            {
                embeddingPart: undefined,
                locations: raster ? sheetInnerFitDots : sheetInnerFitPolygon,
            },
        ];
    }

    if (!safeAreas) {
        return {
            bestRotation: undefined,
            bestLocation: undefined,
            bestEmbeddingPart: undefined,
        };
    }

    const notNestedPartMinimumPoint = partNestingBounds(notNestedPart)[0];
    const notNestedPartBounds = notNestedPart.outsideLoop.bounds;
    let smallestBoundsHeight = Number.MAX_SAFE_INTEGER;

    safeAreas
        .sort((x) => polygonArea(x.locations, false))
        .forEach((safeArea) => {
            safeArea.locations
                .sort((x) => x[0])
                .forEach((location: Point) => {
                    const newBoundsHeight = boundsSize(
                        polygonBounds([
                            ...nestedPartsBounds,
                            ...polygonTranslateByVector(
                                notNestedPartBounds,
                                vectorSubtract(location, notNestedPartMinimumPoint),
                            ),
                        ]) ?? [origin, origin],
                    )[1];

                    if (newBoundsHeight < smallestBoundsHeight) {
                        bestRotation = rotation;
                        bestLocation = location;
                        bestEmbeddingPart = safeArea.embeddingPart;
                        smallestBoundsHeight = newBoundsHeight;
                    }
                });
        });

    return {
        bestRotation: bestRotation,
        bestLocation: bestLocation,
        bestEmbeddingPart: bestEmbeddingPart,
    };
}

function nestOne(
    notNestedDesignDocumentPart: DesignDocumentPart,
    rotation: number,
    sheetBounds: [Point, Point],
    nestedPartsBounds: [Point, Point],
    allNestedParts: Part[],
    embeddedPartsDictionary: { [outsideLoopNestingId: string]: Part[] },
    raster: boolean,
): {
    nested: boolean;
    nestedPart?: Part;
    embeddingPart?: Part;
} {
    let notNestedPart = partMoveTo(notNestedDesignDocumentPart.part, origin);

    const { bestRotation, bestLocation, bestEmbeddingPart } = nestByBoundingBoxes(
        notNestedPart,
        rotation,
        allNestedParts,
        nestedPartsBounds,
        sheetBounds,

        embeddedPartsDictionary,

        raster,
    );

    if (!bestLocation) {
        return {
            nested: false,
            nestedPart: undefined,
            embeddingPart: undefined,
        };
    }

    notNestedPart = partMoveTo(partRotate(notNestedPart, bestRotation ?? 0.0), bestLocation);

    return {
        nested: true,
        nestedPart: notNestedPart,
        embeddingPart: bestEmbeddingPart,
    };
}

export function nest(nesting: Nesting, notNestedDesignDocumentParts: DesignDocumentPart[], raster: boolean) {
    let newlyNestedDesignDocumentParts: DesignDocumentPart[] = [];

    const [sheetWidth, sheetHeight] = [nesting.sheetWidth, nesting.sheetHeight];

    const alreadyCutBoundaryParts = nesting.alreadyCutBoundaryParts;

    let allNestedParts = [...nesting.alreadyNestedParts, ...alreadyCutBoundaryParts];

    let nestedPartsBounds = polygonBounds(
        ([] as Point[]).concat(...allNestedParts.map((x) => partNestingBounds(x))),
    ) ?? [
        [0.0, 0.0],
        [0.0, 0.0],
    ];

    const embeddedPartsDictionary = getEmbeddedPartsDictionary(allNestedParts);

    const gap = partToSheetGap;

    const degreesPerStep = 90;
    const numSteps = 360 / degreesPerStep;

    const rotations = [...Array(numSteps).keys()].map((i) => degreesPerStep * i);

    const sheetBounds: [Point, Point] = [
        [gap, gap],
        [sheetWidth, sheetHeight],
    ];

    rotations.forEach((rotation) => {
        notNestedDesignDocumentParts.forEach((notNestedDesignDocumentPart) => {
            if (newlyNestedDesignDocumentParts.some((x) => x == notNestedDesignDocumentPart)) {
                return;
            }

            const nestOneResult = nestOne(
                notNestedDesignDocumentPart,
                rotation,
                sheetBounds,
                nestedPartsBounds,
                allNestedParts,
                embeddedPartsDictionary,
                raster,
            );

            if (nestOneResult.nested) {
                const newlyNestedPart = nestOneResult.nestedPart;

                if (!newlyNestedPart) {
                    throw new Error();
                }

                if (nestOneResult.embeddingPart != null) {
                    if (!(nestOneResult.embeddingPart.outsideLoop.nestingId in embeddedPartsDictionary)) {
                        embeddedPartsDictionary[nestOneResult.embeddingPart.outsideLoop.nestingId] = [];
                    }
                    embeddedPartsDictionary[nestOneResult.embeddingPart.outsideLoop.nestingId] = [
                        ...embeddedPartsDictionary[nestOneResult.embeddingPart.outsideLoop.nestingId],
                        newlyNestedPart,
                    ];
                }

                nestedPartsBounds = polygonBounds([...nestedPartsBounds, ...partNestingBounds(newlyNestedPart)]) ?? [
                    [0.0, 0.0],
                    [0.0, 0.0],
                ];

                allNestedParts = [...allNestedParts, newlyNestedPart];
                newlyNestedDesignDocumentParts = [...newlyNestedDesignDocumentParts, notNestedDesignDocumentPart];
            }
        });
    });

    return {
        newlyNestedDesignDocumentParts: newlyNestedDesignDocumentParts,
        allNestedParts: allNestedParts.filter((x) => !alreadyCutBoundaryParts.some((y) => y != x)),
    };
}

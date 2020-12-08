import { Part, partNestingBounds } from "./primitives";
import { Point, polygonBounds } from "geometric";
import RBush from "rbush";
import { partToSheetGap } from "./utils";

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

function getEmbeddedPartsDictionary(parts: Part[]): { [outsideLoopNestingId: string]: string[] } {
    const result: { [outsideLoopNestingId: string]: string[] } = {};

    const tree = new RBush();

    tree.load(
        parts.map((part) => {
            const nestingBounds = partNestingBounds(part);

            return {
                minX: nestingBounds[0][0],
                minY: nestingBounds[0][1],
                maxX: nestingBounds[1][0],
                maxY: nestingBounds[1][1],
                outsideLoopNestingId: part.outsideLoop.nestingId,
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
        }) as any[]).map((x) => x.outsideLoopNestingId);
    });

    return result;
}

function nestOne(
    notNestedDesignDocumentPart: DesignDocumentPart,
    rotation: number,
    sheetBounds: [Point, Point],
    nestedPartsBounds: [Point, Point],
    allNestedParts: Part[],
    embeddedPartsDictionary: { [outsideLoopNestingId: string]: string[] },
    raster: boolean,
): {
    nested: boolean;
    nestedPart?: Part;
    embeddingPart?: Part;
} {
    // TODO

    return {
        nested: false,
        nestedPart: undefined,
        embeddingPart: undefined,
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
                        newlyNestedPart.outsideLoop.nestingId,
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

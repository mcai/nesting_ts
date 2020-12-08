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

export function getEmbeddedPartsDictionary(parts: Part[]): { [outsideLoopNestingId: string]: string[] } {
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

export function nest(nesting: Nesting, notNestedParts: DesignDocumentPart[], raster: boolean) {
    const newlyNestedDesignDocumentParts: DesignDocumentPart[] = [];

    const [sheetWidth, sheetHeight] = [nesting.sheetWidth, nesting.sheetHeight];

    const alreadyCutBoundaryParts = nesting.alreadyCutBoundaryParts;

    const allNestedParts = [...nesting.alreadyNestedParts, ...alreadyCutBoundaryParts];

    const nestedPartBounds = polygonBounds(([] as Point[]).concat(...allNestedParts.map((x) => partNestingBounds(x))));

    const embeddedPartsDictionary = getEmbeddedPartsDictionary(allNestedParts);

    const gap = partToSheetGap;

    const degreesPerStep = 90;
    const numSteps = 360 / degreesPerStep;

    // TODO
}

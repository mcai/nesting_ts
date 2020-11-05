import { Nesting } from "./Nesting";
import { DesignDocumentPart } from "./DesignDocumentPart";

export class Nester {
    nest(
        nesting: Nesting,
        partsToNest: DesignDocumentPart[],
    ): {
        newlyNestedParts: DesignDocumentPart[];
    } {
        const newlyNestedParts: DesignDocumentPart[] = [];

        const [sheetWidth, sheetHeight] = [nesting.sheetWidth, nesting.sheetHeight];

        // const allNestedParts = nesting.dxfFileName ? [] :

        // TODO

        return {
            newlyNestedParts: [],
        };
    }
}

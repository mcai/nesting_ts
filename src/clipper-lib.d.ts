declare module "clipper-lib" {
    export interface IntPoint {
        X: number;
        Y: number;
    }

    export class Clipper {
        static MinkowskiSum(pattern: IntPoint[], paths: IntPoint[][], pathIsClosed: boolean): IntPoint[][];
    }
}

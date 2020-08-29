import {Point2d} from "../primitives/Point2d";

export interface Entity {
    layer: string
    extentsPoints: Point2d[]
}

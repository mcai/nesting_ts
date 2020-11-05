import {Point2d} from "../primitives/Point2d";
import {BoundingBox} from "../primitives/BoundingBox";
import {Vector2d} from "../primitives/Vector2d";
import {Angle} from "../primitives/Angle";

export interface Entity {
    Layer: string

    ExtentsPoints: Point2d[]

    BoundingBox: BoundingBox

    Length: number

    Area: number

    IsClosed: boolean

    Add(vector: Vector2d): void;

    Rotate(angle: Angle): void;

    IsSameShape(other: Entity): boolean;
}

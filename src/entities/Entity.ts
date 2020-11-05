import { Point2d } from "../primitives/Point2d";
import { BoundingBox } from "../primitives/BoundingBox";
import { Vector2d } from "../primitives/Vector2d";
import { Angle } from "../primitives/Angle";

export interface Entity {
    layer: string;

    extentsPoints: Point2d[];

    boundingBox: BoundingBox;

    length: number;

    area: number;

    isClosed: boolean;

    add(vector: Vector2d): void;

    rotate(angle: Angle): void;

    isSameShape(other: Entity): boolean;
}

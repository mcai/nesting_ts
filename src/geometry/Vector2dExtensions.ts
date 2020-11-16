import { Vector2d } from "./Vector2d";

export class Vector2dExtensions {
    static getLength(vector: Vector2d): number {
        return Math.sqrt(vector.X * vector.X + vector.Y * vector.Y);
    }
}

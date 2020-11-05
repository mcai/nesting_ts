import {Point2d} from "./Point2d";
import {Vector2d} from "./Vector2d";

export class BoundingBox {
    MinimumPoint: Point2d
    Size: Vector2d

    MaximumPoint(): Point2d {
        return this.MinimumPoint.Add(this.Size);
    }

    ExtentsPoints: Point2d[]

    constructor(minimumPoint: Point2d, size: Vector2d) {
        this.MinimumPoint = minimumPoint;
        this.Size = size;

        this.ExtentsPoints = [
            this.MinimumPoint,
            this.MinimumPoint.Add(new Vector2d(this.Size.X, 0)),
            this.MinimumPoint,
            this.MinimumPoint.Add(new Vector2d(0, this.Size.Y))
        ];
    }

    Offset(delta: number): BoundingBox {
        return new BoundingBox(this.MinimumPoint.Subtract(new Vector2d(delta, delta)),
            this.Size.Add(new Vector2d(delta * 2, delta * 2)));
    }

    // TODO
    // combine(other: BoundingBox): BoundingBox {
    //     return BoundingBox.getBoundingBox([this.minimumPoint, this.maximumPoint, other.minimumPoint, other.maximumPoint]);
    // }
}

import {Point2d} from "./Point2d";
import {Vector2d} from "./Vector2d";

export class BoundingBox {
    minimumPoint: Point2d
    size: Vector2d

    maximumPoint(): Point2d {
        return this.minimumPoint.add(this.size);
    }

    extentsPoints: Point2d[]

    constructor(minimumPoint: Point2d, size: Vector2d) {
        this.minimumPoint = minimumPoint;
        this.size = size;

        this.extentsPoints = [
            this.minimumPoint,
            this.minimumPoint.add(new Vector2d(this.size.x, 0)),
            this.minimumPoint,
            this.minimumPoint.add(new Vector2d(0, this.size.y))
        ];
    }

    offset(delta: number): BoundingBox {
        return new BoundingBox(this.minimumPoint.subtract(new Vector2d(delta, delta)),
            this.size.add(new Vector2d(delta * 2, delta * 2)));
    }

    // TODO
    // combine(other: BoundingBox): BoundingBox {
    //     return BoundingBox.getBoundingBox([this.minimumPoint, this.maximumPoint, other.minimumPoint, other.maximumPoint]);
    // }
}

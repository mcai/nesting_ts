import {Point2d} from "./Point2d";
import {LineSegment2d} from "./LineSegment2d";
import {Angle} from "./Angle";
import {Vector2d} from "./Vector2d";
import Enumerable from "linq";

export class Polyline2d {
    points: Point2d[]
    private _edges?: LineSegment2d[]

    constructor(points: Point2d[]) {
        this.points = points;
    }

    get edges(): LineSegment2d[] {
        if (this._edges == undefined) {
            this._edges = [];
            this.populateEdgeList();
        }

        return this._edges;
    }

    get vertexCount(): number {
        return this.points.length;
    }

    get length(): number {
        return this.getPolylineLength();
    }

    closestPointTo(p: Point2d): Point2d {
        let num1 = Number.MAX_VALUE;
        let point2D = Point2d.origin;
        for (let index = 0; index < this.vertexCount - 1; ++index)
        {
            let otherPoint = new LineSegment2d(this.points[index], this.points[index + 1]).closestPointTo(p);
            let num2 = p.distanceTo(otherPoint);
            if (num2 < num1)
            {
                num1 = num2;
                point2D = otherPoint;
            }
        }
        return point2D;
    }

    private getPolylineLength(): number {
        let num = 0.0;
        for (let index = 0; index < this.points.length - 1; ++index)
        num += this.points[index].distanceTo(this.points[index + 1]);
        return num;
    }

    enclosesPoint(p: Point2d): boolean {
        let flag = false;
        let index1 = 0;
        let index2 = this.points.length - 1;
        for (; index1 < this.points.length; index2 = index1++)
        {
            if (this.points[index1].y > p.y != this.points[index2].y > p.y && p.x < (this.points[index2].x - this.points[index1].x) * (p.y - this.points[index1].y) / (this.points[index2].y - this.points[index1].y) + this.points[index1].x)
                flag = !flag;
        }
        return flag;
    }

    rotate(angle: Angle): Polyline2d {
        return new Polyline2d(
            Enumerable
                .from(this.points)
                .select(t => Point2d.origin.add(t.toVector2d().rotate(angle)))
                .toArray()
        )
    }

    translateBy(vector: Vector2d): Polyline2d {
        return new Polyline2d(Enumerable.from(this.points).select(p => p.add(vector)).toArray());
    }

    rotateAround(angle: Angle, center: Point2d) {
        let vector = center.vectorTo(Point2d.origin);
        return this.translateBy(vector).rotate(angle).translateBy(vector.negate());
    }

    private populateEdgeList() {
        for (let index = 0; index < this.vertexCount - 1; ++index) {
            let lineSegment2D = new LineSegment2d(this.points[index], this.points[index + 1]);
            this._edges!.push(lineSegment2D);
        }
        this._edges!.push(new LineSegment2d(this.points[this.vertexCount - 1], this.points[0]));
    }
}

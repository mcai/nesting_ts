import {Point2d} from "../primitives/Point2d";
import {LineSegment2d} from "../primitives/LineSegment2d";
import {Angle} from "../primitives/Angle";
import {Vector2d} from "../primitives/Vector2d";
import Enumerable from "linq";
import concaveman from "concaveman";

export class Polyline2d {
    Points: Point2d[]
    private _edges?: LineSegment2d[]

    constructor(points: Point2d[]) {
        this.Points = points;
    }

    get Edges(): LineSegment2d[] {
        if (this._edges == undefined) {
            this._edges = [];
            this.PopulateEdgeList();
        }

        return this._edges;
    }

    get VertexCount(): number {
        return this.Points.length;
    }

    get Length(): number {
        return this.GetPolylineLength();
    }

    ClosestPointTo(p: Point2d): Point2d {
        let num1 = Number.MAX_VALUE;
        let point2D = Point2d.origin;
        for (let index = 0; index < this.VertexCount - 1; ++index)
        {
            let otherPoint = new LineSegment2d(this.Points[index], this.Points[index + 1]).ClosestPointTo(p);
            let num2 = p.DistanceTo(otherPoint);
            if (num2 < num1)
            {
                num1 = num2;
                point2D = otherPoint;
            }
        }
        return point2D;
    }

    private GetPolylineLength(): number {
        let num = 0.0;
        for (let index = 0; index < this.Points.length - 1; ++index)
        num += this.Points[index].DistanceTo(this.Points[index + 1]);
        return num;
    }

    Equals(other: Polyline2d, tolerance?: number): boolean {
        let vertexCount = this.VertexCount;
        if (vertexCount != other.VertexCount)
            return false;
        for (let index = 0; index < this.Points.length; ++index)
        {
            if (tolerance != undefined) {
                if (!this.Points[index].Equals(other.Points[index], tolerance))
                    return false;
            } else {
                if (!this.Points[index].Equals(other.Points[index]))
                    return false;
            }
        }
        return true;
    }

    static ArePolygonVerticesColliding(a: Polyline2d, b: Polyline2d): boolean {
        return Enumerable.from(a.Points).any(x => b.EnclosesPoint(x))
            || Enumerable.from(b.Points).any(x => a.EnclosesPoint(x));
    }

    static GetConvexHullFromPoints(pointList: Point2d[], clockwise: boolean = true): Polyline2d {
        let num = pointList.length;
        if (num <= 2) {
            throw new Error("Must have at least 3 points in the polygon to compute the convex hull");
        }
        if (num <= 3) {
            return new Polyline2d(pointList);
        }
        let convexHull = Enumerable
            .from(
                concaveman(
                    Enumerable.from(pointList).select(x => [x.X, x.Y]).toArray(),
                    Infinity
                )
            )
            .select(x => new Point2d(x[0], x[1]))
            .toArray();
        let centroid = Point2d.Centroid(convexHull);
        let xAxis = new Vector2d(1.0, 0.0);
        let list = Enumerable
            .from(convexHull)
            .orderBy(x => centroid.VectorTo(x).SignedAngleTo(xAxis, clockwise, false))
            .toArray();
        return new Polyline2d(list);
    }

    EnclosesPoint(p: Point2d): boolean {
        let flag = false;
        let index1 = 0;
        let index2 = this.Points.length - 1;
        for (; index1 < this.Points.length; index2 = index1++)
        {
            if (this.Points[index1].Y > p.Y != this.Points[index2].Y > p.Y && p.X < (this.Points[index2].X - this.Points[index1].X) * (p.Y - this.Points[index1].Y) / (this.Points[index2].Y - this.Points[index1].Y) + this.Points[index1].X)
                flag = !flag;
        }
        return flag;
    }

    Rotate(angle: Angle): Polyline2d {
        return new Polyline2d(
            Enumerable
                .from(this.Points)
                .select(t => Point2d.origin.Add(t.ToVector2d().Rotate(angle)))
                .toArray()
        )
    }

    TranslateBy(vector: Vector2d): Polyline2d {
        return new Polyline2d(Enumerable.from(this.Points).select(p => p.Add(vector)).toArray());
    }

    RotateAround(angle: Angle, center: Point2d) {
        let vector = center.VectorTo(Point2d.origin);
        return this.TranslateBy(vector).Rotate(angle).TranslateBy(vector.Negate());
    }

    private PopulateEdgeList() {
        for (let index = 0; index < this.VertexCount - 1; ++index) {
            let lineSegment2D = new LineSegment2d(this.Points[index], this.Points[index + 1]);
            this._edges!.push(lineSegment2D);
        }
        this._edges!.push(new LineSegment2d(this.Points[this.VertexCount - 1], this.Points[0]));
    }
}

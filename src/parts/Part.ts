import { Entity } from "../entities/Entity";
import { Angle } from "../primitives/Angle";
import { Settings } from "../utils/Settings";
import _ from "lodash";
import { Point2dExtensions } from "../primitives/Point2dExtensions";
import Enumerable from "linq";
import { Vector2d } from "../primitives/Vector2d";
import { Point2d } from "../primitives/Point2d";
import { Embossment } from "./Embossment";

export class Part {
    static currentId: number;

    id: number;

    get entities() {
        return [
            this.outsideLoop,
            ...this.insideLoops,
            ...this.sinkHoles,
            ...Enumerable.from(this.embossments)
                .selectMany((embossment) => embossment.entities)
                .toArray(),
        ];
    }

    outsideLoop: Entity;

    insideLoops: Entity[];

    sinkHoles: Entity[];

    embossments: Embossment[];

    rotation: Angle;

    get nestingBoundingBox() {
        return this.outsideLoop.boundingBox.offset(Settings.partToPartGap / 2);
    }

    get totalLength() {
        return _.sumBy(this.entities, (entity) => entity.length);
    }

    get area() {
        return (
            Math.abs(Point2dExtensions.getSignedArea(this.outsideLoop.extentsPoints)) -
            Enumerable.from(this.insideLoops).sum((x) => Math.abs(Point2dExtensions.getSignedArea(x.extentsPoints)))
        );
    }

    get isClosed() {
        return Enumerable.from(this.entities).all((entity) => entity.isClosed);
    }

    // TODO: envelope

    static fromOutsideLoop(outsideLoop: Entity) {
        return new Part(outsideLoop, [], [], []);
    }

    constructor(outsideLoop: Entity, insideLoops: Entity[], sinkHoles: Entity[], embossments: Embossment[]) {
        this.id = Part.currentId++;

        this.outsideLoop = outsideLoop;
        this.insideLoops = insideLoops;
        this.sinkHoles = sinkHoles;
        this.embossments = embossments;

        this.rotation = Angle.fromRadians(0.0);

        // TODO: update envelope
    }

    add(vector: Vector2d) {
        this.entities.forEach((entity) => {
            entity.add(vector);
        });

        // TODO: update envelope
    }

    moveTo(point2d: Point2d) {
        this.add(point2d.subtractByPoint(this.nestingBoundingBox.minimumPoint));
    }

    rotate(angle: Angle) {
        this.entities.forEach((entity) => {
            entity.rotate(angle);
        });

        this.rotation.add(angle);

        // TODO: update envelope
    }

    // TODO: clone()
}

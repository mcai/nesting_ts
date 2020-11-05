import { Entity } from "../entities/Entity";

export class Embossment {
    outsideLoop: Entity;

    insideLoops: Entity[];

    get entities() {
        return [this.outsideLoop, ...this.insideLoops];
    }

    constructor(outsideLoop: Entity, insideLoops: Entity[]) {
        this.outsideLoop = outsideLoop;
        this.insideLoops = insideLoops;
    }

    // TODO: clone()
}

export class Angle {
    radians: number

    private constructor(radians: number) {
        this.radians = radians;
    }

    get degrees(): number {
        return this.radians * (180.0 / Math.PI);
    }

    equals(other: Angle, tolerance?: number | Angle): boolean {
        if (tolerance == undefined) {
            return this.radians == other.radians;
        } else if (tolerance instanceof Angle) {
            return Math.abs(this.radians - other.radians) < tolerance.radians;
        } else {
            return Math.abs(this.radians - other.radians) < tolerance;
        }
    }

    lt(a: Angle): boolean {
        return this.radians < a.radians;
    }

    gt(a: Angle): boolean {
        return this.radians > a.radians;
    }

    lte(a: Angle): boolean {
        return this.radians <= a.radians;
    }

    gte(a: Angle): boolean {
        return this.radians >= a.radians;
    }

    multiply(c: number): Angle {
        return new Angle(this.radians * c);
    }

    divide(c: number): Angle {
        return new Angle(this.radians / c);
    }

    add(a: Angle): Angle {
        return new Angle(this.radians + a.radians);
    }

    subtract(a: Angle): Angle {
        return new Angle(this.radians - a.radians);
    }

    negate(): Angle {
        return new Angle(-this.radians);
    }

    static fromDegrees(value: number): Angle {
        return new Angle(value * (Math.PI / 180.0));
    }

    static fromRadians(value: number): Angle {
        return new Angle(value);
    }
}

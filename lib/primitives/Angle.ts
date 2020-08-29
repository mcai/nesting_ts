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

    normalized(): Angle {
        let normalized = this.degrees % 360.0;
        return normalized < 0.0 ? Angle.fromDegrees(360.0 + normalized) : Angle.fromDegrees(normalized);
    }

    abs(): Angle {
        return this.radians < 0 ? this.negate() : this;
    }

    isBetween(startAngle: Angle, endAngle: Angle, bulge: number): boolean {
        let angle = this.normalized();
        startAngle = startAngle.normalized();
        endAngle = endAngle.normalized();

        if (bulge < 0)
        {
            [startAngle, endAngle] = [endAngle, startAngle];
        }

        if (endAngle < startAngle)
        {
            endAngle = endAngle.add(Angle.fromRadians(Math.PI * 2));
        }

        return startAngle < endAngle
            ? angle.radians >= startAngle.radians - 1e-7 && angle.radians <= endAngle.radians + 1e-7
            : angle.radians >= startAngle.radians - 1e-7 || angle.radians <= endAngle.radians + 1e-7;
    }
}

export class Angle {
    Radians: number

    private constructor(radians: number) {
        this.Radians = radians;
    }

    get Degrees(): number {
        return this.Radians * (180.0 / Math.PI);
    }

    Equals(other: Angle, tolerance?: number | Angle): boolean {
        if (tolerance == undefined) {
            return this.Radians == other.Radians;
        } else if (tolerance instanceof Angle) {
            return Math.abs(this.Radians - other.Radians) < tolerance.Radians;
        } else {
            return Math.abs(this.Radians - other.Radians) < tolerance;
        }
    }

    Lt(a: Angle): boolean {
        return this.Radians < a.Radians;
    }

    Gt(a: Angle): boolean {
        return this.Radians > a.Radians;
    }

    Lte(a: Angle): boolean {
        return this.Radians <= a.Radians;
    }

    Gte(a: Angle): boolean {
        return this.Radians >= a.Radians;
    }

    Multiply(c: number): Angle {
        return new Angle(this.Radians * c);
    }

    Divide(c: number): Angle {
        return new Angle(this.Radians / c);
    }

    Add(a: Angle): Angle {
        return new Angle(this.Radians + a.Radians);
    }

    Subtract(a: Angle): Angle {
        return new Angle(this.Radians - a.Radians);
    }

    Negate(): Angle {
        return new Angle(-this.Radians);
    }

    static FromDegrees(value: number): Angle {
        return new Angle(value * (Math.PI / 180.0));
    }

    static FromRadians(value: number): Angle {
        return new Angle(value);
    }

    Normalized(): Angle {
        let normalized = this.Degrees % 360.0;
        return normalized < 0.0 ? Angle.FromDegrees(360.0 + normalized) : Angle.FromDegrees(normalized);
    }

    Abs(): Angle {
        return this.Radians < 0 ? this.Negate() : this;
    }

    IsBetween(startAngle: Angle, endAngle: Angle, bulge: number): boolean {
        let angle = this.Normalized();
        startAngle = startAngle.Normalized();
        endAngle = endAngle.Normalized();

        if (bulge < 0)
        {
            [startAngle, endAngle] = [endAngle, startAngle];
        }

        if (endAngle < startAngle)
        {
            endAngle = endAngle.Add(Angle.FromRadians(Math.PI * 2));
        }

        return startAngle < endAngle
            ? angle.Radians >= startAngle.Radians - 1e-7 && angle.Radians <= endAngle.Radians + 1e-7
            : angle.Radians >= startAngle.Radians - 1e-7 || angle.Radians <= endAngle.Radians + 1e-7;
    }
}

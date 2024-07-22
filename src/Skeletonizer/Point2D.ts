export class Point2D {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    distanceToOrigin(): number {
        const x = this.x;
        const y = this.y;
        return Math.sqrt(x * x + y * y);
    }

    distanceTo(p: Point2D): number {
        const x = this.x - p.x;
        const y = this.y - p.y;
        return Math.sqrt(x * x + y * y);
    }

    barycenter(p1: Point2D, p2: Point2D, w1: number, w2: number): this {
        const t = w2 / (w1 + w2);
        this.x = (1 - t) * p1.x + t * p2.x;
        this.y = (1 - t) * p1.y + t * p2.y;
        return this;
    }
}

export default Point2D;

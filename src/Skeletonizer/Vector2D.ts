import Point2D from "./Point2D";

export class Vector2D {
    x: number;
    y: number;

    constructor(x?: number, y?: number) {
        this.x = x || 0;
        this.y = y || 0;
    }

    length(): number {
        const x = this.x;
        const y = this.y;
        return Math.sqrt(x * x + y * y);
    }

    subPoints(p1: Point2D, p2: Point2D): Vector2D {
        this.x = p1.x - p2.x;
        this.y = p1.y - p2.y;
        return this;
    }

    angle(): number {
        // computes the angle in radians with respect to the positive x-axis
        let angle = Math.atan2(this.y, this.x);
        if (angle < 0) angle += 2 * Math.PI;
        return angle;
    }
}

export default Vector2D;

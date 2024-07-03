export declare class Point2D {
    x: number;
    y: number;
    constructor(x: number, y: number);
    distanceToOrigin(): number;
    distanceTo(p: Point2D): number;
    barycenter(p1: Point2D, p2: Point2D, w1: number, w2: number): this;
}
export default Point2D;
//# sourceMappingURL=Point2D.d.ts.map
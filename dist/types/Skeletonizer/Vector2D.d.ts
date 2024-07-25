import Point2D from "./Point2D";
export declare class Vector2D {
    x: number;
    y: number;
    constructor(x?: number, y?: number);
    length(): number;
    subPoints(p1: Point2D, p2: Point2D): Vector2D;
    angle(): number;
}
export default Vector2D;
//# sourceMappingURL=Vector2D.d.ts.map
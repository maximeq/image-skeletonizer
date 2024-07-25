import Point2D from "./Point2D";
/**
 * Main class for a skeleton node in an image.
 * Must be unique for each pixel.
 */
export declare class SkeletonNode {
    position: Point2D;
    weight: number;
    neighbors: Map<string, SkeletonNode>;
    constructor(position: Point2D, weight: number);
    /**
     * Compute the key of a node in neighbors maps, given its x,y positions.
     */
    static computeKey(x: number, y: number): string;
    /**
     * Return x,y in an array of 2 elements
     */
    static getXYFromKey(key: string): [number, number];
    getKey(): string;
    getPosition(): Point2D;
    getWeight(): number;
    getNeighbors(): Map<string, SkeletonNode>;
    setPosition(position: Point2D): void;
    setWeight(weight: number): void;
    setNeighbors(neighbors: Map<string, SkeletonNode>): void;
    addNeighbor(n: SkeletonNode): void;
    removeNeighbor(n: SkeletonNode): void;
    hasNeighbor(n: SkeletonNode): boolean;
}
export default SkeletonNode;
//# sourceMappingURL=SkeletonNode.d.ts.map
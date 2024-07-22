"use strict";

import Point2D from "./Point2D";

/**
 * Main class for a skeleton node in an image.
 * Must be unique for each pixel.
 */
export class SkeletonNode {
    position: Point2D;
    weight: number;
    neighbors: Map<string, SkeletonNode>;

    constructor(position: Point2D, weight: number) {
        this.position = position;
        this.weight = weight;
        this.neighbors = new Map();
    }

    /**
     * Compute the key of a node in neighbors maps, given its x,y positions.
     */
    static computeKey(x: number, y: number): string {
        return Math.floor(x) + ";" + Math.floor(y);
    }

    /**
     * Return x,y in an array of 2 elements
     */
    static getXYFromKey(key: string): [number, number] {
        const res = key.split(";");
        return [parseInt(res[0]), parseInt(res[1])];
    }

    // Getters
    getKey(): string {
        return SkeletonNode.computeKey(this.position.x, this.position.y);
    }

    getPosition(): Point2D {
        return this.position;
    }

    getWeight(): number {
        return this.weight;
    }

    getNeighbors(): Map<string, SkeletonNode> {
        return this.neighbors;
    }

    // Setters
    setPosition(position: Point2D): void {
        this.position = position;
    }

    setWeight(weight: number): void {
        this.weight = weight;
    }

    setNeighbors(neighbors: Map<string, SkeletonNode>): void {
        this.neighbors = neighbors;
    }

    addNeighbor(n: SkeletonNode): void {
        this.neighbors.set(n.getKey(), n);
        n.neighbors.set(this.getKey(), this);
    }

    removeNeighbor(n: SkeletonNode): void {
        this.neighbors.delete(n.getKey());
        n.neighbors.delete(this.getKey());
    }

    hasNeighbor(n: SkeletonNode): boolean {
        return this.neighbors.has(n.getKey());
    }
}

export default SkeletonNode;

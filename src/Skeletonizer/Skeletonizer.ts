"use strict";

import SkeletonNode from "./SkeletonNode";
import Point2D from "./Point2D";
import Vector2D from "./Vector2D";
import SkeletonImage from "./SkeletonImage"; // Assuming these are defined elsewhere
import { IntDistanceImage } from "../Image/IntDistanceImage";

interface Params {
    angle?: number;
    weightFactor?: number;
}

class Skeletonizer {
    skelImg: SkeletonImage;
    distImg: IntDistanceImage;

    constructor(skel_img: SkeletonImage, dist_img: IntDistanceImage) {
        this.skelImg = skel_img;
        this.distImg = dist_img;
    }

    buildHierarchy(params: Params = {}): SkeletonNode[] {
        // Default parameters
        params.angle = params.angle || Math.PI / 13;
        params.weightFactor = params.weightFactor || 1.25;

        const size = this.skelImg.width * this.skelImg.height;

        let nodes: { [key: string]: SkeletonNode } = {};
        let roots: SkeletonNode[] = [];
        let k = this._findNextPixelWithNeighbors(0);
        while (k < size) {
            const x = this.skelImg.getXFromIndex(k);
            const y = this.skelImg.getYFromIndex(k);
            const key = SkeletonNode.computeKey(x + 0.5, y + 0.5);
            if (nodes[key] === undefined) {
                nodes[key] = new SkeletonNode(new Point2D(x + 0.5, y + 0.5), this.distImg.data[k] / this.distImg.getCoeff());
                roots.push(nodes[key]);
                this._recHierarchy(nodes[key], nodes);
            }
            k = this._findNextPixelWithNeighbors(k + 1);
        }

        return this._simplifyHierarchy(roots, params.angle, params.weightFactor);
    }

    _simplifyHierarchy(roots: SkeletonNode[], angle: number, weight_factor: number): SkeletonNode[] {
        if (weight_factor < 1.0) {
            throw new Error("weight_factor must be greater than 1 as it compares weight_max and weight_factor*weight_min");
        }

        const processBranch = (root: SkeletonNode, next: SkeletonNode) => {
            const tmpv2 = new Vector2D();
            let curr = next;
            const dir = new Vector2D();
            let curr_size = curr.getNeighbors().size;
            let angle_ok = true;
            let weight_ok = true;
            let suspect: SkeletonNode | null = null;
            let count = 0;
            const processed: { [key: string]: boolean } = {};
            processed[root.getKey()] = true;

            while (curr_size === 2 && angle_ok && weight_ok && !processed[curr.getKey()]) {
                const it = curr.getNeighbors().keys();
                suspect = curr;
                curr = curr.getNeighbors().get(it.next().value)!;
                if (curr === root) {
                    curr = suspect.getNeighbors().get(it.next().value)!;
                }

                const discard__n = 3;
                if (count < discard__n) {
                    dir.x += curr.getPosition().x;
                    dir.y += curr.getPosition().y;
                }
                if (count === discard__n - 1) {
                    dir.x = (dir.x - discard__n * root.getPosition().x) / discard__n;
                    dir.y = (dir.y - discard__n * root.getPosition().y) / discard__n;
                }
                count++;

                tmpv2.subPoints(curr.getPosition(), root.getPosition());
                const a = tmpv2.angle() - dir.angle();
                if (!(Math.abs(a) < angle || count < discard__n)) {
                    angle_ok = false;
                }
                if (count >= discard__n) {
                    let w_ratio = root.getWeight() / curr.getWeight();
                    if (w_ratio < 1) { w_ratio = 1 / w_ratio; }
                    if (w_ratio > weight_factor) {
                        weight_ok = false;
                    }
                }
                if (angle_ok && weight_ok) {
                    root.removeNeighbor(suspect);
                    curr.removeNeighbor(suspect);
                    root.addNeighbor(curr);
                }

                processed[suspect.getKey()] = true;

                curr_size = curr.getNeighbors().size;
            }

            if (!processed[curr.getKey()]) {
                if (curr_size === 1) {
                    if (!angle_ok || !weight_ok) {
                        if (suspect) {
                            suspect.removeNeighbor(curr);
                        }
                    }
                    if (count === 0) {
                        root.removeNeighbor(curr);
                    }
                    processed[curr.getKey()] = true;
                } else if (curr_size === 2) {
                    processBranch(suspect!, curr);
                    processed[suspect!.getKey()] = true;
                } else {
                    const nexts: SkeletonNode[] = [];
                    curr.getNeighbors().forEach((value: SkeletonNode) => {
                        if (value !== suspect && value !== root) {
                            nexts.push(value);
                        }
                    });

                    if (suspect) {
                        root.removeNeighbor(suspect);
                        curr.removeNeighbor(suspect);
                        root.addNeighbor(curr);
                    }

                    processed[curr.getKey()] = true;
                    const neighbors2 = new Map<string, SkeletonNode>();
                    for (let i = 0; i < nexts.length; ++i) {
                        for (let j = i + 1; j < nexts.length; ++j) {
                            nexts[i].removeNeighbor(nexts[j]);
                        }
                        nexts[i].getNeighbors().forEach((value: SkeletonNode, key: string) => {
                            neighbors2.set(key, value);
                        });
                    }
                    neighbors2.delete(curr.getKey());

                    neighbors2.forEach((n) => {
                        let count = 0;
                        for (let i = 0; i < nexts.length; ++i) {
                            if (n.hasNeighbor(nexts[i])) {
                                count++;
                            }
                        }
                        if (count > 1) {
                            for (let i = 0; i < nexts.length; ++i) {
                                if (n.hasNeighbor(nexts[i])) {
                                    tmpv2.subPoints(n.getPosition(), nexts[i].getPosition());
                                    if (tmpv2.length() > 1) {
                                        n.removeNeighbor(nexts[i]);
                                    }
                                }
                            }
                        }
                    });
                    for (let i = 0; i < nexts.length; ++i) {
                        processBranch(curr, nexts[i]);
                    }
                }
            }
        };

        for (let i = 0; i < roots.length; ++i) {
            let root = roots[i];
            let sent: SkeletonNode | null = null;
            if (root.getNeighbors().size > 1) {
                sent = new SkeletonNode(new Point2D(root.getPosition().x, root.getPosition().y - 1), root.getWeight());
                root.addNeighbor(sent);
                roots[i] = sent;
                root = sent;
            }

            const processed: { [key: string]: boolean } = {};
            processed[root.getKey()] = true;
            const next = root.getNeighbors().get(root.getNeighbors().keys().next().value)!;
            processBranch(root, next);
        }

        return roots;
    }

    _findNextPixelWithNeighbors(start: number): number {
        const size = this.skelImg.width * this.skelImg.height;
        let k = start;
        for (k = start; k < size; k++) {
            if (this.skelImg.data[k] & 1) {
                if (this.skelImg.getCurrentNeighborhood(k) === 0) {
                    this.skelImg.data[k] = 0; // Single skeleton pixels are wiped out.
                } else {
                    break;
                }
            }
        }
        return k;
    }

    _checkAndCreate(x: number, y: number, node: SkeletonNode, nodes: { [key: string]: SkeletonNode }): boolean {
        const key = SkeletonNode.computeKey(x + 0.5, y + 0.5);
        let created = false;
        if (nodes[key] === undefined) {
            nodes[key] = new SkeletonNode(new Point2D(x + 0.5, y + 0.5), this.distImg.getValue(x, y) / this.distImg.getCoeff());
            created = true;
        }
        node.neighbors.set(key, nodes[key]);
        return created;
    }

    _addNeighbors(node: SkeletonNode, neighbors: number, nodes: { [key: string]: SkeletonNode }): number {
        const x = Math.floor(node.position.x);
        const y = Math.floor(node.position.y);
        let newElement = 0;

        if (neighbors & 1) {
            newElement += this._checkAndCreate(x - 1, y - 1, node, nodes) ? 1 : 0;
        }
        if (neighbors & 2) {
            newElement += this._checkAndCreate(x, y - 1, node, nodes) ? 1 : 0;
        }
        if (neighbors & 4) {
            newElement += this._checkAndCreate(x + 1, y - 1, node, nodes) ? 1 : 0;
        }
        if (neighbors & 8) {
            newElement += this._checkAndCreate(x + 1, y, node, nodes) ? 1 : 0;
        }
        if (neighbors & 16) {
            newElement += this._checkAndCreate(x + 1, y + 1, node, nodes) ? 1 : 0;
        }
        if (neighbors & 32) {
            newElement += this._checkAndCreate(x, y + 1, node, nodes) ? 1 : 0;
        }
        if (neighbors & 64) {
            newElement += this._checkAndCreate(x - 1, y + 1, node, nodes) ? 1 : 0;
        }
        if (neighbors & 128) {
            newElement += this._checkAndCreate(x - 1, y, node, nodes) ? 1 : 0;
        }

        return newElement;
    }

    _recHierarchy(node: SkeletonNode, nodes: { [key: string]: SkeletonNode }) {
        const neighbors = this.skelImg.getCurrentNeighborhood(
            this.skelImg.getIndex(Math.floor(node.position.x), Math.floor(node.position.y))
        );
        const newElement = this._addNeighbors(node, neighbors, nodes);
        if (newElement) {
            for (const [, valeur] of node.getNeighbors()) {
                this._recHierarchy(valeur, nodes);
            }
        }
    }
}

export default Skeletonizer;

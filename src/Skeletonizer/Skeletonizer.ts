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

export class Skeletonizer {
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
            throw "weight_factor must be greater than 1 as it compares weight_max and weight_factor*weight_min";
        }

        // Process a branch from its root.
        // Next is the direction in which we are looking
        const processBranch = function (root: SkeletonNode, next: SkeletonNode, processed: { [key: string]: boolean }) {

            const tmpv2 = new Vector2D();

            let curr = next;
            const dir = new Vector2D();
            let curr_size = curr.getNeighbors().size;
            let angle_ok = true;
            let weight_ok = true;
            let suspect = null;
            let count = 0;
            let neighbor: SkeletonNode | undefined = next;
            while (curr_size === 2 && angle_ok && weight_ok && !processed[curr.getKey()]) {

                const it = curr.getNeighbors().keys();

                suspect = curr;
                neighbor = curr.getNeighbors().get(it.next().value);
                if (neighbor === undefined)
                    throw "[Skeletonizer] processBranch: curr's neighbor is undefined";
                curr = neighbor;
                if (curr === root) {
                    neighbor = suspect.getNeighbors().get(it.next().value);
                    if (neighbor === undefined)
                        throw "[Skeletonizer] processBranch: suspect's neighbor is undefined";
                    curr = neighbor;
                }

                // Update dir using the second pixel on the branch for more accuracy
                const discard__n = 3; // number of pixels to discard before actually comparing angles and weight
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
                    // remove suspect
                    root.removeNeighbor(suspect);
                    curr.removeNeighbor(suspect);
                    root.addNeighbor(curr);
                }

                processed[suspect.getKey()] = true;

                curr_size = curr.getNeighbors().size;
            }

            // If it's processed, that means we have reached an existing branch so we just do nothing
            if (!processed[curr.getKey()]) {
                if (curr_size === 1) {
                    if (!angle_ok || !weight_ok) {
                        // The very last pixel is out of constraints.
                        // 3 choices :
                        //  - discard it
                        //  - Make an exception and keep it in the current branch
                        //  - have it create a 2 pixel branch
                        // Here we decide to discard it
                        if (suspect) {
                            suspect.removeNeighbor(curr);
                        }
                    }
                    // Very small branch of 1 pixel, we discard it
                    if (count === 0) {
                        root.removeNeighbor(curr);
                    }
                    processed[curr.getKey()] = true;
                } else if (curr_size === 2) { // angle_ok or weihgt_ok must be false
                    // Here the point has gone off the angle constraint but is still on a unique line.
                    // Suspect becames the new root and we go ahead
                    if (suspect === null)
                        throw "[Skeletonizer] processBranch: suspect is null";
                    processBranch(suspect, curr, processed)
                    processed[suspect.getKey()] = true;
                } else {
                    // here the point has more than 2 neighbors so it's a branching point.
                    // We need to get all next branches
                    const nexts: SkeletonNode[] = [];
                    curr.getNeighbors().forEach(
                        function (value) {
                            if (value !== suspect && value !== root) {
                                nexts.push(value);
                            }
                        }
                    );
                    // Discard the suspect even if it was not verifying the weight and angle checks
                    // We could replace curr with suspect instead but its more complex (TODO ?)
                    if (suspect) {
                        root.removeNeighbor(suspect);
                        curr.removeNeighbor(suspect);
                        root.addNeighbor(curr);
                    }


                    processed[curr.getKey()] = true;
                    // We are branching so we need to disconnect all nexts nodes
                    const neighbors2 = new Map(); // Second degree neighbors
                    for (let i = 0; i < nexts.length; ++i) {
                        for (let j = i + 1; j < nexts.length; ++j) {
                            nexts[i].removeNeighbor(nexts[j]);
                        }
                        nexts[i].getNeighbors().forEach(function (value, key) {
                            neighbors2.set(key, value);
                        });
                    }
                    neighbors2.delete(curr.getKey());
                    // Also, if 2 next nodes share a neighbor, it mus be processed only by one of them.
                    // The more connected will be kept.
                    const vec2 = new Vector2D();
                    neighbors2.forEach(function (n) {
                        let count = 0;
                        for (let i = 0; i < nexts.length; ++i) {
                            if (n.hasNeighbor(nexts[i])) {
                                count++;
                            }
                        }
                        if (count > 1) {
                            for (let i = 0; i < nexts.length; ++i) {
                                if (n.hasNeighbor(nexts[i])) {
                                    vec2.subPoints(n.getPosition(), nexts[i].getPosition());
                                    if (vec2.length() > 1) {
                                        n.removeNeighbor(nexts[i]);
                                    }
                                }
                            }
                        }
                    });
                    for (let i = 0; i < nexts.length; ++i) {
                        processBranch(curr, nexts[i], processed);
                    }
                }
            }
        };

        for (let i = 0; i < roots.length; ++i) {
            let root = roots[i];
            let sent = null;
            if (root.getNeighbors().size > 1) {
                // create a sentinel to manage cases where we immediately have 2 branches.
                sent = new SkeletonNode(
                    new Point2D(root.getPosition().x, root.getPosition().y - 1),
                    root.getWeight()
                );
                root.addNeighbor(sent);
                roots[i] = sent;
                root = sent;
                // TODO : remove it afterwards ?
            }

            const processed: {[key: string]: boolean} = {};
            processed[root.getKey()] = true;
            const next = root.getNeighbors().get(root.getNeighbors().keys().next().value);
            if (next === undefined)
                throw "[Skeletonizer] _simplifyHierarchy: next is undefined";
            processBranch(root, next, processed);
        }

        return roots;
    };

    /**
     *  Find the next pixel with neighbors after index start.
     */
    _findNextPixelWithNeighbors(start: number): number {
        const size = this.skelImg.width * this.skelImg.height;
        let k = start;
        for (k = start; k < size; k++) {
            if (this.skelImg.data[k] & 1) {
                if (this.skelImg.getCurrentNeighborhood(k) == 0) {
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
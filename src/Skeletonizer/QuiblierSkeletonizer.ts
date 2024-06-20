"use strict";

import SkeletonNode from "./SkeletonNode";
import Point2D from "./Point2D";
import capsuleDistance from "./CapsuleDistance";

/**
 *  An experimental skeletonizer which starts from extremities and adds nodes by growing from there.
 *  Still not good enough.
 */
class QuiblierSkeletonizer {
    distImg: any;

    constructor(dist_img: any) {
        this.distImg = dist_img;
    }

    buildHierarchy(): SkeletonNode[] {
        const self = this;

        const width = this.distImg.width;
        const height = this.distImg.height;
        const size = width * height;

        // Keep track of all candidates to be the next point added.
        // They are mapped to the node that actually added them as a candidate (for linking)
        const candidates: { [key: number]: SkeletonNode } = {};

        // Accepted error in pixels
        const threshold = 3;

        const nodes_set: { [key: number]: SkeletonNode } = {};
        const nodes: SkeletonNode[] = [];

        const covered: boolean[] = new Array(size).fill(false);

        // Add the zone covered by node and update the candidate list
        const addCover = (node: SkeletonNode, father: SkeletonNode | null, candidates: { [key: number]: SkeletonNode }) => {
            const cx = node.position.x;
            const cy = node.position.y;
            const pw = node.getPosition();
            const nw = Math.ceil(node.weight);
            const fw = father ? Math.ceil(father.getWeight()) : 0;
            const fp = father ? father.getPosition() : null;
            const p = new Point2D(0, 0);

            const zone = {
                min: {
                    x: father ? Math.min(pw.x - nw, fp!.x - fw) : pw.x - nw,
                    y: father ? Math.min(pw.y - nw, fp!.y - fw) : pw.y - nw
                },
                max: {
                    x: father ? Math.max(pw.x + nw, fp!.x + fw) : pw.x + nw,
                    y: father ? Math.max(pw.y + nw, fp!.y + fw) : pw.y + nw
                }
            };

            for (let x = zone.min.x; x < zone.max.x; x++) {
                for (let y = zone.min.y; y < zone.max.y; y++) {
                    p.x = x;
                    p.y = y;
                    const dist_sq = father ?
                        capsuleDistance(node.getPosition(), father.getPosition(), nw, Math.ceil(father.weight), p) :
                        (x - cx) * (x - cx) + (y - cy) * (y - cy);
                    const condition = father ? dist_sq <= 0 : dist_sq <= nw * nw;
                    if (condition) {
                        const idx = y * width + x;
                        covered[idx] = true;
                        delete candidates[idx];
                    }
                }
            }
            // fill in new candidates
            const circumf = Math.PI * 2 * (node.weight + 1);
            const l = Math.round(circumf);
            for (let i = 0; i < l; ++i) {
                const angle = i * 2 * Math.PI / l;
                const x = Math.round(node.position.x + Math.cos(angle) * (node.weight + 1));
                const y = Math.round(node.position.y + Math.sin(angle) * (node.weight + 1));
                const idx = y * width + x;
                const v = self.distImg.getValue(x, y) / self.distImg.getCoeff();
                if (!covered[idx] && v > threshold) {
                    candidates[idx] = node;
                }
            }
        };

        // find the point with highest distance
        let max = 0;
        let max_x = -1;
        let max_y = -1;
        for (let x = 0; x < width; ++x) {
            for (let y = 0; y < height; ++y) {
                const v = this.distImg.getValue(x, y);
                if (v > max) {
                    max = v;
                    max_x = x;
                    max_y = y;
                }
            }
        }

        const first_node = new SkeletonNode(new Point2D(max_x, max_y), max / this.distImg.getCoeff());
        nodes_set[this.distImg.getIndex(max_x, max_y)] = first_node;
        nodes.push(first_node);
        addCover(first_node, null, candidates);

        let counter = 0;
        let ck: string[] = Object.keys(candidates);
        while (ck.length !== 0 && counter < 10000) {
            let max_i = -1;
            let max_v = 0;
            for (let i = 0; i < ck.length; ++i) {
                const idx = parseInt(ck[i]);
                if (covered[idx]) {
                    delete candidates[idx];
                } else if (this.distImg.getIndexValue(idx) > max_v) {
                    max_v = this.distImg.getIndexValue(idx);
                    max_i = idx;
                }
            }

            max_v = max_v / this.distImg.getCoeff();
            const max_point = new Point2D(this.distImg.getXFromIndex(max_i), this.distImg.getYFromIndex(max_i));

            const father = candidates[max_i];
            const best_c = {
                v: max_v,
                p: new Point2D(max_point.x, max_point.y),
                idx: max_i
            };

            // Checking along the segment if there is a better point
            // Here we check if there is not a better-suited candidate along the line from max_i pixel to its father
            // A better candidate would be a point which would cover "almost" the same surface but be closer to the father.
            const checkCandidateBestFit = () => {
                const dist = father.getPosition().distanceTo(max_point);
                const p = new Point2D(0, 0);
                for (let t = 1; t < dist; t += 1.0) { // 1 pixel step
                    // Barycentre de 2 points ?
                    const ratio = t / dist;
                    p.barycenter(max_point, father.getPosition(), 1 - ratio, ratio);
                    p.x = Math.round(p.x);
                    p.y = Math.round(p.y);
                    const v = self.distImg.getValue(p.x, p.y) / self.distImg.getCoeff();
                    const diff = t + max_v - v;
                    // I guess the expected v in a capsule at p is the linear variation of the values but not sure about that. TODO: check
                    const expected_v = (1 - ratio) * max_v + ratio * father.weight;
                    if (diff < 1 // Could have used threshold instead of 1 pixel, but it seemed intuitively that it could reduce the result quality
                        && v > expected_v) { // we found a better candidate.
                        best_c.v = v;
                        best_c.p.x = p.x;
                        best_c.p.y = p.y;
                        best_c.idx = self.distImg.getIndex(p.x, p.y)
                    }
                }
            };

            // Check if there is a better candidate
            // A better candidate is either a point on the line to the father which has a higher distance than expected
            const checkCandidateHighest = () => {
                const dist = father.getPosition().distanceTo(max_point);
                const p = new Point2D(0, 0);
                for (let t = 1; t < dist; t += 1.0) { // 1 pixel step
                    // Barycentre de 2 points ?
                    const ratio = t / dist;
                    p.barycenter(max_point, father.getPosition(), 1 - ratio, ratio);
                    p.x = Math.round(p.x);
                    p.y = Math.round(p.y);
                    const v = self.distImg.getValue(p.x, p.y) / self.distImg.getCoeff();
                    // I guess the expected v in a capsule at p is the linear variation of the values but not sure about that. TODO: check
                    const expected_v = (1 - ratio) * max_v + ratio * father.weight;
                    if (v > expected_v) { // we found a better candidate.
                        best_c.v = v;
                        best_c.p.x = p.x;
                        best_c.p.y = p.y;
                        best_c.idx = self.distImg.getIndex(p.x, p.y)
                    }
                }
            };

            // Split the segment and check if the point is threshold-far from the highest distance in its neighborhood.
            const checkCandidateMid = () => {
                const dist = father.getPosition().distanceTo(max_point);
                const mid = new Point2D(0, 0);
                mid.barycenter(max_point, father.getPosition(), 0.5, 0.5);
                mid.x = Math.round(mid.x);
                mid.y = Math.round(mid.y);
                const v = self.distImg.getValue(mid.x, mid.y) / self.distImg.getCoeff();

                const p = new Point2D(0, 0);

                const dir = new Point2D(
                    max_point.x - father.getPosition().x,
                    max_point.y - father.getPosition().y
                );
                dir.x /= dist;
                dir.y /= dist;
                const ort_dir = new Point2D(-dir.y, dir.x);

                const best_neigh = {
                    v: v,
                    p: new Point2D(mid.x, mid.y),
                    idx: max_i
                };

                const limit = Math.max(father.getWeight() / 2, threshold); // don't look too far
                for (let t = -limit; t <= limit; t++) {
                    p.x = Math.round(mid.x + t * ort_dir.x);
                    p.y = Math.round(mid.y + t * ort_dir.y);
                    const cv = self.distImg.getValue(p.x, p.y) / self.distImg.getCoeff();
                    if (cv > best_neigh.v && cv > v + threshold / 2) { // we don't want to add a point it does not help us win at least the threshold
                        best_neigh.v = cv;
                        best_neigh.p.x = p.x;
                        best_neigh.p.y = p.y;
                    }
                }
                if (best_neigh.p.x !== mid.x || best_neigh.p.y !== mid.y) {
                    best_c.v = best_neigh.v;
                    best_c.p.x = best_neigh.p.x;
                    best_c.p.y = best_neigh.p.y;
                    best_c.idx = self.distImg.getIndex(best_neigh.p.x, best_neigh.p.y);
                    return true;
                } else {
                    return false;
                }
            };

            if (!checkCandidateMid()) {
                checkCandidateBestFit();
            }
            //checkCandidateHighest();

            const new_node = new SkeletonNode(best_c.p, best_c.v);
            new_node.neighbors.set(this.distImg.getIndex(father.position.x, father.position.y), father);
            father.neighbors.set(this.distImg.getIndex(new_node.position.x, new_node.position.y), new_node);

            nodes_set[best_c.idx] = new_node;
            nodes.push(new_node);
            delete candidates[max_i]; // should we really?
            delete candidates[best_c.idx]; // should be undefined anyway since it was picked in the influence of the father node
            addCover(new_node, father, candidates);

            ck = Object.keys(candidates);
            counter++;
        }

        return nodes;
    }
}

export default QuiblierSkeletonizer;

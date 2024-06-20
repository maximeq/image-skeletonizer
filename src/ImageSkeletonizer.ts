"use strict";

import BinaryImage from "./Image/BinaryImage";
import IntDistanceImage from "./Image/IntDistanceImage";

import Point2D from "./Skeletonizer/Point2D";
import SkeletonImage from "./Skeletonizer/SkeletonImage";
import Skeletonizer from "./Skeletonizer/Skeletonizer";
import QuiblierSkeletonizer from "./Skeletonizer/QuiblierSkeletonizer";
import SkeletonNode from "./Skeletonizer/SkeletonNode";
import CapsuleDistance from "./Skeletonizer/CapsuleDistance";

interface ImageSkeletonizerType {
    BinaryImage: typeof BinaryImage;
    IntDistanceImage: typeof IntDistanceImage;
    SkeletonImage: typeof SkeletonImage;
    Skeletonizer: typeof Skeletonizer;
    skeletonize: (img_data: ImageData, angle?: number, weight_factor?: number) => any;
    skeletonizeQ: (img_data: ImageData) => any;
    drawHierarchyInImageData: (h: SkeletonNode[], img_data: ImageData, mode: "circle" | "capsule") => ImageData;
    drawSkeletonInCanvas: (skel: SkeletonNode[], cvs: HTMLCanvasElement) => void;
}

const ImageSkeletonizer: ImageSkeletonizerType = {

    BinaryImage: BinaryImage,
    IntDistanceImage: IntDistanceImage,
    SkeletonImage: SkeletonImage,
    Skeletonizer: Skeletonizer,

    skeletonize: function (img_data: ImageData, angle?: number, weight_factor?: number) {
    const binary_img = new BinaryImage(img_data);
    const dist_img = new IntDistanceImage(3, 4, binary_img, 0);
    const skel_img = new SkeletonImage(binary_img, 0, 2000, dist_img);
    const skeletonizer = new Skeletonizer(skel_img, dist_img);

    return {
        skeleton: skeletonizer.buildHierarchy({
            angle: angle !== undefined ? angle : Math.PI / 13,
            weightFactor: weight_factor !== undefined ? weight_factor : 1.25
        }),
        binaryImg: binary_img,
        distImg: dist_img,
        skelImg: skel_img
    };
},

/**
 * Experimental alternative algorithm for skeletonization.
 */
    skeletonizeQ: function (img_data: ImageData) {
    const binary_img = new BinaryImage(img_data);
    const dist_img = new IntDistanceImage(3, 4, binary_img, 0);
    const skeletonizer = new QuiblierSkeletonizer(dist_img);

    const h = skeletonizer.buildHierarchy();
    return {
        skeleton: h,
        binaryImg: binary_img,
        distImg: dist_img
    };
},

/**
 * @param h A hierarchy built with buildHierarchy of a Skeletonizer.
 * @param img_data The image data in which the hierarchy must be drawn (don't forget to clone it if necessary, it will be modified)
 * @param mode Either "circle" or "capsule" to draw only the node of the graph or the entire capsule cover.
 */
    drawHierarchyInImageData: function (h: SkeletonNode[], img_data: ImageData, mode: "circle" | "capsule"): ImageData {
    const res = img_data;

    const capsule = mode === "capsule";

    const p = new Point2D(0, 0);

    const nodes_set: { [key: string]: SkeletonNode } = {};
    const nodes: SkeletonNode[] = [];
    const segs: [SkeletonNode, SkeletonNode][] = [];

    const recFindAllNodes = function (node: SkeletonNode) {
        const k = node.getKey();
        if (nodes_set[k] === undefined) {
            nodes_set[k] = node;
            nodes.push(node);
            node.getNeighbors().forEach(function (value) {
                const vk = value.getKey();
                if (nodes_set[vk] === undefined) {
                    segs.push([node, value]);
                }
                recFindAllNodes(value);
            });
        }
    };

    for (let i = 0; i < h.length; ++i) {
        recFindAllNodes(h[i]);
    }

    for (let x = 0; x < res.width; ++x) {
        for (let y = 0; y < res.height; ++y) {
            let avg_n = 0;
            p.x = x + 0.5;
            p.y = y + 0.5;
            if (capsule) {
                for (let i = 0; i < segs.length; ++i) {
                    const n0 = segs[i][0];
                    const n1 = segs[i][1];
                    const dist = CapsuleDistance(n0.getPosition(), n1.getPosition(), n0.getWeight(), n1.getWeight(), p);
                    if (dist <= 0) {
                        avg_n++;
                    }
                }
            } else {
                for (let i = 0; i < nodes.length; ++i) {
                    const cx = Math.floor(nodes[i].getPosition().x) + 0.5;
                    const cy = Math.floor(nodes[i].getPosition().y) + 0.5;
                    if ((p.x - cx) * (p.x - cx) + (p.y - cy) * (p.y - cy) <= nodes[i].getWeight() * nodes[i].getWeight()) {
                        avg_n++;
                    }
                }
            }
            const idx = 4 * (y * res.width + x);
            res.data[idx + 1] = (res.data[idx + 1] + avg_n * 255) / (avg_n + 1);
        }
    }

    for (let i = 0; i < nodes.length; ++i) {
        const n = nodes[i];
        const idx = 4 * (Math.floor(n.position.y) * res.width + Math.floor(n.position.x));
        res.data[idx] = 255;
        res.data[idx + 1] = 0;
        res.data[idx + 2] = 0;
    }

    return res;
},

/**
 * Draw the actual skeleton by connecting points with straight lines.
 * @param skel The hierarchy to draw.
 * @param cvs An HTML5 Canvas. Dimensions must be the same as the image dimension on which skel was computed.
 */
    drawSkeletonInCanvas: function (skel: SkeletonNode[], cvs: HTMLCanvasElement) {
    const ctx = cvs.getContext("2d");
    if (ctx === null) {
        throw "[export] drawSkeletonInCanvas: Cannot get 2d context of canvas";
    }

    const nodes_set: { [key: string]: SkeletonNode } = {};
    const nodes: SkeletonNode[] = [];

    const recFindAllNodes = function (node: SkeletonNode) {
        const k = node.position.x + ";" + node.position.y;
        if (nodes_set[k] === undefined) {
            nodes_set[k] = node;
            nodes.push(node);
            node.getNeighbors().forEach(function (value) {
                recFindAllNodes(value);
            });
        }
    };

    for (let i = 0; i < skel.length; ++i) {
        recFindAllNodes(skel[i]);
    }

    for (let i = 0; i < nodes.length; ++i) {
        const node = nodes[i];
        node.getNeighbors().forEach(function (value) {
            ctx.lineWidth = 1;
            ctx.strokeStyle = "#ff0000";
            ctx.beginPath();
            ctx.moveTo(node.position.x, node.position.y);
            ctx.lineTo(value.position.x, value.position.y);
            ctx.stroke();
            ctx.fillStyle = "#0000ff";
            ctx.fillRect(node.position.x, node.position.y, 1, 1);
            ctx.fillRect(value.position.x, value.position.y, 1, 1);
        });
    }
}
}

export default ImageSkeletonizer;

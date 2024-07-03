import SkeletonNode from "./SkeletonNode";
import SkeletonImage from "./SkeletonImage";
import { IntDistanceImage } from "../Image/IntDistanceImage";
interface Params {
    angle?: number;
    weightFactor?: number;
}
export declare class Skeletonizer {
    skelImg: SkeletonImage;
    distImg: IntDistanceImage;
    constructor(skel_img: SkeletonImage, dist_img: IntDistanceImage);
    buildHierarchy(params?: Params): SkeletonNode[];
    _simplifyHierarchy(roots: SkeletonNode[], angle: number, weight_factor: number): SkeletonNode[];
    /**
     *  Find the next pixel with neighbors after index start.
     */
    _findNextPixelWithNeighbors(start: number): number;
    _checkAndCreate(x: number, y: number, node: SkeletonNode, nodes: {
        [key: string]: SkeletonNode;
    }): boolean;
    _addNeighbors(node: SkeletonNode, neighbors: number, nodes: {
        [key: string]: SkeletonNode;
    }): number;
    _recHierarchy(node: SkeletonNode, nodes: {
        [key: string]: SkeletonNode;
    }): void;
}
export default Skeletonizer;
//# sourceMappingURL=Skeletonizer.d.ts.map
import SkeletonNode from "./SkeletonNode";
import SkeletonImage from "./SkeletonImage";
import { IntDistanceImage } from "../Image/IntDistanceImage";
interface Params {
    angle?: number;
    weightFactor?: number;
}
/**
 *  Improvements notes :
 *      - Currently the weight factor is used to split while processing a branch, compared to the origin.
 *        It would be better to split only if the difference is to high compared to the linear variation
 *        along a branch.
 *
 *  @param params
 *  @param params.angle Maximum angle difference allowed along a branch. Default to PI/13.
 *  @param params.weightFactor Maximum factor between the larger and the smaller weights (ie max < factor*min), in [1,+infinity]. Default to 1.25.
 */
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
import SkeletonNode from "./SkeletonNode";
/**
 *  An experimental skeletonizer which starts from extremities and adds nodes by growing from there.
 *  Still not good enough.
 */
export declare class QuiblierSkeletonizer {
    distImg: any;
    constructor(dist_img: any);
    buildHierarchy(): SkeletonNode[];
}
export default QuiblierSkeletonizer;
//# sourceMappingURL=QuiblierSkeletonizer.d.ts.map
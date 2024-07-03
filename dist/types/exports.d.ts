import { BinaryImage } from "./Image/BinaryImage";
import { IntDistanceImage } from "./Image/IntDistanceImage";
import { Point2D } from "./Skeletonizer/Point2D";
import { SkeletonImage } from "./Skeletonizer/SkeletonImage";
import { Skeletonizer } from "./Skeletonizer/Skeletonizer";
import { QuiblierSkeletonizer } from "./Skeletonizer/QuiblierSkeletonizer";
import { SkeletonNode } from "./Skeletonizer/SkeletonNode";
declare const _default: {
    Point2D: typeof Point2D;
    SkeletonImage: typeof SkeletonImage;
    Skeletonizer: typeof Skeletonizer;
    QuiblierSkeletonizer: typeof QuiblierSkeletonizer;
    CapsuleDistance: (p1: Point2D, p2: Point2D, r1: number, r2: number, p: Point2D) => number;
    skeletonize: (img_data: ImageData, angle?: number, weight_factor?: number) => {
        skeleton: SkeletonNode[];
        binaryImg: BinaryImage;
        distImg: IntDistanceImage;
        skelImg: SkeletonImage;
    };
    skeletonizeQ: (img_data: ImageData) => {
        skeleton: SkeletonNode[];
        binaryImg: BinaryImage;
        distImg: IntDistanceImage;
    };
    drawHierarchyInImageData: (h: SkeletonNode[], img_data: ImageData, mode: "circle" | "capsule") => ImageData;
    drawSkeletonInCanvas: (skel: SkeletonNode[], cvs: HTMLCanvasElement) => void;
};
export default _default;
//# sourceMappingURL=exports.d.ts.map
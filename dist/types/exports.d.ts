import BinaryImage from "./Image/BinaryImage";
import IntDistanceImage from "./Image/IntDistanceImage";
import SkeletonImage from "./Skeletonizer/SkeletonImage";
import Skeletonizer from "./Skeletonizer/Skeletonizer";
import SkeletonNode from "./Skeletonizer/SkeletonNode";
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
declare const ImageSkeletonizer: ImageSkeletonizerType;
export default ImageSkeletonizer;
//# sourceMappingURL=exports.d.ts.map
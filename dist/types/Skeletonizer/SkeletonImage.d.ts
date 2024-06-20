import { BinaryImage } from "../Image/BinaryImage";
import { IntDistanceImage } from "../Image/IntDistanceImage";
declare class SkeletonImage {
    width: number;
    height: number;
    data: number[];
    /**
     * @param source The source image in binary
     * @param uncolored The pixel value of source that will be considered as uncolored. Usually 0, but can be 1.
     * @param max_iter Maximum iteration for the skeletonizing algorithm.
     * @param distance_image The distance image from which the skeleton will be computed
     */
    constructor(source: BinaryImage, uncolored: number, max_iter: number, distance_image: IntDistanceImage);
    getIndex(x: number, y: number): number;
    getXFromIndex(idx: number): number;
    getYFromIndex(idx: number): number;
    /**
     * @param bgColor The background color, default to white if undefined or null.
     * @param skelColor The skeleton color, default to red if undefined or null.
     * @return An ImageData on which the skeleton is drawn according to required colors.
     */
    getImageData(bgColor?: number[], skelColor?: number[]): ImageData;
    cleanBorderPixels(): void;
    thin(): number[];
    /**
     * Skeleton's extraction algorithm based on U. Eckhardt and G. Maderlechner, Invariant Thinning, 1993.
     *
     * @author Adeline Pihuit 21/01/09
     */
    skeletonizeEckhardtMaderlechner93(maxIter: number, distance_image: IntDistanceImage, threshold: number): void;
    /**
     * Encode the neighborhood of the pixel.
     * Each bit corresponds to whether or not a pixel contains information in
     * a determined place.
     * The following table describes the place of each bit in the neighborhood
     *     ---w--->
     *  |  |0|1|2|
     *  h  |7| |3|
     *  |  |6|5|4|
     *  V
     * @param indexPixel a pointer towards the neighborhood wanted pixel
     * @return The encoded neighborhood
     */
    getCurrentNeighborhood(indexPixel: number): number;
    /**
     * @param neighbors
     * @return number of neighbors
     */
    nbNeighbours(neighbors: number): number;
    getNbStrongNeighbors(tab: number[], valeurPix: number): number;
    getNbNoStrongNeighbors(tab: number[], valeurPix: number): number;
    isInnerBoundaryPixel(tab: number[], valeurPix: number): boolean;
    isSimpleBoundaryPixel(tab: number[], valeurPix: number): boolean;
}
export default SkeletonImage;
//# sourceMappingURL=SkeletonImage.d.ts.map
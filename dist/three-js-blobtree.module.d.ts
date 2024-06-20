/**
 *  Class to manipulate a "binary" image, ie the RGBA pixel data is replaced with 0 or 1 (1 for near black pixels).
 *
 *  @param {ImageData} source The orginal image to be binarized
 *  @param {number}    tolerance The difference to white above which the pixel is considered black. Default to 12.
 *                               Difference is computed by cumulating difference for each channel.
 */
declare class BinaryImage {
    tolerance: number;
    width: number;
    height: number;
    data: Uint8Array;
    constructor(source: ImageData, tolerance?: number);
    getIndex(x: number, y: number): number;
    /**
     *  @return 0 or 1
     */
    getValue(x: number, y: number): 0 | 1;
    /**
     *  @private
     *  TODO : tolerance is unused, see if it is useful
     */
    private _buildBinaryImage;
}

/**
 *  Class keeping distance as an Integer array. This computes the distance to the closest border
 *  of a given shape.
 *  Actual distance approximation can be computed using this.getValue(x,y)/this.getCoeff()
 *
 *  @param c1 Main distance coefficient for a pixel
 *  @param c2 Diagonal distance coefficient for a pixel.
 */
declare class IntDistanceImage {
    coeff: number;
    width: number;
    height: number;
    data: number[];
    constructor(c1: number, c2: number, source: BinaryImage, uncolored: number);
    rebuild(c1: number, c2: number, source: BinaryImage, uncolored: number): void;
    getCoeff(): number;
    getIndex(x: number, y: number): number;
    getValue(x: number, y: number): number;
    getIndexValue(idx: number): number;
    getXFromIndex(idx: number): number;
    getYFromIndex(idx: number): number;
    _buildDistanceImage(c1: number, c2: number, source: BinaryImage, uncolored: number): void;
    /**
     *  @return {ImageData} A grey scale ImageData to visualize the distances.
     */
    getImageData(): ImageData;
}

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
//# sourceMappingURL=SkeletonImage.d.ts.map

declare class Point2D {
    x: number;
    y: number;
    constructor(x: number, y: number);
    distanceToOrigin(): number;
    distanceTo(p: Point2D): number;
    barycenter(p1: Point2D, p2: Point2D, w1: number, w2: number): this;
}

/**
 * Main class for a skeleton node in an image.
 * Must be unique for each pixel.
 */
declare class SkeletonNode {
    position: Point2D;
    weight: number;
    neighbors: Map<string, SkeletonNode>;
    constructor(position: Point2D, weight: number);
    /**
     * Compute the key of a node in neighbors maps, given its x,y positions.
     */
    static computeKey(x: number, y: number): string;
    /**
     * Return x,y in an array of 2 elements
     */
    static getXYFromKey(key: string): [number, number];
    getKey(): string;
    getPosition(): Point2D;
    getWeight(): number;
    getNeighbors(): Map<string, SkeletonNode>;
    setPosition(position: Point2D): void;
    setWeight(weight: number): void;
    setNeighbors(neighbors: Map<string, SkeletonNode>): void;
    addNeighbor(n: SkeletonNode): void;
    removeNeighbor(n: SkeletonNode): void;
    hasNeighbor(n: SkeletonNode): boolean;
}

interface Params {
    angle?: number;
    weightFactor?: number;
}
declare class Skeletonizer {
    skelImg: SkeletonImage;
    distImg: IntDistanceImage;
    constructor(skel_img: SkeletonImage, dist_img: IntDistanceImage);
    buildHierarchy(params?: Params): SkeletonNode[];
    _simplifyHierarchy(roots: SkeletonNode[], angle: number, weight_factor: number): SkeletonNode[];
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
//# sourceMappingURL=Skeletonizer.d.ts.map

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
//# sourceMappingURL=exports.d.ts.map

export { ImageSkeletonizer as default };

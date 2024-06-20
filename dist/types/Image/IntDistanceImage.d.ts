import { BinaryImage } from "./BinaryImage";
/**
 *  Class keeping distance as an Integer array. This computes the distance to the closest border
 *  of a given shape.
 *  Actual distance approximation can be computed using this.getValue(x,y)/this.getCoeff()
 *
 *  @param c1 Main distance coefficient for a pixel
 *  @param c2 Diagonal distance coefficient for a pixel.
 */
export declare class IntDistanceImage {
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
export default IntDistanceImage;
//# sourceMappingURL=IntDistanceImage.d.ts.map
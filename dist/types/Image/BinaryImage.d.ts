/**
 *  Class to manipulate a "binary" image, ie the RGBA pixel data is replaced with 0 or 1 (1 for near black pixels).
 *
 *  @param {ImageData} source The orginal image to be binarized
 *  @param {number}    tolerance The difference to white above which the pixel is considered black. Default to 12.
 *                               Difference is computed by cumulating difference for each channel.
 */
export declare class BinaryImage {
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
export default BinaryImage;
//# sourceMappingURL=BinaryImage.d.ts.map
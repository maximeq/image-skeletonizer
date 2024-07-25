/**
 *  Class to manipulate a "binary" image, ie the RGBA pixel data is replaced with 0 or 1 (1 for near black pixels).
 *
 *  @param source The orginal image to be binarized
 *  @param tolerance The difference to white above which the pixel is considered black. Default to 12.
 *                               Difference is computed by cumulating difference for each channel.
 */
export class BinaryImage {
  tolerance: number;
  width: number;
  height: number;
  data: Uint8Array;
  

  constructor(source: ImageData, tolerance?: number) {
    this.tolerance = tolerance !== undefined ? tolerance : 12;
    this.width = source.width;
    this.height = source.height;
    this.data = new Uint8Array(source.width * source.height);
    this._buildBinaryImage(source);
  };

  getIndex (x: number, y: number) {
    return y * this.width + x;
  };
/**
 *  @return 0 or 1
 */
  getValue (x: number, y: number): 0 | 1 {
    const output = this.data[this.getIndex(x, y)];
    if (output !== 1 && output !== 0)
      throw '[BinaryImage] getValue : invalid value, data should only have 0s and 1s';
    return output;
  };

/**
 *  @private
 *  TODO : tolerance is unused, see if it is useful
 */
  private _buildBinaryImage (source: ImageData) {
    const l = this.width * this.height;
    for (let i = 0; i < l; i++) {
      const idx = 4 * i;
      // this.data[i] = 3*255 - (source.data[idx] + source.data[idx+1] + source.data[idx+2])  < tolerance ? 0 : 1;
      if (source.data[idx] < 125 && source.data[idx + 1] < 125 && source.data[idx + 2] < 125) {
        this.data[i] = 1;
      } else {
        this.data[i] = 0;
      }

    }
  };
}

export default BinaryImage;

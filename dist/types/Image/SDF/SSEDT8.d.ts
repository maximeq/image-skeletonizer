/**
 * signed distance fields generation in javascript
 * uses the 8SSEDT algorithm for linear-time processing
 *
 * done in conjustion with the signed distance fields text experiment
 *
 * references:
 *      http://www.lems.brown.edu/vision/people/leymarie/Refs/CompVision/DT/DTpaper.pdf
 *      http://www.codersnotes.com/notes/signed-distance-fields
 *      http://guides4it.com/Mobile/iphone-3d-programming---crisper-text-with-distance-fields-(part-1)---generating-distance-fields-with-python.aspx
 *
 * http://github.com/zz85
 * http://twitter.com/blurspline
 * 29 April 2012
 *
 */
/**
 *  Used in computation of both unsigned and signed distance field according to 8SSEDT algorithm
 *  @param grid The gird on wich we want the SDF
 *  @param width Grid width
 *  @param height Grid height
 *  @constructor
 */
export declare class SSEDT8 {
    width: number;
    height: number;
    grid: {
        x: number;
        y: number;
    }[];
    outside: number;
    outofrange: {
        x: number;
        y: number;
    };
    inc: number;
    incMaxSize: number;
    constructor(grid: {
        x: number;
        y: number;
    }[], width: number, height: number);
    /**
     *  Return value at a given position in the grid
     *  @param x coordinate in width
     *  @param y coordinate in height
     *  @param grid The grid
     *
     *  @return The cell at x y
     */
    grid_get(grid: {
        x: number;
        y: number;
    }[], x: number, y: number): {
        x: number;
        y: number;
    };
    /**
     *  Set value at a given position in the grid
     *  @param x coordinate in width
     *  @param y coordinate in height
     *  @param grid The grid
     *  @param p The new value
     */
    grid_put(grid: {
        x: number;
        y: number;
    }[], x: number, y: number, p: {
        x: number;
        y: number;
    }): void;
    /**
     *  Return the squared length of an object defining a cell in the grid
     *  @param c A cell (2D point with x and y coordinates)
     */
    lengthSq: (c: {
        x: number;
        y: number;
    }) => number;
    /**
     *  Make some kind of comparison between some cells...
     *  @param g A grid
     *  @param cell A cell
     *
     *  @return cell, modified if necessary
     */
    grid_compare(g: {
        x: number;
        y: number;
    }[], cell: {
        x: number;
        y: number;
    }, x: number, y: number, offsetX: number, offsetY: number): {
        x: number;
        y: number;
    };
    /**
     *  Progagate something
     *   @param grid A grid
     */
    propagate(grid: {
        x: number;
        y: number;
    }[]): void;
    /**
     *  Get the signed distance field from the curent grid.
     */
    signedDistanceFieldsFromGrid(): {
        data: Float32Array;
        width: number;
        height: number;
    };
    /**
     *  Get Unsigned Distance Field based on 8SSEDT
     */
    unsignedDistanceFieldsFromGrid(): {
        data: Float32Array;
        width: number;
        height: number;
    };
    /**
     *  Compute and return signed distance field
     *  @param img_data The ImageData from a canvas context('2D')
     *  @param signed True if the returned distane field must be signed. Default to true.
     */
    computeDistanceField(img_data: ImageData, signed: boolean): {
        data: Float32Array;
        width: number;
        height: number;
    };
}
export default SSEDT8;
//# sourceMappingURL=SSEDT8.d.ts.map
/**
 *  Class to manipulate a "binary" image, ie the RGBA pixel data is replaced with 0 or 1 (1 for near black pixels).
 *
 *  @param source The orginal image to be binarized
 *  @param tolerance The difference to white above which the pixel is considered black. Default to 12.
 *                               Difference is computed by cumulating difference for each channel.
 */
class BinaryImage {
    tolerance;
    width;
    height;
    data;
    constructor(source, tolerance) {
        this.tolerance = tolerance !== undefined ? tolerance : 12;
        this.width = source.width;
        this.height = source.height;
        this.data = new Uint8Array(source.width * source.height);
        this._buildBinaryImage(source);
    }
    ;
    getIndex(x, y) {
        return y * this.width + x;
    }
    ;
    /**
     *  @return 0 or 1
     */
    getValue(x, y) {
        const output = this.data[this.getIndex(x, y)];
        if (output !== 1 && output !== 0)
            throw '[BinaryImage] getValue : invalid value, data should only have 0s and 1s';
        return output;
    }
    ;
    /**
     *  @private
     *  TODO : tolerance is unused, see if it is useful
     */
    _buildBinaryImage(source) {
        const l = this.width * this.height;
        for (let i = 0; i < l; i++) {
            const idx = 4 * i;
            // this.data[i] = 3*255 - (source.data[idx] + source.data[idx+1] + source.data[idx+2])  < tolerance ? 0 : 1;
            if (source.data[idx] < 125 && source.data[idx + 1] < 125 && source.data[idx + 2] < 125) {
                this.data[i] = 1;
            }
            else {
                this.data[i] = 0;
            }
        }
    }
    ;
}

/**
 *  Class keeping distance as an Integer array. This computes the distance to the closest border
 *  of a given shape.
 *  Actual distance approximation can be computed using this.getValue(x,y)/this.getCoeff()
 *
 *  @param c1 Main distance coefficient for a pixel
 *  @param c2 Diagonal distance coefficient for a pixel.
 */
class IntDistanceImage {
    coeff;
    width;
    height;
    data;
    constructor(c1, c2, source, uncolored) {
        if (!(source instanceof BinaryImage)) {
            throw "[IntDistanceImage] constructor: source must be an instance of BinaryImage";
        }
        this.coeff = c1;
        this.width = source.width;
        this.height = source.height;
        this.data = new Array(source.width * source.height);
        this._buildDistanceImage(c1, c2, source, uncolored);
    }
    ;
    rebuild(c1, c2, source, uncolored) {
        this.coeff = c1;
        this._buildDistanceImage(c1, c2, source, uncolored);
    }
    getCoeff() {
        return this.coeff;
    }
    getIndex(x, y) {
        return y * this.width + x;
    }
    getValue(x, y) {
        return this.data[this.getIndex(x, y)];
    }
    getIndexValue(idx) {
        return this.data[idx];
    }
    getXFromIndex(idx) {
        return idx % this.width;
    }
    getYFromIndex(idx) {
        return Math.floor(idx / this.width);
    }
    _buildDistanceImage(c1, c2, source, uncolored) {
        const width = source.width;
        const height = source.height;
        for (let i = 0; i < width; ++i) {
            this.data[i] = 0;
        }
        for (let j = 1; j < height - 1; ++j) {
            this.data[j * width] = 0;
            for (let i = 1; i < width - 1; ++i) {
                let index = this.getIndex(i, j);
                this.data[index] = 0;
                let dist = 0;
                if (source.data[index] != uncolored) {
                    let index_1_1 = this.getIndex(i - 1, j - 1);
                    let index0_1 = this.getIndex(i, j - 1);
                    let index_11 = this.getIndex(i - 1, j);
                    let index1_1 = this.getIndex(i + 1, j - 1);
                    dist = Math.min(this.data[index_1_1] + c2, this.data[index0_1] + c1);
                    dist = Math.min(dist, this.data[index_11] + c1);
                    dist = Math.min(dist, this.data[index1_1] + c2);
                    this.data[index] = dist;
                }
            }
            this.data[this.getIndex(width - 1, j)] = 0;
        }
        for (let i = 0; i < width; ++i) {
            this.data[this.getIndex(i, height - 1)] = 0;
        }
        for (let j = height - 2; j > 0; --j) {
            for (let i = width - 2; i > 0; --i) {
                let index = this.getIndex(i, j);
                let dist = this.data[index];
                if (source.data[index] != uncolored) {
                    let index11 = this.getIndex(i + 1, j + 1);
                    let index0_1 = this.getIndex(i, j + 1);
                    let index_11 = this.getIndex(i - 1, j + 1);
                    let index10 = this.getIndex(i + 1, j);
                    dist = Math.min(dist, this.data[index11] + c2);
                    dist = Math.min(dist, this.data[index0_1] + c1);
                    dist = Math.min(dist, this.data[index_11] + c2);
                    this.data[index] = Math.min(dist, this.data[index10] + c1);
                }
            }
        }
    }
    ;
    /**
     *  @return A grey scale ImageData to visualize the distances.
     */
    getImageData() {
        const res = new ImageData(this.width, this.height);
        let maxDist = 0;
        for (let x = 0; x < this.width * this.height; x++) {
            maxDist = (this.data[x] > maxDist) ? this.data[x] : maxDist;
        }
        for (let y = 0, i = 0, rgbValue = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let index = (y * this.width + x);
                if (this.data[index] > 3) {
                    rgbValue = 255 * this.data[index] / maxDist;
                    res.data[i] = rgbValue;
                    res.data[i + 1] = rgbValue;
                    res.data[i + 2] = rgbValue;
                    res.data[i + 3] = 255;
                }
                else {
                    res.data[i] = 255;
                    res.data[i + 1] = 255;
                    res.data[i + 2] = 255;
                    res.data[i + 3] = 255;
                }
                i += 4;
            }
        }
        return res;
    }
    ;
}

class Point2D {
    x;
    y;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    distanceToOrigin() {
        const x = this.x;
        const y = this.y;
        return Math.sqrt(x * x + y * y);
    }
    distanceTo(p) {
        const x = this.x - p.x;
        const y = this.y - p.y;
        return Math.sqrt(x * x + y * y);
    }
    barycenter(p1, p2, w1, w2) {
        const t = w2 / (w1 + w2);
        this.x = (1 - t) * p1.x + t * p2.x;
        this.y = (1 - t) * p1.y + t * p2.y;
        return this;
    }
}

class SkeletonImage {
    width;
    height;
    data;
    /**
     * @param source The source image in binary
     * @param uncolored The pixel value of source that will be considered as uncolored. Usually 0, but can be 1.
     * @param max_iter Maximum iteration for the skeletonizing algorithm.
     * @param distance_image The distance image from which the skeleton will be computed
     */
    constructor(source, uncolored, max_iter, distance_image) {
        this.width = source.width;
        this.height = source.height;
        this.data = new Array(this.width * this.height);
        for (let k = 0; k < this.width * this.height; k++) {
            if (source.data[k] !== uncolored) {
                this.data[k] = 1;
            }
            else {
                this.data[k] = 0;
            }
        }
        let maxDist = 0;
        for (let x = 0; x < distance_image.width * distance_image.height; x++) {
            maxDist = distance_image.data[x] > maxDist ? distance_image.data[x] : maxDist;
        }
        // Ensure that border pixel will not mess up the whole thing
        this.cleanBorderPixels();
        // this.skeletonizeEckhardtMaderlechner93(maxIter, distance_image, distance_image.getCoeff() * 4);
        this.skeletonizeEckhardtMaderlechner93(max_iter, distance_image, maxDist * 0.8);
        // ComputeMinMaxWeight(distance_image);
        // Post processing to improve skeleton quality
        // setInteriorStatus();
        this.cleanBorderPixels();
        this.thin();
        // setEndPoints();
    }
    getIndex(x, y) {
        return y * this.width + x;
    }
    getXFromIndex(idx) {
        return idx % this.width;
    }
    getYFromIndex(idx) {
        return Math.floor(idx / this.width);
    }
    /**
     * @param bgColor The background color, default to white if undefined or null.
     * @param skelColor The skeleton color, default to red if undefined or null.
     * @return An ImageData on which the skeleton is drawn according to required colors.
     */
    getImageData(bgColor, skelColor) {
        const res = new ImageData(this.width, this.height);
        const bg_c = bgColor ? bgColor : [255, 255, 255, 255];
        const skel_c = skelColor ? skelColor : [255, 0, 0, 255];
        for (let y = 0, i = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const index = y * this.width + x;
                if (this.data[index] === 1) {
                    res.data[i] = skel_c[0];
                    res.data[i + 1] = skel_c[1];
                    res.data[i + 2] = skel_c[2];
                    res.data[i + 3] = skel_c[3];
                }
                else {
                    res.data[i] = bg_c[0];
                    res.data[i + 1] = bg_c[1];
                    res.data[i + 2] = bg_c[2];
                    res.data[i + 3] = bg_c[3];
                }
                i += 4;
            }
        }
        return res;
    }
    // Set all bit of border pixels to 0
    cleanBorderPixels() {
        for (let i = 0; i < this.width; i++) {
            this.data[i] = 0;
            this.data[(this.height - 1) * this.width + i] = 0;
        }
        for (let j = 1; j < this.height - 2; j++) {
            this.data[j * this.width] = 0;
            this.data[j * this.width + (this.width - 1)] = 0;
        }
    }
    thin() {
        let index = this.width - 2;
        for (let i = 1; i < this.height - 1; i++) {
            index += 2;
            for (let j = 1; j < this.width - 1; j++) {
                index++;
                if ((this.data[index] & 1) === 0)
                    continue;
                const voisins = this.getCurrentNeighborhood(index);
                if (((voisins & 7) === 0 && (voisins & 112) === 112) ||
                    ((voisins & 14) === 0 && (voisins & 160) === 160) ||
                    ((voisins & 28) === 0 && (voisins & 193) === 193) ||
                    ((voisins & 56) === 0 && (voisins & 130) === 130) ||
                    ((voisins & 112) === 0 && (voisins & 7) === 7) ||
                    ((voisins & 224) === 0 && (voisins & 10) === 10) ||
                    ((voisins & 193) === 0 && (voisins & 28) === 28) ||
                    ((voisins & 131) === 0 && (voisins & 40) === 40))
                    this.data[index] = 0;
            }
        }
        return this.data;
    }
    /**
     * Skeleton's extraction algorithm based on U. Eckhardt and G. Maderlechner, Invariant Thinning, 1993.
     *
     * @author Adeline Pihuit 21/01/09
     */
    skeletonizeEckhardtMaderlechner93(maxIter, distance_image, threshold) {
        const size = this.width * this.height;
        const flag = new Array(size); // interior (2) or boundary (1) pixel
        const flagSN = new Array(size); // nb strong neighbors
        const flagN = new Array(size); // nb neighbors
        const flagIBP = new Array(size); // Inner Boundary Pixel
        const flagPIBP = new Array(size); // Perfect Inner Boundary Pixel
        const flagSBP = new Array(size); // Simple Boundary Pixel
        const flagEnd = new Array(size); // Resulting image
        const flagDbg = new Array(size); // Temporary image: color pixel
        let found = true;
        let iter = 0;
        const inf = this.width + 1;
        const sup = size - this.width - 1;
        while (found && iter < maxIter) {
            found = false;
            for (let k = inf; k < sup; k++) {
                flagSN[k] = this.getNbStrongNeighbors(this.data, k); // ptrFlagSN: nb Strong Neighbors
                flagN[k] = flagSN[k] + this.getNbNoStrongNeighbors(this.data, k); // ptrFlagN: nb neighbors not strong
                if (this.data[k]) {
                    // Interior Pixel (2): 4 strong neighbors "on"
                    if (flagSN[k] === 4) {
                        flag[k] = 2;
                        flagDbg[k] = 1;
                    }
                    // Boundary Pixel (1)
                    else {
                        flag[k] = 1;
                        flagDbg[k] = 2;
                    }
                }
                else {
                    flag[k] = 0;
                }
            } // end for
            // 2nd test: IBP
            // Inner Boundary Pixel = boundary pixel (1) having an interior pixel (2) as strong neighbor
            for (let k = inf; k < sup; k++) {
                if (this.data[k]) {
                    flagIBP[k] =
                        flag[k] === 1 &&
                            (flag[k + 1] === 2 || flag[k - 1] === 2 || flag[k + this.width] === 2 || flag[k - this.width] === 2);
                }
                else {
                    flagIBP[k] = false;
                }
                if (flagIBP[k]) {
                    flagIBP[k] = true;
                    flagDbg[k] = 3;
                }
                else {
                    flagIBP[k] = false;
                }
            } // end for
            for (let k = inf; k < sup; ++k) {
                if (this.data[k] && flag[k] === 1) {
                    const p0 = (this.data[k + 1] & 1) !== 0 ? 1 : 0;
                    const p1 = (this.data[k - this.width + 1] & 1) !== 0 ? 1 : 0;
                    const p2 = (this.data[k - this.width] & 1) !== 0 ? 1 : 0;
                    const p3 = (this.data[k - this.width - 1] & 1) !== 0 ? 1 : 0;
                    const p4 = (this.data[k - 1] & 1) !== 0 ? 1 : 0;
                    const p5 = (this.data[k + this.width - 1] & 1) !== 0 ? 1 : 0;
                    const p6 = (this.data[k + this.width] & 1) !== 0 ? 1 : 0;
                    const p7 = (this.data[k + this.width + 1] & 1) !== 0 ? 1 : 0;
                    const trans = (1 - p0) * p1 +
                        (1 - p1) * p2 +
                        (1 - p2) * p3 +
                        (1 - p3) * p4 +
                        (1 - p4) * p5 +
                        (1 - p5) * p6 +
                        (1 - p6) * p7 +
                        (1 - p7) * p0;
                    const b = p0 + p1 + p2 + p3 + p4 + p5 + p6 + p7;
                    const d = trans === 1 || (trans === 0 && b === 8);
                    flagSBP[k] = (flag[k] === 1 && d && (p0 || p2 || p4 || p6)) === 1;
                }
                else {
                    flagSBP[k] = false;
                }
                if (flagSBP[k]) {
                    flagDbg[k] = 4;
                }
            } // end for
            for (let k = inf; k < sup; ++k) {
                if (this.data[k]) {
                    const b0 = flag[k + 1] === 2 && !this.data[k - 1];
                    const b1 = flag[k - 1] === 2 && !this.data[k + 1];
                    const b2 = flag[k + this.width] === 2 && !this.data[k - this.width];
                    const b3 = flag[k - this.width] === 2 && !this.data[k + this.width];
                    flagPIBP[k] = flagIBP[k] && (b0 || b1 || b2 || b3);
                }
                else {
                    flagPIBP[k] = false;
                }
                if (flagPIBP[k]) {
                    flagDbg[k] = 5;
                }
            } // end for
            // pixels to remove
            for (let k = 0; k < size; ++k) {
                if (this.data[k]) {
                    if (flagSBP[k] && flagPIBP[k]) {
                        flagEnd[k] = 0;
                        flagDbg[k] = 6;
                        found = true;
                    }
                    else {
                        if (flagN[k] === 0) {
                            // 0 neighbors!
                            flagEnd[k] = 0;
                        }
                        else if (distance_image.data[k] < threshold && flagN[k] === 1) {
                            flagEnd[k] = 0;
                            found = true;
                        }
                        else {
                            flagEnd[k] = 1;
                        }
                    }
                }
                else {
                    flagEnd[k] = 0;
                    flagDbg[k] = 0;
                }
            } // end for
            for (let i = 0; i < flagEnd.length; i++) {
                this.data[i] = flagEnd[i];
            }
            ++iter;
        } // end while
    }
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
    getCurrentNeighborhood(indexPixel) {
        const tab = this.data;
        // encode the neighborhood of the pixel
        return (((tab[indexPixel - 1] & 1) << 7) |
            ((tab[indexPixel + 1] & 1) << 3) |
            ((tab[indexPixel + this.width] & 1) << 5) |
            ((tab[indexPixel - this.width] & 1) << 1) |
            (tab[indexPixel - (this.width + 1)] & 1) |
            ((tab[indexPixel - (this.width - 1)] & 1) << 2) |
            ((tab[indexPixel + (this.width - 1)] & 1) << 6) |
            ((tab[indexPixel + (this.width + 1)] & 1) << 4));
    }
    /**
     * @param neighbors
     * @return number of neighbors
     */
    nbNeighbours(neighbors) {
        return ((neighbors & 1) +
            ((neighbors >> 1) & 1) +
            ((neighbors >> 2) & 1) +
            ((neighbors >> 3) & 1) +
            ((neighbors >> 4) & 1) +
            ((neighbors >> 5) & 1) +
            ((neighbors >> 6) & 1) +
            ((neighbors >> 7) & 1));
    }
    getNbStrongNeighbors(tab, valeurPix) {
        return tab[valeurPix - 1] + tab[valeurPix + 1] + tab[valeurPix - this.width] + tab[valeurPix + this.width];
    }
    getNbNoStrongNeighbors(tab, valeurPix) {
        return (tab[valeurPix - 1 - this.width] +
            tab[valeurPix - 1 + this.width] +
            tab[valeurPix + 1 - this.width] +
            tab[valeurPix + 1 + this.width]);
    }
    isInnerBoundaryPixel(tab, valeurPix) {
        return (tab[valeurPix] === 1 &&
            (tab[valeurPix - 1] === 2 ||
                tab[valeurPix + 1] === 2 ||
                tab[valeurPix - this.width] === 2 ||
                tab[valeurPix + this.width] === 2));
    }
    isSimpleBoundaryPixel(tab, valeurPix) {
        const p0 = (tab[valeurPix + 1] & 1) !== 0 ? 1 : 0;
        const p1 = (tab[valeurPix - this.width + 1] & 1) !== 0 ? 1 : 0;
        const p2 = (tab[valeurPix - this.width] & 1) !== 0 ? 1 : 0;
        const p3 = (tab[valeurPix - this.width - 1] & 1) !== 0 ? 1 : 0;
        const p4 = (tab[valeurPix - 1] & 1) !== 0 ? 1 : 0;
        const p5 = (tab[valeurPix + this.width - 1] & 1) !== 0 ? 1 : 0;
        const p6 = (tab[valeurPix + this.width] & 1) !== 0 ? 1 : 0;
        const p7 = (tab[valeurPix + this.width + 1] & 1) !== 0 ? 1 : 0;
        const trans = (1 - p0) * p1 +
            (1 - p1) * p2 +
            (1 - p2) * p3 +
            (1 - p3) * p4 +
            (1 - p4) * p5 +
            (1 - p5) * p6 +
            (1 - p6) * p7 +
            (1 - p7) * p0;
        const b = p0 + p1 + p2 + p3 + p4 + p5 + p6 + p7;
        const d = trans === 1 || (trans === 0 && b === 8);
        return (d && (p0 || p2 || p4 || p6)) === 1;
    }
}

/**
 * Main class for a skeleton node in an image.
 * Must be unique for each pixel.
 */
class SkeletonNode {
    position;
    weight;
    neighbors;
    constructor(position, weight) {
        this.position = position;
        this.weight = weight;
        this.neighbors = new Map();
    }
    /**
     * Compute the key of a node in neighbors maps, given its x,y positions.
     */
    static computeKey(x, y) {
        return Math.floor(x) + ";" + Math.floor(y);
    }
    /**
     * Return x,y in an array of 2 elements
     */
    static getXYFromKey(key) {
        const res = key.split(";");
        return [parseInt(res[0]), parseInt(res[1])];
    }
    // Getters
    getKey() {
        return SkeletonNode.computeKey(this.position.x, this.position.y);
    }
    getPosition() {
        return this.position;
    }
    getWeight() {
        return this.weight;
    }
    getNeighbors() {
        return this.neighbors;
    }
    // Setters
    setPosition(position) {
        this.position = position;
    }
    setWeight(weight) {
        this.weight = weight;
    }
    setNeighbors(neighbors) {
        this.neighbors = neighbors;
    }
    addNeighbor(n) {
        this.neighbors.set(n.getKey(), n);
        n.neighbors.set(this.getKey(), this);
    }
    removeNeighbor(n) {
        this.neighbors.delete(n.getKey());
        n.neighbors.delete(this.getKey());
    }
    hasNeighbor(n) {
        return this.neighbors.has(n.getKey());
    }
}

class Vector2D {
    x;
    y;
    constructor(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }
    length() {
        const x = this.x;
        const y = this.y;
        return Math.sqrt(x * x + y * y);
    }
    subPoints(p1, p2) {
        this.x = p1.x - p2.x;
        this.y = p1.y - p2.y;
        return this;
    }
    angle() {
        // computes the angle in radians with respect to the positive x-axis
        let angle = Math.atan2(this.y, this.x);
        if (angle < 0)
            angle += 2 * Math.PI;
        return angle;
    }
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
class Skeletonizer {
    skelImg;
    distImg;
    constructor(skel_img, dist_img) {
        this.skelImg = skel_img;
        this.distImg = dist_img;
    }
    buildHierarchy(params = {}) {
        // Default parameters
        params.angle = params.angle || Math.PI / 13;
        params.weightFactor = params.weightFactor || 1.25;
        const size = this.skelImg.width * this.skelImg.height;
        let nodes = {};
        let roots = [];
        let k = this._findNextPixelWithNeighbors(0);
        while (k < size) {
            const x = this.skelImg.getXFromIndex(k);
            const y = this.skelImg.getYFromIndex(k);
            const key = SkeletonNode.computeKey(x + 0.5, y + 0.5);
            if (nodes[key] === undefined) {
                nodes[key] = new SkeletonNode(new Point2D(x + 0.5, y + 0.5), this.distImg.data[k] / this.distImg.getCoeff());
                roots.push(nodes[key]);
                this._recHierarchy(nodes[key], nodes);
            }
            k = this._findNextPixelWithNeighbors(k + 1);
        }
        return this._simplifyHierarchy(roots, params.angle, params.weightFactor);
    }
    _simplifyHierarchy(roots, angle, weight_factor) {
        if (weight_factor < 1.0) {
            throw "weight_factor must be greater than 1 as it compares weight_max and weight_factor*weight_min";
        }
        // Process a branch from its root.
        // Next is the direction in which we are looking
        const processBranch = function (root, next, processed) {
            const tmpv2 = new Vector2D();
            let curr = next;
            const dir = new Vector2D();
            let curr_size = curr.getNeighbors().size;
            let angle_ok = true;
            let weight_ok = true;
            let suspect = null;
            let count = 0;
            let value;
            let neighbor;
            while (curr_size === 2 && angle_ok && weight_ok && curr && !processed[curr.getKey()]) {
                const it = curr.getNeighbors().keys();
                suspect = curr;
                value = it.next().value;
                neighbor = value ? curr.getNeighbors().get(value) : undefined;
                if (neighbor === undefined)
                    throw "[Skeletonizer] processBranch: curr's neighbor is undefined";
                curr = neighbor;
                if (curr === root) {
                    value = it.next().value;
                    neighbor = value ? suspect.getNeighbors().get(value) : undefined;
                    if (neighbor === undefined)
                        throw "[Skeletonizer] processBranch: suspect's neighbor is undefined";
                    curr = neighbor;
                }
                // Update dir using the second pixel on the branch for more accuracy
                const discard__n = 3; // number of pixels to discard before actually comparing angles and weight
                if (count < discard__n) {
                    dir.x += curr.getPosition().x;
                    dir.y += curr.getPosition().y;
                }
                if (count === discard__n - 1) {
                    dir.x = (dir.x - discard__n * root.getPosition().x) / discard__n;
                    dir.y = (dir.y - discard__n * root.getPosition().y) / discard__n;
                }
                count++;
                tmpv2.subPoints(curr.getPosition(), root.getPosition());
                const a = tmpv2.angle() - dir.angle();
                if (!(Math.abs(a) < angle || count < discard__n)) {
                    angle_ok = false;
                }
                if (count >= discard__n) {
                    let w_ratio = root.getWeight() / curr.getWeight();
                    if (w_ratio < 1) {
                        w_ratio = 1 / w_ratio;
                    }
                    if (w_ratio > weight_factor) {
                        weight_ok = false;
                    }
                }
                if (angle_ok && weight_ok) {
                    // remove suspect
                    root.removeNeighbor(suspect);
                    curr.removeNeighbor(suspect);
                    root.addNeighbor(curr);
                }
                processed[suspect.getKey()] = true;
                curr_size = curr.getNeighbors().size;
            }
            // If it's processed, that means we have reached an existing branch so we just do nothing
            if (!processed[curr.getKey()]) {
                if (curr_size === 1) {
                    if (!angle_ok || !weight_ok) {
                        // The very last pixel is out of constraints.
                        // 3 choices :
                        //  - discard it
                        //  - Make an exception and keep it in the current branch
                        //  - have it create a 2 pixel branch
                        // Here we decide to discard it
                        if (suspect) {
                            suspect.removeNeighbor(curr);
                        }
                    }
                    // Very small branch of 1 pixel, we discard it
                    if (count === 0) {
                        root.removeNeighbor(curr);
                    }
                    processed[curr.getKey()] = true;
                }
                else if (curr_size === 2) { // angle_ok or weihgt_ok must be false
                    // Here the point has gone off the angle constraint but is still on a unique line.
                    // Suspect becames the new root and we go ahead
                    if (suspect === null)
                        throw "[Skeletonizer] processBranch: suspect is null";
                    processBranch(suspect, curr, processed);
                    processed[suspect.getKey()] = true;
                }
                else {
                    // here the point has more than 2 neighbors so it's a branching point.
                    // We need to get all next branches
                    const nexts = [];
                    curr.getNeighbors().forEach(function (value) {
                        if (value !== suspect && value !== root) {
                            nexts.push(value);
                        }
                    });
                    // Discard the suspect even if it was not verifying the weight and angle checks
                    // We could replace curr with suspect instead but its more complex (TODO ?)
                    if (suspect) {
                        root.removeNeighbor(suspect);
                        curr.removeNeighbor(suspect);
                        root.addNeighbor(curr);
                    }
                    processed[curr.getKey()] = true;
                    // We are branching so we need to disconnect all nexts nodes
                    const neighbors2 = new Map(); // Second degree neighbors
                    for (let i = 0; i < nexts.length; ++i) {
                        for (let j = i + 1; j < nexts.length; ++j) {
                            nexts[i].removeNeighbor(nexts[j]);
                        }
                        nexts[i].getNeighbors().forEach(function (value, key) {
                            neighbors2.set(key, value);
                        });
                    }
                    neighbors2.delete(curr.getKey());
                    // Also, if 2 next nodes share a neighbor, it mus be processed only by one of them.
                    // The more connected will be kept.
                    const vec2 = new Vector2D();
                    neighbors2.forEach(function (n) {
                        let count = 0;
                        for (let i = 0; i < nexts.length; ++i) {
                            if (n.hasNeighbor(nexts[i])) {
                                count++;
                            }
                        }
                        if (count > 1) {
                            for (let i = 0; i < nexts.length; ++i) {
                                if (n.hasNeighbor(nexts[i])) {
                                    vec2.subPoints(n.getPosition(), nexts[i].getPosition());
                                    if (vec2.length() > 1) {
                                        n.removeNeighbor(nexts[i]);
                                    }
                                }
                            }
                        }
                    });
                    for (let i = 0; i < nexts.length; ++i) {
                        processBranch(curr, nexts[i], processed);
                    }
                }
            }
        };
        for (let i = 0; i < roots.length; ++i) {
            let root = roots[i];
            let sent = null;
            if (root.getNeighbors().size > 1) {
                // create a sentinel to manage cases where we immediately have 2 branches.
                sent = new SkeletonNode(new Point2D(root.getPosition().x, root.getPosition().y - 1), root.getWeight());
                root.addNeighbor(sent);
                roots[i] = sent;
                root = sent;
                // TODO : remove it afterwards ?
            }
            const processed = {};
            processed[root.getKey()] = true;
            const next = root.getNeighbors().keys().next().value ? root.getNeighbors().get(root.getNeighbors().keys().next().value) : undefined;
            if (next === undefined)
                throw "[Skeletonizer] _simplifyHierarchy: next is undefined";
            processBranch(root, next, processed);
        }
        return roots;
    }
    ;
    /**
     *  Find the next pixel with neighbors after index start.
     */
    _findNextPixelWithNeighbors(start) {
        const size = this.skelImg.width * this.skelImg.height;
        let k = start;
        for (k = start; k < size; k++) {
            if (this.skelImg.data[k] & 1) {
                if (this.skelImg.getCurrentNeighborhood(k) == 0) {
                    this.skelImg.data[k] = 0; // Single skeleton pixels are wiped out.
                }
                else {
                    break;
                }
            }
        }
        return k;
    }
    _checkAndCreate(x, y, node, nodes) {
        const key = SkeletonNode.computeKey(x + 0.5, y + 0.5);
        let created = false;
        if (nodes[key] === undefined) {
            nodes[key] = new SkeletonNode(new Point2D(x + 0.5, y + 0.5), this.distImg.getValue(x, y) / this.distImg.getCoeff());
            created = true;
        }
        node.neighbors.set(key, nodes[key]);
        return created;
    }
    _addNeighbors(node, neighbors, nodes) {
        const x = Math.floor(node.position.x);
        const y = Math.floor(node.position.y);
        let newElement = 0;
        if (neighbors & 1) {
            newElement += this._checkAndCreate(x - 1, y - 1, node, nodes) ? 1 : 0;
        }
        if (neighbors & 2) {
            newElement += this._checkAndCreate(x, y - 1, node, nodes) ? 1 : 0;
        }
        if (neighbors & 4) {
            newElement += this._checkAndCreate(x + 1, y - 1, node, nodes) ? 1 : 0;
        }
        if (neighbors & 8) {
            newElement += this._checkAndCreate(x + 1, y, node, nodes) ? 1 : 0;
        }
        if (neighbors & 16) {
            newElement += this._checkAndCreate(x + 1, y + 1, node, nodes) ? 1 : 0;
        }
        if (neighbors & 32) {
            newElement += this._checkAndCreate(x, y + 1, node, nodes) ? 1 : 0;
        }
        if (neighbors & 64) {
            newElement += this._checkAndCreate(x - 1, y + 1, node, nodes) ? 1 : 0;
        }
        if (neighbors & 128) {
            newElement += this._checkAndCreate(x - 1, y, node, nodes) ? 1 : 0;
        }
        return newElement;
    }
    _recHierarchy(node, nodes) {
        const neighbors = this.skelImg.getCurrentNeighborhood(this.skelImg.getIndex(Math.floor(node.position.x), Math.floor(node.position.y)));
        const newElement = this._addNeighbors(node, neighbors, nodes);
        if (newElement) {
            for (const [, valeur] of node.getNeighbors()) {
                this._recHierarchy(valeur, nodes);
            }
        }
    }
}

// This function is just computing the distance to a capsule
// Useful to know exactly which part of the image is already covered
const capsuleDistance = (() => {
    const unit_dir = new Vector2D();
    const v = new Vector2D();
    const proj = new Point2D(0, 0);
    return function (p1, p2, r1, r2, p) {
        unit_dir.x = p2.x - p1.x;
        unit_dir.y = p2.y - p1.y;
        const length = unit_dir.length();
        unit_dir.x = unit_dir.x / length;
        unit_dir.y = unit_dir.y / length;
        v.subPoints(p, p1);
        const p1p_l = v.length();
        const p1p_sqrl = p1p_l * p1p_l;
        // In unit_dir basis, vector (this.r1-this.r2, this.length) is normal to the "weight line"
        // We need a projection in this direction up to the segment line to know in which case we fall.
        const x_p_2D = v.x * unit_dir.x + v.y * unit_dir.y;
        // Pythagorean theorem
        const y_p_2D = Math.sqrt(Math.max(// Necessary because of rounded errors, pyth result can be <0 and this causes sqrt to return NaN...
        0.0, p1p_sqrl - x_p_2D * x_p_2D // = y_p_2D² by Pythagorean theorem
        ));
        const t = -y_p_2D / length;
        const proj_x = x_p_2D + t * (r1 - r2);
        // const proj_y = 0.0; // by construction
        // Easy way to compute the distance now that we have the projection on the segment
        let a = proj_x / length;
        if (a > 1.0) {
            a = 1.0;
        }
        if (a < 0.0) {
            a = 0.0;
        }
        proj.x = p1.x;
        proj.y = p1.y;
        proj.x += (p2.x - proj.x) * a; // compute the actual 3D projection
        proj.y += (p2.y - proj.y) * a;
        v.x = p.x - proj.x;
        v.y = p.y - proj.y;
        const l = v.length();
        return l - (a * r2 + (1.0 - a) * r1);
    };
})();

/**
 *  An experimental skeletonizer which starts from extremities and adds nodes by growing from there.
 *  Still not good enough.
 */
class QuiblierSkeletonizer {
    distImg;
    constructor(dist_img) {
        this.distImg = dist_img;
    }
    buildHierarchy() {
        const self = this;
        const width = this.distImg.width;
        const height = this.distImg.height;
        const size = width * height;
        // Keep track of all candidates to be the next point added.
        // They are mapped to the node that actually added them as a candidate (for linking)
        const candidates = {};
        // Accepted error in pixels
        const threshold = 3;
        const nodes_set = {};
        const nodes = [];
        const covered = new Array(size).fill(false);
        // Add the zone covered by node and update the candidate list
        const addCover = (node, father, candidates) => {
            const cx = node.position.x;
            const cy = node.position.y;
            const pw = node.getPosition();
            const nw = Math.ceil(node.weight);
            const fw = father ? Math.ceil(father.getWeight()) : 0;
            const fp = father ? father.getPosition() : null;
            const p = new Point2D(0, 0);
            const zone = {
                min: {
                    x: father ? Math.min(pw.x - nw, fp.x - fw) : pw.x - nw,
                    y: father ? Math.min(pw.y - nw, fp.y - fw) : pw.y - nw
                },
                max: {
                    x: father ? Math.max(pw.x + nw, fp.x + fw) : pw.x + nw,
                    y: father ? Math.max(pw.y + nw, fp.y + fw) : pw.y + nw
                }
            };
            for (let x = zone.min.x; x < zone.max.x; x++) {
                for (let y = zone.min.y; y < zone.max.y; y++) {
                    p.x = x;
                    p.y = y;
                    const dist_sq = father ?
                        capsuleDistance(node.getPosition(), father.getPosition(), nw, Math.ceil(father.weight), p) :
                        (x - cx) * (x - cx) + (y - cy) * (y - cy);
                    const condition = father ? dist_sq <= 0 : dist_sq <= nw * nw;
                    if (condition) {
                        const idx = y * width + x;
                        covered[idx] = true;
                        delete candidates[idx];
                    }
                }
            }
            // fill in new candidates
            const circumf = Math.PI * 2 * (node.weight + 1);
            const l = Math.round(circumf);
            for (let i = 0; i < l; ++i) {
                const angle = i * 2 * Math.PI / l;
                const x = Math.round(node.position.x + Math.cos(angle) * (node.weight + 1));
                const y = Math.round(node.position.y + Math.sin(angle) * (node.weight + 1));
                const idx = y * width + x;
                const v = self.distImg.getValue(x, y) / self.distImg.getCoeff();
                if (!covered[idx] && v > threshold) {
                    candidates[idx] = node;
                }
            }
        };
        // find the point with highest distance
        let max = 0;
        let max_x = -1;
        let max_y = -1;
        for (let x = 0; x < width; ++x) {
            for (let y = 0; y < height; ++y) {
                const v = this.distImg.getValue(x, y);
                if (v > max) {
                    max = v;
                    max_x = x;
                    max_y = y;
                }
            }
        }
        const first_node = new SkeletonNode(new Point2D(max_x, max_y), max / this.distImg.getCoeff());
        nodes_set[this.distImg.getIndex(max_x, max_y)] = first_node;
        nodes.push(first_node);
        addCover(first_node, null, candidates);
        let counter = 0;
        let ck = Object.keys(candidates);
        while (ck.length !== 0 && counter < 10000) {
            let max_i = -1;
            let max_v = 0;
            for (let i = 0; i < ck.length; ++i) {
                const idx = parseInt(ck[i]);
                if (covered[idx]) {
                    delete candidates[idx];
                }
                else if (this.distImg.getIndexValue(idx) > max_v) {
                    max_v = this.distImg.getIndexValue(idx);
                    max_i = idx;
                }
            }
            max_v = max_v / this.distImg.getCoeff();
            const max_point = new Point2D(this.distImg.getXFromIndex(max_i), this.distImg.getYFromIndex(max_i));
            const father = candidates[max_i];
            const best_c = {
                v: max_v,
                p: new Point2D(max_point.x, max_point.y),
                idx: max_i
            };
            // Checking along the segment if there is a better point
            // Here we check if there is not a better-suited candidate along the line from max_i pixel to its father
            // A better candidate would be a point which would cover "almost" the same surface but be closer to the father.
            const checkCandidateBestFit = () => {
                const dist = father.getPosition().distanceTo(max_point);
                const p = new Point2D(0, 0);
                for (let t = 1; t < dist; t += 1.0) { // 1 pixel step
                    // Barycentre de 2 points ?
                    const ratio = t / dist;
                    p.barycenter(max_point, father.getPosition(), 1 - ratio, ratio);
                    p.x = Math.round(p.x);
                    p.y = Math.round(p.y);
                    const v = self.distImg.getValue(p.x, p.y) / self.distImg.getCoeff();
                    const diff = t + max_v - v;
                    // I guess the expected v in a capsule at p is the linear variation of the values but not sure about that. TODO: check
                    const expected_v = (1 - ratio) * max_v + ratio * father.weight;
                    if (diff < 1 // Could have used threshold instead of 1 pixel, but it seemed intuitively that it could reduce the result quality
                        && v > expected_v) { // we found a better candidate.
                        best_c.v = v;
                        best_c.p.x = p.x;
                        best_c.p.y = p.y;
                        best_c.idx = self.distImg.getIndex(p.x, p.y);
                    }
                }
            };
            // Check if there is a better candidate
            // A better candidate is either a point on the line to the father which has a higher distance than expected
            // const checkCandidateHighest = () => {
            //     const dist = father.getPosition().distanceTo(max_point);
            //     const p = new Point2D(0, 0);
            //     for (let t = 1; t < dist; t += 1.0) { // 1 pixel step
            //         // Barycentre de 2 points ?
            //         const ratio = t / dist;
            //         p.barycenter(max_point, father.getPosition(), 1 - ratio, ratio);
            //         p.x = Math.round(p.x);
            //         p.y = Math.round(p.y);
            //         const v = self.distImg.getValue(p.x, p.y) / self.distImg.getCoeff();
            //         // I guess the expected v in a capsule at p is the linear variation of the values but not sure about that. TODO: check
            //         const expected_v = (1 - ratio) * max_v + ratio * father.weight;
            //         if (v > expected_v) { // we found a better candidate.
            //             best_c.v = v;
            //             best_c.p.x = p.x;
            //             best_c.p.y = p.y;
            //             best_c.idx = self.distImg.getIndex(p.x, p.y)
            //         }
            //     }
            // };
            // Split the segment and check if the point is threshold-far from the highest distance in its neighborhood.
            const checkCandidateMid = () => {
                const dist = father.getPosition().distanceTo(max_point);
                const mid = new Point2D(0, 0);
                mid.barycenter(max_point, father.getPosition(), 0.5, 0.5);
                mid.x = Math.round(mid.x);
                mid.y = Math.round(mid.y);
                const v = self.distImg.getValue(mid.x, mid.y) / self.distImg.getCoeff();
                const p = new Point2D(0, 0);
                const dir = new Point2D(max_point.x - father.getPosition().x, max_point.y - father.getPosition().y);
                dir.x /= dist;
                dir.y /= dist;
                const ort_dir = new Point2D(-dir.y, dir.x);
                const best_neigh = {
                    v: v,
                    p: new Point2D(mid.x, mid.y),
                    idx: max_i
                };
                const limit = Math.max(father.getWeight() / 2, threshold); // don't look too far
                for (let t = -limit; t <= limit; t++) {
                    p.x = Math.round(mid.x + t * ort_dir.x);
                    p.y = Math.round(mid.y + t * ort_dir.y);
                    const cv = self.distImg.getValue(p.x, p.y) / self.distImg.getCoeff();
                    if (cv > best_neigh.v && cv > v + threshold / 2) { // we don't want to add a point it does not help us win at least the threshold
                        best_neigh.v = cv;
                        best_neigh.p.x = p.x;
                        best_neigh.p.y = p.y;
                    }
                }
                if (best_neigh.p.x !== mid.x || best_neigh.p.y !== mid.y) {
                    best_c.v = best_neigh.v;
                    best_c.p.x = best_neigh.p.x;
                    best_c.p.y = best_neigh.p.y;
                    best_c.idx = self.distImg.getIndex(best_neigh.p.x, best_neigh.p.y);
                    return true;
                }
                else {
                    return false;
                }
            };
            if (!checkCandidateMid()) {
                checkCandidateBestFit();
            }
            //checkCandidateHighest();
            const new_node = new SkeletonNode(best_c.p, best_c.v);
            new_node.neighbors.set(this.distImg.getIndex(father.position.x, father.position.y), father);
            father.neighbors.set(this.distImg.getIndex(new_node.position.x, new_node.position.y), new_node);
            nodes_set[best_c.idx] = new_node;
            nodes.push(new_node);
            delete candidates[max_i]; // should we really?
            delete candidates[best_c.idx]; // should be undefined anyway since it was picked in the influence of the father node
            addCover(new_node, father, candidates);
            ck = Object.keys(candidates);
            counter++;
        }
        return nodes;
    }
}

const skeletonize = function (img_data, angle, weight_factor) {
    const binary_img = new BinaryImage(img_data);
    const dist_img = new IntDistanceImage(3, 4, binary_img, 0);
    const skel_img = new SkeletonImage(binary_img, 0, 2000, dist_img);
    const skeletonizer = new Skeletonizer(skel_img, dist_img);
    return {
        skeleton: skeletonizer.buildHierarchy({
            angle: angle !== undefined ? angle : Math.PI / 13,
            weightFactor: weight_factor !== undefined ? weight_factor : 1.25
        }),
        binaryImg: binary_img,
        distImg: dist_img,
        skelImg: skel_img
    };
};
/**
 * Experimental alternative algorithm for skeletonization.
 */
const skeletonizeQ = function (img_data) {
    const binary_img = new BinaryImage(img_data);
    const dist_img = new IntDistanceImage(3, 4, binary_img, 0);
    const skeletonizer = new QuiblierSkeletonizer(dist_img);
    const h = skeletonizer.buildHierarchy();
    return {
        skeleton: h,
        binaryImg: binary_img,
        distImg: dist_img
    };
};
/**
 * @param h A hierarchy built with buildHierarchy of a Skeletonizer.
 * @param img_data The image data in which the hierarchy must be drawn (don't forget to clone it if necessary, it will be modified)
 * @param mode Either "circle" or "capsule" to draw only the node of the graph or the entire capsule cover.
 */
const drawHierarchyInImageData = function (h, img_data, mode) {
    const res = img_data;
    const capsule = mode === "capsule";
    const p = new Point2D(0, 0);
    const nodes_set = {};
    const nodes = [];
    const segs = [];
    const recFindAllNodes = function (node) {
        const k = node.getKey();
        if (nodes_set[k] === undefined) {
            nodes_set[k] = node;
            nodes.push(node);
            node.getNeighbors().forEach(function (value) {
                const vk = value.getKey();
                if (nodes_set[vk] === undefined) {
                    segs.push([node, value]);
                }
                recFindAllNodes(value);
            });
        }
    };
    for (let i = 0; i < h.length; ++i) {
        recFindAllNodes(h[i]);
    }
    for (let x = 0; x < res.width; ++x) {
        for (let y = 0; y < res.height; ++y) {
            let avg_n = 0;
            p.x = x + 0.5;
            p.y = y + 0.5;
            if (capsule) {
                for (let i = 0; i < segs.length; ++i) {
                    const n0 = segs[i][0];
                    const n1 = segs[i][1];
                    const dist = capsuleDistance(n0.getPosition(), n1.getPosition(), n0.getWeight(), n1.getWeight(), p);
                    if (dist <= 0) {
                        avg_n++;
                    }
                }
            }
            else {
                for (let i = 0; i < nodes.length; ++i) {
                    const cx = Math.floor(nodes[i].getPosition().x) + 0.5;
                    const cy = Math.floor(nodes[i].getPosition().y) + 0.5;
                    if ((p.x - cx) * (p.x - cx) + (p.y - cy) * (p.y - cy) <= nodes[i].getWeight() * nodes[i].getWeight()) {
                        avg_n++;
                    }
                }
            }
            const idx = 4 * (y * res.width + x);
            res.data[idx + 1] = (res.data[idx + 1] + avg_n * 255) / (avg_n + 1);
        }
    }
    for (let i = 0; i < nodes.length; ++i) {
        const n = nodes[i];
        const idx = 4 * (Math.floor(n.position.y) * res.width + Math.floor(n.position.x));
        res.data[idx] = 255;
        res.data[idx + 1] = 0;
        res.data[idx + 2] = 0;
    }
    return res;
};
/**
 * Draw the actual skeleton by connecting points with straight lines.
 * @param skel The hierarchy to draw.
 * @param cvs An HTML5 Canvas. Dimensions must be the same as the image dimension on which skel was computed.
 */
const drawSkeletonInCanvas = function (skel, cvs) {
    const ctx = cvs.getContext("2d");
    if (ctx === null) {
        throw "[export] drawSkeletonInCanvas: Cannot get 2d context of canvas";
    }
    const nodes_set = {};
    const nodes = [];
    const recFindAllNodes = function (node) {
        const k = node.position.x + ";" + node.position.y;
        if (nodes_set[k] === undefined) {
            nodes_set[k] = node;
            nodes.push(node);
            node.getNeighbors().forEach(function (value) {
                recFindAllNodes(value);
            });
        }
    };
    for (let i = 0; i < skel.length; ++i) {
        recFindAllNodes(skel[i]);
    }
    for (let i = 0; i < nodes.length; ++i) {
        const node = nodes[i];
        node.getNeighbors().forEach(function (value) {
            ctx.lineWidth = 1;
            ctx.strokeStyle = "#ff0000";
            ctx.beginPath();
            ctx.moveTo(node.position.x, node.position.y);
            ctx.lineTo(value.position.x, value.position.y);
            ctx.stroke();
            ctx.fillStyle = "#0000ff";
            ctx.fillRect(node.position.x, node.position.y, 1, 1);
            ctx.fillRect(value.position.x, value.position.y, 1, 1);
        });
    }
};
var exports = {
    Point2D,
    SkeletonImage,
    Skeletonizer,
    QuiblierSkeletonizer,
    CapsuleDistance: capsuleDistance,
    skeletonize,
    skeletonizeQ,
    drawHierarchyInImageData,
    drawSkeletonInCanvas
};

export { exports as default };
//# sourceMappingURL=image-skeletonizer.module.js.map

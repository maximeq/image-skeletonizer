/**
 *  Class to manipulate a "binary" image, ie the RGBA pixel data is replaced with 0 or 1 (1 for near black pixels).
 *
 *  @param source The orginal image to be binarized
 *  @param tolerance The difference to white above which the pixel is considered black. Default to 12.
 *                               Difference is computed by cumulating difference for each channel.
 */
var BinaryImage = /** @class */ (function () {
    function BinaryImage(source, tolerance) {
        this.tolerance = tolerance !== undefined ? tolerance : 12;
        this.width = source.width;
        this.height = source.height;
        this.data = new Uint8Array(source.width * source.height);
        this._buildBinaryImage(source, this.tolerance);
    }
    BinaryImage.prototype.getIndex = function (x, y) {
        return y * this.width + x;
    };
    /**
     *  @return 0 or 1
     */
    BinaryImage.prototype.getValue = function (x, y) {
        var output = this.data[this.getIndex(x, y)];
        if (output !== 1 && output !== 0)
            throw '[BinaryImage] getValue : invalid value, data should only have 0s and 1s';
        return output;
    };
    /**
     *  @private
     *  TODO : tolerance is unused, see if it is useful
     */
    BinaryImage.prototype._buildBinaryImage = function (source, _tolerance) {
        var l = this.width * this.height;
        for (var i = 0; i < l; i++) {
            var idx = 4 * i;
            // this.data[i] = 3*255 - (source.data[idx] + source.data[idx+1] + source.data[idx+2])  < tolerance ? 0 : 1;
            if (source.data[idx] < 125 && source.data[idx + 1] < 125 && source.data[idx + 2] < 125) {
                this.data[i] = 1;
            }
            else {
                this.data[i] = 0;
            }
        }
    };
    return BinaryImage;
}());

/**
 *  Class keeping distance as an Integer array. This computes the distance to the closest border
 *  of a given shape.
 *  Actual distance approximation can be computed using this.getValue(x,y)/this.getCoeff()
 *
 *  @param c1 Main distance coefficient for a pixel
 *  @param c2 Diagonal distance coefficient for a pixel.
 */
var IntDistanceImage = /** @class */ (function () {
    function IntDistanceImage(c1, c2, source, uncolored) {
        if (!(source instanceof BinaryImage)) {
            throw "IntDistanceImage Error : source must be an instance of BinaryImage";
        }
        this.coeff = c1;
        this.width = source.width;
        this.height = source.height;
        this.data = new Array(source.width * source.height);
        this._buildDistanceImage(c1, c2, source, uncolored);
    }
    IntDistanceImage.prototype.rebuild = function (c1, c2, source, uncolored) {
        this.coeff = c1;
        this._buildDistanceImage(c1, c2, source, uncolored);
    };
    IntDistanceImage.prototype.getCoeff = function () {
        return this.coeff;
    };
    IntDistanceImage.prototype.getIndex = function (x, y) {
        return y * this.width + x;
    };
    IntDistanceImage.prototype.getValue = function (x, y) {
        return this.data[this.getIndex(x, y)];
    };
    IntDistanceImage.prototype.getIndexValue = function (idx) {
        return this.data[idx];
    };
    IntDistanceImage.prototype.getXFromIndex = function (idx) {
        return idx % this.width;
    };
    IntDistanceImage.prototype.getYFromIndex = function (idx) {
        return Math.floor(idx / this.width);
    };
    IntDistanceImage.prototype._buildDistanceImage = function (c1, c2, source, uncolored) {
        var width = source.width;
        var height = source.height;
        for (var i = 0; i < width; ++i) {
            this.data[i] = 0;
        }
        for (var j = 1; j < height - 1; ++j) {
            this.data[j * width] = 0;
            for (var i = 1; i < width - 1; ++i) {
                var index = this.getIndex(i, j);
                this.data[index] = 0;
                var dist = 0;
                if (source.data[index] != uncolored) {
                    var index_1_1 = this.getIndex(i - 1, j - 1);
                    var index0_1 = this.getIndex(i, j - 1);
                    var index_11 = this.getIndex(i - 1, j);
                    var index1_1 = this.getIndex(i + 1, j - 1);
                    dist = Math.min(this.data[index_1_1] + c2, this.data[index0_1] + c1);
                    dist = Math.min(dist, this.data[index_11] + c1);
                    dist = Math.min(dist, this.data[index1_1] + c2);
                    this.data[index] = dist;
                }
            }
            this.data[this.getIndex(width - 1, j)] = 0;
        }
        for (var i = 0; i < width; ++i) {
            this.data[this.getIndex(i, height - 1)] = 0;
        }
        for (var j = height - 2; j > 0; --j) {
            for (var i = width - 2; i > 0; --i) {
                var index = this.getIndex(i, j);
                var dist = this.data[index];
                if (source.data[index] != uncolored) {
                    var index11 = this.getIndex(i + 1, j + 1);
                    var index0_1 = this.getIndex(i, j + 1);
                    var index_11 = this.getIndex(i - 1, j + 1);
                    var index10 = this.getIndex(i + 1, j);
                    dist = Math.min(dist, this.data[index11] + c2);
                    dist = Math.min(dist, this.data[index0_1] + c1);
                    dist = Math.min(dist, this.data[index_11] + c2);
                    this.data[index] = Math.min(dist, this.data[index10] + c1);
                }
            }
        }
    };
    /**
     *  @return {ImageData} A grey scale ImageData to visualize the distances.
     */
    IntDistanceImage.prototype.getImageData = function () {
        var res = new ImageData(this.width, this.height);
        var maxDist = 0;
        for (var x = 0; x < this.width * this.height; x++) {
            maxDist = (this.data[x] > maxDist) ? this.data[x] : maxDist;
        }
        for (var y = 0, i = 0, rgbValue = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                var index = (y * this.width + x);
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
    };
    return IntDistanceImage;
}());

var Point2D = /** @class */ (function () {
    function Point2D(x, y) {
        this.x = x;
        this.y = y;
    }
    Point2D.prototype.distanceToOrigin = function () {
        var x = this.x;
        var y = this.y;
        return Math.sqrt(x * x + y * y);
    };
    Point2D.prototype.distanceTo = function (p) {
        var x = this.x - p.x;
        var y = this.y - p.y;
        return Math.sqrt(x * x + y * y);
    };
    Point2D.prototype.barycenter = function (p1, p2, w1, w2) {
        var t = w2 / (w1 + w2);
        this.x = (1 - t) * p1.x + t * p2.x;
        this.y = (1 - t) * p1.y + t * p2.y;
        return this;
    };
    return Point2D;
}());

var SkeletonImage = /** @class */ (function () {
    /**
     * @param source The source image in binary
     * @param uncolored The pixel value of source that will be considered as uncolored. Usually 0, but can be 1.
     * @param max_iter Maximum iteration for the skeletonizing algorithm.
     * @param distance_image The distance image from which the skeleton will be computed
     */
    function SkeletonImage(source, uncolored, max_iter, distance_image) {
        this.width = source.width;
        this.height = source.height;
        this.data = new Array(this.width * this.height);
        for (var k = 0; k < this.width * this.height; k++) {
            if (source.data[k] !== uncolored) {
                this.data[k] = 1;
            }
            else {
                this.data[k] = 0;
            }
        }
        var maxDist = 0;
        for (var x = 0; x < distance_image.width * distance_image.height; x++) {
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
    SkeletonImage.prototype.getIndex = function (x, y) {
        return y * this.width + x;
    };
    SkeletonImage.prototype.getXFromIndex = function (idx) {
        return idx % this.width;
    };
    SkeletonImage.prototype.getYFromIndex = function (idx) {
        return Math.floor(idx / this.width);
    };
    /**
     * @param bgColor The background color, default to white if undefined or null.
     * @param skelColor The skeleton color, default to red if undefined or null.
     * @return An ImageData on which the skeleton is drawn according to required colors.
     */
    SkeletonImage.prototype.getImageData = function (bgColor, skelColor) {
        var res = new ImageData(this.width, this.height);
        var bg_c = bgColor ? bgColor : [255, 255, 255, 255];
        var skel_c = skelColor ? skelColor : [255, 0, 0, 255];
        for (var y = 0, i = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                var index = y * this.width + x;
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
    };
    // Set all bit of border pixels to 0
    SkeletonImage.prototype.cleanBorderPixels = function () {
        for (var i = 0; i < this.width; i++) {
            this.data[i] = 0;
            this.data[(this.height - 1) * this.width + i] = 0;
        }
        for (var j = 1; j < this.height - 2; j++) {
            this.data[j * this.width] = 0;
            this.data[j * this.width + (this.width - 1)] = 0;
        }
    };
    SkeletonImage.prototype.thin = function () {
        var index = this.width - 2;
        for (var i = 1; i < this.height - 1; i++) {
            index += 2;
            for (var j = 1; j < this.width - 1; j++) {
                index++;
                if ((this.data[index] & 1) === 0)
                    continue;
                var voisins = this.getCurrentNeighborhood(index);
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
    };
    /**
     * Skeleton's extraction algorithm based on U. Eckhardt and G. Maderlechner, Invariant Thinning, 1993.
     *
     * @author Adeline Pihuit 21/01/09
     */
    SkeletonImage.prototype.skeletonizeEckhardtMaderlechner93 = function (maxIter, distance_image, threshold) {
        var size = this.width * this.height;
        var flag = new Array(size); // interior (2) or boundary (1) pixel
        var flagSN = new Array(size); // nb strong neighbors
        var flagN = new Array(size); // nb neighbors
        var flagIBP = new Array(size); // Inner Boundary Pixel
        var flagPIBP = new Array(size); // Perfect Inner Boundary Pixel
        var flagSBP = new Array(size); // Simple Boundary Pixel
        var flagEnd = new Array(size); // Resulting image
        var flagDbg = new Array(size); // Temporary image: color pixel
        var found = true;
        var iter = 0;
        var inf = this.width + 1;
        var sup = size - this.width - 1;
        while (found && iter < maxIter) {
            found = false;
            // First test: Interior/Boundary/Background
            var tabBoundaryPixel = [];
            for (var k = inf; k < sup; k++) {
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
                        tabBoundaryPixel.push(k);
                    }
                }
                else {
                    flag[k] = 0;
                }
            } // end for
            // 2nd test: IBP
            // Inner Boundary Pixel = boundary pixel (1) having an interior pixel (2) as strong neighbor
            for (var k = inf; k < sup; k++) {
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
            // 3rd test: SBP
            // Simple Boundary Pixel = boundary pixel with exactly one strong connected component in its neighborhood and this component is strongly connected to itself
            var tabSBP = [];
            for (var k = inf; k < sup; ++k) {
                if (this.data[k] && flag[k] === 1) {
                    var p0 = (this.data[k + 1] & 1) !== 0 ? 1 : 0;
                    var p1 = (this.data[k - this.width + 1] & 1) !== 0 ? 1 : 0;
                    var p2 = (this.data[k - this.width] & 1) !== 0 ? 1 : 0;
                    var p3 = (this.data[k - this.width - 1] & 1) !== 0 ? 1 : 0;
                    var p4 = (this.data[k - 1] & 1) !== 0 ? 1 : 0;
                    var p5 = (this.data[k + this.width - 1] & 1) !== 0 ? 1 : 0;
                    var p6 = (this.data[k + this.width] & 1) !== 0 ? 1 : 0;
                    var p7 = (this.data[k + this.width + 1] & 1) !== 0 ? 1 : 0;
                    var trans = (1 - p0) * p1 +
                        (1 - p1) * p2 +
                        (1 - p2) * p3 +
                        (1 - p3) * p4 +
                        (1 - p4) * p5 +
                        (1 - p5) * p6 +
                        (1 - p6) * p7 +
                        (1 - p7) * p0;
                    var b = p0 + p1 + p2 + p3 + p4 + p5 + p6 + p7;
                    var d = trans === 1 || (trans === 0 && b === 8);
                    flagSBP[k] = (flag[k] === 1 && d && (p0 || p2 || p4 || p6)) === 1;
                }
                else {
                    flagSBP[k] = false;
                }
                if (flagSBP[k]) {
                    flagDbg[k] = 4;
                    tabSBP.push(k);
                }
            } // end for
            // 4th test: PIBP
            // Perfect Inner Boundary Pixel = inner boundary pixel whose pixel ptrSkel = (strong neighbor + 4) --> off()
            var tabPIBP = [];
            for (var k = inf; k < sup; ++k) {
                if (this.data[k]) {
                    var b0 = flag[k + 1] === 2 && !this.data[k - 1];
                    var b1 = flag[k - 1] === 2 && !this.data[k + 1];
                    var b2 = flag[k + this.width] === 2 && !this.data[k - this.width];
                    var b3 = flag[k - this.width] === 2 && !this.data[k + this.width];
                    flagPIBP[k] = flagIBP[k] && (b0 || b1 || b2 || b3);
                }
                else {
                    flagPIBP[k] = false;
                }
                if (flagPIBP[k]) {
                    flagDbg[k] = 5;
                    tabPIBP.push(k);
                }
            } // end for
            // pixels to remove
            for (var k = 0; k < size; ++k) {
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
            for (var i = 0; i < flagEnd.length; i++) {
                this.data[i] = flagEnd[i];
            }
            ++iter;
        } // end while
    };
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
    SkeletonImage.prototype.getCurrentNeighborhood = function (indexPixel) {
        var tab = this.data;
        // encode the neighborhood of the pixel
        return (((tab[indexPixel - 1] & 1) << 7) |
            ((tab[indexPixel + 1] & 1) << 3) |
            ((tab[indexPixel + this.width] & 1) << 5) |
            ((tab[indexPixel - this.width] & 1) << 1) |
            (tab[indexPixel - (this.width + 1)] & 1) |
            ((tab[indexPixel - (this.width - 1)] & 1) << 2) |
            ((tab[indexPixel + (this.width - 1)] & 1) << 6) |
            ((tab[indexPixel + (this.width + 1)] & 1) << 4));
    };
    /**
     * @param neighbors
     * @return number of neighbors
     */
    SkeletonImage.prototype.nbNeighbours = function (neighbors) {
        return ((neighbors & 1) +
            ((neighbors >> 1) & 1) +
            ((neighbors >> 2) & 1) +
            ((neighbors >> 3) & 1) +
            ((neighbors >> 4) & 1) +
            ((neighbors >> 5) & 1) +
            ((neighbors >> 6) & 1) +
            ((neighbors >> 7) & 1));
    };
    SkeletonImage.prototype.getNbStrongNeighbors = function (tab, valeurPix) {
        return tab[valeurPix - 1] + tab[valeurPix + 1] + tab[valeurPix - this.width] + tab[valeurPix + this.width];
    };
    SkeletonImage.prototype.getNbNoStrongNeighbors = function (tab, valeurPix) {
        return (tab[valeurPix - 1 - this.width] +
            tab[valeurPix - 1 + this.width] +
            tab[valeurPix + 1 - this.width] +
            tab[valeurPix + 1 + this.width]);
    };
    SkeletonImage.prototype.isInnerBoundaryPixel = function (tab, valeurPix) {
        return (tab[valeurPix] === 1 &&
            (tab[valeurPix - 1] === 2 ||
                tab[valeurPix + 1] === 2 ||
                tab[valeurPix - this.width] === 2 ||
                tab[valeurPix + this.width] === 2));
    };
    SkeletonImage.prototype.isSimpleBoundaryPixel = function (tab, valeurPix) {
        var p0 = (tab[valeurPix + 1] & 1) !== 0 ? 1 : 0;
        var p1 = (tab[valeurPix - this.width + 1] & 1) !== 0 ? 1 : 0;
        var p2 = (tab[valeurPix - this.width] & 1) !== 0 ? 1 : 0;
        var p3 = (tab[valeurPix - this.width - 1] & 1) !== 0 ? 1 : 0;
        var p4 = (tab[valeurPix - 1] & 1) !== 0 ? 1 : 0;
        var p5 = (tab[valeurPix + this.width - 1] & 1) !== 0 ? 1 : 0;
        var p6 = (tab[valeurPix + this.width] & 1) !== 0 ? 1 : 0;
        var p7 = (tab[valeurPix + this.width + 1] & 1) !== 0 ? 1 : 0;
        var trans = (1 - p0) * p1 +
            (1 - p1) * p2 +
            (1 - p2) * p3 +
            (1 - p3) * p4 +
            (1 - p4) * p5 +
            (1 - p5) * p6 +
            (1 - p6) * p7 +
            (1 - p7) * p0;
        var b = p0 + p1 + p2 + p3 + p4 + p5 + p6 + p7;
        var d = trans === 1 || (trans === 0 && b === 8);
        return (d && (p0 || p2 || p4 || p6)) === 1;
    };
    return SkeletonImage;
}());

/**
 * Main class for a skeleton node in an image.
 * Must be unique for each pixel.
 */
var SkeletonNode = /** @class */ (function () {
    function SkeletonNode(position, weight) {
        this.position = position;
        this.weight = weight;
        this.neighbors = new Map();
    }
    /**
     * Compute the key of a node in neighbors maps, given its x,y positions.
     */
    SkeletonNode.computeKey = function (x, y) {
        return Math.floor(x) + ";" + Math.floor(y);
    };
    /**
     * Return x,y in an array of 2 elements
     */
    SkeletonNode.getXYFromKey = function (key) {
        var res = key.split(";");
        return [parseInt(res[0]), parseInt(res[1])];
    };
    // Getters
    SkeletonNode.prototype.getKey = function () {
        return SkeletonNode.computeKey(this.position.x, this.position.y);
    };
    SkeletonNode.prototype.getPosition = function () {
        return this.position;
    };
    SkeletonNode.prototype.getWeight = function () {
        return this.weight;
    };
    SkeletonNode.prototype.getNeighbors = function () {
        return this.neighbors;
    };
    // Setters
    SkeletonNode.prototype.setPosition = function (position) {
        this.position = position;
    };
    SkeletonNode.prototype.setWeight = function (weight) {
        this.weight = weight;
    };
    SkeletonNode.prototype.setNeighbors = function (neighbors) {
        this.neighbors = neighbors;
    };
    SkeletonNode.prototype.addNeighbor = function (n) {
        this.neighbors.set(n.getKey(), n);
        n.neighbors.set(this.getKey(), this);
    };
    SkeletonNode.prototype.removeNeighbor = function (n) {
        this.neighbors.delete(n.getKey());
        n.neighbors.delete(this.getKey());
    };
    SkeletonNode.prototype.hasNeighbor = function (n) {
        return this.neighbors.has(n.getKey());
    };
    return SkeletonNode;
}());

var Vector2D = /** @class */ (function () {
    function Vector2D(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }
    Vector2D.prototype.length = function () {
        var x = this.x;
        var y = this.y;
        return Math.sqrt(x * x + y * y);
    };
    Vector2D.prototype.subPoints = function (p1, p2) {
        this.x = p1.x - p2.x;
        this.y = p1.y - p2.y;
        return this;
    };
    Vector2D.prototype.angle = function () {
        // computes the angle in radians with respect to the positive x-axis
        var angle = Math.atan2(this.y, this.x);
        if (angle < 0)
            angle += 2 * Math.PI;
        return angle;
    };
    return Vector2D;
}());

var Skeletonizer = /** @class */ (function () {
    function Skeletonizer(skel_img, dist_img) {
        this.skelImg = skel_img;
        this.distImg = dist_img;
    }
    Skeletonizer.prototype.buildHierarchy = function (params) {
        if (params === void 0) { params = {}; }
        // Default parameters
        params.angle = params.angle || Math.PI / 13;
        params.weightFactor = params.weightFactor || 1.25;
        var size = this.skelImg.width * this.skelImg.height;
        var nodes = {};
        var roots = [];
        var k = this._findNextPixelWithNeighbors(0);
        while (k < size) {
            var x = this.skelImg.getXFromIndex(k);
            var y = this.skelImg.getYFromIndex(k);
            var key = SkeletonNode.computeKey(x + 0.5, y + 0.5);
            if (nodes[key] === undefined) {
                nodes[key] = new SkeletonNode(new Point2D(x + 0.5, y + 0.5), this.distImg.data[k] / this.distImg.getCoeff());
                roots.push(nodes[key]);
                this._recHierarchy(nodes[key], nodes);
            }
            k = this._findNextPixelWithNeighbors(k + 1);
        }
        return this._simplifyHierarchy(roots, params.angle, params.weightFactor);
    };
    Skeletonizer.prototype._simplifyHierarchy = function (roots, angle, weight_factor) {
        if (weight_factor < 1.0) {
            throw new Error("weight_factor must be greater than 1 as it compares weight_max and weight_factor*weight_min");
        }
        var processBranch = function (root, next) {
            var tmpv2 = new Vector2D();
            var curr = next;
            var dir = new Vector2D();
            var curr_size = curr.getNeighbors().size;
            var angle_ok = true;
            var weight_ok = true;
            var suspect = null;
            var count = 0;
            var processed = {};
            processed[root.getKey()] = true;
            while (curr_size === 2 && angle_ok && weight_ok && !processed[curr.getKey()]) {
                var it = curr.getNeighbors().keys();
                suspect = curr;
                curr = curr.getNeighbors().get(it.next().value);
                if (curr === root) {
                    curr = suspect.getNeighbors().get(it.next().value);
                }
                var discard__n = 3;
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
                var a = tmpv2.angle() - dir.angle();
                if (!(Math.abs(a) < angle || count < discard__n)) {
                    angle_ok = false;
                }
                if (count >= discard__n) {
                    var w_ratio = root.getWeight() / curr.getWeight();
                    if (w_ratio < 1) {
                        w_ratio = 1 / w_ratio;
                    }
                    if (w_ratio > weight_factor) {
                        weight_ok = false;
                    }
                }
                if (angle_ok && weight_ok) {
                    root.removeNeighbor(suspect);
                    curr.removeNeighbor(suspect);
                    root.addNeighbor(curr);
                }
                processed[suspect.getKey()] = true;
                curr_size = curr.getNeighbors().size;
            }
            if (!processed[curr.getKey()]) {
                if (curr_size === 1) {
                    if (!angle_ok || !weight_ok) {
                        if (suspect) {
                            suspect.removeNeighbor(curr);
                        }
                    }
                    if (count === 0) {
                        root.removeNeighbor(curr);
                    }
                    processed[curr.getKey()] = true;
                }
                else if (curr_size === 2) {
                    processBranch(suspect, curr);
                    processed[suspect.getKey()] = true;
                }
                else {
                    var nexts_1 = [];
                    curr.getNeighbors().forEach(function (value) {
                        if (value !== suspect && value !== root) {
                            nexts_1.push(value);
                        }
                    });
                    if (suspect) {
                        root.removeNeighbor(suspect);
                        curr.removeNeighbor(suspect);
                        root.addNeighbor(curr);
                    }
                    processed[curr.getKey()] = true;
                    var neighbors2_1 = new Map();
                    for (var i = 0; i < nexts_1.length; ++i) {
                        for (var j = i + 1; j < nexts_1.length; ++j) {
                            nexts_1[i].removeNeighbor(nexts_1[j]);
                        }
                        nexts_1[i].getNeighbors().forEach(function (value, key) {
                            neighbors2_1.set(key, value);
                        });
                    }
                    neighbors2_1.delete(curr.getKey());
                    neighbors2_1.forEach(function (n) {
                        var count = 0;
                        for (var i = 0; i < nexts_1.length; ++i) {
                            if (n.hasNeighbor(nexts_1[i])) {
                                count++;
                            }
                        }
                        if (count > 1) {
                            for (var i = 0; i < nexts_1.length; ++i) {
                                if (n.hasNeighbor(nexts_1[i])) {
                                    tmpv2.subPoints(n.getPosition(), nexts_1[i].getPosition());
                                    if (tmpv2.length() > 1) {
                                        n.removeNeighbor(nexts_1[i]);
                                    }
                                }
                            }
                        }
                    });
                    for (var i = 0; i < nexts_1.length; ++i) {
                        processBranch(curr, nexts_1[i]);
                    }
                }
            }
        };
        for (var i = 0; i < roots.length; ++i) {
            var root = roots[i];
            var sent = null;
            if (root.getNeighbors().size > 1) {
                sent = new SkeletonNode(new Point2D(root.getPosition().x, root.getPosition().y - 1), root.getWeight());
                root.addNeighbor(sent);
                roots[i] = sent;
                root = sent;
            }
            var processed = {};
            processed[root.getKey()] = true;
            var next = root.getNeighbors().get(root.getNeighbors().keys().next().value);
            processBranch(root, next);
        }
        return roots;
    };
    Skeletonizer.prototype._findNextPixelWithNeighbors = function (start) {
        var size = this.skelImg.width * this.skelImg.height;
        var k = start;
        for (k = start; k < size; k++) {
            if (this.skelImg.data[k] & 1) {
                if (this.skelImg.getCurrentNeighborhood(k) === 0) {
                    this.skelImg.data[k] = 0; // Single skeleton pixels are wiped out.
                }
                else {
                    break;
                }
            }
        }
        return k;
    };
    Skeletonizer.prototype._checkAndCreate = function (x, y, node, nodes) {
        var key = SkeletonNode.computeKey(x + 0.5, y + 0.5);
        var created = false;
        if (nodes[key] === undefined) {
            nodes[key] = new SkeletonNode(new Point2D(x + 0.5, y + 0.5), this.distImg.getValue(x, y) / this.distImg.getCoeff());
            created = true;
        }
        node.neighbors.set(key, nodes[key]);
        return created;
    };
    Skeletonizer.prototype._addNeighbors = function (node, neighbors, nodes) {
        var x = Math.floor(node.position.x);
        var y = Math.floor(node.position.y);
        var newElement = 0;
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
    };
    Skeletonizer.prototype._recHierarchy = function (node, nodes) {
        var neighbors = this.skelImg.getCurrentNeighborhood(this.skelImg.getIndex(Math.floor(node.position.x), Math.floor(node.position.y)));
        var newElement = this._addNeighbors(node, neighbors, nodes);
        if (newElement) {
            for (var _i = 0, _a = node.getNeighbors(); _i < _a.length; _i++) {
                var _b = _a[_i], valeur = _b[1];
                this._recHierarchy(valeur, nodes);
            }
        }
    };
    return Skeletonizer;
}());

// This function is just computing the distance to a capsule
// Useful to know exactly which part of the image is already covered
var capsuleDistance = (function () {
    var unit_dir = new Vector2D();
    var v = new Vector2D();
    var proj = new Point2D(0, 0);
    return function (p1, p2, r1, r2, p) {
        unit_dir.x = p2.x - p1.x;
        unit_dir.y = p2.y - p1.y;
        var length = unit_dir.length();
        unit_dir.x = unit_dir.x / length;
        unit_dir.y = unit_dir.y / length;
        v.subPoints(p, p1);
        var p1p_l = v.length();
        var p1p_sqrl = p1p_l * p1p_l;
        // In unit_dir basis, vector (this.r1-this.r2, this.length) is normal to the "weight line"
        // We need a projection in this direction up to the segment line to know in which case we fall.
        var x_p_2D = v.x * unit_dir.x + v.y * unit_dir.y;
        // Pythagorean theorem
        var y_p_2D = Math.sqrt(Math.max(0.0, p1p_sqrl - x_p_2D * x_p_2D // = y_p_2D² by Pythagorean theorem
        ));
        var t = -y_p_2D / length;
        var proj_x = x_p_2D + t * (r1 - r2);
        // const proj_y = 0.0; // by construction
        // Easy way to compute the distance now that we have the projection on the segment
        var a = proj_x / length;
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
        var l = v.length();
        return l - (a * r2 + (1.0 - a) * r1);
    };
})();

/**
 *  An experimental skeletonizer which starts from extremities and adds nodes by growing from there.
 *  Still not good enough.
 */
var QuiblierSkeletonizer = /** @class */ (function () {
    function QuiblierSkeletonizer(dist_img) {
        this.distImg = dist_img;
    }
    QuiblierSkeletonizer.prototype.buildHierarchy = function () {
        var self = this;
        var width = this.distImg.width;
        var height = this.distImg.height;
        var size = width * height;
        // Keep track of all candidates to be the next point added.
        // They are mapped to the node that actually added them as a candidate (for linking)
        var candidates = {};
        // Accepted error in pixels
        var threshold = 3;
        var nodes_set = {};
        var nodes = [];
        var covered = new Array(size).fill(false);
        // Add the zone covered by node and update the candidate list
        var addCover = function (node, father, candidates) {
            var cx = node.position.x;
            var cy = node.position.y;
            var pw = node.getPosition();
            var nw = Math.ceil(node.weight);
            var fw = father ? Math.ceil(father.getWeight()) : 0;
            var fp = father ? father.getPosition() : null;
            var p = new Point2D(0, 0);
            var zone = {
                min: {
                    x: father ? Math.min(pw.x - nw, fp.x - fw) : pw.x - nw,
                    y: father ? Math.min(pw.y - nw, fp.y - fw) : pw.y - nw
                },
                max: {
                    x: father ? Math.max(pw.x + nw, fp.x + fw) : pw.x + nw,
                    y: father ? Math.max(pw.y + nw, fp.y + fw) : pw.y + nw
                }
            };
            for (var x = zone.min.x; x < zone.max.x; x++) {
                for (var y = zone.min.y; y < zone.max.y; y++) {
                    p.x = x;
                    p.y = y;
                    var dist_sq = father ?
                        capsuleDistance(node.getPosition(), father.getPosition(), nw, Math.ceil(father.weight), p) :
                        (x - cx) * (x - cx) + (y - cy) * (y - cy);
                    var condition = father ? dist_sq <= 0 : dist_sq <= nw * nw;
                    if (condition) {
                        var idx = y * width + x;
                        covered[idx] = true;
                        delete candidates[idx];
                    }
                }
            }
            // fill in new candidates
            var circumf = Math.PI * 2 * (node.weight + 1);
            var l = Math.round(circumf);
            for (var i = 0; i < l; ++i) {
                var angle = i * 2 * Math.PI / l;
                var x = Math.round(node.position.x + Math.cos(angle) * (node.weight + 1));
                var y = Math.round(node.position.y + Math.sin(angle) * (node.weight + 1));
                var idx = y * width + x;
                var v = self.distImg.getValue(x, y) / self.distImg.getCoeff();
                if (!covered[idx] && v > threshold) {
                    candidates[idx] = node;
                }
            }
        };
        // find the point with highest distance
        var max = 0;
        var max_x = -1;
        var max_y = -1;
        for (var x = 0; x < width; ++x) {
            for (var y = 0; y < height; ++y) {
                var v = this.distImg.getValue(x, y);
                if (v > max) {
                    max = v;
                    max_x = x;
                    max_y = y;
                }
            }
        }
        var first_node = new SkeletonNode(new Point2D(max_x, max_y), max / this.distImg.getCoeff());
        nodes_set[this.distImg.getIndex(max_x, max_y)] = first_node;
        nodes.push(first_node);
        addCover(first_node, null, candidates);
        var counter = 0;
        var ck = Object.keys(candidates);
        var _loop_1 = function () {
            var max_i = -1;
            var max_v = 0;
            for (var i = 0; i < ck.length; ++i) {
                var idx = parseInt(ck[i]);
                if (covered[idx]) {
                    delete candidates[idx];
                }
                else if (this_1.distImg.getIndexValue(idx) > max_v) {
                    max_v = this_1.distImg.getIndexValue(idx);
                    max_i = idx;
                }
            }
            max_v = max_v / this_1.distImg.getCoeff();
            var max_point = new Point2D(this_1.distImg.getXFromIndex(max_i), this_1.distImg.getYFromIndex(max_i));
            var father = candidates[max_i];
            var best_c = {
                v: max_v,
                p: new Point2D(max_point.x, max_point.y),
                idx: max_i
            };
            // Checking along the segment if there is a better point
            // Here we check if there is not a better-suited candidate along the line from max_i pixel to its father
            // A better candidate would be a point which would cover "almost" the same surface but be closer to the father.
            var checkCandidateBestFit = function () {
                var dist = father.getPosition().distanceTo(max_point);
                var p = new Point2D(0, 0);
                for (var t = 1; t < dist; t += 1.0) { // 1 pixel step
                    // Barycentre de 2 points ?
                    var ratio = t / dist;
                    p.barycenter(max_point, father.getPosition(), 1 - ratio, ratio);
                    p.x = Math.round(p.x);
                    p.y = Math.round(p.y);
                    var v = self.distImg.getValue(p.x, p.y) / self.distImg.getCoeff();
                    var diff = t + max_v - v;
                    // I guess the expected v in a capsule at p is the linear variation of the values but not sure about that. TODO: check
                    var expected_v = (1 - ratio) * max_v + ratio * father.weight;
                    if (diff < 1 // Could have used threshold instead of 1 pixel, but it seemed intuitively that it could reduce the result quality
                        && v > expected_v) { // we found a better candidate.
                        best_c.v = v;
                        best_c.p.x = p.x;
                        best_c.p.y = p.y;
                        best_c.idx = self.distImg.getIndex(p.x, p.y);
                    }
                }
            };
            // Split the segment and check if the point is threshold-far from the highest distance in its neighborhood.
            var checkCandidateMid = function () {
                var dist = father.getPosition().distanceTo(max_point);
                var mid = new Point2D(0, 0);
                mid.barycenter(max_point, father.getPosition(), 0.5, 0.5);
                mid.x = Math.round(mid.x);
                mid.y = Math.round(mid.y);
                var v = self.distImg.getValue(mid.x, mid.y) / self.distImg.getCoeff();
                var p = new Point2D(0, 0);
                var dir = new Point2D(max_point.x - father.getPosition().x, max_point.y - father.getPosition().y);
                dir.x /= dist;
                dir.y /= dist;
                var ort_dir = new Point2D(-dir.y, dir.x);
                var best_neigh = {
                    v: v,
                    p: new Point2D(mid.x, mid.y),
                    idx: max_i
                };
                var limit = Math.max(father.getWeight() / 2, threshold); // don't look too far
                for (var t = -limit; t <= limit; t++) {
                    p.x = Math.round(mid.x + t * ort_dir.x);
                    p.y = Math.round(mid.y + t * ort_dir.y);
                    var cv = self.distImg.getValue(p.x, p.y) / self.distImg.getCoeff();
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
            var new_node = new SkeletonNode(best_c.p, best_c.v);
            new_node.neighbors.set(this_1.distImg.getIndex(father.position.x, father.position.y), father);
            father.neighbors.set(this_1.distImg.getIndex(new_node.position.x, new_node.position.y), new_node);
            nodes_set[best_c.idx] = new_node;
            nodes.push(new_node);
            delete candidates[max_i]; // should we really?
            delete candidates[best_c.idx]; // should be undefined anyway since it was picked in the influence of the father node
            addCover(new_node, father, candidates);
            ck = Object.keys(candidates);
            counter++;
        };
        var this_1 = this;
        while (ck.length !== 0 && counter < 10000) {
            _loop_1();
        }
        return nodes;
    };
    return QuiblierSkeletonizer;
}());

var skeletonize = function (img_data, angle, weight_factor) {
    var binary_img = new BinaryImage(img_data);
    var dist_img = new IntDistanceImage(3, 4, binary_img, 0);
    var skel_img = new SkeletonImage(binary_img, 0, 2000, dist_img);
    var skeletonizer = new Skeletonizer(skel_img, dist_img);
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
var skeletonizeQ = function (img_data) {
    var binary_img = new BinaryImage(img_data);
    var dist_img = new IntDistanceImage(3, 4, binary_img, 0);
    var skeletonizer = new QuiblierSkeletonizer(dist_img);
    var h = skeletonizer.buildHierarchy();
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
var drawHierarchyInImageData = function (h, img_data, mode) {
    var res = img_data;
    var capsule = mode === "capsule";
    var p = new Point2D(0, 0);
    var nodes_set = {};
    var nodes = [];
    var segs = [];
    var recFindAllNodes = function (node) {
        var k = node.getKey();
        if (nodes_set[k] === undefined) {
            nodes_set[k] = node;
            nodes.push(node);
            node.getNeighbors().forEach(function (value) {
                var vk = value.getKey();
                if (nodes_set[vk] === undefined) {
                    segs.push([node, value]);
                }
                recFindAllNodes(value);
            });
        }
    };
    for (var i = 0; i < h.length; ++i) {
        recFindAllNodes(h[i]);
    }
    for (var x = 0; x < res.width; ++x) {
        for (var y = 0; y < res.height; ++y) {
            var avg_n = 0;
            p.x = x + 0.5;
            p.y = y + 0.5;
            if (capsule) {
                for (var i = 0; i < segs.length; ++i) {
                    var n0 = segs[i][0];
                    var n1 = segs[i][1];
                    var dist = capsuleDistance(n0.getPosition(), n1.getPosition(), n0.getWeight(), n1.getWeight(), p);
                    if (dist <= 0) {
                        avg_n++;
                    }
                }
            }
            else {
                for (var i = 0; i < nodes.length; ++i) {
                    var cx = Math.floor(nodes[i].getPosition().x) + 0.5;
                    var cy = Math.floor(nodes[i].getPosition().y) + 0.5;
                    if ((p.x - cx) * (p.x - cx) + (p.y - cy) * (p.y - cy) <= nodes[i].getWeight() * nodes[i].getWeight()) {
                        avg_n++;
                    }
                }
            }
            var idx = 4 * (y * res.width + x);
            res.data[idx + 1] = (res.data[idx + 1] + avg_n * 255) / (avg_n + 1);
        }
    }
    for (var i = 0; i < nodes.length; ++i) {
        var n = nodes[i];
        var idx = 4 * (Math.floor(n.position.y) * res.width + Math.floor(n.position.x));
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
var drawSkeletonInCanvas = function (skel, cvs) {
    var ctx = cvs.getContext("2d");
    if (ctx === null) {
        throw "[export] drawSkeletonInCanvas: Cannot get 2d context of canvas";
    }
    var nodes_set = {};
    var nodes = [];
    var recFindAllNodes = function (node) {
        var k = node.position.x + ";" + node.position.y;
        if (nodes_set[k] === undefined) {
            nodes_set[k] = node;
            nodes.push(node);
            node.getNeighbors().forEach(function (value) {
                recFindAllNodes(value);
            });
        }
    };
    for (var i = 0; i < skel.length; ++i) {
        recFindAllNodes(skel[i]);
    }
    var _loop_1 = function (i) {
        var node = nodes[i];
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
    };
    for (var i = 0; i < nodes.length; ++i) {
        _loop_1(i);
    }
};
var exports = {
    Point2D: Point2D,
    SkeletonImage: SkeletonImage,
    Skeletonizer: Skeletonizer,
    QuiblierSkeletonizer: QuiblierSkeletonizer,
    CapsuleDistance: capsuleDistance,
    skeletonize: skeletonize,
    skeletonizeQ: skeletonizeQ,
    drawHierarchyInImageData: drawHierarchyInImageData,
    drawSkeletonInCanvas: drawSkeletonInCanvas
};

export { exports as default };
//# sourceMappingURL=image-skeletonizer.module.js.map

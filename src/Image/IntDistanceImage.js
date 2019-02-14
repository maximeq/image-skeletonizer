"use strict";

var BinaryImage = require("./BinaryImage.js");

/**
 *  Class keeping distance as an Integer array. This computes the distance to the closest border
 *  of a given shape.
 *  Actual distance approximation can be computed using this.getValue(x,y)/this.getCoeff()
 *
 *  @param {number} c1 Main distance coefficient for a pixel
 *  @param {number} c2 Diagonal distance coefficient for a pixel.
 *  @param {}
 */
var IntDistanceImage = function(c1, c2, source, uncolored){
    if(!(source instanceof BinaryImage)){
        throw "IntDistanceImage Error : source must be an instance of BinaryImage";
    }
    this.coeff = c1;
    this.width = source.width;
    this.height = source.height;
    this.data = new Array(source.width*source.height);
    this._buildDistanceImage(c1, c2, source, uncolored);
};

IntDistanceImage.prototype.constructor = IntDistanceImage;

IntDistanceImage.prototype.rebuild = function(c1, c2, source, uncolored){
  this.coeff = c1;
  this._buildDistanceImage(c1, c2, source, uncolored, this.data);
};

IntDistanceImage.prototype.getCoeff = function(){
  return this.coeff;
};

IntDistanceImage.prototype.getIndex = function(x,y){
  return y*this.width+x;
};
IntDistanceImage.prototype.getValue = function(x,y){
  return this.data[this.getIndex(x,y)];
};
IntDistanceImage.prototype.getIndexValue = function(idx){
  return this.data[idx];
};
IntDistanceImage.prototype.getXFromIndex = function(idx){
    return idx % this.width;
};
IntDistanceImage.prototype.getYFromIndex = function(idx){
  return Math.round(idx / this.width);
};


IntDistanceImage.prototype._buildDistanceImage = function(c1, c2, source, uncolored){

    const width = source.width;
    const height = source.height;

    for (let i = 0; i<width; ++i) {
        this.data[i] = 0;
    }
    for (let j = 1; j<height-1; ++j) {
        this.data[j*width] = 0;
        for (let i = 1; i<width-1; ++i) {
            let index = this.getIndex(i,j);
            this.data[index] = 0;
            let dist = 0;
            if (source.data[index] != uncolored) {
                let index_1_1 = this.getIndex(i-1, j-1);
                let index0_1 = this.getIndex(i, j-1);
                let index_11 = this.getIndex(i-1, j);
                let index1_1 = this.getIndex(i+1, j-1);

                dist = Math.min(this.data[index_1_1] + c2, this.data[index0_1] + c1);
                dist = Math.min(dist, this.data[index_11] + c1);
                dist = Math.min(dist, this.data[index1_1] + c2);
                this.data[index] = dist;
            }
        }
        this.data[this.getIndex(width-1, j)] = 0;
    }
    for (let i = 0; i<width; ++i){
        this.data[this.getIndex(i, height-1)] = 0;
    }

    for (let j = height-2; j>0; --j) {
        for (let i = width-2; i>0; --i) {
            let index = this.getIndex(i,j);
            let dist = this.data[index];
            if (source.data[index] != uncolored)
            {
                let index11 = this.getIndex(i+1, j+1);
                let index0_1 = this.getIndex(i, j+1);
                let index_11 = this.getIndex(i-1, j+1);
                let index10 = this.getIndex(i+1, j);
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
IntDistanceImage.prototype.getImageData = function (skeleton) {

    var res = new ImageData(this.width,this.height)

    let maxDist = 0;
    for (let x = 0; x < this.width*this.height; x++) {
        maxDist = (this.data[x] > maxDist) ? this.data[x] : maxDist;
    }

    for (let y = 0, i=0, rgbValue = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
            let index = (y * this.width + x);
            if (this.data[index] > 3) {
                rgbValue = 255*this.data[index]/maxDist;
                res.data[i] = rgbValue;
                res.data[i+1] = rgbValue;
                res.data[i+2] = rgbValue;
                res.data[i+3] = 255;
            } else {
                res.data[i] = 255;
                res.data[i+1] = 255;
                res.data[i+2] = 255;
                res.data[i+3] = 255;
            }
            i+=4;
        }
    }

    return res;
};

module.exports = IntDistanceImage;

"use strict";

/**
 *  Class to manipulate a "binary" image, ie the RGBA pixel data is replaced with 0 or 1 (1 for near black pixels).
 *
 *  @param {ImageData} source The orginal image to be binarized
 *  @param {number}    tolerance The difference to white above which the pixel is considered black. Default to 12.
 *                               Difference is computed by cumulating difference for each channel.
 */
var BinaryImage = function(source, tolerance){
  this.tolerance = tolerance !== undefined ? tolerance : 12;
  this.width = source.width;
  this.height = source.height;
  this.data = new Uint8Array(source.width*source.height);
  this._buildBinaryImage(source, this.tolerance);
};

BinaryImage.prototype.constructor = BinaryImage;

BinaryImage.prototype.getIndex = function(x,y){
  return y*this.width+x;
};
/**
 *  @return {number} 0 or 1
 */
BinaryImage.prototype.getValue = function(x,y){
  return this.data[this.getIndex(x,y)];
};

/**
 *  @private
 */
BinaryImage.prototype._buildBinaryImage = function(source, tolerance){
    var l = this.width*this.height;
    for(var i=0; i<l; i++){
        var idx = 4*i;
        // this.data[i] = 3*255 - (source.data[idx] + source.data[idx+1] + source.data[idx+2])  < tolerance ? 0 : 1;
        if(source.data[idx] < 125 && source.data[idx+1] < 125 && source.data[idx+2] < 125){
            this.data[i] = 1;
        }else{
            this.data[i] = 0;
        }

    }
};

module.exports = BinaryImage;

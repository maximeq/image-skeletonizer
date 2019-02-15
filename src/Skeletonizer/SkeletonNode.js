"use strict";

/**
 *  Main class for a skeleton node in an image.
 *  Must be unique for each pixel.
 *  @param {Point2D} position The position of the node. Can be anything in [x+1[ [y+1[
 */
var SkeletonNode = function(position, weight){
  this.position = position;
  this.weight = weight;
  this.neighbors = new Map();
};

/**
 *  Compute the key of a node in neighbors maps, given its x,y positions.
 */
SkeletonNode.computeKey = function(x,y){
    return Math.floor(x)+";"+Math.floor(y);
}
/**
 *  Return x,y in an array of 2 elements
 */
SkeletonNode.getXYFromKey = function(key){
    var res = key.split(";");
    res[0] = parseInt(res[0]);
    res[1] = parseInt(res[1]);
    return res;
}

SkeletonNode.prototype.constructor = SkeletonNode;

// Getters
SkeletonNode.prototype.getKey = function(){
    return this.computeKey(this.position.x,this.position.y);
}

SkeletonNode.prototype.getPosition = function(){
  return this.position;
};

SkeletonNode.prototype.getWeight = function(){
  return this.weight;
};

SkeletonNode.prototype.getNeighbors = function(){
  return this.neighbors;
};

// Setters
SkeletonNode.prototype.setPosition = function(position){
  this.position = position;
};

SkeletonNode.prototype.setWeight = function(weight){
  this.weight = weight;
};

SkeletonNode.prototype.setNeighbors = function(neighbors){
  this.neighbors = neighbors;
};



module.exports = SkeletonNode;

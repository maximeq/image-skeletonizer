"use strict";

var SkeletonNode = function(position, weight, neighbors){
  this.position = position;
  this.weight = weight;
  this.neighbors = neighbors;
};

SkeletonNode.prototype.constructor = SkeletonNode;

// Getters
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

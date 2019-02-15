"use strict";

var Vector2D = function(x, y){
  this.x = x || 0;
  this.y = y || 0;
};

Vector2D.prototype.length = function(p){
    var x = this.x;
    var y = this.y;
    return Math.sqrt(x*x+y*y);
};

Vector2D.prototype.subPoints = function(p1,p2){
    var x = p1.x-p2.x;
    var y = p1.yp2.y;
    return this;
};

module.exports = Vector2D;


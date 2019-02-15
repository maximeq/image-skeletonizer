"use strict";

var Point2D = function(x, y){
  this.x = x;
  this.y = y;
};

Point2D.prototype.distanceToOrigin = function(p){
    var x = this.x;
    var y = this.y;
    return Math.sqrt(x*x+y*y);
}


Point2D.prototype.distanceTo = function(p){
    var x = this.x-p.x;
    var y = this.y-p.y;
    return Math.sqrt(x*x+y*y);
}

Point2D.prototype.barycenter = function(p1,p2,w1,w2){
    var t = w2/(w1+w2);
    this.x = (1-t)*p1.x +t*p2.x;
    this.y = (1-t)*p1.y +t*p2.y;
    return this;
}

module.exports = Point2D;


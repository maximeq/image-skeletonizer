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
    this.x = p1.x-p2.x;
    this.y = p1.y-p2.y;
    return this;
};

Vector2D.prototype.angle = function () {
    // computes the angle in radians with respect to the positive x-axis
    var angle = Math.atan2( this.y, this.x );
    if ( angle < 0 ) angle += 2 * Math.PI;
    return angle;

};

module.exports = Vector2D;


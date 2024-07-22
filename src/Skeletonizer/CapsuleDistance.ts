"use strict";

const Vector2D = require("./Vector2D");
const Point2D = require("./Point2D");

// This function is just computing the distance to a capsule
// Usefull to know exactly which part of the image is already covered
var capsuleDistance = (function(){
    var unit_dir = new Vector2D();
    var v = new Vector2D();
    var proj = new Point2D();
    return function(p1,p2,r1,r2,p){


        var rdiff = r2 - r1;
        unit_dir.x = p2.x-p1.x;
        unit_dir.y = p2.y-p1.y;

        var length = unit_dir.length();
        unit_dir.x = unit_dir.x/length;
        unit_dir.y = unit_dir.y/length;

        v.subPoints(p,p1);

        var p1p_l = v.length();
        var p1p_sqrl = p1p_l*p1p_l;

        // In unit_dir basis, vector (this.r1-this.r2, this.length) is normal to the "weight line"
        // We need a projection in this direction up to the segment line to know in which case we fall.

        var x_p_2D = v.x*unit_dir.x + v.y*unit_dir.y;
        // pythagore inc.
        var y_p_2D = Math.sqrt(
            Math.max( // Necessary because of rounded errors, pyth result can be <0 and this causes sqrt to return NaN...
                0.0, p1p_sqrl - x_p_2D*x_p_2D // =  y_p_2D² by pythagore
            )
        );
        var t = -y_p_2D/length;

        var proj_x = x_p_2D + t*(r1 - r2);
        // var proj_y = 0.0; // by construction

        // Easy way to compute the distance now that we have the projection on the segment
        var a = proj_x/length;
        if(a>1.0){a=1.0;}
        if(a<0.0){a=0.0;}

        proj.x = p1.x;
        proj.y = p1.y;
        proj.x += ( p2.x - proj.x ) * a;// compute the actual 3D projection
        proj.y += ( p2.y - proj.y ) * a;
        proj.z += ( p2.z - proj.z ) * a;

        v.x = p.x-proj.x;
        v.y = p.y-proj.y;
        var l = v.length();

        return l - (a*r2+(1.0-a)*r1);
    };
})();


module.exports = capsuleDistance;


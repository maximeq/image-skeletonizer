"use strict";

const SkeletonNode = require("./SkeletonNode");
const Point2D = require("./Point2D");

var QuiblierSkeletonizer = function(dist_img){
    this.distImg = dist_img;
};

QuiblierSkeletonizer.prototype.constructor = QuiblierSkeletonizer;

QuiblierSkeletonizer.prototype.buildHierarchy = function(){

    const width = this.distImg.width;
    const height = this.distImg.height;
    const size = width*height;

    // Accepted error in pixels
    var threshold = 3;

    var nodes_set = {};
    var nodes = [];

    var covered = new Array(size);
    for(var i=0; i<covered.length;++i){
        covered[i] = false;
    }

    // Add the zone covered by node and update the candidate list
    var self = this;
    var addCover = function(nodeA, nodeB, candidates){

        if(nodeB === null){ // only one disk to cover
            var cx =nodeA.position.x;
            var cy = nodeA.position.y;
            var w = Math.ceil(nodeA.weight);
            for(var x=nodeA.position.x-w; x<nodeA.position.x+w; x++){
                for(var y=nodeA.position.y-w; y<nodeA.position.y+w; y++){
                    var dist_sq = (x-cx)*(x-cx)+(y-cy)*(y-cy)
                    if(dist_sq <= w*w){
                        var idx = y*width+x;
                        covered[idx] = true;
                        delete candidates[idx];
                    }
                }
            }
            // fill in new candidates
            var circumf = Math.PI*2*(nodeA.weight+1);
            var l = Math.round(circumf);
            for(var i=0; i<l; ++i){
                var angle = i*2*Math.PI/l;
                var x = Math.round(nodeA.position.x + Math.cos(angle)*(nodeA.weight+1));
                var y = Math.round(nodeA.position.y + Math.sin(angle)*(nodeA.weight+1));
                var idx = y*width+x;
                var v = self.distImg.getValue(x,y)/self.distImg.getCoeff();
                if(!covered[idx] && v > threshold){
                    candidates[idx] = true;
                }
            }
        }
    };

    // find the point with highest distance
    var max = 0;
    var max_x = -1;
    var max_y = -1;
    for(var x=0; x<width; ++x){
        for(var y=0; y<height; ++y){
            var v = this.distImg.getValue(x,y);
            if(v > max){
                max = v;
                max_x = x;
                max_y = y;
            }
        }
    }

    var first_node = new SkeletonNode(new Point2D(max_x,max_y),max/this.distImg.getCoeff());
    nodes_set[this.distImg.getIndex(max_x,max_y)] = first_node;
    nodes.push(first_node);
    var candidates = {};
    addCover(first_node, null, candidates);

    var ck = Object.keys(candidates);
    while(ck.length !== 0){
        var max_i = -1;
        var max_v = 0;
        for(var i=0; i<ck.length; ++i){
            var idx = parseInt(ck[i]);
            if(covered[idx]){
                delete candidates[ck[i]];
            }else if(this.distImg.getIndexValue(idx)>max_v){
                max_v = this.distImg.getIndexValue(idx);
                max_i = idx;
            }
        }

        var new_node = new SkeletonNode(new Point2D(this.distImg.getXFromIndex(max_i),this.distImg.getYFromIndex(max_i)),max_v/this.distImg.getCoeff());
        nodes_set[max_i] = new_node;
        nodes.push(new_node);
        delete candidates[max_i];
        addCover(new_node, null, candidates);

        ck = Object.keys(candidates);
    }

    return nodes;
};

module.exports = QuiblierSkeletonizer;


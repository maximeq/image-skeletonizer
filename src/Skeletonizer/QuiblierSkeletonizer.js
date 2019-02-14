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

    var covered = new Array(size);
    for(var i=0; i<covered.length;++i){
        covered[i] = false;
    }

    var addCover = function(node){
        var cx =node.position.x;
        var cy = node.position.y;
        var w = Math.ceil(node.weight);
        for(var x=node.position.x-w; x<node.position.x+w; x++){
            for(var y=node.position.y-w; y<node.position.y+w; y++){
                if((x-cx)*(x-cx)+(y-cy)*(y-cy) <= w*w){
                    var idx = y*width+x;
                    covered[idx] = true;
                }
            }
        }
    };

    // find the point with highes distance
    var max = 0;
    var max_x = -1;
    var max_y = -1;
    for(var x=0; x<this.distImg.width; ++x){
        for(var y=0; y<this.distImg.height; ++y){
            var v = this.distImg.getValue(x,y);
            if(v > max){
                max = v;
                max_x = x;
                max_y = y;
            }
        }
    }

    var first_node = new SkeletonNode(new Point2D(max_x,max_y),max/this.distImg.getCoeff(), new Map());
    addCover(first_node);

    var self = this;
    var exploreNode = function(node, dist_img){
        var circumf = Math.PI*2*node.weight;
        var l = Math.round(circumf);
        var values = new Array(l);
        var xs     = new Array(l);
        var ys     = new Array(l);

        // Build the countour points, 1 pixel outside the current node.
        for(var i=0; i<l; ++i){
            var angle = i*2*Math.PI/l;
            var x = Math.round(node.position.x + Math.cos(angle)*(node.weight+1));
            var y = Math.round(node.position.y + Math.sin(angle)*(node.weight+1));
            values[i] = self.distImg.getValue(x,y)/self.distImg.getCoeff();
            xs[i] = x;
            ys[i] = y;
        }

        // find the maximum on boundaries, which is not yet covered.
        var max_v = -1;
        var max_i = -1;
        for(var i=0; i<values.length; ++i){
            var idx = ys[i]*width+xs[i];
            if(!covered[idx]){
                if(values[i]>max_v){
                    max_v = values[i];
                    max_i = i;
                }
            }
        }

        if(max_v > 2){
            var new_node = new SkeletonNode(new Point2D(xs[max_i],ys[max_i]),max_v, new Map());
            node.getNeighbors().set(xs[max_i]+";"+ys[max_i], new_node);
            addCover(new_node);
            return new_node;
        }else{
            return null;
        }
    };

    var exp_n = first_node;
    var counter = 1;
    while(exp_n !== null){
        exp_n = exploreNode(exp_n);
        counter++;
    }

    return first_node;
};

/**
 *  @param {SkeletonNode} h A hierarchy built with buildHierarchy.
 */
QuiblierSkeletonizer.prototype.getHierarchyInImageData = function(h){
    var res = this.distImg.getImageData();

    var nodes = [];

    var recFindAllNodes = function(node){
        nodes.push(node);
        node.getNeighbors().forEach(function(value, key, map) {
            recFindAllNodes(value);
        });
    };
    recFindAllNodes(h);

    for(var x=0; x<res.width; ++x){
        for(var y=0; y<res.height; ++y){
            var avg_n = 0;
            for(var i=0; i<nodes.length; ++i){
                var cx = nodes[i].position.x+0.5;
                var cy = nodes[i].position.y+0.5;
                if((x+0.5-cx)*(x+0.5-cx)+(y+0.5-cy)*(y+0.5-cy) <= nodes[i].weight*nodes[i].weight){
                    avg_n++;
                }
            }
            var idx = 4*(y*res.width+x);
            res.data[idx+1] = (res.data[idx]+avg_n*255)/(avg_n+1);
        }
    }

    for(var i=0; i<nodes.length; ++i){
        var n = nodes[i];
        var idx = 4*(n.position.y*res.width+n.position.x);
        res.data[idx] = 255;
        res.data[idx+1] = 0;
        res.data[idx+2] = 0;
    }

    return res;
};

module.exports = QuiblierSkeletonizer;


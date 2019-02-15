"use strict";

const SkeletonNode = require("./SkeletonNode");
const Point2D = require("./Point2D");
const Vector2D = require("./Vector2D");

var Skeletonizer = function(skel_img, dist_img){
    this.skelImg = skel_img;
    this.distImg = dist_img;
};

Skeletonizer.prototype.constructor = Skeletonizer;

Skeletonizer.prototype.buildHierarchy = function(){

    const size = this.skelImg.width*this.skelImg.height;

    let nodes = {};
    let roots = [];
    let k = this._findNextPixelWithNeighbors(this.skelImg, this.distImg, 0);
    while(k<size){
        if(nodes[k] === undefined){
            const x = k % this.skelImg.width;
            const y = Math.round(k / this.skelImg.width);
            nodes[k] = new SkeletonNode(new Point2D(x+0.5,y+0.5),this.distImg.data[k]/this.distImg.getCoeff());
            roots.push(nodes[k]);
            this._recHierarchy(nodes[k], k, nodes);
        }
        k = this._findNextPixelWithNeighbors(k+1);
    }

    return roots;
}

Skeletonizer.prototype._simplifyHierarchy = function(root, angle, done){
    var p0 = root.position();
    if(root.getNeighbors().size() === 1){
        var it = root.getNeighbors().keys();
        var p1 = it.next().value.position();
        var dir = new Vector2D().subPoints(p1,p0);
    }
};

/**
 *  Find the next pixel with neighbors after index start.
 */
Skeletonizer.prototype._findNextPixelWithNeighbors = function(start){
    const size = this.skelImg.width * this.skelImg.height;
    let k = start;
    for (k = start; k < size ; k++){
        if (this.skelImg.data[k] & 1){
            if (this.skelImg.getCurrentNeighborhood(k) == 0){
                this.skelImg.data[k] = 0; // Single skeleton pixels are wiped out.
            } else {
                break;
            }
        }
    }
    return k;
}

Skeletonizer.prototype._addNeighbors = function(node, neighbors, k, nodes ){
    const width = this.skelImg.width;
    const x = k % width;
    const y = Math.round(k / width);
    let newElement = 0;

    if (neighbors & 1){
        if (nodes[k-width-1] === undefined){
            const node = new SkeletonNode(new Point2D(x - 1 + 0.5, (y-1) + 0.5), this.distImg.getIndexValue(k-width-1));
            nodes[k-width-1] = node;
            newElement ++;
        }
        node.neighbors.set(k-width-1, nodes[k-width-1]);
    }

    if (neighbors & 2){
        if (nodes[k-width] === undefined){
            const node = new SkeletonNode(new Point2D(x+ 0.5, (y-1) + 0.5), this.distImg.getIndexValue(k-width));
            nodes[k-width] = node;
            newElement ++;
        }
        node.neighbors.set(k-width, nodes[k-width]);

    }

    if (neighbors & 4){
        if (nodes[k-width+1] === undefined){
            const node = new SkeletonNode(new Point2D(x + 1 + 0.5, (y-1) + 0.5), this.distImg.getIndexValue(k-width + 1));
            nodes[k-width+1] = node;
            newElement ++;
        }
        node.neighbors.set(k-width+1, nodes[k-width+1]);
    }

    if (neighbors & 8){
        if (nodes[k+1] === undefined){
            const node = new SkeletonNode(new Point2D(x+1 + 0.5,y + 0.5), this.distImg.getIndexValue(k+1));
            nodes[k+1] = node;
            newElement ++;
        }
        node.neighbors.set(k+1, nodes[k+1]);
    }

    if (neighbors & 16){
        if (nodes[k+width+1] === undefined){
            const node = new SkeletonNode(new Point2D(x + 1 + 0.5, y + 1 + 0.5), this.distImg.getIndexValue(k+width + 1));
            nodes[k+width+1] = node;
            newElement ++;
        }
        node.neighbors.set(k+width+1, nodes[k+width+1]);
    }

    if (neighbors & 32){
        if (nodes[k+width] === undefined){
            const node = new SkeletonNode(new Point2D(x+ 0.5, (y+1) + 0.5), this.distImg.getIndexValue(k+width));
            nodes[k+width] = node;
            newElement ++;
        }
        node.neighbors.set(k+width, nodes[k+width]);
    }

    if (neighbors & 64){
        if (nodes[k+width-1] === undefined){
            const node = new SkeletonNode(new Point2D(x - 1+ 0.5, (y+1) + 0.5), this.distImg.getIndexValue(k+width - 1));
            nodes[k+width-1] = node;
            newElement ++;
        }
        node.neighbors.set(k+width-1, nodes[k+width-1]);
    }

    if (neighbors & 128){
        if (nodes[k-1] === undefined){
            const node = new SkeletonNode(new Point2D(x - 1+ 0.5, y + 0.5), this.distImg.getIndexValue(k-1));
            nodes[k-1] = node;
            newElement ++;
        }
        node.neighbors.set(k-1, nodes[k-1]);
    }

    return newElement;
}

Skeletonizer.prototype._recHierarchy = function(node, k, nodes){
    const neighbors = this.skelImg.getCurrentNeighborhood(k);
    const newElement = this._addNeighbors(node, neighbors, k, nodes );
    if (newElement){
        for (let [cle, valeur] of node.getNeighbors()){
            this._recHierarchy(valeur, cle, nodes);
        }
    }
}

module.exports = Skeletonizer;


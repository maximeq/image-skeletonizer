"use strict";

const SkeletonNode = require("./SkeletonNode");
const Point2D = require("./Point2D");

var Skeletonizer = function(skel_img, dist_img){
    this.skelImg = skel_img;
    this.distImg = dist_img;
};

Skeletonizer.prototype.constructor = Skeletonizer;

Skeletonizer.prototype.buildHierarchy = function(){

    const size = this.skelImg.width*this.skelImg.height;

    let tab_node = new Array(size);
    let first_node;
    let k = this._findFirstPixelWithNeighbors(this.skelImg, this.distImg, tab_node);
    if (k < size){
        const x = k % this.skelImg.width;
        const y = Math.round(k / this.skelImg.width);
        first_node = new SkeletonNode(new Point2D(x+0.5,y+0.5),this.distImg.data[k], new Map() );
        tab_node[k] = first_node;
        this._recHierarchy(first_node, k, this.skelImg, this.distImg, tab_node);
    }

    console.log(first_node);

    return first_node;
}

Skeletonizer.prototype._findFirstPixelWithNeighbors = function(skel_img, distance_image, tab_node){
    const size = skel_img.width * skel_img.height;
    let k;
    for (k=0; k < size ; k++){
        if (skel_img.data[k] & 1){
            if (skel_img.getCurrentNeighborhood(skel_img.data,k) == 0){
                skel_img.data[k] = 0;
            } else {
                break;
            }
        }
    }
    return k;
}

Skeletonizer.prototype._addNeighbors = function(node, neighbors, k, width, distance_image, tab_node ){
    const x = k % width;
    const y = Math.round(k / width);
    let newElement = 0;

    if (neighbors & 1){
        if (!tab_node[k-width-1]){
            const node = new SkeletonNode(new Point2D(x - 1 + 0.5, (y-1) + 0.5), distance_image[k-width-1], new Map());
            tab_node[k-width-1] = node;
            newElement ++;
        }
        node.neighbors.set(k-width-1, tab_node[k-width-1]);

    }

    if (neighbors & 2){
        if (!tab_node[k-width]){
            const node = new SkeletonNode(new Point2D(x+ 0.5, (y-1) + 0.5), distance_image[k-width], new Map());
            tab_node[k-width] = node;
            newElement ++;
        }
        node.neighbors.set(k-width, tab_node[k-width]);

    }

    if (neighbors & 4){
        if (!tab_node[k-width+1]){
            const node = new SkeletonNode(new Point2D(x + 1 + 0.5, (y-1) + 0.5), distance_image[k-width + 1], new Map());
            tab_node[k-width+1] = node;
            newElement ++;
        }
        node.neighbors.set(k-width+1, tab_node[k-width+1]);
    }

    if (neighbors & 8){
        if (!tab_node[k+1]){
            const node = new SkeletonNode(new Point2D(x+1 + 0.5,y + 0.5), distance_image[k+1], new Map());
            tab_node[k+1] = node;
            newElement ++;
        }
        node.neighbors.set(k+1, tab_node[k+1]);
    }

    if (neighbors & 16){
        if (!tab_node[k+width+1]){
            const node = new SkeletonNode(new Point2D(x + 1 + 0.5, y + 1 + 0.5), distance_image[k+width + 1], new Map());
            tab_node[k+width+1] = node;
            newElement ++;
        }
        node.neighbors.set(k+width+1, tab_node[k+width+1]);
    }

    if (neighbors & 32){
        if (!tab_node[k+width]){
            const node = new SkeletonNode(new Point2D(x+ 0.5, (y+1) + 0.5), distance_image[k+width], new Map());
            tab_node[k+width] = node;
            newElement ++;
        }
        node.neighbors.set(k+width, tab_node[k+width]);
    }

    if (neighbors & 64){
        if (!tab_node[k+width-1]){
            const node = new SkeletonNode(new Point2D(x - 1+ 0.5, (y+1) + 0.5), distance_image[k+width - 1], new Map());
            tab_node[k+width-1] = node;
            newElement ++;
        }
        node.neighbors.set(k+width-1, tab_node[k+width-1]);
    }

    if (neighbors & 128){
        if (!tab_node[k-1]){
            const node = new SkeletonNode(new Point2D(x - 1+ 0.5, y + 0.5), distance_image[k-1], new Map());
            tab_node[k-1] = node;
            newElement ++;
        }
        node.neighbors.set(k-1, tab_node[k-1]);
    }

    return newElement;
}

Skeletonizer.prototype._recHierarchy = function(node, k, skel_img, distance_image, tab_node){
    const neighbors = skel_img.getCurrentNeighborhood(skel_img.data, k);
    const newElement = this._addNeighbors(node, neighbors, k, skel_img.width, distance_image.data, tab_node );
    if (newElement){
        for (let [cle, valeur] of node.getNeighbors()){
            this._recHierarchy(valeur, cle, skel_img, distance_image, tab_node);
        }
    }
}

module.exports = Skeletonizer;


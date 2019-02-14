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

    let nodes = {};
    let roots = [];
    let k = this._findNextPixelWithNeighbors(this.skelImg, this.distImg, 0);
    while(k<size){
        if(nodes[k] === undefined){
            const x = k % this.skelImg.width;
            const y = Math.round(k / this.skelImg.width);
            nodes[k] = new SkeletonNode(new Point2D(x+0.5,y+0.5),this.distImg.data[k]/this.distImg.getCoeff());
            roots.push(nodes[k]);
            this._recHierarchy(nodes[k], k, this.skelImg, this.distImg, nodes);
        }
        k = this._findNextPixelWithNeighbors(this.skelImg, this.distImg, k+1);
    }

    return roots;
}

/**
 *  Find the next pixel with neighbors after index start.
 */
Skeletonizer.prototype._findNextPixelWithNeighbors = function(skel_img, dist_img, start){ // RQ : pourquoi en paramètre les images? Sont elles pas passées au constructeur?
    const size = skel_img.width * skel_img.height;
    let k = start;
    for (k = start; k < size ; k++){
        if (skel_img.data[k] & 1){
            if (skel_img.getCurrentNeighborhood(skel_img.data,k) == 0){ // RQ : la fonction getCurrentNeighborhood doit elle vraiment se prendre elle meme en argument? En plus en tableau de data...
                skel_img.data[k] = 0; // RQ : on change les valeurs de skel_img ?
            } else {
                break;
            }
        }
    }
    return k;
}

Skeletonizer.prototype._addNeighbors = function(node, neighbors, k, width, dist_img, nodes ){ // RQ mais corrigé : dist_img doit pas être le tableau de data
    const x = k % width;
    const y = Math.round(k / width);
    let newElement = 0;

    if (neighbors & 1){
        if (nodes[k-width-1] === undefined){
            const node = new SkeletonNode(new Point2D(x - 1 + 0.5, (y-1) + 0.5), dist_img.data[k-width-1]);
            nodes[k-width-1] = node;
            newElement ++;
        }
        node.neighbors.set(k-width-1, nodes[k-width-1]);
    }

    if (neighbors & 2){
        if (nodes[k-width] === undefined){
            const node = new SkeletonNode(new Point2D(x+ 0.5, (y-1) + 0.5), dist_img.data[k-width]);
            nodes[k-width] = node;
            newElement ++;
        }
        node.neighbors.set(k-width, nodes[k-width]);

    }

    if (neighbors & 4){
        if (nodes[k-width+1] === undefined){
            const node = new SkeletonNode(new Point2D(x + 1 + 0.5, (y-1) + 0.5), dist_img.data[k-width + 1]);
            nodes[k-width+1] = node;
            newElement ++;
        }
        node.neighbors.set(k-width+1, nodes[k-width+1]);
    }

    if (neighbors & 8){
        if (nodes[k+1] === undefined){
            const node = new SkeletonNode(new Point2D(x+1 + 0.5,y + 0.5), dist_img.data[k+1]);
            nodes[k+1] = node;
            newElement ++;
        }
        node.neighbors.set(k+1, nodes[k+1]);
    }

    if (neighbors & 16){
        if (nodes[k+width+1] === undefined){
            const node = new SkeletonNode(new Point2D(x + 1 + 0.5, y + 1 + 0.5), dist_img.data[k+width + 1]);
            nodes[k+width+1] = node;
            newElement ++;
        }
        node.neighbors.set(k+width+1, nodes[k+width+1]);
    }

    if (neighbors & 32){
        if (nodes[k+width] === undefined){
            const node = new SkeletonNode(new Point2D(x+ 0.5, (y+1) + 0.5), dist_img.data[k+width]);
            nodes[k+width] = node;
            newElement ++;
        }
        node.neighbors.set(k+width, nodes[k+width]);
    }

    if (neighbors & 64){
        if (nodes[k+width-1] === undefined){
            const node = new SkeletonNode(new Point2D(x - 1+ 0.5, (y+1) + 0.5), dist_img.data[k+width - 1]);
            nodes[k+width-1] = node;
            newElement ++;
        }
        node.neighbors.set(k+width-1, nodes[k+width-1]);
    }

    if (neighbors & 128){
        if (nodes[k-1] === undefined){
            const node = new SkeletonNode(new Point2D(x - 1+ 0.5, y + 0.5), dist_img.data[k-1]);
            nodes[k-1] = node;
            newElement ++;
        }
        node.neighbors.set(k-1, nodes[k-1]);
    }

    return newElement;
}

Skeletonizer.prototype._recHierarchy = function(node, k, skel_img, dist_img, nodes){
    const neighbors = skel_img.getCurrentNeighborhood(skel_img.data, k);
    const newElement = this._addNeighbors(node, neighbors, k, skel_img.width, dist_img, nodes );
    if (newElement){
        for (let [cle, valeur] of node.getNeighbors()){
            this._recHierarchy(valeur, cle, skel_img, dist_img, nodes);
        }
    }
}

module.exports = Skeletonizer;


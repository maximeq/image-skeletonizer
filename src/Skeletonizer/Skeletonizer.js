"use strict";

const SkeletonNode = require("./SkeletonNode");
const Point2D = require("./Point2D");
const Vector2D = require("./Vector2D");

var Skeletonizer = function(skel_img, dist_img){
    this.skelImg = skel_img;
    this.distImg = dist_img;
};

Skeletonizer.prototype.constructor = Skeletonizer;

Skeletonizer.prototype.buildHierarchy = function(params){

    var params = params || {};

    // Math.PI/13 correspond to the max angle accepting a set of 4 pixels
    // Placed as : XXX
    //                X
    params.angle = params.angle || Math.PI/13;

    const size = this.skelImg.width*this.skelImg.height;

    let nodes = {};
    let roots = [];
    let k = this._findNextPixelWithNeighbors(0);
    while(k<size){
        const x = this.skelImg.getXFromIndex(k);
        const y = this.skelImg.getYFromIndex(k);
        var key = SkeletonNode.computeKey(x+0.5,y+0.5);
        if(nodes[key] === undefined){
            nodes[key] = new SkeletonNode(new Point2D(x+0.5,y+0.5),this.distImg.data[k]/this.distImg.getCoeff());
            roots.push(nodes[key]);
            this._recHierarchy(nodes[key], nodes);
        }
        k = this._findNextPixelWithNeighbors(k+1);
    }

    return this._simplifyHierarchy(roots, params.angle);
}

/**
 *  Simplify the hierarchy based on the given angle in radian.
 *  Actually iterate through each branch and remove all pixels such that the
 *  angle with the previous line is to big.
 */
Skeletonizer.prototype._simplifyHierarchy = function(roots, angle){

    // Process a branch from its root.
    // Next is the direction in which we are looking
    var processBranch = function(root, next){

        var tmpv2 = new Vector2D();

        var curr = next;
        var dir = new Vector2D();
        var curr_size = curr.getNeighbors().size;
        var angle_ok = true;
        var suspect = null;
        var count = 0;
        while(curr_size === 2 && angle_ok && !processed[curr.getKey()]){

            var it = curr.getNeighbors().keys();

            suspect = curr;
            curr = curr.getNeighbors().get(it.next().value);
            if(curr === root){
                curr = suspect.getNeighbors().get(it.next().value);
            }

            // Update dir using the second pixel on the branch for more accuracy
            var discard__n = 3; // number of pixels to discard before actually comparing angles
            if(count < discard__n){
                dir.x += curr.getPosition().x;
                dir.y += curr.getPosition().y;
            }
            if(count === discard__n-1){
                dir.x = (dir.x - discard__n*root.getPosition().x)/discard__n;
                dir.y = (dir.y - discard__n*root.getPosition().y)/discard__n;
            }
            count++;

            tmpv2.subPoints(curr.getPosition(),root.getPosition());
            var a = tmpv2.angle()-dir.angle();
            if(Math.abs(a)<angle || count < discard__n){
                // remove suspect
                root.removeNeighbor(suspect);
                curr.removeNeighbor(suspect);
                root.addNeighbor(curr);
            }else{
                angle_ok = false;
            }
            processed[suspect.getKey()] = true;

            curr_size = curr.getNeighbors().size;
        }

        // If it's processed, that means we have reached an existing branch so we just do nothing
        if(!processed[curr.getKey()]){
            if(curr_size === 1){
                if(!angle_ok){
                    // The very last pixel is out of angle constraint.
                    // 3 choices :
                    //  - discard it
                    //  - Make an exception and keep it in the current branch
                    //  - have it create a 2 pixel branch
                    // Here we decide to discard it
                    if(suspect){
                        suspect.removeNeighbor(curr);
                    }
                }
                // Very small branch of 1 pixel, we discard it
                if(count === 0){
                    root.removeNeighbor(curr);
                }
                processed[curr.getKey()] = true;
            }else if(curr_size === 2){ // angle_ok must be false
                // Here the point has gone off the angle constraint but is still on a unique line.
                // Suspect becames the new root and we go ahead
                processBranch(suspect,curr)
                processed[suspect.getKey()] = true;
            }else{
                // here the point has more than 2 neighbors so it's a branching point.
                // We need to get all next branches
                var nexts = [];
                curr.getNeighbors().forEach(
                    function (value, key, map) {
                        if(value !== suspect && value !== root){
                            nexts.push(value);
                        }
                    }
                );
                if(!angle_ok){
                    // we discard this pixel
                    suspect.removeNeighbor(curr);
                    for(var i=0; i<nexts.length; ++i){
                        curr.removeNeighbor[nexts[i]];
                        suspect.addNeighbor[nexts[i]];
                    }
                    curr = suspect;
                }
                processed[curr.getKey()] = true;
                // We are branching so we need to disconnect all nexts nodes
                var neighbors2 = new Map(); // Second degree neighbors
                for(var i=0; i<nexts.length; ++i){
                    for(var j=i+1; j<nexts.length; ++j){
                        nexts[i].removeNeighbor(nexts[j]);
                    }
                    nexts[i].getNeighbors().forEach(function(value, key, map){
                        neighbors2.set(key,value);
                    });
                }
                neighbors2.delete(curr.getKey());
                // Also, if 2 next nodes share a neighbor, it mus be processed only by one of them.
                // The more connected will be kept.
                var vec2 = new Vector2D();
                neighbors2.forEach(function(n, key, map){
                    var count = 0;
                    for(var i=0; i<nexts.length;++i){
                        if(n.hasNeighbor(nexts[i])){
                            count++;
                        }
                    }
                    if(count>1){
                        for(var i=0; i<nexts.length;++i){
                            if(n.hasNeighbor(nexts[i])){
                                vec2.subPoints(n.getPosition(),nexts[i].getPosition());
                                if(vec2.length() > 1){
                                    n.removeNeighbor(nexts[i]);
                                }
                            }
                        }
                    }
                });
                for(var i=0; i<nexts.length; ++i){
                    processBranch(curr,nexts[i]);
                }
            }
        }
    };

    for(var i =0; i<roots.length; ++i){
        var root = roots[i];
        var processed = {};
        processed[root.getKey()] = true;
        var next = root.getNeighbors().get(root.getNeighbors().keys().next().value);

        if(root.getNeighbors().size > 1){
            throw "Hoho... Should not happen";
        }

        processBranch(root, root.getNeighbors().get(root.getNeighbors().keys().next().value));
    }

    return roots;
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

// New : use x,y instead of 1 dimensionnal index

// Private function used in _addNeighbors
// Return true if a node has been created
Skeletonizer.prototype._checkAndCreate = function(x,y, node, nodes){
    var key = SkeletonNode.computeKey(x+0.5,y+0.5);
    var created = false;
    if (nodes[key] === undefined){
        nodes[key] = new SkeletonNode(new Point2D(x+0.5, y+0.5), this.distImg.getValue(x,y)/this.distImg.getCoeff());
        created = true;
    }
    node.neighbors.set(key, nodes[key]);
    return created;
};
Skeletonizer.prototype._addNeighbors = function(node, neighbors, nodes ){
    const width = this.skelImg.width;
    const x = Math.floor(node.position.x);
    const y = Math.floor(node.position.y);
    let newElement = 0;

    if (neighbors & 1){
        newElement += this._checkAndCreate(x-1,y-1,node,nodes) ? 1 : 0;
    }

    if (neighbors & 2){
        newElement += this._checkAndCreate(x,y-1,node,nodes) ? 1 : 0;
    }

    if (neighbors & 4){
        newElement += this._checkAndCreate(x+1,y-1,node,nodes) ? 1 : 0;
    }

    if (neighbors & 8){
        newElement += this._checkAndCreate(x+1,y,node,nodes) ? 1 : 0;
    }

    if (neighbors & 16){
        newElement += this._checkAndCreate(x+1,y+1,node,nodes) ? 1 : 0;
    }

    if (neighbors & 32){
        newElement += this._checkAndCreate(x,y+1,node,nodes) ? 1 : 0;
    }

    if (neighbors & 64){
        newElement += this._checkAndCreate(x-1,y+1,node,nodes) ? 1 : 0;
    }

    if (neighbors & 128){
        newElement += this._checkAndCreate(x-1,y,node,nodes) ? 1 : 0;
    }

    return newElement;
}


Skeletonizer.prototype._addNeighborsOLD = function(node, neighbors, k, nodes ){
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

Skeletonizer.prototype._recHierarchy = function(node, nodes){
    const neighbors = this.skelImg.getCurrentNeighborhood(
        this.skelImg.getIndex(
            Math.floor(node.position.x),
            Math.floor(node.position.y),
        )
    );
    const newElement = this._addNeighbors(node, neighbors, nodes );
    if (newElement){
        for (let [cle, valeur] of node.getNeighbors()){
            this._recHierarchy(valeur, nodes);
        }
    }
}

module.exports = Skeletonizer;


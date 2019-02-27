"use strict";

const SkeletonNode = require("./SkeletonNode");
const Point2D = require("./Point2D");
const CapsuleDistance = require("./CapsuleDistance");

/**
 *  An experimental skeletonizer which start from extremae and add nodes by growing from there.
 *  Still not good enough.
 */
var QuiblierSkeletonizer = function(dist_img){
    this.distImg = dist_img;
};

QuiblierSkeletonizer.prototype.constructor = QuiblierSkeletonizer;

QuiblierSkeletonizer.prototype.buildHierarchy = function(){

    var self = this;

    const width = this.distImg.width;
    const height = this.distImg.height;
    const size = width*height;

    // Keep track of all candidates to be the next point added.
    // They are mapped to the node that actually added them as candidate (for linking)
    var candidates = {};

    // Accepted error in pixels
    var threshold = 3;

    var nodes_set = {};
    var nodes = [];

    var covered = new Array(size);
    for(var i=0; i<covered.length;++i){
        covered[i] = false;
    }

    // Add the zone covered by node and update the candidate list
    var addCover = function(node, father, candidates){
        var cx = node.position.x;
        var cy = node.position.y;
        var pw = node.getPosition();
        var nw = Math.ceil(node.weight);
        var fw = father ? Math.ceil(father.getWeight()) : 0;
        var fp = father ? father.getPosition() : null;
        var p = new Point2D(0,0);

        var zone = {
            min:{
                x: father ? Math.min(pw.x-nw,fp.x-fw) : pw.x-nw,
                y: father ? Math.min(pw.y-nw,fp.y-fw) : pw.y-nw
            },
            max:{
                x: father ? Math.max(pw.x+nw,fp.x+fw) : pw.x+nw,
                y: father ? Math.max(pw.y+nw,fp.y+fw) : pw.y+nw
            }
        };

        for(var x=zone.min.x; x<zone.max.x; x++){
            for(var y=zone.min.y; y<zone.max.y; y++){
                p.x = x;
                p.y = y;
                var dist_sq = father ?
                    CapsuleDistance(node.getPosition(), father.getPosition(), nw, Math.ceil(father.weight), p)
                    : (x-cx)*(x-cx)+(y-cy)*(y-cy);
                var condition = father ? dist_sq <=0 : dist_sq <= nw*nw;
                if(condition){
                    var idx = y*width+x;
                    covered[idx] = true;
                    delete candidates[idx];
                }
            }
        }
        // fill in new candidates
        var circumf = Math.PI*2*(node.weight+1);
        var l = Math.round(circumf);
        for(var i=0; i<l; ++i){
            var angle = i*2*Math.PI/l;
            var x = Math.round(node.position.x + Math.cos(angle)*(node.weight+1));
            var y = Math.round(node.position.y + Math.sin(angle)*(node.weight+1));
            var idx = y*width+x;
            var v = self.distImg.getValue(x,y)/self.distImg.getCoeff();
            if(!covered[idx] && v > threshold){
                candidates[idx] = node;
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
    addCover(first_node, null, candidates);

    var counter = 0;
    var ck = Object.keys(candidates);
    while(ck.length !== 0 && counter <10000){
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

        max_v = max_v / this.distImg.getCoeff();
        var max_point = new Point2D(this.distImg.getXFromIndex(max_i),this.distImg.getYFromIndex(max_i));

        var father = candidates[max_i];
        var best_c = {
            v:max_v,
            p:new Point2D(max_point.x,max_point.y),
            idx:max_i
        };

        // Checking along the segment if there is a better point
        // Here we check if there is not a better suiting candidate along the line from max_i pixel to its father
        // A better candidate would be a point which would cover "almost" the same surface but be closer to the father.
        var checkCandidateBestFit = function(){
            var dist = father.getPosition().distanceTo(max_point);
            var p = new Point2D(0,0);
            for(var t=1; t<dist; t+=1.0){ // 1 pixel step
                // Barycentre de 2 points ?
                var ratio = t/dist;
                p.barycenter(max_point, father.getPosition(), 1-ratio, ratio);
                p.x = Math.round(p.x);
                p.y = Math.round(p.y);
                var v = self.distImg.getValue(p.x,p.y)/self.distImg.getCoeff();
                var diff = t+max_v-v;
                // I guess the expected v in a capsule at p is the linear variation of the values but not sure about that. TODO : check
                var expected_v = (1-ratio)*max_v + ratio*father.weight;
                if( diff < 1 // Could have used threshold instead of 1 pix, but it seemd intuitively that it could reduce the result quality
                    && v > expected_v){ // we found a better candidate.
                    best_c.v = v;
                    best_c.p.x = p.x;
                    best_c.p.y = p.y;
                    best_c.idx = self.distImg.getIndex(p.x,p.y)
                }
            }
        };

        // Check if there is a better candidate
        // A better ccandidate is either a point on the line to the father which has a higher distance than expected
        var checkCandidateHighest = function(){
            var dist = father.getPosition().distanceTo(max_point);
            var p = new Point2D(0,0);
            for(var t=1; t<dist; t+=1.0){ // 1 pixel step
                // Barycentre de 2 points ?
                var ratio = t/dist;
                p.barycenter(max_point, father.getPosition(), 1-ratio, ratio);
                p.x = Math.round(p.x);
                p.y = Math.round(p.y);
                var v = self.distImg.getValue(p.x,p.y)/self.distImg.getCoeff();
                // I guess the expected v in a capsule at p is the linear variation of the values but not sure about that. TODO : check
                var expected_v = (1-ratio)*max_v + ratio*father.weight;
                if(v > expected_v){ // we found a better candidate.
                    best_c.v = v;
                    best_c.p.x = p.x;
                    best_c.p.y = p.y;
                    best_c.idx = self.distImg.getIndex(p.x,p.y)
                }
            }
        };

        // Split the segment and ckeck if the point is threshold-far from the highest distance in its neighborhood.
        var checkCandidateMid = function(){
            var dist = father.getPosition().distanceTo(max_point);
            var mid = new Point2D(0,0);
            mid.barycenter(max_point, father.getPosition(), 0.5, 0.5);
            mid.x = Math.round(mid.x);
            mid.y = Math.round(mid.y);
            var v = self.distImg.getValue(mid.x,mid.y)/self.distImg.getCoeff();

            var p = new Point2D(0,0);

            var dir = new Point2D(
                max_point.x-father.getPosition().x,
                max_point.y-father.getPosition().y
            );
            dir.x /= dist;
            dir.y /= dist;
            var ort_dir = new Point2D(-dir.y,dir.x);

            var best_neigh = {
                v:v,
                p:new Point2D(mid.x,mid.y),
                idx:max_i
            };

            var limit = Math.max(father.getWeight()/2, threshold); // don't look too far
            for(var t=-limit; t<=limit; t++){
                p.x = Math.round(mid.x + t*ort_dir.x);
                p.y = Math.round(mid.y + t*ort_dir.y);
                var cv = self.distImg.getValue(p.x,p.y)/self.distImg.getCoeff();
                if(cv>best_neigh.v && cv > v+threshold/2){ // we dont want to add a point it it does not help us win at least the threshold
                    best_neigh.v = cv;
                    best_neigh.p.x = p.x;
                    best_neigh.p.y = p.y;
                }
            }
            if(best_neigh.p.x !== mid.x || best_neigh.p.y !== mid.y){
                best_c.v = best_neigh.v;
                best_c.p.x = best_neigh.p.x;
                best_c.p.y = best_neigh.p.y;
                best_c.idx = self.distImg.getIndex(best_neigh.p.x,best_neigh.p.y);
                return true;
            }else{
                return false;
            }
        };

        if(!checkCandidateMid()){
            checkCandidateBestFit();
        }
        //checkCandidateHighest();

        var new_node = new SkeletonNode(best_c.p,best_c.v);
        new_node.neighbors.set(this.distImg.getIndex(father.position.x, father.position.y), father);
        father.neighbors.set(this.distImg.getIndex(new_node.position.x, new_node.position.y), new_node);

        nodes_set[best_c.idx] = new_node;
        nodes.push(new_node);
        delete candidates[max_i]; // should we really ?
        delete candidates[best_c.idx]; // should be undefined anyway since it was picked in the influence of the father node
        addCover(new_node, father, candidates);

        ck = Object.keys(candidates);
        counter++;
    }

    return nodes;
};

module.exports = QuiblierSkeletonizer;



import BinaryImage from "./Image/BinaryImage.js";
import IntDistanceImage from "./Image/IntDistanceImage.js";

import Point2D from "./Skeletonizer/Point2D.js";
import SkeletonImage from "./Skeletonizer/SkeletonImage.js";
import Skeletonizer from "./Skeletonizer/Skeletonizer.js";
import QuiblierSkeletonizer from "./Skeletonizer/QuiblierSkeletonizer.js";

import CapsuleDistance from "./Skeletonizer/CapsuleDistance.js";

let skeletonize = function(img_data, angle, weight_factor){

    var binary_img  = new BinaryImage(img_data);
    var dist_img    = new IntDistanceImage(3,4, binary_img, 0);
    var skel_img    = new SkeletonImage(binary_img, 0, 2000, dist_img);
    var skeletonizer = new Skeletonizer(skel_img, dist_img);

    return {
        skeleton  : skeletonizer.buildHierarchy({
            angle:angle ? angle : undefined,
            weightFactor:weight_factor ? weight_factor : undefined
        }),
        binaryImg : binary_img,
        distImg   : dist_img,
        skelImg   : skel_img
    };
};

/**
 *  Experimental alternative algorithm for skeletonization.
 */
let skeletonizeQ = function(img_data){

    var binary_img  = new BinaryImage(img_data);
    var dist_img    = new IntDistanceImage(3,4, binary_img, 0);
    var skeletonizer = new QuiblierSkeletonizer(dist_img);

    var h = skeletonizer.buildHierarchy();
    return {
        skeleton  : h,
        binaryImg : binary_img,
        distImg   : dist_img
    };
};

/**
 *  @param {Array.<SkeletonNode>} h A hierarchy built with buildHierarchy of a Skeletonizer.
 *  @param {ImageData} dist_img The image data in which the hiearchy must be drawn (don't forget to clone it if necessary, it will be modified)
 *  @param {string} mode Either "circle" or "capsule" to draw only the node of the graph or the entire capsule cover.
 */
let drawHierarchyInImageData = function(h, img_data, mode){
    var res = img_data;

    var capsule = mode === "capsule";

    var p = new Point2D();

    var nodes_set = {};
    var nodes = [];
    var segs = [];

    var recFindAllNodes = function(node){
        var k = node.getKey();
        if(nodes_set[k] === undefined){
            nodes_set[k] = node;
            nodes.push(node);
            node.getNeighbors().forEach(function(value, key, map) {
                var vk = value.getKey();
                if(nodes_set[vk] === undefined){
                    segs.push([node,value]);
                }
                recFindAllNodes(value);
            });
        }
    };
    for(var i=0; i<h.length; ++i){
        recFindAllNodes(h[i]);
    }

    for(var x=0; x<res.width; ++x){
        for(var y=0; y<res.height; ++y){
            var avg_n = 0;
            p.x = x+0.5;
            p.y = y+0.5;
            if(capsule){
                for(var i=0; i<segs.length; ++i){
                    var n0 = segs[i][0];
                    var n1 = segs[i][1];
                    var dist = CapsuleDistance(n0.getPosition(), n1.getPosition(), n0.getWeight(), n1.getWeight(), p)
                    if(dist<=0){
                        avg_n++;
                    }
                }
            }else{
                for(var i=0; i<nodes.length; ++i){
                    var cx = Math.floor(nodes[i].getPosition().x)+0.5;
                    var cy = Math.floor(nodes[i].getPosition().y)+0.5;
                    if((p.x-cx)*(p.x-cx)+(p.y-cy)*(p.y-cy) <= nodes[i].getWeight()*nodes[i].getWeight()){
                        avg_n++;
                    }
                }
            }
            var idx = 4*(y*res.width+x);
            res.data[idx+1] = (res.data[idx+1]+avg_n*255)/(avg_n+1);
        }
    }

    for(var i=0; i<nodes.length; ++i){
        var n = nodes[i];
        var idx = 4*(Math.floor(n.position.y)*res.width+Math.floor(n.position.x));
        res.data[idx] = 255;
        res.data[idx+1] = 0;
        res.data[idx+2] = 0;
    }

    return res;
};

/**
 *  Draw the actual skeleton by connecting points with straight lines.
 *  @param {Array.<SkeletonNode>} skel The hierarchy to draw.
 *  @param {Canvas} cvs An HTML5 Canvas. Dimensions must be the same as the image dimension on which skel was computed.
 */
let drawSkeletonInCanvas = function(skel,cvs){
    var ctx = cvs.getContext("2d");

    var nodes_set = {};
    var nodes = [];

    var recFindAllNodes = function(node){
        var k = node.position.x + ";" + node.position.y;
        if(nodes_set[k] === undefined){
            nodes_set[k] = node;
            nodes.push(node);
            node.getNeighbors().forEach(function(value, key, map) {
                recFindAllNodes(value);
            });
        }
    };
    for(var i=0; i<skel.length; ++i){
        recFindAllNodes(skel[i]);
    }

    for(var i=0; i<nodes.length; ++i){
        var node = nodes[i];
        node.getNeighbors().forEach(function(value, key, map) {
            ctx.lineWidth = 1;
            ctx.strokeStyle = "#ff0000";
            ctx.beginPath();
            ctx.moveTo(node.position.x, node.position.y);
            ctx.lineTo(value.position.x, value.position.y);
            ctx.stroke();
            ctx.fillStyle = "#0000ff";
            ctx.fillRect(node.position.x, node.position.y,1,1);
            ctx.fillRect(value.position.x, value.position.y,1,1);
        });
    }
};

export {
    Point2D,
    SkeletonImage,
    Skeletonizer,
    QuiblierSkeletonizer,
    CapsuleDistance,
    skeletonize,
    skeletonizeQ,
    drawHierarchyInImageData,
    drawSkeletonInCanvas,
}



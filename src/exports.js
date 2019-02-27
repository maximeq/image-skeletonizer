
const BinaryImage = require("./Image/BinaryImage.js");
const IntDistanceImage = require("./Image/IntDistanceImage.js");

const SkeletonImage = require("./Skeletonizer/SkeletonImage.js");
const Skeletonizer = require("./Skeletonizer/Skeletonizer.js");
const QuiblierSkeletonizer = require("./Skeletonizer/QuiblierSkeletonizer.js");

const CapsuleDistance = require("./Skeletonizer/CapsuleDistance.js");

var ImageSkeletonizer = {};

ImageSkeletonizer.BinaryImage = BinaryImage;
ImageSkeletonizer.IntDistanceImage = IntDistanceImage;
ImageSkeletonizer.SkeletonImage = SkeletonImage;
ImageSkeletonizer.Skeletonizer = Skeletonizer;

ImageSkeletonizer.skeletonize = function(img_data, angle, weight_factor){

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

ImageSkeletonizer.skeletonizeQ = function(img_data){

    var binary_img  = new BinaryImage(img_data);
    var dist_img    = new IntDistanceImage(3,4, binary_img, 0);
    var skeletonizer = new QuiblierSkeletonizer(dist_img);


    var h = skeletonizer.buildHierarchy();
    return {
        skeleton  : h.hierarchy,
        binaryImg : binary_img,
        distImg   : dist_img,
        covered   : h.covered
    };
};

/**
 *  @param {Array.<SkeletonNode>} h A hierarchy built with buildHierarchy of a Skeletonizer.
 *  @param {ImageData} dist_img The image data in which the hiearchy must be drawn (don't forget to clone it if necessary, it will be modified)
 */
ImageSkeletonizer.drawHierarchyInImageData = function(h, img_data){
    var res = img_data;

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
    for(var i=0; i<h.length; ++i){
        recFindAllNodes(h[i]);
    }

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

ImageSkeletonizer.drawCoverInImageData = function(covered,img_data){
    var res = img_data;

    for(var x=0; x<res.width; ++x){
        for(var y=0; y<res.height; ++y){
            var idx = y*res.width+x;
            if(covered[idx]){
                idx = 4*idx;
                res.data[idx+1] = (res.data[idx+1]+255)/2;
            }
        }
    }

    return res;
};

ImageSkeletonizer.drawHierarchyInCanvas = function(h,cvs){
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
    for(var i=0; i<h.length; ++i){
        recFindAllNodes(h[i]);
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

module.exports = ImageSkeletonizer;



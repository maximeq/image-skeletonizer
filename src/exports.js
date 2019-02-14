
const BinaryImage = require("./Image/BinaryImage.js");
const IntDistanceImage = require("./Image/IntDistanceImage.js");

const SkeletonImage = require("./Skeletonizer/SkeletonImage.js");
const Skeletonizer = require("./Skeletonizer/Skeletonizer.js");
const QuiblierSkeletonizer = require("./Skeletonizer/QuiblierSkeletonizer.js");

var ImageSkeletonizer = {};

ImageSkeletonizer.BinaryImage = BinaryImage;
ImageSkeletonizer.IntDistanceImage = IntDistanceImage;
ImageSkeletonizer.SkeletonImage = SkeletonImage;
ImageSkeletonizer.Skeletonizer = Skeletonizer;

ImageSkeletonizer.skeletonize = function(img_data){

    var binary_img  = new BinaryImage(img_data);
    var dist_img    = new IntDistanceImage(3,4, binary_img, 0);
    var skel_img    = new SkeletonImage(binary_img, 0, 2000, dist_img);
    var skeletonizer = new Skeletonizer(skel_img, dist_img);

    return {
        skeleton  : skeletonizer.buildHierarchy(),
        binaryImg : binary_img,
        distImg   : dist_img,
        skelImg   : skel_img
    };
};

ImageSkeletonizer.skeletonizeQ = function(img_data){

    var binary_img  = new BinaryImage(img_data);
    var dist_img    = new IntDistanceImage(3,4, binary_img, 0);
    var skeletonizer = new QuiblierSkeletonizer(dist_img);

    return {
        skelImgData  : skeletonizer.getHierarchyInImageData(skeletonizer.buildHierarchy()),
        binaryImg : binary_img,
        distImg   : dist_img
    };
};

module.exports = ImageSkeletonizer;



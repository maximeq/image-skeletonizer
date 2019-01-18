
const BinaryImage = require("./Image/BinaryImage.js");
const IntDistanceImage = require("./Image/IntDistanceImage.js");

const SkeletonImage = require("./Skeletonizer/SkeletonImage.js");
const Skeletonizer = require("./Skeletonizer/Skeletonizer.js");

var ImageSkeletonizer = {};

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

ImageSkeletonizer.displaySkeleton = function (source, canvasCtx) {
  const grey_data = new Uint8ClampedArray(source.width*source.height*4);
  let maxDist = 0;
  for (let x = 0; x < source.width*source.height; x++) {
    maxDist = (source.data[x] > maxDist) ? source.data[x] : maxDist;
  }
  for (let y = 0, i=0, rgbValue = 0; y < source.height; y++) {
    for (let x = 0; x < source.width; x++) {
      let index = (y * source.width + x);
      if (source.data[index] === 1) {
        grey_data[i] = 255;
        grey_data[i+1] = 0;
        grey_data[i+2] = 0;
        grey_data[i+3] = 255;
      } else {
          grey_data[i] = 255;
          grey_data[i+1] = 255;
          grey_data[i+2] = 255;
          grey_data[i+3] = 255;
      }
      i+=4;
    }
  }
  const res = canvasCtx.createImageData(source.width, source.height);
  res.data.set(grey_data);
  return res;
};

module.exports = ImageSkeletonizer;



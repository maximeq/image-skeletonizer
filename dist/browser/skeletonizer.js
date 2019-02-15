(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.ImageSkeletonizer = factory());
}(this, (function () { 'use strict';

  /**
   *  Class to manipulate a "binary" image, ie the RGBA pixel data is replaced with 0 or 1 (1 for near black pixels).
   *
   *  @param {ImageData} source The orginal image to be binarized
   *  @param {number}    tolerance The difference to white above which the pixel is considered black. Default to 12.
   *                               Difference is computed by cumulating difference for each channel.
   */
  var BinaryImage = function(source, tolerance){
    this.tolerance = tolerance !== undefined ? tolerance : 12;
    this.width = source.width;
    this.height = source.height;
    this.data = new Uint8Array(source.width*source.height);
    this._buildBinaryImage(source, this.tolerance);
  };

  BinaryImage.prototype.constructor = BinaryImage;

  BinaryImage.prototype.getIndex = function(x,y){
    return y*this.width+x;
  };
  /**
   *  @return {number} 0 or 1
   */
  BinaryImage.prototype.getValue = function(x,y){
    return this.data[this.getIndex(x,y)];
  };

  /**
   *  @private
   */
  BinaryImage.prototype._buildBinaryImage = function(source, tolerance){
      var l = this.width*this.height;
      for(var i=0; i<l; i++){
          var idx = 4*i;
          // this.data[i] = 3*255 - (source.data[idx] + source.data[idx+1] + source.data[idx+2])  < tolerance ? 0 : 1;
          if(source.data[idx] < 125 && source.data[idx+1] < 125 && source.data[idx+2] < 125){
              this.data[i] = 1;
          }else{
              this.data[i] = 0;
          }

      }
  };

  var BinaryImage_1 = BinaryImage;

  /**
   *  Class keeping distance as an Integer array. This computes the distance to the closest border
   *  of a given shape.
   *  Actual distance approximation can be computed using this.getValue(x,y)/this.getCoeff()
   *
   *  @param {number} c1 Main distance coefficient for a pixel
   *  @param {number} c2 Diagonal distance coefficient for a pixel.
   *  @param {}
   */
  var IntDistanceImage = function(c1, c2, source, uncolored){
      if(!(source instanceof BinaryImage_1)){
          throw "IntDistanceImage Error : source must be an instance of BinaryImage";
      }
      this.coeff = c1;
      this.width = source.width;
      this.height = source.height;
      this.data = new Array(source.width*source.height);
      this._buildDistanceImage(c1, c2, source, uncolored);
  };

  IntDistanceImage.prototype.constructor = IntDistanceImage;

  IntDistanceImage.prototype.rebuild = function(c1, c2, source, uncolored){
    this.coeff = c1;
    this._buildDistanceImage(c1, c2, source, uncolored, this.data);
  };

  IntDistanceImage.prototype.getCoeff = function(){
    return this.coeff;
  };

  IntDistanceImage.prototype.getIndex = function(x,y){
    return y*this.width+x;
  };
  IntDistanceImage.prototype.getValue = function(x,y){
    return this.data[this.getIndex(x,y)];
  };
  IntDistanceImage.prototype.getIndexValue = function(idx){
    return this.data[idx];
  };
  IntDistanceImage.prototype.getXFromIndex = function(idx){
      return idx % this.width;
  };
  IntDistanceImage.prototype.getYFromIndex = function(idx){
    return Math.round(idx / this.width);
  };


  IntDistanceImage.prototype._buildDistanceImage = function(c1, c2, source, uncolored){

      const width = source.width;
      const height = source.height;

      for (let i = 0; i<width; ++i) {
          this.data[i] = 0;
      }
      for (let j = 1; j<height-1; ++j) {
          this.data[j*width] = 0;
          for (let i = 1; i<width-1; ++i) {
              let index = this.getIndex(i,j);
              this.data[index] = 0;
              let dist = 0;
              if (source.data[index] != uncolored) {
                  let index_1_1 = this.getIndex(i-1, j-1);
                  let index0_1 = this.getIndex(i, j-1);
                  let index_11 = this.getIndex(i-1, j);
                  let index1_1 = this.getIndex(i+1, j-1);

                  dist = Math.min(this.data[index_1_1] + c2, this.data[index0_1] + c1);
                  dist = Math.min(dist, this.data[index_11] + c1);
                  dist = Math.min(dist, this.data[index1_1] + c2);
                  this.data[index] = dist;
              }
          }
          this.data[this.getIndex(width-1, j)] = 0;
      }
      for (let i = 0; i<width; ++i){
          this.data[this.getIndex(i, height-1)] = 0;
      }

      for (let j = height-2; j>0; --j) {
          for (let i = width-2; i>0; --i) {
              let index = this.getIndex(i,j);
              let dist = this.data[index];
              if (source.data[index] != uncolored)
              {
                  let index11 = this.getIndex(i+1, j+1);
                  let index0_1 = this.getIndex(i, j+1);
                  let index_11 = this.getIndex(i-1, j+1);
                  let index10 = this.getIndex(i+1, j);
                  dist = Math.min(dist, this.data[index11] + c2);
                  dist = Math.min(dist, this.data[index0_1] + c1);
                  dist = Math.min(dist, this.data[index_11] + c2);
                  this.data[index] = Math.min(dist, this.data[index10] + c1);
              }
          }
      }
  };

  /**
   *  @return {ImageData} A grey scale ImageData to visualize the distances.
   */
  IntDistanceImage.prototype.getImageData = function (skeleton) {

      var res = new ImageData(this.width,this.height);

      let maxDist = 0;
      for (let x = 0; x < this.width*this.height; x++) {
          maxDist = (this.data[x] > maxDist) ? this.data[x] : maxDist;
      }

      for (let y = 0, i=0, rgbValue = 0; y < this.height; y++) {
          for (let x = 0; x < this.width; x++) {
              let index = (y * this.width + x);
              if (this.data[index] > 3) {
                  rgbValue = 255*this.data[index]/maxDist;
                  res.data[i] = rgbValue;
                  res.data[i+1] = rgbValue;
                  res.data[i+2] = rgbValue;
                  res.data[i+3] = 255;
              } else {
                  res.data[i] = 255;
                  res.data[i+1] = 255;
                  res.data[i+2] = 255;
                  res.data[i+3] = 255;
              }
              i+=4;
          }
      }

      return res;
  };

  var IntDistanceImage_1 = IntDistanceImage;

  /**
   *  @param {BinaryImage} source The source image in binary
   *  @param {number} uncolored The pixel value of source that will be considered as uncolored. Usually 0, but can be 1.
   *  @param {number} max_iter Maximum iteration for the skeletonizing algoritm.
   *  @param {IntDistanceImage} distance_image The distance image from which the skeleton will be computed
   */
  var SkeletonImage = function(source, uncolored, max_iter, distance_image) {

      this.width = source.width;
      this.height = source.height;

      this.data = new Array(this.width*this.height);

      for (let k = 0; k < this.width*this.height; k++) {
          if (source.data[k] != uncolored){
              this.data[k] = 1;
          } else {
              this.data[k] = 0 ;
          }
      }

      let maxDist = 0;
      for (let x = 0; x < distance_image.width*distance_image.height; x++) {
          maxDist = (distance_image.data[x] > maxDist) ? distance_image.data[x] : maxDist;
      }

      // Ensure that border pixel will not fuck the whole thing up
      this.CleanBorderPixels();

      //this.skeletonizeEckhardtMaderlechner93(maxIter, distance_image, distance_image.getCoeff()*4);
      this.skeletonizeEckhardtMaderlechner93(max_iter, distance_image, maxDist*0.8);
      //ComputeMinMaxWeight(distance_image);

      // Post processing to improve skeleton quality
      //setInteriorStatus();
      this.CleanBorderPixels();
      this.thin();
      //setEndPoints();
  };

  SkeletonImage.prototype.constructor = SkeletonImage;

  SkeletonImage.prototype.getIndex = function(x,y){
    return y*this.width+x;
  };

  /**
   *
   *  @param {Array.<number>} The background color , default to white if undefined or null.
   *  @param {Array.<number>} The skeleton color , default to red if undefined or null.
   *  @return {ImageData} An ImageData on which the skeleton is drawn according to required colors.
   */
  SkeletonImage.prototype.getImageData = function(bgColor, skelColor){
      var res = new ImageData(this.width, this.height);

      var bg_c = bgColor ? bgColor : [255,255,255,255];
      var skel_c = skelColor ? skelColor : [255,0,0,255];

      let maxDist = 0;
      for (let x = 0; x < this.width*this.height; x++) {
          maxDist = (this.data[x] > maxDist) ? this.data[x] : maxDist;
      }
      for (let y = 0, i=0; y < this.height; y++) {
          for (let x = 0; x < this.width; x++) {
              let index = (y * this.width + x);
              if (this.data[index] === 1) {
                  res.data[i]   = skel_c[0];
                  res.data[i+1] = skel_c[1];
                  res.data[i+2] = skel_c[2];
                  res.data[i+3] = skel_c[3];
              } else {
                  res.data[i]   = bg_c[0];
                  res.data[i+1] = bg_c[1];
                  res.data[i+2] = bg_c[2];
                  res.data[i+3] = bg_c[3];
              }
              i+=4;
          }
      }
      return res;
  };

  // set all bit of border pixels to 0
  SkeletonImage.prototype.CleanBorderPixels = function() {
      for (let i = 0; i < this.width; i++){
          this.data[i] = 0;
          this.data[(this.height-1)*this.width + i] = 0;
      }

      for (let j = 1; j < this.height-2; j++){
          this.data[j*this.width] = 0;
          this.data[j*this.width + (this.width-1)] = 0;
      }
  };


  SkeletonImage.prototype.thin = function()
  {
    let index = this.width -2;
    for (let i = 1; i < this.height - 1; i++)
    {
      index += 2;
      for (let j = 1; j < this.width - 1; j++)
      {
        index ++;
        if ((this.data[index] & 1) == 0)
        continue;

        const voisins = this.getCurrentNeighborhood(index);

        if (((voisins & 7) == 0 && (voisins & 112) == 112) ||
        ((voisins & 14) == 0 && (voisins & 160) == 160) ||
        ((voisins & 28) == 0 && (voisins & 193) == 193) ||
        ((voisins & 56) == 0 && (voisins & 130) == 130) ||
        ((voisins & 112) == 0 && (voisins & 7) == 7) ||
        ((voisins & 224) == 0 && (voisins & 10) == 10) ||
        ((voisins & 193) == 0 && (voisins & 28) == 28) ||
        ((voisins & 131) == 0 && (voisins & 40) == 40))
        this.data[index] = 0;
      }
    }
    return this.data;
  };


  /**
  * Skeleton's extraction algorithm based on U. Eckhardt and G. Maderlechner, Invariant Thinning, 1993.
  *
  * @author Adeline Pihuit 21/01/09
  *
  * @param ???
  */
  SkeletonImage.prototype.skeletonizeEckhardtMaderlechner93 = function(maxIter,distance_image,threshold) {

    const size = this.width*this.height;

    //assert(distance_image.width() == this.width && distance_image.height() == this.height);

    const flag = new Array(this.width*this.height); //interior (2) or boundary (1) pixel
    const flagSN = new Array(this.width* this.height); // nb strong neighbors
    const flagN = new Array(this.width*this.height); // nb neighbors
    const flagIBP = new Array(this.width*this.height); // Inner Boundary Pixel
    const flagPIBP = new Array(this.width*this.height); // Perfect Inner Boundary Pixel
    const flagSBP = new Array(this.width*this.height); // Simple Boundary Pixel
    const flagEnd = new Array(this.width*this.height); // Resulting image
    const flagDbg = new Array(this.width*this.height); // Temporary image : color pixel

    let found = true;
    let iter = 0;
    const inf = this.width + 1;
    const sup = size - this.width - 1;

    while (found && iter < maxIter){

      found = false;
      for (let k = inf; k < sup; k++)
      {
        flagSN[k] = this.getNbStrongNeighbors(this.data, k ); // ptrFlagSN : nb Strong Neighbors

        flagN[k] = flagSN[k] + this.getNbNoStrongNeighbors(this.data, k); // ptrFlagN : nb neighbors not strong

        if (this.data[k]) {
          // Interior Pixel (2) : 4 strong neighbors "on"
          if (flagSN[k] == 4)
          {
            flag[k] = 2;
            flagDbg[k] = 1;
          }
          // Boundary Pixel (1)
          else
          {
            flag[k] = 1;
            flagDbg[k] = 2;
          }
        } else {
          flag[k] = 0;
        }
      } // end for



      // 2nd test : IBP
      // Inner Boundary Pixel = boundary pixel (1) having an interior pixel (2) as strong neighbor
      for (let k = inf; k < sup; k++)
      {
        if (this.data[k]){
          flagIBP[k] = (flag[k] == 1) && ((flag[k+1] == 2) || (flag[k-1] == 2) || (flag[k+this.width] == 2) || (flag[k-this.width] == 2));
        } else {
          flagIBP[k] = false;
        }

        if (flagIBP[k]){
          flagIBP[k] = 1;
          flagDbg[k] = 3;
        } else {
          flagIBP[k] = 0;
        }


      } // end for
      for (let k = inf; k < sup; ++k)
      {
        if (this.data[k] && flag[k] == 1){
          let p0 = (this.data[k + 1] & 1) != 0;
          let p1 = (this.data[k - this.width + 1] & 1) != 0;
          let p2 = (this.data[k - this.width] & 1) != 0;
          let p3 = (this.data[k - this.width - 1] & 1) != 0;
          let p4 = (this.data[k - 1] & 1) != 0;
          let p5 = (this.data[k + this.width - 1] & 1) != 0;
          let p6 = (this.data[k + this.width] & 1) != 0;
          let p7 = (this.data[k + this.width + 1] & 1) != 0;

          const trans = (1 - p0) * p1 + (1 - p1) * p2 + (1 - p2) * p3 +
          (1 - p3) * p4 + (1 - p4) * p5 + (1 - p5) * p6 + (1 - p6) * p7 + (1 - p7) * p0;

          const b = p0 + p1 + p2 + p3 + p4 + p5 + p6 + p7;

          const d = ((trans == 1) || (trans == 0 && b == 8));

          flagSBP[k] = (flag[k] == 1) && (d && (p0 || p2 || p4 || p6));
        } else {
          flagSBP[k] = false;
        }
        if (flagSBP[k]){
          flagDbg[k] = 4;
        }

      } // end for
      for (let k = inf; k < sup; ++k)
      {
        if (this.data[k]){
          const b0 = ((flag[k+1] == 2) && !this.data[k-1]);
          const b1 = ((flag[k-1] == 2) && !this.data[k+1]);
          const b2 = ((flag[k+ this.width] == 2) && !this.data[k-this.width]);
          const b3 = ((flag[k-this.width] == 2) && !this.data[k+this.width]);
          flagPIBP[k] = (flagIBP[k] && (b0 || b1 || b2 || b3));
        } else {
          flagPIBP[k] = false;
        }
        if (flagPIBP[k]){
          flagDbg[k] = 5;
        }

      } // end for

      // pixels to remove
    for (let k = 0; k < size; ++k)
      {
        if (this.data[k])
        {
          if (flagSBP[k] && flagPIBP[k])
          {
            flagEnd[k] = 0;
            flagDbg[k] = 6;
            found = true;
          }
          else
          {
            if (flagN[k] == 0){ // 0 neighbors!
              flagEnd[k] = 0;
            } else if ((distance_image.data[k] < threshold && flagN[k] == 1))
            {
              flagEnd[k] = 0;
              found = true;
            }
            else{
              flagEnd[k] = 1;

            }
          }
        }
        else
        {
          flagEnd[k] = 0;
          flagDbg[k] = 0;
        }
      } // end for

      for (let i=0; i< flagEnd.length; i++){
        this.data[i] = flagEnd[i];
      }

      ++iter;

    } // end while


  };

  /**
  * Encode the neighborhood of the pixel.
  * Each bit corresponds to whether or not a pixel contains informations in
  * a determined place.
  * The following table describes the place of each bit in the neighborhood
  *     ---w--->
  *  |  |0|1|2|
  *  h  |7| |3|
  *  |  |6|5|4|
  *  V
  * @param ptrPix a pointer towards the neighborhood wanted pixel
  * @return The encoded neighborhood
  */
  SkeletonImage.prototype.getCurrentNeighborhood = function(indexPixel)
  {
      var tab = this.data;
      // encode the neighborhood of the pixel
      return (
          ((tab[indexPixel - 1] & 1)                  << 7) |
          ((tab[indexPixel + 1] & 1)                  << 3) |
          (( tab[indexPixel + this.width] & 1)        << 5) |
          ((tab[indexPixel- this.width] & 1)          << 1) |
          ( tab[indexPixel - (this.width + 1)] & 1)          |
          ((tab[indexPixel -(this.width - 1)] & 1)    << 2) |
          ((tab[indexPixel + (this.width - 1)] & 1)   << 6) |
          ((tab[indexPixel + (this.width + 1)] & 1)   << 4)
      );
  };

  /**
  * ???
  *
  * @author Adeline Pihuit 21/01/09
  *
  * @param ???
  * @return ???
  */
  SkeletonImage.prototype.nbNeighbours = function(neighbours)
  {
      return  (neighbours & 1) + ((neighbours >> 1) & 1) + ((neighbours >> 2)
              & 1) + ((neighbours >> 3) & 1) + ((neighbours >> 4) & 1) +
              ((neighbours >> 5) & 1) + ((neighbours >> 6) & 1) +
              ((neighbours >> 7) & 1);
  };


  SkeletonImage.prototype.getNbStrongNeighbors = function(tab, valeurPix) {
      return (tab[valeurPix -1] + tab[valeurPix +1] +
              tab[valeurPix - this.width] + tab[valeurPix + this.width]);
  };

  SkeletonImage.prototype.getNbNoStrongNeighbors = function(tab, valeurPix)
  {
      return (tab[valeurPix - 1 - this.width] + tab[valeurPix -1 + this.width] +
      tab[valeurPix + 1 - this.width] + tab[valeurPix + 1 + this.width]);
  };

  SkeletonImage.prototype.isInnerBoundaryPixel = function (tab, valeurPix)
  {
      return ((tab[valeurPix] == 1) && (tab[valeurPix -1] == 2) || (tab[valeurPix +1] == 2) ||
      (tab[valeurPix - this.width] == 2) || (tab[valeurPix + this.width] == 2));
  };

  SkeletonImage.prototype.isSimpleBoundaryPixel = function(tab,valeurPix) {

      let p0 = (tab[valeurPix + 1] & 1) != 0;
      let p1 = (tab[valeurPix - this.width + 1] & 1) != 0;
      let p2 = (tab[valeurPix - this.width] & 1) != 0;
      let p3 = (tab[valeurPix - this.width - 1] & 1) != 0;
      let p4 = (tab[valeurPix - 1] & 1) != 0;
      let p5 = (tab[valeurPix + this.width - 1] & 1) != 0;
      let p6 = (tab[valeurPix + this.width] & 1) != 0;
      let p7 = (tab[valeurPix + this.width + 1] & 1) != 0;

      const trans = (1 - p0) * p1 + (1 - p1) * p2 + (1 - p2) * p3 +
      (1 - p3) * p4 + (1 - p4) * p5 + (1 - p5) * p6 + (1 - p6) * p7 + (1 - p7) * p0;

      const b = p0 + p1 + p2 + p3 + p4 + p5 + p6 + p7;

      const d = ((trans == 1) || (trans == 0 && b == 8));

      return (d && (p0 || p2 || p4 || p6));
  };

  var SkeletonImage_1 = SkeletonImage;

  /**
   *  Main class for a skeleton node in an image.
   *  Must be unique for each pixel.
   *  @param {Point2D} position The position of the node. Can be anything in [x+1[ [y+1[
   */
  var SkeletonNode = function(position, weight){
    this.position = position;
    this.weight = weight;
    this.neighbors = new Map();
  };

  /**
   *  Compute the key of a node in neighbors maps, given its x,y positions.
   */
  SkeletonNode.computeKey = function(x,y){
      return Math.floor(x)+";"+Math.floor(y);
  };
  /**
   *  Return x,y in an array of 2 elements
   */
  SkeletonNode.getXYFromKey = function(key){
      var res = key.split(";");
      res[0] = parseInt(res[0]);
      res[1] = parseInt(res[1]);
      return res;
  };

  SkeletonNode.prototype.constructor = SkeletonNode;

  // Getters
  SkeletonNode.prototype.getKey = function(){
      return this.computeKey(this.position.x,this.position.y);
  };

  SkeletonNode.prototype.getPosition = function(){
    return this.position;
  };

  SkeletonNode.prototype.getWeight = function(){
    return this.weight;
  };

  SkeletonNode.prototype.getNeighbors = function(){
    return this.neighbors;
  };

  // Setters
  SkeletonNode.prototype.setPosition = function(position){
    this.position = position;
  };

  SkeletonNode.prototype.setWeight = function(weight){
    this.weight = weight;
  };

  SkeletonNode.prototype.setNeighbors = function(neighbors){
    this.neighbors = neighbors;
  };



  var SkeletonNode_1 = SkeletonNode;

  var Point2D = function(x, y){
    this.x = x;
    this.y = y;
  };

  Point2D.prototype.distanceToOrigin = function(p){
      var x = this.x;
      var y = this.y;
      return Math.sqrt(x*x+y*y);
  };

  Point2D.prototype.distanceTo = function(p){
      var x = this.x-p.x;
      var y = this.y-p.y;
      return Math.sqrt(x*x+y*y);
  };

  Point2D.prototype.barycenter = function(p1,p2,w1,w2){
      var t = w2/(w1+w2);
      this.x = (1-t)*p1.x +t*p2.x;
      this.y = (1-t)*p1.y +t*p2.y;
      return this;
  };

  var Point2D_1 = Point2D;

  var Vector2D = function(x, y){
    this.x = x || 0;
    this.y = y || 0;
  };

  Vector2D.prototype.length = function(p){
      var x = this.x;
      var y = this.y;
      return Math.sqrt(x*x+y*y);
  };

  Vector2D.prototype.subPoints = function(p1,p2){
      var x = p1.x-p2.x;
      var y = p1.yp2.y;
      return this;
  };

  var Vector2D_1 = Vector2D;

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
              nodes[k] = new SkeletonNode_1(new Point2D_1(x+0.5,y+0.5),this.distImg.data[k]/this.distImg.getCoeff());
              roots.push(nodes[k]);
              this._recHierarchy(nodes[k], k, nodes);
          }
          k = this._findNextPixelWithNeighbors(k+1);
      }

      return roots;
  };

  /**
   *  Simplify the hierarchy based on the given angle in radian.
   *  Actually iterate through each branch and remove all pixels such that
   */
  Skeletonizer.prototype._simplifyHierarchy = function(root, angle, done){
      var p0 = root.position();
      if(root.getNeighbors().size() === 1){
          var it = root.getNeighbors().keys();
          var p1 = it.next().value.position();
          var dir = new Vector2D_1().subPoints(p1,p0);
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
  };

  // New : use x,y instead of 1 dimensionnal index

  // Private function used in _addNeighbors
  Skeletonizer.prototype._checkAndCreate = function(x,y, node, nodes){
      var key = SkeletonNode_1.computeKey(x,y);
      if (nodes[key] === undefined){
          nodes[key] = new SkeletonNode_1(new Point2D_1(x+0.5, y+0.5), this.distImg.getValue(x,y));
          newElement ++;
      }
      node.neighbors.set(key, nodes[key]);
  };
  Skeletonizer.prototype._addNeighbors = function(node, neighbors, nodes ){
      const width = this.skelImg.width;
      const x = Math.floor(node.position.x);
      const y = Math.floor(node.position.y);
      let newElement = 0;

      if (neighbors & 1){
          this._checkAndCreate(x-1,y-1,node,nodes);
      }

      if (neighbors & 2){
          var key = SkeletonNode_1.computeKey(x,y-1);
          this._checkAndCreate(x,y-1,node,nodes);
      }

      if (neighbors & 4){
          this._checkAndCreate(x+1,y-1,node,nodes);
      }

      if (neighbors & 8){
          this._checkAndCreate(x+1,y,node,nodes);
      }

      if (neighbors & 16){
          this._checkAndCreate(x+1,y+1,node,nodes);
      }

      if (neighbors & 32){
          this._checkAndCreate(x,y+1,node,nodes);
      }

      if (neighbors & 64){
          this._checkAndCreate(x-1,y+1,node,nodes);
      }

      if (neighbors & 128){
          this._checkAndCreate(x-1,y,node,nodes);
      }

      return newElement;
  };


  Skeletonizer.prototype._addNeighborsOLD = function(node, neighbors, k, nodes ){
      const width = this.skelImg.width;
      const x = k % width;
      const y = Math.round(k / width);
      let newElement = 0;

      if (neighbors & 1){
          if (nodes[k-width-1] === undefined){
              const node = new SkeletonNode_1(new Point2D_1(x - 1 + 0.5, (y-1) + 0.5), this.distImg.getIndexValue(k-width-1));
              nodes[k-width-1] = node;
              newElement ++;
          }
          node.neighbors.set(k-width-1, nodes[k-width-1]);
      }

      if (neighbors & 2){
          if (nodes[k-width] === undefined){
              const node = new SkeletonNode_1(new Point2D_1(x+ 0.5, (y-1) + 0.5), this.distImg.getIndexValue(k-width));
              nodes[k-width] = node;
              newElement ++;
          }
          node.neighbors.set(k-width, nodes[k-width]);

      }

      if (neighbors & 4){
          if (nodes[k-width+1] === undefined){
              const node = new SkeletonNode_1(new Point2D_1(x + 1 + 0.5, (y-1) + 0.5), this.distImg.getIndexValue(k-width + 1));
              nodes[k-width+1] = node;
              newElement ++;
          }
          node.neighbors.set(k-width+1, nodes[k-width+1]);
      }

      if (neighbors & 8){
          if (nodes[k+1] === undefined){
              const node = new SkeletonNode_1(new Point2D_1(x+1 + 0.5,y + 0.5), this.distImg.getIndexValue(k+1));
              nodes[k+1] = node;
              newElement ++;
          }
          node.neighbors.set(k+1, nodes[k+1]);
      }

      if (neighbors & 16){
          if (nodes[k+width+1] === undefined){
              const node = new SkeletonNode_1(new Point2D_1(x + 1 + 0.5, y + 1 + 0.5), this.distImg.getIndexValue(k+width + 1));
              nodes[k+width+1] = node;
              newElement ++;
          }
          node.neighbors.set(k+width+1, nodes[k+width+1]);
      }

      if (neighbors & 32){
          if (nodes[k+width] === undefined){
              const node = new SkeletonNode_1(new Point2D_1(x+ 0.5, (y+1) + 0.5), this.distImg.getIndexValue(k+width));
              nodes[k+width] = node;
              newElement ++;
          }
          node.neighbors.set(k+width, nodes[k+width]);
      }

      if (neighbors & 64){
          if (nodes[k+width-1] === undefined){
              const node = new SkeletonNode_1(new Point2D_1(x - 1+ 0.5, (y+1) + 0.5), this.distImg.getIndexValue(k+width - 1));
              nodes[k+width-1] = node;
              newElement ++;
          }
          node.neighbors.set(k+width-1, nodes[k+width-1]);
      }

      if (neighbors & 128){
          if (nodes[k-1] === undefined){
              const node = new SkeletonNode_1(new Point2D_1(x - 1+ 0.5, y + 0.5), this.distImg.getIndexValue(k-1));
              nodes[k-1] = node;
              newElement ++;
          }
          node.neighbors.set(k-1, nodes[k-1]);
      }

      return newElement;
  };

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
  };

  var Skeletonizer_1 = Skeletonizer;

  var capsuleDistance = function(p1,p2,r1,r2,p){
      var unit_dir = new Point2D_1(
          p2.x-p1.x,
          p2.y-p1.y
      );
      var length = unit_dir.distanceToOrigin();
      unit_dir.x = unit_dir.x/length;
      unit_dir.y = unit_dir.y/length;

      var v = new Point2D_1(
          p.x-p1.x,
          p.y-p1.y
      );
      var p1p_l = v.distanceToOrigin();
      var p1p_sqrl = p1p_l*p1p_l;

      // In unit_dir basis, vector (this.r1-this.r2, this.length) is normal to the "weight line"
      // We need a projection in this direction up to the segment line to know in which case we fall.

      var x_p_2D = v.x*unit_dir.x + v.y*unit_dir.y;
      // pythagore inc.
      var y_p_2D = Math.sqrt(
          Math.max( // Necessary because of rounded errors, pyth result can be <0 and this causes sqrt to return NaN...
              0.0, p1p_sqrl - x_p_2D*x_p_2D // =  y_p_2D² by pythagore
          )
      );
      var t = -y_p_2D/length;

      var proj_x = x_p_2D + t*(r1 - r2);
      // var proj_y = 0.0; // by construction

      // Easy way to compute the distance now that we have the projection on the segment
      var a = proj_x/length;
      if(a>1.0){a=1.0;}
      if(a<0.0){a=0.0;}

      var proj = new Point2D_1(p1.x,p1.y);
      proj.x += ( p2.x - proj.x ) * a;// compute the actual 3D projection
      proj.y += ( p2.y - proj.y ) * a;
      proj.z += ( p2.z - proj.z ) * a;

      v.x = p.x-proj.x;
      v.y = p.y-proj.y;
      var l = v.distanceToOrigin();

      return l - (a*r2+(1.0-a)*r1);
  };

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
          var p = new Point2D_1(0,0);

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
                      capsuleDistance(node.getPosition(), father.getPosition(), nw, Math.ceil(father.weight), p)
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

      var first_node = new SkeletonNode_1(new Point2D_1(max_x,max_y),max/this.distImg.getCoeff());
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
          var max_point = new Point2D_1(this.distImg.getXFromIndex(max_i),this.distImg.getYFromIndex(max_i));

          var father = candidates[max_i];
          var best_c = {
              v:max_v,
              p:new Point2D_1(max_point.x,max_point.y),
              idx:max_i
          };

          // Checking along the segment if there is a better point
          // Here we check if there is not a better suiting candidate along the line from max_i pixel to its father
          // A better candidate would be a point which would cover "almost" the same surface but be closer to the father.
          var checkCandidateBestFit = function(){
              var dist = father.getPosition().distanceTo(max_point);
              var p = new Point2D_1(0,0);
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
                      best_c.idx = self.distImg.getIndex(p.x,p.y);
                  }
              }
          };

          // Split the segment and ckeck if the point is threshold-far from the highest distance in its neighborhood.
          var checkCandidateMid = function(){
              var dist = father.getPosition().distanceTo(max_point);
              var mid = new Point2D_1(0,0);
              mid.barycenter(max_point, father.getPosition(), 0.5, 0.5);
              mid.x = Math.round(mid.x);
              mid.y = Math.round(mid.y);
              var v = self.distImg.getValue(mid.x,mid.y)/self.distImg.getCoeff();

              var p = new Point2D_1(0,0);

              var dir = new Point2D_1(
                  max_point.x-father.getPosition().x,
                  max_point.y-father.getPosition().y
              );
              dir.x /= dist;
              dir.y /= dist;
              var ort_dir = new Point2D_1(-dir.y,dir.x);

              var best_neigh = {
                  v:v,
                  p:new Point2D_1(mid.x,mid.y),
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

          var new_node = new SkeletonNode_1(best_c.p,best_c.v);
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

      return {
          hierarchy:nodes,
          covered:covered
      };
  };

  var QuiblierSkeletonizer_1 = QuiblierSkeletonizer;

  var ImageSkeletonizer = {};

  ImageSkeletonizer.BinaryImage = BinaryImage_1;
  ImageSkeletonizer.IntDistanceImage = IntDistanceImage_1;
  ImageSkeletonizer.SkeletonImage = SkeletonImage_1;
  ImageSkeletonizer.Skeletonizer = Skeletonizer_1;

  ImageSkeletonizer.skeletonize = function(img_data){

      var binary_img  = new BinaryImage_1(img_data);
      var dist_img    = new IntDistanceImage_1(3,4, binary_img, 0);
      var skel_img    = new SkeletonImage_1(binary_img, 0, 2000, dist_img);
      var skeletonizer = new Skeletonizer_1(skel_img, dist_img);

      return {
          skeleton  : skeletonizer.buildHierarchy(),
          binaryImg : binary_img,
          distImg   : dist_img,
          skelImg   : skel_img
      };
  };

  ImageSkeletonizer.skeletonizeQ = function(img_data){

      var binary_img  = new BinaryImage_1(img_data);
      var dist_img    = new IntDistanceImage_1(3,4, binary_img, 0);
      var skeletonizer = new QuiblierSkeletonizer_1(dist_img);


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
          var idx = 4*(n.position.y*res.width+n.position.x);
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

  var exports$1 = ImageSkeletonizer;

  return exports$1;

})));

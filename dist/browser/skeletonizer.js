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

  IntDistanceImage.prototype.toGreyScale = function (canvas_ctx, skeleton) {
      var source = this;

      let grey_data = new Uint8ClampedArray(source.width*source.height*4);

      let maxDist = 0;
      for (let x = 0; x < source.width*source.height; x++) {
          maxDist = (source.data[x] > maxDist) ? source.data[x] : maxDist;
      }

      for (let y = 0, i=0, rgbValue = 0; y < source.height; y++) {
          for (let x = 0; x < source.width; x++) {
              let index = (y * source.width + x);

              if (skeleton.data[index] == 1){
                  grey_data[i] = 255;
                  grey_data[i+1] = 0;
                  grey_data[i+2] = 0;
                  grey_data[i+3] = 255;
              } else {
                  if (source.data[index] > 3) {
                      rgbValue = 255*source.data[index]/maxDist;
                      grey_data[i] = rgbValue;
                      grey_data[i+1] = rgbValue;
                      grey_data[i+2] = rgbValue;
                      grey_data[i+3] = 255;
                  } else {
                      grey_data[i] = 255;
                      grey_data[i+1] = 255;
                      grey_data[i+2] = 255;
                      grey_data[i+3] = 255;
                  }
              }
            i+=4;
          }
      }

      let res = canvas_ctx.createImageData(source.width, source.height);
      res.data.set(grey_data);

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

        const voisins = this.getCurrentNeighborhood(this.data,index );

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
  SkeletonImage.prototype.getCurrentNeighborhood = function(tab, indexPixel)
  {
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

  var SkeletonNode = function(position, weight, neighbors){
    this.position = position;
    this.weight = weight;
    this.neighbors = neighbors;
  };

  SkeletonNode.prototype.constructor = SkeletonNode;

  // Getters
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
          first_node = new SkeletonNode_1(new Point2D(x+0.5,y+0.5),this.distImg.data[k], new Map() );
          tab_node[k] = first_node;
          this._recHierarchy(first_node, k, this.skelImg, this.distImg, tab_node);
      }

      console.log(first_node);

      return first_node;
  };

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
  };

  Skeletonizer.prototype._addNeighbors = function(node, neighbors, k, width, distance_image, tab_node ){
      const x = k % width;
      const y = Math.round(k / width);
      let newElement = 0;

      if (neighbors & 1){
          if (!tab_node[k-width-1]){
              const node = new SkeletonNode_1(new Point2D(x - 1 + 0.5, (y-1) + 0.5), distance_image[k-width-1], new Map());
              tab_node[k-width-1] = node;
              newElement ++;
          }
          node.neighbors.set(k-width-1, tab_node[k-width-1]);

      }

      if (neighbors & 2){
          if (!tab_node[k-width]){
              const node = new SkeletonNode_1(new Point2D(x+ 0.5, (y-1) + 0.5), distance_image[k-width], new Map());
              tab_node[k-width] = node;
              newElement ++;
          }
          node.neighbors.set(k-width, tab_node[k-width]);

      }

      if (neighbors & 4){
          if (!tab_node[k-width+1]){
              const node = new SkeletonNode_1(new Point2D(x + 1 + 0.5, (y-1) + 0.5), distance_image[k-width + 1], new Map());
              tab_node[k-width+1] = node;
              newElement ++;
          }
          node.neighbors.set(k-width+1, tab_node[k-width+1]);
      }

      if (neighbors & 8){
          if (!tab_node[k+1]){
              const node = new SkeletonNode_1(new Point2D(x+1 + 0.5,y + 0.5), distance_image[k+1], new Map());
              tab_node[k+1] = node;
              newElement ++;
          }
          node.neighbors.set(k+1, tab_node[k+1]);
      }

      if (neighbors & 16){
          if (!tab_node[k+width+1]){
              const node = new SkeletonNode_1(new Point2D(x + 1 + 0.5, y + 1 + 0.5), distance_image[k+width + 1], new Map());
              tab_node[k+width+1] = node;
              newElement ++;
          }
          node.neighbors.set(k+width+1, tab_node[k+width+1]);
      }

      if (neighbors & 32){
          if (!tab_node[k+width]){
              const node = new SkeletonNode_1(new Point2D(x+ 0.5, (y+1) + 0.5), distance_image[k+width], new Map());
              tab_node[k+width] = node;
              newElement ++;
          }
          node.neighbors.set(k+width, tab_node[k+width]);
      }

      if (neighbors & 64){
          if (!tab_node[k+width-1]){
              const node = new SkeletonNode_1(new Point2D(x - 1+ 0.5, (y+1) + 0.5), distance_image[k+width - 1], new Map());
              tab_node[k+width-1] = node;
              newElement ++;
          }
          node.neighbors.set(k+width-1, tab_node[k+width-1]);
      }

      if (neighbors & 128){
          if (!tab_node[k-1]){
              const node = new SkeletonNode_1(new Point2D(x - 1+ 0.5, y + 0.5), distance_image[k-1], new Map());
              tab_node[k-1] = node;
              newElement ++;
          }
          node.neighbors.set(k-1, tab_node[k-1]);
      }

      return newElement;
  };

  Skeletonizer.prototype._recHierarchy = function(node, k, skel_img, distance_image, tab_node){
      const neighbors = skel_img.getCurrentNeighborhood(skel_img.data, k);
      const newElement = this._addNeighbors(node, neighbors, k, skel_img.width, distance_image.data, tab_node );
      if (newElement){
          for (let [cle, valeur] of node.getNeighbors()){
              this._recHierarchy(valeur, cle, skel_img, distance_image, tab_node);
          }
      }
  };

  var Skeletonizer_1 = Skeletonizer;

  var ImageSkeletonizer = {};

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

  /**
   *  @param {SkeletonImage} source The skeleton image to be drawn
   *  @return {ImageData} An ImageData : background in white, skeleton pixels in red.
   */
  ImageSkeletonizer.displaySkeleton = function (source) {
    const grey_data = new Uint8ClampedArray(source.width*source.height*4);
    let maxDist = 0;
    for (let x = 0; x < source.width*source.height; x++) {
      maxDist = (source.data[x] > maxDist) ? source.data[x] : maxDist;
    }
    for (let y = 0, i=0; y < source.height; y++) {
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
    const res = new ImageData(grey_data, source.width, source.height);
    return res;
  };

  var exports$1 = ImageSkeletonizer;

  return exports$1;

})));

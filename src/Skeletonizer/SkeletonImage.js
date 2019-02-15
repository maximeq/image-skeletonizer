"use strict";

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
    for (let y = 0, i=0, rgbValue = 0; y < this.height; y++) {
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

    // First test : Interior/Boundary/Background

    let tabBoundaryPixel = [];
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
          tabBoundaryPixel.push(k);
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

    // 3rd test : SBP
    // Simple Boundary Pixel = boundary pixel with exactly one strong connected component in its neighborhood and this component is strongly connected to itself
    const tabSBP = [];
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
        tabSBP.push(k);
      }

    } // end for

    // 4th test : PIBP
    // Perfect Inner Boundary Pixel = inner boundary pixel whose pixel ptrSkel = (strong neighbor + 4) --> off()
    const tabPIBP = [];
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
        tabPIBP.push(k);
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

module.exports = SkeletonImage;
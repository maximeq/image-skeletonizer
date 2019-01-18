/**
 * signed distance fields generation in javascript
 * uses the 8SSEDT algorithm for linear-time processing
 *
 * done in conjustion with the signed distance fields text experiment
 *
 * references:
 *      http://www.lems.brown.edu/vision/people/leymarie/Refs/CompVision/DT/DTpaper.pdf
 *      http://www.codersnotes.com/notes/signed-distance-fields
 *      http://guides4it.com/Mobile/iphone-3d-programming---crisper-text-with-distance-fields-(part-1)---generating-distance-fields-with-python.aspx
 *
 * http://github.com/zz85
 * http://twitter.com/blurspline
 * 29 April 2012
 *
 */

/**
 *  Used in computation of both unsigned and signed distance field according to 8SSEDT algorithm
 *  @param {Array.<{x:number,y:number}>} grid The gird on wich we want the SDF
 *  @param {number} width Grid width
 *  @param {number} height Grid height
 *  @constructor
 */
var SSEDT8 = function (grid, width, height) {
    this.width = width;
    this.height = height;
    this.grid = grid;
    this.outside = 10000;
    this.outofrange = {'x':this.outside, 'y':this.outside};
    this.inc=0; // counter for progress bar
    this.incMaxSize = 100;
};

SSEDT8.prototype.constructor = SSEDT8;

/**
 *  Return value at a given position in the grid
 *  @param {number} x coordinate in width
 *  @param {number} y coordinate in height
 *  @param {Array.<{x:number,y:number}>} grid The grid
 *
 *  @return {{x:number,y:number}} The cell at x y
 */
SSEDT8.prototype.grid_get = function (grid, x, y) {
    if (x<0 || y<0 || x> (this.width-1) || y> (this.height-1) )  {
            return this.outofrange;
    }
    return grid[ y * this.width + x ];
};

/**
 *  Set value at a given position in the grid
 *  @param {number} x coordinate in width
 *  @param {number} y coordinate in height
 *  @param {Array.<{x:number,y:number}>} grid The grid
 *  @param {{x:number,y:number}} p The new value
 */
SSEDT8.prototype.grid_put = function (grid, x, y, p) {
    grid [ y * this.width + x ] = p;
};

/**
 *  Return the squared length of an object defining a cell in the grid
 *  @param {{x:number,y:number}} c A cell (2D point with x and y coordinates)
 */
SSEDT8.prototype.lengthSq = function (c) {
    return c.x*c.x + c.y*c.y;
};

/**
 *  Make some kind of comparison between some cells...
 *  @param {Array.<{x:number,y:number}>} g A grid
 *  @param {{x:number,y:number}} cell A cell
 *  @param {number} x
 *  @param {number} y
 *  @param {number} offsetX
 *  @param {number} offsetY
 *
 *  @return {{x:number,y:number}} cell, modified if necessary
 */
SSEDT8.prototype.grid_compare = function (g, cell, x, y, offsetX, offsetY) {
    var gOff = {x:0, y:0};
    var get = this.grid_get(g, x + offsetX, y+offsetY);

    gOff.x = get.x + offsetX;
    gOff.y = get.y + offsetY;

    if (this.lengthSq(gOff) < this.lengthSq(cell)) {
        cell.x = gOff.x;
        cell.y = gOff.y;
    }

    return cell;
};

/**
 *  Progagate something
 *   @param {Array.<{x:number,y:number}>} grid A grid
 */
SSEDT8.prototype.propagate = function (grid) {
    var p, x, y;

    // pass 0
    for (y=0; y<this.height; y++) {
        for (x=0; x<this.width; x++) {
            p = this.grid_get(grid, x, y);
            p = this.grid_compare( grid, p, x, y, -1,  0 );
            p = this.grid_compare( grid, p, x, y,  0, -1 );
            p = this.grid_compare( grid, p, x, y, -1, -1 );
            p = this.grid_compare( grid, p, x, y,  1, -1 );
            this.grid_put( grid, x, y, p );
        }
        for (x=this.width-1;x>=0;x--) {
            p = this.grid_get(grid, x, y);
            p = this.grid_compare( grid, p, x, y, 1,  0 );
            this.grid_put( grid, x, y, p);
        }
    }

    // pass 1
    for (y=this.height-1; y>=0; y--) {
        for (x=this.width-1;x>=0;x--) {
            p = this.grid_get(grid, x, y);
            p = this.grid_compare( grid, p, x, y,  1,  0 );
            p = this.grid_compare( grid, p, x, y,  0,  1 );
            p = this.grid_compare( grid, p, x, y, -1,  1 );
            p = this.grid_compare( grid, p, x, y,  1,  1 );

            this.grid_put( grid, x, y, p);
        }
        for (x=0; x<this.width; x++) {
            p = this.grid_get(grid, x, y);
            p = this.grid_compare( grid, p, x, y, -1,  0 );
            this. grid_put( grid, x, y, p);
        }
    }

};

/**
 *  Get the signed distance field from the curent grid.
 *  @return {!{data:Float32Array, width:number, height:number}}
 */
SSEDT8.prototype.signedDistanceFieldsFromGrid = function () {
    var x, y;
    var grid1 = [];
    var grid2 = [];
    var index;
    this.inc = 0;
    // 5 loops on the height: one below, 2 per propagate and we propagate twice, i.e 1+ 2*2=5
    this.incMaxSize = this.height*5;
    // Start the work
    //lib.Proxy.sendProgress(4,0);
    // step 1 generate grids.
    for (y=0; y<this.height; y++) {
        for (x=0; x<this.width; x++) {
            index = y * this.width + x;
            if ( this.grid[index] ) {
                this.grid_put(grid1, x, y, {x:0, y:0});
                this.grid_put(grid2, x, y, {x:this.outside, y:this.outside});
            } else {
                this.grid_put(grid1, x, y, {x:this.outside, y:this.outside});
                this.grid_put(grid2, x, y, {x:0, y:0});
            }
        }
    }

    // step 2 propagate distances
    this.propagate(grid1);
    this.propagate(grid2);

    var distanceFields = new Float32Array(this.height*this.width);
    var dist1, dist2, dist;

    for (y=0; y<this.height; y++) {
        for (x=0; x<this.width; x++) {
            index = y * this.width + x;
            dist1 = Math.sqrt(this.lengthSq( this.grid_get( grid1, x, y )));
            dist2 = Math.sqrt(this.lengthSq( this.grid_get( grid2, x, y )));
            dist = dist1 - dist2;
            distanceFields[index] = dist;
        }
    }
    return {"data": distanceFields, "width":this.width, "height":this.height};
};

/**
 *  Get Unsigned Distance Field based on 8SSEDT
 *  @return {!{data:Float32Array, width:number, height:number}}
 */
SSEDT8.prototype.unsignedDistanceFieldsFromGrid = function (){
    var x, y;
    var grid1 = [];
    var index;
    this.inc = 0;
    // 3 loops on the height: one below, 2 per propagate and we propagate once, i.e 1+ 1*2=3
    this.incMaxSize = this.height*3;
    // Start the work
    // step 1 generate grids.
    for (y=0; y<this.height; y++) {
        for (x=0; x<this.width; x++) {
            index = y * this.width + x;
            if ( this.grid[index] ) {
                this.grid_put(grid1, x, y, {x:0, y:0});
            } else {
                this.grid_put(grid1, x, y, {x:this.outside, y:this.outside});
            }
        }
    }

    // step 2 propagate distances
    this.propagate(grid1);

    // console.log('grid1', JSON.stringify(grid1), 'grid2', JSON.stringify(grid2));

    var distanceFields = new Float32Array(this.height*this.width);

    for (y=0; y<this.height; y++) {
        for (x=0; x<this.width; x++) {
            index = y * this.width + x;
            distanceFields[index] = Math.sqrt(this.lengthSq( this.grid_get( grid1, x, y )));
        }
    }
    return {"data": distanceFields, "width":this.width, "height":this.height};
};

/**
 *  Compute and return signed distance field
 *  @param {!ImageData} img_data The ImageData from a canvas context('2D')
 *  @param {boolean} signed True if the returned distane field must be signed. Default to true.
 *  @return {!{data:Float32Array, width:number, height:number}}
 */
SSEDT8.computeDistanceField = function (img_data, signed) {
    // create from the canva a binary array containing inside/outside crisps pixels
    var binary_img = new BinaryImage(img_data);
    var computer = new SSEDT8(binary_img.data,binary_img.width,binary_img.height);
    // Compute the signed distance field from the binary output
    if(signed){
        return computer.signedDistanceFieldsFromGrid();
    }else{
        return computer.unsignedDistanceFieldsFromGrid();
    }
};

module.exports = SSEDT8;
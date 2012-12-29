
// FIXME: Add this below
// Updated to use a modification of the "returnExportsGlobal" pattern from https://github.com/umdjs/umd
(function (window, document, undefined) {
  'use strict';
  /**
   * Polyfills
   */

  if (!Function.prototype.bind) {
    Function.prototype.bind = function (ctx /* ... */) {
      var that  = this;
      var args  = Array.prototype.slice.call(arguments, 1);

      return function () {
        return that.apply(ctx, args.concat(Array.prototype.slice.call(arguments)));
      };
    };
  }
  
  var tranlateMatrix = function (element, position) {
    var tx, ty, tz, matrix, style = element.style;

    tx = position[0] || 0;
    ty = position[1] || 0;
    tz = position[2] || 0;

    matrix = 'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0,  1, 0, ' + tx.toFixed(1) + ', ' + ty.toFixed(1) + ', ' + tz.toFixed(1) + ', 1)';

    style['-webkit-transform'] = matrix;
    style['-moz-transform'] = matrix;
    style['-ms-transform'] = matrix;
    style['-o-transform'] = matrix;
    style['transform'] = matrix;
  };

  var mGrid = function (rootElement, options) {
    if (!(rootElement instanceof window.Element)) {
      throw new Error('rootElement need to be an instance of Element');
    }
    
    this.rootElement = rootElement;
    this.rootElementWidth = rootElement.offsetWidth;

    this.childs = rootElement.children; 

    this.layout();

    // For support plz see http://caniuse.com/#search=querySelectorAll
    var images = rootElement.querySelectorAll('img');
    this.resizeHandler = this.onResize.bind(this);
    for (var i = 0, leni = images.length; i < leni; ++i) {
      images[i].addEventListener('load', this.resizeHandler,false);
      images[i].addEventListener('error', this.resizeHandler,false);
    }

    window.addEventListener('resize', this.resizeHandler, false);
  };

  mGrid.prototype.resizeHandler = null;

  mGrid.prototype.maxColumnsNumber = 4;
  mGrid.prototype.gap = 10; // px

  mGrid.prototype.layout = function () {
    var gap = this.gap;
    var grid = [];
    var item = null;
    var index = null;
    var entry = null;
    var current = null;
    var childs = this.childs;
    var childsLength = childs.length;
    var columns = 1;
    var column = 1;
    var columnWidth = null;
    var prevColumn = null;
    var prevRow = null;

    // Calculate number of columns which fits with current size of root element
    while (((columns+1) * childs[0].offsetWidth) + ((columns) * gap) < this.rootElementWidth) {
      ++columns;
    }



    columns = Math.min(columns, this.maxColumnsNumber);
    columnWidth = Math.floor(this.rootElementWidth / Math.min(columns, childsLength));

    // Calculate and apply proper position for each grid item.
    for (index = 0; index < childsLength; ++index) {
      item = childs[index];

      current = grid[index] = [
        0, // x/left
        0, // y/top
        0, // z
        item.offsetWidth, // width
        item.offsetHeight, // height
        0 // depth
      ];

      prevColumn = grid[index - columns];
      if (prevColumn) {
        current[1] = prevColumn[1] + prevColumn[4] + gap;
      }

      if (column === 1) {
        // >>1 is dividing by 2
        current[0] = (columnWidth>>1) - (current[3]>>1);
      } else {
        prevRow = grid[index - 1];
        if (prevRow) {
          current[0] = prevRow[0] + columnWidth;
        }
      }

      ++column;
      if (column > columns) {
        column = 1;
      }

      tranlateMatrix(item, current);
    }

    // Determine max column height.
    for (var j = 1, currHeight, maxHeight = -Infinity; j <= columns; ++j) {
      currHeight = grid[index-j][1] + grid[index-j][4];
      if (currHeight > maxHeight) {
        maxHeight = currHeight;
      }
    }

    // Assign proper computed height to grid root element.
    this.rootElement.style.height = maxHeight + 'px';
  };

  /**
   * On resize window handler.
   */
  mGrid.prototype.onResizeStartTime = 0; 
  mGrid.prototype.onResizeTimeout = null; 
  mGrid.prototype.onResize = function (event) {
    var time = Date.now();

    if (event && event.target) {
      // it means that resize was triggered by image onload/onerror
      // so cleaning listeners is required
      event.target.removeEventListener('load', this.resizeHandler);
      event.target.removeEventListener('error', this.resizeHandler);
    }

    if (time - this.onResizeStartTime < 200) {
      clearTimeout(this.onResizeTimeout); 
      this.onResizeTimeout = setTimeout(this.onResize.bind(this), 200); // about 2 frames delay
      this.onResizeStartTime = time;
      return;
    }

    console.log('onResize');

    this.onResizeStartTime = time;
    this.rootElementWidth = this.rootElement.offsetWidth;
    this.layout();
  };

  mGrid.prototype.destroy = function () {
    window.removeEventListener('resize', this.resizeHandler);
  };

  window.mGrid = mGrid;

})(this, document);

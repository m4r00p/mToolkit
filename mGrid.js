
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
  
  var tranlateMatrix = function (tx, ty, tz) {
    tx = tx || 0;
    ty = ty || 0;
    tz = tz || 0;
    return 'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0,  1, 0, ' + tx + ', ' + ty + ', ' + tz + ', 1)';
  };

  var mGrid = function (rootElement, options) {
    
    this.rootElement = rootElement;
    this.rootElementWidth = rootElement.offsetWidth;
    this.rootElementHeight = rootElement.offsetHeight;

    this.childs = rootElement.children; 

    this.layout();

    // For support plz see http://caniuse.com/#search=querySelectorAll
    var images = rootElement.querySelectorAll('img');
    for (var i = 0, leni = images.length; i < leni; ++i) {
      images[i].onload = this.onResize.bind(this);
      images[i].onerror = this.onResize.bind(this);
    }

    window.addEventListener('resize', this.onResize.bind(this), false);
  };

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

    for (index = 0; index < childsLength; ++index) {
      item = childs[index];

      current = grid[index] = {
        top: 0,
        left: 0,
        width: item.offsetWidth,
        height: item.offsetHeight
      };

      prevColumn = grid[index - columns];
      if (prevColumn) {
        current.top = prevColumn.top + prevColumn.height + gap;
      }

      if (column === 1) {
        // >>1 is dividing by 2
        current.left = (columnWidth>>1) - (current.width>>1);
      } else {
        prevRow = grid[index - 1];
        if (prevRow) {
          current.left = prevRow.left + columnWidth;
        }
      }

      ++column;
      if (column > columns) {
        column = 1;
      }

      item.style['-webkit-transform'] = tranlateMatrix(current.left, current.top);
    }

  };

  mGrid.prototype.onResize = function () {
    var rootElement = this.rootElement;

    this.rootElementWidth = rootElement.offsetWidth;
    this.rootElementHeight = rootElement.offsetHeight;

    this.layout();
  };

  window.mGrid = mGrid;

})(this, document);

// FIXME: Add this below
// Updated to use a modification of the "returnExportsGlobal" pattern from https://github.com/umdjs/umd
(function (window, documentG, undefined) {
  'use strict';
  /**
   * Polyfills
   */

  if (!Function.prototype.bind) {
    Function.prototype.bind = function (ctx) {
      var that  = this;
      var args  = Array.prototype.slice.call(arguments, 1);

      return function () {
        return that.apply(ctx, args.concat(Array.prototype.slice.call(arguments)));
      };
    };
  }

  /**
   * pollyfill for requestAnimationFrame
   * https://gist.github.com/1579671
   * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
   * http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

   * requestAnimationFrame polyfill by Erik Möller
   * fixes from Paul Irish and Tino Zijdel
   */

  (function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o', ''];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
      window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
      window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
      || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
    window.requestAnimationFrame = function(callback, element) {
      var currTime = +new Date();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
      timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };

    if (!window.cancelAnimationFrame)
    window.cancelAnimationFrame = function(id) {
      clearTimeout(id);
    };
  }());

  /**
   * Helpers
   */

  var tranlateMatrix = function (position) {
    var tx, ty, tz;

    tx = position[0] || 0;
    ty = position[1] || 0;
    tz = position[2] || 0;

    return 'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0,  1, 0, ' + tx.toFixed(1) + ', ' + ty.toFixed(1) + ', ' + tz.toFixed(1) + ', 1)';
  };

  /**
   * Main mScroll code
   *
   * For supported devices plz see @link http://caniuse.com/#search=transforms%20
   */
  var mScroll = function (rootElement, options) {
    if (!(rootElement instanceof window.Element)) {
      throw new Error('rootElement need to be an instance of Element');
    }

    this.rootElement = rootElement;

    // For support plz see http://caniuse.com/#search=querySelectorAll
    this.pageElements = rootElement.querySelectorAll('.mScrollPage');

    this.onResize();
    this.addEventListeners();
  };

  mScroll.prototype.momentumThreshold = 1000; //ms
  mScroll.prototype.snap = true;
  mScroll.prototype.snapXThreshold = 0.1; // percent of root element width
  mScroll.prototype.currentPage = null;
  mScroll.prototype.currentPageNo = 0;
  mScroll.prototype.animating = false;
  mScroll.prototype.easingFn = 'easeOutQuint';
  //mScroll.prototype.easingFn = 'easeOutBounce';
  //mScroll.prototype.easingFn = 'easeOutElastic';

  mScroll.prototype.render = function () {
    var pages = this.pageElements;
    var page = null;

    for (var i = 0, leni = pages.length; i < leni; ++i) {
      page = pages[i];
      page.style['-webkit-transform'] = tranlateMatrix(page.position);
    }
  };

  mScroll.prototype.layout = function (pageNo) {
    pageNo = pageNo || 0;
    var pages = this.pageElements;
    var rootWidth = this.rootElementWidth;

    this.x = -pageNo * rootWidth;
    this.currentPageNo = pageNo;
    this.currentPage = pages[pageNo];

    for (var i = 0, leni = pages.length, page; i < leni; ++i) {
      page = pages[i];
      if (!page.position) {
       page.position = [0, 0, 0];
      }
      page.position = [parseInt(i* rootWidth - (pageNo * rootWidth), 10), parseInt(page.position[1], 10), 0];
    }

    this.render();
  };

  mScroll.prototype.scrollToPage = function (number) {};

  mScroll.prototype.scrollX = function (x) {
    var pages = this.pageElements;
    var page = null;

    this.x += x;

    for (var i = 0, leni = pages.length; i < leni; ++i) {
      page = pages[i];
      page.position[0] += x;
    }  

    this.render();
  };

  mScroll.prototype.scrollY = function (y) {
    if (!this.currentPage) {
      console.warn('this.currentPage does not exists!!!');
      return;
    }

    this.currentPage.position[1] += y;

    this.render();
  };

  mScroll.prototype.scrollTo = function (position) { };

  mScroll.prototype.onTouchStart = function (event) {
    var touch, touches = event.touches;

    if (touches.length == 1) {
      touch = touches[0];
      this.touchStart = this.touchEnd = [touch.pageX, touch.pageY];
      this.touchStartTimeStamp = event.timeStamp || Date.now();
    }
    
    document.querySelectorAll('.header')[0].innerHTML = event.type;     
    event.preventDefault();
    return false;
  };

  mScroll.prototype.onTouchMove = function (event) {
    var touch, touches = event.touches;

    if (touches.length == 1) {
      touch = touches[0];
      
      this.touchMove = [touch.pageX, touch.pageY];
      var dx = this.touchMove[0] - this.touchStart[0];
      var dy = this.touchMove[1] - this.touchStart[1];

      if (Math.abs(dx) >= Math.abs(dy)) {
        this.scrollX(this.touchMove[0] - this.touchEnd[0]);
      } else {
        this.scrollY(this.touchMove[1] - this.touchEnd[1]);
      }

      this.touchEnd = this.touchMove;
    }

    document.querySelectorAll('.header')[0].innerHTML = event.type;     
    event.preventDefault();
    return false;
  };


  mScroll.prototype.snapY = function () {
    var dy = 0;

    if (!this.currentPage) {
      return dy;
    }

    var rootElementHeight = this.rootElementHeight;
    var pageHeight = this.currentPage.offsetHeight; 
    var pageY = -Math.round(this.currentPage.position[1]);


    // don't allow moving above top of page
    if (pageY < 0) {
      dy = pageY; 
    } else if (pageHeight < rootElementHeight + pageY) {
      dy = rootElementHeight + pageY - pageHeight;
    }
    
    return dy;
  };

  mScroll.prototype.snapX = function () {
    var rootElementWidth = this.rootElementWidth;
    var snapXThreshold = rootElementWidth * this.snapXThreshold; 
    var currentPageNo = this.currentPageNo;

    var dx = -(currentPageNo * rootElementWidth) - this.x;

    if (dx >= snapXThreshold) {
      currentPageNo++;
    } else if (dx <= -snapXThreshold) {
      currentPageNo--;
    }

    this.currentPageNo = currentPageNo;

    dx = -(currentPageNo * rootElementWidth) - this.x;

    return dx;
  };

  mScroll.prototype.animate = function (dx, dy) {
    if (this.animating) {
      console.warn('Animation already running!!!');
      return;
    }

    this.animating = true;

    var id;
    var that = this;
    var duration = 500;
    var damping = 1.70158;
    var start = Date.now();
    var time = 0;
    var current = 0;
    var x = 0;
    var x0 = 0;
    var x1 = 0;
    var y = 0;
    var y0 = 0;
    var y1 = 0;

    dx = dx || 0;
    dy = dy || 0;

    (function loop(){
      id = requestAnimationFrame(loop);

      current = time = Date.now() - start;

      if (Math.abs(dx) > 0) {
        //x1 = mEasing['easeOutQuad'](time, start, end, duration, damping);
        x1 = mEasing[that.easingFn](time, 0, dx, duration, damping);
        x  = x1 - x0;
        x0 = x1;
        that.scrollX(x);
      }

      if (Math.abs(dy) > 0) {
        y1 = mEasing[that.easingFn](time, 0, dy, duration, damping);
        y  = y1 - y0;
        y0 = y1;
        that.scrollY(y);
      }

      if (current >= duration) {
        cancelAnimationFrame(id);
        that.animating = false;
        that.layout(that.currentPageNo);
      }
    })();
  };

  mScroll.prototype.onTouchEnd = function (event) {
    var dx = this.snapX();
    var dy = this.snapY();

    //console.log('Snap: x', dx, 'y', dy);

    this.animate(dx, dy);

    document.querySelectorAll('.header')[0].innerHTML = event.type;     
    event.preventDefault(); 
    return false;
  };

  mScroll.prototype.onResize = function (event) {
    var element = this.rootElement;

    this.rootElementWidth = element.offsetWidth;
    this.rootElementHeight = element.offsetHeight;

    this.layout(this.currentPageNo);
  };

  mScroll.prototype.addEventListeners = function () {
    var element = this.rootElement; 
    element.addEventListener('touchstart', this.onTouchStart.bind(this), false);
    element.addEventListener('touchmove', this.onTouchMove.bind(this), false);
    element.addEventListener('touchend', this.onTouchEnd.bind(this), false);

    window.addEventListener('resize', this.onResize.bind(this), false);
  };


  window.mScroll = mScroll;

})(window, document);

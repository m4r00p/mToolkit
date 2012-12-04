// FIXME: Add this below
// Updated to use a modification of the "returnExportsGlobal" pattern from https://github.com/umdjs/umd
(function (window, doc, undefined) {
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

  var tranlateMatrix = function (tx, ty, tz) {
    tx = tx || 0;
    ty = ty || 0;
    tz = tz || 0;
    return 'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0,  1, 0, ' + tx + ', ' + ty + ', ' + tz + ', 1)';
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
    this.rootElementWidth = rootElement.offsetWidth;
    this.rootElementHeight = rootElement.offsetHeight;

    // For support plz see http://caniuse.com/#search=querySelectorAll
    this.pageElements = rootElement.querySelectorAll('.mScrollPage');

    this.layout();
    this.addEventListeners();
  };

  mScroll.prototype.momentumThreshold = 1000; //ms
  mScroll.prototype.snap = true;
  mScroll.prototype.currentPageNo = 0;

  mScroll.prototype.animate = function () {
    var that = this;
    var prev = Date.now();
    var start = prev;
    var timestamp = prev;
    var id = null;

    console.log('animation start');
    (function loop(){
        timestamp = Date.now();
        id = requestAnimationFrame(loop);
        that.render(timestamp - prev);
        prev = timestamp;
        if (Math.abs(that.velocityX) < 0.01) {
          cancelAnimationFrame(id);
          console.log('animation end ' + (prev - start) / 1000);
        }
    })();
  };

  mScroll.prototype.render = function (dt) {
    var i = 0;
    var pages = this.pageElements;
    var size = pages.length;
    var page = null;
    var acceleration = 0.98;

    this.velocityX *= acceleration;

    var x = this.velocityX * dt;

    for (; i < size; ++i) {
      page = pages[i];
      page.x += x;
      page.style['-webkit-transform'] = tranlateMatrix(page.x);
    }
  };

  mScroll.prototype.layout = function () {
    var i = 0;
    var pages = this.pageElements;
    var size = pages.length;
    var page = null;
    var rootWidth = this.rootElementWidth;

    for (; i < size; ++i) {
      page = pages[i];
      page.x = i * rootWidth;
      page.style['-webkit-transform'] = tranlateMatrix(page.x);
    }  
  };

  mScroll.prototype.scrollToPage = function (number) {
    number -= 1; // Page are counted from 0
    this.moveAll(-number * this.rootElementWidth);
  };

  mScroll.prototype.moveAll = function (deltaX) {
    var i = 0;
    var pages = this.pageElements;
    var size = pages.length;
    var page = null;

    for (; i < size; ++i) {
      page = pages[i];
      page.x += deltaX;
      page.style['-webkit-transform'] = tranlateMatrix(page.x); 
    }  
  };

  mScroll.prototype.onTouchStart = function (event) {
    var touch, touches = event.touches;

    if (touches.length == 1) {
      touch = touches[0];
      this.touchEndY = this.touchStartY = touch.pageY;
      this.touchEndX = this.touchStartX = touch.pageX;

      this.touchStartTimeStamp = event.timeStamp || Date.now();
    }
  };

  mScroll.prototype.onTouchMove = function (event) {
    var touch, touches = event.touches;

    if (touches.length == 1) {
      touch = touches[0];
      
      this.touchMoveX = touch.pageX;
      this.touchMoveY = touch.pageY;

      this.moveAll(this.touchMoveX - this.touchEndX);
      this.touchEndX = this.touchMoveX; 
    }

    event.preventDefault();
  };

  mScroll.prototype.onTouchEnd = function (event) {
    var velocityXMax = 2;
    var duration = (event.timeStamp || Date.now()) - this.touchStartTimeStamp;
    var velocityX = (this.touchEndX - this.touchStartX) / duration;

    console.log(velocityX);

    if (velocityX < 0) {
      velocityX = Math.max(velocityX, -velocityXMax);
    } else {
      velocityX = Math.min(velocityX, velocityXMax);
    }

    if (Math.abs(velocityX) > 0.3) {
      this.velocityX = velocityX;
      this.animate();
    }
  };


  mScroll.prototype.onResize = function (event) {
    var element = this.rootElement;

    this.rootElementWidth = element.offsetWidth;
    this.rootElementHeight = element.offsetHeight;

    this.layout();
  };

  mScroll.prototype.addEventListeners = function () {
    var element = this.rootElement; 

    element.addEventListener('touchstart', this.onTouchStart.bind(this), false);
    element.addEventListener('touchmove', this.onTouchMove.bind(this), false);
    element.addEventListener('touchend', this.onTouchEnd.bind(this), false);

    window.addEventListener('resize', this.onResize.bind(this), false);
  };


  window.mScroll = mScroll;

})(this, document);

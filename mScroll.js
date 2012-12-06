// FIXME: Add this below
// Updated to use a modification of the "returnExportsGlobal" pattern from https://github.com/umdjs/umd
(function (window, documentG, undefined) {
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
  mScroll.prototype.animating = false;

  mScroll.prototype.animate = function () {
    if (this.animating) {
      return;
    }
    this.freezed = false;
    this.animating = true;
    var that = this;
    var prev = Date.now();
    var start = prev;
    var timestamp = prev;
    var id = null;

    console.log('animation start');
    (function loop(){
        timestamp = Date.now();
        id = requestAnimationFrame(loop);
        that.integrate(timestamp - prev);
        that.render();
        prev = timestamp;
        if (that.freezed) {
          cancelAnimationFrame(id);
          that.animating = false;
          console.log('animation end ' + (prev - start) / 1000);
        }
    })();
  };

  mScroll.prototype.integrate = function (dt) {
    /*
    var acceleration = 0.98;
    this.velocityX *= acceleration;
    var x = this.velocityX * dt;
    */
    //this.distanceX 
    var x = this.velocityX * dt;

    this.distanceX -= x;

    var pages = this.pageElements;
    for (var i = 0, leni = pages.length, page; i < leni; ++i) {
      page = pages[i];
      page.x += x;
    }

    if (Math.abs(this.distanceX) < 1) {
      this.freezed = true;
    }
  };

  mScroll.prototype.render = function () {
    var pages = this.pageElements;
    var page = null;

    for (var i = 0, leni = pages.length; i < leni; ++i) {
      page = pages[i];
      page.style['-webkit-transform'] = tranlateMatrix(page.x);
    }
  };

  mScroll.prototype.layout = function () {
    var pages = this.pageElements;
    var rootWidth = this.rootElementWidth;

    for (var i = 0, leni = pages.length; i < leni; ++i) {
      pages[i].x = i * rootWidth;
    }

    this.render();
  };

  mScroll.prototype.scrollToPage = function (number) {
    number -= 1; // Page are counted from 0
    //this.moveAll(-number * this.rootElementWidth);
  };

  mScroll.prototype.scrollTo = function (x) {
    var pages = this.pageElements;
    var page = null;

    for (var i = 0, leni = pages.length; i < leni; ++i) {
      page = pages[i];
      page.x += x;
    }  

    this.render();
  };

  mScroll.prototype.onTouchStart = function (event) {
    var touch, touches = event.touches;

    if (touches.length == 1) {
      touch = touches[0];
      this.touchStart = this.touchEnd = [touch.pageX, touch.pageY];
      this.touchStartTimeStamp = event.timeStamp || Date.now();
    }
  };

  mScroll.prototype.onTouchMove = function (event) {
    var touch, touches = event.touches;

    if (touches.length == 1) {
      touch = touches[0];
      
      this.touchMove = [touch.pageX, touch.pageY];
      this.scrollTo(this.touchMove[0] - this.touchEnd[0]);
      this.touchEnd = this.touchMove;
    }

    event.preventDefault();
  };

  mScroll.prototype.onTouchEnd = function (event) {
    
    /*
    var velocityXMax = 2;
    var duration = (event.timeStamp || Date.now()) - this.touchStartTimeStamp;
    var velocityX = (this.touchEndX - this.touchStartX) / duration;

    if (velocityX < 0) {
      velocityX = Math.max(velocityX, -velocityXMax);
    } else {
      velocityX = Math.min(velocityX, velocityXMax);
    }

    if (Math.abs(velocityX) > 0.3) {
      this.velocityX = velocityX;
      this.animate();
    }
    */
   /*
   var snapThreshold = 0.2;
   var pageNo = -Math.round(this.position[0] / this.rootElementWidth);
   var touchDistanceX = this.touchEnd[0] - this.touchStart[0];
   var direction = 1;

   if (Math.abs(touchDistanceX) > this.rootElementWidth * snapThreshold) {
     if (touchDistanceX > 0) {
       direction = -1;
     }

     pageNo = pageNo + 1 * direction;
   } 


   var duration = 300;
   this.distanceX = (-pageNo * this.rootElementWidth) - this.position[0];
   this.velocityX = this.distanceX / duration;
    
   console.log(pageNo, (-pageNo * this.rootElementWidth), this.position[0], this.distanceX, this.velocityX);
   this.animate();
   */
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

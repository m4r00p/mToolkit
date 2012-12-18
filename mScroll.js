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
    var tx = position[0] || 0;
    var ty = position[1] || 0;
    var tz = position[2] || 0;

    return 'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0,  1, 0, ' + tx + ', ' + ty + ', ' + tz + ', 1)';
  };


  var ZERO_EPSILON = 0.5;

  /**
   * Main mScroll code
   *
   * For supported devices plz see @link http://caniuse.com/#search=transforms%20
   */
  var mScroll = function (rootElement, options) {
    //if (!(rootElement instanceof window.Element)) {
      //throw new Error('rootElement need to be an instance of Element');
    //}

    this.rootElement = rootElement;

    // For support plz see http://caniuse.com/#search=querySelectorAll
    this.pageElements = rootElement.querySelectorAll('.mScrollPage');

    //this.particle = new mPhysics.Particle();
    //this.particle.position = mPhysics.vec3.create([0, 0, 0]);
    //this.forceRegistry = new mPhysics.ParticleForceRegistry();
    //this.particle.velocity = mPhysics.vec3.create([1, 0, 0]);
    //this.particle.velocity = mPhysics.vec3.create([0.3, 0, 0]); 
    //this.particle.acceleration = mPhysics.vec3.create([-0.0001, 0, 0]); 
    //this.forceRegistry.add(this.particle, new mPhysics.ParticleGravity([0.1, 0, 0]));
    //this.forceRegistry.add(this.particle, new mPhysics.ParticleAnchoredBungee([100, 0, 0], 0.1, 40));
    //this.forceRegistry.add(this.particle, new mPhysics.ParticleAnchoredSpring([0, 50, 0], 0.1, 40));
    //this.forceRegistry.add(this.particle, new mPhysics.ParticleAnchoredFakeSpring([100, 0, 0], 0.1, 0.5));

    //this.animate();

    this.onResize();
    this.layout();
    this.addEventListeners();
  };


  mScroll.prototype.momentumThreshold = 1000; //ms
  mScroll.prototype.snap = true;
  mScroll.prototype.currentPage = null;
  mScroll.prototype.currentPageNo = 0;
  mScroll.prototype.animating = false;

  mScroll.prototype.animate = function (loop) {
  };

  mScroll.prototype.animate2 = function () {
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
    var dt = 0;
    var dx = 0;
    var velocity = 0;
    var duration = 1000;
    var steps = [];
    console.log('animation start');

    (function loop(){
      id = requestAnimationFrame(loop);

      timestamp = Date.now();
      dt = timestamp - prev; 

      velocity = that.dx / duration;

      dx = velocity * dt;

      that.dx -= dx;
      that.scrollX(dx);

      console.log('asdf ' + velocity, dx, that.dx);
      that.render();
      prev = timestamp;
      if (Math.abs(that.dx) < ZERO_EPSILON) {
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

    for (var i = 0, leni = pages.length; i < leni; ++i) {
      pages[i].position = [i* rootWidth - (pageNo * rootWidth), 0, 0];
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
      var dx = this.touchMove[0] - this.touchEnd[0];
      var dy = this.touchMove[1] - this.touchEnd[1];

      if (Math.abs(dx) >= Math.abs(dy)) {
        this.scrollX(dx);
      } else {
        this.scrollY(dy);
      }

      this.touchEnd = this.touchMove;
    }

    document.querySelectorAll('.header')[0].innerHTML = event.type;     
    event.preventDefault();
    return false;
  };


  mScroll.prototype.snapX = function () {
    var snapThreshold = 0.2; // 20% of page size
    var pageNo = -Math.round(this.x / this.rootElementWidth);
    var touchDistanceX = this.touchEnd[0] - this.touchStart[0];
    var direction = 1;

    if (Math.abs(touchDistanceX) > this.rootElementWidth * snapThreshold) {
      if (touchDistanceX > 0) {
        direction = -1;
      }

      pageNo = pageNo + 1 * direction;
    } 

    var dx = (-pageNo * this.rootElementWidth) - this.x;

    console.log('Snap: ' + dx + ' ' + pageNo);

    var id;
    var that = this;
    var duration = 2000;
    var damping = 1.70158;
    var start = Date.now();
    var time = 0;
    var current = 0;
    var x = 0;
    var x0 = 0;
    var x1 = 0;

    //window.easing = window.easing || 'easeOutBounce';
    window.easing = window.easing || 'easeOutCubic';

    (function loop(){
      id = requestAnimationFrame(loop);

      current = time = Date.now() - start;

      //x1 = mEasing['easeOutQuad'](time, start, end, duration, damping);
      x1 = mEasing[window.easing](time, 0, dx, duration, damping);
      x  = x1 - x0;
      x0 = x1;
      //console.log(current, time, x);
      that.scrollX(x);

      if (current >= duration) {
        cancelAnimationFrame(id);
        that.animating = false;
        //that.layout(pageNo);
        console.log('animation end ' + (time / 1000));
      }
    })();
  };

  mScroll.prototype.onTouchEnd = function (event) {
    this.snapX();

    document.querySelectorAll('.header')[0].innerHTML = event.type;     
    event.preventDefault(); 
    return false;
  };

  mScroll.prototype.onResize = function (event) {
    var element = this.rootElement;

    this.rootElementWidth = element.offsetWidth;
    this.rootElementHeight = element.offsetHeight;
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

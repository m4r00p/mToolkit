// FIXME: Add this below
// Updated to use a modification of the "returnExportsGlobal" pattern from https://github.com/umdjs/umd
(function (window, document, undefined) {
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

    this.options = options;

    this.rootElement = rootElement;

    // For support plz see http://caniuse.com/#search=querySelectorAll
    //this.pageElements = this.rootElement.querySelectorAll('.mScrollPage');
    this.pageElements = {};

    this.addEventListeners();
    this.refreshDimensions();
    this.setCurrentPageNo(0);
  };

  mScroll.prototype.momentumYDurationMultiplier = 2; 
  mScroll.prototype.snap = true;
  mScroll.prototype.snapDuration = 500; // ms
  mScroll.prototype.snapXThreshold = 0.1; // percent of root element width
  mScroll.prototype.minPage = -Infinity;
  mScroll.prototype.maxPage = Infinity;
  mScroll.prototype.pageRangeOffset = 1;
  mScroll.prototype.currentPage = null;
  mScroll.prototype.currentPageNo = null;
  mScroll.prototype.animating = false;
  mScroll.prototype.easingFn = mEasing['easeOutQuint']; // linear, easeOutBounce, easeOutElastic... (and about 30 more);

  mScroll.prototype.determinePageRange = function (pageNo) {
    var range = [];
    var min = Math.max(this.minPage, pageNo - this.pageRangeOffset);
    var max = Math.min(this.maxPage, pageNo + this.pageRangeOffset);

    for (var i = min; i <= max; ++i) {
      range[range.length] = i.toString();
    }

    return range;
  };

  mScroll.prototype.showPage = function (pageNo) {
    var pages = this.pageElements;
    var range = this.determinePageRange(pageNo);

    this.disposePageOutOfRange(range);
    this.renderPageInRange(range);

    this.currentPage = pages[pageNo];
  };

  mScroll.prototype.disposePageOutOfRange = function (range) {
    var renderedPageRange = Object.keys(this.pageElements);
    var rootElement = this.rootElement;
    var options = this.options;

    for (var i = 0, leni = renderedPageRange.length, pageNo; i < leni; ++i) {
      pageNo = renderedPageRange[i];
      if (range.indexOf(pageNo) === -1) {
        rootElement.removeChild(this.pageElements[pageNo]);
        delete this.pageElements[pageNo];
        if (options.onDisposePage) {
          options.onDisposePage(pageNo);
        }
      }
    }
  };

  mScroll.prototype.renderPageInRange = function (range) {
    var renderedPageRange = Object.keys(this.pageElements);
    var rootElement = this.rootElement;
    var rootElementWidth = this.rootElementWidth;
    var options = this.options;

    for (var i = 0, leni = range.length, pageNo, page; i < leni; ++i) {
      pageNo = range[i];
      if (renderedPageRange.indexOf(pageNo) === -1) {
        page = document.createElement('div');
        page.className = 'mScrollPage'; 
        rootElement.appendChild(page);
        this.pageElements[pageNo] = page;

        if (options.onRenderPage) {
          options.onRenderPage(page, pageNo);
        }
      }
    }
  };

  //document.querySelectorAll('.header')[0].innerHTML = 'page: ' + pageNo;     
  mScroll.prototype.setCurrentPageNo = function (pageNo) {
    if (this.currentPageNo != pageNo) {

      this.currentPageNo = pageNo;
      this.showPage(pageNo);

      this.layout();
    } 
  };

  mScroll.prototype.layout = function () {
    var pageNo = this.currentPageNo;
    var pages = this.pageElements;
    var keys = Object.keys(pages);
    var rootWidth = this.rootElementWidth;

    this.x = -this.currentPageNo * rootWidth;

    for (var i = 0, leni = keys.length, page; i < leni; ++i) {
      pageNo = keys[i];
      page = pages[pageNo];

      if (!page.position) {
        page.position = [0, 0, 0];
      }

      page.position = [+(this.x + (pageNo * rootWidth)).toFixed(1), +page.position[1].toFixed(1), 0];
      page.style['-webkit-transform'] = tranlateMatrix(page.position);
    }
  };

  mScroll.prototype.scrollToPage = function (number) {};

  mScroll.prototype.scrollX = function (x) {
    var pages = this.pageElements;
    var keys = Object.keys(pages);
    var page = null;

    this.x += x;

    for (var i = 0, leni = keys.length; i < leni; ++i) {
      page = pages[keys[i]];
      page.position[0] += x;
      page.style['-webkit-transform'] = tranlateMatrix(page.position);
    }  
  };

  mScroll.prototype.scrollY = function (y) {
    if (!this.currentPage) {
      console.warn('this.currentPage does not exists!!!');
      return;
    }
    var page = this.currentPage;

    page.position[1] += y;
    page.style['-webkit-transform'] = tranlateMatrix(page.position);
  };

  mScroll.prototype.scrollTo = function (position) { };

  mScroll.prototype.onTouchStart = function (event) {
    var touch, touches = event.touches;

    if (touches.length == 1) {
      touch = touches[0];
      this.touchStart = this.touchEnd = [touch.pageX, touch.pageY];
      this.touchStartTime = event.timeStamp || Date.now();
    }
    
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

    event.preventDefault();
    return false;
  };

  mScroll.prototype.onSnapAnimationEnd = function (pageNo) {
    this.setCurrentPageNo(pageNo);
  };

  mScroll.prototype.onMomentumAnimationEnd = function () {
    var snapX = this.snapX();
    var dx = snapX[0];
    var dy = this.snapY();
    var pageNo = snapX[1];

    this.animate(dx, dy, this.snapDuration, this.onSnapAnimationEnd.bind(this, pageNo));
  };

  /**
   * Touch end event handler.
   *
   * It determines if any momentum should be apply to page y-axsis.
   * And applies snapping after momentum or instead if there is no momenutm.
   */
  mScroll.prototype.onTouchEnd = function (event) {
    var momentumY = this.momentumY(event);

    event.preventDefault(); 
    return false;
  };

  mScroll.prototype.snapX = function () {
    var rootElementWidth = this.rootElementWidth;
    var snapXThreshold = rootElementWidth * this.snapXThreshold; 
    var currentPageNo = this.currentPageNo;

    var dx = -(currentPageNo * rootElementWidth) - this.x;

    if (dx >= snapXThreshold && currentPageNo + 1 <= this.maxPage) {
      currentPageNo++;
    } else if (dx <= -snapXThreshold && currentPageNo - 1 >= this.minPage) {
      currentPageNo--;
    }

    // Only make sense to recompute dx if currentPageNo was changed
    if (this.currentPageNo !== currentPageNo) {
      dx = -(currentPageNo * rootElementWidth) - this.x;
    }

    return [dx, currentPageNo];
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

  mScroll.prototype.momentumY = function (event) {
    var duration = (event.timeStamp || Date.now()) - this.touchStartTime;
    var snapY = this.snapY();
    var dy = 0;

    if (Math.abs(snapY) == 0 && duration < 300) {
      var velocity = (this.touchEnd[1] - this.touchStart[1]) / duration;
      var time = duration * this.momentumYDurationMultiplier; 
      var abs = Math.abs(velocity);
      var maxVelocity = 1;

      if (abs > 0.3) {
        if (abs > maxVelocity) {
          velocity = velocity > 0 ? maxVelocity : -maxVelocity;
        }
        dy = velocity * time;
      }
    }

    if (Math.abs(dy) > 0) {
      this.animate(0, dy, time, this.onMomentumAnimationEnd.bind(this), mEasing['easeOutQuad']);
    } else {
      this.onMomentumAnimationEnd();
    }

    return dy;
  };

  mScroll.prototype.animate = function (dx, dy, duration, onEnd, easingFn) {
    if (this.animating) {
      console.warn('Animation already running!!!');
      return;
    }

    this.animating = true;

    var id;
    var that = this;
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
    duration = duration || 250;
    easingFn = easingFn || this.easingFn;

    (function loop(){
      id = requestAnimationFrame(loop);

      current = time = Date.now() - start;

      if (Math.abs(dx) > 0) {
        x1 = easingFn(time, 0, dx, duration, damping);
        x  = x1 - x0;
        x0 = x1;
        that.scrollX(x);
      }

      if (Math.abs(dy) > 0) {
        y1 = easingFn(time, 0, dy, duration, damping);
        y  = y1 - y0;
        y0 = y1;
        that.scrollY(y);
      }

      if (current >= duration) {
        cancelAnimationFrame(id);
        that.animating = false;
        if (typeof onEnd === 'function') {
          onEnd();
        }
      }
    })();
  };

  mScroll.prototype.refreshDimensions = function () {
    var element = this.rootElement;

    this.rootElementWidth = element.offsetWidth;
    this.rootElementHeight = element.offsetHeight;
  };

  mScroll.prototype.onResize = function (event) {
    this.refreshDimensions();
    this.layout();
  };

  mScroll.prototype.addEventListeners = function () {
    var element = this.rootElement; 
    element.addEventListener('touchstart', this.onTouchStart.bind(this), false);
    element.addEventListener('touchmove', this.onTouchMove.bind(this), false);
    element.addEventListener('touchend', this.onTouchEnd.bind(this), false);

    this.resizeHandler = this.onResize.bind(this);
    window.addEventListener('resize', this.resizeHandler, false);
  };

  mScroll.prototype.destroy = function () {
    window.removeEventListener('resize', this.resizeHandler);
  };

  window.mScroll = mScroll;

})(window, document);

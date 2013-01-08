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

  var translateMatrix = function (element, position) {
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
    this.pageElements = {};

    if (typeof options.minPage != 'undefined') {
      this.minPage = options.minPage;
    }
    if (typeof options.maxPage != 'undefined') {
      this.maxPage = options.maxPage;
    }

    this.createScrollBar();
    this.addEventListeners();
    this.refreshDimensions();
    this.setCurrentPageNo(0);
  };

  mScroll.prototype.isDesktop = !(/android|iphone|ipad/gi).test(navigator.appVersion);
  mScroll.prototype.touchVelocity = [0, 0];
  mScroll.prototype.momentumX = false;
  mScroll.prototype.momentumY = true;
  mScroll.prototype.momentumDamping = 0.9;

  mScroll.prototype.snapDuration = 500; // ms
  mScroll.prototype.snapXThreshold = 0.1; // percent of root element width
  mScroll.prototype.minPage = -Infinity;
  mScroll.prototype.maxPage = Infinity;
  mScroll.prototype.pageRangeOffset = 1;
  mScroll.prototype.currentPage = null;
  mScroll.prototype.currentPageNo = null;
  mScroll.prototype.animating = false;
  mScroll.prototype.easingFn = mEasing['easeOutQuint']; // linear, easeOutQuint, easeOutBounce, easeOutElastic... (and about 30 more);

  mScroll.prototype.createScrollBar = function () {
    var bar = this.scrollBar = document.createElement('div');
    bar.className = "mScrollBar";
    bar.appendChild(document.createElement('div'));
    this.rootElement.appendChild(bar);

    if (this.isDesktop) {
      bar.style.width = '10px';
    }
  };

  mScroll.prototype.onScrollBarMouseDown = function (event) {
    var that = this;
    var offsetY = event.offsetY;
    var pageHeight = this.currentPage.offsetHeight; 
    var direction = 0;

    if (offsetY < this.scrollBarTop) {
      direction = 1;
    } else if (offsetY > this.scrollBarTop + this.scrollBarHeight) {
      direction = -1;
    } else {
      // mouse down was generated in bounds of indicator.
      return false; 
    }
    
    var id = setInterval(function () {
      if ((direction === 1 && offsetY < that.scrollBarTop + that.scrollBarHeight * 0.5) ||
        (direction === -1 && offsetY > that.scrollBarTop + that.scrollBarHeight * 0.5)) {
        that.scrollY(0.03 * pageHeight * direction);
      } else {
        onMouseUp();
      }
    }, 16);

    var onMouseUp = function () {
      clearInterval(id);
      window.removeEventListener('mouseup', onMouseUp, this);
      if (that.isSnap()) {
        that.snap();
      }

      event.preventDefault();
      event.stopPropagation();
      return false;
    };

    window.addEventListener('mouseup', onMouseUp, this);

    event.preventDefault();
    event.stopPropagation();
    return false;
  };

  mScroll.prototype.onScrollBarIndicatorMouseDown = function (event) {
    var that = this;
    var rootElementHeight = this.rootElementHeight;
    var pageHeight = this.currentPage.offsetHeight; 

    this.mouseEnd = [event.pageX, event.pageY];

    var onMouseMove = function (event) {
      that.mouseMove = [event.pageX, event.pageY];
      that.scrollY(pageHeight * (that.mouseEnd[1] - that.mouseMove[1]) / rootElementHeight);

      that.mouseEnd = that.mouseMove;

      event.preventDefault();
      event.stopPropagation();
      return false;
    };

    var onMouseUp = function () {
      if (that.isSnap()) {
        that.snap();
      }
      window.removeEventListener('mousemove', onMouseMove, this);
      window.removeEventListener('mouseup', onMouseUp, this);

      event.preventDefault();
      event.stopPropagation();
      return false;
    };

    window.addEventListener('mousemove', onMouseMove, this);
    window.addEventListener('mouseup', onMouseUp, this);

    event.preventDefault();
    event.stopPropagation();
    return false;
  };

  mScroll.prototype.hideScrollBar = function () {
    this.scrollBar.style.display = 'none';
  };

  mScroll.prototype.showScrollBar = function () {
    this.scrollBar.style.display = 'block';
  };

  mScroll.prototype.refreshScrollBar = function () {
    var rootElementHeight = this.rootElementHeight;
    var pageHeight = this.currentPage.offsetHeight; 
    var pageY = -Math.round(this.currentPage.position[1]);
    var style = this.scrollBar.firstChild.style;
    var bottom = null;
    var margin = 5;


    var height = parseInt(rootElementHeight * rootElementHeight/pageHeight, 10); 
    var top = parseInt(pageY * rootElementHeight / pageHeight, 10);

    if (top <= margin) {
      height = height + top;
      top = margin;
    } else if (top + height + margin >= rootElementHeight) {
      height = height + (rootElementHeight - (top + height));
      top -= margin;
    } 

    this.scrollBarTop = top;
    this.scrollBarHeight = height;

    style.top = top + 'px';
    style.height = height + 'px';
  };

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
        if (options.onDisposePage) {
          options.onDisposePage(pageNo);
        }
        rootElement.removeChild(this.pageElements[pageNo]);
        delete this.pageElements[pageNo];
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

  mScroll.prototype.setCurrentPageNo = function (pageNo) {
    if (this.currentPageNo != pageNo) {

      this.currentPageNo = pageNo;
      this.showPage(pageNo);

      this.layout();

      this.refreshScrollBar();
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
      translateMatrix(page, page.position);
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
      translateMatrix(page, page.position);
    }  
  };

  mScroll.prototype.scrollY = function (y) {
    if (!this.currentPage) {
      console.warn('this.currentPage does not exists!!!');
      return false;
    }
    var page = this.currentPage;

    page.position[1] += y;
    translateMatrix(page, page.position);
    this.refreshScrollBar();
    return true;
  };

  mScroll.prototype.scrollYTop = function () {
    if (!this.currentPage) {
      console.warn('this.currentPage does not exists!!!');
      return false;
    }
    var page = this.currentPage;

    page.position[1] = 0;
    translateMatrix(page, page.position);
    this.refreshScrollBar();
    return true;
  };

  mScroll.prototype.scrollTo = function (position) { };

  mScroll.prototype.onTouchStart = function (event) {
    var touch, touches = event.touches, target = event.target;

    if (touches.length == 1) {
      touch = touches[0];

      this.touchMove = [[touch.pageX, touch.pageY, event.timeStamp || Date.now()]];

      if (!this.animating) {
        this.lockDirection = null;
      }

      this.stop();
    }

    return true;
  };

  mScroll.prototype.onTouchMove = function (event) {
    var dx, dy, touch, touches = event.touches;
    var touchMove = this.touchMove;
    var length = touchMove.length;
    var max = 5;

    if (touches.length == 1) {
      touch = touches[0];

      if (length > max) {
        touchMove.shift();
      }

      length = touchMove.length;

      touchMove[length] = [touch.pageX, touch.pageY, event.timeStamp || Date.now()];

      if (this.lockDirection === null) {
        dx = touchMove[length][0] - this.touchMove[length - 1][0];
        dy = touchMove[length][1] - this.touchMove[length - 1][1];

        if (Math.abs(dx) >= Math.abs(dy)) {
          this.lockDirection = 0; // x
        } else {
          this.lockDirection = 1; // y
        }
      } else if (this.lockDirection === 0) {
        this.scrollX(touchMove[length][0] - touchMove[length - 1][0]);
      } else if (this.lockDirection === 1) {
        this.scrollY(touchMove[length][1] - touchMove[length - 1][1]);
      }
    }

    event.preventDefault();
    return false;
  };

  /**
   * Touch end event handler.
   *
   * It determines if any momentum should be apply to page y-axsis.
   * And applies snapping after momentum or instead if there is no momenutm.
   */
  mScroll.prototype.onTouchEnd = function (event) {
    var touchMove = this.touchMove;
    var length = touchMove.length; 
    var last = touchMove[length - 1];
    var oneBeforeLast = touchMove[length - 2];
    var first = touchMove[0];

    if (!last || !first || !oneBeforeLast) {
      console.warn('Move event missing!!!');
      return true; 
    }

    var duration = last[2] - oneBeforeLast[2];
    var maxDelay = 50; // ms

    this.touchVelocity = [0, 0];

    if (duration < maxDelay && duration != 0) {
      if (this.lockDirection === 0 && this.momentumX) {
        this.touchVelocity[0] = (last[0] - first[0]) / (last[2] - first[2]);
      } else if (this.lockDirection === 1 && this.momentumY) {
        this.touchVelocity[1] = (last[1] - first[1]) / (last[2] - first[2]);
      }
    }

    this.momentum();

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

    if (pageY < 0 || pageHeight < rootElementHeight) {
      // snap to top page
      dy = pageY; 
    } else if (pageHeight < rootElementHeight + pageY) {
      // snap to bottom
      dy = rootElementHeight + pageY - pageHeight;
    }
    
    return [dy, 0];
  };

  mScroll.prototype.momentum = function () {
    if (this.animating) {
      console.warn('Animation already running!!!');
      return false;
    }
    this.animating = true;

    var that = this;
    var now = Date.now();
    var previous = now - 16; // 1 frame ago
    var damping = this.momentumDamping;
    var velocity = this.touchVelocity;
    var x, y, t, stepDistance;
    var thresholdDistance = 0.1;

    (function loop() {
      that.animationId = requestAnimationFrame(loop);

      // times 
      now = Date.now();
      t = now - previous;

      // x/y translation
      x = (velocity[0] *= damping) * t; 
      y = (velocity[1] *= damping) * t; 

      stepDistance = Math.sqrt(x*x + y*y);

      if (that.isSnap()) {
        damping -= damping * 0.005;
      }

      // end animation condition
      if (stepDistance < thresholdDistance) {
        cancelAnimationFrame(that.animationId);
        that.animating = false;
        that.snap();
      } else {
        that.scrollX(x);
        that.scrollY(y);

        previous = now;
      }
    })();

    return true;
  };

  mScroll.prototype.isSnap = function () {
    var snapX = this.snapX();
    var snapY = this.snapY();

    if (snapX[0] === 0 && snapY[0] === 0) {
      return false;
    }

    return true;
  };

  mScroll.prototype.snap = function (options) {
    if (this.animating) {
      console.warn('Animation already running!!!');
      return false;
    }

    options = options || {};

    var that = this;
    var snapX = this.snapX();
    var snapY = this.snapY();
    var dx = snapX[0];
    var dy = snapY[0];
    var pageX = snapX[1];
    var pageY = snapY[1];
    var id, x, y, x1, y1;
    var x0 = 0;
    var y0 = 0;
    var duration = options.duration || this.snapDuration;
    var current, time, start = Date.now();
    var damping = 0;
    var easingFn = this.easingFn;

    if (dx === 0 && dy === 0) {
      return false;
    } else {
      this.animating = true;

      if (this.currentPageNo != pageX) {
        this.options.onBeforeSnapX && this.options.onBeforeSnapX(this.currentPageNo, pageX);
      }

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
          that.setCurrentPageNo(pageX);
        }

      })();
      return true;
    }
  };

   mScroll.prototype.stop = function () {
    cancelAnimationFrame(this.animationId);
    this.animating = false;
    this.touchVelocity = [0, 0];
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


  mScroll.prototype.onMouseWheel = function (event) {
    var that = this;
    var deltaY = event.wheelDeltaY;
    var now = event.timeStamp || Date.now();
    var mouseWheel = this.mouseWheel = this.mouseWheel || [[0, deltaY, now]];
    var length = mouseWheel.length;

    if (length > 2) {
      mouseWheel.shift();
    }

    if (length > 0) {
      length = mouseWheel.length;
      var last = mouseWheel[length] = [0, deltaY, now];
      var oneBeforeLast =mouseWheel[length-1];

      var y = (oneBeforeLast[1] + last[1]) / (last[2] - oneBeforeLast[2]);

      if (!isNaN(y) && isFinite(y)) {
        this.scrollY(y);
      }

      clearTimeout(this.mouseWheelTimeoutId); 
      this.mouseWheelTimeoutId = setTimeout(function () {
        that.snap();
      }, 100);  
    }

    event.preventDefault();
    return false;
  };

  mScroll.prototype.addEventListeners = function () {
    var element = this.rootElement; 
    element.addEventListener('touchstart', this.onTouchStart.bind(this), false);
    element.addEventListener('touchmove', this.onTouchMove.bind(this), false);
    element.addEventListener('touchend', this.onTouchEnd.bind(this), false);

    this.resizeHandler = this.onResize.bind(this);
    window.addEventListener('resize', this.resizeHandler, false);


    var bar = this.scrollBar;
    if (this.isDesktop) {
      bar.addEventListener('mousedown', this.onScrollBarMouseDown.bind(this), false);
      bar.firstChild.addEventListener('mousedown', this.onScrollBarIndicatorMouseDown.bind(this), false);

      element.addEventListener('mousewheel', this.onMouseWheel.bind(this), false);
    }
  };

  mScroll.prototype.destroy = function () {
    window.removeEventListener('resize', this.resizeHandler);
  };

  window.mScroll = mScroll;

})(window, document);

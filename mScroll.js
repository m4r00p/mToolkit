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

    this.createScrollBar();

    this.addEventListeners();
    this.refreshDimensions();
    this.setCurrentPageNo(0);
  };

  mScroll.prototype.isDesktop = !(/android|iphone|ipad/gi).test(navigator.appVersion);
  mScroll.prototype.touchVelocity = [0, 0];

  mScroll.prototype.snap = true;
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
      bar.addEventListener('mousedown', this.onScrollBarMouseDown.bind(this), false);
      bar.firstChild.addEventListener('mousedown', this.onScrollBarIndicatorMouseDown.bind(this), false);
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
      return; 
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
      that.onMomentumAnimationEnd();

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
      that.onMomentumAnimationEnd();
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
    this.refreshScrollBar();
  };

  mScroll.prototype.scrollTo = function (position) { };

  mScroll.prototype.onTouchStart = function (event) {
    var touch, touches = event.touches;

    if (touches.length == 1) {
      touch = touches[0];

      this.touchMove = [[touch.pageX, touch.pageY, event.timeStamp || Date.now()]];

      if (!this.animating) {
        this.lockDirection = null;
      }

      this.stop();
    }
    
    event.preventDefault();
    return false;
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
    //var twoBeforeLast = touchMove[length - 3];
    var first = touchMove[0];

    if (!last || !first) {
      console.warn('Move event missing!!!');
      return; 
    }

    var duration = last[2] - first[2];
    var maxDelay = 110; // ms

    this.touchVelocity = [0, 0];

    if (duration < maxDelay && duration != 0) {
      if (this.lockDirection === 0) {
        this.touchVelocity[0] = (last[0] - first[0]) / duration;
      } else {
        this.touchVelocity[1] = (last[1] - first[1]) / duration;
      }
    }

    console.log('touchVelocity', duration, this.touchVelocity);
    //console.log('touchVelocity');

    this.animate2();

    event.preventDefault(); 
    return false;
  };

  mScroll.prototype.onSnapAnimationEnd = function (pageNo) {
    this.setCurrentPageNo(pageNo);
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



  mScroll.prototype.animate2 = function (dx, dy, duration, onEnd, easingFn) {
    if (this.animating) {
      alert('Animation already running!!!');
      console.warn('Animation already running!!!');
      return;
    }
    this.animating = true;
    this.animationId = null;

    var that = this;
    var now = Date.now();
    var time = 0;
    var current = 0;
    var previous = now - 16; // one frame ago
    var t = 0;
    var x = 0;
    var y = 0;
    var velocity = that.touchVelocity;
    var damping = 0.97;
    var lowestTranslation = 0.1;
    // snap y 
    var page = this.currentPage;
    var currentPageNo = this.currentPageNo;
    var rootWidth = this.rootElementWidth;
    var rootHeight = this.rootElementHeight;
    var pageHeight = page.offsetHeight; 
    var pageY = -Math.round(page.position[1]);
    var snapX = 0;
    var snapY = 0;
    var snapStartX = false;
    var snapStartY = false;
    var snapEndX = true;
    var snapEndY = true;
    var snapDuration = 500;
    var snapStart = 0;
    var y0 = 0;
    var y1 = 0;
    var snapXThreshold = rootWidth * this.snapXThreshold; 
    var x0 = 0;
    var x1 = 0;


    easingFn = easingFn || this.easingFn;


    (function loop(){
      that.animationId = requestAnimationFrame(loop);

      // times 
      now = Date.now();
      t = now - previous;

      // momentum
      //x = (velocity[0] *= damping) * t; 
      //y = (velocity[1] *= damping) * t; 
      y = 0;
      x = 0;

      // snap y-axsis
      pageY = -Math.round(page.position[1]);
      if (pageY < 0) {
        if (!snapStartY) {
          snapY = pageY;
          snapStart = now;
          snapStartY = true;
          snapEndY = false;
        }
      } else if (pageHeight < rootHeight + pageY) {
        if (!snapStartY) {
          snapY = rootHeight + pageY - pageHeight;
          snapStart = now;
          snapStartY = true;
          snapEndY = false;
        }
      } else if (snapStartY) {
        snapEndY = true;
      }

      if (snapStartY && !snapEndY) {
        y1 = easingFn(now - snapStart, 0, snapY, snapDuration, 0);
        y += y1 - y0;
        y0 = y1;
      }

      // snap x-axsis
      snapX = -(currentPageNo * rootWidth) - that.x;
      console.log(snapX, currentPageNo, rootWidth, that.x);
      if (!snapStartX && snapX >= snapXThreshold && currentPageNo + 1 <= that.maxPage) {
        currentPageNo++;
      } else if (!snapStartX && snapX <= -snapXThreshold && currentPageNo - 1 >= that.minPage) {
        currentPageNo--;
      } else if (snapStartX) {
        snapEndX = true;
      }

      if (!snapStartX && that.currentPageNo !== currentPageNo) {
        snapX = -(currentPageNo * rootWidth) - that.x;

        console.log('asdf');
        snapStart = now;
        snapStartX = true;
        snapEndX = false;
      }

      if (snapStartX) {
        console.log('easing');
        x1 = easingFn(now - snapStart, 0, snapX, snapDuration, 0);
        x  = x1 - x0;
        x0 = x1;
      }

      console.log(now - snapStart > snapDuration);

      //return [dx, currentPageNo];


      that.scrollX(x);
      that.scrollY(y);
      previous = now;

      //console.log('x', x, 'y', y, 'snap', snapY);
      // end animation condition
      if ((Math.sqrt(x*x + y*y) < 0.1 && !snapStartX && !snapStartY) || (snapEndX && snapEndY) || now - snapStart > snapDuration) {
        console.log('animation end');
        cancelAnimationFrame(that.animationId);
        that.animating = false;
        if (typeof onEnd === 'function') {
          onEnd();
        }
      }
    })();
  };

  mScroll.prototype.stop = function () {
    cancelAnimationFrame(this.animationId);
    this.animating = false;
    this.touchVelocity = [0, 0];
  };

  mScroll.prototype.animate = function (dx, dy, duration, onEnd, easingFn) {
    if (this.animating) {
      console.warn('Animation already running!!!');
      return;
    }

    this.animating = true;

    var id;
    var that = this;
    var start = Date.now();
    var time = 0;
    var current = 0;
    var damping = 1.70158;
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

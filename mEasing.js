var mEasing = {

  linear: function (time, start, end, duration) {
    return (end * (time /= duration)) + start;
  },

  easeInQuad: function (time, start, end, duration) {
    return end * (time /= duration) * time + start;
  },

  easeOutQuad: function (time, start, end, duration) {
    return -end * (time /= duration) * (time - 2) + start;
  },

  easeInOutQuad: function (time, start, end, duration) {
    if ((time /= duration / 2) < 1) {
      return end / 2 * time * time + start;
    } else {
      return -end / 2 * ((--time) * (time - 2) - 1) + start;
    }
  },

  easeInCubic: function (time, start, end, duration) {
    return end * (time /= duration) * time * time + start;
  },

  easeOutCubic: function (time, start, end, duration) {
    return end * ((time = time / duration - 1) * time * time + 1) + start;
  },

  easeInOutCubic: function (time, start, end, duration) {
    if ((time /= duration / 2) < 1) {
      return end / 2 * time * time * time + start;
    } else {
      return end / 2 * ((time -= 2) * time * time + 2) + start;
    }
  },

  easeInQuart: function (time, start, end, duration) {
    return end * (time /= duration) * time * time * time + start;
  },

  easeOutQuart: function (time, start, end, duration) {
    return -end * ((time = time / duration - 1) * time * time * time - 1) + start;
  },

  easeInOutQuart: function (time, start, end, duration) {
    if ((time /= duration/2) < 1) {
      return end / 2 * time * time * time * time + start;
    } else {
      return -end / 2 * ((time -= 2) * time * time * time - 2) + start;
    }
  },

  easeInQuint: function (time, start, end, duration) {
    return end * (time /= duration) * time * time * time * time + start;
  },

  easeOutQuint: function (time, start, end, duration) {
    return end * ((time = time / duration - 1) * time * time * time * time + 1) + start;
  },

  easeInOutQuint: function (time, start, end, duration) {
    if ((time /= duration/2) < 1) {
      return end / 2 * time * time * time * time * time + start;
    } else {
      return end / 2 * ((time -= 2) * time * time * time * time + 2) + start;
    }
  },

  easeInSine: function (time, start, end, duration) {
    return -end * Math.cos(time / duration * (Math.PI / 2)) + end + start;
  },

  easeOutSine: function (time, start, end, duration) {
    return end * Math.sin(time / duration * (Math.PI / 2)) + start;
  },

  easeInOutSine: function (time, start, end, duration) {
    return -end / 2 * (Math.cos(Math.PI * time / duration) - 1) + start;
  },

  easeInExpo: function (time, start, end, duration) {
    if (time == 0) {
      return start;
    } else {
      return end * Math.pow(2, 10 * (time / duration - 1)) + start;
    }
  },

  easeOutExpo: function (time, start, end, duration) {
    if (time == duration) {
      return start + end;
    } else {
      return end * (-Math.pow(2, -10 * time / duration) + 1) + start
    }
  },

  easeInOutExpo: function (time, start, end, duration) {
    if (time == 0) {
      return start;
    } else if (time == duration) {
      return start + end;
    } else if ((time /= duration / 2) < 1) {
      return end / 2 * Math.pow(2, 10 * (time - 1)) + start;
    } else {
      return end / 2 * (-Math.pow(2, -10 * --time) + 2) + start;
    }
  },

  easeInCirc: function (time, start, end, duration) {
    return -end * (Math.sqrt(1 - (time /= duration) * time) - 1) + start;
  },

  easeOutCirc: function (time, start, end, duration) {
    return end * Math.sqrt(1 - (time = time / duration - 1) * time) + start;
  },

  easeInOutCirc: function (time, start, end, duration) {
    if ((time /= duration/2) < 1) {
      return -end / 2 * (Math.sqrt(1 - time * time) - 1) + start;
    } else {
      return end / 2 * (Math.sqrt(1 - (time -= 2)* time) + 1) + start;
    }
  },

  easeInElastic: function (time, start, end, duration, damping) {
    var p = 0;
    var a = end;

    if (typeof damping === 'undefined') {
      damping = 1.70158;
    }

    if (time == 0) {
      return start;
    }

    if ((time /= duration) == 1) {
      return start + end;
    }

    if (!p) {
      p = duration * 0.3;
    } 

    if (a < Math.abs(end)) {
      a = end;
      damping = p / 4;
    } else {
      damping = p / (2 * Math.PI) * Math.asin(end / a);
    }

    return -(a * Math.pow(2, 10 * (time -= 1)) * Math.sin((time * duration - damping) * (2 * Math.PI) / p)) + start;
  },

  easeOutElastic: function (time, start, end, duration, damping) {
    var p = 0;
    var a = end;

    if (typeof damping === 'undefined') {
      damping = 1.70158;
    }

    if (time == 0) {
      return start;
    }

    if ((time /= duration) == 1) {
      return start + end;
    }

    if (!p){
      p = duration * 0.3;
    } 

    //if (a < Math.abs(end)) {
      //a = end;
      //damping = p / 4;
    //} else {
      //damping = p / (2 * Math.PI) * Math.asin(end / a);
    //}

    return a * Math.pow(2, -10 * time) * Math.sin((time * duration - damping) * (2 * Math.PI) / p) + end + start;
  },

  easeInOutElastic: function (time, start, end, duration, damping) {
    var p = 0;
    var a = end;

    if (typeof damping === 'undefined') {
      damping = 1.70158;
    }

    if (time == 0) {
      return start;
    }

    if ((time /= duration / 2) == 2) {
      return start + end;
    }

    if (!p) {
      p = duration * (0.3 * 1.5);
    }

    if (a < Math.abs(end)) { 
      a = end;
      damping = p / 4; 
    } else {
      damping = p / (2 * Math.PI) * Math.asin(end / a);
    }

    if (time < 1) {
      return -0.5 * (a * Math.pow(2, 10 * (time -= 1)) * Math.sin((time * duration - damping) * (2 * Math.PI) / p)) + start;
    } else {
      return a * Math.pow(2, -10 * (time -= 1)) * Math.sin((time * duration - damping) * (2 * Math.PI) / p) * 0.5 + end + start;
    }
  },

  easeInBack: function (time, start, end, duration, damping) {
    if (typeof damping === 'undefined') {
      damping = 1.70158;
    }

    return end * (time /= duration) * time * ((damping + 1) * time - damping) + start;
  },

  easeOutBack: function (time, start, end, duration, damping) {
    if (typeof damping === 'undefined') {
      damping = 1.70158;
    }
    return end * ((time = time / duration - 1) * time * ((damping + 1) * time + damping) + 1) + start;
  },

  easeInOutBack: function (time, start, end, duration, damping) {
    if (typeof damping === 'undefined') {
      damping = 1.70158;
    }

    if ((time /= duration / 2) < 1) {
      return end / 2 * (time * time * (((damping *= (1.525)) + 1) * time - damping)) + start;
    } else {
      return end / 2 * ((time -= 2)* time *(((damping *= (1.525)) + 1) * time + damping) + 2) + start;
    }
  },

  easeInBounce: function (time, start, end, duration) {
    return end - this.easeOutBounce(duration - time, 0, end, duration) + start;
  },

  easeOutBounce: function (time, start, end, duration) {
    if ((time /= duration) < (1 / 2.75)) {
      return end * (7.5625 * time * time) + start;
    } else if (time < (2 / 2.75)) {
      return end * (7.5625 * (time -= (1.5 / 2.75)) * time + 0.75) + start;
    } else if (time < (2.5 / 2.75)) {
      return end * (7.5625 * (time -= (2.25 / 2.75)) * time + 0.9375) + start;
    } else {
      return end * (7.5625 * (time -= (2.625 / 2.75)) * time + 0.984375) + start;
    }
  },

  easeInOutBounce: function (time, start, end, duration) {
    if (time < duration / 2) {
      return this.easeInBounce(time * 2, 0, end, duration) * 0.5 + start;
    } else {
      return this.easeOutBounce(time * 2 - duration, 0, end, duration) * 0.5 + end * 0.5 + start;
    }
  }
};

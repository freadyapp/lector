(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

var _src = _interopRequireDefault(require("../src"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let settings = {
  // these are the default values
  "toolbar": false,
  "topbar": false,
  "loop": false,
  "autostart": false,
  "interactive": true,
  "shortcuts": true // if interactive is false, this option doesnt do anything

};
let lec = new _src.default($("#article"), settings); // lec.read()

},{"../src":8}],2:[function(require,module,exports){
/*
 * anime.js v3.2.1
 * (c) 2020 Julian Garnier
 * Released under the MIT license
 * animejs.com
 */

'use strict';

// Defaults

var defaultInstanceSettings = {
  update: null,
  begin: null,
  loopBegin: null,
  changeBegin: null,
  change: null,
  changeComplete: null,
  loopComplete: null,
  complete: null,
  loop: 1,
  direction: 'normal',
  autoplay: true,
  timelineOffset: 0
};

var defaultTweenSettings = {
  duration: 1000,
  delay: 0,
  endDelay: 0,
  easing: 'easeOutElastic(1, .5)',
  round: 0
};

var validTransforms = ['translateX', 'translateY', 'translateZ', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 'scale', 'scaleX', 'scaleY', 'scaleZ', 'skew', 'skewX', 'skewY', 'perspective', 'matrix', 'matrix3d'];

// Caching

var cache = {
  CSS: {},
  springs: {}
};

// Utils

function minMax(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function stringContains(str, text) {
  return str.indexOf(text) > -1;
}

function applyArguments(func, args) {
  return func.apply(null, args);
}

var is = {
  arr: function (a) { return Array.isArray(a); },
  obj: function (a) { return stringContains(Object.prototype.toString.call(a), 'Object'); },
  pth: function (a) { return is.obj(a) && a.hasOwnProperty('totalLength'); },
  svg: function (a) { return a instanceof SVGElement; },
  inp: function (a) { return a instanceof HTMLInputElement; },
  dom: function (a) { return a.nodeType || is.svg(a); },
  str: function (a) { return typeof a === 'string'; },
  fnc: function (a) { return typeof a === 'function'; },
  und: function (a) { return typeof a === 'undefined'; },
  nil: function (a) { return is.und(a) || a === null; },
  hex: function (a) { return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(a); },
  rgb: function (a) { return /^rgb/.test(a); },
  hsl: function (a) { return /^hsl/.test(a); },
  col: function (a) { return (is.hex(a) || is.rgb(a) || is.hsl(a)); },
  key: function (a) { return !defaultInstanceSettings.hasOwnProperty(a) && !defaultTweenSettings.hasOwnProperty(a) && a !== 'targets' && a !== 'keyframes'; },
};

// Easings

function parseEasingParameters(string) {
  var match = /\(([^)]+)\)/.exec(string);
  return match ? match[1].split(',').map(function (p) { return parseFloat(p); }) : [];
}

// Spring solver inspired by Webkit Copyright © 2016 Apple Inc. All rights reserved. https://webkit.org/demos/spring/spring.js

function spring(string, duration) {

  var params = parseEasingParameters(string);
  var mass = minMax(is.und(params[0]) ? 1 : params[0], .1, 100);
  var stiffness = minMax(is.und(params[1]) ? 100 : params[1], .1, 100);
  var damping = minMax(is.und(params[2]) ? 10 : params[2], .1, 100);
  var velocity =  minMax(is.und(params[3]) ? 0 : params[3], .1, 100);
  var w0 = Math.sqrt(stiffness / mass);
  var zeta = damping / (2 * Math.sqrt(stiffness * mass));
  var wd = zeta < 1 ? w0 * Math.sqrt(1 - zeta * zeta) : 0;
  var a = 1;
  var b = zeta < 1 ? (zeta * w0 + -velocity) / wd : -velocity + w0;

  function solver(t) {
    var progress = duration ? (duration * t) / 1000 : t;
    if (zeta < 1) {
      progress = Math.exp(-progress * zeta * w0) * (a * Math.cos(wd * progress) + b * Math.sin(wd * progress));
    } else {
      progress = (a + b * progress) * Math.exp(-progress * w0);
    }
    if (t === 0 || t === 1) { return t; }
    return 1 - progress;
  }

  function getDuration() {
    var cached = cache.springs[string];
    if (cached) { return cached; }
    var frame = 1/6;
    var elapsed = 0;
    var rest = 0;
    while(true) {
      elapsed += frame;
      if (solver(elapsed) === 1) {
        rest++;
        if (rest >= 16) { break; }
      } else {
        rest = 0;
      }
    }
    var duration = elapsed * frame * 1000;
    cache.springs[string] = duration;
    return duration;
  }

  return duration ? solver : getDuration;

}

// Basic steps easing implementation https://developer.mozilla.org/fr/docs/Web/CSS/transition-timing-function

function steps(steps) {
  if ( steps === void 0 ) steps = 10;

  return function (t) { return Math.ceil((minMax(t, 0.000001, 1)) * steps) * (1 / steps); };
}

// BezierEasing https://github.com/gre/bezier-easing

var bezier = (function () {

  var kSplineTableSize = 11;
  var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

  function A(aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1 }
  function B(aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1 }
  function C(aA1)      { return 3.0 * aA1 }

  function calcBezier(aT, aA1, aA2) { return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT }
  function getSlope(aT, aA1, aA2) { return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1) }

  function binarySubdivide(aX, aA, aB, mX1, mX2) {
    var currentX, currentT, i = 0;
    do {
      currentT = aA + (aB - aA) / 2.0;
      currentX = calcBezier(currentT, mX1, mX2) - aX;
      if (currentX > 0.0) { aB = currentT; } else { aA = currentT; }
    } while (Math.abs(currentX) > 0.0000001 && ++i < 10);
    return currentT;
  }

  function newtonRaphsonIterate(aX, aGuessT, mX1, mX2) {
    for (var i = 0; i < 4; ++i) {
      var currentSlope = getSlope(aGuessT, mX1, mX2);
      if (currentSlope === 0.0) { return aGuessT; }
      var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
      aGuessT -= currentX / currentSlope;
    }
    return aGuessT;
  }

  function bezier(mX1, mY1, mX2, mY2) {

    if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) { return; }
    var sampleValues = new Float32Array(kSplineTableSize);

    if (mX1 !== mY1 || mX2 !== mY2) {
      for (var i = 0; i < kSplineTableSize; ++i) {
        sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
      }
    }

    function getTForX(aX) {

      var intervalStart = 0;
      var currentSample = 1;
      var lastSample = kSplineTableSize - 1;

      for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
        intervalStart += kSampleStepSize;
      }

      --currentSample;

      var dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
      var guessForT = intervalStart + dist * kSampleStepSize;
      var initialSlope = getSlope(guessForT, mX1, mX2);

      if (initialSlope >= 0.001) {
        return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
      } else if (initialSlope === 0.0) {
        return guessForT;
      } else {
        return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
      }

    }

    return function (x) {
      if (mX1 === mY1 && mX2 === mY2) { return x; }
      if (x === 0 || x === 1) { return x; }
      return calcBezier(getTForX(x), mY1, mY2);
    }

  }

  return bezier;

})();

var penner = (function () {

  // Based on jQuery UI's implemenation of easing equations from Robert Penner (http://www.robertpenner.com/easing)

  var eases = { linear: function () { return function (t) { return t; }; } };

  var functionEasings = {
    Sine: function () { return function (t) { return 1 - Math.cos(t * Math.PI / 2); }; },
    Circ: function () { return function (t) { return 1 - Math.sqrt(1 - t * t); }; },
    Back: function () { return function (t) { return t * t * (3 * t - 2); }; },
    Bounce: function () { return function (t) {
      var pow2, b = 4;
      while (t < (( pow2 = Math.pow(2, --b)) - 1) / 11) {}
      return 1 / Math.pow(4, 3 - b) - 7.5625 * Math.pow(( pow2 * 3 - 2 ) / 22 - t, 2)
    }; },
    Elastic: function (amplitude, period) {
      if ( amplitude === void 0 ) amplitude = 1;
      if ( period === void 0 ) period = .5;

      var a = minMax(amplitude, 1, 10);
      var p = minMax(period, .1, 2);
      return function (t) {
        return (t === 0 || t === 1) ? t : 
          -a * Math.pow(2, 10 * (t - 1)) * Math.sin((((t - 1) - (p / (Math.PI * 2) * Math.asin(1 / a))) * (Math.PI * 2)) / p);
      }
    }
  };

  var baseEasings = ['Quad', 'Cubic', 'Quart', 'Quint', 'Expo'];

  baseEasings.forEach(function (name, i) {
    functionEasings[name] = function () { return function (t) { return Math.pow(t, i + 2); }; };
  });

  Object.keys(functionEasings).forEach(function (name) {
    var easeIn = functionEasings[name];
    eases['easeIn' + name] = easeIn;
    eases['easeOut' + name] = function (a, b) { return function (t) { return 1 - easeIn(a, b)(1 - t); }; };
    eases['easeInOut' + name] = function (a, b) { return function (t) { return t < 0.5 ? easeIn(a, b)(t * 2) / 2 : 
      1 - easeIn(a, b)(t * -2 + 2) / 2; }; };
    eases['easeOutIn' + name] = function (a, b) { return function (t) { return t < 0.5 ? (1 - easeIn(a, b)(1 - t * 2)) / 2 : 
      (easeIn(a, b)(t * 2 - 1) + 1) / 2; }; };
  });

  return eases;

})();

function parseEasings(easing, duration) {
  if (is.fnc(easing)) { return easing; }
  var name = easing.split('(')[0];
  var ease = penner[name];
  var args = parseEasingParameters(easing);
  switch (name) {
    case 'spring' : return spring(easing, duration);
    case 'cubicBezier' : return applyArguments(bezier, args);
    case 'steps' : return applyArguments(steps, args);
    default : return applyArguments(ease, args);
  }
}

// Strings

function selectString(str) {
  try {
    var nodes = document.querySelectorAll(str);
    return nodes;
  } catch(e) {
    return;
  }
}

// Arrays

function filterArray(arr, callback) {
  var len = arr.length;
  var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
  var result = [];
  for (var i = 0; i < len; i++) {
    if (i in arr) {
      var val = arr[i];
      if (callback.call(thisArg, val, i, arr)) {
        result.push(val);
      }
    }
  }
  return result;
}

function flattenArray(arr) {
  return arr.reduce(function (a, b) { return a.concat(is.arr(b) ? flattenArray(b) : b); }, []);
}

function toArray(o) {
  if (is.arr(o)) { return o; }
  if (is.str(o)) { o = selectString(o) || o; }
  if (o instanceof NodeList || o instanceof HTMLCollection) { return [].slice.call(o); }
  return [o];
}

function arrayContains(arr, val) {
  return arr.some(function (a) { return a === val; });
}

// Objects

function cloneObject(o) {
  var clone = {};
  for (var p in o) { clone[p] = o[p]; }
  return clone;
}

function replaceObjectProps(o1, o2) {
  var o = cloneObject(o1);
  for (var p in o1) { o[p] = o2.hasOwnProperty(p) ? o2[p] : o1[p]; }
  return o;
}

function mergeObjects(o1, o2) {
  var o = cloneObject(o1);
  for (var p in o2) { o[p] = is.und(o1[p]) ? o2[p] : o1[p]; }
  return o;
}

// Colors

function rgbToRgba(rgbValue) {
  var rgb = /rgb\((\d+,\s*[\d]+,\s*[\d]+)\)/g.exec(rgbValue);
  return rgb ? ("rgba(" + (rgb[1]) + ",1)") : rgbValue;
}

function hexToRgba(hexValue) {
  var rgx = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  var hex = hexValue.replace(rgx, function (m, r, g, b) { return r + r + g + g + b + b; } );
  var rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  var r = parseInt(rgb[1], 16);
  var g = parseInt(rgb[2], 16);
  var b = parseInt(rgb[3], 16);
  return ("rgba(" + r + "," + g + "," + b + ",1)");
}

function hslToRgba(hslValue) {
  var hsl = /hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/g.exec(hslValue) || /hsla\((\d+),\s*([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)\)/g.exec(hslValue);
  var h = parseInt(hsl[1], 10) / 360;
  var s = parseInt(hsl[2], 10) / 100;
  var l = parseInt(hsl[3], 10) / 100;
  var a = hsl[4] || 1;
  function hue2rgb(p, q, t) {
    if (t < 0) { t += 1; }
    if (t > 1) { t -= 1; }
    if (t < 1/6) { return p + (q - p) * 6 * t; }
    if (t < 1/2) { return q; }
    if (t < 2/3) { return p + (q - p) * (2/3 - t) * 6; }
    return p;
  }
  var r, g, b;
  if (s == 0) {
    r = g = b = l;
  } else {
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return ("rgba(" + (r * 255) + "," + (g * 255) + "," + (b * 255) + "," + a + ")");
}

function colorToRgb(val) {
  if (is.rgb(val)) { return rgbToRgba(val); }
  if (is.hex(val)) { return hexToRgba(val); }
  if (is.hsl(val)) { return hslToRgba(val); }
}

// Units

function getUnit(val) {
  var split = /[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?(%|px|pt|em|rem|in|cm|mm|ex|ch|pc|vw|vh|vmin|vmax|deg|rad|turn)?$/.exec(val);
  if (split) { return split[1]; }
}

function getTransformUnit(propName) {
  if (stringContains(propName, 'translate') || propName === 'perspective') { return 'px'; }
  if (stringContains(propName, 'rotate') || stringContains(propName, 'skew')) { return 'deg'; }
}

// Values

function getFunctionValue(val, animatable) {
  if (!is.fnc(val)) { return val; }
  return val(animatable.target, animatable.id, animatable.total);
}

function getAttribute(el, prop) {
  return el.getAttribute(prop);
}

function convertPxToUnit(el, value, unit) {
  var valueUnit = getUnit(value);
  if (arrayContains([unit, 'deg', 'rad', 'turn'], valueUnit)) { return value; }
  var cached = cache.CSS[value + unit];
  if (!is.und(cached)) { return cached; }
  var baseline = 100;
  var tempEl = document.createElement(el.tagName);
  var parentEl = (el.parentNode && (el.parentNode !== document)) ? el.parentNode : document.body;
  parentEl.appendChild(tempEl);
  tempEl.style.position = 'absolute';
  tempEl.style.width = baseline + unit;
  var factor = baseline / tempEl.offsetWidth;
  parentEl.removeChild(tempEl);
  var convertedUnit = factor * parseFloat(value);
  cache.CSS[value + unit] = convertedUnit;
  return convertedUnit;
}

function getCSSValue(el, prop, unit) {
  if (prop in el.style) {
    var uppercasePropName = prop.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    var value = el.style[prop] || getComputedStyle(el).getPropertyValue(uppercasePropName) || '0';
    return unit ? convertPxToUnit(el, value, unit) : value;
  }
}

function getAnimationType(el, prop) {
  if (is.dom(el) && !is.inp(el) && (!is.nil(getAttribute(el, prop)) || (is.svg(el) && el[prop]))) { return 'attribute'; }
  if (is.dom(el) && arrayContains(validTransforms, prop)) { return 'transform'; }
  if (is.dom(el) && (prop !== 'transform' && getCSSValue(el, prop))) { return 'css'; }
  if (el[prop] != null) { return 'object'; }
}

function getElementTransforms(el) {
  if (!is.dom(el)) { return; }
  var str = el.style.transform || '';
  var reg  = /(\w+)\(([^)]*)\)/g;
  var transforms = new Map();
  var m; while (m = reg.exec(str)) { transforms.set(m[1], m[2]); }
  return transforms;
}

function getTransformValue(el, propName, animatable, unit) {
  var defaultVal = stringContains(propName, 'scale') ? 1 : 0 + getTransformUnit(propName);
  var value = getElementTransforms(el).get(propName) || defaultVal;
  if (animatable) {
    animatable.transforms.list.set(propName, value);
    animatable.transforms['last'] = propName;
  }
  return unit ? convertPxToUnit(el, value, unit) : value;
}

function getOriginalTargetValue(target, propName, unit, animatable) {
  switch (getAnimationType(target, propName)) {
    case 'transform': return getTransformValue(target, propName, animatable, unit);
    case 'css': return getCSSValue(target, propName, unit);
    case 'attribute': return getAttribute(target, propName);
    default: return target[propName] || 0;
  }
}

function getRelativeValue(to, from) {
  var operator = /^(\*=|\+=|-=)/.exec(to);
  if (!operator) { return to; }
  var u = getUnit(to) || 0;
  var x = parseFloat(from);
  var y = parseFloat(to.replace(operator[0], ''));
  switch (operator[0][0]) {
    case '+': return x + y + u;
    case '-': return x - y + u;
    case '*': return x * y + u;
  }
}

function validateValue(val, unit) {
  if (is.col(val)) { return colorToRgb(val); }
  if (/\s/g.test(val)) { return val; }
  var originalUnit = getUnit(val);
  var unitLess = originalUnit ? val.substr(0, val.length - originalUnit.length) : val;
  if (unit) { return unitLess + unit; }
  return unitLess;
}

// getTotalLength() equivalent for circle, rect, polyline, polygon and line shapes
// adapted from https://gist.github.com/SebLambla/3e0550c496c236709744

function getDistance(p1, p2) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

function getCircleLength(el) {
  return Math.PI * 2 * getAttribute(el, 'r');
}

function getRectLength(el) {
  return (getAttribute(el, 'width') * 2) + (getAttribute(el, 'height') * 2);
}

function getLineLength(el) {
  return getDistance(
    {x: getAttribute(el, 'x1'), y: getAttribute(el, 'y1')}, 
    {x: getAttribute(el, 'x2'), y: getAttribute(el, 'y2')}
  );
}

function getPolylineLength(el) {
  var points = el.points;
  var totalLength = 0;
  var previousPos;
  for (var i = 0 ; i < points.numberOfItems; i++) {
    var currentPos = points.getItem(i);
    if (i > 0) { totalLength += getDistance(previousPos, currentPos); }
    previousPos = currentPos;
  }
  return totalLength;
}

function getPolygonLength(el) {
  var points = el.points;
  return getPolylineLength(el) + getDistance(points.getItem(points.numberOfItems - 1), points.getItem(0));
}

// Path animation

function getTotalLength(el) {
  if (el.getTotalLength) { return el.getTotalLength(); }
  switch(el.tagName.toLowerCase()) {
    case 'circle': return getCircleLength(el);
    case 'rect': return getRectLength(el);
    case 'line': return getLineLength(el);
    case 'polyline': return getPolylineLength(el);
    case 'polygon': return getPolygonLength(el);
  }
}

function setDashoffset(el) {
  var pathLength = getTotalLength(el);
  el.setAttribute('stroke-dasharray', pathLength);
  return pathLength;
}

// Motion path

function getParentSvgEl(el) {
  var parentEl = el.parentNode;
  while (is.svg(parentEl)) {
    if (!is.svg(parentEl.parentNode)) { break; }
    parentEl = parentEl.parentNode;
  }
  return parentEl;
}

function getParentSvg(pathEl, svgData) {
  var svg = svgData || {};
  var parentSvgEl = svg.el || getParentSvgEl(pathEl);
  var rect = parentSvgEl.getBoundingClientRect();
  var viewBoxAttr = getAttribute(parentSvgEl, 'viewBox');
  var width = rect.width;
  var height = rect.height;
  var viewBox = svg.viewBox || (viewBoxAttr ? viewBoxAttr.split(' ') : [0, 0, width, height]);
  return {
    el: parentSvgEl,
    viewBox: viewBox,
    x: viewBox[0] / 1,
    y: viewBox[1] / 1,
    w: width,
    h: height,
    vW: viewBox[2],
    vH: viewBox[3]
  }
}

function getPath(path, percent) {
  var pathEl = is.str(path) ? selectString(path)[0] : path;
  var p = percent || 100;
  return function(property) {
    return {
      property: property,
      el: pathEl,
      svg: getParentSvg(pathEl),
      totalLength: getTotalLength(pathEl) * (p / 100)
    }
  }
}

function getPathProgress(path, progress, isPathTargetInsideSVG) {
  function point(offset) {
    if ( offset === void 0 ) offset = 0;

    var l = progress + offset >= 1 ? progress + offset : 0;
    return path.el.getPointAtLength(l);
  }
  var svg = getParentSvg(path.el, path.svg);
  var p = point();
  var p0 = point(-1);
  var p1 = point(+1);
  var scaleX = isPathTargetInsideSVG ? 1 : svg.w / svg.vW;
  var scaleY = isPathTargetInsideSVG ? 1 : svg.h / svg.vH;
  switch (path.property) {
    case 'x': return (p.x - svg.x) * scaleX;
    case 'y': return (p.y - svg.y) * scaleY;
    case 'angle': return Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180 / Math.PI;
  }
}

// Decompose value

function decomposeValue(val, unit) {
  // const rgx = /-?\d*\.?\d+/g; // handles basic numbers
  // const rgx = /[+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g; // handles exponents notation
  var rgx = /[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g; // handles exponents notation
  var value = validateValue((is.pth(val) ? val.totalLength : val), unit) + '';
  return {
    original: value,
    numbers: value.match(rgx) ? value.match(rgx).map(Number) : [0],
    strings: (is.str(val) || unit) ? value.split(rgx) : []
  }
}

// Animatables

function parseTargets(targets) {
  var targetsArray = targets ? (flattenArray(is.arr(targets) ? targets.map(toArray) : toArray(targets))) : [];
  return filterArray(targetsArray, function (item, pos, self) { return self.indexOf(item) === pos; });
}

function getAnimatables(targets) {
  var parsed = parseTargets(targets);
  return parsed.map(function (t, i) {
    return {target: t, id: i, total: parsed.length, transforms: { list: getElementTransforms(t) } };
  });
}

// Properties

function normalizePropertyTweens(prop, tweenSettings) {
  var settings = cloneObject(tweenSettings);
  // Override duration if easing is a spring
  if (/^spring/.test(settings.easing)) { settings.duration = spring(settings.easing); }
  if (is.arr(prop)) {
    var l = prop.length;
    var isFromTo = (l === 2 && !is.obj(prop[0]));
    if (!isFromTo) {
      // Duration divided by the number of tweens
      if (!is.fnc(tweenSettings.duration)) { settings.duration = tweenSettings.duration / l; }
    } else {
      // Transform [from, to] values shorthand to a valid tween value
      prop = {value: prop};
    }
  }
  var propArray = is.arr(prop) ? prop : [prop];
  return propArray.map(function (v, i) {
    var obj = (is.obj(v) && !is.pth(v)) ? v : {value: v};
    // Default delay value should only be applied to the first tween
    if (is.und(obj.delay)) { obj.delay = !i ? tweenSettings.delay : 0; }
    // Default endDelay value should only be applied to the last tween
    if (is.und(obj.endDelay)) { obj.endDelay = i === propArray.length - 1 ? tweenSettings.endDelay : 0; }
    return obj;
  }).map(function (k) { return mergeObjects(k, settings); });
}


function flattenKeyframes(keyframes) {
  var propertyNames = filterArray(flattenArray(keyframes.map(function (key) { return Object.keys(key); })), function (p) { return is.key(p); })
  .reduce(function (a,b) { if (a.indexOf(b) < 0) { a.push(b); } return a; }, []);
  var properties = {};
  var loop = function ( i ) {
    var propName = propertyNames[i];
    properties[propName] = keyframes.map(function (key) {
      var newKey = {};
      for (var p in key) {
        if (is.key(p)) {
          if (p == propName) { newKey.value = key[p]; }
        } else {
          newKey[p] = key[p];
        }
      }
      return newKey;
    });
  };

  for (var i = 0; i < propertyNames.length; i++) loop( i );
  return properties;
}

function getProperties(tweenSettings, params) {
  var properties = [];
  var keyframes = params.keyframes;
  if (keyframes) { params = mergeObjects(flattenKeyframes(keyframes), params); }
  for (var p in params) {
    if (is.key(p)) {
      properties.push({
        name: p,
        tweens: normalizePropertyTweens(params[p], tweenSettings)
      });
    }
  }
  return properties;
}

// Tweens

function normalizeTweenValues(tween, animatable) {
  var t = {};
  for (var p in tween) {
    var value = getFunctionValue(tween[p], animatable);
    if (is.arr(value)) {
      value = value.map(function (v) { return getFunctionValue(v, animatable); });
      if (value.length === 1) { value = value[0]; }
    }
    t[p] = value;
  }
  t.duration = parseFloat(t.duration);
  t.delay = parseFloat(t.delay);
  return t;
}

function normalizeTweens(prop, animatable) {
  var previousTween;
  return prop.tweens.map(function (t) {
    var tween = normalizeTweenValues(t, animatable);
    var tweenValue = tween.value;
    var to = is.arr(tweenValue) ? tweenValue[1] : tweenValue;
    var toUnit = getUnit(to);
    var originalValue = getOriginalTargetValue(animatable.target, prop.name, toUnit, animatable);
    var previousValue = previousTween ? previousTween.to.original : originalValue;
    var from = is.arr(tweenValue) ? tweenValue[0] : previousValue;
    var fromUnit = getUnit(from) || getUnit(originalValue);
    var unit = toUnit || fromUnit;
    if (is.und(to)) { to = previousValue; }
    tween.from = decomposeValue(from, unit);
    tween.to = decomposeValue(getRelativeValue(to, from), unit);
    tween.start = previousTween ? previousTween.end : 0;
    tween.end = tween.start + tween.delay + tween.duration + tween.endDelay;
    tween.easing = parseEasings(tween.easing, tween.duration);
    tween.isPath = is.pth(tweenValue);
    tween.isPathTargetInsideSVG = tween.isPath && is.svg(animatable.target);
    tween.isColor = is.col(tween.from.original);
    if (tween.isColor) { tween.round = 1; }
    previousTween = tween;
    return tween;
  });
}

// Tween progress

var setProgressValue = {
  css: function (t, p, v) { return t.style[p] = v; },
  attribute: function (t, p, v) { return t.setAttribute(p, v); },
  object: function (t, p, v) { return t[p] = v; },
  transform: function (t, p, v, transforms, manual) {
    transforms.list.set(p, v);
    if (p === transforms.last || manual) {
      var str = '';
      transforms.list.forEach(function (value, prop) { str += prop + "(" + value + ") "; });
      t.style.transform = str;
    }
  }
};

// Set Value helper

function setTargetsValue(targets, properties) {
  var animatables = getAnimatables(targets);
  animatables.forEach(function (animatable) {
    for (var property in properties) {
      var value = getFunctionValue(properties[property], animatable);
      var target = animatable.target;
      var valueUnit = getUnit(value);
      var originalValue = getOriginalTargetValue(target, property, valueUnit, animatable);
      var unit = valueUnit || getUnit(originalValue);
      var to = getRelativeValue(validateValue(value, unit), originalValue);
      var animType = getAnimationType(target, property);
      setProgressValue[animType](target, property, to, animatable.transforms, true);
    }
  });
}

// Animations

function createAnimation(animatable, prop) {
  var animType = getAnimationType(animatable.target, prop.name);
  if (animType) {
    var tweens = normalizeTweens(prop, animatable);
    var lastTween = tweens[tweens.length - 1];
    return {
      type: animType,
      property: prop.name,
      animatable: animatable,
      tweens: tweens,
      duration: lastTween.end,
      delay: tweens[0].delay,
      endDelay: lastTween.endDelay
    }
  }
}

function getAnimations(animatables, properties) {
  return filterArray(flattenArray(animatables.map(function (animatable) {
    return properties.map(function (prop) {
      return createAnimation(animatable, prop);
    });
  })), function (a) { return !is.und(a); });
}

// Create Instance

function getInstanceTimings(animations, tweenSettings) {
  var animLength = animations.length;
  var getTlOffset = function (anim) { return anim.timelineOffset ? anim.timelineOffset : 0; };
  var timings = {};
  timings.duration = animLength ? Math.max.apply(Math, animations.map(function (anim) { return getTlOffset(anim) + anim.duration; })) : tweenSettings.duration;
  timings.delay = animLength ? Math.min.apply(Math, animations.map(function (anim) { return getTlOffset(anim) + anim.delay; })) : tweenSettings.delay;
  timings.endDelay = animLength ? timings.duration - Math.max.apply(Math, animations.map(function (anim) { return getTlOffset(anim) + anim.duration - anim.endDelay; })) : tweenSettings.endDelay;
  return timings;
}

var instanceID = 0;

function createNewInstance(params) {
  var instanceSettings = replaceObjectProps(defaultInstanceSettings, params);
  var tweenSettings = replaceObjectProps(defaultTweenSettings, params);
  var properties = getProperties(tweenSettings, params);
  var animatables = getAnimatables(params.targets);
  var animations = getAnimations(animatables, properties);
  var timings = getInstanceTimings(animations, tweenSettings);
  var id = instanceID;
  instanceID++;
  return mergeObjects(instanceSettings, {
    id: id,
    children: [],
    animatables: animatables,
    animations: animations,
    duration: timings.duration,
    delay: timings.delay,
    endDelay: timings.endDelay
  });
}

// Core

var activeInstances = [];

var engine = (function () {
  var raf;

  function play() {
    if (!raf && (!isDocumentHidden() || !anime.suspendWhenDocumentHidden) && activeInstances.length > 0) {
      raf = requestAnimationFrame(step);
    }
  }
  function step(t) {
    // memo on algorithm issue:
    // dangerous iteration over mutable `activeInstances`
    // (that collection may be updated from within callbacks of `tick`-ed animation instances)
    var activeInstancesLength = activeInstances.length;
    var i = 0;
    while (i < activeInstancesLength) {
      var activeInstance = activeInstances[i];
      if (!activeInstance.paused) {
        activeInstance.tick(t);
        i++;
      } else {
        activeInstances.splice(i, 1);
        activeInstancesLength--;
      }
    }
    raf = i > 0 ? requestAnimationFrame(step) : undefined;
  }

  function handleVisibilityChange() {
    if (!anime.suspendWhenDocumentHidden) { return; }

    if (isDocumentHidden()) {
      // suspend ticks
      raf = cancelAnimationFrame(raf);
    } else { // is back to active tab
      // first adjust animations to consider the time that ticks were suspended
      activeInstances.forEach(
        function (instance) { return instance ._onDocumentVisibility(); }
      );
      engine();
    }
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  return play;
})();

function isDocumentHidden() {
  return !!document && document.hidden;
}

// Public Instance

function anime(params) {
  if ( params === void 0 ) params = {};


  var startTime = 0, lastTime = 0, now = 0;
  var children, childrenLength = 0;
  var resolve = null;

  function makePromise(instance) {
    var promise = window.Promise && new Promise(function (_resolve) { return resolve = _resolve; });
    instance.finished = promise;
    return promise;
  }

  var instance = createNewInstance(params);
  var promise = makePromise(instance);

  function toggleInstanceDirection() {
    var direction = instance.direction;
    if (direction !== 'alternate') {
      instance.direction = direction !== 'normal' ? 'normal' : 'reverse';
    }
    instance.reversed = !instance.reversed;
    children.forEach(function (child) { return child.reversed = instance.reversed; });
  }

  function adjustTime(time) {
    return instance.reversed ? instance.duration - time : time;
  }

  function resetTime() {
    startTime = 0;
    lastTime = adjustTime(instance.currentTime) * (1 / anime.speed);
  }

  function seekChild(time, child) {
    if (child) { child.seek(time - child.timelineOffset); }
  }

  function syncInstanceChildren(time) {
    if (!instance.reversePlayback) {
      for (var i = 0; i < childrenLength; i++) { seekChild(time, children[i]); }
    } else {
      for (var i$1 = childrenLength; i$1--;) { seekChild(time, children[i$1]); }
    }
  }

  function setAnimationsProgress(insTime) {
    var i = 0;
    var animations = instance.animations;
    var animationsLength = animations.length;
    while (i < animationsLength) {
      var anim = animations[i];
      var animatable = anim.animatable;
      var tweens = anim.tweens;
      var tweenLength = tweens.length - 1;
      var tween = tweens[tweenLength];
      // Only check for keyframes if there is more than one tween
      if (tweenLength) { tween = filterArray(tweens, function (t) { return (insTime < t.end); })[0] || tween; }
      var elapsed = minMax(insTime - tween.start - tween.delay, 0, tween.duration) / tween.duration;
      var eased = isNaN(elapsed) ? 1 : tween.easing(elapsed);
      var strings = tween.to.strings;
      var round = tween.round;
      var numbers = [];
      var toNumbersLength = tween.to.numbers.length;
      var progress = (void 0);
      for (var n = 0; n < toNumbersLength; n++) {
        var value = (void 0);
        var toNumber = tween.to.numbers[n];
        var fromNumber = tween.from.numbers[n] || 0;
        if (!tween.isPath) {
          value = fromNumber + (eased * (toNumber - fromNumber));
        } else {
          value = getPathProgress(tween.value, eased * toNumber, tween.isPathTargetInsideSVG);
        }
        if (round) {
          if (!(tween.isColor && n > 2)) {
            value = Math.round(value * round) / round;
          }
        }
        numbers.push(value);
      }
      // Manual Array.reduce for better performances
      var stringsLength = strings.length;
      if (!stringsLength) {
        progress = numbers[0];
      } else {
        progress = strings[0];
        for (var s = 0; s < stringsLength; s++) {
          var a = strings[s];
          var b = strings[s + 1];
          var n$1 = numbers[s];
          if (!isNaN(n$1)) {
            if (!b) {
              progress += n$1 + ' ';
            } else {
              progress += n$1 + b;
            }
          }
        }
      }
      setProgressValue[anim.type](animatable.target, anim.property, progress, animatable.transforms);
      anim.currentValue = progress;
      i++;
    }
  }

  function setCallback(cb) {
    if (instance[cb] && !instance.passThrough) { instance[cb](instance); }
  }

  function countIteration() {
    if (instance.remaining && instance.remaining !== true) {
      instance.remaining--;
    }
  }

  function setInstanceProgress(engineTime) {
    var insDuration = instance.duration;
    var insDelay = instance.delay;
    var insEndDelay = insDuration - instance.endDelay;
    var insTime = adjustTime(engineTime);
    instance.progress = minMax((insTime / insDuration) * 100, 0, 100);
    instance.reversePlayback = insTime < instance.currentTime;
    if (children) { syncInstanceChildren(insTime); }
    if (!instance.began && instance.currentTime > 0) {
      instance.began = true;
      setCallback('begin');
    }
    if (!instance.loopBegan && instance.currentTime > 0) {
      instance.loopBegan = true;
      setCallback('loopBegin');
    }
    if (insTime <= insDelay && instance.currentTime !== 0) {
      setAnimationsProgress(0);
    }
    if ((insTime >= insEndDelay && instance.currentTime !== insDuration) || !insDuration) {
      setAnimationsProgress(insDuration);
    }
    if (insTime > insDelay && insTime < insEndDelay) {
      if (!instance.changeBegan) {
        instance.changeBegan = true;
        instance.changeCompleted = false;
        setCallback('changeBegin');
      }
      setCallback('change');
      setAnimationsProgress(insTime);
    } else {
      if (instance.changeBegan) {
        instance.changeCompleted = true;
        instance.changeBegan = false;
        setCallback('changeComplete');
      }
    }
    instance.currentTime = minMax(insTime, 0, insDuration);
    if (instance.began) { setCallback('update'); }
    if (engineTime >= insDuration) {
      lastTime = 0;
      countIteration();
      if (!instance.remaining) {
        instance.paused = true;
        if (!instance.completed) {
          instance.completed = true;
          setCallback('loopComplete');
          setCallback('complete');
          if (!instance.passThrough && 'Promise' in window) {
            resolve();
            promise = makePromise(instance);
          }
        }
      } else {
        startTime = now;
        setCallback('loopComplete');
        instance.loopBegan = false;
        if (instance.direction === 'alternate') {
          toggleInstanceDirection();
        }
      }
    }
  }

  instance.reset = function() {
    var direction = instance.direction;
    instance.passThrough = false;
    instance.currentTime = 0;
    instance.progress = 0;
    instance.paused = true;
    instance.began = false;
    instance.loopBegan = false;
    instance.changeBegan = false;
    instance.completed = false;
    instance.changeCompleted = false;
    instance.reversePlayback = false;
    instance.reversed = direction === 'reverse';
    instance.remaining = instance.loop;
    children = instance.children;
    childrenLength = children.length;
    for (var i = childrenLength; i--;) { instance.children[i].reset(); }
    if (instance.reversed && instance.loop !== true || (direction === 'alternate' && instance.loop === 1)) { instance.remaining++; }
    setAnimationsProgress(instance.reversed ? instance.duration : 0);
  };

  // internal method (for engine) to adjust animation timings before restoring engine ticks (rAF)
  instance._onDocumentVisibility = resetTime;

  // Set Value helper

  instance.set = function(targets, properties) {
    setTargetsValue(targets, properties);
    return instance;
  };

  instance.tick = function(t) {
    now = t;
    if (!startTime) { startTime = now; }
    setInstanceProgress((now + (lastTime - startTime)) * anime.speed);
  };

  instance.seek = function(time) {
    setInstanceProgress(adjustTime(time));
  };

  instance.pause = function() {
    instance.paused = true;
    resetTime();
  };

  instance.play = function() {
    if (!instance.paused) { return; }
    if (instance.completed) { instance.reset(); }
    instance.paused = false;
    activeInstances.push(instance);
    resetTime();
    engine();
  };

  instance.reverse = function() {
    toggleInstanceDirection();
    instance.completed = instance.reversed ? false : true;
    resetTime();
  };

  instance.restart = function() {
    instance.reset();
    instance.play();
  };

  instance.remove = function(targets) {
    var targetsArray = parseTargets(targets);
    removeTargetsFromInstance(targetsArray, instance);
  };

  instance.reset();

  if (instance.autoplay) { instance.play(); }

  return instance;

}

// Remove targets from animation

function removeTargetsFromAnimations(targetsArray, animations) {
  for (var a = animations.length; a--;) {
    if (arrayContains(targetsArray, animations[a].animatable.target)) {
      animations.splice(a, 1);
    }
  }
}

function removeTargetsFromInstance(targetsArray, instance) {
  var animations = instance.animations;
  var children = instance.children;
  removeTargetsFromAnimations(targetsArray, animations);
  for (var c = children.length; c--;) {
    var child = children[c];
    var childAnimations = child.animations;
    removeTargetsFromAnimations(targetsArray, childAnimations);
    if (!childAnimations.length && !child.children.length) { children.splice(c, 1); }
  }
  if (!animations.length && !children.length) { instance.pause(); }
}

function removeTargetsFromActiveInstances(targets) {
  var targetsArray = parseTargets(targets);
  for (var i = activeInstances.length; i--;) {
    var instance = activeInstances[i];
    removeTargetsFromInstance(targetsArray, instance);
  }
}

// Stagger helpers

function stagger(val, params) {
  if ( params === void 0 ) params = {};

  var direction = params.direction || 'normal';
  var easing = params.easing ? parseEasings(params.easing) : null;
  var grid = params.grid;
  var axis = params.axis;
  var fromIndex = params.from || 0;
  var fromFirst = fromIndex === 'first';
  var fromCenter = fromIndex === 'center';
  var fromLast = fromIndex === 'last';
  var isRange = is.arr(val);
  var val1 = isRange ? parseFloat(val[0]) : parseFloat(val);
  var val2 = isRange ? parseFloat(val[1]) : 0;
  var unit = getUnit(isRange ? val[1] : val) || 0;
  var start = params.start || 0 + (isRange ? val1 : 0);
  var values = [];
  var maxValue = 0;
  return function (el, i, t) {
    if (fromFirst) { fromIndex = 0; }
    if (fromCenter) { fromIndex = (t - 1) / 2; }
    if (fromLast) { fromIndex = t - 1; }
    if (!values.length) {
      for (var index = 0; index < t; index++) {
        if (!grid) {
          values.push(Math.abs(fromIndex - index));
        } else {
          var fromX = !fromCenter ? fromIndex%grid[0] : (grid[0]-1)/2;
          var fromY = !fromCenter ? Math.floor(fromIndex/grid[0]) : (grid[1]-1)/2;
          var toX = index%grid[0];
          var toY = Math.floor(index/grid[0]);
          var distanceX = fromX - toX;
          var distanceY = fromY - toY;
          var value = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
          if (axis === 'x') { value = -distanceX; }
          if (axis === 'y') { value = -distanceY; }
          values.push(value);
        }
        maxValue = Math.max.apply(Math, values);
      }
      if (easing) { values = values.map(function (val) { return easing(val / maxValue) * maxValue; }); }
      if (direction === 'reverse') { values = values.map(function (val) { return axis ? (val < 0) ? val * -1 : -val : Math.abs(maxValue - val); }); }
    }
    var spacing = isRange ? (val2 - val1) / maxValue : val1;
    return start + (spacing * (Math.round(values[i] * 100) / 100)) + unit;
  }
}

// Timeline

function timeline(params) {
  if ( params === void 0 ) params = {};

  var tl = anime(params);
  tl.duration = 0;
  tl.add = function(instanceParams, timelineOffset) {
    var tlIndex = activeInstances.indexOf(tl);
    var children = tl.children;
    if (tlIndex > -1) { activeInstances.splice(tlIndex, 1); }
    function passThrough(ins) { ins.passThrough = true; }
    for (var i = 0; i < children.length; i++) { passThrough(children[i]); }
    var insParams = mergeObjects(instanceParams, replaceObjectProps(defaultTweenSettings, params));
    insParams.targets = insParams.targets || params.targets;
    var tlDuration = tl.duration;
    insParams.autoplay = false;
    insParams.direction = tl.direction;
    insParams.timelineOffset = is.und(timelineOffset) ? tlDuration : getRelativeValue(timelineOffset, tlDuration);
    passThrough(tl);
    tl.seek(insParams.timelineOffset);
    var ins = anime(insParams);
    passThrough(ins);
    children.push(ins);
    var timings = getInstanceTimings(children, params);
    tl.delay = timings.delay;
    tl.endDelay = timings.endDelay;
    tl.duration = timings.duration;
    tl.seek(0);
    tl.reset();
    if (tl.autoplay) { tl.play(); }
    return tl;
  };
  return tl;
}

anime.version = '3.2.1';
anime.speed = 1;
// TODO:#review: naming, documentation
anime.suspendWhenDocumentHidden = true;
anime.running = activeInstances;
anime.remove = removeTargetsFromActiveInstances;
anime.get = getOriginalTargetValue;
anime.set = setTargetsValue;
anime.convertPx = convertPxToUnit;
anime.path = getPath;
anime.setDashoffset = setDashoffset;
anime.stagger = stagger;
anime.timeline = timeline;
anime.easing = parseEasings;
anime.penner = penner;
anime.random = function (min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; };

module.exports = anime;

},{}],3:[function(require,module,exports){
/* compromise 13.7.0 MIT */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.nlp = factory());
}(this, (function () { 'use strict';

  function _typeof(obj) {
    "@babel/helpers - typeof";

    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
  }

  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

    return _setPrototypeOf(o, p);
  }

  function _isNativeReflectConstruct() {
    if (typeof Reflect === "undefined" || !Reflect.construct) return false;
    if (Reflect.construct.sham) return false;
    if (typeof Proxy === "function") return true;

    try {
      Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
      return true;
    } catch (e) {
      return false;
    }
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  function _possibleConstructorReturn(self, call) {
    if (call && (typeof call === "object" || typeof call === "function")) {
      return call;
    }

    return _assertThisInitialized(self);
  }

  function _createSuper(Derived) {
    var hasNativeReflectConstruct = _isNativeReflectConstruct();

    return function _createSuperInternal() {
      var Super = _getPrototypeOf(Derived),
          result;

      if (hasNativeReflectConstruct) {
        var NewTarget = _getPrototypeOf(this).constructor;

        result = Reflect.construct(Super, arguments, NewTarget);
      } else {
        result = Super.apply(this, arguments);
      }

      return _possibleConstructorReturn(this, result);
    };
  }

  function _slicedToArray(arr, i) {
    return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
  }

  function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
  }

  function _iterableToArrayLimit(arr, i) {
    if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return;
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"] != null) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }

  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;

    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

    return arr2;
  }

  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  //this is a not-well-thought-out way to reduce our dependence on `object===object` stuff
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.split(''); //generates a unique id for this term

  function makeId(str) {
    str = str || '_';
    var text = str + '-';

    for (var i = 0; i < 7; i++) {
      text += chars[Math.floor(Math.random() * chars.length)];
    }

    return text;
  }

  var _id = makeId;

  //a hugely-ignorant, and widely subjective transliteration of latin, cryllic, greek unicode characters to english ascii.
  //approximate visual (not semantic or phonetic) relationship between unicode and ascii characters
  //http://en.wikipedia.org/wiki/List_of_Unicode_characters
  //https://docs.google.com/spreadsheet/ccc?key=0Ah46z755j7cVdFRDM1A2YVpwa1ZYWlpJM2pQZ003M0E
  var compact = {
    '!': '¡',
    '?': '¿Ɂ',
    '"': '“”"❝❞',
    "'": '‘‛❛❜',
    '-': '—–',
    a: 'ªÀÁÂÃÄÅàáâãäåĀāĂăĄąǍǎǞǟǠǡǺǻȀȁȂȃȦȧȺΆΑΔΛάαλАадѦѧӐӑӒӓƛɅæ',
    b: 'ßþƀƁƂƃƄƅɃΒβϐϦБВЪЬвъьѢѣҌҍ',
    c: '¢©ÇçĆćĈĉĊċČčƆƇƈȻȼͻͼͽϲϹϽϾСсєҀҁҪҫ',
    d: 'ÐĎďĐđƉƊȡƋƌǷ',
    e: 'ÈÉÊËèéêëĒēĔĕĖėĘęĚěƎƏƐǝȄȅȆȇȨȩɆɇΈΕΞΣέεξϱϵ϶ЀЁЕЭеѐёҼҽҾҿӖӗӘәӚӛӬӭ',
    f: 'ƑƒϜϝӺӻҒғſ',
    g: 'ĜĝĞğĠġĢģƓǤǥǦǧǴǵ',
    h: 'ĤĥĦħƕǶȞȟΉΗЂЊЋНнђћҢңҤҥҺһӉӊ',
    I: 'ÌÍÎÏ',
    i: 'ìíîïĨĩĪīĬĭĮįİıƖƗȈȉȊȋΊΐΪίιϊІЇії',
    j: 'ĴĵǰȷɈɉϳЈј',
    k: 'ĶķĸƘƙǨǩΚκЌЖКжкќҚқҜҝҞҟҠҡ',
    l: 'ĹĺĻļĽľĿŀŁłƚƪǀǏǐȴȽΙӀӏ',
    m: 'ΜϺϻМмӍӎ',
    n: 'ÑñŃńŅņŇňŉŊŋƝƞǸǹȠȵΝΠήηϞЍИЙЛПийлпѝҊҋӅӆӢӣӤӥπ',
    o: 'ÒÓÔÕÖØðòóôõöøŌōŎŏŐőƟƠơǑǒǪǫǬǭǾǿȌȍȎȏȪȫȬȭȮȯȰȱΌΘΟθοσόϕϘϙϬϭϴОФоѲѳӦӧӨөӪӫ',
    p: 'ƤƿΡρϷϸϼРрҎҏÞ',
    q: 'Ɋɋ',
    r: 'ŔŕŖŗŘřƦȐȑȒȓɌɍЃГЯгяѓҐґ',
    s: 'ŚśŜŝŞşŠšƧƨȘșȿЅѕ',
    t: 'ŢţŤťŦŧƫƬƭƮȚțȶȾΓΤτϮТт',
    u: 'µÙÚÛÜùúûüŨũŪūŬŭŮůŰűŲųƯưƱƲǓǔǕǖǗǘǙǚǛǜȔȕȖȗɄΰμυϋύ',
    v: 'νѴѵѶѷ',
    w: 'ŴŵƜωώϖϢϣШЩшщѡѿ',
    x: '×ΧχϗϰХхҲҳӼӽӾӿ',
    y: 'ÝýÿŶŷŸƳƴȲȳɎɏΎΥΫγψϒϓϔЎУучўѰѱҮүҰұӮӯӰӱӲӳ',
    z: 'ŹźŻżŽžƩƵƶȤȥɀΖζ'
  }; //decompress data into two hashes

  var unicode = {};
  Object.keys(compact).forEach(function (k) {
    compact[k].split('').forEach(function (s) {
      unicode[s] = k;
    });
  });

  var killUnicode = function killUnicode(str) {
    var chars = str.split('');
    chars.forEach(function (s, i) {
      if (unicode[s]) {
        chars[i] = unicode[s];
      }
    });
    return chars.join('');
  };

  var unicode_1 = killUnicode; // console.log(killUnicode('bjŏȒk—Ɏó'));

  var periodAcronym = /([A-Z]\.)+[A-Z]?,?$/;
  var oneLetterAcronym = /^[A-Z]\.,?$/;
  var noPeriodAcronym = /[A-Z]{2,}('s|,)?$/;
  var lowerCaseAcronym = /([a-z]\.){2,}[a-z]\.?$/;

  var isAcronym = function isAcronym(str) {
    //like N.D.A
    if (periodAcronym.test(str) === true) {
      return true;
    } //like c.e.o


    if (lowerCaseAcronym.test(str) === true) {
      return true;
    } //like 'F.'


    if (oneLetterAcronym.test(str) === true) {
      return true;
    } //like NDA


    if (noPeriodAcronym.test(str) === true) {
      return true;
    }

    return false;
  };

  var isAcronym_1 = isAcronym;

  var hasSlash = /[a-z\u00C0-\u00FF] ?\/ ?[a-z\u00C0-\u00FF]/;
  /** some basic operations on a string to reduce noise */

  var clean = function clean(str) {
    str = str || '';
    str = str.toLowerCase();
    str = str.trim();
    var original = str; //(very) rough ASCII transliteration -  bjŏrk -> bjork

    str = unicode_1(str); //rough handling of slashes - 'see/saw'

    if (hasSlash.test(str) === true) {
      str = str.replace(/\/.*/, '');
    } //#tags, @mentions


    str = str.replace(/^[#@]/, ''); //punctuation

    str = str.replace(/[,;.!?]+$/, ''); // coerce single curly quotes

    str = str.replace(/[\u0027\u0060\u00B4\u2018\u2019\u201A\u201B\u2032\u2035\u2039\u203A]+/g, "'"); // coerce double curly quotes

    str = str.replace(/[\u0022\u00AB\u00BB\u201C\u201D\u201E\u201F\u2033\u2034\u2036\u2037\u2E42\u301D\u301E\u301F\uFF02]+/g, '"'); //coerce Unicode ellipses

    str = str.replace(/\u2026/g, '...'); //en-dash

    str = str.replace(/\u2013/g, '-'); //lookin'->looking (make it easier for conjugation)

    str = str.replace(/([aeiou][ktrp])in$/, '$1ing'); //turn re-enactment to reenactment

    if (/^(re|un)-?[^aeiou]./.test(str) === true) {
      str = str.replace('-', '');
    } //strip leading & trailing grammatical punctuation


    if (/^[:;]/.test(str) === false) {
      str = str.replace(/\.{3,}$/g, '');
      str = str.replace(/[",\.!:;\?\)]+$/g, '');
      str = str.replace(/^['"\(]+/g, '');
    } //do this again..


    str = str.trim(); //oh shucks,

    if (str === '') {
      str = original;
    } //compact acronyms


    if (isAcronym_1(str)) {
      str = str.replace(/\./g, '');
    } //nice-numbers


    str = str.replace(/([0-9]),([0-9])/g, '$1$2');
    return str;
  };

  var clean_1 = clean; // console.log(normalize('Dr. V Cooper'));

  /** reduced is one step further than clean */
  var reduced = function reduced(str) {
    // remove apostrophes
    str = str.replace(/['’]s$/, '');
    str = str.replace(/s['’]$/, 's');
    return str;
  };

  var reduce = reduced;

  //all punctuation marks, from https://en.wikipedia.org/wiki/Punctuation
  //we have slightly different rules for start/end - like #hashtags.

  var startings = /^[ \n\t\.’'\[\](){}⟨⟩:,،、‒–—―…!.‹›«»‐\-?‘’;\/⁄·&*•^†‡°¡¿※№÷×ºª%‰+−=‱¶′″‴§~|‖¦©℗®℠™¤₳฿\u0022|\uFF02|\u0027|\u201C|\u2018|\u201F|\u201B|\u201E|\u2E42|\u201A|\u00AB|\u2039|\u2035|\u2036|\u2037|\u301D|\u0060|\u301F]+/;
  var endings = /[ \n\t\.’'\[\](){}⟨⟩:,،、‒–—―…!.‹›«»‐\-?‘’;\/⁄·&*@•^†‡°¡¿※#№÷×ºª‰+−=‱¶′″‴§~|‖¦©℗®℠™¤₳฿\u0022|\uFF02|\u0027|\u201D|\u2019|\u201D|\u2019|\u201D|\u201D|\u2019|\u00BB|\u203A|\u2032|\u2033|\u2034|\u301E|\u00B4|\u301E]+$/; //money = ₵¢₡₢$₫₯֏₠€ƒ₣₲₴₭₺₾ℳ₥₦₧₱₰£៛₽₹₨₪৳₸₮₩¥

  var hasSlash$1 = /\//;
  var hasApostrophe = /['’]/;
  var hasAcronym = /^[a-z]\.([a-z]\.)+/i;
  var minusNumber = /^[-+\.][0-9]/;
  /** turn given text into a parsed-up object
   * seperate the 'meat' of the word from the whitespace+punctuation
   */

  var parseTerm = function parseTerm(str) {
    var original = str;
    var pre = '';
    var post = '';
    str = str.replace(startings, function (found) {
      pre = found; // support '-40'

      if ((pre === '-' || pre === '+' || pre === '.') && minusNumber.test(str)) {
        pre = '';
        return found;
      }

      return '';
    });
    str = str.replace(endings, function (found) {
      post = found; // keep s-apostrophe - "flanders'" or "chillin'"

      if (hasApostrophe.test(found) && /[sn]['’]$/.test(original) && hasApostrophe.test(pre) === false) {
        post = post.replace(hasApostrophe, '');
        return "'";
      } //keep end-period in acronym


      if (hasAcronym.test(str) === true) {
        post = post.replace(/\./, '');
        return '.';
      }

      return '';
    }); //we went too far..

    if (str === '') {
      // do a very mild parse, and hope for the best.
      original = original.replace(/ *$/, function (after) {
        post = after || '';
        return '';
      });
      str = original;
      pre = '';
      post = post;
    } // create the various forms of our text,


    var clean = clean_1(str);
    var parsed = {
      text: str,
      clean: clean,
      reduced: reduce(clean),
      pre: pre,
      post: post
    }; // support aliases for slashes

    if (hasSlash$1.test(str)) {
      str.split(hasSlash$1).forEach(function (word) {
        parsed.alias = parsed.alias || {};
        parsed.alias[word.trim()] = true;
      });
    }

    return parsed;
  };

  var parse = parseTerm;

  function createCommonjsModule(fn, basedir, module) {
  	return module = {
  		path: basedir,
  		exports: {},
  		require: function (path, base) {
  			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
  		}
  	}, fn(module, module.exports), module.exports;
  }

  function commonjsRequire () {
  	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
  }

  var _01Case = createCommonjsModule(function (module, exports) {
    var titleCase = /^[A-Z][a-z'\u00C0-\u00FF]/;
    var upperCase = /^[A-Z]+s?$/;
    /** convert all text to uppercase */

    exports.toUpperCase = function () {
      this.text = this.text.toUpperCase();
      return this;
    };
    /** convert all text to lowercase */


    exports.toLowerCase = function () {
      this.text = this.text.toLowerCase();
      return this;
    };
    /** only set the first letter to uppercase
     * leave any existing uppercase alone
     */


    exports.toTitleCase = function () {
      this.text = this.text.replace(/^ *[a-z\u00C0-\u00FF]/, function (x) {
        return x.toUpperCase();
      }); //support unicode?

      return this;
    };
    /** if all letters are uppercase */


    exports.isUpperCase = function () {
      return upperCase.test(this.text);
    };
    /** if the first letter is uppercase, and the rest are lowercase */


    exports.isTitleCase = function () {
      return titleCase.test(this.text);
    };

    exports.titleCase = exports.isTitleCase;
  });

  var _02Punctuation = createCommonjsModule(function (module, exports) {
    // these methods are called with '@hasComma' in the match syntax
    // various unicode quotation-mark formats
    var startQuote = /(\u0022|\uFF02|\u0027|\u201C|\u2018|\u201F|\u201B|\u201E|\u2E42|\u201A|\u00AB|\u2039|\u2035|\u2036|\u2037|\u301D|\u0060|\u301F)/;
    var endQuote = /(\u0022|\uFF02|\u0027|\u201D|\u2019|\u201D|\u2019|\u201D|\u201D|\u2019|\u00BB|\u203A|\u2032|\u2033|\u2034|\u301E|\u00B4|\u301E)/;
    /** search the term's 'post' punctuation  */

    exports.hasPost = function (punct) {
      return this.post.indexOf(punct) !== -1;
    };
    /** search the term's 'pre' punctuation  */


    exports.hasPre = function (punct) {
      return this.pre.indexOf(punct) !== -1;
    };
    /** does it have a quotation symbol?  */


    exports.hasQuote = function () {
      return startQuote.test(this.pre) || endQuote.test(this.post);
    };

    exports.hasQuotation = exports.hasQuote;
    /** does it have a comma?  */

    exports.hasComma = function () {
      return this.hasPost(',');
    };
    /** does it end in a period? */


    exports.hasPeriod = function () {
      return this.hasPost('.') === true && this.hasPost('...') === false;
    };
    /** does it end in an exclamation */


    exports.hasExclamation = function () {
      return this.hasPost('!');
    };
    /** does it end with a question mark? */


    exports.hasQuestionMark = function () {
      return this.hasPost('?') || this.hasPost('¿');
    };
    /** is there a ... at the end? */


    exports.hasEllipses = function () {
      return this.hasPost('..') || this.hasPost('…') || this.hasPre('..') || this.hasPre('…');
    };
    /** is there a semicolon after this word? */


    exports.hasSemicolon = function () {
      return this.hasPost(';');
    };
    /** is there a slash '/' in this word? */


    exports.hasSlash = function () {
      return /\//.test(this.text);
    };
    /** a hyphen connects two words like-this */


    exports.hasHyphen = function () {
      var hyphen = /^(-|–|—)$/;
      return hyphen.test(this.post) || hyphen.test(this.pre);
    };
    /** a dash separates words - like that */


    exports.hasDash = function () {
      var hyphen = / (-|–|—) /;
      return hyphen.test(this.post) || hyphen.test(this.pre);
    };
    /** is it multiple words combinded */


    exports.hasContraction = function () {
      return Boolean(this.implicit);
    };
    /** try to sensibly put this punctuation mark into the term */


    exports.addPunctuation = function (punct) {
      // dont add doubles
      if (punct === ',' || punct === ';') {
        this.post = this.post.replace(punct, '');
      }

      this.post = punct + this.post;
      return this;
    };
  });

  //declare it up here
  var wrapMatch = function wrapMatch() {};
  /** ignore optional/greedy logic, straight-up term match*/


  var doesMatch = function doesMatch(t, reg, index, length) {
    // support id matches
    if (reg.id === t.id) {
      return true;
    } // support '.'


    if (reg.anything === true) {
      return true;
    } // support '^' (in parentheses)


    if (reg.start === true && index !== 0) {
      return false;
    } // support '$' (in parentheses)


    if (reg.end === true && index !== length - 1) {
      return false;
    } //support a text match


    if (reg.word !== undefined) {
      //match contractions
      if (t.implicit !== null && t.implicit === reg.word) {
        return true;
      } // term aliases for slashes and things


      if (t.alias !== undefined && t.alias.hasOwnProperty(reg.word)) {
        return true;
      } // support ~ match


      if (reg.soft === true && reg.word === t.root) {
        return true;
      } //match either .clean or .text


      return reg.word === t.clean || reg.word === t.text || reg.word === t.reduced;
    } //support #Tag


    if (reg.tag !== undefined) {
      return t.tags[reg.tag] === true;
    } //support @method


    if (reg.method !== undefined) {
      if (typeof t[reg.method] === 'function' && t[reg.method]() === true) {
        return true;
      }

      return false;
    } //support /reg/


    if (reg.regex !== undefined) {
      return reg.regex.test(t.clean);
    } // support optimized (one|two)


    if (reg.oneOf !== undefined) {
      return reg.oneOf.hasOwnProperty(t.reduced) || reg.oneOf.hasOwnProperty(t.text);
    } //support (one|two)


    if (reg.choices !== undefined) {
      // try to support && operator
      if (reg.operator === 'and') {
        // must match them all
        return reg.choices.every(function (r) {
          return wrapMatch(t, r, index, length);
        });
      } // or must match one


      return reg.choices.some(function (r) {
        return wrapMatch(t, r, index, length);
      });
    }

    return false;
  }; // wrap result for !negative match logic


  wrapMatch = function wrapMatch(t, reg, index, length) {
    var result = doesMatch(t, reg, index, length);

    if (reg.negative === true) {
      return !result;
    }

    return result;
  };

  var _doesMatch = wrapMatch;

  var boring = {};
  /** check a match object against this term */

  var doesMatch_1 = function doesMatch_1(reg, index, length) {
    return _doesMatch(this, reg, index, length);
  };
  /** does this term look like an acronym? */


  var isAcronym_1$1 = function isAcronym_1$1() {
    return isAcronym_1(this.text);
  };
  /** is this term implied by a contraction? */


  var isImplicit = function isImplicit() {
    return this.text === '' && Boolean(this.implicit);
  };
  /** does the term have at least one good tag? */


  var isKnown = function isKnown() {
    return Object.keys(this.tags).some(function (t) {
      return boring[t] !== true;
    });
  };
  /** cache the root property of the term */


  var setRoot = function setRoot(world) {
    var transform = world.transforms;
    var str = this.implicit || this.clean;

    if (this.tags.Plural) {
      str = transform.toSingular(str, world);
    }

    if (this.tags.Verb && !this.tags.Negative && !this.tags.Infinitive) {
      var tense = null;

      if (this.tags.PastTense) {
        tense = 'PastTense';
      } else if (this.tags.Gerund) {
        tense = 'Gerund';
      } else if (this.tags.PresentTense) {
        tense = 'PresentTense';
      } else if (this.tags.Participle) {
        tense = 'Participle';
      } else if (this.tags.Actor) {
        tense = 'Actor';
      }

      str = transform.toInfinitive(str, world, tense);
    }

    this.root = str;
  };

  var _03Misc = {
    doesMatch: doesMatch_1,
    isAcronym: isAcronym_1$1,
    isImplicit: isImplicit,
    isKnown: isKnown,
    setRoot: setRoot
  };

  var hasSpace = /[\s-]/;
  var isUpperCase = /^[A-Z-]+$/; // const titleCase = str => {
  //   return str.charAt(0).toUpperCase() + str.substr(1)
  // }

  /** return various text formats of this term */

  var textOut = function textOut(options, showPre, showPost) {
    options = options || {};
    var word = this.text;
    var before = this.pre;
    var after = this.post; // -word-

    if (options.reduced === true) {
      word = this.reduced || '';
    }

    if (options.root === true) {
      word = this.root || '';
    }

    if (options.implicit === true && this.implicit) {
      word = this.implicit || '';
    }

    if (options.normal === true) {
      word = this.clean || this.text || '';
    }

    if (options.root === true) {
      word = this.root || this.reduced || '';
    }

    if (options.unicode === true) {
      word = unicode_1(word);
    } // cleanup case


    if (options.titlecase === true) {
      if (this.tags.ProperNoun && !this.titleCase()) ; else if (this.tags.Acronym) {
        word = word.toUpperCase(); //uppercase acronyms
      } else if (isUpperCase.test(word) && !this.tags.Acronym) {
        // lowercase everything else
        word = word.toLowerCase();
      }
    }

    if (options.lowercase === true) {
      word = word.toLowerCase();
    } // remove the '.'s from 'F.B.I.' (safely)


    if (options.acronyms === true && this.tags.Acronym) {
      word = word.replace(/\./g, '');
    } // -before/after-


    if (options.whitespace === true || options.root === true) {
      before = '';
      after = ' ';

      if ((hasSpace.test(this.post) === false || options.last) && !this.implicit) {
        after = '';
      }
    }

    if (options.punctuation === true && !options.root) {
      //normalized end punctuation
      if (this.hasPost('.') === true) {
        after = '.' + after;
      } else if (this.hasPost('?') === true) {
        after = '?' + after;
      } else if (this.hasPost('!') === true) {
        after = '!' + after;
      } else if (this.hasPost(',') === true) {
        after = ',' + after;
      } else if (this.hasEllipses() === true) {
        after = '...' + after;
      }
    }

    if (showPre !== true) {
      before = '';
    }

    if (showPost !== true) {
      // let keep = after.match(/\)/) || ''
      after = ''; //keep //after.replace(/[ .?!,]+/, '')
    } // remove the '.' from 'Mrs.' (safely)


    if (options.abbreviations === true && this.tags.Abbreviation) {
      after = after.replace(/^\./, '');
    }

    return before + word + after;
  };

  var _04Text = {
    textOut: textOut
  };

  var boringTags = {
    Auxiliary: 1,
    Possessive: 1
  };
  /** a subjective ranking of tags kinda tfidf-based */

  var rankTags = function rankTags(term, world) {
    var tags = Object.keys(term.tags);
    var tagSet = world.tags;
    tags = tags.sort(function (a, b) {
      //bury the tags we dont want
      if (boringTags[b] || !tagSet[b]) {
        return -1;
      } // unknown tags are interesting


      if (!tagSet[b]) {
        return 1;
      }

      if (!tagSet[a]) {
        return 0;
      } // then sort by #of parent tags (most-specific tags first)


      if (tagSet[a].lineage.length > tagSet[b].lineage.length) {
        return 1;
      }

      if (tagSet[a].isA.length > tagSet[b].isA.length) {
        return -1;
      }

      return 0;
    });
    return tags;
  };

  var _bestTag = rankTags;

  var jsonDefault = {
    text: true,
    tags: true,
    implicit: true,
    whitespace: true,
    clean: false,
    id: false,
    index: false,
    offset: false,
    bestTag: false
  };
  /** return various metadata for this term */

  var json = function json(options, world) {
    options = options || {};
    options = Object.assign({}, jsonDefault, options);
    var result = {}; // default on

    if (options.text) {
      result.text = this.text;
    }

    if (options.normal) {
      result.normal = this.normal;
    }

    if (options.tags) {
      result.tags = Object.keys(this.tags);
    } // default off


    if (options.clean) {
      result.clean = this.clean;
    }

    if (options.id || options.offset) {
      result.id = this.id;
    }

    if (options.implicit && this.implicit !== null) {
      result.implicit = this.implicit;
    }

    if (options.whitespace) {
      result.pre = this.pre;
      result.post = this.post;
    }

    if (options.bestTag) {
      result.bestTag = _bestTag(this, world)[0];
    }

    return result;
  };

  var _05Json = {
    json: json
  };

  var methods = Object.assign({}, _01Case, _02Punctuation, _03Misc, _04Text, _05Json);

  function isClientSide() {
    return typeof window !== 'undefined' && window.document;
  }
  /** add spaces at the end */


  var padEnd = function padEnd(str, width) {
    str = str.toString();

    while (str.length < width) {
      str += ' ';
    }

    return str;
  };
  /** output for verbose-mode */


  var logTag = function logTag(t, tag, reason) {
    if (isClientSide()) {
      console.log('%c' + padEnd(t.clean, 3) + '  + ' + tag + ' ', 'color: #6accb2;');
      return;
    } //server-side


    var log = '\x1b[33m' + padEnd(t.clean, 15) + '\x1b[0m + \x1b[32m' + tag + '\x1b[0m ';

    if (reason) {
      log = padEnd(log, 35) + ' ' + reason + '';
    }

    console.log(log);
  };
  /** output for verbose mode  */


  var logUntag = function logUntag(t, tag, reason) {
    if (isClientSide()) {
      console.log('%c' + padEnd(t.clean, 3) + '  - ' + tag + ' ', 'color: #AB5850;');
      return;
    } //server-side


    var log = '\x1b[33m' + padEnd(t.clean, 3) + ' \x1b[31m - #' + tag + '\x1b[0m ';

    if (reason) {
      log = padEnd(log, 35) + ' ' + reason;
    }

    console.log(log);
  };

  var isArray = function isArray(arr) {
    return Object.prototype.toString.call(arr) === '[object Array]';
  };

  var titleCase = function titleCase(str) {
    return str.charAt(0).toUpperCase() + str.substr(1);
  };

  var fns = {
    logTag: logTag,
    logUntag: logUntag,
    isArray: isArray,
    titleCase: titleCase
  };

  /** add a tag, and its descendents, to a term */

  var addTag = function addTag(t, tag, reason, world) {
    var tagset = world.tags; //support '.' or '-' notation for skipping the tag

    if (tag === '' || tag === '.' || tag === '-') {
      return;
    }

    if (tag[0] === '#') {
      tag = tag.replace(/^#/, '');
    }

    tag = fns.titleCase(tag); //if we already got this one

    if (t.tags[tag] === true) {
      return;
    } // log it?


    var isVerbose = world.isVerbose();

    if (isVerbose === true) {
      fns.logTag(t, tag, reason);
    } //add tag


    t.tags[tag] = true; //whee!
    //check tagset for any additional things to do...

    if (tagset.hasOwnProperty(tag) === true) {
      //add parent Tags
      tagset[tag].isA.forEach(function (down) {
        t.tags[down] = true;

        if (isVerbose === true) {
          fns.logTag(t, '→ ' + down);
        }
      }); //remove any contrary tags

      t.unTag(tagset[tag].notA, '←', world);
    }
  };
  /** support an array of tags */


  var addTags = function addTags(term, tags, reason, world) {
    if (typeof tags !== 'string') {
      for (var i = 0; i < tags.length; i++) {
        addTag(term, tags[i], reason, world);
      } // tags.forEach(tag => addTag(term, tag, reason, world))

    } else {
      addTag(term, tags, reason, world);
    }
  };

  var add = addTags;

  var lowerCase = /^[a-z]/;

  var titleCase$1 = function titleCase(str) {
    return str.charAt(0).toUpperCase() + str.substr(1);
  };
  /** remove this tag, and its descentents from the term */


  var unTag = function unTag(t, tag, reason, world) {
    var isVerbose = world.isVerbose(); //support '*' for removing all tags

    if (tag === '*') {
      t.tags = {};
      return t;
    }

    tag = tag.replace(/^#/, '');

    if (lowerCase.test(tag) === true) {
      tag = titleCase$1(tag);
    } // remove the tag


    if (t.tags[tag] === true) {
      delete t.tags[tag]; //log in verbose-mode

      if (isVerbose === true) {
        fns.logUntag(t, tag, reason);
      }
    } //delete downstream tags too


    var tagset = world.tags;

    if (tagset[tag]) {
      var lineage = tagset[tag].lineage;

      for (var i = 0; i < lineage.length; i++) {
        if (t.tags[lineage[i]] === true) {
          delete t.tags[lineage[i]];

          if (isVerbose === true) {
            fns.logUntag(t, ' - ' + lineage[i]);
          }
        }
      }
    }

    return t;
  }; //handle an array of tags


  var untagAll = function untagAll(term, tags, reason, world) {
    if (typeof tags !== 'string' && tags) {
      for (var i = 0; i < tags.length; i++) {
        unTag(term, tags[i], reason, world);
      }

      return;
    }

    unTag(term, tags, reason, world);
  };

  var unTag_1 = untagAll;

  var canBe = function canBe(term, tag, world) {
    var tagset = world.tags; // cleanup tag

    if (tag[0] === '#') {
      tag = tag.replace(/^#/, '');
    } //fail-fast


    if (tagset[tag] === undefined) {
      return true;
    } //loop through tag's contradictory tags


    var enemies = tagset[tag].notA || [];

    for (var i = 0; i < enemies.length; i++) {
      if (term.tags[enemies[i]] === true) {
        return false;
      }
    }

    if (tagset[tag].isA !== undefined) {
      return canBe(term, tagset[tag].isA, world); //recursive
    }

    return true;
  };

  var canBe_1 = canBe;

  /** add a tag or tags, and their descendents to this term
   * @param  {string | string[]} tags - a tag or tags
   * @param {string?} [reason] a clue for debugging
   */

  var tag_1 = function tag_1(tags, reason, world) {
    add(this, tags, reason, world);
    return this;
  };
  /** only tag this term if it's consistent with it's current tags */


  var tagSafe = function tagSafe(tags, reason, world) {
    if (canBe_1(this, tags, world)) {
      add(this, tags, reason, world);
    }

    return this;
  };
  /** remove a tag or tags, and their descendents from this term
   * @param {string | string[]} tags  - a tag or tags
   * @param {string?} [reason] a clue for debugging
   */


  var unTag_1$1 = function unTag_1$1(tags, reason, world) {
    unTag_1(this, tags, reason, world);
    return this;
  };
  /** is this tag consistent with the word's current tags?
   * @param {string | string[]} tags - a tag or tags
   * @returns {boolean}
   */


  var canBe_1$1 = function canBe_1$1(tags, world) {
    return canBe_1(this, tags, world);
  };

  var tag = {
    tag: tag_1,
    tagSafe: tagSafe,
    unTag: unTag_1$1,
    canBe: canBe_1$1
  };

  var Term = /*#__PURE__*/function () {
    function Term() {
      var text = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

      _classCallCheck(this, Term);

      text = String(text);
      var obj = parse(text); // the various forms of our text

      this.text = obj.text || '';
      this.clean = obj.clean;
      this.reduced = obj.reduced;
      this.root =  null;
      this.implicit =  null;
      this.pre = obj.pre || '';
      this.post = obj.post || '';
      this.tags = {};
      this.prev = null;
      this.next = null;
      this.id = _id(obj.clean);
      this.isA = 'Term'; // easier than .constructor...
      // support alternative matches

      if (obj.alias) {
        this.alias = obj.alias;
      }
    }
    /** set the text of the Term to something else*/


    _createClass(Term, [{
      key: "set",
      value: function set(str) {
        var obj = parse(str);
        this.text = obj.text;
        this.clean = obj.clean;
        return this;
      }
    }]);

    return Term;
  }();
  /** create a deep-copy of this term */


  Term.prototype.clone = function () {
    var term = new Term(this.text);
    term.pre = this.pre;
    term.post = this.post;
    term.clean = this.clean;
    term.reduced = this.reduced;
    term.root = this.root;
    term.implicit = this.implicit;
    term.tags = Object.assign({}, this.tags); //use the old id, so it can be matched with .match(doc)
    // term.id = this.id

    return term;
  };

  Object.assign(Term.prototype, methods);
  Object.assign(Term.prototype, tag);
  var Term_1 = Term;

  /** return a flat array of Term objects */
  var terms = function terms(n) {
    if (this.length === 0) {
      return [];
    } // use cache, if it exists


    if (this.cache.terms) {
      if (n !== undefined) {
        return this.cache.terms[n];
      }

      return this.cache.terms;
    }

    var terms = [this.pool.get(this.start)];

    for (var i = 0; i < this.length - 1; i += 1) {
      var id = terms[terms.length - 1].next;

      if (id === null) {
        // throw new Error('linked-list broken')
        console.error("Compromise error: Linked list broken in phrase '" + this.start + "'");
        break;
      }

      var term = this.pool.get(id);
      terms.push(term); //return this one?

      if (n !== undefined && n === i) {
        return terms[n];
      }
    }

    if (n === undefined) {
      this.cache.terms = terms;
    }

    if (n !== undefined) {
      return terms[n];
    }

    return terms;
  };
  /** return a shallow or deep copy of this phrase  */


  var clone = function clone(isShallow) {
    var _this = this;

    if (isShallow) {
      var p = this.buildFrom(this.start, this.length);
      p.cache = this.cache;
      return p;
    } //how do we clone part of the pool?


    var terms = this.terms();
    var newTerms = terms.map(function (t) {
      return t.clone();
    }); // console.log(newTerms)
    //connect these new ids up

    newTerms.forEach(function (t, i) {
      //add it to the pool..
      _this.pool.add(t);

      if (newTerms[i + 1]) {
        t.next = newTerms[i + 1].id;
      }

      if (newTerms[i - 1]) {
        t.prev = newTerms[i - 1].id;
      }
    });
    return this.buildFrom(newTerms[0].id, newTerms.length);
  };
  /** return last term object */


  var lastTerm = function lastTerm() {
    var terms = this.terms();
    return terms[terms.length - 1];
  };
  /** quick lookup for a term id */


  var hasId = function hasId(wantId) {
    if (this.length === 0 || !wantId) {
      return false;
    }

    if (this.start === wantId) {
      return true;
    } // use cache, if available


    if (this.cache.terms) {
      var _terms = this.cache.terms;

      for (var i = 0; i < _terms.length; i++) {
        if (_terms[i].id === wantId) {
          return true;
        }
      }

      return false;
    } // otherwise, go through each term


    var lastId = this.start;

    for (var _i = 0; _i < this.length - 1; _i += 1) {
      var term = this.pool.get(lastId);

      if (term === undefined) {
        console.error("Compromise error: Linked list broken. Missing term '".concat(lastId, "' in phrase '").concat(this.start, "'\n")); // throw new Error('linked List error')

        return false;
      }

      if (term.next === wantId) {
        return true;
      }

      lastId = term.next;
    }

    return false;
  };
  /** how many seperate, non-empty words is it? */


  var wordCount = function wordCount() {
    return this.terms().filter(function (t) {
      return t.text !== '';
    }).length;
  };
  /** get the full-sentence this phrase belongs to */


  var fullSentence = function fullSentence() {
    var t = this.terms(0); //find first term in sentence

    while (t.prev) {
      t = this.pool.get(t.prev);
    }

    var start = t.id;
    var len = 1; //go to end of sentence

    while (t.next) {
      t = this.pool.get(t.next);
      len += 1;
    }

    return this.buildFrom(start, len);
  };

  var _01Utils = {
    terms: terms,
    clone: clone,
    lastTerm: lastTerm,
    hasId: hasId,
    wordCount: wordCount,
    fullSentence: fullSentence
  };

  var trimEnd = function trimEnd(str) {
    return str.replace(/ +$/, '');
  };
  /** produce output in the given format */


  var text = function text() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var isFirst = arguments.length > 1 ? arguments[1] : undefined;
    var isLast = arguments.length > 2 ? arguments[2] : undefined;

    if (typeof options === 'string') {
      if (options === 'normal') {
        options = {
          whitespace: true,
          unicode: true,
          lowercase: true,
          punctuation: true,
          acronyms: true,
          abbreviations: true,
          implicit: true,
          normal: true
        };
      } else if (options === 'clean') {
        options = {
          titlecase: false,
          lowercase: true,
          punctuation: true,
          whitespace: true,
          unicode: true,
          implicit: true
        };
      } else if (options === 'reduced') {
        options = {
          titlecase: false,
          lowercase: true,
          punctuation: false,
          //FIXME: reversed?
          whitespace: true,
          unicode: true,
          implicit: true,
          reduced: true
        };
      } else if (options === 'root') {
        options = {
          titlecase: false,
          lowercase: true,
          punctuation: true,
          whitespace: true,
          unicode: true,
          implicit: true,
          root: true
        };
      } else {
        options = {};
      }
    }

    var terms = this.terms(); //this this phrase a complete sentence?

    var isFull = false;

    if (terms[0] && terms[0].prev === null && terms[terms.length - 1].next === null) {
      isFull = true;
    }

    var text = terms.reduce(function (str, t, i) {
      options.last = isLast && i === terms.length - 1;
      var showPre = true;
      var showPost = true;

      if (isFull === false) {
        // dont show beginning whitespace
        if (i === 0 && isFirst) {
          showPre = false;
        } // dont show end-whitespace


        if (i === terms.length - 1 && isLast) {
          showPost = false;
        }
      }

      var txt = t.textOut(options, showPre, showPost); // if (options.titlecase && i === 0) {
      // txt = titleCase(txt)
      // }

      return str + txt;
    }, ''); //full-phrases show punctuation, but not whitespace

    if (isFull === true && isLast) {
      text = trimEnd(text);
    }

    if (options.trim === true) {
      text = text.trim();
    }

    return text;
  };

  var _02Text = {
    text: text
  };

  /** remove start and end whitespace */
  var trim = function trim() {
    var terms = this.terms();

    if (terms.length > 0) {
      //trim starting
      terms[0].pre = terms[0].pre.replace(/^\s+/, ''); //trim ending

      var lastTerm = terms[terms.length - 1];
      lastTerm.post = lastTerm.post.replace(/\s+$/, '');
    }

    return this;
  };

  var _03Change = {
    trim: trim
  };

  var endOfSentence = /[.?!]\s*$/; // replacing a 'word.' with a 'word!'

  var combinePost = function combinePost(before, after) {
    //only transfer the whitespace
    if (endOfSentence.test(after)) {
      var whitespace = before.match(/\s*$/);
      return after + whitespace;
    }

    return before;
  }; //add whitespace to the start of the second bit


  var addWhitespace = function addWhitespace(beforeTerms, newTerms) {
    // add any existing pre-whitespace to beginning
    newTerms[0].pre = beforeTerms[0].pre;
    var lastTerm = beforeTerms[beforeTerms.length - 1]; //add any existing punctuation to end of our new terms

    var newTerm = newTerms[newTerms.length - 1];
    newTerm.post = combinePost(lastTerm.post, newTerm.post); // remove existing punctuation

    lastTerm.post = ''; //before ←[space]  - after

    if (lastTerm.post === '') {
      lastTerm.post += ' ';
    }
  }; //insert this segment into the linked-list


  var stitchIn = function stitchIn(beforeTerms, newTerms, pool) {
    var lastBefore = beforeTerms[beforeTerms.length - 1];
    var lastNew = newTerms[newTerms.length - 1];
    var afterId = lastBefore.next; //connect ours in (main → newPhrase)

    lastBefore.next = newTerms[0].id; //stich the end in  (newPhrase → after)

    lastNew.next = afterId; //do it backwards, too

    if (afterId) {
      // newPhrase ← after
      var afterTerm = pool.get(afterId);
      afterTerm.prev = lastNew.id;
    } // before ← newPhrase


    var beforeId = beforeTerms[0].id;

    if (beforeId) {
      var newTerm = newTerms[0];
      newTerm.prev = beforeId;
    }
  }; // avoid stretching a phrase twice.


  var unique = function unique(list) {
    return list.filter(function (o, i) {
      return list.indexOf(o) === i;
    });
  }; //append one phrase onto another.


  var appendPhrase = function appendPhrase(before, newPhrase, doc) {
    var beforeTerms = before.terms();
    var newTerms = newPhrase.terms(); //spruce-up the whitespace issues

    addWhitespace(beforeTerms, newTerms); //insert this segment into the linked-list

    stitchIn(beforeTerms, newTerms, before.pool); // stretch!
    // make each effected phrase longer

    var toStretch = [before];
    var hasId = before.start;
    var docs = [doc];
    docs = docs.concat(doc.parents()); // find them all!

    docs.forEach(function (parent) {
      // only the phrases that should change
      var shouldChange = parent.list.filter(function (p) {
        return p.hasId(hasId);
      });
      toStretch = toStretch.concat(shouldChange);
    }); // don't double-count a phrase

    toStretch = unique(toStretch);
    toStretch.forEach(function (p) {
      p.length += newPhrase.length;
    });
    before.cache = {};
    return before;
  };

  var append = appendPhrase;

  var hasSpace$1 = / /; //a new space needs to be added, either on the new phrase, or the old one
  // '[new] [◻old]'   -or-   '[old] [◻new] [old]'

  var addWhitespace$1 = function addWhitespace(newTerms) {
    //add a space before our new text?
    // add a space after our text
    var lastTerm = newTerms[newTerms.length - 1];

    if (hasSpace$1.test(lastTerm.post) === false) {
      lastTerm.post += ' ';
    }

    return;
  }; //insert this segment into the linked-list


  var stitchIn$1 = function stitchIn(main, newPhrase, newTerms) {
    // [newPhrase] → [main]
    var lastTerm = newTerms[newTerms.length - 1];
    lastTerm.next = main.start; // [before] → [main]

    var pool = main.pool;
    var start = pool.get(main.start);

    if (start.prev) {
      var before = pool.get(start.prev);
      before.next = newPhrase.start;
    } //do it backwards, too
    // before ← newPhrase


    newTerms[0].prev = main.terms(0).prev; // newPhrase ← main

    main.terms(0).prev = lastTerm.id;
  };

  var unique$1 = function unique(list) {
    return list.filter(function (o, i) {
      return list.indexOf(o) === i;
    });
  }; //append one phrase onto another


  var joinPhrase = function joinPhrase(original, newPhrase, doc) {
    var starterId = original.start;
    var newTerms = newPhrase.terms(); //spruce-up the whitespace issues

    addWhitespace$1(newTerms); //insert this segment into the linked-list

    stitchIn$1(original, newPhrase, newTerms); //increase the length of our phrases

    var toStretch = [original];
    var docs = [doc];
    docs = docs.concat(doc.parents());
    docs.forEach(function (d) {
      // only the phrases that should change
      var shouldChange = d.list.filter(function (p) {
        return p.hasId(starterId) || p.hasId(newPhrase.start);
      });
      toStretch = toStretch.concat(shouldChange);
    }); // don't double-count

    toStretch = unique$1(toStretch); // stretch these phrases

    toStretch.forEach(function (p) {
      p.length += newPhrase.length; // change the start too, if necessary

      if (p.start === starterId) {
        p.start = newPhrase.start;
      }

      p.cache = {};
    });
    return original;
  };

  var prepend = joinPhrase;

  //recursively decrease the length of all the parent phrases
  var shrinkAll = function shrinkAll(doc, id, deleteLength, after) {
    var arr = doc.parents();
    arr.push(doc);
    arr.forEach(function (d) {
      //find our phrase to shrink
      var phrase = d.list.find(function (p) {
        return p.hasId(id);
      });

      if (!phrase) {
        return;
      }

      phrase.length -= deleteLength; // does it start with this soon-removed word?

      if (phrase.start === id) {
        phrase.start = after.id;
      }

      phrase.cache = {};
    }); // cleanup empty phrase objects

    doc.list = doc.list.filter(function (p) {
      if (!p.start || !p.length) {
        return false;
      }

      return true;
    });
  };
  /** wrap the linked-list around these terms
   * so they don't appear any more
   */


  var deletePhrase = function deletePhrase(phrase, doc) {
    var pool = doc.pool();
    var terms = phrase.terms(); //grab both sides of the chain,

    var prev = pool.get(terms[0].prev) || {};
    var after = pool.get(terms[terms.length - 1].next) || {};

    if (terms[0].implicit && prev.implicit) {
      prev.set(prev.implicit);
      prev.post += ' ';
    } // //first, change phrase lengths


    shrinkAll(doc, phrase.start, phrase.length, after); // connect [prev]->[after]

    if (prev) {
      prev.next = after.id;
    } // connect [prev]<-[after]


    if (after) {
      after.prev = prev.id;
    } // lastly, actually delete the terms from the pool?
    // for (let i = 0; i < terms.length; i++) {
    //   pool.remove(terms[i].id)
    // }

  };

  var _delete = deletePhrase;

  /** put this text at the end */

  var append_1 = function append_1(newPhrase, doc) {
    append(this, newPhrase, doc);
    return this;
  };
  /** add this text to the beginning */


  var prepend_1 = function prepend_1(newPhrase, doc) {
    prepend(this, newPhrase, doc);
    return this;
  };

  var _delete$1 = function _delete$1(doc) {
    _delete(this, doc);
    return this;
  }; // stich-in newPhrase, stretch 'doc' + parents


  var replace = function replace(newPhrase, doc) {
    //add it do the end
    var firstLength = this.length;
    append(this, newPhrase, doc); //delete original terms

    var tmp = this.buildFrom(this.start, this.length);
    tmp.length = firstLength;
    _delete(tmp, doc);
  };
  /**
   * Turn this phrase object into 3 phrase objects
   */


  var splitOn = function splitOn(p) {
    var terms = this.terms();
    var result = {
      before: null,
      match: null,
      after: null
    };
    var index = terms.findIndex(function (t) {
      return t.id === p.start;
    });

    if (index === -1) {
      return result;
    } //make all three sections into phrase-objects


    var start = terms.slice(0, index);

    if (start.length > 0) {
      result.before = this.buildFrom(start[0].id, start.length);
    }

    var match = terms.slice(index, index + p.length);

    if (match.length > 0) {
      result.match = this.buildFrom(match[0].id, match.length);
    }

    var end = terms.slice(index + p.length, terms.length);

    if (end.length > 0) {
      result.after = this.buildFrom(end[0].id, end.length, this.pool);
    }

    return result;
  };

  var _04Insert = {
    append: append_1,
    prepend: prepend_1,
    "delete": _delete$1,
    replace: replace,
    splitOn: splitOn
  };

  /** return json metadata for this phrase */
  var json$1 = function json() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var world = arguments.length > 1 ? arguments[1] : undefined;
    var res = {}; // text data

    if (options.text) {
      res.text = this.text();
    }

    if (options.normal) {
      res.normal = this.text('normal');
    }

    if (options.clean) {
      res.clean = this.text('clean');
    }

    if (options.reduced) {
      res.reduced = this.text('reduced');
    }

    if (options.root) {
      res.root = this.text('root');
    }

    if (options.trim) {
      if (res.text) {
        res.text = res.text.trim();
      }

      if (res.normal) {
        res.normal = res.normal.trim();
      }

      if (res.reduced) {
        res.reduced = res.reduced.trim();
      }
    } // terms data


    if (options.terms) {
      if (options.terms === true) {
        options.terms = {};
      }

      res.terms = this.terms().map(function (t) {
        return t.json(options.terms, world);
      });
    }

    return res;
  };

  var _05Json$1 = {
    json: json$1
  };

  /** match any terms after this phrase */
  var lookAhead = function lookAhead(regs) {
    // if empty match string, return everything after
    if (!regs) {
      regs = '.*';
    }

    var pool = this.pool; // get a list of all terms preceding our start

    var terms = [];

    var getAfter = function getAfter(id) {
      var term = pool.get(id);

      if (!term) {
        return;
      }

      terms.push(term);

      if (term.prev) {
        getAfter(term.next); //recursion
      }
    };

    var all = this.terms();
    var lastTerm = all[all.length - 1];
    getAfter(lastTerm.next);

    if (terms.length === 0) {
      return [];
    } // got the terms, make a phrase from them


    var p = this.buildFrom(terms[0].id, terms.length);
    return p.match(regs);
  };
  /** match any terms before this phrase */


  var lookBehind = function lookBehind(regs) {
    // if empty match string, return everything before
    if (!regs) {
      regs = '.*';
    }

    var pool = this.pool; // get a list of all terms preceding our start

    var terms = [];

    var getBefore = function getBefore(id) {
      var term = pool.get(id);

      if (!term) {
        return;
      }

      terms.push(term);

      if (term.prev) {
        getBefore(term.prev); //recursion
      }
    };

    var term = pool.get(this.start);
    getBefore(term.prev);

    if (terms.length === 0) {
      return [];
    } // got the terms, make a phrase from them


    var p = this.buildFrom(terms[terms.length - 1].id, terms.length);
    return p.match(regs);
  };

  var _06Lookahead = {
    lookAhead: lookAhead,
    lookBehind: lookBehind
  };

  var methods$1 = Object.assign({}, _01Utils, _02Text, _03Change, _04Insert, _05Json$1, _06Lookahead);

  // try to avoid doing the match
  var failFast = function failFast(p, regs) {
    if (regs.length === 0) {
      return true;
    }

    for (var i = 0; i < regs.length; i += 1) {
      var reg = regs[i]; //logical quick-ones

      if (reg.optional !== true && reg.negative !== true) {
        //start/end impossibilites
        if (reg.start === true && i > 0) {
          return true;
        }
      } //this is not possible


      if (reg.anything === true && reg.negative === true) {
        return true;
      }
    }

    return false;
  };

  var _02FailFast = failFast;

  //found a match? it's greedy? keep going!

  var getGreedy = function getGreedy(terms, t, reg, until, index, length) {
    var start = t;

    for (; t < terms.length; t += 1) {
      //stop for next-reg match
      if (until && terms[t].doesMatch(until, index + t, length)) {
        return t;
      }

      var count = t - start + 1; // is it max-length now?

      if (reg.max !== undefined && count === reg.max) {
        return t;
      } //stop here


      if (terms[t].doesMatch(reg, index + t, length) === false) {
        // is it too short?
        if (reg.min !== undefined && count < reg.min) {
          return null;
        }

        return t;
      }
    }

    return t;
  }; //'unspecific greedy' is a weird situation.


  var greedyTo = function greedyTo(terms, t, nextReg, index, length) {
    //if there's no next one, just go off the end!
    if (!nextReg) {
      return terms.length;
    } //otherwise, we're looking for the next one


    for (; t < terms.length; t += 1) {
      if (terms[t].doesMatch(nextReg, index + t, length) === true) {
        return t;
      }
    } //guess it doesn't exist, then.


    return null;
  }; // get or create named group


  var getOrCreateGroup = function getOrCreateGroup(namedGroups, namedGroupId, terms, startIndex, group) {
    var g = namedGroups[namedGroupId];

    if (g) {
      return g;
    }

    var id = terms[startIndex].id;
    namedGroups[namedGroupId] = {
      group: String(group),
      start: id,
      length: 0
    };
    return namedGroups[namedGroupId];
  };
  /** tries to match a sequence of terms, starting from here */


  var tryHere = function tryHere(terms, regs, index, length) {
    var namedGroups = {};
    var previousGroupId = null;
    var t = 0; // we must satisfy each rule in 'regs'

    for (var r = 0; r < regs.length; r += 1) {
      var reg = regs[r]; // Check if this reg has a named capture group

      var isNamedGroup = typeof reg.named === 'string' || typeof reg.named === 'number';
      var namedGroupId = null; // Reuse previous capture group if same

      if (isNamedGroup) {
        var prev = regs[r - 1];

        if (prev && prev.named === reg.named && previousGroupId) {
          namedGroupId = previousGroupId;
        } else {
          namedGroupId = _id(reg.named);
          previousGroupId = namedGroupId;
        }
      } //should we fail here?


      if (!terms[t]) {
        //are all remaining regs optional?
        var hasNeeds = regs.slice(r).some(function (remain) {
          return !remain.optional;
        });

        if (hasNeeds === false) {
          break;
        } // have unmet needs


        return [false, null];
      } //support 'unspecific greedy' .* properly


      if (reg.anything === true && reg.greedy === true) {
        var skipto = greedyTo(terms, t, regs[r + 1], reg, index); // ensure it's long enough

        if (reg.min !== undefined && skipto - t < reg.min) {
          return [false, null];
        } // reduce it back, if it's too long


        if (reg.max !== undefined && skipto - t > reg.max) {
          t = t + reg.max;
          continue;
        }

        if (skipto === null) {
          return [false, null]; //couldn't find it
        } // is it really this easy?....


        if (isNamedGroup) {
          var g = getOrCreateGroup(namedGroups, namedGroupId, terms, t, reg.named); // Update group

          g.length = skipto - t;
        }

        t = skipto;
        continue;
      } //if it looks like a match, continue
      //we have a special case where an end-anchored greedy match may need to
      //start matching before the actual end; we do this by (temporarily!)
      //removing the "end" property from the matching token... since this is
      //very situation-specific, we *only* do this when we really need to.


      if (reg.anything === true || reg.end === true && reg.greedy === true && index + t < length - 1 && terms[t].doesMatch(Object.assign({}, reg, {
        end: false
      }), index + t, length) === true || terms[t].doesMatch(reg, index + t, length) === true) {
        var startAt = t; // okay, it was a match, but if it optional too,
        // we should check the next reg too, to skip it?

        if (reg.optional && regs[r + 1]) {
          // does the next reg match it too?
          if (terms[t].doesMatch(regs[r + 1], index + t, length) === true) {
            // but does the next reg match the next term??
            // only skip if it doesn't
            if (!terms[t + 1] || terms[t + 1].doesMatch(regs[r + 1], index + t, length) === false) {
              r += 1;
            }
          }
        } //advance to the next term!


        t += 1; //check any ending '$' flags

        if (reg.end === true) {
          //if this isn't the last term, refuse the match
          if (t !== terms.length && reg.greedy !== true) {
            return [false, null];
          }
        } //try keep it going!


        if (reg.greedy === true) {
          // for greedy checking, we no longer care about the reg.start
          // value, and leaving it can cause failures for anchored greedy
          // matches.  ditto for end-greedy matches: we need an earlier non-
          // ending match to succceed until we get to the actual end.
          t = getGreedy(terms, t, Object.assign({}, reg, {
            start: false,
            end: false
          }), regs[r + 1], index, length);

          if (t === null) {
            return [false, null]; //greedy was too short
          }

          if (reg.min && reg.min > t) {
            return [false, null]; //greedy was too short
          } // if this was also an end-anchor match, check to see we really
          // reached the end


          if (reg.end === true && index + t !== length) {
            return [false, null]; //greedy didn't reach the end
          }
        }

        if (isNamedGroup) {
          // Get or create capture group
          var _g = getOrCreateGroup(namedGroups, namedGroupId, terms, startAt, reg.named); // Update group - add greedy or increment length


          if (t > 1 && reg.greedy) {
            _g.length += t - startAt;
          } else {
            _g.length++;
          }
        }

        continue;
      } //bah, who cares, keep going


      if (reg.optional === true) {
        continue;
      } // should we skip-over an implicit word?


      if (terms[t].isImplicit() && regs[r - 1] && terms[t + 1]) {
        // does the next one match?
        if (terms[t + 1].doesMatch(reg, index + t, length)) {
          t += 2;
          continue;
        }
      } // console.log('   ❌\n\n')


      return [false, null];
    } //return our result


    return [terms.slice(0, t), namedGroups];
  };

  var _03TryMatch = tryHere;

  var postProcess = function postProcess(terms, regs, matches) {
    if (!matches || matches.length === 0) {
      return matches;
    } // ensure end reg has the end term


    var atEnd = regs.some(function (r) {
      return r.end;
    });

    if (atEnd) {
      var lastTerm = terms[terms.length - 1];
      matches = matches.filter(function (_ref) {
        var arr = _ref.match;
        return arr.indexOf(lastTerm) !== -1;
      });
    }

    return matches;
  };

  var _04PostProcess = postProcess;

  /* break-down a match expression into this:
  {
    word:'',
    tag:'',
    regex:'',

    start:false,
    end:false,
    negative:false,
    anything:false,
    greedy:false,
    optional:false,

    named:'',
    choices:[],
  }
  */
  var hasMinMax = /\{([0-9]+,?[0-9]*)\}/;
  var andSign = /&&/;
  var captureName = new RegExp(/^<(\S+)>/);

  var titleCase$2 = function titleCase(str) {
    return str.charAt(0).toUpperCase() + str.substr(1);
  };

  var end = function end(str) {
    return str[str.length - 1];
  };

  var start = function start(str) {
    return str[0];
  };

  var stripStart = function stripStart(str) {
    return str.substr(1);
  };

  var stripEnd = function stripEnd(str) {
    return str.substr(0, str.length - 1);
  };

  var stripBoth = function stripBoth(str) {
    str = stripStart(str);
    str = stripEnd(str);
    return str;
  }; //


  var parseToken = function parseToken(w) {
    var obj = {}; //collect any flags (do it twice)

    for (var i = 0; i < 2; i += 1) {
      //end-flag
      if (end(w) === '$') {
        obj.end = true;
        w = stripEnd(w);
      } //front-flag


      if (start(w) === '^') {
        obj.start = true;
        w = stripStart(w);
      } //capture group (this one can span multiple-terms)


      if (start(w) === '[' || end(w) === ']') {
        obj.named = true;

        if (start(w) === '[') {
          obj.groupType = end(w) === ']' ? 'single' : 'start';
        } else {
          obj.groupType = 'end';
        }

        w = w.replace(/^\[/, '');
        w = w.replace(/\]$/, ''); // Use capture group name

        if (start(w) === '<') {
          var res = captureName.exec(w);

          if (res.length >= 2) {
            obj.named = res[1];
            w = w.replace(res[0], '');
          }
        }
      } //back-flags


      if (end(w) === '+') {
        obj.greedy = true;
        w = stripEnd(w);
      }

      if (w !== '*' && end(w) === '*' && w !== '\\*') {
        obj.greedy = true;
        w = stripEnd(w);
      }

      if (end(w) === '?') {
        obj.optional = true;
        w = stripEnd(w);
      }

      if (start(w) === '!') {
        obj.negative = true;
        w = stripStart(w);
      } //wrapped-flags


      if (start(w) === '(' && end(w) === ')') {
        // support (one && two)
        if (andSign.test(w)) {
          obj.choices = w.split(andSign);
          obj.operator = 'and';
        } else {
          obj.choices = w.split('|');
          obj.operator = 'or';
        } //remove '(' and ')'


        obj.choices[0] = stripStart(obj.choices[0]);
        var last = obj.choices.length - 1;
        obj.choices[last] = stripEnd(obj.choices[last]); // clean up the results

        obj.choices = obj.choices.map(function (s) {
          return s.trim();
        });
        obj.choices = obj.choices.filter(function (s) {
          return s;
        }); //recursion alert!

        obj.choices = obj.choices.map(parseToken);
        w = '';
      } //regex


      if (start(w) === '/' && end(w) === '/') {
        w = stripBoth(w);
        obj.regex = new RegExp(w); //potential vuln - security/detect-non-literal-regexp

        return obj;
      } //soft-match


      if (start(w) === '~' && end(w) === '~') {
        w = stripBoth(w);
        obj.soft = true;
        obj.word = w;
        return obj;
      }
    } // support #Tag{0,9}


    if (hasMinMax.test(w) === true) {
      w = w.replace(hasMinMax, function (a, b) {
        var arr = b.split(/,/g);

        if (arr.length === 1) {
          // '{3}'	Exactly three times
          obj.min = Number(arr[0]);
          obj.max = Number(arr[0]);
        } else {
          // '{2,4}' Two to four times
          // '{3,}' Three or more times
          obj.min = Number(arr[0]);
          obj.max = Number(arr[1] || 999);
        }

        obj.greedy = true;
        return '';
      });
    } //do the actual token content


    if (start(w) === '#') {
      obj.tag = stripStart(w);
      obj.tag = titleCase$2(obj.tag);
      return obj;
    } //dynamic function on a term object


    if (start(w) === '@') {
      obj.method = stripStart(w);
      return obj;
    }

    if (w === '.') {
      obj.anything = true;
      return obj;
    } //support alone-astrix


    if (w === '*') {
      obj.anything = true;
      obj.greedy = true;
      obj.optional = true;
      return obj;
    }

    if (w) {
      //somehow handle encoded-chars?
      w = w.replace('\\*', '*');
      w = w.replace('\\.', '.');
      obj.word = w.toLowerCase();
    }

    return obj;
  };

  var parseToken_1 = parseToken;

  var isNamed = function isNamed(capture) {
    return typeof capture === 'string' || typeof capture === 'number';
  };

  var fillGroups = function fillGroups(tokens) {
    var convert = false;
    var index = -1;
    var current; //'fill in' capture groups between start-end

    for (var i = 0; i < tokens.length; i++) {
      var n = tokens[i]; // Give name to un-named single tokens

      if (n.groupType === 'single' && n.named === true) {
        index += 1;
        n.named = index;
        continue;
      } // Start converting tokens


      if (n.groupType === 'start') {
        convert = true;

        if (isNamed(n.named)) {
          current = n.named;
        } else {
          index += 1;
          current = index;
        }
      } // Ensure this token has the right name


      if (convert) {
        n.named = current;
      } // Stop converting tokens


      if (n.groupType === 'end') {
        convert = false;
      }
    }

    return tokens;
  };

  var useOneOf = function useOneOf(tokens) {
    return tokens.map(function (token) {
      if (token.choices !== undefined) {
        // are they all straight non-optional words?
        var shouldPack = token.choices.every(function (c) {
          return c.optional !== true && c.negative !== true && c.word !== undefined;
        });

        if (shouldPack === true) {
          var oneOf = {};
          token.choices.forEach(function (c) {
            return oneOf[c.word] = true;
          });
          token.oneOf = oneOf;
          delete token.choices;
        }
      }

      return token;
    });
  };

  var postProcess$1 = function postProcess(tokens) {
    // ensure all capture groups are filled between start and end
    // give all capture groups names
    var count = tokens.filter(function (t) {
      return t.groupType;
    }).length;

    if (count > 0) {
      tokens = fillGroups(tokens);
    } // convert 'choices' format to 'oneOf' format


    tokens = useOneOf(tokens); // console.log(tokens)

    return tokens;
  };

  var postProcess_1 = postProcess$1;

  var isArray$1 = function isArray(arr) {
    return Object.prototype.toString.call(arr) === '[object Array]';
  }; //split-up by (these things)


  var byParentheses = function byParentheses(str) {
    var arr = str.split(/([\^\[\!]*(?:<\S+>)?\(.*?\)[?+*]*\]?\$?)/);
    arr = arr.map(function (s) {
      return s.trim();
    });
    return arr;
  };

  var byWords = function byWords(arr) {
    var words = [];
    arr.forEach(function (a) {
      //keep brackets lumped together
      if (/^[[^_/]?\(/.test(a[0])) {
        words.push(a);
        return;
      }

      var list = a.split(' ');
      list = list.filter(function (w) {
        return w;
      });
      words = words.concat(list);
    });
    return words;
  }; //turn an array into a 'choices' list


  var byArray = function byArray(arr) {
    return [{
      choices: arr.map(function (s) {
        return {
          word: s
        };
      })
    }];
  };

  var fromDoc = function fromDoc(doc) {
    if (!doc || !doc.list || !doc.list[0]) {
      return [];
    }

    var ids = [];
    doc.list.forEach(function (p) {
      p.terms().forEach(function (t) {
        ids.push({
          id: t.id
        });
      });
    });
    return [{
      choices: ids,
      greedy: true
    }];
  };
  /** parse a match-syntax string into json */


  var syntax = function syntax(input) {
    // fail-fast
    if (input === null || input === undefined || input === '') {
      return [];
    } //try to support a ton of different formats:


    if (_typeof(input) === 'object') {
      if (isArray$1(input)) {
        if (input.length === 0 || !input[0]) {
          return [];
        } //is it a pre-parsed reg-list?


        if (_typeof(input[0]) === 'object') {
          return input;
        } //support a flat array of normalized words


        if (typeof input[0] === 'string') {
          return byArray(input);
        }
      } //support passing-in a compromise object as a match


      if (input && input.isA === 'Doc') {
        return fromDoc(input);
      }

      return [];
    }

    if (typeof input === 'number') {
      input = String(input); //go for it?
    }

    var tokens = byParentheses(input);
    tokens = byWords(tokens);
    tokens = tokens.map(parseToken_1); //clean up anything weird

    tokens = postProcess_1(tokens); // console.log(JSON.stringify(tokens, null, 2))

    return tokens;
  };

  var syntax_1 = syntax;

  /**  returns a simple array of arrays */

  var matchAll = function matchAll(p, regs) {
    var matchOne = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    //if we forgot to parse it..
    if (typeof regs === 'string') {
      regs = syntax_1(regs);
    } //try to dismiss it, at-once


    if (_02FailFast(p, regs) === true) {
      return [];
    } //any match needs to be this long, at least


    var minLength = regs.filter(function (r) {
      return r.optional !== true;
    }).length;
    var terms = p.terms();
    var matches = []; //optimisation for '^' start logic

    if (regs[0].start === true) {
      var _tryMatch = _03TryMatch(terms, regs, 0, terms.length),
          _tryMatch2 = _slicedToArray(_tryMatch, 2),
          match = _tryMatch2[0],
          groups = _tryMatch2[1];

      if (match !== false && match.length > 0) {
        match = match.filter(function (m) {
          return m;
        });
        matches.push({
          match: match,
          groups: groups
        });
      }

      return _04PostProcess(terms, regs, matches);
    } //try starting, from every term


    for (var i = 0; i < terms.length; i += 1) {
      // slice may be too short
      if (i + minLength > terms.length) {
        break;
      } //try it!


      var _tryMatch3 = _03TryMatch(terms.slice(i), regs, i, terms.length),
          _tryMatch4 = _slicedToArray(_tryMatch3, 2),
          _match = _tryMatch4[0],
          _groups = _tryMatch4[1];

      if (_match !== false && _match.length > 0) {
        //zoom forward!
        i += _match.length - 1; //[capture-groups] return some null responses

        _match = _match.filter(function (m) {
          return m;
        });
        matches.push({
          match: _match,
          groups: _groups
        }); //ok, maybe that's enough?

        if (matchOne === true) {
          return _04PostProcess(terms, regs, matches);
        }
      }
    }

    return _04PostProcess(terms, regs, matches);
  };

  var _01MatchAll = matchAll;

  /** return anything that doesn't match.
   * returns a simple array of arrays
   */

  var notMatch = function notMatch(p, regs) {
    var found = {};
    var arr = _01MatchAll(p, regs);
    arr.forEach(function (_ref) {
      var ts = _ref.match;
      ts.forEach(function (t) {
        found[t.id] = true;
      });
    }); //return anything not found

    var terms = p.terms();
    var result = [];
    var current = [];
    terms.forEach(function (t) {
      if (found[t.id] === true) {
        if (current.length > 0) {
          result.push(current);
          current = [];
        }

        return;
      }

      current.push(t);
    });

    if (current.length > 0) {
      result.push(current);
    }

    return result;
  };

  var not = notMatch;

  /** return an array of matching phrases */

  var match_1 = function match_1(regs) {
    var _this = this;

    var justOne = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var matches = _01MatchAll(this, regs, justOne); //make them phrase objects

    matches = matches.map(function (_ref) {
      var match = _ref.match,
          groups = _ref.groups;

      var p = _this.buildFrom(match[0].id, match.length, groups);

      p.cache.terms = match;
      return p;
    });
    return matches;
  };
  /** return boolean if one match is found */


  var has = function has(regs) {
    var matches = _01MatchAll(this, regs, true);
    return matches.length > 0;
  };
  /** remove all matches from the result */


  var not$1 = function not$1(regs) {
    var _this2 = this;

    var matches = not(this, regs); //make them phrase objects

    matches = matches.map(function (list) {
      return _this2.buildFrom(list[0].id, list.length);
    });
    return matches;
  };
  /** return a list of phrases that can have this tag */


  var canBe$1 = function canBe(tag, world) {
    var _this3 = this;

    var results = [];
    var terms = this.terms();
    var previous = false;

    for (var i = 0; i < terms.length; i += 1) {
      var can = terms[i].canBe(tag, world);

      if (can === true) {
        if (previous === true) {
          //add it to the end
          results[results.length - 1].push(terms[i]);
        } else {
          results.push([terms[i]]); //make a new one
        }

        previous = can;
      }
    } //turn them into Phrase objects


    results = results.filter(function (a) {
      return a.length > 0;
    }).map(function (arr) {
      return _this3.buildFrom(arr[0].id, arr.length);
    });
    return results;
  };

  var match = {
    match: match_1,
    has: has,
    not: not$1,
    canBe: canBe$1
  };

  var Phrase = function Phrase(id, length, pool) {
    _classCallCheck(this, Phrase);

    this.start = id;
    this.length = length;
    this.isA = 'Phrase'; // easier than .constructor...

    Object.defineProperty(this, 'pool', {
      enumerable: false,
      writable: true,
      value: pool
    });
    Object.defineProperty(this, 'cache', {
      enumerable: false,
      writable: true,
      value: {}
    });
    Object.defineProperty(this, 'groups', {
      enumerable: false,
      writable: true,
      value: {}
    });
  };
  /** create a new Phrase object from an id and length */


  Phrase.prototype.buildFrom = function (id, length, groups) {
    var p = new Phrase(id, length, this.pool); //copy-over or replace capture-groups too

    if (groups && Object.keys(groups).length > 0) {
      p.groups = groups;
    } else {
      p.groups = this.groups;
    }

    return p;
  }; //apply methods


  Object.assign(Phrase.prototype, match);
  Object.assign(Phrase.prototype, methods$1); //apply aliases

  var aliases = {
    term: 'terms'
  };
  Object.keys(aliases).forEach(function (k) {
    return Phrase.prototype[k] = Phrase.prototype[aliases[k]];
  });
  var Phrase_1 = Phrase;

  /** a key-value store of all terms in our Document */
  var Pool = /*#__PURE__*/function () {
    function Pool() {
      var words = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      _classCallCheck(this, Pool);

      //quiet this property in console.logs
      Object.defineProperty(this, 'words', {
        enumerable: false,
        value: words
      });
    }
    /** throw a new term object in */


    _createClass(Pool, [{
      key: "add",
      value: function add(term) {
        this.words[term.id] = term;
        return this;
      }
      /** find a term by it's id */

    }, {
      key: "get",
      value: function get(id) {
        return this.words[id];
      }
      /** find a term by it's id */

    }, {
      key: "remove",
      value: function remove(id) {
        delete this.words[id];
      }
    }, {
      key: "merge",
      value: function merge(pool) {
        Object.assign(this.words, pool.words);
        return this;
      }
      /** helper method */

    }, {
      key: "stats",
      value: function stats() {
        return {
          words: Object.keys(this.words).length
        };
      }
    }]);

    return Pool;
  }();
  /** make a deep-copy of all terms */


  Pool.prototype.clone = function () {
    var _this = this;

    var keys = Object.keys(this.words);
    var words = keys.reduce(function (h, k) {
      var t = _this.words[k].clone();

      h[t.id] = t;
      return h;
    }, {});
    return new Pool(words);
  };

  var Pool_1 = Pool;

  //add forward/backward 'linked-list' prev/next ids
  var linkTerms = function linkTerms(terms) {
    terms.forEach(function (term, i) {
      if (i > 0) {
        term.prev = terms[i - 1].id;
      }

      if (terms[i + 1]) {
        term.next = terms[i + 1].id;
      }
    });
  };

  var _linkTerms = linkTerms;

  //(Rule-based sentence boundary segmentation) - chop given text into its proper sentences.
  // Ignore periods/questions/exclamations used in acronyms/abbreviations/numbers, etc.
  // @spencermountain 2017 MIT
  //proper nouns with exclamation marks
  // const blacklist = {
  //   yahoo: true,
  //   joomla: true,
  //   jeopardy: true,
  // }
  //regs-
  var initSplit = /(\S.+?[.!?\u203D\u2E18\u203C\u2047-\u2049])(?=\s+|$)/g;
  var hasSomething = /\S/;
  var isAcronym$1 = /[ .][A-Z]\.? *$/i;
  var hasEllipse = /(?:\u2026|\.{2,}) *$/;
  var newLine = /((?:\r?\n|\r)+)/; // Match different new-line formats

  var hasLetter = /[a-z0-9\u00C0-\u00FF\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]/i;
  var startWhitespace = /^\s+/; // Start with a regex:

  var naiive_split = function naiive_split(text) {
    var all = []; //first, split by newline

    var lines = text.split(newLine);

    for (var i = 0; i < lines.length; i++) {
      //split by period, question-mark, and exclamation-mark
      var arr = lines[i].split(initSplit);

      for (var o = 0; o < arr.length; o++) {
        all.push(arr[o]);
      }
    }

    return all;
  };
  /** does this look like a sentence? */


  var isSentence = function isSentence(str, abbrevs) {
    // check for 'F.B.I.'
    if (isAcronym$1.test(str) === true) {
      return false;
    } //check for '...'


    if (hasEllipse.test(str) === true) {
      return false;
    } // must have a letter


    if (hasLetter.test(str) === false) {
      return false;
    }

    var txt = str.replace(/[.!?\u203D\u2E18\u203C\u2047-\u2049] *$/, '');
    var words = txt.split(' ');
    var lastWord = words[words.length - 1].toLowerCase(); // check for 'Mr.'

    if (abbrevs.hasOwnProperty(lastWord)) {
      return false;
    } // //check for jeopardy!
    // if (blacklist.hasOwnProperty(lastWord)) {
    //   return false
    // }


    return true;
  };

  var splitSentences = function splitSentences(text, world) {
    var abbrevs = world.cache.abbreviations;
    text = text || '';
    text = String(text);
    var sentences = []; // First do a greedy-split..

    var chunks = []; // Ensure it 'smells like' a sentence

    if (!text || typeof text !== 'string' || hasSomething.test(text) === false) {
      return sentences;
    } // cleanup unicode-spaces


    text = text.replace('\xa0', ' '); // Start somewhere:

    var splits = naiive_split(text); // Filter-out the crap ones

    for (var i = 0; i < splits.length; i++) {
      var s = splits[i];

      if (s === undefined || s === '') {
        continue;
      } //this is meaningful whitespace


      if (hasSomething.test(s) === false) {
        //add it to the last one
        if (chunks[chunks.length - 1]) {
          chunks[chunks.length - 1] += s;
          continue;
        } else if (splits[i + 1]) {
          //add it to the next one
          splits[i + 1] = s + splits[i + 1];
          continue;
        }
      } //else, only whitespace, no terms, no sentence


      chunks.push(s);
    } //detection of non-sentence chunks:
    //loop through these chunks, and join the non-sentence chunks back together..


    for (var _i = 0; _i < chunks.length; _i++) {
      var c = chunks[_i]; //should this chunk be combined with the next one?

      if (chunks[_i + 1] && isSentence(c, abbrevs) === false) {
        chunks[_i + 1] = c + (chunks[_i + 1] || '');
      } else if (c && c.length > 0) {
        //&& hasLetter.test(c)
        //this chunk is a proper sentence..
        sentences.push(c);
        chunks[_i] = '';
      }
    } //if we never got a sentence, return the given text


    if (sentences.length === 0) {
      return [text];
    } //move whitespace to the ends of sentences, when possible
    //['hello',' world'] -> ['hello ','world']


    for (var _i2 = 1; _i2 < sentences.length; _i2 += 1) {
      var ws = sentences[_i2].match(startWhitespace);

      if (ws !== null) {
        sentences[_i2 - 1] += ws[0];
        sentences[_i2] = sentences[_i2].replace(startWhitespace, '');
      }
    }

    return sentences;
  };

  var _01Sentences = splitSentences; // console.log(sentence_parser('john f. kennedy'));

  var wordlike = /\S/;
  var isBoundary = /^[!?.]+$/;
  var naiiveSplit = /(\S+)/;
  var isSlash = /[a-z] ?\/ ?[a-z]*$/;
  var notWord = {
    '.': true,
    '-': true,
    //dash
    '–': true,
    //en-dash
    '—': true,
    //em-dash
    '--': true,
    '...': true // '/': true, // 'one / two'

  };

  var hasHyphen = function hasHyphen(str) {
    //dont split 're-do'
    if (/^(re|un)-?[^aeiou]./.test(str) === true) {
      return false;
    } //letter-number


    var reg = /^([a-z\u00C0-\u00FF`"'/]+)(-|–|—)([a-z0-9\u00C0-\u00FF].*)/i;

    if (reg.test(str) === true) {
      return true;
    } //support weird number-emdash combo '2010–2011'
    // let reg2 = /^([0-9]+)(–|—)([0-9].*)/i
    // if (reg2.test(str)) {
    //   return true
    // }


    return false;
  }; // 'he / she' should be one word


  var combineSlashes = function combineSlashes(arr) {
    for (var i = 1; i < arr.length - 1; i++) {
      if (isSlash.test(arr[i])) {
        arr[i - 1] += arr[i] + arr[i + 1];
        arr[i] = null;
        arr[i + 1] = null;
      }
    }

    return arr;
  };

  var splitHyphens = function splitHyphens(word) {
    var arr = []; //support multiple-hyphenated-terms

    var hyphens = word.split(/[-–—]/);
    var whichDash = '-';
    var found = word.match(/[-–—]/);

    if (found && found[0]) {
      whichDash = found;
    }

    for (var o = 0; o < hyphens.length; o++) {
      if (o === hyphens.length - 1) {
        arr.push(hyphens[o]);
      } else {
        arr.push(hyphens[o] + whichDash);
      }
    }

    return arr;
  };

  var isArray$2 = function isArray(arr) {
    return Object.prototype.toString.call(arr) === '[object Array]';
  }; //turn a string into an array of strings (naiive for now, lumped later)


  var splitWords = function splitWords(str) {
    var result = [];
    var arr = []; //start with a naiive split

    str = str || '';

    if (typeof str === 'number') {
      str = String(str);
    }

    if (isArray$2(str)) {
      return str;
    }

    var words = str.split(naiiveSplit);

    for (var i = 0; i < words.length; i++) {
      //split 'one-two'
      if (hasHyphen(words[i]) === true) {
        arr = arr.concat(splitHyphens(words[i]));
        continue;
      }

      arr.push(words[i]);
    } //greedy merge whitespace+arr to the right


    var carry = '';

    for (var _i = 0; _i < arr.length; _i++) {
      var word = arr[_i]; //if it's more than a whitespace

      if (wordlike.test(word) === true && notWord.hasOwnProperty(word) === false && isBoundary.test(word) === false) {
        //put whitespace on end of previous term, if possible
        if (result.length > 0) {
          result[result.length - 1] += carry;
          result.push(word);
        } else {
          //otherwise, but whitespace before
          result.push(carry + word);
        }

        carry = '';
      } else {
        carry += word;
      }
    } //handle last one


    if (carry) {
      if (result.length === 0) {
        result[0] = '';
      }

      result[result.length - 1] += carry; //put it on the end
    } // combine 'one / two'


    result = combineSlashes(result); // remove empty results

    result = result.filter(function (s) {
      return s;
    });
    return result;
  };

  var _02Words = splitWords;

  var isArray$3 = function isArray(arr) {
    return Object.prototype.toString.call(arr) === '[object Array]';
  };
  /** turn a string into an array of Phrase objects */


  var fromText = function fromText() {
    var text = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    var world = arguments.length > 1 ? arguments[1] : undefined;
    var pool = arguments.length > 2 ? arguments[2] : undefined;
    var sentences = null; //a bit of validation, first

    if (typeof text !== 'string') {
      if (typeof text === 'number') {
        text = String(text);
      } else if (isArray$3(text)) {
        sentences = text;
      }
    } //tokenize into words


    sentences = sentences || _01Sentences(text, world);
    sentences = sentences.map(function (str) {
      return _02Words(str);
    }); //turn them into proper objects

    pool = pool || new Pool_1();
    var phrases = sentences.map(function (terms) {
      terms = terms.map(function (str) {
        var term = new Term_1(str);
        pool.add(term);
        return term;
      }); //add next/previous ids

      _linkTerms(terms); //return phrase objects

      var p = new Phrase_1(terms[0].id, terms.length, pool);
      p.cache.terms = terms;
      return p;
    }); //return them ready for a Document object

    return phrases;
  };

  var _01Tokenizer = fromText;

  var fromJSON = function fromJSON(json, world) {
    var pool = new Pool_1();
    var phrases = json.map(function (p, k) {
      var terms = p.terms.map(function (o, i) {
        var term = new Term_1(o.text);
        term.pre = o.pre !== undefined ? o.pre : '';

        if (o.post === undefined) {
          o.post = ' '; //no given space for very last term

          if (i >= p.terms.length - 1) {
            o.post = '. ';

            if (k >= p.terms.length - 1) {
              o.post = '.';
            }
          }
        }

        term.post = o.post !== undefined ? o.post : ' ';

        if (o.tags) {
          o.tags.forEach(function (tag) {
            return term.tag(tag, '', world);
          });
        }

        pool.add(term);
        return term;
      }); //add prev/next links

      _linkTerms(terms); // return a proper Phrase object

      return new Phrase_1(terms[0].id, terms.length, pool);
    });
    return phrases;
  };

  var fromJSON_1 = fromJSON;

  var _version = '13.7.0';

  var _data = {
    "Comparative": "true¦better",
    "Superlative": "true¦earlier",
    "PresentTense": "true¦is,sounds",
    "Value": "true¦a few",
    "Noun": "true¦a5b4c2f1here,ie,lit,m0no doubt,pd,tce;a,d;t,y;a,ca,o0;l,rp;a,l;d,l,rc",
    "Copula": "true¦a1is,w0;as,ere;m,re",
    "PastTense": "true¦be3came,d2had,lied,meant,sa2taken,w0;as,e0;nt,re;id;en,gan",
    "Condition": "true¦if,lest,unless",
    "Preposition": "true¦'o,-,aLbIcHdGexcept,fFiDmidQnotwithstandiRoBpSqua,sAt6u3vi2w0;/o,hereNith0;!in,oR;a,s-a-vis;n1p0;!on;like,til;h0ill,owards;an,r0;ough0u;!oJ;ans,ince,o that;',f0n2ut;!f;f,n0;!to;or,rom;espite,own,u3;hez,irca;ar1e0oAy;sides,tween;ri6;',bo7cross,ft6lo5m3propos,round,s1t0;!op;! long 0;as;id0ong0;!st;ng;er;ut",
    "Gerund": "true¦accord0be0develop0go0result0stain0;ing",
    "Negative": "true¦n0;ever,o0;!n,t",
    "QuestionWord": "true¦how3wh0;at,e1ich,o0y;!m,se;n,re; come,'s",
    "Plural": "true¦records",
    "Conjunction": "true¦&,aFbBcuz,how9in caEno8o7p5supposing,t2v1wh0yet;eth9ile;ers4s;h0o;eref9o0;!uC;l0rovided that;us;r,therwi6; matt1r;!ev0;er;e0ut;cau1f0;ore;se;lthou1nd,s 0;far as,if;gh",
    "Abbreviation": "true¦a0Tb0Qc0Kd0Ie0Ff0Cg0Ah08i06j04k02l00mRnOoNpIqHrFs9t6u5v2w0yb,µg;is0r,y0L;!c;a,b,e1i0ol,s,t;tro,vo;r,t;niv,safa,t;b1ce,d,e0sp;l,mp,nn,x;!l,sp;ask,e3fc,gt,i2q1r,s,t,u0;pt,rg;! ft;r,tu;c,nVp0;!t;b,d,e0;pSs,v;t,ue;a,d,enn3hd,l,p,r1s0t,vt;!eud;ef,o0;b,f,n;!a;ct,kla,nt,z;e0ov;b0e;!r;a7b,d,essrs,g,i4l3m2p1rHs0t;!tr;h,s;!e;!le;!n1s0;c,ter;!n;!j,r,sc;at,b,it,lb,m,ng,t0x;!d;an6b,g,m0;!ph;an,d,r,u0;l,n;a,da,e,n0;c,f;g,on,r0wy,z;!s;a0b,en,ov;!l;e1ig,l0m,r,t,y;! oz,a;b,m;a,g,ng,s1tc,x0;!p;p,q,t;ak,e0g,ist,l,m,r;c,f,pt,t;a3ca,g,l,m2o0pl,res,yn;!l0mdr,nn,rp;!o;!dr;!l0pt;!if;a,c,l1r0;ig,os;!dg,vd;d4l3p2r1ss0tty,ug,ve;n,t;c,iz;prox,r,t;!ta;!j,m,v",
    "Pronoun": "true¦'em,elle,h4i3me,ourselves,she5th1us,we,you0;!rself;e0ou;m,y;!l,t;e0im;!'s",
    "Singular": "true¦0:14;1:11;a13b0Rc0Id0Be08f03gYhUiTjel0kitty,lRmNnMoLpGquestionFrDs8t5u3w2;ay,om01;nc0Xs 2;doll0Jst0L; rex,a3h2ic,ragedy,v show;ere,i13;l0x return;i5ky,omeone,t2uper bowl,yst12;ep3ri10u2;de0Vff;faRmoR;st1ze;al0i0Wo2;om,se;! mark;a5i1la4r3u2;dOrpoG;erogaZobl0S;te,y1;rt,te0L;bjVceIthers;othi0Numb1;a4ee07o2;del,m2nopo0rni0Lth1;!my;n,yf0;i2unch;ly,ne;ci0Gnsect;ead start,o2uman right;l0me3u2;se;! run;adf0entlem5irl00laci1od,rand3u2;l0y; slam,fa2mo2;th1;an;a5ella,ly,ol0r3un2;di05;iUo2;nti1sO;mi0th1;conomy,gg,ner6ven3x2;ampRecu8;iZt;ad7e4inn1o2ragonf0ude;cumentFg2i0l0or;gy;ath,t2;ec2;tive;!dy;a8eiliRh6i4o2redit card;ttage,u2;ri1sin;ty,vil w2;ar;andeli1ocol2;ate;n2rD;ary;aAel0lesHo6r4u2;n2tterf0;tiG;eakfast,o2;!th1;dy,tt4y2;!fri2;end;le;nki9r2;ri1;er;d4l0noma0u2;nt;ly; homin4verti2;si2;ng;em",
    "Actor": "true¦aJbGcFdCengineIfAgardenIh9instructPjournalLlawyIm8nurse,opeOp5r3s1t0;echnCherapK;ailNcientJecretary,oldiGu0;pervKrgeon;e0oofE;ceptionGsearC;hotographClumbColi1r0sychologF;actitionBogrammB;cem6t5;echanic,inist9us4;airdress8ousekeep8;arm7ire0;fight6m2;eputy,iet0;ici0;an;arpent2lerk;ricklay1ut0;ch0;er;ccoun6d2ge7r0ssis6ttenda7;chitect,t0;ist;minist1v0;is1;rat0;or;ta0;nt",
    "Honorific": "true¦a01bYcQdPeOfiJgIhon,jr,king,lHmCoffic00p7queen,r3s0taoiseach,vice6;e1fc,gt,ir,r,u0;ltRpt,rg;cond liInBrgeaJ;abbi,e0;ar1p9s,v0;!erend; admirX;astOhd,r0vt;esideDi1of0;!essM;me mini4nce0;!ss;a3essrs,i2lle,me,r1s0;!tr;!s;stK;gistrate,j,r6yF;i3lb,t;en,ov;eld mar3rst l0;ady,i0;eutena0;nt;shG;sq,xcellency;et,oct6r,utchess;apt6hance4mdr,o0pl;lonel,m2ngress0unci3;m0wom0;an;dr,mand5;ll0;or;!ain;ldg,rig0;!adi0;er;d0sst,tty,yatullah;j,m0v;!ir0;al",
    "SportsTeam": "true¦0:1A;1:1H;2:1G;a1Eb16c0Td0Kfc dallas,g0Ihouston 0Hindiana0Gjacksonville jagua0k0El0Bm01newToQpJqueens parkIreal salt lake,sAt5utah jazz,vancouver whitecaps,w3yW;ashington 3est ham0Rh10;natio1Oredski2wizar0W;ampa bay 6e5o3;ronto 3ttenham hotspur;blue ja0Mrapto0;nnessee tita2xasC;buccanee0ra0K;a7eattle 5heffield0Kporting kansas0Wt3;. louis 3oke0V;c1Frams;marine0s3;eah15ounG;cramento Rn 3;antonio spu0diego 3francisco gJjose earthquak1;char08paA; ran07;a8h5ittsburgh 4ortland t3;imbe0rail blaze0;pirat1steele0;il3oenix su2;adelphia 3li1;eagl1philNunE;dr1;akland 3klahoma city thunder,rlando magic;athle0Mrai3;de0; 3castle01;england 7orleans 6york 3;city fc,g4je0FknXme0Fred bul0Yy3;anke1;ian0D;pelica2sain0C;patrio0Brevolut3;ion;anchester Be9i3ontreal impact;ami 7lwaukee b6nnesota 3;t4u0Fvi3;kings;imberwolv1wi2;rewe0uc0K;dolphi2heat,marli2;mphis grizz3ts;li1;cXu08;a4eicesterVos angeles 3;clippe0dodDla9; galaxy,ke0;ansas city 3nE;chiefs,roya0E; pace0polis colU;astr06dynamo,rockeTtexa2;olden state warrio0reen bay pac3;ke0;.c.Aallas 7e3i05od5;nver 5troit 3;lio2pisto2ti3;ge0;broncZnuggeM;cowbo4maver3;ic00;ys; uQ;arCelKh8incinnati 6leveland 5ol3;orado r3umbus crew sc;api5ocki1;brow2cavalie0india2;bengaWre3;ds;arlotte horAicago 3;b4cubs,fire,wh3;iteB;ea0ulR;diff3olina panthe0; c3;ity;altimore 9lackburn rove0oston 5rooklyn 3uffalo bilN;ne3;ts;cel4red3; sox;tics;rs;oriol1rave2;rizona Ast8tlanta 3;brav1falco2h4u3;nited;aw9;ns;es;on villa,r3;os;c5di3;amondbac3;ks;ardi3;na3;ls",
    "Uncountable": "true¦0:1F;a1Mb1Ec15d12e0Vf0Pg0Ih0Di09j08knowled1Ll03mVnews,oUpRrMsBt6vi5w1;a3ea06i2oo1;d,l;ldlife,ne;rmth,t0;neg12ol07tae;e4h3oothpaste,r1una;affQou1;ble,sers,t;ermod1Hund0;a,nnis;a9cene05eri0Sh8il7kittl0Snow,o6p4t2u1;g0Vnshi0L;ati1Ge1;am,el;ace19e1;ci0Ned;ap,cc0;k,v0;eep,ingl0K;d08fe13l1nd;m0Wt;a4e2ic1;e,ke0H;c1laxa0Dsearch;ogni0Crea0C;bi0Din;aKe2hys13last6o1ressZ;lit12rk,w0;a0YtrV;bstetr10il,xygen;a6e4ilk,o3u1;mps,s1;ic;nHo0E;a1chan0V;sl03t;chine1il,themat0T; learn09ry;aught0e3i2ogi0Qu1;ck,g0G;ce,ghtn06ngui0OteratL;a1isK;th0;ewel8usti0J;ce,mp1nformaStself;a1ortan0H;ti1;en0F;a4isto3o1;ck1mework,n1spitali09;ey;ry;ir,libut,ppiB;ene4o2r1um,ymna0B;aAound;l1ssip;d,f; 1t08;editOpo1;ol;i5lour,o2urnit1;ure;od,rgive1uri0wl;ne1;ss;c7sh;conomZduca6lectr5n3quip4thZvery1;body,o1thF;ne;joy1tertain1;ment;iciNonU;tiG;ar2iabet1raugh2;es;ts;a8elcius,h4ivPl3o1urrency;al,ld w1nfusiBttB;ar;assMoth3;aos,e1;e2w1;ing;se;r5sh;a5eef,i2lood,owls,read,utt0;er;lliar2s1;on;ds;g1ss;ga1;ge;c6dvi5ero3ir2mnes1rt,thlet8;ty;craft;b5d1naut5;ynam4;ce;id,ou1;st1;ics",
    "Infinitive": "true¦0:6K;1:6Y;2:57;3:6V;4:6W;5:5Z;6:67;7:6I;8:6Q;9:6U;A:6P;B:6S;C:6D;D:6Z;E:56;F:5P;a6Cb61c52d4Ae3Uf3Hg3Bh34i2Rj2Pk2Nl2Gm25n22o1Xp1Ir0Qs05tXuSvOwHyG;awn,ield;aJe1Yhist6iIoGre65;nd0rG;k,ry;pe,sh,th0;lk,nHrGsh,tCve;n,raD;d0t;aIiGo9;eGsA;!w;l6Cry;nHpGr3se;gra4Mli3Z;dGi9lo5Spub3O;erGo;mi58w1I;aMeLhKoJrHuGwi8;ne,rn;aGe0Mi5Nu8y;de,in,nsf0p,v5F;r2XuC;ank,reat2N;nd,st;lk,rg1Qs9;aZcWeVhTi4Akip,lSmRnee3Jo4YpQtJuGwitC;bmAck,ff0gge8ppHrGspe5;ge,pri1rou4Vvi4;ly,o34;aLeKoJrHuG;dy,mb6;aEeGi4;ngth2Dss,tC;p,re;m,p;in,ke,r0Qy;laFoil,rink6;e1Xi6o3H;am,ip;a2iv0oG;ck,ut;arCem,le5n1r4tt6;aHo2rG;atCew;le,re;il,ve;a05eIisk,oHuG;in,le,sh;am,ll;a01cZdu7fYgXje5lUmTnt,pQquPsKtJvGwa5O;eGiew,o34;al,l,rG;se,t;aEi2u40;eJi8oItG;!o2rG;i5uc1Y;l4rt;mb6nt,r4;e8i2;air,eHlGo3Zr0K;a7y;at;aEemb0i3Vo4;aHeGi4y;a1nt;te,x;a56r0J;act1Wer,le5u1;a11ei4k5IoGyc6;gni2Anci6rd;ch,li29s5G;i1nG;ge,k;aTerSiRlOoMrIuG;b1Zll,mp,rGsh;cha1s4J;ai1eIiDoG;cGdu7greBhibAmi1te8vi2T;eBlaim;di5pa2ss,veD;iDp,rtr3ZsGur;e,t;aHead,uG;g,n3;n,y;ck,le;fo30mAsi8;ck,iDrt4Fss,u1;bJccur,ff0pera9utweIverGwe;co40lap,ta20u1wG;helm;igh;ser4taE;eHotG;e,i7;ed,gle5;aMeLiIoHuG;ltip3Crd0;nit11ve;nHrr10sreprG;eseD;d,g6us;asu2lt,n0Mr3;intaEna3rHtG;ch,t0;ch,kGry;et;aKeJiIoGu1A;aGck,ok,ve;d,n;ft,ke,mAnk,st2Vve;a2Dc0Et;b0Nck,uG;gh,nC;iGno2Z;ck,ll,ss;am,oEuG;d3mp;gno2mQnGss3C;cOdica9flu0MhNsKtIvG;eGol4;nt,st;erGrodu7;a5fe2;i8tG;aGru5;ll;abAibA;lu1Er1C;agi22pG;lemeDo20ro4;aKeIi2oHuG;nt,rry;n02pe,st;aGlp;d,t;nd6ppGrm,te;en;aKloBove1MrIuG;arGeBi13;ant33d;aGip,umb6;b,sp;in,th0ze;aQeaPiNlLoIracHuncG;ti3D;tu2;cus,lHrG;ce,eca8m,s2V;d,l1Z;aFoG;at,od,w;gu2lGniFt,x;e,l;r,tu2;il,vG;or;a13cho,le5mSnPstNvalua9xG;a0AcLerKi8pGte17;a16eHi2laEoGreB;rt,se;ct,riG;en7;ci1t;el,han3;abGima9;liF;ab6couXdHfor7ga3han7j03riCsu2t0vG;isi2Qy;!u2;body,er3pG;hasiGow0;ze;a06eUiLoKrHuG;mp;aHeBiG;ft;g,in;d3ubt;ff0p,re5sHvG;iYor7;aKcHliGmiBpl16tinguiF;ke;oGuB;uGv0;ra3;gr1TppG;ear,ro4;cNem,fLliv0ma0Dny,pKsHterG;mi0E;cribe,er4iHtrG;oy;gn,re;a09e08i5osA;eGi09y;at,ct;iIlHrG;ea1;a2i05;de;ma3n7re,te;a0Ae09h06i9l04oJrG;aHeGoBuFy;a9dA;ck,ve;llZmSnHok,py,uGv0;gh,nt;cePdu5fMsKtIvG;eGin7;rt,y;aEin0SrG;a8ibu9ol;iGtitu9;d0st;iHoGroD;rm;gu2rm;rn;biLfoKmaJpG;a2laE;in;re;nd;rt;ne;ap1e5;aGip,o1;im,w;aHeG;at,ck,w;llen3n3r3se;a1nt0;ll,ncIrGt0u1;eGry;!en;el;aPeMloLoJruFuG;lGry;ly;sh;a8mb,o8rrGth0un7;ow;ck;ar,lHnefAtrG;ay;ie4ong;ng,se;band0Jc0Bd06ffo05gr04id,l01mu1nYppTrQsKttGvoid,waA;acIeHra5;ct;m0Fnd;h,k;k,sG;eIiHocia9uG;me;gn,st;mb6rt;le;chHgGri4;ue;!i4;eaJlIroG;aCve;ch;aud,y;l,r;noun7sw0tG;icipa9;ce;lHt0;er;e3ow;ee;rd;aRdIju8mAoR;it;st;!reB;ss;cJhie4knowled3tiva9;te;ge;ve;eIouDu1;se;nt;pt;on",
    "Unit": "true¦0:19;a14b12c0Od0Ne0Lf0Gg0Ch09in0Hjoule0k02l00mNnMoLpIqHsqCt7volts,w6y4z3°2µ1;g,s;c,f,n;b,e2;a0Nb,d0Dears old,o1;tt0H;att0b;able4b3d,e2on1sp;!ne0;a2r0D;!l,sp;spo04; ft,uare 1;c0Id0Hf3i0Fkilo0Jm1ya0E;e0Mil1;e0li0H;eet0o0D;t,uart0;ascals,e2i1ou0Pt;c0Mnt0;rcent,t02;hms,uYz;an0JewtT;/s,b,e9g,i3l,m2p1²,³;h,s;!²;!/h,cro5l1;e1li08;! pFs1²;! 1;anEpD;g06s0B;gQter1;! 2s1;! 1;per second;b,i00m,u1x;men0x0;b,elvin0g,ilo2m1nR;!/h,ph,²;byZgXmeter1;! p2s1;! p1;er1; hour;e1g,r0z;ct1rtz0;aXogQ;al2b,igAra1;in0m0;!l1;on0;a4emtPl2t1;²,³; oz,uid ou1;nce0;hrenheit0rad0;b,x1;abyH;eciCg,l,mA;arat0eAg,m9oulomb0u1;bic 1p0;c5d4fo3i2meAya1;rd0;nch0;ot0;eci2;enti1;me4;!²,³;lsius0nti1;g2li1me1;ter0;ram0;bl,y1;te0;c4tt1;os1;eco1;nd0;re0;!s",
    "Organization": "true¦0:46;a3Ab2Qc2Ad21e1Xf1Tg1Lh1Gi1Dj19k17l13m0Sn0Go0Dp07qu06rZsStFuBv8w3y1;amaha,m0Xou1w0X;gov,tu2S;a3e1orld trade organizati41;lls fargo,st1;fie22inghou16;l1rner br3D;-m11gree31l street journ25m11;an halNeriz3Wisa,o1;dafo2Gl1;kswagLvo;bs,kip,n2ps,s1;a tod2Rps;es35i1;lev2Xted natio2Uv; mobi2Kaco bePd bMeAgi frida9h3im horto2Tmz,o1witt2W;shiba,y1;ota,s r Y;e 1in lizzy;b3carpen33daily ma2Xguess w2holli0rolling st1Ms1w2;mashing pumpki2Ouprem0;ho;ea1lack eyed pe3Fyrds;ch bo1tl0;ys;l2s1;co,la m12;efoni07us;a6e4ieme2Gnp,o2pice gir5ta1ubaru;rbucks,to2N;ny,undgard1;en;a2Rx pisto1;ls;few25insbu26msu1X;.e.m.,adiohead,b6e3oyal 1yan2X;b1dutch she4;ank;/max,aders dige1Ed 1vl32;bu1c1Uhot chili peppe2Klobst28;ll;c,s;ant2Vizno2F;an5bs,e3fiz24hilip morrBi2r1;emier27octer & gamb1Rudenti14;nk floyd,zza hut;psi28tro1uge08;br2Qchina,n2Q; 2ason1Xda2G;ld navy,pec,range juli2xf1;am;us;a9b8e5fl,h4i3o1sa,wa;kia,tre dame,vart1;is;ke,ntendo,ss0K;l,s;c,st1Etflix,w1; 1sweek;kids on the block,york08;a,c;nd1Us2t1;ional aca2Fo,we0Q;a,cYd0O;aAcdonald9e5i3lb,o1tv,yspace;b1Nnsanto,ody blu0t1;ley crue,or0O;crosoft,t1;as,subisO;dica3rcedes2talli1;ca;!-benz;id,re;'s,s;c's milk,tt13z1Y;'ore09a3e1g,ittle caesa1Ktd;novo,x1;is,mark; pres5-z-boy,bour party;atv,fc,kk,m1od1K;art;iffy lu0Lo3pmorgan1sa;! cha1;se;hnson & johns1Sy d1R;bm,hop,n1tv;c,g,te1;l,rpol; & m,asbro,ewlett-packaTi3o1sbc,yundai;me dep1n1J;ot;tac1zbollah;hi;eneral 6hq,l5mb,o2reen d0Iu1;cci,ns n ros0;ldman sachs,o1;dye1g0B;ar;axo smith kliZencore;electr0Im1;oto0V;a3bi,da,edex,i1leetwood mac,oGrito-l0A;at,nancial1restoV; tim0;cebook,nnie mae;b06sa,u3xxon1; m1m1;ob0H;!rosceptics;aiml0Ae5isney,o3u1;nkin donuts,po0Wran dur1;an;j,w j1;on0;a,f leppa3ll,p2r spiegZstiny's chi1;ld;eche mode,t;rd;aEbc,hBi9nn,o3r1;aigsli5eedence clearwater reviv1ossra05;al;!ca c5l4m1o0Ast05;ca2p1;aq;st;dplMgate;ola;a,sco1tigroup;! systems;ev2i1;ck fil-a,na daily;r0Hy;dbury,pital o1rl's jr;ne;aGbc,eCfAl6mw,ni,o2p,r1;exiteeWos;ei3mbardiJston 1;glo1pizza;be;ng;ack & deckFo2ue c1;roX;ckbuster video,omingda1;le; g1g1;oodriN;cht3e ge0n & jer2rkshire hathaw1;ay;ryH;el;nana republ3s1xt5y5;f,kin robbi1;ns;ic;bXcSdidRerosmith,ig,lLmFnheuser-busEol,ppleAr7s3t&t,v2y1;er;is,on;hland2s1;n,ociated F; o1;il;by4g2m1;co;os; compu2bee1;'s;te1;rs;ch;c,d,erican3t1;!r1;ak; ex1;pre1;ss; 4catel2t1;air;!-luce1;nt;jazeera,qae1;da;as;/dc,a3er,t1;ivisi1;on;demy of scienc0;es;ba,c",
    "Demonym": "true¦0:16;1:13;a0Wb0Nc0Cd0Ae09f07g04h02iYjVkTlPmLnIomHpDqatari,rBs7t5u4v3wel0Rz2;am0Fimbabwe0;enezuel0ietnam0H;g9krai1;aiwThai,rinida0Iu2;ni0Qrkmen;a4cot0Ke3ingapoOlovak,oma0Tpa05udRw2y0X;edi0Kiss;negal0Br08;mo0uU;o6us0Lw2;and0;a3eru0Hhilipp0Po2;li0Ertugu06;kist3lesti1na2raguay0;ma1;ani;amiZi2orweP;caragu0geri2;an,en;a3ex0Mo2;ngo0Erocc0;cedo1la2;gasy,y08;a4eb9i2;b2thua1;e0Dy0;o,t02;azakh,eny0o2uwaiti;re0;a2orda1;ma0Bp2;anN;celandic,nd4r2sraeli,ta02vo06;a2iT;ni0qi;i0oneV;aiDin2ondur0unN;di;amDe2hanai0reek,uatemal0;or2rm0;gi0;i2ren7;lipino,n4;cuadoVgyp6ngliJsto1thiopi0urope0;a2ominXut4;niH;a9h6o4roa3ub0ze2;ch;ti0;lom2ngol5;bi0;a6i2;le0n2;ese;lifor1m2na3;bo2eroo1;di0;angladeshi,el8o6r3ul2;gaG;aziBi2;ti2;sh;li2s1;vi0;aru2gi0;si0;fAl7merBngol0r5si0us2;sie,tr2;a2i0;li0;gent2me1;ine;ba1ge2;ri0;ni0;gh0r2;ic0;an",
    "Possessive": "true¦anyAh5its,m3noCo1sometBthe0yo1;ir1mselves;ur0;!s;i8y0;!se4;er1i0;mse2s;!s0;!e0;lf;o1t0;hing;ne",
    "Currency": "true¦$,aud,bScQdLeurKfJgbp,hkd,iIjpy,kGlEp8r7s3usd,x2y1z0¢,£,¥,ден,лв,руб,฿,₡,₨,€,₭,﷼;lotySł;en,uanR;af,of;h0t5;e0il5;k0q0;elM;iel,oubleLp,upeeL;e2ound st0;er0;lingI;n0soH;ceGn0;ies,y;e0i8;i,mpi7;n,r0wanzaCyatC;!onaBw;ls,nr;ori7ranc9;!o8;en3i2kk,o0;b0ll2;ra5;me4n0rham4;ar3;ad,e0ny;nt1;aht,itcoin0;!s",
    "City": "true¦a2Wb26c1Wd1Re1Qf1Og1Ih1Ai18jakar2Hk0Zl0Tm0Gn0Co0ApZquiYrVsLtCuBv8w3y1z0;agreb,uri1Z;ang1Te0okohama;katerin1Hrev34;ars3e2i0rocl3;ckl0Vn0;nipeg,terth0W;llingt1Oxford;aw;a1ern1Mi0;en2Hlni2Z;lenc2Uncouv0Gr2Gughn;lan bat0Dtrecht;a6bilisi,e5he4i3o2rondheim,u0;nVr0;in,ku;kyo,ronIulouC;anj23l13miso2Jra2A; haJssaloni0X;gucigalpa,hr2Ol av0L;i0llinn,mpe2Bngi07rtu;chu22n2MpT;a3e2h1kopje,t0ydney;ockholm,uttga12;angh1Fenzh1X;o0KvZ;int peters0Ul3n0ppo1F; 0ti1B;jo0salv2;se;v0z0Q;adU;eykjavik,i1o0;me,sario,t25;ga,o de janei17;to;a8e6h5i4o2r0ueb1Qyongya1N;a0etor24;gue;rt0zn24; elizabe3o;ls1Grae24;iladelph1Znom pe07oenix;r0tah tik19;th;lerJr0tr10;is;dessa,s0ttawa;a1Hlo;a2ew 0is;delTtaip0york;ei;goya,nt0Upl0Uv1R;a5e4i3o1u0;mb0Lni0I;nt0scH;evideo,real;l1Mn01skolc;dellín,lbour0S;drid,l5n3r0;ib1se0;ille;or;chest0dalWi0Z;er;mo;a4i1o0vAy01;nd00s angel0F;ege,ma0nz,sbZverpo1;!ss0;ol; pla0Iusan0F;a5hark4i3laipeda,o1rak0uala lump2;ow;be,pavog0sice;ur;ev,ng8;iv;b3mpa0Kndy,ohsiu0Hra0un03;c0j;hi;ncheMstanb0̇zmir;ul;a5e3o0; chi mi1ms,u0;stI;nh;lsin0rakliG;ki;ifa,m0noi,va0A;bu0SiltD;alw4dan3en2hent,iza,othen1raz,ua0;dalaj0Gngzhou;bu0P;eUoa;sk;ay;es,rankfu0;rt;dmont4indhovU;a1ha01oha,u0;blRrb0Eshanbe;e0kar,masc0FugavpiJ;gu,je0;on;a7ebu,h2o0raioJuriti01;lo0nstanJpenhagNrk;gFmbo;enn3i1ristchur0;ch;ang m1c0ttagoL;ago;ai;i0lgary,pe town,rac4;ro;aHeBirminghWogoAr5u0;char3dap3enos air2r0sZ;g0sa;as;es;est;a2isba1usse0;ls;ne;silPtisla0;va;ta;i3lgrade,r0;g1l0n;in;en;ji0rut;ng;ku,n3r0sel;celo1ranquil0;la;na;g1ja lu0;ka;alo0kok;re;aBb9hmedabad,l7m4n2qa1sh0thens,uckland;dod,gabat;ba;k0twerp;ara;m5s0;terd0;am;exandr0maty;ia;idj0u dhabi;an;lbo1rh0;us;rg",
    "Country": "true¦0:38;1:2L;a2Wb2Dc21d1Xe1Rf1Lg1Bh19i13j11k0Zl0Um0Gn05om3CpZqat1JrXsKtCu6v4wal3yemTz2;a24imbabwe;es,lis and futu2X;a2enezue31ietnam;nuatu,tican city;.5gTkraiZnited 3ruXs2zbeE;a,sr;arab emirat0Kkingdom,states2;! of am2X;k.,s.2; 27a.;a7haBimor-les0Bo6rinidad4u2;nis0rk2valu;ey,me2Xs and caic1T; and 2-2;toba1J;go,kel0Ynga;iw2Vji2nz2R;ki2T;aCcotl1eBi8lov7o5pa2Bri lanka,u4w2yr0;az2ed9itzerl1;il1;d2Qriname;lomon1Vmal0uth 2;afr2IkLsud2O;ak0en0;erra leoEn2;gapo1Wt maart2;en;negKrb0ychellY;int 2moa,n marino,udi arab0;hele24luc0mart1Z;epublic of ir0Com2Cuss0w2;an25;a3eHhilippinTitcairn1Ko2uerto riM;l1rtugE;ki2Bl3nama,pua new0Tra2;gu6;au,esti2;ne;aAe8i6or2;folk1Gth3w2;ay; k2ern mariana1B;or0M;caragua,ger2ue;!ia;p2ther18w zeal1;al;mib0u2;ru;a6exi5icro09o2yanm04;ldova,n2roc4zamb9;a3gol0t2;enegro,serrat;co;c9dagascZl6r4urit3yot2;te;an0i14;shall0Vtin2;ique;a3div2i,ta;es;wi,ys0;ao,ed00;a5e4i2uxembourg;b2echtenste10thu1E;er0ya;ban0Gsotho;os,tv0;azakh1De2iriba02osovo,uwait,yrgyz1D;eling0Jnya;a2erF;ma15p1B;c6nd5r3s2taly,vory coast;le of m19rael;a2el1;n,q;ia,oI;el1;aiSon2ungary;dur0Mg kong;aAermany,ha0Pibralt9re7u2;a5ern4inea2ya0O;!-biss2;au;sey;deloupe,m,tema0P;e2na0M;ce,nl1;ar;bTmb0;a6i5r2;ance,ench 2;guia0Dpoly2;nes0;ji,nl1;lklandTroeT;ast tim6cu5gypt,l salv5ngl1quatorial3ritr4st2thiop0;on0; guin2;ea;ad2;or;enmark,jibou4ominica3r con2;go;!n B;ti;aAentral african 9h7o4roat0u3yprQzech2; 8ia;ba,racao;c3lo2morPngo-brazzaville,okFsta r03te d'ivoiK;mb0;osD;i2ristmasF;le,na;republic;m2naTpe verde,yman9;bod0ero2;on;aFeChut00o8r4u2;lgar0r2;kina faso,ma,undi;azil,itish 2unei;virgin2; is2;lands;liv0nai4snia and herzegoviGtswaGuvet2; isl1;and;re;l2n7rmuF;ar2gium,ize;us;h3ngladesh,rbad2;os;am3ra2;in;as;fghaFlCmAn5r3ustr2zerbaijH;al0ia;genti2men0uba;na;dorra,g4t2;arct6igua and barbu2;da;o2uil2;la;er2;ica;b2ger0;an0;ia;ni2;st2;an",
    "Region": "true¦0:1U;a20b1Sc1Id1Des1Cf19g13h10i0Xj0Vk0Tl0Qm0FnZoXpSqPrMsDtAut9v6w3y1zacatec22;o05u1;cat18kZ;a1est vi4isconsin,yomi14;rwick0shington1;! dc;er2i1;rgin1S;acruz,mont;ah,tar pradesh;a2e1laxca1DuscaA;nnessee,x1R;bas0Kmaulip1QsmJ;a6i4o2taf0Ou1ylh13;ffVrr00s0Y;me10no1Auth 1;cSdR;ber1Ic1naloa;hu0Sily;n2skatchew0Rxo1;ny; luis potosi,ta catari1I;a1hode7;j1ngp02;asth0Mshahi;inghai,u1;e1intana roo;bec,ensWreta0E;ara4e2rince edward1; isU;i,nnsylv1rnambu02;an14;!na;axa0Ndisha,h1klaho1Bntar1reg4x04;io;ayarit,eBo3u1;evo le1nav0L;on;r1tt0Rva scot0X;f6mandy,th1; 1ampton0;c3d2yo1;rk0;ako0Y;aroli0V;olk;bras0Xva01w1; 2foundland1;! and labrador;brunswick,hamp0jers1mexiJyork state;ey;a6i2o1;nta0Nrelos;ch3dlanBn2ss1;issippi,ouri;as geraGneso0M;igQoacQ;dhya,harasht04ine,ni3r1ssachusetts;anhao,y1;land;p1toba;ur;anca0e1incoln0ouis8;e1iH;ds;a1entucky,hul0A;ns08rnata0Dshmir;alis1iangxi;co;daho,llino2nd1owa;ia05;is;a2ert1idalEunA;ford0;mp0waii;ansu,eorgWlou5u1;an2erre1izhou,jarat;ro;ajuato,gdo1;ng;cester0;lori2uji1;an;da;sex;e4o2uran1;go;rs1;et;lawaErby0;a8ea7hi6o1umbrH;ahui4l3nnectic2rsi1ventry;ca;ut;iMorado;la;apEhuahua;ra;l8m1;bridge0peche;a5r4uck1;ingham0;shi1;re;emen,itish columb3;h2ja cal1sque,var2;iforn1;ia;guascalientes,l4r1;izo2kans1;as;na;a2ber1;ta;ba2s1;ka;ma",
    "FemaleName": "true¦0:FX;1:G1;2:FQ;3:FC;4:FB;5:EO;6:EQ;7:FR;8:GE;9:EY;A:GA;B:E4;C:FN;D:FK;E:G7;F:EF;aE1bD3cB7dAHe9Ff90g8Gh82i7Rj6Tk5Zl4Om38n2To2Qp2Fqu2Er1Os0Qt04ursu6vUwOyLzG;aJeHoG;e,la,ra;lGna;da,ma;da,ra;as7DeHol1TvG;et5onB8;le0sen3;an9endBMhiB3iG;lInG;if3AniGo0;e,f39;a,helmi0lGma;a,ow;aMeJiG;cHviG;an9WenG0;kCYtor3;da,l8Unus,rG;a,nGoniD1;a,iDB;leGnesEB;nDKrG;i1y;aSePhNiMoJrGu6y4;acG2iGu0E;c3na,sG;h9Lta;nHrG;a,i;i9Iya;a5HffaCFna,s7;al3eGomasi0;a,l8Fo6Wres1;g7To6VrHssG;!a,ie;eFi,ri8;bNliMmKnIrHs7tGwa0;ia0um;a,yn;iGya;a,ka,s7;a4e4iGmC9ra;!ka;a,t7;at7it7;a05carlet2Ye04hUiSkye,oQtMuHyG;bFIlvi1;e,sHzG;an2Tet5ie,y;anGi8;!a,e,nG;aDe;aIeG;fGl3DphG;an2;cF7r6;f3nGphi1;d4ia,ja,ya;er4lv3mon1nGobh74;dy;aKeGirlBKo0y6;ba,e0i6lIrG;iGrBOyl;!d6Z;ia,lBU;ki4nIrHu0w0yG;la,na;i,leAon,ron;a,da,ia,nGon;a,on;l5Xre0;bMdLi9lKmIndHrGs7vannaD;aDi0;ra,y;aGi4;nt7ra;lBMome;e,ie;in1ri0;a02eXhViToHuG;by,thBJ;bQcPlOnNsHwe0xG;an93ie,y;aHeGie,lE;ann8ll1marBEtB;!lGnn1;iGyn;e,nG;a,d7V;da,i,na;an9;hel52io;bin,erByn;a,cGkki,na,ta;helBYki;ea,iannDWoG;da,n12;an0bIgi0i0nGta,y0;aGee;!e,ta;a,eG;cAQkaD;chGe,i0mo0n5DquCCvCy0;aCBelGi9;!e,le;een2ia0;aMeLhJoIrG;iGudenAV;scil1Uyamva9;lly,rt3;ilome0oebe,ylG;is,lis;arl,ggy,nelope,r6t4;ige,m0Fn4No6rvaBAtHulG;a,et5in1;ricGsy,tA7;a,e,ia;ctav3deHfAVlGphAV;a,ga,iv3;l3t5;aQePiJoGy6;eHrG;aDeCma;ll1mi;aKcIkGla,na,s7ta;iGki;!ta;hoB1k8AolG;a,eBG;!mh;l7Sna,risF;dIi5OnHo22taG;li1s7;cy,et5;eAiCN;a01ckenz2eViLoIrignayani,uriBFyG;a,rG;a,na,tAR;i4ll9WnG;a,iG;ca,ka,qB3;a,chOkaNlJmi,nIrGtzi;aGiam;!n9;a,dy,erva,h,n2;a,dIi9IlG;iGy;cent,e;red;!e6;ae6el3F;ag4JgKi,lHrG;edi60isFyl;an2iGliF;nGsAL;a,da;!an,han;b08c9Dd06e,g04i03l01nZrKtJuHv6Rx86yGz2;a,bell,ra;de,rG;a,eC;h74il9t2;a,cSgOiJjor2l6Hn2s7tIyG;!aGbe5PjaAlou;m,n9R;a,ha,i0;!aIbAKeHja,lEna,sGt52;!a,ol,sa;!l06;!h,m,nG;!a,e,n1;arIeHie,oGr3Jueri5;!t;!ry;et3HiB;elGi60y;a,l1;dGon,ue6;akranBy;iGlo35;a,ka,n9;a,re,s2;daGg2;!l2V;alEd2elGge,isBFon0;eiAin1yn;el,le;a0He07iWoQuKyG;d3la,nG;!a,dHe9RnGsAP;!a,e9Q;a,sAN;aB0cJelIiFlHna,pGz;e,iB;a,u;a,la;iGy;a29e,l24n9;is,l1FrHtt2uG;el6is1;aIeHi8na,rG;a6Yi8;lei,n1tB;!in1;aPbb82d3lLnIsHv3zG;!a,be4Jet5z2;a,et5;a,dG;a,sGy;ay,ey,i,y;a,iaIlG;iGy;a8Fe;!n4E;!n5R;aNda,e0iLla,nKoIslARtGx2;iGt2;c3t3;la,nGra;a,ie,o4;a,or1;a,gh,laG;!ni;!h,nG;a,d4e,n4N;cNdon7Si6kes7na,rMtKurIvHxGy6;mi;ern1in3;a,eGie,yn;l,n;as7is7oG;nya,ya;a,isF;ey,ie,y;aZeUhadija,iMoLrIyG;lGra;a,ee,ie;istGy5B;a,en,iGy;!e,n48;ri,urtn9A;aMerLl99mIrGzzy;a,stG;en,in;!berlG;eGi,y;e,y;a,stC;!na,ra;el6PiJlInHrG;a,i,ri;d4na;ey,i,l9Qs2y;ra,s7;c8Wi5XlOma6nyakumari,rMss5LtJviByG;!e,lG;a,eG;e,i78;a5EeHhGi3PlEri0y;ar5Cer5Cie,leCr9Fy;!lyn73;a,en,iGl4Uyn;!ma,n31sF;ei72i,l2;a04eVilToMuG;anKdJliGst56;aHeGsF;!nAt0W;!n8X;i2Ry;a,iB;!anLcelEd5Vel71han6IlJni,sHva0yG;a,ce;eGie;fi0lEph4X;eGie;en,n1;!a,e,n36;!i10lG;!i0Z;anLle0nIrHsG;i5Qsi5Q;i,ri;!a,el6Pif1RnG;a,et5iGy;!e,f1P;a,e72iHnG;a,e71iG;e,n1;cLd1mi,nHqueliAsmin2Uvie4yAzG;min8;a8eHiG;ce,e,n1s;!lGsFt06;e,le;inHk2lEquelG;in1yn;da,ta;lPmNnMo0rLsHvaG;!na;aHiGob6U;do4;!belGdo4;!a,e,l2G;en1i0ma;a,di4es,gr5R;el9ogG;en1;a,eAia0o0se;aNeKilHoGyacin1N;ll2rten1H;aHdGlaH;a,egard;ry;ath0WiHlGnrietBrmiAst0W;en24ga;di;il75lKnJrGtt2yl75z6D;iGmo4Fri4G;etG;!te;aDnaD;ey,l2;aYeTiOlMold12rIwG;enGyne18;!dolE;acHetGisel9;a,chC;e,ieG;!la;adys,enGor3yn1Y;a,da,na;aJgi,lHna,ov71selG;a,e,le;da,liG;an;!n0;mYnIorgHrG;ald35i,m2Stru73;et5i5T;a,eGna;s1Nvieve;briel3Fil,le,rnet,yle;aReOio0loMrG;anHe9iG;da,e9;!cG;esHiGoi0G;n1s3V;!ca;!rG;a,en43;lHrnG;!an9;ec3ic3;rHtiGy8;ma;ah,rah;d0FileCkBl00mUn4ArRsMtLuKvG;aIelHiG;e,ta;in0Ayn;!ngel2H;geni1la,ni3R;h52ta;meral9peranJtG;eHhGrel6;er;l2Pr;za;iGma,nest29yn;cGka,n;a,ka;eJilImG;aGie,y;!liA;ee,i1y;lGrald;da,y;aTeRiMlLma,no4oJsIvG;a,iG;na,ra;a,ie;iGuiG;se;a,en,ie,y;a0c3da,nJsGzaH;aGe;!beG;th;!a,or;anor,nG;!a;in1na;en,iGna,wi0;e,th;aWeKiJoGul2U;lor51miniq3Yn30rGtt2;a,eCis,la,othGthy;ea,y;an09naDonAx2;anPbOde,eNiLja,lImetr3nGsir4U;a,iG;ce,se;a,iHla,orGphiA;es,is;a,l5J;dGrdG;re;!d4Mna;!b2CoraDra;a,d4nG;!a,e;hl3i0mMnKphn1rHvi1WyG;le,na;a,by,cHia,lG;a,en1;ey,ie;a,et5iG;!ca,el1Aka;arGia;is;a0Qe0Mh04i02lUoJrHynG;di,th3;istGy04;al,i0;lOnLrHurG;tn1D;aId28iGn28riA;!nG;a,e,n1;!l1S;n2sG;tanGuelo;ce,za;eGleC;en,t5;aIeoHotG;il4B;!pat4;ir8rIudG;et5iG;a,ne;a,e,iG;ce,sX;a4er4ndG;i,y;aPeMloe,rG;isHyG;stal;sy,tG;aHen,iGy;!an1e,n1;!l;lseHrG;!i8yl;a,y;nLrG;isJlHmG;aiA;a,eGot5;n1t5;!sa;d4el1PtG;al,el1O;cHlG;es5i3F;el3ilG;e,ia,y;iYlXmilWndVrNsLtGy6;aJeIhGri0;erGleCrEy;in1;ri0;li0ri0;a2GsG;a2Fie;a,iMlKmeIolHrG;ie,ol;!e,in1yn;lGn;!a,la;a,eGie,y;ne,y;na,sF;a0Di0D;a,e,l1;isBl2;tlG;in,yn;arb0CeYianXlVoTrG;andRePiIoHyG;an0nn;nwEok8;an2NdgKg0ItG;n27tG;!aHnG;ey,i,y;ny;etG;!t8;an0e,nG;da,na;i8y;bbi8nG;iBn2;ancGossom,ythe;a,he;ca;aRcky,lin9niBrNssMtIulaDvG;!erlG;ey,y;hHsy,tG;e,i0Zy8;!anG;ie,y;!ie;nGt7yl;adHiG;ce;et5iA;!triG;ce,z;a4ie,ra;aliy29b24d1Lg1Hi19l0Sm0Nn01rWsNthe0uJvIyG;anGes7;a,na;a,r25;drIgusHrG;el3;ti0;a,ey,i,y;hHtrG;id;aKlGt1P;eHi8yG;!n;e,iGy;gh;!nG;ti;iIleHpiB;ta;en,n1t5;an19elG;le;aYdWeUgQiOja,nHtoGya;inet5n3;!aJeHiGmI;e,ka;!mGt5;ar2;!belHliFmT;sa;!le;ka,sGta;a,sa;elGie;a,iG;a,ca,n1qG;ue;!t5;te;je6rea;la;!bHmGstas3;ar3;el;aIberHel3iGy;e,na;!ly;l3n9;da;aTba,eNiKlIma,yG;a,c3sG;a,on,sa;iGys0J;e,s0I;a,cHna,sGza;a,ha,on,sa;e,ia;c3is7jaIna,ssaIxG;aGia;!nd4;nd4;ra;ia;i0nHyG;ah,na;a,is,naD;c7da,leCmLnslKsG;haDlG;inGyW;g,n;!h;ey;ee;en;at7g2nG;es;ie;ha;aVdiSelLrG;eIiG;anLenG;a,e,ne;an0;na;aKeJiHyG;nn;a,n1;a,e;!ne;!iG;de;e,lEsG;on;yn;!lG;iAyn;ne;agaJbHiG;!gaI;ey,i8y;!e;il;ah",
    "Place": "true¦a07b05cZdYeXfVgRhQiOjfk,kMlKmHneEoDp9que,rd,s8t5u4v3w0yyz;is1y0;!o;!c;a,t;pYsafa,t;e1he 0;bronx,hamptons;nn,x;ask,fo,oho,t,under6yd;a2e1h0;l,x;k,nnK;!cifX;kla,nt,rd;b1w eng0;land;!r;a1co,i0t,uc;dKnn;libu,nhattS;a0gw,hr;s,x;an0ul;!s;a0cn,da,ndianMst;!x;arlem,kg,nd,wy;a2re0;at 0enwich;britain,lak6;!y village;co,l0ra;!a;urope,verglad2;ak,en,fw,ist,own4xb;al4dg,gk,hina3l2o1r0;es;lo,nn;!t;town;!if;cn,e0kk,lvd,rooklyn;l air,verly hills;frica,lta,m5ntarct2r1sia,tl0ve;!ant1;ct0iz;ic0; oce0;an;ericas,s",
    "WeekDay": "true¦fri2mon2s1t0wednesd3;hurs1ues1;aturd1und1;!d0;ay0;!s",
    "Month": "true¦aBdec9feb7j2mar,nov9oct1sep0;!t8;!o8;an3u0;l1n0;!e;!y;!u1;!ru0;ary;!em0;ber;pr1ug0;!ust;!il",
    "Date": "true¦ago,t0weekend,yesterd2;mr2o0;d0morrow;ay;!w",
    "FirstName": "true¦aEblair,cCdevBj8k6lashawn,m3nelly,quinn,re2sh0;ay,e0iloh;a,lby;g1ne;ar1el,org0;an;ion,lo;as8e0r9;ls7nyatta,rry;am0ess1ude;ie,m0;ie;an,on;as0heyenne;ey,sidy;lex1ndra,ubr0;ey;is",
    "LastName": "true¦0:35;1:3A;2:3C;3:2Z;4:2F;5:31;a3Cb32c2Pd2Fe2Cf26g1Zh1Pi1Kj1Ek17l0Zm0Nn0Jo0Gp05rYsMtHvFwCxBy8zh6;a6ou,u;ng,o;a6eun2Voshi1Kun;ma6ng;da,guc20mo28sh22zaR;iao,u;a7eb0il6o3right,u;li3Cs1;gn0lk0ng,tanabe;a6ivaldi;ssilj38zqu2;a9h8i2Ho7r6sui,urn0;an,ynisJ;lst0Prr1Vth;at1Vomps1;kah0Vnaka,ylor;aEchDeChimizu,iBmiAo9t7u6zabo;ar2lliv2BzuE;a6ein0;l24rm0;sa,u3;rn4th;lva,mmo25ngh;mjon4rrano;midt,neid0ulz;ito,n7sa6to;ki;ch2dLtos,z;amBeag20i9o7u6;bio,iz,sD;b6dri1NgIj0Tme25osevelt,ssi,ux,w17;erts,ins1;c6ve0F;ci,hards1;ir2os;aEeAh8ic6ow21ut1O;as6hl0;so;a6illips;m,n1U;ders5et8r7t6;e0Nr4;ez,ry;ers;h22rk0t6vl4;el,te0J;baBg0Blivei01r6;t6w1P;ega,iz;a6eils1guy5ix1owak,ym1F;gy,ka6var1L;ji6muW;ma;aEeCiBo8u6;ll0n6rr0Bssolini,ñ6;oz;lina,oKr6zart;al0Ne6r0V;au,no;hhail4ll0;rci0ssi6y0;!er;eWmmad4r6tsu07;in6tin2;!o;aCe8i6op2uo;!n6u;coln,dholm;fe7n0Rr6w0K;oy;bv6v6;re;mmy,rs5u;aBennedy,imuAle0Mo8u7wo6;k,n;mar,znets4;bay6vacs;asZ;ra;hn,rl9to,ur,zl4;aAen9ha3imen2o6u3;h6nZu3;an6ns1;ss1;ki0Fs5;cks1nsse0E;glesi9ke8noue,shik7to,vano6;u,v;awa;da;as;aBe8itchcock,o7u6;!a3b0ghOynh;a3ffmann,rvat;mingw7nde6rO;rs1;ay;ns5rrRs7y6;asEes;an4hi6;moK;aAil,o9r7u6;o,tierr2;ay6ub0;li3;m2nzal2;nd6o,rcia;hi;erAis9lor8o7uj6;ita;st0urni0;es;ch0;nand2;d7insteHsposi6vaL;to;is1wards;aCeBi9omin8u6;bo6rand;is;gu2;az,mitr4;ov;lgado,vi;nkula,rw7vi6;es,s;in;aFhBlarkAo6;h5l6op0rbyn,x;em7li6;ns;an;!e;an8e7iu,o6ristens5u3we;i,ng,u3w,y;!n,on6u3;!g;mpb7rt0st6;ro;ell;aBe8ha3lanco,oyko,r6yrne;ooks,yant;ng;ck7ethov5nnett;en;er,ham;ch,h8iley,rn6;es,i0;er;k,ng;dDl9nd6;ers6rA;en,on,s1;on;eks7iy8var2;ez;ej6;ev;ams",
    "MaleName": "true¦0:CE;1:BL;2:C2;3:BT;4:B5;5:9V;6:BZ;7:AT;8:BD;9:AX;A:AO;aB4bA8c97d87e7Gf6Yg6Gh5Wi5Ij4Lk4Bl3Rm2Pn2Eo28p22qu20r1As0Qt06u05v00wNxavi3yGzB;aBor0;cBh8Ine;hCkB;!aB1;ar51eB0;ass2i,oCuB;sDu25;nEsDusB;oBsC;uf;ef;at0g;aJeHiCoByaAP;lfgang,odrow;lBn1O;bDey,frBJlB;aA5iB;am,e,s;e89ur;i,nde5sB;!l7t1;de,lCrr6yB;l1ne;lBt3;a93y;aEiBladimir;cCha0kt5CnceBrg9Bva0;!nt;ente,t5A;lentin49n8Y;lyss4Msm0;aTeOhKiIoErCyB;!l3ro8s1;av9QeBist0oy,um0;nt9Iv54y;bDd7XmBny;!as,mBoharu;aAYie,y;i83y;mBt9;!my,othy;adDeoCia7DomB;!as;!do7M;!de9;dErB;en8HrB;an8GeBy;ll,n8F;!dy;dgh,ic9Tnn3req,ts45;aRcotPeNhJiHoFpenc3tBur1Oylve8Hzym1;anDeBua7B;f0phAFvBwa7A;e57ie;!islaw,l7;lom1nA3uB;leyma8ta;dBl7Jm1;!n7;aDeB;lBrm0;d1t1;h6Sne,qu0Uun,wn,y8;aBbasti0k1Xl41rg40th,ymo9I;m9n;!tB;!ie,y;lCmBnti21q4Iul;!mAu4;ik,vato6V;aWeShe92iOoFuCyB;an,ou;b6LdCf9pe6QssB;!elAI;ol2Uy;an,bIcHdGel,geFh0landA9mEnDry,sCyB;!ce;coe,s;!a95nA;an,eo;l3Jr;e4Qg3n7olfo,ri68;co,ky;bAe9U;cBl7;ar5Oc5NhCkBo;!ey,ie,y;a85ie;gCid,ub6x,yBza;ansh,nS;g8WiB;na8Ss;ch5Yfa4lDmCndBpha4sh6Uul,ymo70;al9Yol2By;i9Ion;f,ph;ent2inB;cy,t1;aFeDhilCier62ol,reB;st1;!ip,lip;d9Brcy,tB;ar,e2V;b3Sdra6Ft44ul;ctav2Vliv3m96rFsCtBum8Uw6;is,to;aCc8SvB;al52;ma;i,l49vJ;athJeHiDoB;aBel,l0ma0r2X;h,m;cCg4i3IkB;h6Uola;hol5XkBol5X;!ol5W;al,d,il,ls1vB;il50;anBy;!a4i4;aWeTiKoFuCyB;l21r1;hamCr5ZstaB;fa,p4G;ed,mF;dibo,e,hamDis1XntCsBussa;es,he;e,y;ad,ed,mB;ad,ed;cGgu4kElDnCtchB;!e5;a78ik;house,o03t1;e,olB;aj;ah,hBk7;a4eB;al,l;hClv2rB;le,ri5v2;di,met;ck,hNlLmOnu4rHs1tDuricCxB;!imilian8Cwe5;e,io;eo,hCi52tB;!eo,hew,ia;eBis;us,w;cDio,k86lCqu6Gsha5tBv2;i2Hy;in,on;!el,oKus;achBcolm,ik;ai,y;amBdi,moud;adB;ou;aReNiMlo2RoIuCyB;le,nd1;cEiDkBth3;aBe;!s;gi,s;as,iaB;no;g0nn6RrenDuBwe5;!iB;e,s;!zo;am,on4;a7Bevi,la4SnDoBst3vi;!nB;!a60el;!ny;mCnBr67ur4Twr4T;ce,d1;ar,o4N;aIeDhaled,iBrist4Vu48y3B;er0p,rB;by,k,ollos;en0iEnBrmit,v2;!dCnBt5C;e0Yy;a5ri4N;r,th;na68rBthem;im,l;aYeQiOoDuB;an,liBst2;an,o,us;aqu2eJhnInGrEsB;eChBi7Bue;!ua;!ph;dBge;an,i,on;!aBny;h,s,th4X;!ath4Wie,nA;!l,sBy;ph;an,e,mB;!mA;d,ffGrDsB;sBus;!e;a5JemCmai8oBry;me,ni0O;i6Uy;!e58rB;ey,y;cHd6kGmFrDsCvi3yB;!d6s1;on,p3;ed,od,rBv4M;e4Zod;al,es,is1;e,ob,ub;k,ob,quB;es;aNbrahMchika,gKkeJlija,nuIrGsDtBv0;ai,sB;uki;aBha0i6Fma4sac;ac,iaB;h,s;a,vinBw2;!g;k,nngu52;!r;nacBor;io;im;in,n;aJeFina4VoDuByd56;be25gBmber4CsD;h,o;m3ra33sBwa3X;se2;aDctCitCn4ErB;be20m0;or;th;bKlJmza,nIo,rDsCyB;a43d6;an,s0;lEo4FrDuBv7;hi40ki,tB;a,o;is1y;an,ey;k,s;!im;ib;aQeMiLlenKoIrEuB;illerCsB;!tavo;mo;aDegBov3;!g,orB;io,y;dy,h57nt;nzaBrd1;lo;!n;lbe4Qno,ovan4R;ne,oDrB;aBry;ld,rd4U;ffr7rge;bri4l6rBv2;la1Zr3Eth,y;aReNiLlJorr0IrB;anDedBitz;!dAeBri24;ri23;cDkB;!ie,lB;in,yn;esJisB;!co,zek;etch3oB;yd;d4lBonn;ip;deriDliCng,rnB;an01;pe,x;co;bi0di;arZdUfrTit0lNmGnFo2rCsteb0th0uge8vBym6zra;an,ere2V;gi,iCnBrol,v2w2;est45ie;c07k;och,rique,zo;aGerFiCmB;aFe2P;lCrB;!h0;!io;s1y;nu4;be09d1iEliDmCt1viBwood;n,s;er,o;ot1Ts;!as,j43sB;ha;a2en;!dAg32mEuCwB;a25in;arB;do;o0Su0S;l,nB;est;aYeOiLoErDuCwByl0;ay8ight;a8dl7nc0st2;ag0ew;minFnDri0ugCyB;le;!l03;!a29nBov0;e5ie,y;go,icB;!k;armuCeBll1on,rk;go;id;anIj0lbeHmetri9nFon,rEsDvCwBxt3;ay8ey;en,in;hawn,mo08;ek,ri0F;is,nBv3;is,y;rt;!dB;re;lKmInHrDvB;e,iB;!d;en,iDne5rByl;eBin,yl;l2Vn;n,o,us;!e,i4ny;iBon;an,en,on;e,lB;as;a06e04hWiar0lLoGrEuCyrB;il,us;rtB;!is;aBistobal;ig;dy,lEnCrB;ey,neli9y;or,rB;ad;by,e,in,l2t1;aGeDiByI;fBnt;fo0Ct1;meCt9velaB;nd;nt;rDuCyB;!t1;de;enB;ce;aFeErisCuB;ck;!tB;i0oph3;st3;d,rlBs;eBie;s,y;cBdric,s11;il;lEmer1rB;ey,lCro5y;ll;!os,t1;eb,v2;ar02eUilTlaSoPrCuByr1;ddy,rtI;aJeEiDuCyB;an,ce,on;ce,no;an,ce;nCtB;!t;dCtB;!on;an,on;dCndB;en,on;!foBl7y;rd;bCrByd;is;!by;i8ke;al,lA;nFrBshoi;at,nCtB;!r10;aBie;rd0S;!edict,iCjam2nA;ie,y;to;n7rBt;eBy;tt;ey;ar0Xb0Nd0Jgust2hm0Gid6ja0ElZmXnPputsiOrFsaEuCveBya0ziz;ry;gust9st2;us;hi;aIchHi4jun,maFnDon,tBy0;hBu06;ur;av,oB;ld;an,nd0A;el;ie;ta;aq;dGgel05tB;hoEoB;i8nB;!i02y;ne;ny;reBy;!as,s,w;ir,mBos;ar;an,beOd6eIfFi,lEonDphonHt1vB;aMin;on;so,zo;an,en;onCrB;edP;so;c,jaEksandDssaExB;!and3;er;ar,er;ndB;ro;rtH;ni;en;ad,eB;d,t;in;aColfBri0vik;!o;mBn;!a;dFeEraCuB;!bakr,lfazl;hBm;am;!l;allEel,oulaye,ulB;!lCrahm0;an;ah,o;ah;av,on",
    "Person": "true¦ashton kutchSbRcMdKeIgastNhGinez,jEkDleCmBnettJoAp8r4s3t2v0;a0irgin maG;lentino rossi,n go3;heresa may,iger woods,yra banks;addam hussain,carlett johanssJlobodan milosevic,uB;ay romano,eese witherspoIo1ush limbau0;gh;d stewart,nald0;inho,o;a0ipJ;lmIris hiltD;prah winfrFra;essiaen,itt romnEubarek;bron james,e;anye west,iefer sutherland,obe bryant;aime,effers8k rowli0;ng;alle ber0itlBulk hogan;ry;ff0meril lagasse,zekiel;ie;a0enzel washingt2ick wolf;lt1nte;ar1lint0ruz;on;dinal wols1son0;! palm2;ey;arack obama,rock;er",
    "Verb": "true¦awak9born,cannot,fr8g7h5k3le2m1s0wors9;e8h3;ake sure,sg;ngth6ss6;eep tabs,n0;own;as0e2;!t2;iv1onna;ight0;en",
    "PhrasalVerb": "true¦0:7B;1:6Z;2:7N;3:7D;4:6S;5:7Q;6:6L;7:7F;8:6Y;9:6M;A:5P;B:79;C:7G;D:6N;a7Rb6Bc5Kd5Ge5Ef4Cg3Uh3Eiron0j3Ak35l2Pm2Fn2Do2Bp1TquietDr1Hs0BtRuPvacuum 1wHyammerBzE;eroAip FonE;e0k0;by,up;aKeHhGiForErit59;d 1k2X;mp0n2Ppe0r6s6;eel 7Gip 7V;aFiE;gh 08rd0;n 7Dr 3J;it 5Sk6lk7rm 63sh 7Et6Hv4V;rgeBsE;e 9herA;aTeRhPiLoJrGuEype 60;ckArn E;d2in,o3Mup;aFiEot0y 2D;ckleDp 7K;ckDde Y;neDp Es4I;d2o6Uup;ck GdFe Egh62me0p o0Gre0;aw3ba4d2in,up;e 5Ty 1;by,oC;ink Erow 64;ba4ov8up;aEe 4Nll4U;m 1r X;ckBke Flk E;ov8u4V;aEba4d2in,o36up;ba4ft8p50w3;a0Ic0He0Bh07i05l01m00nZoYpTquare StKuIwE;earGiE;ngFtch E;aw3ba4o6Y; by;ck Eit 1m 1ss0;in,up;aJe0UiIoGrEuc39;aigh1RiE;ke 67n33;p Erm1U;by,in,oC;n34r 1tc3N;c33mp0nd Er6Qve7y 1;ba4d2up;d2oCup;ar30eHiGlFrEurB;ingBuc6;a38it 3Z;l10n 1;e5Jll0;be4Hrt0;ap 4Jow 63;ash 56oke0;eep FiEow 9;c3Qp 1;in,oE;ff,v8;gn 4Ong32t Ez6;d2o5up;aGoEu4L;ot Eut0w 65;aw3ba4f3BoC;c2JdeAk50ve7;e Ill0nd HtE; Etl49;d2in,o5upE;!on;aw3ba4d2in,o22up;o5to;al4Tout0rap4T;il7v6;aOeLiKoHuE;b 4Mle0n Estl6;aEba4d2in5Bo3Mt34u3K;c21w3;ot FuE;g2Ond7;a21f2Vo5;ng 4Wp7;aEel7inAnt0;c56d E;o2Xu0F;c1Zt0;aReQiPlNoLrIsyc2DuE;ll Gt E;aEba4d2in,o1Kt39up;p3Ew3;ap3Dd2in,o5t37up;attleBess FiHoE;p 1;ah1Kon;iEp 5Ar3SurDwer 5A;nt0;ay46uE;gAmp 9;ck 5Ag0leBn 9p43;el 4EncilA;c3Wir 2Ln0ss GtFy E;ba4oC; d2c21;aw3ba4o15;pEw3R;e3Qt 4O;arrowDerd0oE;d7teD;aLeJiIoGuE;ddl6lE;l 3D;c19p 1uth7ve E;al3Hd2in,o5up;ss0x 1;asur6lt 9ss E;a1Cup;ke En 9r35s1Nx0;do,o44up;aRePiKoEuck0;aIc3Dg HoEse0;k Ese3B;aft8ba4d2forw2Fin42ov8uE;nd8p;in,o0L;d 9;e HghtGnFsEv1U;ten 4I;e 1k 1; 1e33;ar48d2;av1It 33velE; o3Q;c6p 1sh EtchBugh7y1W;in3Qo5;eFick7nock E;d2o3M;eEyA;l 2Mp E;aw3ba4d2fTin,o06to,up;aGoFuE;ic6mpA;ke2XtD;c36zz 1;aQeLiIoFuE;nkerDrry 1s0V;lEneArse2T;d Ee 1;ba4d2fast,o00up;de Ft E;ba4on,up;aw3o5;aElp0;d Gl 27r Et 1;fEof;rom;in,oSu1D;c00m 1nEve it,z22;d Eg 2CkerG;d2in,o5;aSeMive Kloss 20oGrFunE; f0N;in3Eow 28; Eof 0V;aFb1Ait,oEr3At0Pu15;ff,n,v8;bo5ft8hKw3;aw3ba4d2in,oEup,w3;ff,n,ut;a1Aek0t E;aFb14d2oEr34up;ff,n,ut,v8;cFhEl1Ur32t,w3;ead;ross;d aFnE;g 1;bo5;a09e02iSlOoKrGuE;cEel 1;k 1;eFighten EownBy 1;aw3oC;eEshe1L; 1z6;lGol E;aEwi1E;bo5r2N;d 9low 1;aFeEip0;sh0;g 9ke0mErE;e 2P;gMlKnIrGsFzzE;le0;h 2M;e Em 1;aw3ba4up;d0isE;h 1;e El 16;aw3fJ;ht ba4ure0;eJnFsE;s 1;cGd E;fEoC;or;e 1U;dSl 1;cIll Erm0t0T;ap01bGd2in,oFtE;hrough;ff,ut,v8;a4ehi1X;e F;at0dge0nd Ey6;oCup;oGrE;ess 9op E;aw3bQin,o1A; 0Bubl6;aUhRlean 9oEross 1Gut 0X;me HoFuntE; o1Q;k 1l E;d2oC;aKbJforHin,oGtFuE;nd8;ogeth8;ut,v8;th,wE;ard;a4y;pEr1Cw3;art;eEipA;ck 11eE;r 1;lKncel0rHsGtch FveA; in;o19up;h 0Wt7;ry FvE;e Y;aw3o15;l EmD;aEba4d2o13up;r0Yw3;a0Ke0Bl04oVrKuE;bblHcklWil02lGndlWrn 08st FtEy 13zz7;t 0N;in,o5up;k 9;e E;ov8;anNeaLiEush7;ghIng E;aFba4d2forEin,o5up;th;bo5lEr0Mw3;ong;teE;n 1;k E;d2in,o5up;ch0;arLgDil 9n6oHssGttlFunce Ex 07;aw3ba4;e 9; ar0C;k 03t 1;e 1;d2up; d2;d 1;aJeed0oEurt0;cGw E;aw3ba4d2o5up;ck;k E;in,oL;ck0nk0st7; oKaHef 1nd E;d2ov8up;er;up;r0t E;d2in,oEup;ff,ut;ff,nE;to;ck Kil0nGrgFsE;h H;ainBe G;g FkB; on;in,o5; o5;aw3d2o5up;ay;cNdJsk Guction7; oC;ff;arEo5;ouE;nd;d E;d2oEup;ff,n;own;t E;o5up;ut",
    "Modal": "true¦c5lets,m4ought3sh1w0;ill,o5;a0o4;ll,nt;! to,a;ay,ight,ust;an,o0;uld",
    "Adjective": "true¦0:7P;1:84;2:83;3:8A;4:7W;5:5S;6:4N;7:4O;8:58;9:6I;A:81;a6Wb6Gc63d5Je54f4Hg49h3Wi39j37k36l2Vm2Ln2Bo1Wp1Dquack,r12s0Ft07uMvJwByear5;arp0eFholeEiDoB;man5oBu6P;d6Rzy;despr7Ls5S;!sa7;eClBste2A;co1Nl o4W;!k5;aCiBola4M;b89ce versa,ol5H;ca3gabo6Gnilla;ltUnHpCrb5Msu4tterB;!mo7G; Eb1SpDsBti1M;ca7etBide dKtairs;!ti2;er,i3U;f36to da1;aLbeco75convin29deIeHfair,ivers4knGprecedVrEsCwB;iel3Nritt6A;i1XuB;pervis0spec3Y;eBu5;cognHgul6Tl6T;own;ndi2v64xpect0;cid0rB;!grou5ZsB;iz0tood;b7pp0Dssu6UuthorB;iz0;i26ra;aGeEhDi6AoCrB;i1oubl0us3M;geth8p,rp6Vuc67;ough4Wril33;en60l32mpBrr2X;o6Ati2;boo,lBn;ent0;aWcVeThSiQmug,nobbi3LoOpNqueami3LtFuBymb6H;bDi gener5DpBrpri6D;erBre0N;! dup8b,i2C;du0seq52;anda77eGiFrBunni2y3F;aightCiB;ki2p0; fBfB;or5K;ll,r5S;aBreotyp0;dfa6Cmi2;a55ec2Gir1Hlend6Cot on; call0le,mb8phist1XrBu0Vvi48;d6Ary;gnifica3nB;ce51g7;am2Re8ocki2ut;cBda1em5lfi32ni1Wpa6Jre6;o1Er42;at5Gient28reec5G;cr0me;aJeEiCoB;bu60tt51uQy4;ghtBv4;!-2Bf9;ar,bel,condi1du6Dfres5AlEpublic42sCtard0vB;ea26;is4CoB;lu1na3;aQe1Cuc4A;b5TciBllyi2;al,st;aOeLicayu6lac5Ropuli5QrCuB;bl5Jmp0n51;eGiDoB;!b07fu5RmiBp8;ne3si2;mCor,sBva1;ti6;a53e;ci5MmB;a0EiB;er,um;ac20rBti1;feAma2XpleBv38;xi2;rBst;allelDtB;-tiBi4;me;!ed;bLffJkIld fashion0nHpGrg1Eth8utFvB;al,erB;!all,niCt,wB;eiBrouB;ght;do0Ter,g2Qsi4B;en,posi1; boa5Og2Oli6;!ay; gua5MbBli6;eat;eDsB;cBer0Eole1;e6u3O;d2Xse;aJeIiHoBua4X;nFrCtB;ab7;thB;!eB;rn;chala3descri58stop;ght5;arby,cessa44ighbor5xt;k0usia1A;aIeGiDoBultip7;bi7derBl0Vnth5ot,st;a1n;nBx0;dblo0RiaBor;tu37;ande3Qdi4NnaBre;ci2;cBgenta,in,j01keshift,le,mmoth,ny,sculi6;ab33ho;aKeFiCoBu15;uti14vi2;mCteraB;l,te;it0;ftEgBth4;al,eCitiB;ma1;nda3K;!-0C;ngu3Zst,tt8;ap1Xind5no0A;agg0uB;niMstifi0veni7;de4gno4Klleg4mQnEpso 20rB;a1rB;eleBita0J;va3; KaJbr0corIdGfluenQiQnFsEtCviB;go0Fti2;aAen3SoxB;ic3B;a6i2Vul0D;a1er,oce3;iCoB;or;reA;deq3Qppr33;fBsitu,vitro;ro3;mFpB;arDerfeAoBrop8;li1rtB;a3ed;ti4;eBi0S;d2Vn3C;aIeFiDoBumdr3I;ne36ok0rrBs08ur5;if2Z;ghfalut1QspB;an2X;aClB;liYpf9;li2;lEnDrB;d04roB;wi2;dy;f,low0;ainf9ener2Oiga24lHoGraDuB;ilBng ho;ty;cCtB;ef9is;ef9;ne,od;ea2Iob4;aTeNinMlKoFrB;a1VeDoz1MustB;raB;ti2;e2Gq10tf9;oDrB; keeps,eBm8tuna1;g03ign;liB;sh;aBue3;g31tte1P;al,i1;dFmCrB;ti7;a7ini6;ne;le; up;bl0i3l27r Cux,voB;ri1uri1;oBreac1E;ff;aLfficie3lKmHnFreAthere4veExB;aAcess,pe1QtraCuB;be2Nl0E;!va1E;n,ryday; BcouraEti0O;rou1sui1;erCiB;ne3;gi2;abo23dMe17i1;g8sB;t,ygB;oi2;er;aReJiDoBrea14ue;mina3ne,ubB;le,tf9;dact1Bfficu1OsCvB;er1K;creDeas0gruntl0hone1FordCtB;a3ressM;er5;et; HadpGfFgene1PliDrang0spe1PtCvoB;ut;ail0ermin0;be1Mca1ghB;tf9;ia3;an;facto;i5magBngeroUs0G;ed,i2;ly;ertaMhief,ivil,oDrB;aBowd0u0G;mp0vZz0;loImGnCrrBve0P;eAu1I;cre1fu0LgrDsCtB;empo0Dra0E;ta3;ue3;mer08pleB;te,x;ni4ss4;in;aNeIizarHlFoCrB;and new,isk,okN;gCna fiUttom,urgeoB;is;us;ank,indB;!i2;re;autif9hiDloCnBst,yoD;eUt;v0w;nd;ul;ckCnkru0WrrB;en;!wards; priori,b0Mc0Jd09fra08g04h03lYmWntiquVppSrMsIttracti06utheHvEwB;aCkB;wa0T;ke,re;ant garCerB;age;de;ntU;leep,piDsuDtonB;isB;hi2;ri2;ab,bitEroDtiB;fiB;ci4;ga3;raB;ry;are3etiNrB;oprB;ia1;at0;aJuB;si2;arEcohCeBiIl,oof;rt;olB;ic;mi2;ead;ainDgressiConiB;zi2;ve;st;id; IeGuFvB;aCerB;se;nc0;ed;lt;pt,qB;ua1;hoc,infinitB;um;cuCtu4u1;al;ra1;erLlKoIruHsCuB;nda3;e3oCtraA;ct;lu1rbi2;ng;te;pt;aBve;rd;aze,e;ra3;nt",
    "Comparable": "true¦0:41;1:4I;2:45;3:2Y;4:4B;5:3X;a4Ob44c3Od3De35f2Rg2Fh24i1Vj1Uk1Rl1Jm1Dn17o15p0Vqu0Tr0KsTtMuIvFw7y6za13;ell27ou4;aBe9hi1Yi7r6;o4y;ck0Ode,l6n1ry,se;d,y;a6i4Mt;k,ry;n1Tr6sK;m,y;a7e6ulgar;nge5rda2xi4;g9in,st;g0n6pco3Mse5;like0t6;i1r6;ue;aAen9hi8i7ough,r6;anqu2Oen1ue;dy,g3Sme0ny,r09;ck,n,rs2P;d40se;ll,me,rt,s6wd45;te5;aVcarUeThRiQkin0FlMmKoHpGqua1FtAu7w6;eet,ift;b7dd13per0Gr6;e,re2H;sta2Ft3;aAe9iff,r7u6;pXr1;a6ict,o4;ig3Fn0U;a1ep,rn;le,rk;e22i3Fright0;ci28ft,l7o6re,ur;n,thi4;emn,id;a6el0ooth;ll,rt;e8i6ow,y;ck,g35m6;!y;ek,nd3D;ck,l0mp3;a6iTort,rill,y;dy,ll0Xrp;cu0Rve0Rxy;ce,ed,y;d,fe,int0l1Vv14;aBe9i8o6ude;mantic,o1Isy,u6;gh,nd;ch,pe,tzy;a6d,mo0H;dy,l;gg7ndom,p6re,w;id;ed;ai2i6;ck,et;aEhoDi1QlCoBr8u6;ny,r6;e,p3;egna2ic7o6;fouYud;ey,k0;li04or,te1B;ain,easa2;ny;in5le;dd,f6i0ld,ranQ;fi10;aAe8i7o6;b3isy,rm15sy;ce,mb3;a6w;r,t;ive,rr01;aAe8ild,o7u6;nda19te;ist,o1;a6ek,llX;n,s0ty;d,tuQ;aBeAi9o6ucky;f0Un7o1Du6ve0w17y0T;d,sy;e0g;g1Tke0tt3ve0;an,wd;me,r6te;ge;e7i6;nd;en;ol0ui1P;cy,ll,n6;sBt6;e6ima8;llege2r6;es7media6;te;ti4;ecu6ta2;re;aEeBiAo8u6;ge,m6ng1R;b3id;ll6me0t;ow;gh,l0;a6f04sita2;dy,v6;en0y;nd1Hppy,r6te5;d,sh;aGenFhDiClBoofy,r6;a9e8is0o6ue1E;o6ss;vy;at,en,y;nd,y;ad,ib,ooI;a2d1;a6o6;st0;t3uiY;u1y;aIeeb3iDlat,oAr8u6;ll,n6r14;!ny;aHe6iend0;e,sh;a7r6ul;get5mG;my;erce8n6rm;an6e;ciC;! ;le;ir,ke,n0Fr,st,t,ulA;aAerie,mp9sse7v6xtre0Q;il;nti6;al;ty;r7s6;tern,y;ly,th0;aFeCi9r7u6;ll,mb;u6y;nk;r7vi6;ne;e,ty;a6ep,nD;d6f,r;!ly;mp,pp03rk;aHhDlAo8r7u6;dd0r0te;isp,uel;ar6ld,mmon,ol,st0ward0zy;se;e6ou1;a6vW;n,r;ar8e6il0;ap,e6;sy;mi4;gey,lm8r6;e5i4;ful;!i4;aNiLlIoEr8u6;r0sy;ly;aAi7o6;ad,wn;ef,g7llia2;nt;ht;sh,ve;ld,r7un6;cy;ed,i4;ng;a7o6ue;nd,o1;ck,nd;g,tt6;er;d,ld,w1;dy;bsu9ng8we6;so6;me;ry;rd",
    "TextValue": "true¦bOeJfDhundredNmOninAone,qu8s6t0zeroN;enMh3rNw0;e0o;l0ntD;fHve;ir0ousandKree;d,t6;e0ix8;cond,pt1ven7xt1;adr0int0;illionD;e0th;!t0;e9ie8y;i3o0;rt1ur0;!t2;ie4y;ft0rst,ve;e3h,ie2y;ight0lev2;!e1h,ie0y;th;en0;!th;illion0;!s,th",
    "Ordinal": "true¦bGeDf9hundredHmGnin7qu6s4t0zeroH;enGh1rFwe0;lfFn9;ir0ousandE;d,t4;e0ixt9;cond,ptAvent8xtA;adr9int9;et0th;e6ie8;i2o0;r0urt3;tie5;ft1rst;ight0lev1;e0h,ie2;en1;illion0;th",
    "Cardinal": "true¦bHeEf8hundred,mHnineAone,qu6s4t0zero;en,h2rGw0;e0o;lve,n8;irt9ousandEree;e0ix5;pt1ven4xt1;adr0int0;illion;i3o0;r1ur0;!t2;ty;ft0ve;e2y;ight0lev1;!e0y;en;illion0;!s",
    "Expression": "true¦a02b01dXeVfuck,gShLlImHnGoDpBshAtsk,u7voi04w3y0;a1eLu0;ck,p;!a,hoo,y;h1ow,t0;af,f;e0oa;e,w;gh,h0;! 0h,m;huh,oh;eesh,hh,it;ff,hew,l0sst;ease,z;h1o0w,y;h,o,ps;!h;ah,ope;eh,mm;m1ol0;!s;ao,fao;a4e2i,mm,oly1urr0;ah;! mo6;e,ll0y;!o;ha0i;!ha;ah,ee,o0rr;l0odbye;ly;e0h,t cetera,ww;k,p;'oh,a0uh;m0ng;mit,n0;!it;ah,oo,ye; 1h0rgh;!em;la",
    "Adverb": "true¦a08by 06d02eYfShQinPjustOkinda,mMnJoEpCquite,r9s5t2up1very,well,ye0;p,s; to,wards5;h1iny bit,o0wiO;o,t6ward;en,us;everal,o0uch;!me1rt0; of;hYtimes,w09;a1e0;alT;ndomSthN;ar excellDer0oint blank; Nhaps;f3n0;ce0ly;! 0;ag02moW; courIten;ewKo0; longEt 0;onIwithstanding;aybe,eanwhiAore0;!ovB;! aboU;deed,steV;en0;ce;or2u0;lArther0;!moJ; 0ev3;examp0good,suH;le;n1v0;er; mas0ough;se;e0irect1; 1finite0;ly;ju8trop;far,n0;ow; DbroCd nauseam,gBl6ny3part,s2t 0w4;be6l0mo6wor6;arge,ea5; soon,ide;mo1w0;ay;re;l 1mo0one,ready,so,ways;st;b1t0;hat;ut;ain;ad;lot,posteriori",
    "Determiner": "true¦aAboth,d8e5few,l3mu7neiCown,plenty,some,th2various,wh0;at0ich0;evB;at,e3is,ose;a,e0;!ast,s;a1i6l0very;!se;ch;e0u;!s;!n0;!o0y;th0;er"
  };

  var entity = ['Person', 'Place', 'Organization'];
  var nouns = {
    Noun: {
      notA: ['Verb', 'Adjective', 'Adverb']
    },
    // - singular
    Singular: {
      isA: 'Noun',
      notA: 'Plural'
    },
    //a specific thing that's capitalized
    ProperNoun: {
      isA: 'Noun'
    },
    // -- people
    Person: {
      isA: ['ProperNoun', 'Singular'],
      notA: ['Place', 'Organization', 'Date']
    },
    FirstName: {
      isA: 'Person'
    },
    MaleName: {
      isA: 'FirstName',
      notA: ['FemaleName', 'LastName']
    },
    FemaleName: {
      isA: 'FirstName',
      notA: ['MaleName', 'LastName']
    },
    LastName: {
      isA: 'Person',
      notA: ['FirstName']
    },
    NickName: {
      isA: 'Person',
      notA: ['FirstName', 'LastName']
    },
    Honorific: {
      isA: 'Noun',
      notA: ['FirstName', 'LastName', 'Value']
    },
    // -- places
    Place: {
      isA: 'Singular',
      notA: ['Person', 'Organization']
    },
    Country: {
      isA: ['Place', 'ProperNoun'],
      notA: ['City']
    },
    City: {
      isA: ['Place', 'ProperNoun'],
      notA: ['Country']
    },
    Region: {
      isA: ['Place', 'ProperNoun']
    },
    Address: {
      isA: 'Place'
    },
    //---Orgs---
    Organization: {
      isA: ['Singular', 'ProperNoun'],
      notA: ['Person', 'Place']
    },
    SportsTeam: {
      isA: 'Organization'
    },
    School: {
      isA: 'Organization'
    },
    Company: {
      isA: 'Organization'
    },
    // - plural
    Plural: {
      isA: 'Noun',
      notA: ['Singular']
    },
    //(not plural or singular)
    Uncountable: {
      isA: 'Noun'
    },
    Pronoun: {
      isA: 'Noun',
      notA: entity
    },
    //a word for someone doing something -'plumber'
    Actor: {
      isA: 'Noun',
      notA: entity
    },
    //a gerund-as-noun - 'swimming'
    Activity: {
      isA: 'Noun',
      notA: ['Person', 'Place']
    },
    //'kilograms'
    Unit: {
      isA: 'Noun',
      notA: entity
    },
    //'Canadians'
    Demonym: {
      isA: ['Noun', 'ProperNoun'],
      notA: entity
    },
    //`john's`
    Possessive: {
      isA: 'Noun' // notA: 'Pronoun',

    }
  };

  var verbs = {
    Verb: {
      notA: ['Noun', 'Adjective', 'Adverb', 'Value']
    },
    // walks
    PresentTense: {
      isA: 'Verb',
      notA: ['PastTense', 'FutureTense']
    },
    // neutral form - 'walk'
    Infinitive: {
      isA: 'PresentTense',
      notA: ['PastTense', 'Gerund']
    },
    // walking
    Gerund: {
      isA: 'PresentTense',
      notA: ['PastTense', 'Copula', 'FutureTense']
    },
    // walked
    PastTense: {
      isA: 'Verb',
      notA: ['FutureTense']
    },
    // will walk
    FutureTense: {
      isA: 'Verb'
    },
    // is
    Copula: {
      isA: 'Verb'
    },
    // would have
    Modal: {
      isA: 'Verb',
      notA: ['Infinitive']
    },
    // had walked
    PerfectTense: {
      isA: 'Verb',
      notA: 'Gerund'
    },
    Pluperfect: {
      isA: 'Verb'
    },
    // shown
    Participle: {
      isA: 'PastTense'
    },
    // show up
    PhrasalVerb: {
      isA: 'Verb'
    },
    //'up' part
    Particle: {
      isA: 'PhrasalVerb'
    }
  };

  var values = {
    Value: {
      notA: ['Verb', 'Adjective', 'Adverb']
    },
    Ordinal: {
      isA: 'Value',
      notA: ['Cardinal']
    },
    Cardinal: {
      isA: 'Value',
      notA: ['Ordinal']
    },
    RomanNumeral: {
      isA: 'Cardinal',
      //can be a person, too
      notA: ['Ordinal', 'TextValue']
    },
    TextValue: {
      isA: 'Value',
      notA: ['NumericValue']
    },
    NumericValue: {
      isA: 'Value',
      notA: ['TextValue']
    },
    Money: {
      isA: 'Cardinal'
    },
    Percent: {
      isA: 'Value'
    }
  };

  var anything = ['Noun', 'Verb', 'Adjective', 'Adverb', 'Value', 'QuestionWord'];
  var misc = {
    //--Adjectives--
    Adjective: {
      notA: ['Noun', 'Verb', 'Adverb', 'Value']
    },
    // adjectives that can conjugate
    Comparable: {
      isA: ['Adjective']
    },
    // better
    Comparative: {
      isA: ['Adjective']
    },
    // best
    Superlative: {
      isA: ['Adjective'],
      notA: ['Comparative']
    },
    NumberRange: {
      isA: ['Contraction']
    },
    Adverb: {
      notA: ['Noun', 'Verb', 'Adjective', 'Value']
    },
    // Dates:
    //not a noun, but usually is
    Date: {
      notA: ['Verb', 'Conjunction', 'Adverb', 'Preposition', 'Adjective']
    },
    Month: {
      isA: ['Date', 'Singular'],
      notA: ['Year', 'WeekDay', 'Time']
    },
    WeekDay: {
      isA: ['Date', 'Noun']
    },
    // '9:20pm'
    Time: {
      isA: ['Date'],
      notA: ['Value']
    },
    //glue
    Determiner: {
      notA: anything
    },
    Conjunction: {
      notA: anything
    },
    Preposition: {
      notA: anything
    },
    // what, who, why
    QuestionWord: {
      notA: ['Determiner']
    },
    // peso, euro
    Currency: {},
    // ughh
    Expression: {
      notA: ['Noun', 'Adjective', 'Verb', 'Adverb']
    },
    // dr.
    Abbreviation: {},
    // internet tags
    Url: {
      notA: ['HashTag', 'PhoneNumber', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email']
    },
    PhoneNumber: {
      notA: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email']
    },
    HashTag: {},
    AtMention: {
      isA: ['Noun'],
      notA: ['HashTag', 'Verb', 'Adjective', 'Value', 'Email']
    },
    Emoji: {
      notA: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention']
    },
    Emoticon: {
      notA: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention']
    },
    Email: {
      notA: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention']
    },
    //non-exclusive
    Auxiliary: {
      notA: ['Noun', 'Adjective', 'Value']
    },
    Acronym: {
      notA: ['Plural', 'RomanNumeral']
    },
    Negative: {
      notA: ['Noun', 'Adjective', 'Value']
    },
    // if, unless, were
    Condition: {
      notA: ['Verb', 'Adjective', 'Noun', 'Value']
    }
  };

  // i just made these up
  var colorMap = {
    Noun: 'blue',
    Verb: 'green',
    Negative: 'green',
    Date: 'red',
    Value: 'red',
    Adjective: 'magenta',
    Preposition: 'cyan',
    Conjunction: 'cyan',
    Determiner: 'cyan',
    Adverb: 'cyan'
  };
  /** add a debug color to some tags */

  var addColors = function addColors(tags) {
    Object.keys(tags).forEach(function (k) {
      // assigned from plugin, for example
      if (tags[k].color) {
        tags[k].color = tags[k].color;
        return;
      } // defined above


      if (colorMap[k]) {
        tags[k].color = colorMap[k];
        return;
      }

      tags[k].isA.some(function (t) {
        if (colorMap[t]) {
          tags[k].color = colorMap[t];
          return true;
        }

        return false;
      });
    });
    return tags;
  };

  var _color = addColors;

  var unique$2 = function unique(arr) {
    return arr.filter(function (v, i, a) {
      return a.indexOf(v) === i;
    });
  }; //add 'downward' tags (that immediately depend on this one)


  var inferIsA = function inferIsA(tags) {
    Object.keys(tags).forEach(function (k) {
      var tag = tags[k];
      var len = tag.isA.length;

      for (var i = 0; i < len; i++) {
        var down = tag.isA[i];

        if (tags[down]) {
          tag.isA = tag.isA.concat(tags[down].isA);
        }
      } // clean it up


      tag.isA = unique$2(tag.isA);
    });
    return tags;
  };

  var _isA = inferIsA;

  var unique$3 = function unique(arr) {
    return arr.filter(function (v, i, a) {
      return a.indexOf(v) === i;
    });
  }; // crawl the tag-graph and infer any conflicts
  // faster than doing this at tag-time


  var inferNotA = function inferNotA(tags) {
    var keys = Object.keys(tags);
    keys.forEach(function (k) {
      var tag = tags[k];
      tag.notA = tag.notA || [];
      tag.isA.forEach(function (down) {
        if (tags[down] && tags[down].notA) {
          // borrow its conflicts
          var notA = typeof tags[down].notA === 'string' ? [tags[down].isA] : tags[down].notA || [];
          tag.notA = tag.notA.concat(notA);
        }
      }); // any tag that lists us as a conflict, we conflict it back.

      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];

        if (tags[key].notA.indexOf(k) !== -1) {
          tag.notA.push(key);
        }
      } // clean it up


      tag.notA = unique$3(tag.notA);
    });
    return tags;
  };

  var _notA = inferNotA;

  // a lineage is all 'incoming' tags that have this as 'isA'
  var inferLineage = function inferLineage(tags) {
    var keys = Object.keys(tags);
    keys.forEach(function (k) {
      var tag = tags[k];
      tag.lineage = []; // find all tags with it in their 'isA' set

      for (var i = 0; i < keys.length; i++) {
        if (tags[keys[i]].isA.indexOf(k) !== -1) {
          tag.lineage.push(keys[i]);
        }
      }
    });
    return tags;
  };

  var _lineage = inferLineage;

  var validate = function validate(tags) {
    // cleanup format
    Object.keys(tags).forEach(function (k) {
      var tag = tags[k]; // ensure isA is an array

      tag.isA = tag.isA || [];

      if (typeof tag.isA === 'string') {
        tag.isA = [tag.isA];
      } // ensure notA is an array


      tag.notA = tag.notA || [];

      if (typeof tag.notA === 'string') {
        tag.notA = [tag.notA];
      }
    });
    return tags;
  }; // build-out the tag-graph structure


  var inferTags = function inferTags(tags) {
    // validate data
    tags = validate(tags); // build its 'down tags'

    tags = _isA(tags); // infer the conflicts

    tags = _notA(tags); // debug tag color

    tags = _color(tags); // find incoming links

    tags = _lineage(tags);
    return tags;
  };

  var inference = inferTags;

  var addIn = function addIn(obj, tags) {
    Object.keys(obj).forEach(function (k) {
      tags[k] = obj[k];
    });
  };

  var build = function build() {
    var tags = {};
    addIn(nouns, tags);
    addIn(verbs, tags);
    addIn(values, tags);
    addIn(misc, tags); // do the graph-stuff

    tags = inference(tags);
    return tags;
  };

  var tags = build();

  var seq = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      cache = seq.split("").reduce(function (n, o, e) {
    return n[o] = e, n;
  }, {}),
      toAlphaCode = function toAlphaCode(n) {
    if (void 0 !== seq[n]) return seq[n];
    var o = 1,
        e = 36,
        t = "";

    for (; n >= e; n -= e, o++, e *= 36) {
    }

    for (; o--;) {
      var _o = n % 36;

      t = String.fromCharCode((_o < 10 ? 48 : 55) + _o) + t, n = (n - _o) / 36;
    }

    return t;
  },
      fromAlphaCode = function fromAlphaCode(n) {
    if (void 0 !== cache[n]) return cache[n];
    var o = 0,
        e = 1,
        t = 36,
        r = 1;

    for (; e < n.length; o += t, e++, t *= 36) {
    }

    for (var _e = n.length - 1; _e >= 0; _e--, r *= 36) {
      var _t = n.charCodeAt(_e) - 48;

      _t > 10 && (_t -= 7), o += _t * r;
    }

    return o;
  };

  var encoding = {
    toAlphaCode: toAlphaCode,
    fromAlphaCode: fromAlphaCode
  },
      symbols = function symbols(n) {
    var o = new RegExp("([0-9A-Z]+):([0-9A-Z]+)");

    for (var e = 0; e < n.nodes.length; e++) {
      var t = o.exec(n.nodes[e]);

      if (!t) {
        n.symCount = e;
        break;
      }

      n.syms[encoding.fromAlphaCode(t[1])] = encoding.fromAlphaCode(t[2]);
    }

    n.nodes = n.nodes.slice(n.symCount, n.nodes.length);
  };

  var indexFromRef = function indexFromRef(n, o, e) {
    var t = encoding.fromAlphaCode(o);
    return t < n.symCount ? n.syms[t] : e + t + 1 - n.symCount;
  },
      toArray = function toArray(n) {
    var o = [],
        e = function e(t, r) {
      var s = n.nodes[t];
      "!" === s[0] && (o.push(r), s = s.slice(1));
      var c = s.split(/([A-Z0-9,]+)/g);

      for (var _s = 0; _s < c.length; _s += 2) {
        var u = c[_s],
            i = c[_s + 1];
        if (!u) continue;
        var l = r + u;

        if ("," === i || void 0 === i) {
          o.push(l);
          continue;
        }

        var f = indexFromRef(n, i, t);
        e(f, l);
      }
    };

    return e(0, ""), o;
  },
      unpack = function unpack(n) {
    var o = {
      nodes: n.split(";"),
      syms: [],
      symCount: 0
    };
    return n.match(":") && symbols(o), toArray(o);
  };

  var unpack_1 = unpack,
      unpack_1$1 = function unpack_1$1(n) {
    var o = n.split("|").reduce(function (n, o) {
      var e = o.split("¦");
      return n[e[0]] = e[1], n;
    }, {}),
        e = {};
    return Object.keys(o).forEach(function (n) {
      var t = unpack_1(o[n]);
      "true" === n && (n = !0);

      for (var _o2 = 0; _o2 < t.length; _o2++) {
        var r = t[_o2];
        !0 === e.hasOwnProperty(r) ? !1 === Array.isArray(e[r]) ? e[r] = [e[r], n] : e[r].push(n) : e[r] = n;
      }
    }), e;
  };

  var efrtUnpack_min = unpack_1$1;

  //safely add it to the lexicon
  var addWord = function addWord(word, tag, lex) {
    if (lex[word] !== undefined) {
      if (typeof lex[word] === 'string') {
        lex[word] = [lex[word]];
      }

      if (typeof tag === 'string') {
        lex[word].push(tag);
      } else {
        lex[word] = lex[word].concat(tag);
      }
    } else {
      lex[word] = tag;
    }
  }; // blast-out more forms for some given words


  var addMore = function addMore(word, tag, world) {
    var lexicon = world.words;
    var transform = world.transforms; // cache multi-words

    var words = word.split(' ');

    if (words.length > 1) {
      //cache the beginning word
      world.hasCompound[words[0]] = true;
    } // inflect our nouns


    if (tag === 'Singular') {
      var plural = transform.toPlural(word, world);
      lexicon[plural] = lexicon[plural] || 'Plural'; // only if it's safe
    } //conjugate our verbs


    if (tag === 'Infinitive') {
      var conj = transform.conjugate(word, world);
      var tags = Object.keys(conj);

      for (var i = 0; i < tags.length; i++) {
        var w = conj[tags[i]];
        lexicon[w] = lexicon[w] || tags[i]; // only if it's safe
      }
    } //derive more adjective forms


    if (tag === 'Comparable') {
      var _conj = transform.adjectives(word);

      var _tags = Object.keys(_conj);

      for (var _i = 0; _i < _tags.length; _i++) {
        var _w = _conj[_tags[_i]];
        lexicon[_w] = lexicon[_w] || _tags[_i]; // only if it's safe
      }
    } //conjugate phrasal-verbs


    if (tag === 'PhrasalVerb') {
      //add original form
      addWord(word, 'Infinitive', lexicon); //conjugate first word

      var _conj2 = transform.conjugate(words[0], world);

      var _tags2 = Object.keys(_conj2);

      for (var _i2 = 0; _i2 < _tags2.length; _i2++) {
        //add it to our cache
        world.hasCompound[_conj2[_tags2[_i2]]] = true; //first + last words

        var _w2 = _conj2[_tags2[_i2]] + ' ' + words[1];

        addWord(_w2, _tags2[_i2], lexicon);
        addWord(_w2, 'PhrasalVerb', lexicon);
      }
    } // inflect our demonyms - 'germans'


    if (tag === 'Demonym') {
      var _plural = transform.toPlural(word, world);

      lexicon[_plural] = lexicon[_plural] || ['Demonym', 'Plural']; // only if it's safe
    }
  }; // throw a bunch of words in our lexicon
  // const doWord = function(words, tag, world) {
  //   let lexicon = world.words
  //   for (let i = 0; i < words.length; i++) {
  //     addWord(words[i], tag, lexicon)
  //     // do some fancier stuff
  //     addMore(words[i], tag, world)
  //   }
  // }


  var addWords = {
    addWord: addWord,
    addMore: addMore
  };

  // add words from plurals and conjugations data
  var addIrregulars = function addIrregulars(world) {
    //add irregular plural nouns
    var nouns = world.irregulars.nouns;
    var words = Object.keys(nouns);

    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      world.words[w] = 'Singular';
      world.words[nouns[w]] = 'Plural';
    } // add irregular verb conjugations


    var verbs = world.irregulars.verbs;
    var keys = Object.keys(verbs);

    var _loop = function _loop(_i) {
      var inf = keys[_i]; //add only if it it's safe...

      world.words[inf] = world.words[inf] || 'Infinitive';
      var forms = world.transforms.conjugate(inf, world);
      forms = Object.assign(forms, verbs[inf]); //add the others

      Object.keys(forms).forEach(function (tag) {
        world.words[forms[tag]] = world.words[forms[tag]] || tag; // lexicon should prefer other tags, over participle

        if (world.words[forms[tag]] === 'Participle') {
          world.words[forms[tag]] = tag;
        }
      });
    };

    for (var _i = 0; _i < keys.length; _i++) {
      _loop(_i);
    }
  };

  var addIrregulars_1 = addIrregulars;

  //words that can't be compressed, for whatever reason
  var misc$1 = {
    // numbers
    '20th century fox': 'Organization',
    // '3m': 'Organization',
    '7 eleven': 'Organization',
    '7-eleven': 'Organization',
    g8: 'Organization',
    'motel 6': 'Organization',
    vh1: 'Organization',
    q1: 'Date',
    q2: 'Date',
    q3: 'Date',
    q4: 'Date',
    her: ['Possessive', 'Pronoun'],
    his: ['Possessive', 'Pronoun'],
    their: ['Possessive', 'Pronoun'],
    themselves: ['Possessive', 'Pronoun'],
    your: ['Possessive', 'Pronoun'],
    our: ['Possessive', 'Pronoun'],
    my: ['Possessive', 'Pronoun'],
    its: ['Possessive', 'Pronoun']
  };

  //nouns with irregular plural/singular forms
  //used in noun.inflect, and also in the lexicon.
  var plurals = {
    addendum: 'addenda',
    alga: 'algae',
    alumna: 'alumnae',
    alumnus: 'alumni',
    analysis: 'analyses',
    antenna: 'antennae',
    appendix: 'appendices',
    avocado: 'avocados',
    axis: 'axes',
    bacillus: 'bacilli',
    barracks: 'barracks',
    beau: 'beaux',
    bus: 'buses',
    cactus: 'cacti',
    chateau: 'chateaux',
    child: 'children',
    circus: 'circuses',
    clothes: 'clothes',
    corpus: 'corpora',
    criterion: 'criteria',
    curriculum: 'curricula',
    database: 'databases',
    deer: 'deer',
    diagnosis: 'diagnoses',
    echo: 'echoes',
    embargo: 'embargoes',
    epoch: 'epochs',
    foot: 'feet',
    formula: 'formulae',
    fungus: 'fungi',
    genus: 'genera',
    goose: 'geese',
    halo: 'halos',
    hippopotamus: 'hippopotami',
    index: 'indices',
    larva: 'larvae',
    leaf: 'leaves',
    libretto: 'libretti',
    loaf: 'loaves',
    man: 'men',
    matrix: 'matrices',
    memorandum: 'memoranda',
    modulus: 'moduli',
    mosquito: 'mosquitoes',
    mouse: 'mice',
    // move: 'moves',
    nebula: 'nebulae',
    nucleus: 'nuclei',
    octopus: 'octopi',
    opus: 'opera',
    ovum: 'ova',
    ox: 'oxen',
    parenthesis: 'parentheses',
    person: 'people',
    phenomenon: 'phenomena',
    prognosis: 'prognoses',
    quiz: 'quizzes',
    radius: 'radii',
    referendum: 'referenda',
    rodeo: 'rodeos',
    sex: 'sexes',
    shoe: 'shoes',
    sombrero: 'sombreros',
    stimulus: 'stimuli',
    stomach: 'stomachs',
    syllabus: 'syllabi',
    synopsis: 'synopses',
    tableau: 'tableaux',
    thesis: 'theses',
    thief: 'thieves',
    tooth: 'teeth',
    tornado: 'tornados',
    tuxedo: 'tuxedos',
    vertebra: 'vertebrae' // virus: 'viri',
    // zero: 'zeros',

  };

  // a list of irregular verb conjugations
  // used in verbs().conjugate()
  // but also added to our lexicon
  //use shorter key-names
  var mapping = {
    g: 'Gerund',
    prt: 'Participle',
    perf: 'PerfectTense',
    pst: 'PastTense',
    fut: 'FuturePerfect',
    pres: 'PresentTense',
    pluperf: 'Pluperfect',
    a: 'Actor'
  }; // '_' in conjugations is the infinitive form
  // (order matters, to the lexicon)

  var conjugations = {
    act: {
      a: '_or'
    },
    ache: {
      pst: 'ached',
      g: 'aching'
    },
    age: {
      g: 'ageing',
      pst: 'aged',
      pres: 'ages'
    },
    aim: {
      a: '_er',
      g: '_ing',
      pst: '_ed'
    },
    arise: {
      prt: '_n',
      pst: 'arose'
    },
    babysit: {
      a: '_ter',
      pst: 'babysat'
    },
    ban: {
      a: '',
      g: '_ning',
      pst: '_ned'
    },
    be: {
      a: '',
      g: 'am',
      prt: 'been',
      pst: 'was',
      pres: 'is'
    },
    beat: {
      a: '_er',
      g: '_ing',
      prt: '_en'
    },
    become: {
      prt: '_'
    },
    begin: {
      g: '_ning',
      prt: 'begun',
      pst: 'began'
    },
    being: {
      g: 'are',
      pst: 'were',
      pres: 'are'
    },
    bend: {
      prt: 'bent'
    },
    bet: {
      a: '_ter',
      prt: '_'
    },
    bind: {
      pst: 'bound'
    },
    bite: {
      g: 'biting',
      prt: 'bitten',
      pst: 'bit'
    },
    bleed: {
      pst: 'bled',
      prt: 'bled'
    },
    blow: {
      prt: '_n',
      pst: 'blew'
    },
    boil: {
      a: '_er'
    },
    brake: {
      prt: 'broken'
    },
    "break": {
      pst: 'broke'
    },
    breed: {
      pst: 'bred'
    },
    bring: {
      pst: 'brought',
      prt: 'brought'
    },
    broadcast: {
      pst: '_'
    },
    budget: {
      pst: '_ed'
    },
    build: {
      pst: 'built',
      prt: 'built'
    },
    burn: {
      prt: '_ed'
    },
    burst: {
      prt: '_'
    },
    buy: {
      pst: 'bought',
      prt: 'bought'
    },
    can: {
      a: '',
      fut: '_',
      g: '',
      pst: 'could',
      perf: 'could',
      pluperf: 'could',
      pres: '_'
    },
    "catch": {
      pst: 'caught'
    },
    choose: {
      g: 'choosing',
      prt: 'chosen',
      pst: 'chose'
    },
    cling: {
      prt: 'clung'
    },
    come: {
      prt: '_',
      pst: 'came',
      g: 'coming'
    },
    compete: {
      a: 'competitor',
      g: 'competing',
      pst: '_d'
    },
    cost: {
      pst: '_'
    },
    creep: {
      prt: 'crept'
    },
    cut: {
      prt: '_'
    },
    deal: {
      pst: '_t',
      prt: '_t'
    },
    develop: {
      a: '_er',
      g: '_ing',
      pst: '_ed'
    },
    die: {
      g: 'dying',
      pst: '_d'
    },
    dig: {
      g: '_ging',
      pst: 'dug',
      prt: 'dug'
    },
    dive: {
      prt: '_d'
    },
    "do": {
      pst: 'did',
      pres: '_es'
    },
    draw: {
      prt: '_n',
      pst: 'drew'
    },
    dream: {
      prt: '_t'
    },
    drink: {
      prt: 'drunk',
      pst: 'drank'
    },
    drive: {
      g: 'driving',
      prt: '_n',
      pst: 'drove'
    },
    drop: {
      g: '_ping',
      pst: '_ped'
    },
    eat: {
      a: '_er',
      g: '_ing',
      prt: '_en',
      pst: 'ate'
    },
    edit: {
      pst: '_ed',
      g: '_ing'
    },
    egg: {
      pst: '_ed'
    },
    fall: {
      prt: '_en',
      pst: 'fell'
    },
    feed: {
      prt: 'fed',
      pst: 'fed'
    },
    feel: {
      a: '_er',
      pst: 'felt'
    },
    fight: {
      pst: 'fought',
      prt: 'fought'
    },
    find: {
      pst: 'found'
    },
    flee: {
      g: '_ing',
      prt: 'fled'
    },
    fling: {
      prt: 'flung'
    },
    fly: {
      prt: 'flown',
      pst: 'flew'
    },
    forbid: {
      pst: 'forbade'
    },
    forget: {
      g: '_ing',
      prt: 'forgotten',
      pst: 'forgot'
    },
    forgive: {
      g: 'forgiving',
      prt: '_n',
      pst: 'forgave'
    },
    free: {
      a: '',
      g: '_ing'
    },
    freeze: {
      g: 'freezing',
      prt: 'frozen',
      pst: 'froze'
    },
    get: {
      pst: 'got',
      prt: 'gotten'
    },
    give: {
      g: 'giving',
      prt: '_n',
      pst: 'gave'
    },
    go: {
      prt: '_ne',
      pst: 'went',
      pres: 'goes'
    },
    grow: {
      prt: '_n'
    },
    hang: {
      pst: 'hung',
      prt: 'hung'
    },
    have: {
      g: 'having',
      pst: 'had',
      prt: 'had',
      pres: 'has'
    },
    hear: {
      pst: '_d',
      prt: '_d'
    },
    hide: {
      prt: 'hidden',
      pst: 'hid'
    },
    hit: {
      prt: '_'
    },
    hold: {
      pst: 'held',
      prt: 'held'
    },
    hurt: {
      pst: '_',
      prt: '_'
    },
    ice: {
      g: 'icing',
      pst: '_d'
    },
    imply: {
      pst: 'implied',
      pres: 'implies'
    },
    is: {
      a: '',
      g: 'being',
      pst: 'was',
      pres: '_'
    },
    keep: {
      prt: 'kept'
    },
    kneel: {
      prt: 'knelt'
    },
    know: {
      prt: '_n'
    },
    lay: {
      pst: 'laid',
      prt: 'laid'
    },
    lead: {
      pst: 'led',
      prt: 'led'
    },
    leap: {
      prt: '_t'
    },
    leave: {
      pst: 'left',
      prt: 'left'
    },
    lend: {
      prt: 'lent'
    },
    lie: {
      g: 'lying',
      pst: 'lay'
    },
    light: {
      pst: 'lit',
      prt: 'lit'
    },
    log: {
      g: '_ging',
      pst: '_ged'
    },
    loose: {
      prt: 'lost'
    },
    lose: {
      g: 'losing',
      pst: 'lost'
    },
    make: {
      pst: 'made',
      prt: 'made'
    },
    mean: {
      pst: '_t',
      prt: '_t'
    },
    meet: {
      a: '_er',
      g: '_ing',
      pst: 'met',
      prt: 'met'
    },
    miss: {
      pres: '_'
    },
    name: {
      g: 'naming'
    },
    pay: {
      pst: 'paid',
      prt: 'paid'
    },
    prove: {
      prt: '_n'
    },
    puke: {
      g: 'puking'
    },
    put: {
      prt: '_'
    },
    quit: {
      prt: '_'
    },
    read: {
      pst: '_',
      prt: '_'
    },
    ride: {
      prt: 'ridden'
    },
    ring: {
      pst: 'rang',
      prt: 'rung'
    },
    rise: {
      fut: 'will have _n',
      g: 'rising',
      prt: '_n',
      pst: 'rose',
      pluperf: 'had _n'
    },
    rub: {
      g: '_bing',
      pst: '_bed'
    },
    run: {
      g: '_ning',
      prt: '_',
      pst: 'ran'
    },
    say: {
      pst: 'said',
      prt: 'said',
      pres: '_s'
    },
    seat: {
      pst: 'sat',
      prt: 'sat'
    },
    see: {
      g: '_ing',
      prt: '_n',
      pst: 'saw'
    },
    seek: {
      prt: 'sought'
    },
    sell: {
      pst: 'sold',
      prt: 'sold'
    },
    send: {
      prt: 'sent'
    },
    set: {
      prt: '_'
    },
    sew: {
      prt: '_n'
    },
    shake: {
      prt: '_n'
    },
    shave: {
      prt: '_d'
    },
    shed: {
      g: '_ding',
      pst: '_',
      pres: '_s'
    },
    shine: {
      pst: 'shone',
      prt: 'shone'
    },
    shoot: {
      pst: 'shot',
      prt: 'shot'
    },
    show: {
      pst: '_ed'
    },
    shut: {
      prt: '_'
    },
    sing: {
      prt: 'sung',
      pst: 'sang'
    },
    sink: {
      pst: 'sank',
      pluperf: 'had sunk'
    },
    sit: {
      pst: 'sat'
    },
    ski: {
      pst: '_ied'
    },
    slay: {
      prt: 'slain'
    },
    sleep: {
      prt: 'slept'
    },
    slide: {
      pst: 'slid',
      prt: 'slid'
    },
    smash: {
      pres: '_es'
    },
    sneak: {
      prt: 'snuck'
    },
    speak: {
      fut: 'will have spoken',
      prt: 'spoken',
      pst: 'spoke',
      perf: 'have spoken',
      pluperf: 'had spoken'
    },
    speed: {
      prt: 'sped'
    },
    spend: {
      prt: 'spent'
    },
    spill: {
      prt: '_ed',
      pst: 'spilt'
    },
    spin: {
      g: '_ning',
      pst: 'spun',
      prt: 'spun'
    },
    spit: {
      prt: 'spat'
    },
    split: {
      prt: '_'
    },
    spread: {
      pst: '_'
    },
    spring: {
      prt: 'sprung'
    },
    stand: {
      pst: 'stood'
    },
    steal: {
      a: '_er',
      pst: 'stole'
    },
    stick: {
      pst: 'stuck'
    },
    sting: {
      pst: 'stung'
    },
    stink: {
      pst: 'stunk',
      prt: 'stunk'
    },
    stream: {
      a: '_er'
    },
    strew: {
      prt: '_n'
    },
    strike: {
      g: 'striking',
      pst: 'struck'
    },
    suit: {
      a: '_er',
      g: '_ing',
      pst: '_ed'
    },
    sware: {
      prt: 'sworn'
    },
    swear: {
      pst: 'swore'
    },
    sweep: {
      prt: 'swept'
    },
    swim: {
      g: '_ming',
      pst: 'swam'
    },
    swing: {
      pst: 'swung'
    },
    take: {
      fut: 'will have _n',
      pst: 'took',
      perf: 'have _n',
      pluperf: 'had _n'
    },
    teach: {
      pst: 'taught',
      pres: '_es'
    },
    tear: {
      pst: 'tore'
    },
    tell: {
      pst: 'told'
    },
    think: {
      pst: 'thought'
    },
    thrive: {
      prt: '_d'
    },
    tie: {
      g: 'tying',
      pst: '_d'
    },
    undergo: {
      prt: '_ne'
    },
    understand: {
      pst: 'understood'
    },
    upset: {
      prt: '_'
    },
    wait: {
      a: '_er',
      g: '_ing',
      pst: '_ed'
    },
    wake: {
      pst: 'woke'
    },
    wear: {
      pst: 'wore'
    },
    weave: {
      prt: 'woven'
    },
    wed: {
      pst: 'wed'
    },
    weep: {
      prt: 'wept'
    },
    win: {
      g: '_ning',
      pst: 'won'
    },
    wind: {
      prt: 'wound'
    },
    withdraw: {
      pst: 'withdrew'
    },
    wring: {
      prt: 'wrung'
    },
    write: {
      g: 'writing',
      prt: 'written',
      pst: 'wrote'
    }
  }; //uncompress our ad-hoc compression scheme

  var keys = Object.keys(conjugations);

  var _loop = function _loop(i) {
    var inf = keys[i];
    var _final = {};
    Object.keys(conjugations[inf]).forEach(function (key) {
      var str = conjugations[inf][key]; //swap-in infinitives for '_'

      str = str.replace('_', inf);
      var full = mapping[key];
      _final[full] = str;
    }); //over-write original

    conjugations[inf] = _final;
  };

  for (var i = 0; i < keys.length; i++) {
    _loop(i);
  }

  var conjugations_1 = conjugations;

  var endsWith = {
    b: [{
      reg: /([^aeiou][aeiou])b$/i,
      repl: {
        pr: '$1bs',
        pa: '$1bbed',
        gr: '$1bbing'
      }
    }],
    d: [{
      reg: /(end)$/i,
      repl: {
        pr: '$1s',
        pa: 'ent',
        gr: '$1ing',
        ar: '$1er'
      }
    }, {
      reg: /(eed)$/i,
      repl: {
        pr: '$1s',
        pa: '$1ed',
        gr: '$1ing',
        ar: '$1er'
      }
    }, {
      reg: /(ed)$/i,
      repl: {
        pr: '$1s',
        pa: '$1ded',
        ar: '$1der',
        gr: '$1ding'
      }
    }, {
      reg: /([^aeiou][ou])d$/i,
      repl: {
        pr: '$1ds',
        pa: '$1dded',
        gr: '$1dding'
      }
    }],
    e: [{
      reg: /(eave)$/i,
      repl: {
        pr: '$1s',
        pa: '$1d',
        gr: 'eaving',
        ar: '$1r'
      }
    }, {
      reg: /(ide)$/i,
      repl: {
        pr: '$1s',
        pa: 'ode',
        gr: 'iding',
        ar: 'ider'
      }
    }, {
      //shake
      reg: /(t|sh?)(ake)$/i,
      repl: {
        pr: '$1$2s',
        pa: '$1ook',
        gr: '$1aking',
        ar: '$1$2r'
      }
    }, {
      //awake
      reg: /w(ake)$/i,
      repl: {
        pr: 'w$1s',
        pa: 'woke',
        gr: 'waking',
        ar: 'w$1r'
      }
    }, {
      //make
      reg: /m(ake)$/i,
      repl: {
        pr: 'm$1s',
        pa: 'made',
        gr: 'making',
        ar: 'm$1r'
      }
    }, {
      reg: /(a[tg]|i[zn]|ur|nc|gl|is)e$/i,
      repl: {
        pr: '$1es',
        pa: '$1ed',
        gr: '$1ing' // prt: '$1en',

      }
    }, {
      reg: /([bd]l)e$/i,
      repl: {
        pr: '$1es',
        pa: '$1ed',
        gr: '$1ing'
      }
    }, {
      reg: /(om)e$/i,
      repl: {
        pr: '$1es',
        pa: 'ame',
        gr: '$1ing'
      }
    }],
    g: [{
      reg: /([^aeiou][ou])g$/i,
      repl: {
        pr: '$1gs',
        pa: '$1gged',
        gr: '$1gging'
      }
    }],
    h: [{
      reg: /(..)([cs]h)$/i,
      repl: {
        pr: '$1$2es',
        pa: '$1$2ed',
        gr: '$1$2ing'
      }
    }],
    k: [{
      reg: /(ink)$/i,
      repl: {
        pr: '$1s',
        pa: 'unk',
        gr: '$1ing',
        ar: '$1er'
      }
    }],
    m: [{
      reg: /([^aeiou][aeiou])m$/i,
      repl: {
        pr: '$1ms',
        pa: '$1mmed',
        gr: '$1mming'
      }
    }],
    n: [{
      reg: /(en)$/i,
      repl: {
        pr: '$1s',
        pa: '$1ed',
        gr: '$1ing'
      }
    }],
    p: [{
      reg: /(e)(ep)$/i,
      repl: {
        pr: '$1$2s',
        pa: '$1pt',
        gr: '$1$2ing',
        ar: '$1$2er'
      }
    }, {
      reg: /([^aeiou][aeiou])p$/i,
      repl: {
        pr: '$1ps',
        pa: '$1pped',
        gr: '$1pping'
      }
    }, {
      reg: /([aeiu])p$/i,
      repl: {
        pr: '$1ps',
        pa: '$1p',
        gr: '$1pping'
      }
    }],
    r: [{
      reg: /([td]er)$/i,
      repl: {
        pr: '$1s',
        pa: '$1ed',
        gr: '$1ing'
      }
    }, {
      reg: /(er)$/i,
      repl: {
        pr: '$1s',
        pa: '$1ed',
        gr: '$1ing'
      }
    }],
    s: [{
      reg: /(ish|tch|ess)$/i,
      repl: {
        pr: '$1es',
        pa: '$1ed',
        gr: '$1ing'
      }
    }],
    t: [{
      reg: /(ion|end|e[nc]t)$/i,
      repl: {
        pr: '$1s',
        pa: '$1ed',
        gr: '$1ing'
      }
    }, {
      reg: /(.eat)$/i,
      repl: {
        pr: '$1s',
        pa: '$1ed',
        gr: '$1ing'
      }
    }, {
      reg: /([aeiu])t$/i,
      repl: {
        pr: '$1ts',
        pa: '$1t',
        gr: '$1tting'
      }
    }, {
      reg: /([^aeiou][aeiou])t$/i,
      repl: {
        pr: '$1ts',
        pa: '$1tted',
        gr: '$1tting'
      }
    }],
    w: [{
      reg: /(..)(ow)$/i,
      repl: {
        pr: '$1$2s',
        pa: '$1ew',
        gr: '$1$2ing',
        prt: '$1$2n'
      }
    }],
    y: [{
      reg: /([i|f|rr])y$/i,
      repl: {
        pr: '$1ies',
        pa: '$1ied',
        gr: '$1ying'
      }
    }],
    z: [{
      reg: /([aeiou]zz)$/i,
      repl: {
        pr: '$1es',
        pa: '$1ed',
        gr: '$1ing'
      }
    }]
  };
  var suffixes = endsWith;

  var posMap = {
    pr: 'PresentTense',
    pa: 'PastTense',
    gr: 'Gerund',
    prt: 'Participle',
    ar: 'Actor'
  };

  var doTransform = function doTransform(str, obj) {
    var found = {};
    var keys = Object.keys(obj.repl);

    for (var i = 0; i < keys.length; i += 1) {
      var pos = keys[i];
      found[posMap[pos]] = str.replace(obj.reg, obj.repl[pos]);
    }

    return found;
  }; //look at the end of the word for clues


  var checkSuffix = function checkSuffix() {
    var str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    var c = str[str.length - 1];

    if (suffixes.hasOwnProperty(c) === true) {
      for (var r = 0; r < suffixes[c].length; r += 1) {
        var reg = suffixes[c][r].reg;

        if (reg.test(str) === true) {
          return doTransform(str, suffixes[c][r]);
        }
      }
    }

    return {};
  };

  var _01Suffixes = checkSuffix;

  //non-specifc, 'hail-mary' transforms from infinitive, into other forms
  var hasY = /[bcdfghjklmnpqrstvwxz]y$/;
  var generic = {
    Gerund: function Gerund(inf) {
      if (inf.charAt(inf.length - 1) === 'e') {
        return inf.replace(/e$/, 'ing');
      }

      return inf + 'ing';
    },
    PresentTense: function PresentTense(inf) {
      if (inf.charAt(inf.length - 1) === 's') {
        return inf + 'es';
      }

      if (hasY.test(inf) === true) {
        return inf.slice(0, -1) + 'ies';
      }

      return inf + 's';
    },
    PastTense: function PastTense(inf) {
      if (inf.charAt(inf.length - 1) === 'e') {
        return inf + 'd';
      }

      if (inf.substr(-2) === 'ed') {
        return inf;
      }

      if (hasY.test(inf) === true) {
        return inf.slice(0, -1) + 'ied';
      }

      return inf + 'ed';
    }
  };
  var _02Generic = generic;

  //we assume the input word is a proper infinitive

  var conjugate = function conjugate() {
    var inf = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    var world = arguments.length > 1 ? arguments[1] : undefined;
    var found = {}; // 1. look at irregulars
    //the lexicon doesn't pass this in

    if (world && world.irregulars) {
      if (world.irregulars.verbs.hasOwnProperty(inf) === true) {
        found = Object.assign({}, world.irregulars.verbs[inf]);
      }
    } //2. rule-based regex


    found = Object.assign({}, _01Suffixes(inf), found); //3. generic transformations
    //'buzzing'

    if (found.Gerund === undefined) {
      found.Gerund = _02Generic.Gerund(inf);
    } //'buzzed'


    if (found.PastTense === undefined) {
      found.PastTense = _02Generic.PastTense(inf);
    } //'buzzes'


    if (found.PresentTense === undefined) {
      found.PresentTense = _02Generic.PresentTense(inf);
    }

    return found;
  };

  var conjugate_1 = conjugate; // console.log(conjugate('bake'))

  //turn 'quick' into 'quickest'
  var do_rules = [/ght$/, /nge$/, /ough$/, /ain$/, /uel$/, /[au]ll$/, /ow$/, /oud$/, /...p$/];
  var dont_rules = [/ary$/];
  var irregulars = {
    nice: 'nicest',
    late: 'latest',
    hard: 'hardest',
    inner: 'innermost',
    outer: 'outermost',
    far: 'furthest',
    worse: 'worst',
    bad: 'worst',
    good: 'best',
    big: 'biggest',
    large: 'largest'
  };
  var transforms = [{
    reg: /y$/i,
    repl: 'iest'
  }, {
    reg: /([aeiou])t$/i,
    repl: '$1ttest'
  }, {
    reg: /([aeou])de$/i,
    repl: '$1dest'
  }, {
    reg: /nge$/i,
    repl: 'ngest'
  }, {
    reg: /([aeiou])te$/i,
    repl: '$1test'
  }];

  var to_superlative = function to_superlative(str) {
    //irregulars
    if (irregulars.hasOwnProperty(str)) {
      return irregulars[str];
    } //known transforms


    for (var i = 0; i < transforms.length; i++) {
      if (transforms[i].reg.test(str)) {
        return str.replace(transforms[i].reg, transforms[i].repl);
      }
    } //dont-rules


    for (var _i = 0; _i < dont_rules.length; _i++) {
      if (dont_rules[_i].test(str) === true) {
        return null;
      }
    } //do-rules


    for (var _i2 = 0; _i2 < do_rules.length; _i2++) {
      if (do_rules[_i2].test(str) === true) {
        if (str.charAt(str.length - 1) === 'e') {
          return str + 'st';
        }

        return str + 'est';
      }
    }

    return str + 'est';
  };

  var toSuperlative = to_superlative;

  //turn 'quick' into 'quickly'
  var do_rules$1 = [/ght$/, /nge$/, /ough$/, /ain$/, /uel$/, /[au]ll$/, /ow$/, /old$/, /oud$/, /e[ae]p$/];
  var dont_rules$1 = [/ary$/, /ous$/];
  var irregulars$1 = {
    grey: 'greyer',
    gray: 'grayer',
    green: 'greener',
    yellow: 'yellower',
    red: 'redder',
    good: 'better',
    well: 'better',
    bad: 'worse',
    sad: 'sadder',
    big: 'bigger'
  };
  var transforms$1 = [{
    reg: /y$/i,
    repl: 'ier'
  }, {
    reg: /([aeiou])t$/i,
    repl: '$1tter'
  }, {
    reg: /([aeou])de$/i,
    repl: '$1der'
  }, {
    reg: /nge$/i,
    repl: 'nger'
  }];

  var to_comparative = function to_comparative(str) {
    //known-irregulars
    if (irregulars$1.hasOwnProperty(str)) {
      return irregulars$1[str];
    } //known-transforms


    for (var i = 0; i < transforms$1.length; i++) {
      if (transforms$1[i].reg.test(str) === true) {
        return str.replace(transforms$1[i].reg, transforms$1[i].repl);
      }
    } //dont-patterns


    for (var _i = 0; _i < dont_rules$1.length; _i++) {
      if (dont_rules$1[_i].test(str) === true) {
        return null;
      }
    } //do-patterns


    for (var _i2 = 0; _i2 < do_rules$1.length; _i2++) {
      if (do_rules$1[_i2].test(str) === true) {
        return str + 'er';
      }
    } //easy-one


    if (/e$/.test(str) === true) {
      return str + 'r';
    }

    return str + 'er';
  };

  var toComparative = to_comparative;

  var fns$1 = {
    toSuperlative: toSuperlative,
    toComparative: toComparative
  };
  /** conjugate an adjective into other forms */

  var conjugate$1 = function conjugate(w) {
    var res = {}; // 'greatest'

    var sup = fns$1.toSuperlative(w);

    if (sup) {
      res.Superlative = sup;
    } // 'greater'


    var comp = fns$1.toComparative(w);

    if (comp) {
      res.Comparative = comp;
    }

    return res;
  };

  var adjectives = conjugate$1;

  /** patterns for turning 'bus' to 'buses'*/
  var suffixes$1 = {
    a: [[/(antenn|formul|nebul|vertebr|vit)a$/i, '$1ae'], [/([ti])a$/i, '$1a']],
    e: [[/(kn|l|w)ife$/i, '$1ives'], [/(hive)$/i, '$1s'], [/([m|l])ouse$/i, '$1ice'], [/([m|l])ice$/i, '$1ice']],
    f: [[/^(dwar|handkerchie|hoo|scar|whar)f$/i, '$1ves'], [/^((?:ca|e|ha|(?:our|them|your)?se|she|wo)l|lea|loa|shea|thie)f$/i, '$1ves']],
    i: [[/(octop|vir)i$/i, '$1i']],
    m: [[/([ti])um$/i, '$1a']],
    n: [[/^(oxen)$/i, '$1']],
    o: [[/(al|ad|at|er|et|ed|ad)o$/i, '$1oes']],
    s: [[/(ax|test)is$/i, '$1es'], [/(alias|status)$/i, '$1es'], [/sis$/i, 'ses'], [/(bu)s$/i, '$1ses'], [/(sis)$/i, 'ses'], [/^(?!talis|.*hu)(.*)man$/i, '$1men'], [/(octop|vir|radi|nucle|fung|cact|stimul)us$/i, '$1i']],
    x: [[/(matr|vert|ind|cort)(ix|ex)$/i, '$1ices'], [/^(ox)$/i, '$1en']],
    y: [[/([^aeiouy]|qu)y$/i, '$1ies']],
    z: [[/(quiz)$/i, '$1zes']]
  };
  var _rules = suffixes$1;

  var addE = /(x|ch|sh|s|z)$/;

  var trySuffix = function trySuffix(str) {
    var c = str[str.length - 1];

    if (_rules.hasOwnProperty(c) === true) {
      for (var i = 0; i < _rules[c].length; i += 1) {
        var reg = _rules[c][i][0];

        if (reg.test(str) === true) {
          return str.replace(reg, _rules[c][i][1]);
        }
      }
    }

    return null;
  };
  /** Turn a singular noun into a plural
   * assume the given string is singular
   */


  var pluralize = function pluralize() {
    var str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    var world = arguments.length > 1 ? arguments[1] : undefined;
    var irregulars = world.irregulars.nouns; // check irregulars list

    if (irregulars.hasOwnProperty(str)) {
      return irregulars[str];
    } //we have some rules to try-out


    var plural = trySuffix(str);

    if (plural !== null) {
      return plural;
    } //like 'church'


    if (addE.test(str)) {
      return str + 'es';
    } // ¯\_(ツ)_/¯


    return str + 's';
  };

  var toPlural = pluralize;

  //patterns for turning 'dwarves' to 'dwarf'
  var _rules$1 = [[/([^v])ies$/i, '$1y'], [/ises$/i, 'isis'], [/(kn|[^o]l|w)ives$/i, '$1ife'], [/^((?:ca|e|ha|(?:our|them|your)?se|she|wo)l|lea|loa|shea|thie)ves$/i, '$1f'], [/^(dwar|handkerchie|hoo|scar|whar)ves$/i, '$1f'], [/(antenn|formul|nebul|vertebr|vit)ae$/i, '$1a'], [/(octop|vir|radi|nucle|fung|cact|stimul)(i)$/i, '$1us'], [/(buffal|tomat|tornad)(oes)$/i, '$1o'], // [/(analy|diagno|parenthe|progno|synop|the)ses$/i, '$1sis'],
  [/(eas)es$/i, '$1e'], //diseases
  [/(..[aeiou]s)es$/i, '$1'], //geniouses
  [/(vert|ind|cort)(ices)$/i, '$1ex'], [/(matr|append)(ices)$/i, '$1ix'], [/(x|ch|ss|sh|z|o)es$/i, '$1'], [/men$/i, 'man'], [/(n)ews$/i, '$1ews'], [/([ti])a$/i, '$1um'], [/([^aeiouy]|qu)ies$/i, '$1y'], [/(s)eries$/i, '$1eries'], [/(m)ovies$/i, '$1ovie'], [/([m|l])ice$/i, '$1ouse'], [/(cris|ax|test)es$/i, '$1is'], [/(alias|status)es$/i, '$1'], [/(ss)$/i, '$1'], [/(ics)$/i, '$1'], [/s$/i, '']];

  var invertObj = function invertObj(obj) {
    return Object.keys(obj).reduce(function (h, k) {
      h[obj[k]] = k;
      return h;
    }, {});
  };

  var toSingular = function toSingular(str, world) {
    var irregulars = world.irregulars.nouns;
    var invert = invertObj(irregulars); //(not very efficient)
    // check irregulars list

    if (invert.hasOwnProperty(str)) {
      return invert[str];
    } // go through our regexes


    for (var i = 0; i < _rules$1.length; i++) {
      if (_rules$1[i][0].test(str) === true) {
        str = str.replace(_rules$1[i][0], _rules$1[i][1]);
        return str;
      }
    }

    return str;
  };

  var toSingular_1 = toSingular;

  //rules for turning a verb into infinitive form
  var rules = {
    Participle: [{
      reg: /own$/i,
      to: 'ow'
    }, {
      reg: /(.)un([g|k])$/i,
      to: '$1in$2'
    }],
    Actor: [{
      reg: /(er)er$/i,
      to: '$1'
    }],
    PresentTense: [{
      reg: /(..)(ies)$/i,
      to: '$1y'
    }, {
      reg: /(tch|sh)es$/i,
      to: '$1'
    }, {
      reg: /(ss|zz)es$/i,
      to: '$1'
    }, {
      reg: /([tzlshicgrvdnkmu])es$/i,
      to: '$1e'
    }, {
      reg: /(n[dtk]|c[kt]|[eo]n|i[nl]|er|a[ytrl])s$/i,
      to: '$1'
    }, {
      reg: /(ow)s$/i,
      to: '$1'
    }, {
      reg: /(op)s$/i,
      to: '$1'
    }, {
      reg: /([eirs])ts$/i,
      to: '$1t'
    }, {
      reg: /(ll)s$/i,
      to: '$1'
    }, {
      reg: /(el)s$/i,
      to: '$1'
    }, {
      reg: /(ip)es$/i,
      to: '$1e'
    }, {
      reg: /ss$/i,
      to: 'ss'
    }, {
      reg: /s$/i,
      to: ''
    }],
    Gerund: [{
      //popping -> pop
      reg: /(..)(p|d|t|g){2}ing$/i,
      to: '$1$2'
    }, {
      //fuzzing -> fuzz
      reg: /(ll|ss|zz)ing$/i,
      to: '$1'
    }, {
      reg: /([^aeiou])ying$/i,
      to: '$1y'
    }, {
      reg: /([^ae]i.)ing$/i,
      to: '$1e'
    }, {
      //eating, reading
      reg: /(ea[dklnrtv])ing$/i,
      to: '$1'
    }, {
      //washing -> wash
      reg: /(ch|sh)ing$/i,
      to: '$1'
    }, //soft-e forms:
    {
      //z : hazing (not buzzing)
      reg: /(z)ing$/i,
      to: '$1e'
    }, {
      //a : baking, undulating
      reg: /(a[gdkvtc])ing$/i,
      to: '$1e'
    }, {
      //u : conjuring, tubing
      reg: /(u[rtcbn])ing$/i,
      to: '$1e'
    }, {
      //o : forboding, poking, hoping, boring (not hooping)
      reg: /([^o]o[bdknprv])ing$/i,
      to: '$1e'
    }, {
      //ling : tingling, wrinkling, circling, scrambling, bustling
      reg: /([tbckg]l)ing$/i,
      //dp
      to: '$1e'
    }, {
      //cing : bouncing, denouncing
      reg: /(c|s)ing$/i,
      //dp
      to: '$1e'
    }, // {
    //   //soft-e :
    //   reg: /([ua]s|[dr]g|z|o[rlsp]|cre)ing$/i,
    //   to: '$1e',
    // },
    {
      //fallback
      reg: /(..)ing$/i,
      to: '$1'
    }],
    PastTense: [{
      reg: /(ued)$/i,
      to: 'ue'
    }, {
      reg: /a([^aeiouy])ed$/i,
      to: 'a$1e'
    }, {
      reg: /([aeiou]zz)ed$/i,
      to: '$1'
    }, {
      reg: /(e|i)lled$/i,
      to: '$1ll'
    }, {
      reg: /(.)(sh|ch)ed$/i,
      to: '$1$2'
    }, {
      reg: /(tl|gl)ed$/i,
      to: '$1e'
    }, {
      reg: /(um?pt?)ed$/i,
      to: '$1'
    }, {
      reg: /(ss)ed$/i,
      to: '$1'
    }, {
      reg: /pped$/i,
      to: 'p'
    }, {
      reg: /tted$/i,
      to: 't'
    }, {
      reg: /(..)gged$/i,
      to: '$1g'
    }, {
      reg: /(..)lked$/i,
      to: '$1lk'
    }, {
      reg: /([^aeiouy][aeiou])ked$/i,
      to: '$1ke'
    }, {
      reg: /(.[aeiou])led$/i,
      to: '$1l'
    }, {
      reg: /(..)(h|ion|n[dt]|ai.|[cs]t|pp|all|ss|tt|int|ail|ld|en|oo.|er|k|pp|w|ou.|rt|ght|rm)ed$/i,
      to: '$1$2'
    }, {
      reg: /(.ut)ed$/i,
      to: '$1e'
    }, {
      reg: /(.pt)ed$/i,
      to: '$1'
    }, {
      reg: /(us)ed$/i,
      to: '$1e'
    }, {
      reg: /(dd)ed$/i,
      to: '$1'
    }, {
      reg: /(..[^aeiouy])ed$/i,
      to: '$1e'
    }, {
      reg: /(..)ied$/i,
      to: '$1y'
    }, {
      reg: /(.o)ed$/i,
      to: '$1o'
    }, {
      reg: /(..i)ed$/i,
      to: '$1'
    }, {
      reg: /(.a[^aeiou])ed$/i,
      to: '$1'
    }, {
      //owed, aced
      reg: /([aeiou][^aeiou])ed$/i,
      to: '$1e'
    }, {
      reg: /([rl])ew$/i,
      to: '$1ow'
    }, {
      reg: /([pl])t$/i,
      to: '$1t'
    }]
  };
  var _transform = rules;

  var guessVerb = {
    Gerund: ['ing'],
    Actor: ['erer'],
    Infinitive: ['ate', 'ize', 'tion', 'rify', 'then', 'ress', 'ify', 'age', 'nce', 'ect', 'ise', 'ine', 'ish', 'ace', 'ash', 'ure', 'tch', 'end', 'ack', 'and', 'ute', 'ade', 'ock', 'ite', 'ase', 'ose', 'use', 'ive', 'int', 'nge', 'lay', 'est', 'ain', 'ant', 'ent', 'eed', 'er', 'le', 'own', 'unk', 'ung', 'en'],
    PastTense: ['ed', 'lt', 'nt', 'pt', 'ew', 'ld'],
    PresentTense: ['rks', 'cks', 'nks', 'ngs', 'mps', 'tes', 'zes', 'ers', 'les', 'acks', 'ends', 'ands', 'ocks', 'lays', 'eads', 'lls', 'els', 'ils', 'ows', 'nds', 'ays', 'ams', 'ars', 'ops', 'ffs', 'als', 'urs', 'lds', 'ews', 'ips', 'es', 'ts', 'ns']
  }; //flip it into a lookup object

  guessVerb = Object.keys(guessVerb).reduce(function (h, k) {
    guessVerb[k].forEach(function (a) {
      return h[a] = k;
    });
    return h;
  }, {});
  var _guess = guessVerb;

  /** it helps to know what we're conjugating from */

  var guessTense = function guessTense(str) {
    var three = str.substr(str.length - 3);

    if (_guess.hasOwnProperty(three) === true) {
      return _guess[three];
    }

    var two = str.substr(str.length - 2);

    if (_guess.hasOwnProperty(two) === true) {
      return _guess[two];
    }

    var one = str.substr(str.length - 1);

    if (one === 's') {
      return 'PresentTense';
    }

    return null;
  };

  var toInfinitive = function toInfinitive(str, world, tense) {
    if (!str) {
      return '';
    } //1. look at known irregulars


    if (world.words.hasOwnProperty(str) === true) {
      var irregs = world.irregulars.verbs;
      var keys = Object.keys(irregs);

      for (var i = 0; i < keys.length; i++) {
        var forms = Object.keys(irregs[keys[i]]);

        for (var o = 0; o < forms.length; o++) {
          if (str === irregs[keys[i]][forms[o]]) {
            return keys[i];
          }
        }
      }
    } // give'r!


    tense = tense || guessTense(str);

    if (tense && _transform[tense]) {
      for (var _i = 0; _i < _transform[tense].length; _i++) {
        var rule = _transform[tense][_i];

        if (rule.reg.test(str) === true) {
          // console.log(rule.reg)
          return str.replace(rule.reg, rule.to);
        }
      }
    }

    return str;
  };

  var toInfinitive_1 = toInfinitive;

  var irregulars$2 = {
    nouns: plurals,
    verbs: conjugations_1
  }; //these behaviours are configurable & shared across some plugins

  var transforms$2 = {
    conjugate: conjugate_1,
    adjectives: adjectives,
    toPlural: toPlural,
    toSingular: toSingular_1,
    toInfinitive: toInfinitive_1
  };
  var _isVerbose = false;
  /** all configurable linguistic data */

  var World = /*#__PURE__*/function () {
    function World() {
      _classCallCheck(this, World);

      // quiet these properties from a console.log
      Object.defineProperty(this, 'words', {
        enumerable: false,
        value: misc$1,
        writable: true
      });
      Object.defineProperty(this, 'hasCompound', {
        enumerable: false,
        value: {},
        writable: true
      });
      Object.defineProperty(this, 'irregulars', {
        enumerable: false,
        value: irregulars$2,
        writable: true
      });
      Object.defineProperty(this, 'tags', {
        enumerable: false,
        value: Object.assign({}, tags),
        writable: true
      });
      Object.defineProperty(this, 'transforms', {
        enumerable: false,
        value: transforms$2,
        writable: true
      });
      Object.defineProperty(this, 'taggers', {
        enumerable: false,
        value: [],
        writable: true
      }); // add our compressed data to lexicon

      this.unpackWords(_data); // add our irregulars to lexicon

      this.addIrregulars(); // cache our abbreviations for our sentence-parser

      Object.defineProperty(this, 'cache', {
        enumerable: false,
        value: {
          abbreviations: this.getByTag('Abbreviation')
        }
      });
    }
    /** more logs for debugging */


    _createClass(World, [{
      key: "verbose",
      value: function verbose(bool) {
        _isVerbose = bool;
        return this;
      }
    }, {
      key: "isVerbose",
      value: function isVerbose() {
        return _isVerbose;
      }
      /** get all terms in our lexicon with this tag */

    }, {
      key: "getByTag",
      value: function getByTag(tag) {
        var lex = this.words;
        var res = {};
        var words = Object.keys(lex);

        for (var i = 0; i < words.length; i++) {
          if (typeof lex[words[i]] === 'string') {
            if (lex[words[i]] === tag) {
              res[words[i]] = true;
            }
          } else if (lex[words[i]].some(function (t) {
            return t === tag;
          })) {
            res[words[i]] = true;
          }
        }

        return res;
      }
      /** augment our lingustic data with new data */

    }, {
      key: "unpackWords",
      value: function unpackWords(lex) {
        var tags = Object.keys(lex);

        for (var i = 0; i < tags.length; i++) {
          var words = Object.keys(efrtUnpack_min(lex[tags[i]]));

          for (var w = 0; w < words.length; w++) {
            addWords.addWord(words[w], tags[i], this.words); // do some fancier stuff

            addWords.addMore(words[w], tags[i], this);
          }
        }
      }
      /** put new words into our lexicon, properly */

    }, {
      key: "addWords",
      value: function addWords$1(obj) {
        var keys = Object.keys(obj);

        for (var i = 0; i < keys.length; i++) {
          var word = keys[i].toLowerCase();
          addWords.addWord(word, obj[keys[i]], this.words); // do some fancier stuff

          addWords.addMore(word, obj[keys[i]], this);
        }
      }
    }, {
      key: "addIrregulars",
      value: function addIrregulars() {
        addIrregulars_1(this);

        return this;
      }
      /** extend the compromise tagset */

    }, {
      key: "addTags",
      value: function addTags(tags) {
        tags = Object.assign({}, tags);
        this.tags = Object.assign(this.tags, tags); // calculate graph implications for the new tags

        this.tags = inference(this.tags);
        return this;
      }
      /** call methods after tagger runs */

    }, {
      key: "postProcess",
      value: function postProcess(fn) {
        this.taggers.push(fn);
        return this;
      }
      /** helper method for logging + debugging */

    }, {
      key: "stats",
      value: function stats() {
        return {
          words: Object.keys(this.words).length,
          plurals: Object.keys(this.irregulars.nouns).length,
          conjugations: Object.keys(this.irregulars.verbs).length,
          compounds: Object.keys(this.hasCompound).length,
          postProcessors: this.taggers.length
        };
      }
    }]);

    return World;
  }(); //  ¯\_(:/)_/¯


  var clone$1 = function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  };
  /** produce a deep-copy of all lingustic data */


  World.prototype.clone = function () {
    var w2 = new World(); // these are simple to copy:

    w2.words = Object.assign({}, this.words);
    w2.hasCompound = Object.assign({}, this.hasCompound); //these ones are nested:

    w2.irregulars = clone$1(this.irregulars);
    w2.tags = clone$1(this.tags); // these are functions

    w2.transforms = this.transforms;
    w2.taggers = this.taggers;
    return w2;
  };

  var World_1 = World;

  var _01Utils$1 = createCommonjsModule(function (module, exports) {
    /** return the root, first document */
    exports.all = function () {
      return this.parents()[0] || this;
    };
    /** return the previous result */


    exports.parent = function () {
      if (this.from) {
        return this.from;
      }

      return this;
    };
    /**  return a list of all previous results */


    exports.parents = function (n) {
      var arr = [];

      var addParent = function addParent(doc) {
        if (doc.from) {
          arr.push(doc.from);
          addParent(doc.from);
        }
      };

      addParent(this);
      arr = arr.reverse();

      if (typeof n === 'number') {
        return arr[n];
      }

      return arr;
    };
    /** deep-copy the document, so that no references remain */


    exports.clone = function (doShallow) {
      var list = this.list.map(function (ts) {
        return ts.clone(doShallow);
      });
      var tmp = this.buildFrom(list);
      return tmp;
    };
    /** how many seperate terms does the document have? */


    exports.wordCount = function () {
      return this.list.reduce(function (count, p) {
        count += p.wordCount();
        return count;
      }, 0);
    };

    exports.wordcount = exports.wordCount;
    /** turn on logging for decision-debugging */
    // exports.verbose = function(bool) {
    //   if (bool === undefined) {
    //     bool = true
    //   }
    //   this.world.verbose = bool
    // }
  });

  var _02Accessors = createCommonjsModule(function (module, exports) {
    /** use only the first result(s) */
    exports.first = function (n) {
      if (n === undefined) {
        return this.get(0);
      }

      return this.slice(0, n);
    };
    /** use only the last result(s) */


    exports.last = function (n) {
      if (n === undefined) {
        return this.get(this.list.length - 1);
      }

      var end = this.list.length;
      return this.slice(end - n, end);
    };
    /** grab a given subset of the results*/


    exports.slice = function (start, end) {
      var list = this.list.slice(start, end);
      return this.buildFrom(list);
    };
    /* grab nth result */


    exports.eq = function (n) {
      var p = this.list[n];

      if (p === undefined) {
        return this.buildFrom([]);
      }

      return this.buildFrom([p]);
    };

    exports.get = exports.eq;
    /** grab term[0] for every match */

    exports.firstTerms = function () {
      return this.match('^.');
    };

    exports.firstTerm = exports.firstTerms;
    /** grab the last term for every match  */

    exports.lastTerms = function () {
      return this.match('.$');
    };

    exports.lastTerm = exports.lastTerms;
    /** return a flat array of term objects */

    exports.termList = function (num) {
      var arr = []; //'reduce' but faster

      for (var i = 0; i < this.list.length; i++) {
        var terms = this.list[i].terms();

        for (var o = 0; o < terms.length; o++) {
          arr.push(terms[o]); //support .termList(4)

          if (num !== undefined && arr[num] !== undefined) {
            return arr[num];
          }
        }
      }

      return arr;
    };
    /* grab named capture group terms as object */


    var getGroups = function getGroups(doc) {
      var res = {};
      var allGroups = {};

      var _loop = function _loop(i) {
        var phrase = doc.list[i];
        var groups = Object.keys(phrase.groups).map(function (k) {
          return phrase.groups[k];
        });

        for (var j = 0; j < groups.length; j++) {
          var _groups$j = groups[j],
              group = _groups$j.group,
              start = _groups$j.start,
              length = _groups$j.length;

          if (!allGroups[group]) {
            allGroups[group] = [];
          }

          allGroups[group].push(phrase.buildFrom(start, length));
        }
      };

      for (var i = 0; i < doc.list.length; i++) {
        _loop(i);
      }

      var keys = Object.keys(allGroups);

      for (var _i = 0; _i < keys.length; _i++) {
        var key = keys[_i];
        res[key] = doc.buildFrom(allGroups[key]);
      }

      return res;
    };

    var getOneName = function getOneName(doc, name) {
      var arr = [];

      var _loop2 = function _loop2(i) {
        var phrase = doc.list[i];
        var keys = Object.keys(phrase.groups);
        keys = keys.filter(function (id) {
          return phrase.groups[id].group === name;
        });
        keys.forEach(function (id) {
          arr.push(phrase.buildFrom(phrase.groups[id].start, phrase.groups[id].length));
        });
      };

      for (var i = 0; i < doc.list.length; i++) {
        _loop2(i);
      }

      return doc.buildFrom(arr);
    };
    /** grab named capture group results */


    exports.groups = function (target) {
      if (target === undefined) {
        return getGroups(this);
      }

      if (typeof target === 'number') {
        target = String(target);
      }

      return getOneName(this, target) || this.buildFrom([]);
    };

    exports.group = exports.groups;
    /** get the full-sentence each phrase belongs to */

    exports.sentences = function (n) {
      var arr = [];
      this.list.forEach(function (p) {
        arr.push(p.fullSentence());
      });

      if (typeof n === 'number') {
        return this.buildFrom([arr[n]]);
      }

      return this.buildFrom(arr);
    };

    exports.sentence = exports.sentences;
  });

  // cache the easier conditions up-front
  var cacheRequired = function cacheRequired(reg) {
    var needTags = [];
    var needWords = [];
    reg.forEach(function (obj) {
      if (obj.optional === true || obj.negative === true) {
        return;
      }

      if (obj.tag !== undefined) {
        needTags.push(obj.tag);
      }

      if (obj.word !== undefined) {
        needWords.push(obj.word);
      }
    });
    return {
      tags: needTags,
      words: needWords
    };
  };

  var failFast$1 = function failFast(doc, regs) {
    if (doc._cache && doc._cache.set === true) {
      var _cacheRequired = cacheRequired(regs),
          words = _cacheRequired.words,
          tags = _cacheRequired.tags; //check required words


      for (var i = 0; i < words.length; i++) {
        if (doc._cache.words[words[i]] === undefined) {
          return false;
        }
      } //check required tags


      for (var _i = 0; _i < tags.length; _i++) {
        if (doc._cache.tags[tags[_i]] === undefined) {
          return false;
        }
      }
    }

    return true;
  };

  var checkCache = failFast$1;

  var _03Match = createCommonjsModule(function (module, exports) {
    /** return a new Doc, with this one as a parent */
    exports.match = function (reg, name) {
      //parse-up the input expression
      var regs = syntax_1(reg);

      if (regs.length === 0) {
        return this.buildFrom([]);
      } //check our cache, if it exists


      if (checkCache(this, regs) === false) {
        return this.buildFrom([]);
      } //try expression on each phrase


      var matches = this.list.reduce(function (arr, p) {
        return arr.concat(p.match(regs));
      }, []);

      if (name !== undefined && name !== null && name !== '') {
        return this.buildFrom(matches).groups(name);
      }

      return this.buildFrom(matches);
    };
    /** return all results except for this */


    exports.not = function (reg) {
      //parse-up the input expression
      var regs = syntax_1(reg); //if it's empty, return them all!

      if (regs.length === 0 || checkCache(this, regs) === false) {
        return this;
      } //try expression on each phrase


      var matches = this.list.reduce(function (arr, p) {
        return arr.concat(p.not(regs));
      }, []);
      return this.buildFrom(matches);
    };
    /** return only the first match */


    exports.matchOne = function (reg) {
      var regs = syntax_1(reg); //check our cache, if it exists

      if (checkCache(this, regs) === false) {
        return this.buildFrom([]);
      }

      for (var i = 0; i < this.list.length; i++) {
        var match = this.list[i].match(regs, true);
        return this.buildFrom(match);
      }

      return this.buildFrom([]);
    };
    /** return each current phrase, only if it contains this match */


    exports["if"] = function (reg) {
      var regs = syntax_1(reg); //consult our cache, if it exists

      if (checkCache(this, regs) === false) {
        return this.buildFrom([]);
      }

      var found = this.list.filter(function (p) {
        return p.has(regs) === true;
      });
      return this.buildFrom(found);
    };
    /** Filter-out any current phrases that have this match*/


    exports.ifNo = function (reg) {
      var regs = syntax_1(reg);
      var found = this.list.filter(function (p) {
        return p.has(regs) === false;
      });
      return this.buildFrom(found);
    };
    /**Return a boolean if this match exists */


    exports.has = function (reg) {
      var regs = syntax_1(reg); //consult our cache, if it exists

      if (checkCache(this, regs) === false) {
        return false;
      }

      return this.list.some(function (p) {
        return p.has(regs) === true;
      });
    };
    /** match any terms after our matches, within the sentence */


    exports.lookAhead = function (reg) {
      // find everything afterwards, by default
      if (!reg) {
        reg = '.*';
      }

      var regs = syntax_1(reg);
      var matches = [];
      this.list.forEach(function (p) {
        matches = matches.concat(p.lookAhead(regs));
      });
      matches = matches.filter(function (p) {
        return p;
      });
      return this.buildFrom(matches);
    };

    exports.lookAfter = exports.lookAhead;
    /** match any terms before our matches, within the sentence */

    exports.lookBehind = function (reg) {
      // find everything afterwards, by default
      if (!reg) {
        reg = '.*';
      }

      var regs = syntax_1(reg);
      var matches = [];
      this.list.forEach(function (p) {
        matches = matches.concat(p.lookBehind(regs));
      });
      matches = matches.filter(function (p) {
        return p;
      });
      return this.buildFrom(matches);
    };

    exports.lookBefore = exports.lookBehind;
    /** return all terms before a match, in each phrase */

    exports.before = function (reg) {
      var regs = syntax_1(reg); //only the phrases we care about

      var phrases = this["if"](regs).list;
      var befores = phrases.map(function (p) {
        var ids = p.terms().map(function (t) {
          return t.id;
        }); //run the search again

        var m = p.match(regs)[0];
        var index = ids.indexOf(m.start); //nothing is before a first-term match

        if (index === 0 || index === -1) {
          return null;
        }

        return p.buildFrom(p.start, index);
      });
      befores = befores.filter(function (p) {
        return p !== null;
      });
      return this.buildFrom(befores);
    };
    /** return all terms after a match, in each phrase */


    exports.after = function (reg) {
      var regs = syntax_1(reg); //only the phrases we care about

      var phrases = this["if"](regs).list;
      var befores = phrases.map(function (p) {
        var terms = p.terms();
        var ids = terms.map(function (t) {
          return t.id;
        }); //run the search again

        var m = p.match(regs)[0];
        var index = ids.indexOf(m.start); //skip if nothing is after it

        if (index === -1 || !terms[index + m.length]) {
          return null;
        } //create the new phrase, after our match.


        var id = terms[index + m.length].id;
        var len = p.length - index - m.length;
        return p.buildFrom(id, len);
      });
      befores = befores.filter(function (p) {
        return p !== null;
      });
      return this.buildFrom(befores);
    };
    /** return only results with this match afterwards */


    exports.hasAfter = function (reg) {
      return this.filter(function (doc) {
        return doc.lookAfter(reg).found;
      });
    };
    /** return only results with this match before it */


    exports.hasBefore = function (reg) {
      return this.filter(function (doc) {
        return doc.lookBefore(reg).found;
      });
    };
  });

  /** apply a tag, or tags to all terms */
  var tagTerms = function tagTerms(tag, doc, safe, reason) {
    var tagList = [];

    if (typeof tag === 'string') {
      tagList = tag.split(' ');
    } //do indepenent tags for each term:


    doc.list.forEach(function (p) {
      var terms = p.terms(); // tagSafe - apply only to fitting terms

      if (safe === true) {
        terms = terms.filter(function (t) {
          return t.canBe(tag, doc.world);
        });
      }

      terms.forEach(function (t, i) {
        //fancy version:
        if (tagList.length > 1) {
          if (tagList[i] && tagList[i] !== '.') {
            t.tag(tagList[i], reason, doc.world);
          }
        } else {
          //non-fancy version (same tag for all terms)
          t.tag(tag, reason, doc.world);
        }
      });
    });
    return;
  };

  var _setTag = tagTerms;

  /** Give all terms the given tag */

  var tag$1 = function tag(tags, why) {
    if (!tags) {
      return this;
    }

    _setTag(tags, this, false, why);
    return this;
  };
  /** Only apply tag to terms if it is consistent with current tags */


  var tagSafe$1 = function tagSafe(tags, why) {
    if (!tags) {
      return this;
    }

    _setTag(tags, this, true, why);
    return this;
  };
  /** Remove this term from the given terms */


  var unTag$1 = function unTag(tags, why) {
    var _this = this;

    this.list.forEach(function (p) {
      p.terms().forEach(function (t) {
        return t.unTag(tags, why, _this.world);
      });
    });
    return this;
  };
  /** return only the terms that can be this tag*/


  var canBe$2 = function canBe(tag) {
    if (!tag) {
      return this;
    }

    var world = this.world;
    var matches = this.list.reduce(function (arr, p) {
      return arr.concat(p.canBe(tag, world));
    }, []);
    return this.buildFrom(matches);
  };

  var _04Tag = {
    tag: tag$1,
    tagSafe: tagSafe$1,
    unTag: unTag$1,
    canBe: canBe$2
  };

  /* run each phrase through a function, and create a new document */
  var map = function map(fn) {
    var _this = this;

    if (!fn) {
      return this;
    }

    var list = this.list.map(function (p, i) {
      var doc = _this.buildFrom([p]);

      doc.from = null; //it's not a child/parent

      var res = fn(doc, i); // if its a doc, return one result

      if (res && res.list && res.list[0]) {
        return res.list[0];
      }

      return res;
    }); //remove nulls

    list = list.filter(function (x) {
      return x;
    }); // return an empty response

    if (list.length === 0) {
      return this.buildFrom(list);
    } // if it is not a list of Phrase objects, then don't try to make a Doc object


    if (_typeof(list[0]) !== 'object' || list[0].isA !== 'Phrase') {
      return list;
    }

    return this.buildFrom(list);
  };
  /** run a function on each phrase */


  var forEach = function forEach(fn, detachParent) {
    var _this2 = this;

    if (!fn) {
      return this;
    }

    this.list.forEach(function (p, i) {
      var sub = _this2.buildFrom([p]); // if we're doing fancy insertions, we may want to skip updating the parent each time.


      if (detachParent === true) {
        sub.from = null; //
      }

      fn(sub, i);
    });
    return this;
  };
  /** return only the phrases that return true */


  var filter = function filter(fn) {
    var _this3 = this;

    if (!fn) {
      return this;
    }

    var list = this.list.filter(function (p, i) {
      var doc = _this3.buildFrom([p]);

      doc.from = null; //it's not a child/parent

      return fn(doc, i);
    });
    return this.buildFrom(list);
  };
  /** return a document with only the first phrase that matches */


  var find = function find(fn) {
    var _this4 = this;

    if (!fn) {
      return this;
    }

    var phrase = this.list.find(function (p, i) {
      var doc = _this4.buildFrom([p]);

      doc.from = null; //it's not a child/parent

      return fn(doc, i);
    });

    if (phrase) {
      return this.buildFrom([phrase]);
    }

    return undefined;
  };
  /** return true or false if there is one matching phrase */


  var some = function some(fn) {
    var _this5 = this;

    if (!fn) {
      return this;
    }

    return this.list.some(function (p, i) {
      var doc = _this5.buildFrom([p]);

      doc.from = null; //it's not a child/parent

      return fn(doc, i);
    });
  };
  /** sample a subset of the results */


  var random = function random(n) {
    if (!this.found) {
      return this;
    }

    var r = Math.floor(Math.random() * this.list.length);

    if (n === undefined) {
      var list = [this.list[r]];
      return this.buildFrom(list);
    } //prevent it from going over the end


    if (r + n > this.length) {
      r = this.length - n;
      r = r < 0 ? 0 : r;
    }

    return this.slice(r, r + n);
  };
  /** combine each phrase into a new data-structure */
  // exports.reduce = function(fn, h) {
  //   let list = this.list.reduce((_h, ts) => {
  //     let doc = this.buildFrom([ts])
  //     doc.from = null //it's not a child/parent
  //     return fn(_h, doc)
  //   }, h)
  //   return this.buildFrom(list)
  // }


  var _05Loops = {
    map: map,
    forEach: forEach,
    filter: filter,
    find: find,
    some: some,
    random: random
  };

  // const tokenize = require('../../01-tokenizer/02-words')
  var tokenize = function tokenize(str) {
    return str.split(/[ -]/g);
  }; // take a list of strings
  // look them up in the document


  var buildTree = function buildTree(termList) {
    var values = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    var root = {}; // parse our input

    termList.forEach(function (str, i) {
      var val = true;

      if (values[i] !== undefined) {
        val = values[i];
      } // some rough normalization


      str = (str || '').toLowerCase();
      str = str.replace(/[,;.!?]+$/, '');
      var arr = tokenize(str).map(function (s) {
        return s.trim();
      });
      root[arr[0]] = root[arr[0]] || {};

      if (arr.length === 1) {
        root[arr[0]].value = val;
      } else {
        root[arr[0]].more = root[arr[0]].more || [];
        root[arr[0]].more.push({
          rest: arr.slice(1),
          value: val
        });
      }
    }); // sort by longest-first?
    // console.log(JSON.stringify(root, null, 2))

    return root;
  };

  var fastLookup = function fastLookup(termList, values, doc) {
    var root = buildTree(termList, values);
    var found = []; // each phrase

    var _loop = function _loop(i) {
      var p = doc.list[i];
      var terms = p.terms();
      var words = terms.map(function (t) {
        return t.reduced;
      }); // each word

      var _loop2 = function _loop2(w) {
        if (root[words[w]] !== undefined) {
          // is it a multi-word match?
          if (root[words[w]].more !== undefined) {
            root[words[w]].more.forEach(function (more) {
              // is it too-long?
              if (words[w + more.rest.length] === undefined) {
                return;
              } // compare each subsequent term


              var everyTerm = more.rest.every(function (word, r) {
                return word === words[w + r + 1];
              });

              if (everyTerm === true) {
                found.push({
                  id: p.terms()[w].id,
                  value: more.value,
                  length: more.rest.length + 1
                });
              }
            });
          } // is it a single-word match?


          if (root[words[w]].value !== undefined) {
            found.push({
              id: p.terms()[w].id,
              value: root[words[w]].value,
              length: 1
            });
          }
        }
      };

      for (var w = 0; w < words.length; w++) {
        _loop2(w);
      }
    };

    for (var i = 0; i < doc.list.length; i++) {
      _loop(i);
    }

    return found;
  };

  var _lookup = fastLookup;

  var _06Lookup = createCommonjsModule(function (module, exports) {
    // compare one term and one match
    // const doesMatch = function(term, str) {
    //   if (str === '') {
    //     return false
    //   }
    //   return term.reduced === str || term.implicit === str || term.root === str || term.text.toLowerCase() === str
    // }
    var isObject = function isObject(obj) {
      return obj && Object.prototype.toString.call(obj) === '[object Object]';
    };
    /** lookup an array of words or phrases */


    exports.lookup = function (arr) {
      var _this = this;

      var values = []; //is it a {key:val} object?

      var isObj = isObject(arr);

      if (isObj === true) {
        arr = Object.keys(arr).map(function (k) {
          values.push(arr[k]);
          return k;
        });
      } // support .lookup('foo')


      if (typeof arr === 'string') {
        arr = [arr];
      } //make sure we go fast.


      if (this._cache.set !== true) {
        this.cache();
      }

      var found = _lookup(arr, values, this);
      var p = this.list[0]; // make object response

      if (isObj === true) {
        var byVal = {};
        found.forEach(function (o) {
          byVal[o.value] = byVal[o.value] || [];
          byVal[o.value].push(p.buildFrom(o.id, o.length));
        });
        Object.keys(byVal).forEach(function (k) {
          byVal[k] = _this.buildFrom(byVal[k]);
        });
        return byVal;
      } // otherwise, make array response:


      found = found.map(function (o) {
        return p.buildFrom(o.id, o.length);
      });
      return this.buildFrom(found);
    };

    exports.lookUp = exports.lookup;
  });

  /** freeze the current state of the document, for speed-purposes*/
  var cache$1 = function cache(options) {
    var _this = this;

    options = options || {};
    var words = {};
    var tags = {};
    this._cache.words = words;
    this._cache.tags = tags;
    this._cache.set = true;
    this.list.forEach(function (p, i) {
      p.cache = p.cache || {}; //p.terms get cached automatically

      var terms = p.terms(); // cache all the terms

      terms.forEach(function (t) {
        if (words[t.reduced] && !words.hasOwnProperty(t.reduced)) {
          return; //skip prototype words
        }

        words[t.reduced] = words[t.reduced] || [];
        words[t.reduced].push(i);
        Object.keys(t.tags).forEach(function (tag) {
          tags[tag] = tags[tag] || [];
          tags[tag].push(i);
        }); // cache root-form on Term, too

        if (options.root) {
          t.setRoot(_this.world);
          words[t.root] = true;
        }
      });
    });
    return this;
  };
  /** un-freezes the current state of the document, so it may be transformed */


  var uncache = function uncache() {
    this._cache = {};
    this.list.forEach(function (p) {
      p.cache = {};
    }); // do parents too?

    this.parents().forEach(function (doc) {
      doc._cache = {};
      doc.list.forEach(function (p) {
        p.cache = {};
      });
    });
    return this;
  };

  var _07Cache = {
    cache: cache$1,
    uncache: uncache
  };

  var titleCase$3 = function titleCase(str) {
    return str.charAt(0).toUpperCase() + str.substr(1);
  };
  /** substitute-in new content */


  var replaceWith = function replaceWith(replace) {
    var _this = this;

    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (!replace) {
      return this["delete"]();
    } //support old-style params


    if (options === true) {
      options = {
        keepTags: true
      };
    }

    if (options === false) {
      options = {
        keepTags: false
      };
    }

    options = options || {}; // clear the cache

    this.uncache(); // return this

    this.list.forEach(function (p) {
      var input = replace; // accept a function for replace

      if (typeof replace === 'function') {
        input = replace(p);
      }

      var newPhrases; // accept a Doc object to replace

      if (input && _typeof(input) === 'object' && input.isA === 'Doc') {
        newPhrases = input.list;

        _this.pool().merge(input.pool());
      } else if (typeof input === 'string') {
        //input is a string
        if (options.keepCase !== false && p.terms(0).isTitleCase()) {
          input = titleCase$3(input);
        }

        newPhrases = _01Tokenizer(input, _this.world, _this.pool()); //tag the new phrases

        var tmpDoc = _this.buildFrom(newPhrases);

        tmpDoc.tagger();
        newPhrases = tmpDoc.list;
      } else {
        return; //don't even bother
      } // try to keep its old tags, if appropriate


      if (options.keepTags === true) {
        var oldTags = p.json({
          terms: {
            tags: true
          }
        }).terms;
        newPhrases[0].terms().forEach(function (t, i) {
          if (oldTags[i]) {
            t.tagSafe(oldTags[i].tags, 'keptTag', _this.world);
          }
        });
      }

      p.replace(newPhrases[0], _this); //Oneday: support multi-sentence replacements
    });
    return this;
  };
  /** search and replace match with new content */


  var replace$1 = function replace(match, _replace, options) {
    // if there's no 2nd param, use replaceWith
    if (_replace === undefined) {
      return this.replaceWith(match, options);
    }

    this.match(match).replaceWith(_replace, options);
    return this;
  };

  var _01Replace = {
    replaceWith: replaceWith,
    replace: replace$1
  };

  var _02Insert = createCommonjsModule(function (module, exports) {
    // if it's empty, just create the phrase
    var makeNew = function makeNew(str, doc) {
      var phrase = _01Tokenizer(str, doc.world)[0]; //assume it's one sentence, for now

      var tmpDoc = doc.buildFrom([phrase]);
      tmpDoc.tagger();
      doc.list = tmpDoc.list;
      return doc;
    };
    /** add these new terms to the end*/


    exports.append = function (str) {
      var _this = this;

      if (!str) {
        return this;
      } // if it's empty, just create the phrase


      if (!this.found) {
        return makeNew(str, this);
      } // clear the cache


      this.uncache(); //add it to end of every phrase

      this.list.forEach(function (p) {
        //build it
        var phrase = _01Tokenizer(str, _this.world, _this.pool())[0]; //assume it's one sentence, for now
        //tag it

        var tmpDoc = _this.buildFrom([phrase]);

        tmpDoc.tagger(); // push it onto the end

        p.append(phrase, _this);
      });
      return this;
    };

    exports.insertAfter = exports.append;
    exports.insertAt = exports.append;
    /** add these new terms to the front*/

    exports.prepend = function (str) {
      var _this2 = this;

      if (!str) {
        return this;
      } // if it's empty, just create the phrase


      if (!this.found) {
        return makeNew(str, this);
      } // clear the cache


      this.uncache(); //add it to start of every phrase

      this.list.forEach(function (p) {
        //build it
        var phrase = _01Tokenizer(str, _this2.world, _this2.pool())[0]; //assume it's one sentence, for now
        //tag it

        var tmpDoc = _this2.buildFrom([phrase]);

        tmpDoc.tagger(); // add it to the start

        p.prepend(phrase, _this2);
      });
      return this;
    };

    exports.insertBefore = exports.prepend;
    /** add these new things to the end*/

    exports.concat = function () {
      // clear the cache
      this.uncache();
      var list = this.list.slice(0); //repeat for any number of params

      for (var i = 0; i < arguments.length; i++) {
        var arg = arguments[i]; //support a fresh string

        if (typeof arg === 'string') {
          var arr = _01Tokenizer(arg, this.world); //TODO: phrase.tagger()?

          list = list.concat(arr);
        } else if (arg.isA === 'Doc') {
          list = list.concat(arg.list);
        } else if (arg.isA === 'Phrase') {
          list.push(arg);
        }
      }

      return this.buildFrom(list);
    };
    /** fully remove these terms from the document */


    exports["delete"] = function (match) {
      var _this3 = this;

      // clear the cache
      this.uncache();
      var toRemove = this;

      if (match) {
        toRemove = this.match(match);
      }

      toRemove.list.forEach(function (phrase) {
        return phrase["delete"](_this3);
      });
      return this;
    }; // aliases


    exports.remove = exports["delete"];
  });

  var shouldTrim = {
    clean: true,
    reduced: true,
    root: true
  };
  /** return the document as text */

  var text$1 = function text(options) {
    var _this = this;

    options = options || {}; //are we showing every phrase?

    var showFull = false;

    if (this.parents().length === 0) {
      showFull = true;
    } // cache roots, if necessary


    if (options === 'root' || _typeof(options) === 'object' && options.root) {
      this.list.forEach(function (p) {
        p.terms().forEach(function (t) {
          if (t.root === null) {
            t.setRoot(_this.world);
          }
        });
      });
    }

    var txt = this.list.reduce(function (str, p, i) {
      var trimPre = !showFull && i === 0;
      var trimPost = !showFull && i === _this.list.length - 1;
      return str + p.text(options, trimPre, trimPost);
    }, ''); // clumsy final trim of leading/trailing whitespace

    if (shouldTrim[options] === true || options.reduced === true || options.clean === true || options.root === true) {
      txt = txt.trim();
    }

    return txt;
  };

  var _01Text = {
    text: text$1
  };

  // get all character startings in doc
  var termOffsets = function termOffsets(doc) {
    var elapsed = 0;
    var index = 0;
    var offsets = {};
    doc.termList().forEach(function (term) {
      offsets[term.id] = {
        index: index,
        start: elapsed + term.pre.length,
        length: term.text.length
      };
      elapsed += term.pre.length + term.text.length + term.post.length;
      index += 1;
    });
    return offsets;
  };

  var calcOffset = function calcOffset(doc, result, options) {
    // calculate offsets for each term
    var offsets = termOffsets(doc.all()); // add index values

    if (options.terms.index || options.index) {
      result.forEach(function (o) {
        o.terms.forEach(function (t) {
          t.index = offsets[t.id].index;
        });
        o.index = o.terms[0].index;
      });
    } // add offset values


    if (options.terms.offset || options.offset) {
      result.forEach(function (o) {
        o.terms.forEach(function (t) {
          t.offset = offsets[t.id] || {};
        }); // let len = o.terms.reduce((n, t, i) => {
        //   n += t.offset.length || 0
        //   //add whitespace, too
        //   console.log(t.post)
        //   return n
        // }, 0)
        // The offset information for the entire doc starts at (or just before)
        // the first term, and is as long as the whole text.  The code originally
        // copied the entire offset value from terms[0], but since we're now
        // overriding 2 of the three fields, it's cleaner to just create an all-
        // new object and not pretend it's "just" the same as terms[0].

        o.offset = {
          index: o.terms[0].offset.index,
          start: o.terms[0].offset.start - o.text.indexOf(o.terms[0].text),
          length: o.text.length
        };
      });
    }
  };

  var _offset = calcOffset;

  var _02Json = createCommonjsModule(function (module, exports) {
    var jsonDefaults = {
      text: true,
      terms: true,
      trim: true
    }; //some options have dependents

    var setOptions = function setOptions(options) {
      options = Object.assign({}, jsonDefaults, options);

      if (options.unique) {
        options.reduced = true;
      } //offset calculation requires these options to be on


      if (options.offset) {
        options.text = true;

        if (!options.terms || options.terms === true) {
          options.terms = {};
        }

        options.terms.offset = true;
      }

      if (options.index || options.terms.index) {
        options.terms = options.terms === true ? {} : options.terms;
        options.terms.id = true;
      }

      return options;
    };
    /** pull out desired metadata from the document */


    exports.json = function () {
      var _this = this;

      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      //support json(3) format
      if (typeof options === 'number' && this.list[options]) {
        return this.list[options].json(jsonDefaults);
      }

      options = setOptions(options); // cache root strings beforehand, if necessary

      if (options.root === true) {
        this.list.forEach(function (p) {
          p.terms().forEach(function (t) {
            if (t.root === null) {
              t.setRoot(_this.world);
            }
          });
        });
      }

      var result = this.list.map(function (p) {
        return p.json(options, _this.world);
      }); // add offset and index data for each term

      if (options.terms.offset || options.offset || options.terms.index || options.index) {
        _offset(this, result, options);
      } // add frequency #s


      if (options.frequency || options.freq || options.count) {
        var obj = {};
        this.list.forEach(function (p) {
          var str = p.text('reduced');
          obj[str] = obj[str] || 0;
          obj[str] += 1;
        });
        this.list.forEach(function (p, i) {
          result[i].count = obj[p.text('reduced')];
        });
      } // remove duplicates


      if (options.unique) {
        var already = {};
        result = result.filter(function (o) {
          if (already[o.reduced] === true) {
            return false;
          }

          already[o.reduced] = true;
          return true;
        });
      }

      return result;
    }; //aliases


    exports.data = exports.json;
  });

  var _debug = createCommonjsModule(function (module) {
    // https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
    var reset = '\x1b[0m';

    var padEnd = function padEnd(str, width) {
      str = str.toString();

      while (str.length < width) {
        str += ' ';
      }

      return str;
    };

    function isClientSide() {
      return typeof window !== 'undefined' && window.document;
    } // some nice colors for client-side debug


    var css = {
      green: '#7f9c6c',
      red: '#914045',
      blue: '#6699cc',
      magenta: '#6D5685',
      cyan: '#2D85A8',
      yellow: '#e6d7b3',
      black: '#303b50'
    };

    var logClientSide = function logClientSide(doc) {
      var tagset = doc.world.tags;
      doc.list.forEach(function (p) {
        console.log('\n%c"' + p.text() + '"', 'color: #e6d7b3;');
        var terms = p.terms();
        terms.forEach(function (t) {
          var tags = Object.keys(t.tags);
          var text = t.text || '-';

          if (t.implicit) {
            text = '[' + t.implicit + ']';
          }

          var word = "'" + text + "'";
          word = padEnd(word, 8);
          var found = tags.find(function (tag) {
            return tagset[tag] && tagset[tag].color;
          });
          var color = 'steelblue';

          if (tagset[found]) {
            color = tagset[found].color;
            color = css[color];
          }

          console.log("   ".concat(word, "  -  %c").concat(tags.join(', ')), "color: ".concat(color || 'steelblue', ";"));
        });
      });
    }; //cheaper than requiring chalk


    var cli = {
      green: function green(str) {
        return '\x1b[32m' + str + reset;
      },
      red: function red(str) {
        return '\x1b[31m' + str + reset;
      },
      blue: function blue(str) {
        return '\x1b[34m' + str + reset;
      },
      magenta: function magenta(str) {
        return '\x1b[35m' + str + reset;
      },
      cyan: function cyan(str) {
        return '\x1b[36m' + str + reset;
      },
      yellow: function yellow(str) {
        return '\x1b[33m' + str + reset;
      },
      black: function black(str) {
        return '\x1b[30m' + str + reset;
      }
    };

    var tagString = function tagString(tags, world) {
      tags = tags.map(function (tag) {
        if (!world.tags.hasOwnProperty(tag)) {
          return tag;
        }

        var c = world.tags[tag].color || 'blue';
        return cli[c](tag);
      });
      return tags.join(', ');
    }; //output some helpful stuff to the console


    var debug = function debug(doc) {
      if (isClientSide()) {
        logClientSide(doc);
        return doc;
      }

      console.log(cli.blue('====='));
      doc.list.forEach(function (p) {
        console.log(cli.blue('  -----'));
        var terms = p.terms();
        terms.forEach(function (t) {
          var tags = Object.keys(t.tags);
          var text = t.text || '-';

          if (t.implicit) {
            text = '[' + t.implicit + ']';
          }

          {
            text = cli.yellow(text);
          }

          var word = "'" + text + "'";
          word = padEnd(word, 18);
          var str = cli.blue('  ｜ ') + word + '  - ' + tagString(tags, doc.world);
          console.log(str);
        });
      });
      console.log('');
      return doc;
    };

    module.exports = debug;
  });

  var topk = function topk(doc) {
    var list = doc.json({
      text: false,
      terms: false,
      reduced: true
    }); // combine them

    var obj = {};
    list.forEach(function (o) {
      if (!obj[o.reduced]) {
        o.count = 0;
        obj[o.reduced] = o;
      }

      obj[o.reduced].count += 1;
    });
    var arr = Object.keys(obj).map(function (k) {
      return obj[k];
    }); // sort them

    arr.sort(function (a, b) {
      if (a.count > b.count) {
        return -1;
      } else if (a.count < b.count) {
        return 1;
      }

      return 0;
    });
    return arr;
  };

  var _topk = topk;

  /** pretty-print the current document and its tags */

  var debug_1 = function debug_1() {
    _debug(this);
    return this;
  };
  /** some named output formats */


  var out = function out(method) {
    if (method === 'text') {
      return this.text();
    }

    if (method === 'normal') {
      return this.text('normal');
    }

    if (method === 'json') {
      return this.json();
    }

    if (method === 'offset' || method === 'offsets') {
      return this.json({
        offset: true
      });
    }

    if (method === 'array') {
      return this.json({
        terms: false
      }).map(function (obj) {
        return obj.text;
      });
    }

    if (method === 'freq' || method === 'frequency') {
      return _topk(this);
    }

    if (method === 'terms') {
      var list = [];
      this.json({
        text: false,
        terms: {
          text: true
        }
      }).forEach(function (obj) {
        var terms = obj.terms.map(function (t) {
          return t.text;
        });
        terms = terms.filter(function (t) {
          return t;
        });
        list = list.concat(terms);
      });
      return list;
    }

    if (method === 'tags') {
      return this.list.map(function (p) {
        return p.terms().reduce(function (h, t) {
          h[t.clean || t.implicit] = Object.keys(t.tags);
          return h;
        }, {});
      });
    }

    if (method === 'debug') {
      _debug(this);
      return this;
    }

    return this.text();
  };

  var _03Out = {
    debug: debug_1,
    out: out
  };

  var methods$2 = {
    /** alphabetical order */
    alpha: function alpha(a, b) {
      var left = a.text('clean');
      var right = b.text('clean');

      if (left < right) {
        return -1;
      }

      if (left > right) {
        return 1;
      }

      return 0;
    },

    /** count the # of characters of each match */
    length: function length(a, b) {
      var left = a.text().trim().length;
      var right = b.text().trim().length;

      if (left < right) {
        return 1;
      }

      if (left > right) {
        return -1;
      }

      return 0;
    },

    /** count the # of terms in each match */
    wordCount: function wordCount(a, b) {
      var left = a.wordCount();
      var right = b.wordCount();

      if (left < right) {
        return 1;
      }

      if (left > right) {
        return -1;
      }

      return 0;
    }
  };
  /** sort by # of duplicates in the document*/

  var byFreq = function byFreq(doc) {
    var counts = {};
    var options = {
      "case": true,
      punctuation: false,
      whitespace: true,
      unicode: true
    };
    doc.list.forEach(function (p) {
      var str = p.text(options);
      counts[str] = counts[str] || 0;
      counts[str] += 1;
    }); // sort by freq

    doc.list.sort(function (a, b) {
      var left = counts[a.text(options)];
      var right = counts[b.text(options)];

      if (left < right) {
        return 1;
      }

      if (left > right) {
        return -1;
      }

      return 0;
    });
    return doc;
  }; // order results 'chronologically', or document-order


  var sortSequential = function sortSequential(doc) {
    var order = {};
    doc.json({
      terms: {
        offset: true
      }
    }).forEach(function (o) {
      order[o.terms[0].id] = o.terms[0].offset.start;
    });
    doc.list = doc.list.sort(function (a, b) {
      if (order[a.start] > order[b.start]) {
        return 1;
      } else if (order[a.start] < order[b.start]) {
        return -1;
      }

      return 0;
    });
    return doc;
  }; //aliases


  methods$2.alphabetical = methods$2.alpha;
  methods$2.wordcount = methods$2.wordCount; // aliases for sequential ordering

  var seqNames = {
    index: true,
    sequence: true,
    seq: true,
    sequential: true,
    chron: true,
    chronological: true
  };
  /** re-arrange the order of the matches (in place) */

  var sort = function sort(input) {
    input = input || 'alpha'; //do this one up-front

    if (input === 'freq' || input === 'frequency' || input === 'topk') {
      return byFreq(this);
    }

    if (seqNames.hasOwnProperty(input)) {
      return sortSequential(this);
    }

    input = methods$2[input] || input; // apply sort method on each phrase

    if (typeof input === 'function') {
      this.list = this.list.sort(input);
      return this;
    }

    return this;
  };
  /** reverse the order of the matches, but not the words */


  var reverse = function reverse() {
    var list = [].concat(this.list);
    list = list.reverse();
    return this.buildFrom(list);
  };
  /** remove any duplicate matches */


  var unique$4 = function unique() {
    var list = [].concat(this.list);
    var obj = {};
    list = list.filter(function (p) {
      var str = p.text('reduced').trim();

      if (obj.hasOwnProperty(str) === true) {
        return false;
      }

      obj[str] = true;
      return true;
    });
    return this.buildFrom(list);
  };

  var _01Sort = {
    sort: sort,
    reverse: reverse,
    unique: unique$4
  };

  var isPunct = /[\[\]{}⟨⟩:,،、‒–—―…‹›«»‐\-;\/⁄·*\•^†‡°¡¿※№÷×ºª%‰=‱¶§~|‖¦©℗®℠™¤₳฿]/g;
  var quotes = /['‘’“”"′″‴]+/g;
  var methods$3 = {
    // cleanup newlines and extra spaces
    whitespace: function whitespace(doc) {
      var termArr = doc.list.map(function (ts) {
        return ts.terms();
      });
      termArr.forEach(function (terms, o) {
        terms.forEach(function (t, i) {
          // keep dashes between words
          if (t.hasDash() === true) {
            t.post = ' - ';
            return;
          } // remove existing spaces


          t.pre = t.pre.replace(/\s/g, '');
          t.post = t.post.replace(/\s/g, ''); //last word? ensure there's a next sentence.

          if (terms.length - 1 === i && !termArr[o + 1]) {
            return;
          } // no extra spaces for contractions


          if (t.implicit && Boolean(t.text) === true) {
            return;
          } // no extra spaces for hyphenated words


          if (t.hasHyphen() === true) {
            return;
          }

          t.post += ' ';
        });
      });
    },
    punctuation: function punctuation(termList) {
      termList.forEach(function (t) {
        // space between hyphenated words
        if (t.hasHyphen() === true) {
          t.post = ' ';
        }

        t.pre = t.pre.replace(isPunct, '');
        t.post = t.post.replace(isPunct, ''); // elipses

        t.post = t.post.replace(/\.\.\./, ''); // only allow one exclamation

        if (/!/.test(t.post) === true) {
          t.post = t.post.replace(/!/g, '');
          t.post = '!' + t.post;
        } // only allow one question mark


        if (/\?/.test(t.post) === true) {
          t.post = t.post.replace(/[\?!]*/, '');
          t.post = '?' + t.post;
        }
      });
    },
    unicode: function unicode(termList) {
      termList.forEach(function (t) {
        if (t.isImplicit() === true) {
          return;
        }

        t.text = unicode_1(t.text);
      });
    },
    quotations: function quotations(termList) {
      termList.forEach(function (t) {
        t.post = t.post.replace(quotes, '');
        t.pre = t.pre.replace(quotes, '');
      });
    },
    adverbs: function adverbs(doc) {
      doc.match('#Adverb').not('(not|nary|seldom|never|barely|almost|basically|so)').remove();
    },
    // remove the '.' from 'Mrs.' (safely)
    abbreviations: function abbreviations(doc) {
      doc.list.forEach(function (ts) {
        var terms = ts.terms();
        terms.forEach(function (t, i) {
          if (t.tags.Abbreviation === true && terms[i + 1]) {
            t.post = t.post.replace(/^\./, '');
          }
        });
      });
    }
  };
  var _methods = methods$3;

  var defaults = {
    // light
    whitespace: true,
    unicode: true,
    punctuation: true,
    emoji: true,
    acronyms: true,
    abbreviations: true,
    // medium
    "case": false,
    contractions: false,
    parentheses: false,
    quotations: false,
    adverbs: false,
    // heavy (loose legibility)
    possessives: false,
    verbs: false,
    nouns: false,
    honorifics: false // pronouns: true,

  };
  var mapping$1 = {
    light: {},
    medium: {
      "case": true,
      contractions: true,
      parentheses: true,
      quotations: true,
      adverbs: true
    }
  };
  mapping$1.heavy = Object.assign({}, mapping$1.medium, {
    possessives: true,
    verbs: true,
    nouns: true,
    honorifics: true
  });
  /** common ways to clean-up the document, and reduce noise */

  var normalize = function normalize(options) {
    options = options || {}; // support named forms

    if (typeof options === 'string') {
      options = mapping$1[options] || {};
    } // set defaults


    options = Object.assign({}, defaults, options); // clear the cache

    this.uncache();
    var termList = this.termList(); // lowercase things

    if (options["case"]) {
      this.toLowerCase();
    } //whitespace


    if (options.whitespace) {
      _methods.whitespace(this);
    } // unicode: é -> e


    if (options.unicode) {
      _methods.unicode(termList);
    } //punctuation - keep sentence punctation, quotes, parenths


    if (options.punctuation) {
      _methods.punctuation(termList);
    } // remove ':)'


    if (options.emoji) {
      this.remove('(#Emoji|#Emoticon)');
    } // 'f.b.i.' -> 'FBI'


    if (options.acronyms) {
      this.acronyms().strip(); // .toUpperCase()
    } // remove period from abbreviations


    if (options.abbreviations) {
      _methods.abbreviations(this);
    } // --Medium methods--
    // `isn't` -> 'is not'


    if (options.contraction || options.contractions) {
      this.contractions().expand();
    } // '(word)' -> 'word'


    if (options.parentheses) {
      this.parentheses().unwrap();
    } // remove "" punctuation


    if (options.quotations || options.quotes) {
      _methods.quotations(termList);
    } // remove any un-necessary adverbs


    if (options.adverbs) {
      _methods.adverbs(this);
    } // --Heavy methods--
    // `cory hart's -> cory hart'


    if (options.possessive || options.possessives) {
      this.possessives().strip();
    } // 'he walked' -> 'he walk'


    if (options.verbs) {
      this.verbs().toInfinitive();
    } // 'three dogs' -> 'three dog'


    if (options.nouns || options.plurals) {
      this.nouns().toSingular();
    } // remove 'Mr.' from 'Mr John Smith'


    if (options.honorifics) {
      this.remove('#Honorific');
    }

    return this;
  };

  var _02Normalize = {
    normalize: normalize
  };

  var _03Split = createCommonjsModule(function (module, exports) {
    /** return a Document with three parts for every match
     * seperate everything before the word, as a new phrase
     */
    exports.splitOn = function (reg) {
      // if there's no match, split parent, instead
      if (!reg) {
        var parent = this.parent();
        return parent.splitOn(this);
      } //start looking for a match..


      var regs = syntax_1(reg);
      var matches = [];
      this.list.forEach(function (p) {
        var foundEm = p.match(regs); //no match here, add full sentence

        if (foundEm.length === 0) {
          matches.push(p);
          return;
        } // we found something here.


        var carry = p;
        foundEm.forEach(function (found) {
          var parts = carry.splitOn(found); // add em in

          if (parts.before) {
            matches.push(parts.before);
          }

          if (parts.match) {
            matches.push(parts.match);
          } // start matching now on the end


          carry = parts.after;
        }); // add that last part

        if (carry) {
          matches.push(carry);
        }
      });
      return this.buildFrom(matches);
    };
    /** return a Document with two parts for every match
     * seperate everything after the word, as a new phrase
     */


    exports.splitAfter = function (reg) {
      // if there's no match, split parent, instead
      if (!reg) {
        var parent = this.parent();
        return parent.splitAfter(this);
      } // start looking for our matches


      var regs = syntax_1(reg);
      var matches = [];
      this.list.forEach(function (p) {
        var foundEm = p.match(regs); //no match here, add full sentence

        if (foundEm.length === 0) {
          matches.push(p);
          return;
        } // we found something here.


        var carry = p;
        foundEm.forEach(function (found) {
          var parts = carry.splitOn(found); // add em in

          if (parts.before && parts.match) {
            // merge these two together
            parts.before.length += parts.match.length;
            matches.push(parts.before);
          } else if (parts.match) {
            matches.push(parts.match);
          } // start matching now on the end


          carry = parts.after;
        }); // add that last part

        if (carry) {
          matches.push(carry);
        }
      });
      return this.buildFrom(matches);
    };

    exports.split = exports.splitAfter; //i guess?

    /** return a Document with two parts for every match */

    exports.splitBefore = function (reg) {
      // if there's no match, split parent, instead
      if (!reg) {
        var parent = this.parent();
        return parent.splitBefore(this);
      } //start looking for a match..


      var regs = syntax_1(reg);
      var matches = [];
      this.list.forEach(function (p) {
        var foundEm = p.match(regs); //no match here, add full sentence

        if (foundEm.length === 0) {
          matches.push(p);
          return;
        } // we found something here.


        var carry = p;
        foundEm.forEach(function (found) {
          var parts = carry.splitOn(found); // add before part in

          if (parts.before) {
            matches.push(parts.before);
          } // merge match+after


          if (parts.match && parts.after) {
            parts.match.length += parts.after.length;
          } // start matching now on the end


          carry = parts.match;
        }); // add that last part

        if (carry) {
          matches.push(carry);
        }
      });
      return this.buildFrom(matches);
    };
    /** split a document into labeled sections */


    exports.segment = function (regs, options) {
      regs = regs || {};
      options = options || {
        text: true
      };
      var doc = this;
      var keys = Object.keys(regs); // split em

      keys.forEach(function (k) {
        doc = doc.splitOn(k);
      }); //add labels for each section

      doc.list.forEach(function (p) {
        for (var i = 0; i < keys.length; i += 1) {
          if (p.has(keys[i])) {
            p.segment = regs[keys[i]];
            return;
          }
        }
      });
      return doc.list.map(function (p) {
        var res = p.json(options);
        res.segment = p.segment || null;
        return res;
      });
    };
  });

  var eachTerm = function eachTerm(doc, fn) {
    var world = doc.world;
    doc.list.forEach(function (p) {
      p.terms().forEach(function (t) {
        return t[fn](world);
      });
    });
    return doc;
  };
  /** turn every letter of every term to lower-cse */


  var toLowerCase = function toLowerCase() {
    return eachTerm(this, 'toLowerCase');
  };
  /** turn every letter of every term to upper case */


  var toUpperCase = function toUpperCase() {
    return eachTerm(this, 'toUpperCase');
  };
  /** upper-case the first letter of each term */


  var toTitleCase = function toTitleCase() {
    return eachTerm(this, 'toTitleCase');
  };
  /** remove whitespace and title-case each term */


  var toCamelCase = function toCamelCase() {
    this.list.forEach(function (p) {
      //remove whitespace
      var terms = p.terms();
      terms.forEach(function (t, i) {
        if (i !== 0) {
          t.toTitleCase();
        }

        if (i !== terms.length - 1) {
          t.post = '';
        }
      });
    }); // this.tag('#CamelCase', 'toCamelCase')

    return this;
  };

  var _04Case = {
    toLowerCase: toLowerCase,
    toUpperCase: toUpperCase,
    toTitleCase: toTitleCase,
    toCamelCase: toCamelCase
  };

  var _05Whitespace = createCommonjsModule(function (module, exports) {
    /** add this punctuation or whitespace before each match: */
    exports.pre = function (str, concat) {
      if (str === undefined) {
        return this.list[0].terms(0).pre;
      }

      this.list.forEach(function (p) {
        var term = p.terms(0);

        if (concat === true) {
          term.pre += str;
        } else {
          term.pre = str;
        }
      });
      return this;
    };
    /** add this punctuation or whitespace after each match: */


    exports.post = function (str, concat) {
      // return array of post strings
      if (str === undefined) {
        return this.list.map(function (p) {
          var terms = p.terms();
          var term = terms[terms.length - 1];
          return term.post;
        });
      } // set post string on all ends


      this.list.forEach(function (p) {
        var terms = p.terms();
        var term = terms[terms.length - 1];

        if (concat === true) {
          term.post += str;
        } else {
          term.post = str;
        }
      });
      return this;
    };
    /** remove start and end whitespace */


    exports.trim = function () {
      this.list = this.list.map(function (p) {
        return p.trim();
      });
      return this;
    };
    /** connect words with hyphen, and remove whitespace */


    exports.hyphenate = function () {
      this.list.forEach(function (p) {
        var terms = p.terms(); //remove whitespace

        terms.forEach(function (t, i) {
          if (i !== 0) {
            t.pre = '';
          }

          if (terms[i + 1]) {
            t.post = '-';
          }
        });
      });
      return this;
    };
    /** remove hyphens between words, and set whitespace */


    exports.dehyphenate = function () {
      var hasHyphen = /(-|–|—)/;
      this.list.forEach(function (p) {
        var terms = p.terms(); //remove whitespace

        terms.forEach(function (t) {
          if (hasHyphen.test(t.post)) {
            t.post = ' ';
          }
        });
      });
      return this;
    };

    exports.deHyphenate = exports.dehyphenate;
    /** add quotations around these matches */

    exports.toQuotations = function (start, end) {
      start = start || "\"";
      end = end || "\"";
      this.list.forEach(function (p) {
        var terms = p.terms();
        terms[0].pre = start + terms[0].pre;
        var last = terms[terms.length - 1];
        last.post = end + last.post;
      });
      return this;
    };

    exports.toQuotation = exports.toQuotations;
    /** add brackets around these matches */

    exports.toParentheses = function (start, end) {
      start = start || "(";
      end = end || ")";
      this.list.forEach(function (p) {
        var terms = p.terms();
        terms[0].pre = start + terms[0].pre;
        var last = terms[terms.length - 1];
        last.post = end + last.post;
      });
      return this;
    };
  });

  /** make all phrases into one phrase */
  var join = function join(str) {
    // clear the cache
    this.uncache(); // make one large phrase - 'main'

    var main = this.list[0];
    var before = main.length;
    var removed = {};

    for (var i = 1; i < this.list.length; i++) {
      var p = this.list[i];
      removed[p.start] = true;
      var term = main.lastTerm(); // add whitespace between them

      if (str) {
        term.post += str;
      } //  main -> p


      term.next = p.start; // main <- p

      p.terms(0).prev = term.id;
      main.length += p.length;
      main.cache = {};
    } // parents are bigger than than their children.
    // when we increase a child, we increase their parent too.


    var increase = main.length - before;
    this.parents().forEach(function (doc) {
      // increase length on each effected phrase
      doc.list.forEach(function (p) {
        var terms = p.terms();

        for (var _i = 0; _i < terms.length; _i++) {
          if (terms[_i].id === main.start) {
            p.length += increase;
            break;
          }
        }

        p.cache = {};
      }); // remove redundant phrases now

      doc.list = doc.list.filter(function (p) {
        return removed[p.start] !== true;
      });
    }); // return one major phrase

    return this.buildFrom([main]);
  };

  var _06Join = {
    join: join
  };

  var postPunct = /[,\)"';:\-–—\.…]/; // const irregulars = {
  //   'will not': `won't`,
  //   'i am': `i'm`,
  // }

  var setContraction = function setContraction(m, suffix) {
    if (!m.found) {
      return;
    }

    var terms = m.termList(); //avoid any problematic punctuation

    for (var i = 0; i < terms.length - 1; i++) {
      var t = terms[i];

      if (postPunct.test(t.post)) {
        return;
      }
    } // set them as implict


    terms.forEach(function (t) {
      t.implicit = t.clean;
    }); // perform the contraction

    terms[0].text += suffix; // clean-up the others

    terms.slice(1).forEach(function (t) {
      t.text = '';
    });

    for (var _i = 0; _i < terms.length - 1; _i++) {
      var _t = terms[_i];
      _t.post = _t.post.replace(/ /, '');
    }
  };
  /** turn 'i am' into i'm */


  var contract = function contract() {
    var doc = this.not('@hasContraction'); // we are -> we're

    var m = doc.match('(we|they|you) are');
    setContraction(m, "'re"); // they will -> they'll

    m = doc.match('(he|she|they|it|we|you) will');
    setContraction(m, "'ll"); // she is -> she's

    m = doc.match('(he|she|they|it|we) is');
    setContraction(m, "'s"); // spencer is -> spencer's

    m = doc.match('#Person is');
    setContraction(m, "'s"); // spencer would -> spencer'd

    m = doc.match('#Person would');
    setContraction(m, "'d"); // would not -> wouldn't

    m = doc.match('(is|was|had|would|should|could|do|does|have|has|can) not');
    setContraction(m, "n't"); // i have -> i've

    m = doc.match('(i|we|they) have');
    setContraction(m, "'ve"); // would have -> would've

    m = doc.match('(would|should|could) have');
    setContraction(m, "'ve"); // i am -> i'm

    m = doc.match('i am');
    setContraction(m, "'m"); // going to -> gonna

    m = doc.match('going to');
    return this;
  };

  var _07Contract = {
    contract: contract
  };

  var methods$4 = Object.assign({}, _01Utils$1, _02Accessors, _03Match, _04Tag, _05Loops, _06Lookup, _07Cache, _01Replace, _02Insert, _01Text, _02Json, _03Out, _01Sort, _02Normalize, _03Split, _04Case, _05Whitespace, _06Join, _07Contract);

  var methods$5 = {}; // allow helper methods like .adjectives() and .adverbs()

  var arr = [['terms', '.'], ['hyphenated', '@hasHyphen .'], ['adjectives', '#Adjective'], ['hashTags', '#HashTag'], ['emails', '#Email'], ['emoji', '#Emoji'], ['emoticons', '#Emoticon'], ['atMentions', '#AtMention'], ['urls', '#Url'], ['adverbs', '#Adverb'], ['pronouns', '#Pronoun'], ['conjunctions', '#Conjunction'], ['prepositions', '#Preposition']];
  arr.forEach(function (a) {
    methods$5[a[0]] = function (n) {
      var m = this.match(a[1]);

      if (typeof n === 'number') {
        m = m.get(n);
      }

      return m;
    };
  }); // aliases

  methods$5.emojis = methods$5.emoji;
  methods$5.atmentions = methods$5.atMentions;
  methods$5.words = methods$5.terms;
  /** return anything tagged as a phone number */

  methods$5.phoneNumbers = function (n) {
    var m = this.splitAfter('@hasComma');
    m = m.match('#PhoneNumber+');

    if (typeof n === 'number') {
      m = m.get(n);
    }

    return m;
  };
  /** Deprecated: please use compromise-numbers plugin */


  methods$5.money = function (n) {
    var m = this.match('#Money #Currency?');

    if (typeof n === 'number') {
      m = m.get(n);
    }

    return m;
  };
  /** return all cities, countries, addresses, and regions */


  methods$5.places = function (n) {
    // don't split 'paris, france'
    var keep = this.match('(#City && @hasComma) (#Region|#Country)'); // but split the other commas

    var m = this.not(keep).splitAfter('@hasComma'); // combine them back together

    m = m.concat(keep);
    m.sort('index');
    m = m.match('#Place+');

    if (typeof n === 'number') {
      m = m.get(n);
    }

    return m;
  };
  /** return all schools, businesses and institutions */


  methods$5.organizations = function (n) {
    var m = this.clauses();
    m = m.match('#Organization+');

    if (typeof n === 'number') {
      m = m.get(n);
    }

    return m;
  }; //combine them with .topics() method


  methods$5.entities = function (n) {
    var r = this.clauses(); // Find people, places, and organizations

    var yup = r.people();
    yup = yup.concat(r.places());
    yup = yup.concat(r.organizations());
    var ignore = ['someone', 'man', 'woman', 'mother', 'brother', 'sister', 'father'];
    yup = yup.not(ignore); //return them to normal ordering

    yup.sort('sequence'); // yup.unique() //? not sure

    if (typeof n === 'number') {
      yup = yup.get(n);
    }

    return yup;
  }; //aliases


  methods$5.things = methods$5.entities;
  methods$5.topics = methods$5.entities;
  var _simple = methods$5;

  var underOver = /^(under|over)-?/;
  /** match a word-sequence, like 'super bowl' in the lexicon */

  var tryMultiple = function tryMultiple(terms, t, world) {
    var lex = world.words; //try a two-word version

    var txt = terms[t].reduced + ' ' + terms[t + 1].reduced;

    if (lex[txt] !== undefined && lex.hasOwnProperty(txt) === true) {
      terms[t].tag(lex[txt], 'lexicon-two', world);
      terms[t + 1].tag(lex[txt], 'lexicon-two', world);
      return 1;
    } //try a three-word version?


    if (t + 2 < terms.length) {
      txt += ' ' + terms[t + 2].reduced;

      if (lex[txt] !== undefined && lex.hasOwnProperty(txt) === true) {
        terms[t].tag(lex[txt], 'lexicon-three', world);
        terms[t + 1].tag(lex[txt], 'lexicon-three', world);
        terms[t + 2].tag(lex[txt], 'lexicon-three', world);
        return 2;
      }
    } //try a four-word version?


    if (t + 3 < terms.length) {
      txt += ' ' + terms[t + 3].reduced;

      if (lex[txt] !== undefined && lex.hasOwnProperty(txt) === true) {
        terms[t].tag(lex[txt], 'lexicon-four', world);
        terms[t + 1].tag(lex[txt], 'lexicon-four', world);
        terms[t + 2].tag(lex[txt], 'lexicon-four', world);
        terms[t + 3].tag(lex[txt], 'lexicon-four', world);
        return 3;
      }
    }

    return 0;
  };
  /** look at each word in our list of known-words */


  var checkLexicon = function checkLexicon(terms, world) {
    var lex = world.words;
    var hasCompound = world.hasCompound; // use reduced?
    //go through each term, and check the lexicon

    for (var t = 0; t < terms.length; t += 1) {
      var str = terms[t].clean; //is it the start of a compound word, like 'super bowl'?

      if (hasCompound[str] === true && t + 1 < terms.length) {
        var foundWords = tryMultiple(terms, t, world);

        if (foundWords > 0) {
          t += foundWords; //skip any already-found words

          continue;
        }
      } //try one-word lexicon


      if (lex[str] !== undefined && lex.hasOwnProperty(str) === true) {
        terms[t].tag(lex[str], 'lexicon', world);
        continue;
      } // look at reduced version of term, too


      if (str !== terms[t].reduced && lex.hasOwnProperty(terms[t].reduced) === true) {
        terms[t].tag(lex[terms[t].reduced], 'lexicon', world);
        continue;
      } // prefix strip: try to match 'take' for 'undertake'


      if (underOver.test(str) === true) {
        var noPrefix = str.replace(underOver, '');

        if (lex.hasOwnProperty(noPrefix) === true) {
          terms[t].tag(lex[noPrefix], 'noprefix-lexicon', world);
        }
      }
    }

    return terms;
  };

  var _01Lexicon = checkLexicon;

  var apostrophes = /[\'‘’‛‵′`´]$/;
  var perSec = /^(m|k|cm|km|m)\/(s|h|hr)$/; // '5 k/m'
  //

  var checkPunctuation = function checkPunctuation(terms, i, world) {
    var term = terms[i]; //check hyphenation
    // if (term.post.indexOf('-') !== -1 && terms[i + 1] && terms[i + 1].pre === '') {
    //   term.tag('Hyphenated', 'has-hyphen', world)
    // }
    // support 'head-over'
    // if (term.hasHyphen() === true) {
    //   console.log(term.tags)
    // }
    // console.log(term.hasHyphen(), term.text)
    //an end-tick (trailing apostrophe) - flanders', or Carlos'

    if (apostrophes.test(term.text)) {
      if (!apostrophes.test(term.pre) && !apostrophes.test(term.post) && term.clean.length > 2) {
        var endChar = term.clean[term.clean.length - 2]; //flanders'

        if (endChar === 's') {
          term.tag(['Possessive', 'Noun'], 'end-tick', world);
          return;
        } //chillin'


        if (endChar === 'n') {
          term.tag(['Gerund'], 'chillin', world);
        }
      }
    } // '5 km/s'


    if (perSec.test(term.text)) {
      term.tag('Unit', 'per-sec', world);
    } // 'NASA' is, but not 'i REALLY love it.'
    // if (term.tags.Noun === true && isAcronym(term, world)) {
    //   term.tag('Acronym', 'acronym-step', world)
    //   term.tag('Noun', 'acronym-infer', world)
    // } else if (!oneLetterWord.hasOwnProperty(term.text) && oneLetterAcronym.test(term.text)) {
    //   term.tag('Acronym', 'one-letter-acronym', world)
    //   term.tag('Noun', 'one-letter-infer', world)
    // }

  };

  var _02Punctuation$1 = checkPunctuation;

  //these are regexes applied to t.text, instead of t.clean
  // order matters.
  var startsWith = [//web tags
  [/^[\w\.]+@[\w\.]+\.[a-z]{2,3}$/, 'Email'], //not fancy
  [/^#[a-z0-9_\u00C0-\u00FF]{2,}$/, 'HashTag'], [/^@\w{2,}$/, 'AtMention'], [/^(https?:\/\/|www\.)\w+\.[a-z]{2,3}/, 'Url'], //with http/www
  [/^[\w./]+\.(com|net|gov|org|ly|edu|info|biz|ru|jp|de|in|uk|br)/, 'Url'], //http://mostpopularwebsites.net/top-level-domain
  //dates/times
  [/^[012]?[0-9](:[0-5][0-9])(:[0-5][0-9])$/, 'Time'], //4:32:32
  [/^[012]?[0-9](:[0-5][0-9])?(:[0-5][0-9])? ?(am|pm)$/, 'Time'], //4pm
  [/^[012]?[0-9](:[0-5][0-9])(:[0-5][0-9])? ?(am|pm)?$/, 'Time'], //4:00pm
  [/^[PMCE]ST$/, 'Time'], //PST, time zone abbrevs
  [/^utc ?[+-]?[0-9]+?$/, 'Time'], //UTC 8+
  [/^[a-z0-9]*? o\'?clock$/, 'Time'], //3 oclock
  [/^[0-9]{1,4}-[0-9]{1,2}-[0-9]{1,4}$/, 'Date'], // 03-02-89
  [/^[0-9]{1,4}\/[0-9]{1,2}\/[0-9]{1,4}$/, 'Date'], // 03/02/89
  [/^[0-9]{1,4}-[a-z]{2,9}-[0-9]{1,4}$/i, 'Date'], // 03-March-89
  //names
  [/^ma?c\'.*/, 'LastName'], //mc'adams
  [/^o\'[drlkn].*/, 'LastName'], //o'douggan
  [/^ma?cd[aeiou]/, 'LastName'], //macdonell - Last patterns https://en.wikipedia.org/wiki/List_of_family_name_affixes
  //slang things
  [/^(lol)+[sz]$/, 'Expression'], //lol
  [/^woo+a*?h?$/, 'Expression'], //whoaa, wooo
  [/^(un|de|re)\\-[a-z\u00C0-\u00FF]{2}/, 'Verb'], // [/^(over|under)[a-z]{2,}/, 'Adjective'],
  [/^[0-9]{1,4}\.[0-9]{1,2}\.[0-9]{1,4}$/, 'Date'], // 03-02-89
  //phone numbers
  [/^[0-9]{3}-[0-9]{4}$/, 'PhoneNumber'], //589-3809
  [/^(\+?[0-9][ -])?[0-9]{3}[ -]?[0-9]{3}-[0-9]{4}$/, 'PhoneNumber'], //632-589-3809
  //money
  // currency regex
  // /[\$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BD\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6]
  //like $5.30
  [/^[-+]?[\$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BD\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6][-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?(k|m|b|bn)?\+?$/, ['Money', 'Value']], //like 5.30$
  [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?[\$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BD\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6]\+?$/, ['Money', 'Value']], //like 400usd
  [/^[-+]?[0-9]([0-9,.])+?(usd|eur|jpy|gbp|cad|aud|chf|cny|hkd|nzd|kr|rub)$/i, ['Money', 'Value']], //numbers
  // 50 | -50 | 3.23  | 5,999.0  | 10+
  [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?\+?$/, ['Cardinal', 'NumericValue']], [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?(st|nd|rd|th)$/, ['Ordinal', 'NumericValue']], // .73th
  [/^\.[0-9]+\+?$/, ['Cardinal', 'NumericValue']], //percent
  [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?%\+?$/, ['Percent', 'Cardinal', 'NumericValue']], //7%  ..
  [/^\.[0-9]+%$/, ['Percent', 'Cardinal', 'NumericValue']], //.7%  ..
  //fraction
  [/^[0-9]{1,4}\/[0-9]{1,4}$/, 'Fraction'], //3/2ths
  //range
  [/^[0-9.]{1,2}[-–][0-9]{1,2}$/, ['Value', 'NumberRange']], //7-8
  [/^[0-9.]{1,3}(st|nd|rd|th)?[-–][0-9\.]{1,3}(st|nd|rd|th)?$/, 'NumberRange'], //5-7
  //with unit
  [/^[0-9.]+([a-z]{1,4})$/, 'Value'] //like 5tbsp
  //ordinal
  // [/^[0-9][0-9,.]*(st|nd|rd|r?th)$/, ['NumericValue', 'Ordinal']], //like 5th
  // [/^[0-9]+(st|nd|rd|th)$/, 'Ordinal'], //like 5th
  ];

  var romanNumeral = /^[IVXLCDM]{2,}$/;
  var romanNumValid = /^M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/; //  https://stackoverflow.com/a/267405/168877
  //try each of the ^regexes in our list

  var checkRegex = function checkRegex(term, world) {
    var str = term.text; // do them all!

    for (var r = 0; r < startsWith.length; r += 1) {
      if (startsWith[r][0].test(str) === true) {
        term.tagSafe(startsWith[r][1], 'prefix #' + r, world);
        break;
      }
    } // do some more!
    //roman numberals - XVII


    if (term.text.length >= 2 && romanNumeral.test(str) && romanNumValid.test(str)) {
      term.tag('RomanNumeral', 'xvii', world);
    }
  };

  var _03Prefixes = checkRegex;

  //regex suffix patterns and their most common parts of speech,
  //built using wordnet, by spencer kelly.
  //this mapping shrinks-down the uglified build
  var Adj = 'Adjective';
  var Inf = 'Infinitive';
  var Pres = 'PresentTense';
  var Sing = 'Singular';
  var Past = 'PastTense';
  var Adverb = 'Adverb';
  var Exp = 'Expression';
  var Actor = 'Actor';
  var Verb = 'Verb';
  var Noun = 'Noun';
  var Last = 'LastName'; //the order here matters.
  //regexes indexed by mandated last-character

  var endsWith$1 = {
    a: [[/.[aeiou]na$/, Noun], [/.[oau][wvl]ska$/, Last], //polish (female)
    [/.[^aeiou]ica$/, Sing], [/^([hyj]a)+$/, Exp] //hahah
    ],
    c: [[/.[^aeiou]ic$/, Adj]],
    d: [//==-ed==
    //double-consonant
    [/[aeiou](pp|ll|ss|ff|gg|tt|rr|bb|nn|mm)ed$/, Past], //popped, planned
    //double-vowel
    [/.[aeo]{2}[bdgmnprvz]ed$/, Past], //beeped, mooned, veered
    //-hed
    [/.[aeiou][sg]hed$/, Past], //stashed, sighed
    //-rd
    [/.[aeiou]red$/, Past], //stored
    [/.[aeiou]r?ried$/, Past], //buried
    //-led
    [/.[bcdgtr]led$/, Past], //startled, rumbled
    [/.[aoui]f?led$/, Past], //impaled, stifled
    //-sed
    [/.[iao]sed$/, Past], //franchised
    [/[aeiou]n?[cs]ed$/, Past], //laced, lanced
    //-med
    [/[aeiou][rl]?[mnf]ed$/, Past], //warmed, attained, engulfed
    //-ked
    [/[aeiou][ns]?c?ked$/, Past], //hooked, masked
    //-ged
    [/[aeiou][nl]?ged$/, Past], //engaged
    //-ted
    [/.[tdbwxz]ed$/, Past], //bribed, boxed
    [/[^aeiou][aeiou][tvx]ed$/, Past], //boxed
    //-ied
    [/.[cdlmnprstv]ied$/, Past], //rallied
    [/[^aeiou]ard$/, Sing], //card
    [/[aeiou][^aeiou]id$/, Adj], [/.[vrl]id$/, Adj]],
    e: [[/.[lnr]ize$/, Inf], [/.[^aeiou]ise$/, Inf], [/.[aeiou]te$/, Inf], [/.[^aeiou][ai]ble$/, Adj], [/.[^aeiou]eable$/, Adj], [/.[ts]ive$/, Adj]],
    h: [[/.[^aeiouf]ish$/, Adj], [/.v[iy]ch$/, Last], //east-europe
    [/^ug?h+$/, Exp], //uhh
    [/^uh[ -]?oh$/, Exp] //uhoh
    ],
    i: [[/.[oau][wvl]ski$/, Last] //polish (male)
    ],
    k: [[/^(k){2}$/, Exp] //kkkk
    ],
    l: [[/.[gl]ial$/, Adj], [/.[^aeiou]ful$/, Adj], [/.[nrtumcd]al$/, Adj], [/.[^aeiou][ei]al$/, Adj]],
    m: [[/.[^aeiou]ium$/, Sing], [/[^aeiou]ism$/, Sing], [/^h*u*m+$/, Exp], //mmmmmmm / ummmm / huuuuuummmmmm
    [/^\d+ ?[ap]m$/, 'Date']],
    n: [[/.[lsrnpb]ian$/, Adj], [/[^aeiou]ician$/, Actor], [/[aeiou][ktrp]in$/, 'Gerund'] // 'cookin', 'hootin'
    ],
    o: [[/^no+$/, Exp], //noooo
    [/^(yo)+$/, Exp], //yoyo
    [/^woo+[pt]?$/, Exp] //woo
    ],
    r: [[/.[bdfklmst]ler$/, 'Noun'], [/.[ilk]er$/, 'Comparative'], [/[aeiou][pns]er$/, Sing], [/[^i]fer$/, Inf], [/.[^aeiou][ao]pher$/, Actor]],
    t: [[/.[di]est$/, 'Superlative'], [/.[icldtgrv]ent$/, Adj], [/[aeiou].*ist$/, Adj], [/^[a-z]et$/, Verb]],
    s: [[/.[^aeiou]ises$/, Pres], [/.[rln]ates$/, Pres], [/.[^z]ens$/, Verb], [/.[lstrn]us$/, Sing], [/.[aeiou]sks$/, Pres], //masks
    [/.[aeiou]kes$/, Pres], //bakes
    [/[aeiou][^aeiou]is$/, Sing], [/[a-z]\'s$/, Noun], [/^yes+$/, Exp] //yessss
    ],
    v: [[/.[^aeiou][ai][kln]ov$/, Last] //east-europe
    ],
    y: [[/.[cts]hy$/, Adj], [/.[st]ty$/, Adj], [/.[gk]y$/, Adj], [/.[tnl]ary$/, Adj], [/.[oe]ry$/, Sing], [/[rdntkbhs]ly$/, Adverb], [/...lly$/, Adverb], [/[bszmp]{2}y$/, Adj], [/.(gg|bb|zz)ly$/, Adj], [/.[aeiou]my$/, Adj], [/[ea]{2}zy$/, Adj], [/.[^aeiou]ity$/, Sing]]
  };

  //just a foolish lookup of known suffixes
  var Adj$1 = 'Adjective';
  var Inf$1 = 'Infinitive';
  var Pres$1 = 'PresentTense';
  var Sing$1 = 'Singular';
  var Past$1 = 'PastTense';
  var Avb = 'Adverb';
  var Plrl = 'Plural';
  var Actor$1 = 'Actor';
  var Vb = 'Verb';
  var Noun$1 = 'Noun';
  var Last$1 = 'LastName';
  var Modal = 'Modal';
  var Place = 'Place'; // find any issues - https://observablehq.com/@spencermountain/suffix-word-lookup

  var suffixMap = [null, //0
  null, //1
  {
    //2-letter
    ea: Sing$1,
    ia: Noun$1,
    ic: Adj$1,
    ly: Avb,
    "'n": Vb,
    "'t": Vb
  }, {
    //3-letter
    oed: Past$1,
    ued: Past$1,
    xed: Past$1,
    ' so': Avb,
    "'ll": Modal,
    "'re": 'Copula',
    azy: Adj$1,
    end: Vb,
    ped: Past$1,
    ffy: Adj$1,
    ify: Inf$1,
    ing: 'Gerund',
    //likely to be converted to Adj after lexicon pass
    ize: Inf$1,
    lar: Adj$1,
    mum: Adj$1,
    nes: Pres$1,
    nny: Adj$1,
    oid: Adj$1,
    ous: Adj$1,
    que: Adj$1,
    rmy: Adj$1,
    rol: Sing$1,
    sis: Sing$1,
    zes: Pres$1
  }, {
    //4-letter
    amed: Past$1,
    aped: Past$1,
    ched: Past$1,
    lked: Past$1,
    nded: Past$1,
    cted: Past$1,
    dged: Past$1,
    akis: Last$1,
    //greek
    cede: Inf$1,
    chuk: Last$1,
    //east-europe
    czyk: Last$1,
    //polish (male)
    ects: Pres$1,
    ends: Vb,
    enko: Last$1,
    //east-europe
    ette: Sing$1,
    fies: Pres$1,
    fore: Avb,
    gate: Inf$1,
    gone: Adj$1,
    ices: Plrl,
    ints: Plrl,
    ines: Plrl,
    ions: Plrl,
    less: Avb,
    llen: Adj$1,
    made: Adj$1,
    nsen: Last$1,
    //norway
    oses: Pres$1,
    ould: Modal,
    some: Adj$1,
    sson: Last$1,
    //swedish male
    tage: Inf$1,
    teen: 'Value',
    tion: Sing$1,
    tive: Adj$1,
    tors: Noun$1,
    vice: Sing$1
  }, {
    //5-letter
    tized: Past$1,
    urned: Past$1,
    eased: Past$1,
    ances: Plrl,
    bound: Adj$1,
    ettes: Plrl,
    fully: Avb,
    ishes: Pres$1,
    ities: Plrl,
    marek: Last$1,
    //polish (male)
    nssen: Last$1,
    //norway
    ology: Noun$1,
    ports: Plrl,
    rough: Adj$1,
    tches: Pres$1,
    tieth: 'Ordinal',
    tures: Plrl,
    wards: Avb,
    where: Avb
  }, {
    //6-letter
    auskas: Last$1,
    //lithuania
    keeper: Actor$1,
    logist: Actor$1,
    teenth: 'Value'
  }, {
    //7-letter
    opoulos: Last$1,
    //greek
    borough: Place,
    //Hillsborough
    sdottir: Last$1 //swedish female

  }];

  var endRegexs = function endRegexs(term, world) {
    var str = term.clean;
    var _char = str[str.length - 1];

    if (endsWith$1.hasOwnProperty(_char) === true) {
      var regs = endsWith$1[_char];

      for (var r = 0; r < regs.length; r += 1) {
        if (regs[r][0].test(str) === true) {
          term.tagSafe(regs[r][1], "endReg ".concat(_char, " #").concat(r), world);
          break;
        }
      }
    }
  }; //sweep-through all suffixes


  var knownSuffixes = function knownSuffixes(term, world) {
    var len = term.clean.length;
    var max = 7;

    if (len <= max) {
      max = len - 1;
    }

    for (var i = max; i > 1; i -= 1) {
      var str = term.clean.substr(len - i, len);

      if (suffixMap[str.length].hasOwnProperty(str) === true) {
        var tag = suffixMap[str.length][str];
        term.tagSafe(tag, 'suffix -' + str, world);
        break;
      }
    }
  }; //all-the-way-down!


  var checkRegex$1 = function checkRegex(term, world) {
    knownSuffixes(term, world);
    endRegexs(term, world);
  };

  var _04Suffixes = checkRegex$1;

  //just some of the most common emoticons
  //faster than
  //http://stackoverflow.com/questions/28077049/regex-matching-emoticons
  var emoticons = {
    ':(': true,
    ':)': true,
    ':P': true,
    ':p': true,
    ':O': true,
    ':3': true,
    ':|': true,
    ':/': true,
    ':\\': true,
    ':$': true,
    ':*': true,
    ':@': true,
    ':-(': true,
    ':-)': true,
    ':-P': true,
    ':-p': true,
    ':-O': true,
    ':-3': true,
    ':-|': true,
    ':-/': true,
    ':-\\': true,
    ':-$': true,
    ':-*': true,
    ':-@': true,
    ':^(': true,
    ':^)': true,
    ':^P': true,
    ':^p': true,
    ':^O': true,
    ':^3': true,
    ':^|': true,
    ':^/': true,
    ':^\\': true,
    ':^$': true,
    ':^*': true,
    ':^@': true,
    '):': true,
    '(:': true,
    '$:': true,
    '*:': true,
    ')-:': true,
    '(-:': true,
    '$-:': true,
    '*-:': true,
    ')^:': true,
    '(^:': true,
    '$^:': true,
    '*^:': true,
    '<3': true,
    '</3': true,
    '<\\3': true
  };

  var emojiReg = /^(\u00a9|\u00ae|[\u2319-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/; //for us, there's three types -
  // * ;) - emoticons
  // * 🌵 - unicode emoji
  // * :smiling_face: - asci-represented emoji
  //test for forms like ':woman_tone2:‍:ear_of_rice:'
  //https://github.com/Kikobeats/emojis-keywords/blob/master/index.js

  var isCommaEmoji = function isCommaEmoji(raw) {
    if (raw.charAt(0) === ':') {
      //end comma can be last or second-last ':haircut_tone3:‍♀️'
      if (raw.match(/:.?$/) === null) {
        return false;
      } //ensure no spaces


      if (raw.match(' ')) {
        return false;
      } //reasonably sized


      if (raw.length > 35) {
        return false;
      }

      return true;
    }

    return false;
  }; //check against emoticon whitelist


  var isEmoticon = function isEmoticon(str) {
    str = str.replace(/^[:;]/, ':'); //normalize the 'eyes'

    return emoticons.hasOwnProperty(str);
  };

  var tagEmoji = function tagEmoji(term, world) {
    var raw = term.pre + term.text + term.post;
    raw = raw.trim(); //dont double-up on ending periods

    raw = raw.replace(/[.!?,]$/, ''); //test for :keyword: emojis

    if (isCommaEmoji(raw) === true) {
      term.tag('Emoji', 'comma-emoji', world);
      term.text = raw;
      term.pre = term.pre.replace(':', '');
      term.post = term.post.replace(':', '');
    } //test for unicode emojis


    if (term.text.match(emojiReg)) {
      term.tag('Emoji', 'unicode-emoji', world);
      term.text = raw;
    } //test for emoticon ':)' emojis


    if (isEmoticon(raw) === true) {
      term.tag('Emoticon', 'emoticon-emoji', world);
      term.text = raw;
    }
  };

  var _05Emoji = tagEmoji;

  var steps = {
    lexicon: _01Lexicon,
    punctuation: _02Punctuation$1,
    regex: _03Prefixes,
    suffix: _04Suffixes,
    emoji: _05Emoji
  }; //'lookups' look at a term by itself

  var lookups = function lookups(doc, terms) {
    var world = doc.world; //our list of known-words

    steps.lexicon(terms, world); //try these other methods

    for (var i = 0; i < terms.length; i += 1) {
      var term = terms[i]; //or maybe some helpful punctuation

      steps.punctuation(terms, i, world); //mostly prefix checks

      steps.regex(term, world); //maybe we can guess

      steps.suffix(term, world); //emoji and emoticons

      steps.emoji(term, world);
    }

    return doc;
  };

  var _01Init = lookups;

  //markov-like stats about co-occurance, for hints about unknown terms
  //basically, a little-bit better than the noun-fallback
  //just top n-grams from nlp tags, generated from nlp-corpus
  //after this word, here's what happens usually
  var afterThisWord = {
    i: 'Verb',
    //44% //i walk..
    first: 'Noun',
    //50% //first principles..
    it: 'Verb',
    //33%
    there: 'Verb',
    //35%
    not: 'Verb',
    //33%
    because: 'Noun',
    //31%
    "if": 'Noun',
    //32%
    but: 'Noun',
    //26%
    who: 'Verb',
    //40%
    "this": 'Noun',
    //37%
    his: 'Noun',
    //48%
    when: 'Noun',
    //33%
    you: 'Verb',
    //35%
    very: 'Adjective',
    // 39%
    old: 'Noun',
    //51%
    never: 'Verb',
    //42%
    before: 'Noun' //28%

  }; //in advance of this word, this is what happens usually

  var beforeThisWord = {
    there: 'Verb',
    //23% // be there
    me: 'Verb',
    //31% //see me
    man: 'Adjective',
    // 80% //quiet man
    only: 'Verb',
    //27% //sees only
    him: 'Verb',
    //32% //show him
    were: 'Noun',
    //48% //we were
    took: 'Noun',
    //38% //he took
    himself: 'Verb',
    //31% //see himself
    went: 'Noun',
    //43% //he went
    who: 'Noun',
    //47% //person who
    jr: 'Person'
  }; //following this POS, this is likely

  var afterThisPOS = {
    Adjective: 'Noun',
    //36% //blue dress
    Possessive: 'Noun',
    //41% //his song
    Determiner: 'Noun',
    //47%
    Adverb: 'Verb',
    //20%
    Pronoun: 'Verb',
    //40%
    Value: 'Noun',
    //47%
    Ordinal: 'Noun',
    //53%
    Modal: 'Verb',
    //35%
    Superlative: 'Noun',
    //43%
    Demonym: 'Noun',
    //38%
    Honorific: 'Person' //

  }; //in advance of this POS, this is likely

  var beforeThisPOS = {
    Copula: 'Noun',
    //44% //spencer is
    PastTense: 'Noun',
    //33% //spencer walked
    Conjunction: 'Noun',
    //36%
    Modal: 'Noun',
    //38%
    Pluperfect: 'Noun',
    //40%
    PerfectTense: 'Verb' //32%

  };
  var markov = {
    beforeThisWord: beforeThisWord,
    afterThisWord: afterThisWord,
    beforeThisPos: beforeThisPOS,
    afterThisPos: afterThisPOS
  };

  var afterKeys = Object.keys(markov.afterThisPos);
  var beforeKeys = Object.keys(markov.beforeThisPos);

  var checkNeighbours = function checkNeighbours(terms, world) {
    var _loop = function _loop(i) {
      var term = terms[i]; //do we still need a tag?

      if (term.isKnown() === true) {
        return "continue";
      } //ok, this term needs a tag.
      //look at previous word for clues..


      var lastTerm = terms[i - 1];

      if (lastTerm) {
        // 'foobar term'
        if (markov.afterThisWord.hasOwnProperty(lastTerm.clean) === true) {
          var tag = markov.afterThisWord[lastTerm.clean];
          term.tag(tag, 'after-' + lastTerm.clean, world);
          return "continue";
        } // 'Tag term'
        // (look at previous POS tags for clues..)


        var foundTag = afterKeys.find(function (tag) {
          return lastTerm.tags[tag];
        });

        if (foundTag !== undefined) {
          var _tag = markov.afterThisPos[foundTag];
          term.tag(_tag, 'after-' + foundTag, world);
          return "continue";
        }
      } //look at next word for clues..


      var nextTerm = terms[i + 1];

      if (nextTerm) {
        // 'term foobar'
        if (markov.beforeThisWord.hasOwnProperty(nextTerm.clean) === true) {
          var _tag2 = markov.beforeThisWord[nextTerm.clean];
          term.tag(_tag2, 'before-' + nextTerm.clean, world);
          return "continue";
        } // 'term Tag'
        // (look at next POS tags for clues..)


        var _foundTag = beforeKeys.find(function (tag) {
          return nextTerm.tags[tag];
        });

        if (_foundTag !== undefined) {
          var _tag3 = markov.beforeThisPos[_foundTag];
          term.tag(_tag3, 'before-' + _foundTag, world);
          return "continue";
        }
      }
    };

    for (var i = 0; i < terms.length; i += 1) {
      var _ret = _loop(i);

      if (_ret === "continue") continue;
    }
  };

  var _01Neighbours = checkNeighbours;

  var titleCase$4 = /^[A-Z][a-z'\u00C0-\u00FF]/;
  var hasNumber = /[0-9]/;
  /** look for any grammar signals based on capital/lowercase */

  var checkCase = function checkCase(doc) {
    var world = doc.world;
    doc.list.forEach(function (p) {
      var terms = p.terms();

      for (var i = 1; i < terms.length; i++) {
        var term = terms[i];

        if (titleCase$4.test(term.text) === true && hasNumber.test(term.text) === false) {
          term.tag('ProperNoun', 'titlecase-noun', world);
        }
      }
    });
  };

  var _02Case = checkCase;

  var hasPrefix = /^(re|un)-?[a-z\u00C0-\u00FF]/;
  var prefix = /^(re|un)-?/;
  /** check 'rewatch' in lexicon as 'watch' */

  var checkPrefix = function checkPrefix(terms, world) {
    var lex = world.words;
    terms.forEach(function (term) {
      // skip if we have a good tag already
      if (term.isKnown() === true) {
        return;
      } //does it start with 'un|re'


      if (hasPrefix.test(term.clean) === true) {
        // look for the root word in the lexicon:
        var stem = term.clean.replace(prefix, '');

        if (stem && stem.length > 3 && lex[stem] !== undefined && lex.hasOwnProperty(stem) === true) {
          term.tag(lex[stem], 'stem-' + stem, world);
        }
      }
    });
  };

  var _03Stem = checkPrefix;

  //similar to plural/singularize rules, but not the same
  var isPlural = [/(^v)ies$/i, /ises$/i, /ives$/i, /(antenn|formul|nebul|vertebr|vit)ae$/i, /(octop|vir|radi|nucle|fung|cact|stimul)i$/i, /(buffal|tomat|tornad)oes$/i, /(analy|ba|diagno|parenthe|progno|synop|the)ses$/i, /(vert|ind|cort)ices$/i, /(matr|append)ices$/i, /(x|ch|ss|sh|s|z|o)es$/i, /is$/i, /men$/i, /news$/i, /.tia$/i, /(^f)ves$/i, /(lr)ves$/i, /(^aeiouy|qu)ies$/i, /(m|l)ice$/i, /(cris|ax|test)es$/i, /(alias|status)es$/i, /ics$/i]; //similar to plural/singularize rules, but not the same

  var isSingular = [/(ax|test)is$/i, /(octop|vir|radi|nucle|fung|cact|stimul)us$/i, /(octop|vir)i$/i, /(rl)f$/i, /(alias|status)$/i, /(bu)s$/i, /(al|ad|at|er|et|ed|ad)o$/i, /(ti)um$/i, /(ti)a$/i, /sis$/i, /(?:(^f)fe|(lr)f)$/i, /hive$/i, /s[aeiou]+ns$/i, // sans, siens
  /(^aeiouy|qu)y$/i, /(x|ch|ss|sh|z)$/i, /(matr|vert|ind|cort)(ix|ex)$/i, /(m|l)ouse$/i, /(m|l)ice$/i, /(antenn|formul|nebul|vertebr|vit)a$/i, /.sis$/i, /^(?!talis|.*hu)(.*)man$/i];
  var isPlural_1 = {
    isSingular: isSingular,
    isPlural: isPlural
  };

  var noPlurals = ['Uncountable', 'Pronoun', 'Place', 'Value', 'Person', 'Month', 'WeekDay', 'Holiday'];
  var notPlural = [/ss$/, /sis$/, /[^aeiou][uo]s$/, /'s$/];
  var notSingular = [/i$/, /ae$/];
  /** turn nouns into singular/plural */

  var checkPlural = function checkPlural(t, world) {
    if (t.tags.Noun && !t.tags.Acronym) {
      var str = t.clean; //skip existing tags, fast

      if (t.tags.Singular || t.tags.Plural) {
        return;
      } //too short


      if (str.length <= 3) {
        t.tag('Singular', 'short-singular', world);
        return;
      } //is it impossible to be plural?


      if (noPlurals.find(function (tag) {
        return t.tags[tag];
      })) {
        return;
      } // isPlural suffix rules


      if (isPlural_1.isPlural.find(function (reg) {
        return reg.test(str);
      })) {
        t.tag('Plural', 'plural-rules', world);
        return;
      } // isSingular suffix rules


      if (isPlural_1.isSingular.find(function (reg) {
        return reg.test(str);
      })) {
        t.tag('Singular', 'singular-rules', world);
        return;
      } // finally, fallback 'looks plural' rules..


      if (/s$/.test(str) === true) {
        //avoid anything too sketchy to be plural
        if (notPlural.find(function (reg) {
          return reg.test(str);
        })) {
          return;
        }

        t.tag('Plural', 'plural-fallback', world);
        return;
      } //avoid anything too sketchy to be singular


      if (notSingular.find(function (reg) {
        return reg.test(str);
      })) {
        return;
      }

      t.tag('Singular', 'singular-fallback', world);
    }
  };

  var _04Plurals = checkPlural;

  //nouns that also signal the title of an unknown organization
  //todo remove/normalize plural forms
  var orgWords = ['academy', 'administration', 'agence', 'agences', 'agencies', 'agency', 'airlines', 'airways', 'army', 'assoc', 'associates', 'association', 'assurance', 'authority', 'autorite', 'aviation', 'bank', 'banque', 'board', 'boys', 'brands', 'brewery', 'brotherhood', 'brothers', 'building society', 'bureau', 'cafe', 'caisse', 'capital', 'care', 'cathedral', 'center', 'central bank', 'centre', 'chemicals', 'choir', 'chronicle', 'church', 'circus', 'clinic', 'clinique', 'club', 'co', 'coalition', 'coffee', 'collective', 'college', 'commission', 'committee', 'communications', 'community', 'company', 'comprehensive', 'computers', 'confederation', 'conference', 'conseil', 'consulting', 'containers', 'corporation', 'corps', 'corp', 'council', 'crew', 'daily news', 'data', 'departement', 'department', 'department store', 'departments', 'design', 'development', 'directorate', 'division', 'drilling', 'education', 'eglise', 'electric', 'electricity', 'energy', 'ensemble', 'enterprise', 'enterprises', 'entertainment', 'estate', 'etat', 'evening news', 'faculty', 'federation', 'financial', 'fm', 'foundation', 'fund', 'gas', 'gazette', 'girls', 'government', 'group', 'guild', 'health authority', 'herald', 'holdings', 'hospital', 'hotel', 'hotels', 'inc', 'industries', 'institut', 'institute', 'institute of technology', 'institutes', 'insurance', 'international', 'interstate', 'investment', 'investments', 'investors', 'journal', 'laboratory', 'labs', // 'law',
  'liberation army', 'limited', 'local authority', 'local health authority', 'machines', 'magazine', 'management', 'marine', 'marketing', 'markets', 'media', 'memorial', 'mercantile exchange', 'ministere', 'ministry', 'military', 'mobile', 'motor', 'motors', 'musee', 'museum', // 'network',
  'news', 'news service', 'observatory', 'office', 'oil', 'optical', 'orchestra', 'organization', 'partners', 'partnership', // 'party',
  "people's party", 'petrol', 'petroleum', 'pharmacare', 'pharmaceutical', 'pharmaceuticals', 'pizza', 'plc', 'police', 'polytechnic', 'post', 'power', 'press', 'productions', 'quartet', 'radio', 'regional authority', 'regional health authority', 'reserve', 'resources', 'restaurant', 'restaurants', 'savings', 'school', 'securities', 'service', 'services', 'social club', 'societe', 'society', 'sons', 'standard', 'state police', 'state university', 'stock exchange', 'subcommittee', 'syndicat', 'systems', 'telecommunications', 'telegraph', 'television', 'times', 'tribunal', 'tv', 'union', 'university', 'utilities', 'workers'];
  var organizations = orgWords.reduce(function (h, str) {
    h[str] = 'Noun';
    return h;
  }, {});

  var maybeOrg = function maybeOrg(t) {
    //must be a noun
    if (!t.tags.Noun) {
      return false;
    } //can't be these things


    if (t.tags.Pronoun || t.tags.Comma || t.tags.Possessive) {
      return false;
    } //must be one of these


    if (t.tags.Organization || t.tags.Acronym || t.tags.Place || t.titleCase()) {
      return true;
    }

    return false;
  };

  var tagOrgs = function tagOrgs(terms, world) {
    for (var i = 0; i < terms.length; i += 1) {
      var t = terms[i];

      if (organizations[t.clean] !== undefined && organizations.hasOwnProperty(t.clean) === true) {
        // look-backward - eg. 'Toronto University'
        var lastTerm = terms[i - 1];

        if (lastTerm !== undefined && maybeOrg(lastTerm) === true) {
          lastTerm.tagSafe('Organization', 'org-word-1', world);
          t.tagSafe('Organization', 'org-word-2', world);
          continue;
        } //look-forward - eg. University of Toronto


        var nextTerm = terms[i + 1];

        if (nextTerm !== undefined && nextTerm.clean === 'of') {
          if (terms[i + 2] && maybeOrg(terms[i + 2])) {
            t.tagSafe('Organization', 'org-of-word-1', world);
            nextTerm.tagSafe('Organization', 'org-of-word-2', world);
            terms[i + 2].tagSafe('Organization', 'org-of-word-3', world);
            continue;
          }
        }
      }
    }
  };

  var _05Organizations = tagOrgs;

  var oneLetterAcronym$1 = /^[A-Z]('s|,)?$/;
  var periodSeperated = /([A-Z]\.){2}[A-Z]?/i;
  var oneLetterWord = {
    I: true,
    A: true
  };

  var isAcronym$2 = function isAcronym(term, world) {
    var str = term.reduced; // a known acronym like fbi

    if (term.tags.Acronym) {
      return true;
    } // if (term.tags.Adverb || term.tags.Verb || term.tags.Value || term.tags.Plural) {
    //   return false
    // }
    // known-words, like 'PIZZA' is not an acronym.


    if (world.words[str]) {
      return false;
    }

    return term.isAcronym();
  }; // F.B.I., NBC, - but not 'NO COLLUSION'


  var checkAcronym = function checkAcronym(terms, world) {
    terms.forEach(function (term) {
      //these are not acronyms
      if (term.tags.RomanNumeral === true) {
        return;
      } //period-ones F.D.B.


      if (periodSeperated.test(term.text) === true) {
        term.tag('Acronym', 'period-acronym', world);
      } //non-period ones are harder


      if (term.isUpperCase() && isAcronym$2(term, world)) {
        term.tag('Acronym', 'acronym-step', world);
        term.tag('Noun', 'acronym-infer', world);
      } else if (!oneLetterWord.hasOwnProperty(term.text) && oneLetterAcronym$1.test(term.text)) {
        term.tag('Acronym', 'one-letter-acronym', world);
        term.tag('Noun', 'one-letter-infer', world);
      } //if it's a organization,


      if (term.tags.Organization && term.text.length <= 3) {
        term.tag('Acronym', 'acronym-org', world);
      }

      if (term.tags.Organization && term.isUpperCase() && term.text.length <= 6) {
        term.tag('Acronym', 'acronym-org-case', world);
      }
    });
  };

  var _06Acronyms = checkAcronym;

  var step = {
    neighbours: _01Neighbours,
    "case": _02Case,
    stem: _03Stem,
    plural: _04Plurals,
    organizations: _05Organizations,
    acronyms: _06Acronyms
  }; //

  var fallbacks = function fallbacks(doc, terms) {
    var world = doc.world; // if it's empty, consult it's neighbours, first

    step.neighbours(terms, world); // is there a case-sensitive clue?

    step["case"](doc); // check 'rewatch' as 'watch'

    step.stem(terms, world); // ... fallback to a noun!

    terms.forEach(function (t) {
      if (t.isKnown() === false) {
        t.tag('Noun', 'noun-fallback', doc.world);
      }
    }); // turn 'Foo University' into an Org

    step.organizations(terms, world); //turn 'FBD' into an acronym

    step.acronyms(terms, world); //are the nouns singular or plural?

    terms.forEach(function (t) {
      step.plural(t, doc.world);
    });
    return doc;
  };

  var _02Fallbacks = fallbacks;

  var hasNegative = /n't$/;
  var irregulars$3 = {
    "won't": ['will', 'not'],
    wont: ['will', 'not'],
    "can't": ['can', 'not'],
    cant: ['can', 'not'],
    cannot: ['can', 'not'],
    "shan't": ['should', 'not'],
    dont: ['do', 'not'],
    dun: ['do', 'not'] // "ain't" is ambiguous for is/was

  }; // either 'is not' or 'are not'

  var doAint = function doAint(term, phrase) {
    var terms = phrase.terms();
    var index = terms.indexOf(term);
    var before = terms.slice(0, index); //look for the preceding noun

    var noun = before.find(function (t) {
      return t.tags.Noun;
    });

    if (noun && noun.tags.Plural) {
      return ['are', 'not'];
    }

    return ['is', 'not'];
  };

  var checkNegative = function checkNegative(term, phrase) {
    //check named-ones
    if (irregulars$3.hasOwnProperty(term.clean) === true) {
      return irregulars$3[term.clean];
    } //this word needs it's own logic:


    if (term.clean === "ain't" || term.clean === 'aint') {
      return doAint(term, phrase);
    } //try it normally


    if (hasNegative.test(term.clean) === true) {
      var main = term.clean.replace(hasNegative, '');
      return [main, 'not'];
    }

    return null;
  };

  var _01Negative = checkNegative;

  var contraction = /([a-z\u00C0-\u00FF]+)[\u0027\u0060\u00B4\u2018\u2019\u201A\u201B\u2032\u2035\u2039\u203A]([a-z]{1,2})$/i; //these ones don't seem to be ambiguous

  var easy = {
    ll: 'will',
    ve: 'have',
    re: 'are',
    m: 'am',
    "n't": 'not'
  }; //

  var checkApostrophe = function checkApostrophe(term) {
    var parts = term.text.match(contraction);

    if (parts === null) {
      return null;
    }

    if (easy.hasOwnProperty(parts[2])) {
      return [parts[1], easy[parts[2]]];
    }

    return null;
  };

  var _02Simple = checkApostrophe;

  var irregulars$4 = {
    wanna: ['want', 'to'],
    gonna: ['going', 'to'],
    im: ['i', 'am'],
    alot: ['a', 'lot'],
    ive: ['i', 'have'],
    imma: ['I', 'will'],
    "where'd": ['where', 'did'],
    whered: ['where', 'did'],
    "when'd": ['when', 'did'],
    whend: ['when', 'did'],
    // "how'd": ['how', 'did'], //'how would?'
    // "what'd": ['what', 'did'], //'what would?'
    howd: ['how', 'did'],
    whatd: ['what', 'did'],
    // "let's": ['let', 'us'], //too weird
    //multiple word contractions
    dunno: ['do', 'not', 'know'],
    brb: ['be', 'right', 'back'],
    gtg: ['got', 'to', 'go'],
    irl: ['in', 'real', 'life'],
    tbh: ['to', 'be', 'honest'],
    imo: ['in', 'my', 'opinion'],
    til: ['today', 'i', 'learned'],
    rn: ['right', 'now'],
    twas: ['it', 'was'],
    '@': ['at']
  }; //

  var checkIrregulars = function checkIrregulars(term) {
    //check white-list
    if (irregulars$4.hasOwnProperty(term.clean)) {
      return irregulars$4[term.clean];
    }

    return null;
  };

  var _03Irregulars = checkIrregulars;

  var hasApostropheS = /([a-z\u00C0-\u00FF]+)[\u0027\u0060\u00B4\u2018\u2019\u201A\u201B\u2032\u2035\u2039\u203A]s$/i;
  var banList = {
    that: true,
    there: true
  };
  var hereThere = {
    here: true,
    there: true,
    everywhere: true
  };

  var isPossessive = function isPossessive(term, pool) {
    // if we already know it
    if (term.tags.Possessive) {
      return true;
    } //a pronoun can't be possessive - "he's house"


    if (term.tags.Pronoun || term.tags.QuestionWord) {
      return false;
    }

    if (banList.hasOwnProperty(term.reduced)) {
      return false;
    } //if end of sentence, it is possessive - "was spencer's"


    var nextTerm = pool.get(term.next);

    if (!nextTerm) {
      return true;
    } //a gerund suggests 'is walking'


    if (nextTerm.tags.Verb) {
      //fix 'jamie's bite'
      if (nextTerm.tags.Infinitive) {
        return true;
      } //fix 'spencer's runs'


      if (nextTerm.tags.PresentTense) {
        return true;
      }

      return false;
    } //spencer's house


    if (nextTerm.tags.Noun) {
      // 'spencer's here'
      if (hereThere.hasOwnProperty(nextTerm.reduced) === true) {
        return false;
      }

      return true;
    } //rocket's red glare


    var twoTerm = pool.get(nextTerm.next);

    if (twoTerm && twoTerm.tags.Noun && !twoTerm.tags.Pronoun) {
      return true;
    } //othwerwise, an adjective suggests 'is good'


    if (nextTerm.tags.Adjective || nextTerm.tags.Adverb || nextTerm.tags.Verb) {
      return false;
    }

    return false;
  };

  var isHas = function isHas(term, phrase) {
    var terms = phrase.terms();
    var index = terms.indexOf(term);
    var after = terms.slice(index + 1, index + 3); //look for a past-tense verb

    return after.find(function (t) {
      return t.tags.PastTense;
    });
  };

  var checkPossessive = function checkPossessive(term, phrase, world) {
    //the rest of 's
    var found = term.text.match(hasApostropheS);

    if (found !== null) {
      //spencer's thing vs spencer-is
      if (isPossessive(term, phrase.pool) === true) {
        term.tag('#Possessive', 'isPossessive', world);
        return null;
      } //'spencer is'


      if (found !== null) {
        if (isHas(term, phrase)) {
          return [found[1], 'has'];
        }

        return [found[1], 'is'];
      }
    }

    return null;
  };

  var _04Possessive = checkPossessive;

  var hasPerfect = /[a-z\u00C0-\u00FF]'d$/;
  var useDid = {
    how: true,
    what: true
  };
  /** split `i'd` into 'i had',  or 'i would'  */

  var checkPerfect = function checkPerfect(term, phrase) {
    if (hasPerfect.test(term.clean)) {
      var root = term.clean.replace(/'d$/, ''); //look at the next few words

      var terms = phrase.terms();
      var index = terms.indexOf(term);
      var after = terms.slice(index + 1, index + 4); //is it before a past-tense verb? - 'i'd walked'

      for (var i = 0; i < after.length; i++) {
        var t = after[i];

        if (t.tags.Verb) {
          if (t.tags.PastTense) {
            return [root, 'had'];
          } //what'd you see


          if (useDid[root] === true) {
            return [root, 'did'];
          }

          return [root, 'would'];
        }
      } //otherwise, 'i'd walk'


      return [root, 'would'];
    }

    return null;
  };

  var _05PerfectTense = checkPerfect;

  var isRange = /^([0-9]{1,3})[-–—]([0-9]{1,3})$/i; //split '2-4' into '2 to 4'

  var checkRange = function checkRange(term) {
    if (term.tags.PhoneNumber === true) {
      return null;
    }

    var parts = term.text.match(isRange);

    if (parts !== null) {
      return [parts[1], 'to', parts[2]];
    }

    return null;
  };

  var _06Ranges = checkRange;

  var contraction$1 = /^(l|c|d|j|m|n|qu|s|t)[\u0027\u0060\u00B4\u2018\u2019\u201A\u201B\u2032\u2035\u2039\u203A]([a-z\u00C0-\u00FF]+)$/i; // basic support for ungendered french contractions
  // not perfect, but better than nothing, to support matching on french text.

  var french = {
    l: 'le',
    // l'amour
    c: 'ce',
    // c'est
    d: 'de',
    // d'amerique
    j: 'je',
    // j'aime
    m: 'me',
    // m'appelle
    n: 'ne',
    // n'est
    qu: 'que',
    // qu'il
    s: 'se',
    // s'appelle
    t: 'tu' // t'aime

  };

  var checkFrench = function checkFrench(term) {
    var parts = term.text.match(contraction$1);

    if (parts === null || french.hasOwnProperty(parts[1]) === false) {
      return null;
    }

    var arr = [french[parts[1]], parts[2]];

    if (arr[0] && arr[1]) {
      return arr;
    }

    return null;
  };

  var _07French = checkFrench;

  var isNumber = /^[0-9]+$/;

  var createPhrase = function createPhrase(found, doc) {
    //create phrase from ['would', 'not']
    var phrase = _01Tokenizer(found.join(' '), doc.world, doc.pool())[0]; //tag it

    var terms = phrase.terms();
    _01Lexicon(terms, doc.world); //make these terms implicit

    terms.forEach(function (t) {
      t.implicit = t.text;
      t.text = '';
      t.clean = ''; // remove whitespace for implicit terms

      t.pre = '';
      t.post = ''; // tag number-ranges

      if (isNumber.test(t.implicit)) {
        t.tags.Number = true;
        t.tags.Cardinal = true;
      } // if no tag, give it a noun


      if (Object.keys(t.tags).length === 0) {
        t.tags.Noun = true;
      }
    });
    return phrase;
  };

  var contractions = function contractions(doc) {
    var world = doc.world;
    doc.list.forEach(function (p) {
      var terms = p.terms();

      for (var i = 0; i < terms.length; i += 1) {
        var term = terms[i];
        var found = _01Negative(term, p);
        found = found || _02Simple(term);
        found = found || _03Irregulars(term);
        found = found || _04Possessive(term, p, world);
        found = found || _05PerfectTense(term, p);
        found = found || _06Ranges(term);
        found = found || _07French(term); //add them in

        if (found !== null) {
          var newPhrase = createPhrase(found, doc); // keep tag NumberRange, if we had it

          if (p.has('#NumberRange') === true) {
            doc.buildFrom([newPhrase]).tag('NumberRange');
          } //set text as contraction


          var firstTerm = newPhrase.terms(0);
          firstTerm.text = term.text; //grab sub-phrase to remove

          var match = p.buildFrom(term.id, 1, doc.pool());
          match.replace(newPhrase, doc, true);
        }
      }
    });
    return doc;
  };

  var _03Contractions = contractions;

  var hasWord = function hasWord(doc, word) {
    var arr = doc._cache.words[word] || [];
    arr = arr.map(function (i) {
      return doc.list[i];
    });
    return doc.buildFrom(arr);
  };

  var hasTag = function hasTag(doc, tag) {
    var arr = doc._cache.tags[tag] || [];
    arr = arr.map(function (i) {
      return doc.list[i];
    });
    return doc.buildFrom(arr);
  }; //mostly pos-corections here


  var miscCorrection = function miscCorrection(doc) {
    //exactly like
    var m = hasWord(doc, 'like');
    m.match('#Adverb like').notIf('(really|generally|typically|usually|sometimes|often|just) [like]').tag('Adverb', 'adverb-like'); //the orange.

    m = hasTag(doc, 'Adjective');
    m.match('#Determiner #Adjective$').notIf('(#Comparative|#Superlative)').terms(1).tag('Noun', 'the-adj-1'); // Firstname x (dangerous)

    m = hasTag(doc, 'FirstName');
    m.match('#FirstName (#Noun|@titleCase)').ifNo('^#Possessive').ifNo('(#Pronoun|#Plural)').ifNo('@hasComma .').lastTerm().tag('#LastName', 'firstname-noun'); //three trains / one train

    m = hasTag(doc, 'Value');
    m = m.match('#Value #PresentTense').ifNo('#Copula');

    if (m.found) {
      if (m.has('(one|1)') === true) {
        m.terms(1).tag('Singular', 'one-presentTense');
      } else {
        m.terms(1).tag('Plural', 'value-presentTense');
      }
    } // well i've been...


    doc.match('^(well|so|okay)').tag('Expression', 'well-'); //been walking

    m = hasTag(doc, 'Gerund');
    m.match("(be|been) (#Adverb|not)+? #Gerund").not('#Verb$').tag('Auxiliary', 'be-walking'); // directive verb - 'use reverse'

    doc.match('(try|use|attempt|build|make) #Verb').ifNo('(@hasComma|#Negative|#PhrasalVerb|#Copula|will|be)').lastTerm().tag('#Noun', 'do-verb'); //possessives
    //'her match' vs 'let her match'

    m = hasTag(doc, 'Possessive');
    m = m.match('#Possessive [#Infinitive]', 0);

    if (!m.lookBehind('(let|made|make|force|ask)').found) {
      m.tag('Noun', 'her-match');
    }

    return doc;
  };

  var fixMisc = miscCorrection;

  var unique$5 = function unique(arr) {
    var obj = {};

    for (var i = 0; i < arr.length; i++) {
      obj[arr[i]] = true;
    }

    return Object.keys(obj);
  };

  var _unique = unique$5;

  // order matters
  var list = [// ==== Mutliple tags ====
  {
    match: 'too much',
    tag: 'Adverb Adjective',
    reason: 'bit-4'
  }, // u r cool
  {
    match: 'u r',
    tag: 'Pronoun Copula',
    reason: 'u r'
  }, //sometimes adverbs - 'pretty good','well above'
  {
    match: '#Copula (pretty|dead|full|well|sure) (#Adjective|#Noun)',
    tag: '#Copula #Adverb #Adjective',
    reason: 'sometimes-adverb'
  }, //i better ..
  {
    match: '(#Pronoun|#Person) (had|#Adverb)? [better] #PresentTense',
    group: 0,
    tag: 'Modal',
    reason: 'i-better'
  }, //walking is cool
  {
    match: '[#Gerund] #Adverb? not? #Copula',
    group: 0,
    tag: 'Activity',
    reason: 'gerund-copula'
  }, //walking should be fun
  {
    match: '[#Gerund] #Modal',
    group: 0,
    tag: 'Activity',
    reason: 'gerund-modal'
  }, //swear-words as non-expression POS
  {
    match: 'holy (shit|fuck|hell)',
    tag: 'Expression',
    reason: 'swears-expression'
  }, //Aircraft designer
  {
    match: '#Noun #Actor',
    tag: 'Actor',
    reason: 'thing-doer'
  }, {
    match: '#Conjunction [u]',
    group: 0,
    tag: 'Pronoun',
    reason: 'u-pronoun-2'
  }, //'u' as pronoun
  {
    match: '[u] #Verb',
    group: 0,
    tag: 'Pronoun',
    reason: 'u-pronoun-1'
  }, // ==== Determiners ====
  {
    match: '#Noun [(who|whom)]',
    group: 0,
    tag: 'Determiner',
    reason: 'captain-who'
  }, //that car goes
  // { match: 'that #Noun [#PresentTense]', group: 0, tag: 'Determiner', reason: 'that-determiner' },
  {
    match: 'a bit much',
    tag: 'Determiner Adverb Adjective',
    reason: 'bit-3'
  }, // ==== Propositions ====
  //all students
  {
    match: '#Verb #Adverb? #Noun [(that|which)]',
    group: 0,
    tag: 'Preposition',
    reason: 'that-prep'
  }, //work, which has been done.
  {
    match: '@hasComma [which] (#Pronoun|#Verb)',
    group: 0,
    tag: 'Preposition',
    reason: 'which-copula'
  }, {
    match: '#Copula just [like]',
    group: 0,
    tag: 'Preposition',
    reason: 'like-preposition'
  }, //folks like her
  {
    match: '#Noun [like] #Noun',
    group: 0,
    tag: 'Preposition',
    reason: 'noun-like'
  }, //fix for busted-up phrasalVerbs
  {
    match: '#Noun [#Particle]',
    group: 0,
    tag: 'Preposition',
    reason: 'repair-noPhrasal'
  }, // ==== Conditions ====
  // had he survived,
  {
    match: '[had] #Noun+ #PastTense',
    group: 0,
    tag: 'Condition',
    reason: 'had-he'
  }, // were he to survive
  {
    match: '[were] #Noun+ to #Infinitive',
    group: 0,
    tag: 'Condition',
    reason: 'were-he'
  }, // ==== Questions ====
  //the word 'how'
  {
    match: '^how',
    tag: 'QuestionWord',
    reason: 'how-question'
  }, {
    match: '[how] (#Determiner|#Copula|#Modal|#PastTense)',
    group: 0,
    tag: 'QuestionWord',
    reason: 'how-is'
  }, // //the word 'which'
  {
    match: '^which',
    tag: 'QuestionWord',
    reason: 'which-question'
  }, {
    match: '[which] . (#Noun)+ #Pronoun',
    group: 0,
    tag: 'QuestionWord',
    reason: 'which-question2'
  }, // { match: 'which', tag: 'QuestionWord', reason: 'which-question3' },
  // ==== Conjunctions ====
  {
    match: '[so] #Noun',
    group: 0,
    tag: 'Conjunction',
    reason: 'so-conj'
  }, //how he is driving
  {
    match: '[(who|what|where|why|how|when)] #Noun #Copula #Adverb? (#Verb|#Adjective)',
    group: 0,
    tag: 'Conjunction',
    reason: 'how-he-is-x'
  }, {
    match: '[(who|what|where|why|how|when)] #Noun #Adverb? #Infinitive not? #Gerund',
    group: 0,
    tag: 'Conjunction',
    reason: 'when i go fishing'
  }];
  var _01Misc = list;

  var _ambig = {
    adverbs: {
      // adverbs than can be adjectives
      adjectives: ['dark', 'bright', 'flat', 'light', 'soft', 'pale', 'dead', 'dim', 'faux', 'little', 'wee', 'sheer', 'most', 'near', 'good', 'extra', 'all']
    },
    person: {
      // names that are dates
      dates: ['april', 'june', 'may', 'jan', 'august', 'eve'],
      // names that are adjectives
      adjectives: ['misty', 'rusty', 'dusty', 'rich', 'randy'],
      // names that are verbs
      verbs: ['pat', 'wade', 'ollie', 'will', 'rob', 'buck', 'bob', 'mark', 'jack'],
      // names that are verbs
      places: ['paris', 'alexandria', 'houston', 'kobe', 'salvador', 'sydney'],
      // names that are nouns
      nouns: ['art', 'bill', 'charity', 'cliff', 'daisy', 'dawn', 'dick', 'dolly', 'faith', 'gene', 'holly', 'hope', 'jean', 'jewel', 'joy', 'kelvin', 'kitty', 'lane', 'lily', 'melody', 'mercedes', 'miles', 'olive', 'penny', 'ray', 'reed', 'robin', 'rod', 'rose', 'sky', 'summer', 'trinity', 'van', 'viola', 'violet']
    }
  };

  var dates = "(".concat(_ambig.person.dates.join('|'), ")");
  var list$1 = [// ==== Holiday ====
  {
    match: '#Holiday (day|eve)',
    tag: 'Holiday',
    reason: 'holiday-day'
  }, // the captain who
  // ==== WeekDay ====
  // sun the 5th
  {
    match: '[sun] the #Ordinal',
    tag: 'WeekDay',
    reason: 'sun-the-5th'
  }, //sun feb 2
  {
    match: '[sun] #Date',
    group: 0,
    tag: 'WeekDay',
    reason: 'sun-feb'
  }, //1pm next sun
  {
    match: '#Date (on|this|next|last|during)? [sun]',
    group: 0,
    tag: 'WeekDay',
    reason: '1pm-sun'
  }, //this sat
  {
    match: "(in|by|before|during|on|until|after|of|within|all) [sat]",
    group: 0,
    tag: 'WeekDay',
    reason: 'sat'
  }, //sat november
  {
    match: '[sat] #Date',
    group: 0,
    tag: 'WeekDay',
    reason: 'sat-feb'
  }, // ==== Month ====
  //all march
  {
    match: "#Preposition [(march|may)]",
    group: 0,
    tag: 'Month',
    reason: 'in-month'
  }, //this march
  {
    match: "this [(march|may)]",
    group: 0,
    tag: 'Month',
    reason: 'this-month'
  }, {
    match: "next [(march|may)]",
    group: 0,
    tag: 'Month',
    reason: 'this-month'
  }, {
    match: "last [(march|may)]",
    group: 0,
    tag: 'Month',
    reason: 'this-month'
  }, // march 5th
  {
    match: "[(march|may)] the? #Value",
    group: 0,
    tag: 'Month',
    reason: 'march-5th'
  }, // 5th of march
  {
    match: "#Value of? [(march|may)]",
    group: 0,
    tag: 'Month',
    reason: '5th-of-march'
  }, // march and feb
  {
    match: "[(march|may)] .? #Date",
    group: 0,
    tag: 'Month',
    reason: 'march-and-feb'
  }, // feb to march
  {
    match: "#Date .? [(march|may)]",
    group: 0,
    tag: 'Month',
    reason: 'feb-and-march'
  }, //quickly march
  {
    match: "#Adverb [(march|may)]",
    group: 0,
    tag: 'Verb',
    reason: 'quickly-march'
  }, //march quickly
  {
    match: "[(march|may)] #Adverb",
    group: 0,
    tag: 'Verb',
    reason: 'march-quickly'
  }, //5th of March
  {
    match: '#Value of #Month',
    tag: 'Date',
    reason: 'value-of-month'
  }, //5 March
  {
    match: '#Cardinal #Month',
    tag: 'Date',
    reason: 'cardinal-month'
  }, //march 5 to 7
  {
    match: '#Month #Value to #Value',
    tag: 'Date',
    reason: 'value-to-value'
  }, //march the 12th
  {
    match: '#Month the #Value',
    tag: 'Date',
    reason: 'month-the-value'
  }, //june 7
  {
    match: '(#WeekDay|#Month) #Value',
    tag: 'Date',
    reason: 'date-value'
  }, //7 june
  {
    match: '#Value (#WeekDay|#Month)',
    tag: 'Date',
    reason: 'value-date'
  }, //may twenty five
  {
    match: '(#TextValue && #Date) #TextValue',
    tag: 'Date',
    reason: 'textvalue-date'
  }, // in june
  {
    match: "in [".concat(dates, "]"),
    group: 0,
    tag: 'Date',
    reason: 'in-june'
  }, {
    match: "during [".concat(dates, "]"),
    group: 0,
    tag: 'Date',
    reason: 'in-june'
  }, {
    match: "on [".concat(dates, "]"),
    group: 0,
    tag: 'Date',
    reason: 'in-june'
  }, {
    match: "by [".concat(dates, "]"),
    group: 0,
    tag: 'Date',
    reason: 'in-june'
  }, {
    match: "before [".concat(dates, "]"),
    group: 0,
    tag: 'Date',
    reason: 'in-june'
  }, {
    match: "#Date [".concat(dates, "]"),
    group: 0,
    tag: 'Date',
    reason: 'in-june'
  }, // june 1992
  {
    match: "".concat(dates, " #Value"),
    tag: 'Date',
    reason: 'june-5th'
  }, {
    match: "".concat(dates, " #Date"),
    tag: 'Date',
    reason: 'june-5th'
  }, // June Smith
  {
    match: "".concat(dates, " #ProperNoun"),
    tag: 'Person',
    reason: 'june-smith',
    safe: true
  }, // june m. Cooper
  {
    match: "".concat(dates, " #Acronym? (#ProperNoun && !#Month)"),
    tag: 'Person',
    reason: 'june-smith-jr'
  }, // 'second'
  {
    match: "#Cardinal [second]",
    tag: 'Unit',
    reason: 'one-second'
  }];
  var _02Dates = list$1;

  var adjectives$1 = "(".concat(_ambig.person.adjectives.join('|'), ")");
  var list$2 = [// all fell apart
  {
    match: '[all] #Determiner? #Noun',
    group: 0,
    tag: 'Adjective',
    reason: 'all-noun'
  }, // very rusty
  {
    match: "#Adverb [".concat(adjectives$1, "]"),
    group: 0,
    tag: 'Adjective',
    reason: 'really-rich'
  }, // rusty smith
  {
    match: "".concat(adjectives$1, " #Person"),
    tag: 'Person',
    reason: 'randy-smith'
  }, // rusty a. smith
  {
    match: "".concat(adjectives$1, " #Acronym? #ProperNoun"),
    tag: 'Person',
    reason: 'rusty-smith'
  }, //sometimes not-adverbs
  {
    match: '#Copula [(just|alone)]$',
    group: 0,
    tag: 'Adjective',
    reason: 'not-adverb'
  }, //jack is guarded
  {
    match: '#Singular is #Adverb? [#PastTense$]',
    group: 0,
    tag: 'Adjective',
    reason: 'is-filled'
  }, // smoked poutine is
  {
    match: '[#PastTense] #Singular is',
    group: 0,
    tag: 'Adjective',
    reason: 'smoked-poutine'
  }, // baked onions are
  {
    match: '[#PastTense] #Plural are',
    group: 0,
    tag: 'Adjective',
    reason: 'baked-onions'
  }, // well made
  {
    match: 'well [#PastTense]',
    group: 0,
    tag: 'Adjective',
    reason: 'well-made'
  }, // is f*ed up
  {
    match: '#Copula [fucked up?]',
    tag: 'Adjective',
    reason: 'swears-adjective'
  }, //jack seems guarded
  {
    match: '#Singular (seems|appears) #Adverb? [#PastTense$]',
    group: 0,
    tag: 'Adjective',
    reason: 'seems-filled'
  }, // Gerund-Adjectives - 'amusing, annoying'
  //a staggering cost
  {
    match: '(a|an) [#Gerund]',
    group: 0,
    tag: 'Adjective',
    reason: 'a|an'
  }, //as amusing as
  {
    match: 'as [#Gerund] as',
    group: 0,
    tag: 'Adjective',
    reason: 'as-gerund-as'
  }, // more amusing than
  {
    match: 'more [#Gerund] than',
    group: 0,
    tag: 'Adjective',
    reason: 'more-gerund-than'
  }, // very amusing
  {
    match: '(so|very|extremely) [#Gerund]',
    group: 0,
    tag: 'Adjective',
    reason: 'so-gerund'
  }, // it was amusing
  {
    match: '(it|he|she|everything|something) #Adverb? was #Adverb? [#Gerund]',
    group: 0,
    tag: 'Adjective',
    reason: 'it-was-gerund'
  }, // found it amusing
  {
    match: '(found|found) it #Adverb? [#Gerund]',
    group: 0,
    tag: 'Adjective',
    reason: 'found-it-gerund'
  }, // a bit amusing
  {
    match: 'a (little|bit|wee) bit? [#Gerund]',
    group: 0,
    tag: 'Adjective',
    reason: 'a-bit-gerund'
  }];
  var _03Adjective = list$2;

  var _04Noun = [// ==== Plural ====
  //there are reasons
  {
    match: 'there (are|were) #Adjective? [#PresentTense]',
    group: 0,
    tag: 'Plural',
    reason: 'there-are'
  }, // ==== Singular ====
  //the sun
  {
    match: '#Determiner [sun]',
    group: 0,
    tag: 'Singular',
    reason: 'the-sun'
  }, //did a 900, paid a 20
  {
    match: '#Verb (a|an) [#Value]',
    group: 0,
    tag: 'Singular',
    reason: 'did-a-value'
  }, //'the can'
  {
    match: 'the [(can|will|may)]',
    group: 0,
    tag: 'Singular',
    reason: 'the can'
  }, // ==== Possessive ====
  //spencer kelly's
  {
    match: '#FirstName #Acronym? (#Possessive && #LastName)',
    tag: 'Possessive',
    reason: 'name-poss'
  }, //Super Corp's fundraiser
  {
    match: '#Organization+ #Possessive',
    tag: 'Possessive',
    reason: 'org-possessive'
  }, //Los Angeles's fundraiser
  {
    match: '#Place+ #Possessive',
    tag: 'Possessive',
    reason: 'place-possessive'
  }, // assign all tasks
  {
    match: '#Verb (all|every|each|most|some|no) [#PresentTense]',
    group: 0,
    tag: 'Noun',
    reason: 'all-presentTense'
  }, //the above is clear
  {
    match: '#Determiner [#Adjective] #Copula',
    group: 0,
    tag: 'Noun',
    reason: 'the-adj-is'
  }, //real evil is
  {
    match: '#Adjective [#Adjective] #Copula',
    group: 0,
    tag: 'Noun',
    reason: 'adj-adj-is'
  }, // PresentTense/Noun ambiguities
  // big dreams, critical thinking
  // have big dreams
  {
    match: '(had|have|#PastTense) #Adjective [#PresentTense]',
    group: 0,
    tag: 'Noun',
    reason: 'adj-presentTense'
  }, // excellent answer spencer
  {
    match: '^#Adjective [#PresentTense]',
    group: 0,
    tag: 'Noun',
    reason: 'start adj-presentTense'
  }, // one big reason
  {
    match: '#Value #Adjective [#PresentTense]',
    group: 0,
    tag: 'Noun',
    reason: 'one-big-reason'
  }, // won widespread support
  {
    match: '#PastTense #Adjective+ [#PresentTense]',
    group: 0,
    tag: 'Noun',
    reason: 'won-wide-support'
  }, // many poses
  {
    match: '(many|few|several|couple) [#PresentTense]',
    group: 0,
    tag: 'Noun',
    reason: 'many-poses'
  }, // very big dreams
  {
    match: '#Adverb #Adjective [#PresentTense]',
    group: 0,
    tag: 'Noun',
    reason: 'very-big-dream'
  }, // good wait staff
  {
    match: '#Adjective [#Infinitive] #Noun',
    group: 0,
    tag: 'Noun',
    reason: 'good-wait-staff'
  }, // adorable little store
  {
    match: '#Adjective #Adjective [#PresentTense]',
    group: 0,
    tag: 'Noun',
    reason: 'adorable-little-store'
  }, // of basic training
  {
    match: '#Preposition #Adjective [#PresentTense]',
    group: 0,
    tag: 'Noun',
    reason: 'of-basic-training'
  }, // early warning
  {
    match: '#Adjective [#Gerund]',
    group: 0,
    tag: 'Noun',
    reason: 'early-warning'
  }, // justifiying higher costs
  {
    match: '#Gerund #Adverb? #Comparative [#PresentTense]',
    group: 0,
    tag: 'Noun',
    reason: 'higher-costs'
  }, // do the dance
  {
    match: '#Infinitive (this|that|the) [#Infinitive]',
    group: 0,
    tag: 'Noun',
    reason: 'do-this-dance'
  }, //his fine
  {
    match: '(his|her|its) [#Adjective]',
    group: 0,
    tag: 'Noun',
    reason: 'his-fine'
  }, //some pressing issues
  {
    match: 'some [#Verb] #Plural',
    group: 0,
    tag: 'Noun',
    reason: 'determiner6'
  }, //'more' is not always an adverb
  {
    match: 'more #Noun',
    tag: 'Noun',
    reason: 'more-noun'
  }, {
    match: '(#Noun && @hasComma) #Noun (and|or) [#PresentTense]',
    group: 0,
    tag: 'Noun',
    reason: 'noun-list'
  }, //3 feet
  {
    match: '(right|rights) of .',
    tag: 'Noun',
    reason: 'right-of'
  }, // a bit
  {
    match: 'a [bit]',
    group: 0,
    tag: 'Noun',
    reason: 'bit-2'
  }, //running-a-show
  {
    match: '#Gerund #Determiner [#Infinitive]',
    group: 0,
    tag: 'Noun',
    reason: 'running-a-show'
  }, //the-only-reason
  {
    match: '#Determiner #Adverb [#Infinitive]',
    group: 0,
    tag: 'Noun',
    reason: 'the-reason'
  }, //the nice swim
  {
    match: '(the|this|those|these) #Adjective [#Verb]',
    group: 0,
    tag: 'Noun',
    reason: 'the-adj-verb'
  }, // the truly nice swim
  {
    match: '(the|this|those|these) #Adverb #Adjective [#Verb]',
    group: 0,
    tag: 'Noun',
    reason: 'determiner4'
  }, //the orange is
  {
    match: '#Determiner [#Adjective] (#Copula|#PastTense|#Auxiliary)',
    group: 0,
    tag: 'Noun',
    reason: 'the-adj-2'
  }, // a stream runs
  {
    match: '(the|this|a|an) [#Infinitive] #Adverb? #Verb',
    group: 0,
    tag: 'Noun',
    reason: 'determiner5'
  }, //the test string
  {
    match: '#Determiner [#Infinitive] #Noun',
    group: 0,
    tag: 'Noun',
    reason: 'determiner7'
  }, //a nice deal
  {
    match: '#Determiner #Adjective #Adjective? [#Infinitive]',
    group: 0,
    tag: 'Noun',
    reason: 'a-nice-inf'
  }, //the wait to vote
  {
    match: 'the [#Verb] #Preposition .',
    group: 0,
    tag: 'Noun',
    reason: 'determiner1'
  }, //a sense of
  {
    match: '#Determiner [#Verb] of',
    group: 0,
    tag: 'Noun',
    reason: 'the-verb-of'
  }, //next career move
  {
    match: '#Adjective #Noun+ [#Infinitive] #Copula',
    group: 0,
    tag: 'Noun',
    reason: 'career-move'
  }, //the threat of force
  {
    match: '#Determiner #Noun of [#Verb]',
    group: 0,
    tag: 'Noun',
    reason: 'noun-of-noun'
  }, //the western line
  {
    match: '#Determiner [(western|eastern|northern|southern|central)] #Noun',
    group: 0,
    tag: 'Noun',
    reason: 'western-line'
  }, //her polling
  {
    match: '#Possessive [#Gerund]',
    group: 0,
    tag: 'Noun',
    reason: 'her-polling'
  }, //her fines
  {
    match: '(his|her|its) [#PresentTense]',
    group: 0,
    tag: 'Noun',
    reason: 'its-polling'
  }, //linear algebra
  {
    match: '(#Determiner|#Value) [(linear|binary|mobile|lexical|technical|computer|scientific|formal)] #Noun',
    group: 0,
    tag: 'Noun',
    reason: 'technical-noun'
  }, // a blown motor
  {
    match: '(the|those|these|a|an) [#Participle] #Noun',
    group: 0,
    tag: 'Adjective',
    reason: 'blown-motor'
  }, // walk the walk
  {
    match: '(the|those|these|a|an) #Adjective? [#Infinitive]',
    group: 0,
    tag: 'Noun',
    reason: 'det-inf'
  }, {
    match: '(the|those|these|a|an) #Adjective? [#PresentTense]',
    group: 0,
    tag: 'Noun',
    reason: 'det-pres'
  }, {
    match: '(the|those|these|a|an) #Adjective? [#PastTense]',
    group: 0,
    tag: 'Noun',
    reason: 'det-past'
  }, // this swimming
  {
    match: '(this|that) [#Gerund]',
    group: 0,
    tag: 'Noun',
    reason: 'this-gerund'
  }, // at some point
  {
    match: 'at some [#Infinitive]',
    group: 0,
    tag: 'Noun',
    reason: 'at-some-inf'
  }, //air-flow
  {
    match: '(#Noun && @hasHyphen) #Verb',
    tag: 'Noun',
    reason: 'hyphen-verb'
  }, //is no walk
  {
    match: 'is no [#Verb]',
    group: 0,
    tag: 'Noun',
    reason: 'is-no-verb'
  }, //different views than
  {
    match: '[#Verb] than',
    group: 0,
    tag: 'Noun',
    reason: 'correction'
  }, // goes to sleep
  {
    match: '(go|goes|went) to [#Infinitive]',
    group: 0,
    tag: 'Noun',
    reason: 'goes-to-verb'
  }, //a great run
  {
    match: '(a|an) #Adjective [(#Infinitive|#PresentTense)]',
    tag: 'Noun',
    reason: 'a|an2'
  }, //a tv show
  {
    match: '(a|an) #Noun [#Infinitive]',
    group: 0,
    tag: 'Noun',
    reason: 'a-noun-inf'
  }, //do so
  {
    match: 'do [so]',
    group: 0,
    tag: 'Noun',
    reason: 'so-noun'
  }, //is mark hughes
  {
    match: '#Copula [#Infinitive] #Noun',
    group: 0,
    tag: 'Noun',
    reason: 'is-pres-noun'
  }, //
  // { match: '[#Infinitive] #Copula', group: 0, tag: 'Noun', reason: 'inf-copula' },
  //a close
  {
    match: '#Determiner #Adverb? [close]',
    group: 0,
    tag: 'Adjective',
    reason: 'a-close'
  }, // what the hell
  {
    match: '#Determiner [(shit|damn|hell)]',
    group: 0,
    tag: 'Noun',
    reason: 'swears-noun'
  }, // the staff were
  {
    match: '(the|these) [#Singular] (were|are)',
    group: 0,
    tag: 'Plural',
    reason: 'singular-were'
  }, // running for congress
  {
    match: '#Gerund #Adjective? for [#Infinitive]',
    group: 0,
    tag: 'Noun',
    reason: 'running-for'
  }, // running to work
  {
    match: '#Gerund #Adjective to [#Infinitive]',
    group: 0,
    tag: 'Noun',
    reason: 'running-to'
  }, // any questions for
  {
    match: '(many|any|some|several) [#PresentTense] for',
    group: 0,
    tag: 'Noun',
    reason: 'any-verbs-for'
  }, // have fun
  {
    match: "(have|had) [#Adjective] #Preposition .",
    group: 0,
    tag: 'Noun',
    reason: 'have-fun'
  }, // co-founder
  {
    match: "co #Noun",
    tag: 'Actor',
    reason: 'co-noun'
  }];

  var adjectives$2 = "(".concat(_ambig.adverbs.adjectives.join('|'), ")");
  var _05Adverb = [//still good
  {
    match: '[still] #Adjective',
    group: 0,
    tag: 'Adverb',
    reason: 'still-advb'
  }, //still make
  {
    match: '[still] #Verb',
    group: 0,
    tag: 'Adverb',
    reason: 'still-verb'
  }, // so hot
  {
    match: '[so] #Adjective',
    group: 0,
    tag: 'Adverb',
    reason: 'so-adv'
  }, // way hotter
  {
    match: '[way] #Comparative',
    group: 0,
    tag: 'Adverb',
    reason: 'way-adj'
  }, // way too hot
  {
    match: '[way] #Adverb #Adjective',
    group: 0,
    tag: 'Adverb',
    reason: 'way-too-adj'
  }, // all singing
  {
    match: '[all] #Verb',
    group: 0,
    tag: 'Adverb',
    reason: 'all-verb'
  }, // sing like an angel
  {
    match: '(#Verb && !#Modal) [like]',
    group: 0,
    tag: 'Adverb',
    reason: 'verb-like'
  }, //barely even walk
  {
    match: '(barely|hardly) even',
    tag: 'Adverb',
    reason: 'barely-even'
  }, //even held
  {
    match: '[even] #Verb',
    group: 0,
    tag: 'Adverb',
    reason: 'even-walk'
  }, //cheering hard - dropped -ly's
  {
    match: '#PresentTense [(hard|quick|long|bright|slow)]',
    group: 0,
    tag: 'Adverb',
    reason: 'lazy-ly'
  }, // much appreciated
  {
    match: '[much] #Adjective',
    group: 0,
    tag: 'Adverb',
    reason: 'bit-1'
  }, // is well
  {
    match: '#Copula [#Adverb]$',
    group: 0,
    tag: 'Adjective',
    reason: 'is-well'
  }, // a bit cold
  {
    match: 'a [(little|bit|wee) bit?] #Adjective',
    group: 0,
    tag: 'Adverb',
    reason: 'a-bit-cold'
  }, // dark green
  {
    match: "[".concat(adjectives$2, "] #Adjective"),
    group: 0,
    tag: 'Adverb',
    reason: 'dark-green'
  }, // kinda sparkly
  {
    match: "#Adverb [#Adverb]$",
    group: 0,
    tag: 'Adjective',
    reason: 'kinda-sparkly'
  }, {
    match: "#Adverb [#Adverb] (and|or|then)",
    group: 0,
    tag: 'Adjective',
    reason: 'kinda-sparkly-and'
  }];

  var _06Value = [// ==== PhoneNumber ====
  //1 800 ...
  {
    match: '1 #Value #PhoneNumber',
    tag: 'PhoneNumber',
    reason: '1-800-Value'
  }, //(454) 232-9873
  {
    match: '#NumericValue #PhoneNumber',
    tag: 'PhoneNumber',
    reason: '(800) PhoneNumber'
  }, // ==== Currency ====
  // chinese yuan
  {
    match: '#Demonym #Currency',
    tag: 'Currency',
    reason: 'demonym-currency'
  }, // ==== Ordinal ====
  {
    match: '[second] #Noun',
    group: 0,
    tag: 'Ordinal',
    reason: 'second-noun'
  }, // ==== Unit ====
  //5 yan
  {
    match: '#Value+ [#Currency]',
    group: 0,
    tag: 'Unit',
    reason: '5-yan'
  }, {
    match: '#Value [(foot|feet)]',
    group: 0,
    tag: 'Unit',
    reason: 'foot-unit'
  }, //minus 7
  {
    match: '(minus|negative) #Value',
    tag: 'Value',
    reason: 'minus-value'
  }, //5 kg.
  {
    match: '#Value [#Abbreviation]',
    group: 0,
    tag: 'Unit',
    reason: 'value-abbr'
  }, {
    match: '#Value [k]',
    group: 0,
    tag: 'Unit',
    reason: 'value-k'
  }, {
    match: '#Unit an hour',
    tag: 'Unit',
    reason: 'unit-an-hour'
  }, //seven point five
  {
    match: '#Value (point|decimal) #Value',
    tag: 'Value',
    reason: 'value-point-value'
  }, // ten bucks
  {
    match: '(#Value|a) [(buck|bucks|grand)]',
    group: 0,
    tag: 'Currency',
    reason: 'value-bucks'
  }, //quarter million
  {
    match: '#Determiner [(half|quarter)] #Ordinal',
    group: 0,
    tag: 'Value',
    reason: 'half-ordinal'
  }, {
    match: 'a #Value',
    tag: 'Value',
    reason: 'a-value'
  }, // ==== Money ====
  {
    match: '[#Value+] #Currency',
    group: 0,
    tag: 'Money',
    reason: '15 usd'
  }, // thousand and two
  {
    match: "(hundred|thousand|million|billion|trillion|quadrillion)+ and #Value",
    tag: 'Value',
    reason: 'magnitude-and-value'
  }, //'a/an' can mean 1 - "a hour"
  {
    match: '!once [(a|an)] (#Duration|hundred|thousand|million|billion|trillion)',
    group: 0,
    tag: 'Value',
    reason: 'a-is-one'
  }];

  var verbs$1 = "(".concat(_ambig.person.verbs.join('|'), ")");
  var list$3 = [// adj -> gerund
  // amusing his aunt
  {
    match: '[#Adjective] #Possessive #Noun',
    group: 0,
    tag: 'Gerund',
    reason: 'gerund-his-noun'
  }, // loving you
  {
    match: '[#Adjective] (us|you)',
    group: 0,
    tag: 'Gerund',
    reason: 'loving-you'
  }, // slowly stunning
  {
    match: '(slowly|quickly) [#Adjective]',
    group: 0,
    tag: 'Gerund',
    reason: 'slowly-adj'
  }, // like
  {
    match: '(#Modal|i|they|we|do) not? [like]',
    group: 0,
    tag: 'PresentTense',
    reason: 'modal-like'
  }, // do not simply like
  {
    match: 'do (simply|just|really|not)+ [(#Adjective|like)]',
    group: 0,
    tag: 'Verb',
    reason: 'do-simply-like'
  }, // does mean
  {
    match: 'does (#Adverb|not)? [#Adjective]',
    group: 0,
    tag: 'PresentTense',
    reason: 'does-mean'
  }, // i mean
  {
    match: 'i (#Adverb|do)? not? [mean]',
    group: 0,
    tag: 'PresentTense',
    reason: 'i-mean'
  }, // { match: '!are (i|you|we) (#Adverb|do)? [#Adjective]', group: 0, tag: 'PresentTense', reason: 'i-mean' },
  // ==== Tense ====
  //he left
  {
    match: '#Noun #Adverb? [left]',
    group: 0,
    tag: 'PastTense',
    reason: 'left-verb'
  }, //this rocks
  {
    match: '(this|that) [#Plural]',
    group: 0,
    tag: 'PresentTense',
    reason: 'this-verbs'
  }, // ==== Auxiliary ====
  //was walking
  {
    match: "[#Copula (#Adverb|not)+?] (#Gerund|#PastTense)",
    group: 0,
    tag: 'Auxiliary',
    reason: 'copula-walking'
  }, //support a splattering of auxillaries before a verb
  {
    match: "[(has|had) (#Adverb|not)+?] #PastTense",
    group: 0,
    tag: 'Auxiliary',
    reason: 'had-walked'
  }, //would walk
  {
    match: "[#Adverb+? (#Modal|did)+ (#Adverb|not)+?] #Verb",
    group: 0,
    tag: 'Auxiliary',
    reason: 'modal-verb'
  }, //would have had
  {
    match: "[#Modal (#Adverb|not)+? have (#Adverb|not)+? had (#Adverb|not)+?] #Verb",
    group: 0,
    tag: 'Auxiliary',
    reason: 'would-have'
  }, //would be walking
  {
    match: "#Modal (#Adverb|not)+? be (#Adverb|not)+? #Verb",
    group: 0,
    tag: 'Auxiliary',
    reason: 'would-be'
  }, //had been walking
  {
    match: "(#Modal|had|has) (#Adverb|not)+? been (#Adverb|not)+? #Verb",
    group: 0,
    tag: 'Auxiliary',
    reason: 'had-been'
  }, //support a splattering of auxillaries before a verb
  {
    match: "[(has|had) (#Adverb|not)+?] #PastTense",
    group: 0,
    tag: 'Auxiliary',
    reason: 'had-walked'
  }, // will walk
  {
    match: '[(do|does|will|have|had)] (not|#Adverb)? #Verb',
    group: 0,
    tag: 'Auxiliary',
    reason: 'have-had'
  }, // about to go
  {
    match: '[about to] #Adverb? #Verb',
    group: 0,
    tag: ['Auxiliary', 'Verb'],
    reason: 'about-to'
  }, //would be walking
  {
    match: "#Modal (#Adverb|not)+? be (#Adverb|not)+? #Verb",
    group: 0,
    tag: 'Auxiliary',
    reason: 'would-be'
  }, //were being run
  {
    match: "(were|was) being [#PresentTense]",
    group: 0,
    tag: 'PastTense',
    reason: 'was-being'
  }, //have run
  {
    match: "have #PresentTense",
    group: 0,
    tag: 'PastTense',
    reason: 'have-vb'
  }, //would have had
  {
    match: "[#Modal (#Adverb|not)+? have (#Adverb|not)+? had (#Adverb|not)+?] #Verb",
    group: 0,
    tag: 'Auxiliary',
    reason: 'would-have'
  }, //had been walking
  {
    match: "(#Modal|had|has) (#Adverb|not)+? been (#Adverb|not)+? #Verb",
    group: 0,
    tag: 'Auxiliary',
    reason: 'had-been'
  }, // was being driven
  {
    match: '[(be|being|been)] #Participle',
    group: 0,
    tag: 'Auxiliary',
    reason: 'being-foo'
  }, // ==== Phrasal ====
  //'foo-up'
  {
    match: '(#Verb && @hasHyphen) up',
    group: 0,
    tag: 'PhrasalVerb',
    reason: 'foo-up'
  }, {
    match: '(#Verb && @hasHyphen) off',
    group: 0,
    tag: 'PhrasalVerb',
    reason: 'foo-off'
  }, {
    match: '(#Verb && @hasHyphen) over',
    group: 0,
    tag: 'PhrasalVerb',
    reason: 'foo-over'
  }, {
    match: '(#Verb && @hasHyphen) out',
    group: 0,
    tag: 'PhrasalVerb',
    reason: 'foo-out'
  }, //fall over
  {
    match: '#PhrasalVerb [#PhrasalVerb]',
    group: 0,
    tag: 'Particle',
    reason: 'phrasal-particle'
  }, //back it up
  {
    match: '#Verb (him|her|it|us|himself|herself|itself|everything|something) [(up|down)]',
    group: 0,
    tag: 'Adverb',
    reason: 'phrasal-pronoun-advb'
  }, // ==== Copula ====
  //will be running (not copula)
  {
    match: '[will #Adverb? not? #Adverb? be] #Gerund',
    group: 0,
    tag: 'Copula',
    reason: 'will-be-copula'
  }, //for more complex forms, just tag 'be'
  {
    match: 'will #Adverb? not? #Adverb? [be] #Adjective',
    group: 0,
    tag: 'Copula',
    reason: 'be-copula'
  }, // ==== Infinitive ====
  //march to
  {
    match: '[march] (up|down|back|to|toward)',
    group: 0,
    tag: 'Infinitive',
    reason: 'march-to'
  }, //must march
  {
    match: '#Modal [march]',
    group: 0,
    tag: 'Infinitive',
    reason: 'must-march'
  }, //let him glue
  {
    match: '(let|make|made) (him|her|it|#Person|#Place|#Organization)+ [#Singular] (a|an|the|it)',
    group: 0,
    tag: 'Infinitive',
    reason: 'let-him-glue'
  }, //he quickly foo
  {
    match: '#Noun #Adverb [#Noun]',
    group: 0,
    tag: 'Verb',
    reason: 'quickly-foo'
  }, //will secure our
  {
    match: 'will [#Adjective]',
    group: 0,
    tag: 'Verb',
    reason: 'will-adj'
  }, //he disguised the thing
  {
    match: '#Pronoun [#Adjective] #Determiner #Adjective? #Noun',
    group: 0,
    tag: 'Verb',
    reason: 'he-adj-the'
  }, //is eager to go
  {
    match: '#Copula [#Adjective to] #Verb',
    group: 0,
    tag: 'Verb',
    reason: 'adj-to'
  }, // open the door
  {
    match: '[open] #Determiner',
    group: 0,
    tag: 'Infinitive',
    reason: 'open-the'
  }, // compromises are possible
  {
    match: '[#PresentTense] (are|were|was) #Adjective',
    group: 0,
    tag: 'Plural',
    reason: 'compromises-are-possible'
  }, // would wade
  {
    match: "#Modal [".concat(verbs$1, "]"),
    group: 0,
    tag: 'Verb',
    reason: 'would-mark'
  }, {
    match: "#Adverb [".concat(verbs$1, "]"),
    group: 0,
    tag: 'Verb',
    reason: 'really-mark'
  }, //to mark
  {
    match: '(to|#Modal) [mark]',
    group: 0,
    tag: 'PresentTense',
    reason: 'to-mark'
  }, // wade smith
  {
    match: "".concat(verbs$1, " #Person"),
    tag: 'Person',
    reason: 'rob-smith'
  }, // wade m. Cooper
  {
    match: "".concat(verbs$1, " #Acronym #ProperNoun"),
    tag: 'Person',
    reason: 'rob-a-smith'
  }, // damn them
  {
    match: '[shit] (#Determiner|#Possessive|them)',
    group: 0,
    tag: 'Verb',
    reason: 'swear1-verb'
  }, {
    match: '[damn] (#Determiner|#Possessive|them)',
    group: 0,
    tag: 'Verb',
    reason: 'swear2-verb'
  }, {
    match: '[fuck] (#Determiner|#Possessive|them)',
    group: 0,
    tag: 'Verb',
    reason: 'swear3-verb'
  }];
  var _07Verbs = list$3;

  var places = "(".concat(_ambig.person.places.join('|'), ")");
  var list$4 = [// ==== Region ====
  //West Norforlk
  {
    match: '(west|north|south|east|western|northern|southern|eastern)+ #Place',
    tag: 'Region',
    reason: 'west-norfolk'
  }, //some us-state acronyms (exlude: al, in, la, mo, hi, me, md, ok..)
  {
    match: '#City [(al|ak|az|ar|ca|ct|dc|fl|ga|id|il|nv|nh|nj|ny|oh|or|pa|sc|tn|tx|ut|vt|pr)]',
    group: 0,
    tag: 'Region',
    reason: 'us-state'
  }, //Foo District
  {
    match: '#ProperNoun+ (district|region|province|county|prefecture|municipality|territory|burough|reservation)',
    tag: 'Region',
    reason: 'foo-district'
  }, //District of Foo
  {
    match: '(district|region|province|municipality|territory|burough|state) of #ProperNoun',
    tag: 'Region',
    reason: 'district-of-Foo'
  }, // in Foo California
  {
    match: 'in [#ProperNoun] #Place',
    group: 0,
    tag: 'Place',
    reason: 'propernoun-place'
  }, // ==== Address ====
  {
    match: '#Value #Noun (st|street|rd|road|crescent|cr|way|tr|terrace|avenue|ave)',
    tag: 'Address',
    reason: 'address-st'
  }, // in houston
  {
    match: "in [".concat(places, "]"),
    group: 0,
    tag: 'Place',
    reason: 'in-paris'
  }, {
    match: "near [".concat(places, "]"),
    group: 0,
    tag: 'Place',
    reason: 'near-paris'
  }, {
    match: "at [".concat(places, "]"),
    group: 0,
    tag: 'Place',
    reason: 'at-paris'
  }, {
    match: "from [".concat(places, "]"),
    group: 0,
    tag: 'Place',
    reason: 'from-paris'
  }, {
    match: "to [".concat(places, "]"),
    group: 0,
    tag: 'Place',
    reason: 'to-paris'
  }, {
    match: "#Place [".concat(places, "]"),
    group: 0,
    tag: 'Place',
    reason: 'tokyo-paris'
  }, // houston texas
  {
    match: "[".concat(places, "] #Place"),
    group: 0,
    tag: 'Place',
    reason: 'paris-france'
  }];
  var _08Place = list$4;

  var _09Org = [//John & Joe's
  {
    match: '#Noun (&|n) #Noun',
    tag: 'Organization',
    reason: 'Noun-&-Noun'
  }, // teachers union of Ontario
  {
    match: '#Organization of the? #ProperNoun',
    tag: 'Organization',
    reason: 'org-of-place',
    safe: true
  }, //walmart USA
  {
    match: '#Organization #Country',
    tag: 'Organization',
    reason: 'org-country'
  }, //organization
  {
    match: '#ProperNoun #Organization',
    tag: 'Organization',
    reason: 'titlecase-org'
  }, //FitBit Inc
  {
    match: '#ProperNoun (ltd|co|inc|dept|assn|bros)',
    tag: 'Organization',
    reason: 'org-abbrv'
  }, // the OCED
  {
    match: 'the [#Acronym]',
    group: 0,
    tag: 'Organization',
    reason: 'the-acronym',
    safe: true
  }, // global trade union
  {
    match: '(world|global|international|national|#Demonym) #Organization',
    tag: 'Organization',
    reason: 'global-org'
  }, // schools
  {
    match: '#Noun+ (public|private) school',
    tag: 'School',
    reason: 'noun-public-school'
  }];

  var nouns$1 = "(".concat(_ambig.person.nouns.join('|'), ")");
  var months = '(january|april|may|june|jan|sep)'; //summer|autumn

  var list$5 = [// ==== Honorific ====
  {
    match: '[(1st|2nd|first|second)] #Honorific',
    group: 0,
    tag: 'Honorific',
    reason: 'ordinal-honorific'
  }, {
    match: '[(private|general|major|corporal|lord|lady|secretary|premier)] #Honorific? #Person',
    group: 0,
    tag: 'Honorific',
    reason: 'ambg-honorifics'
  }, // ==== FirstNames ====
  //is foo Smith
  {
    match: '#Copula [(#Noun|#PresentTense)] #LastName',
    group: 0,
    tag: 'FirstName',
    reason: 'copula-noun-lastname'
  }, //pope francis
  {
    match: '(lady|queen|sister) #ProperNoun',
    tag: 'FemaleName',
    reason: 'lady-titlecase',
    safe: true
  }, {
    match: '(king|pope|father) #ProperNoun',
    tag: 'MaleName',
    reason: 'pope-titlecase',
    safe: true
  }, //ambiguous-but-common firstnames
  {
    match: '[(will|may|april|june|said|rob|wade|ray|rusty|drew|miles|jack|chuck|randy|jan|pat|cliff|bill)] #LastName',
    group: 0,
    tag: 'FirstName',
    reason: 'maybe-lastname'
  }, // ==== Nickname ====
  // Dwayne 'the rock' Johnson
  {
    match: '#FirstName [#Determiner #Noun] #LastName',
    group: 0,
    tag: 'NickName',
    reason: 'first-noun-last'
  }, //my buddy
  {
    match: '#Possessive [#FirstName]',
    group: 0,
    tag: 'Person',
    reason: 'possessive-name'
  }, {
    match: '#ProperNoun (b|c|d|e|f|g|h|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z) #ProperNoun',
    tag: 'Person',
    reason: 'titlecase-acronym-titlecase',
    safe: true
  }, //ludwig van beethovan
  {
    match: '#Acronym #LastName',
    tag: 'Person',
    reason: 'acronym-latname',
    safe: true
  }, //jk rowling
  {
    match: '#Person (jr|sr|md)',
    tag: 'Person',
    reason: 'person-honorific'
  }, //peter II
  {
    match: '#Person #Person the? #RomanNumeral',
    tag: 'Person',
    reason: 'roman-numeral'
  }, //'Professor Fink', 'General McCarthy'
  {
    match: '#FirstName [/^[^aiurck]$/]',
    group: 0,
    tag: ['Acronym', 'Person'],
    reason: 'john-e'
  }, //Doctor john smith jr
  //general pearson
  {
    match: '#Honorific #Person',
    tag: 'Person',
    reason: 'honorific-person'
  }, //remove single 'mr'
  {
    match: '#Honorific #Acronym',
    tag: 'Person',
    reason: 'Honorific-TitleCase'
  }, //j.k Rowling
  {
    match: '#Noun van der? #Noun',
    tag: 'Person',
    reason: 'von der noun',
    safe: true
  }, //king of spain
  {
    match: '(king|queen|prince|saint|lady) of #Noun',
    tag: 'Person',
    reason: 'king-of-noun',
    safe: true
  }, //lady Florence
  {
    match: '(prince|lady) #Place',
    tag: 'Person',
    reason: 'lady-place'
  }, //saint Foo
  {
    match: '(king|queen|prince|saint) #ProperNoun',
    tag: 'Person',
    reason: 'saint-foo'
  }, //Foo U Ford
  {
    match: '[#ProperNoun] #Person',
    group: 0,
    tag: 'Person',
    reason: 'proper-person',
    safe: true
  }, // al sharpton
  {
    match: 'al (#Person|#ProperNoun)',
    tag: 'Person',
    reason: 'al-borlen',
    safe: true
  }, //ferdinand de almar
  {
    match: '#FirstName de #Noun',
    tag: 'Person',
    reason: 'bill-de-noun'
  }, //Osama bin Laden
  {
    match: '#FirstName (bin|al) #Noun',
    tag: 'Person',
    reason: 'bill-al-noun'
  }, //John L. Foo
  {
    match: '#FirstName #Acronym #ProperNoun',
    tag: 'Person',
    reason: 'bill-acronym-title'
  }, //Andrew Lloyd Webber
  {
    match: '#FirstName #FirstName #ProperNoun',
    tag: 'Person',
    reason: 'bill-firstname-title'
  }, //Mr Foo
  {
    match: '#Honorific #FirstName? #ProperNoun',
    tag: 'Person',
    reason: 'dr-john-Title'
  }, //peter the great
  {
    match: '#FirstName the #Adjective',
    tag: 'Person',
    reason: 'name-the-great'
  }, //very common-but-ambiguous lastnames
  {
    match: '#FirstName (green|white|brown|hall|young|king|hill|cook|gray|price)',
    tag: 'Person',
    reason: 'bill-green'
  }, // faith smith
  {
    match: "".concat(nouns$1, " #Person"),
    tag: 'Person',
    reason: 'ray-smith',
    safe: true
  }, // faith m. Smith
  {
    match: "".concat(nouns$1, " #Acronym? #ProperNoun"),
    tag: 'Person',
    reason: 'ray-a-smith',
    safe: true
  }, //give to april
  {
    match: "#Infinitive #Determiner? #Adjective? #Noun? (to|for) [".concat(months, "]"),
    group: 0,
    tag: 'Person',
    reason: 'ambig-person'
  }, // remind june
  {
    match: "#Infinitive [".concat(months, "]"),
    group: 0,
    tag: 'Person',
    reason: 'infinitive-person'
  }, // may waits for
  // { match: `[${months}] #PresentTense for`, group: 0, tag: 'Person', reason: 'ambig-active-for' },
  // may waits to
  // { match: `[${months}] #PresentTense to`, group: 0, tag: 'Person', reason: 'ambig-active-to' },
  // april will
  {
    match: "[".concat(months, "] #Modal"),
    group: 0,
    tag: 'Person',
    reason: 'ambig-modal'
  }, // may be
  {
    match: "[may] be",
    group: 0,
    tag: 'Verb',
    reason: 'may-be'
  }, // would april
  {
    match: "#Modal [".concat(months, "]"),
    group: 0,
    tag: 'Person',
    reason: 'modal-ambig'
  }, // it is may
  {
    match: "#Copula [".concat(months, "]"),
    group: 0,
    tag: 'Person',
    reason: 'is-may'
  }, // may is
  {
    match: "[".concat(months, "] #Copula"),
    group: 0,
    tag: 'Person',
    reason: 'may-is'
  }, // with april
  {
    match: "that [".concat(months, "]"),
    group: 0,
    tag: 'Person',
    reason: 'that-month'
  }, // with april
  {
    match: "with [".concat(months, "]"),
    group: 0,
    tag: 'Person',
    reason: 'with-month'
  }, // for april
  {
    match: "for [".concat(months, "]"),
    group: 0,
    tag: 'Person',
    reason: 'for-month'
  }, // this april
  {
    match: "this [".concat(months, "]"),
    group: 0,
    tag: 'Month',
    reason: 'this-may'
  }, //maybe not 'this'
  // next april
  {
    match: "next [".concat(months, "]"),
    group: 0,
    tag: 'Month',
    reason: 'next-may'
  }, // last april
  {
    match: "last [".concat(months, "]"),
    group: 0,
    tag: 'Month',
    reason: 'last-may'
  }, // wednesday april
  {
    match: "#Date [".concat(months, "]"),
    group: 0,
    tag: 'Month',
    reason: 'date-may'
  }, // may 5th
  {
    match: "[".concat(months, "] the? #Value"),
    group: 0,
    tag: 'Month',
    reason: 'may-5th'
  }, // 5th of may
  {
    match: "#Value of [".concat(months, "]"),
    group: 0,
    tag: 'Month',
    reason: '5th-of-may'
  }, // dick van dyke
  {
    match: '#ProperNoun (van|al|bin) #ProperNoun',
    tag: 'Person',
    reason: 'title-van-title',
    safe: true
  }, //jose de Sucre
  {
    match: '#ProperNoun (de|du) la? #ProperNoun',
    tag: 'Person',
    reason: 'title-de-title',
    safe: true
  }, //Jani K. Smith
  {
    match: '#Singular #Acronym #LastName',
    tag: '#Person',
    reason: 'title-acro-noun',
    safe: true
  }, //John Foo
  {
    match: '#FirstName (#Noun && #ProperNoun) #ProperNoun?',
    tag: 'Person',
    reason: 'firstname-titlecase'
  }, //Joe K. Sombrero
  {
    match: '#FirstName #Acronym #Noun',
    tag: 'Person',
    reason: 'n-acro-noun',
    safe: true
  }];
  var _10People = list$5;

  var matches = [];
  matches = matches.concat(_01Misc);
  matches = matches.concat(_02Dates);
  matches = matches.concat(_03Adjective);
  matches = matches.concat(_04Noun);
  matches = matches.concat(_05Adverb);
  matches = matches.concat(_06Value);
  matches = matches.concat(_07Verbs);
  matches = matches.concat(_08Place);
  matches = matches.concat(_09Org);
  matches = matches.concat(_10People); // cache the easier conditions up-front

  var cacheRequired$1 = function cacheRequired(reg) {
    var needTags = [];
    var needWords = [];
    reg.forEach(function (obj) {
      if (obj.optional === true || obj.negative === true) {
        return;
      }

      if (obj.tag !== undefined) {
        needTags.push(obj.tag);
      }

      if (obj.word !== undefined) {
        needWords.push(obj.word);
      }
    });
    return {
      tags: _unique(needTags),
      words: _unique(needWords)
    };
  };

  var allLists = function allLists(m) {
    var more = [];
    var lists = m.reg.filter(function (r) {
      return r.oneOf !== undefined;
    });

    if (lists.length === 1) {
      var i = m.reg.findIndex(function (r) {
        return r.oneOf !== undefined;
      });
      Object.keys(m.reg[i].oneOf).forEach(function (w) {
        var newM = Object.assign({}, m);
        newM.reg = newM.reg.slice(0);
        newM.reg[i] = Object.assign({}, newM.reg[i]);
        newM.reg[i].word = w;
        delete newM.reg[i].operator;
        delete newM.reg[i].oneOf;
        newM.reason += '-' + w;
        more.push(newM);
      });
    }

    return more;
  }; // parse them


  var all = [];
  matches.forEach(function (m) {
    m.reg = syntax_1(m.match);
    var enumerated = allLists(m);

    if (enumerated.length > 0) {
      all = all.concat(enumerated);
    } else {
      all.push(m);
    }
  });
  all.forEach(function (m) {
    m.required = cacheRequired$1(m.reg);
    return m;
  });
  var matches_1 = all;

  var hasEvery = function hasEvery(chances) {
    if (chances.length === 0) {
      return [];
    }

    var obj = {};
    chances.forEach(function (arr) {
      arr = _unique(arr);

      for (var i = 0; i < arr.length; i++) {
        obj[arr[i]] = obj[arr[i]] || 0;
        obj[arr[i]] += 1;
      }
    });
    var res = Object.keys(obj);
    res = res.filter(function (k) {
      return obj[k] === chances.length;
    });
    res = res.map(function (num) {
      return Number(num);
    });
    return res;
  };

  var runner = function runner(doc) {
    //find phrases to try for each match
    matches_1.forEach(function (m) {
      var allChances = [];
      m.required.words.forEach(function (w) {
        allChances.push(doc._cache.words[w] || []);
      });
      m.required.tags.forEach(function (tag) {
        allChances.push(doc._cache.tags[tag] || []);
      });
      var worthIt = hasEvery(allChances);

      if (worthIt.length === 0) {
        return;
      }

      var phrases = worthIt.map(function (index) {
        return doc.list[index];
      });
      var tryDoc = doc.buildFrom(phrases); // phrases getting tagged

      var match = tryDoc.match(m.reg, m.group);

      if (match.found) {
        if (m.safe === true) {
          match.tagSafe(m.tag, m.reason);
        } else {
          match.tag(m.tag, m.reason);
        }
      }
    });
  };

  var runner_1 = runner; // console.log(hasEvery([[1, 2, 2, 3], [2, 3], []]))

  // misc: 40ms
  //sequence of match-tag statements to correct mis-tags

  var corrections = function corrections(doc) {
    runner_1(doc);
    fixMisc(doc);
    return doc;
  };

  var _04Correction = corrections;

  /** POS-tag all terms in this document */

  var tagger = function tagger(doc) {
    var terms = doc.termList(); // check against any known-words

    doc = _01Init(doc, terms); // everything has gotta be something. ¯\_(:/)_/¯

    doc = _02Fallbacks(doc, terms); // support "didn't" & "spencer's"

    doc = _03Contractions(doc); //set our cache, to speed things up

    doc.cache(); // wiggle-around the results, so they make more sense

    doc = _04Correction(doc); // remove our cache, as it's invalidated now

    doc.uncache(); // run any user-given tagger functions

    doc.world.taggers.forEach(function (fn) {
      fn(doc);
    });
    return doc;
  };

  var _02Tagger = tagger;

  var addMethod = function addMethod(Doc) {
    /**  */
    var Abbreviations = /*#__PURE__*/function (_Doc) {
      _inherits(Abbreviations, _Doc);

      var _super = _createSuper(Abbreviations);

      function Abbreviations() {
        _classCallCheck(this, Abbreviations);

        return _super.apply(this, arguments);
      }

      _createClass(Abbreviations, [{
        key: "stripPeriods",
        value: function stripPeriods() {
          this.termList().forEach(function (t) {
            if (t.tags.Abbreviation === true && t.next) {
              t.post = t.post.replace(/^\./, '');
            }

            var str = t.text.replace(/\./, '');
            t.set(str);
          });
          return this;
        }
      }, {
        key: "addPeriods",
        value: function addPeriods() {
          this.termList().forEach(function (t) {
            t.post = t.post.replace(/^\./, '');
            t.post = '.' + t.post;
          });
          return this;
        }
      }]);

      return Abbreviations;
    }(Doc);

    Abbreviations.prototype.unwrap = Abbreviations.prototype.stripPeriods;

    Doc.prototype.abbreviations = function (n) {
      var match = this.match('#Abbreviation');

      if (typeof n === 'number') {
        match = match.get(n);
      }

      return new Abbreviations(match.list, this, this.world);
    };

    return Doc;
  };

  var Abbreviations = addMethod;

  var hasPeriod = /\./;

  var addMethod$1 = function addMethod(Doc) {
    /**  */
    var Acronyms = /*#__PURE__*/function (_Doc) {
      _inherits(Acronyms, _Doc);

      var _super = _createSuper(Acronyms);

      function Acronyms() {
        _classCallCheck(this, Acronyms);

        return _super.apply(this, arguments);
      }

      _createClass(Acronyms, [{
        key: "stripPeriods",
        value: function stripPeriods() {
          this.termList().forEach(function (t) {
            var str = t.text.replace(/\./g, '');
            t.set(str);
          });
          return this;
        }
      }, {
        key: "addPeriods",
        value: function addPeriods() {
          this.termList().forEach(function (t) {
            var str = t.text.replace(/\./g, '');
            str = str.split('').join('.'); // don't add a end-period if there's a sentence-end one

            if (hasPeriod.test(t.post) === false) {
              str += '.';
            }

            t.set(str);
          });
          return this;
        }
      }]);

      return Acronyms;
    }(Doc);

    Acronyms.prototype.unwrap = Acronyms.prototype.stripPeriods;
    Acronyms.prototype.strip = Acronyms.prototype.stripPeriods;

    Doc.prototype.acronyms = function (n) {
      var match = this.match('#Acronym');

      if (typeof n === 'number') {
        match = match.get(n);
      }

      return new Acronyms(match.list, this, this.world);
    };

    return Doc;
  };

  var Acronyms = addMethod$1;

  var addMethod$2 = function addMethod(Doc) {
    /** split into approximate sub-sentence phrases */
    Doc.prototype.clauses = function (n) {
      // an awkward way to disambiguate a comma use
      var commas = this["if"]('@hasComma').notIf('@hasComma @hasComma') //fun, cool...
      .notIf('@hasComma . .? (and|or) .') //cool, and fun
      .notIf('(#City && @hasComma) #Country') //'toronto, canada'
      .notIf('(#WeekDay && @hasComma) #Date') //'tuesday, march 2nd'
      .notIf('(#Date && @hasComma) #Year') //'july 6, 1992'
      .notIf('@hasComma (too|also)$') //at end of sentence
      .match('@hasComma');
      var found = this.splitAfter(commas);
      var quotes = found.quotations();
      found = found.splitOn(quotes);
      var parentheses = found.parentheses();
      found = found.splitOn(parentheses); // it is cool and it is ..

      var conjunctions = found["if"]('#Copula #Adjective #Conjunction (#Pronoun|#Determiner) #Verb').match('#Conjunction');
      found = found.splitBefore(conjunctions); // if it is this then that

      var condition = found["if"]('if .{2,9} then .').match('then');
      found = found.splitBefore(condition); // misc clause partitions

      found = found.splitBefore('as well as .');
      found = found.splitBefore('such as .');
      found = found.splitBefore('in addition to .'); // semicolons, dashes

      found = found.splitAfter('@hasSemicolon');
      found = found.splitAfter('@hasDash'); // passive voice verb - '.. which was robbed is empty'
      // let passive = found.match('#Noun (which|that) (was|is) #Adverb? #PastTense #Adverb?')
      // if (passive.found) {
      //   found = found.splitAfter(passive)
      // }
      // //which the boy robbed
      // passive = found.match('#Noun (which|that) the? #Noun+ #Adverb? #PastTense #Adverb?')
      // if (passive.found) {
      //   found = found.splitAfter(passive)
      // }
      // does there appear to have relative/subordinate clause still?

      var tooLong = found.filter(function (d) {
        return d.wordCount() > 5 && d.match('#Verb+').length >= 2;
      });

      if (tooLong.found) {
        var m = tooLong.splitAfter('#Noun .* #Verb .* #Noun+');
        found = found.splitOn(m.eq(0));
      }

      if (typeof n === 'number') {
        found = found.get(n);
      }

      return new Doc(found.list, this, this.world);
    };

    return Doc;
  };

  var Clauses = addMethod$2;

  var addMethod$3 = function addMethod(Doc) {
    /**  */
    var Contractions = /*#__PURE__*/function (_Doc) {
      _inherits(Contractions, _Doc);

      var _super = _createSuper(Contractions);

      function Contractions(list, from, world) {
        var _this;

        _classCallCheck(this, Contractions);

        _this = _super.call(this, list, from, world);
        _this.contracted = null;
        return _this;
      }
      /** turn didn't into 'did not' */


      _createClass(Contractions, [{
        key: "expand",
        value: function expand() {
          this.list.forEach(function (p) {
            var terms = p.terms(); //change the case?

            var isTitlecase = terms[0].isTitleCase();
            terms.forEach(function (t, i) {
              //use the implicit text
              t.set(t.implicit || t.text);
              t.implicit = undefined; //add whitespace

              if (i < terms.length - 1 && t.post === '') {
                t.post += ' ';
              }
            }); //set titlecase

            if (isTitlecase) {
              terms[0].toTitleCase();
            }
          });
          return this;
        }
      }]);

      return Contractions;
    }(Doc); //find contractable, expanded-contractions
    // const findExpanded = r => {
    //   let remain = r.not('#Contraction')
    //   let m = remain.match('(#Noun|#QuestionWord) (#Copula|did|do|have|had|could|would|will)')
    //   m.concat(remain.match('(they|we|you|i) have'))
    //   m.concat(remain.match('i am'))
    //   m.concat(remain.match('(#Copula|#Modal|do|does|have|has|can|will) not'))
    //   return m
    // }


    Doc.prototype.contractions = function (n) {
      //find currently-contracted
      var found = this.match('@hasContraction+'); //(may want to split these up)
      //todo: split consecutive contractions

      if (typeof n === 'number') {
        found = found.get(n);
      }

      return new Contractions(found.list, this, this.world);
    }; //aliases


    Doc.prototype.expanded = Doc.prototype.isExpanded;
    Doc.prototype.contracted = Doc.prototype.isContracted;
    return Doc;
  };

  var Contractions = addMethod$3;

  var addMethod$4 = function addMethod(Doc) {
    //pull it apart..
    var parse = function parse(doc) {
      var things = doc.splitAfter('@hasComma').splitOn('(and|or) not?').not('(and|or) not?');
      var beforeLast = doc.match('[.] (and|or)', 0);
      return {
        things: things,
        conjunction: doc.match('(and|or) not?'),
        beforeLast: beforeLast,
        hasOxford: beforeLast.has('@hasComma')
      };
    };
    /** cool, fun, and nice */


    var Lists = /*#__PURE__*/function (_Doc) {
      _inherits(Lists, _Doc);

      var _super = _createSuper(Lists);

      function Lists() {
        _classCallCheck(this, Lists);

        return _super.apply(this, arguments);
      }

      _createClass(Lists, [{
        key: "conjunctions",

        /** coordinating conjunction */
        value: function conjunctions() {
          return this.match('(and|or)');
        }
        /** split-up by list object */

      }, {
        key: "parts",
        value: function parts() {
          return this.splitAfter('@hasComma').splitOn('(and|or) not?');
        }
        /** remove the conjunction */

      }, {
        key: "items",
        value: function items() {
          return parse(this).things;
        }
        /** add a new unit to the list */

      }, {
        key: "add",
        value: function add(str) {
          this.forEach(function (p) {
            var beforeLast = parse(p).beforeLast;
            beforeLast.append(str); //add a comma to it

            beforeLast.termList(0).addPunctuation(',');
          });
          return this;
        }
        /** remove any matching unit from the list */

      }, {
        key: "remove",
        value: function remove(match) {
          return this.items()["if"](match).remove();
        }
        /** return only lists that use a serial comma */

      }, {
        key: "hasOxfordComma",
        value: function hasOxfordComma() {
          return this.filter(function (doc) {
            return parse(doc).hasOxford;
          });
        }
      }, {
        key: "addOxfordComma",
        value: function addOxfordComma() {
          var items = this.items();
          var needsComma = items.eq(items.length - 2);

          if (needsComma.found && needsComma.has('@hasComma') === false) {
            needsComma.post(', ');
          }

          return this;
        }
      }, {
        key: "removeOxfordComma",
        value: function removeOxfordComma() {
          var items = this.items();
          var needsComma = items.eq(items.length - 2);

          if (needsComma.found && needsComma.has('@hasComma') === true) {
            needsComma.post(' ');
          }

          return this;
        }
      }]);

      return Lists;
    }(Doc); // aliases


    Lists.prototype.things = Lists.prototype.items;

    Doc.prototype.lists = function (n) {
      var m = this["if"]('@hasComma+ .? (and|or) not? .'); // person-list

      var nounList = m.match('(#Noun|#Adjective|#Determiner|#Article)+ #Conjunction not? (#Article|#Determiner)? #Adjective? #Noun+')["if"]('#Noun');
      var adjList = m.match('(#Adjective|#Adverb)+ #Conjunction not? #Adverb? #Adjective+');
      var verbList = m.match('(#Verb|#Adverb)+ #Conjunction not? #Adverb? #Verb+');
      var result = nounList.concat(adjList);
      result = result.concat(verbList);
      result = result["if"]('@hasComma');

      if (typeof n === 'number') {
        result = m.get(n);
      }

      return new Lists(result.list, this, this.world);
    };

    return Doc;
  };

  var Lists = addMethod$4;

  var noPlural = '(#Pronoun|#Place|#Value|#Person|#Uncountable|#Month|#WeekDay|#Holiday|#Possessive)'; //certain words can't be plural, like 'peace'

  var hasPlural = function hasPlural(doc) {
    if (doc.has('#Plural') === true) {
      return true;
    } // these can't be plural


    if (doc.has(noPlural) === true) {
      return false;
    }

    return true;
  };

  var hasPlural_1 = hasPlural;

  var irregulars$5 = {
    hour: 'an',
    heir: 'an',
    heirloom: 'an',
    honest: 'an',
    honour: 'an',
    honor: 'an',
    uber: 'an' //german u

  }; //pronounced letters of acronyms that get a 'an'

  var an_acronyms = {
    a: true,
    e: true,
    f: true,
    h: true,
    i: true,
    l: true,
    m: true,
    n: true,
    o: true,
    r: true,
    s: true,
    x: true
  }; //'a' regexes

  var a_regexs = [/^onc?e/i, //'wu' sound of 'o'
  /^u[bcfhjkqrstn][aeiou]/i, // 'yu' sound for hard 'u'
  /^eul/i];

  var makeArticle = function makeArticle(doc) {
    //no 'the john smith', but 'a london hotel'
    if (doc.has('#Person') || doc.has('#Place')) {
      return '';
    } //no a/an if it's plural


    if (doc.has('#Plural')) {
      return 'the';
    }

    var str = doc.text('normal').trim(); //explicit irregular forms

    if (irregulars$5.hasOwnProperty(str)) {
      return irregulars$5[str];
    } //spelled-out acronyms


    var firstLetter = str.substr(0, 1);

    if (doc.has('^@isAcronym') && an_acronyms.hasOwnProperty(firstLetter)) {
      return 'an';
    } //'a' regexes


    for (var i = 0; i < a_regexs.length; i++) {
      if (a_regexs[i].test(str)) {
        return 'a';
      }
    } //basic vowel-startings


    if (/^[aeiou]/i.test(str)) {
      return 'an';
    }

    return 'a';
  };

  var getArticle = makeArticle;

  //similar to plural/singularize rules, but not the same
  var isPlural$1 = [/(antenn|formul|nebul|vertebr|vit)ae$/i, /(octop|vir|radi|nucle|fung|cact|stimul)i$/i, /men$/i, /.tia$/i, /(m|l)ice$/i]; //similar to plural/singularize rules, but not the same

  var isSingular$1 = [/(ax|test)is$/i, /(octop|vir|radi|nucle|fung|cact|stimul)us$/i, /(octop|vir)i$/i, /(rl)f$/i, /(alias|status)$/i, /(bu)s$/i, /(al|ad|at|er|et|ed|ad)o$/i, /(ti)um$/i, /(ti)a$/i, /sis$/i, /(?:(^f)fe|(lr)f)$/i, /hive$/i, /(^aeiouy|qu)y$/i, /(x|ch|ss|sh|z)$/i, /(matr|vert|ind|cort)(ix|ex)$/i, /(m|l)ouse$/i, /(m|l)ice$/i, /(antenn|formul|nebul|vertebr|vit)a$/i, /.sis$/i, /^(?!talis|.*hu)(.*)man$/i];
  var _rules$2 = {
    isSingular: isSingular$1,
    isPlural: isPlural$1
  };

  var endS = /s$/; // double-check this term, if it is not plural, or singular.
  // (this is a partial copy of ./tagger/fallbacks/plural)
  // fallback plural if it ends in an 's'.

  var isPlural$2 = function isPlural(str) {
    // isSingular suffix rules
    if (_rules$2.isSingular.find(function (reg) {
      return reg.test(str);
    })) {
      return false;
    } // does it end in an s?


    if (endS.test(str) === true) {
      return true;
    } // is it a plural like 'fungi'?


    if (_rules$2.isPlural.find(function (reg) {
      return reg.test(str);
    })) {
      return true;
    }

    return null;
  };

  var isPlural_1$1 = isPlural$2;

  var exceptions = {
    he: 'his',
    she: 'hers',
    they: 'theirs',
    we: 'ours',
    i: 'mine',
    you: 'yours',
    her: 'hers',
    their: 'theirs',
    our: 'ours',
    my: 'mine',
    your: 'yours'
  }; // turn "David" to "David's"

  var toPossessive = function toPossessive(doc) {
    var str = doc.text('text').trim(); // exceptions

    if (exceptions.hasOwnProperty(str)) {
      doc.replaceWith(exceptions[str], true);
      doc.tag('Possessive', 'toPossessive');
      return;
    } // flanders'


    if (/s$/.test(str)) {
      str += "'";
      doc.replaceWith(str, true);
      doc.tag('Possessive', 'toPossessive');
      return;
    } //normal form:


    str += "'s";
    doc.replaceWith(str, true);
    doc.tag('Possessive', 'toPossessive');
    return;
  };

  var toPossessive_1 = toPossessive;

  // .nouns() supports some noun-phrase-ish groupings
  // pull these apart, if necessary
  var parse$1 = function parse(doc) {
    var res = {
      main: doc
    }; //support 'mayor of chicago' as one noun-phrase

    if (doc.has('#Noun (of|by|for) .')) {
      var m = doc.splitAfter('[#Noun+]', 0);
      res.main = m.eq(0);
      res.post = m.eq(1);
    }

    return res;
  };

  var parse_1 = parse$1;

  var methods$6 = {
    /** overload the original json with noun information */
    json: function json(options) {
      var n = null;

      if (typeof options === 'number') {
        n = options;
        options = null;
      }

      options = options || {
        text: true,
        normal: true,
        trim: true,
        terms: true
      };
      var res = [];
      this.forEach(function (doc) {
        var json = doc.json(options)[0];
        json.article = getArticle(doc);
        res.push(json);
      });

      if (n !== null) {
        return res[n];
      }

      return res;
    },

    /** get all adjectives describing this noun*/
    adjectives: function adjectives() {
      var list = this.lookAhead('^(that|who|which)? (was|is|will)? be? #Adverb? #Adjective+');
      list = list.concat(this.lookBehind('#Adjective+ #Adverb?$'));
      list = list.match('#Adjective');
      return list.sort('index');
    },
    isPlural: function isPlural() {
      return this["if"]('#Plural'); //assume tagger has run?
    },
    hasPlural: function hasPlural() {
      return this.filter(function (d) {
        return hasPlural_1(d);
      });
    },
    toPlural: function toPlural(agree) {
      var _this = this;

      var toPlural = this.world.transforms.toPlural;
      this.forEach(function (doc) {
        if (doc.has('#Plural') || hasPlural_1(doc) === false) {
          return;
        } // double-check it isn't an un-tagged plural


        var main = parse_1(doc).main;
        var str = main.text('reduced');

        if (!main.has('#Singular') && isPlural_1$1(str) === true) {
          return;
        }

        str = toPlural(str, _this.world);
        main.replace(str).tag('#Plural'); // 'an apple' -> 'apples'

        if (agree) {
          var an = main.lookBefore('(an|a) #Adjective?$').not('#Adjective');

          if (an.found === true) {
            an.remove();
          }
        }
      });
      return this;
    },
    toSingular: function toSingular(agree) {
      var _this2 = this;

      var toSingular = this.world.transforms.toSingular;
      this.forEach(function (doc) {
        if (doc.has('^#Singular+$') || hasPlural_1(doc) === false) {
          return;
        } // double-check it isn't an un-tagged plural


        var main = parse_1(doc).main;
        var str = main.text('reduced');

        if (!main.has('#Plural') && isPlural_1$1(str) !== true) {
          return;
        }

        str = toSingular(str, _this2.world);
        main.replace(str).tag('#Singular'); // add an article

        if (agree) {
          // 'apples' -> 'an apple'
          var start = doc;
          var adj = doc.lookBefore('#Adjective');

          if (adj.found) {
            start = adj;
          }

          var article = getArticle(start);
          start.insertBefore(article);
        }
      });
      return this;
    },
    toPossessive: function toPossessive() {
      this.forEach(function (d) {
        toPossessive_1(d);
      });
      return this;
    }
  };
  var methods_1 = methods$6;

  var addMethod$5 = function addMethod(Doc) {
    /**  */
    var Nouns = /*#__PURE__*/function (_Doc) {
      _inherits(Nouns, _Doc);

      var _super = _createSuper(Nouns);

      function Nouns() {
        _classCallCheck(this, Nouns);

        return _super.apply(this, arguments);
      }

      return Nouns;
    }(Doc); // add-in our methods


    Object.assign(Nouns.prototype, methods_1);

    Doc.prototype.nouns = function (n) {
      var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      // don't split 'paris, france'
      var keep = this.match('(#City && @hasComma) (#Region|#Country)'); // but split the other commas

      var m = this.not(keep).splitAfter('@hasComma'); // combine them back together

      m = m.concat(keep); // don't combine over scare-quotes

      var quotes = m.quotations();

      if (quotes.found) {
        m = m.splitOn(quotes.eq(0));
      }

      m = m.match('#Noun+ (of|by)? the? #Noun+?'); //nouns that we don't want in these results, for weird reasons

      if (opts.keep_anaphora !== true) {
        m = m.not('#Pronoun');
        m = m.not('(there|these)');
        m = m.not('(#Month|#WeekDay)'); //allow Durations, Holidays
        // //allow possessives like "spencer's", but not generic ones like,

        m = m.not('(my|our|your|their|her|his)');
      }

      m = m.not('(of|for|by|the)$');

      if (typeof n === 'number') {
        m = m.get(n);
      }

      return new Nouns(m.list, this, this.world);
    };

    return Doc;
  };

  var Nouns = addMethod$5;

  var open = /\(/;
  var close = /\)/;

  var addMethod$6 = function addMethod(Doc) {
    /** anything between (these things) */
    var Parentheses = /*#__PURE__*/function (_Doc) {
      _inherits(Parentheses, _Doc);

      var _super = _createSuper(Parentheses);

      function Parentheses() {
        _classCallCheck(this, Parentheses);

        return _super.apply(this, arguments);
      }

      _createClass(Parentheses, [{
        key: "unwrap",

        /** remove the parentheses characters */
        value: function unwrap() {
          this.list.forEach(function (p) {
            var first = p.terms(0);
            first.pre = first.pre.replace(open, '');
            var last = p.lastTerm();
            last.post = last.post.replace(close, '');
          });
          return this;
        }
      }]);

      return Parentheses;
    }(Doc);

    Doc.prototype.parentheses = function (n) {
      var list = [];
      this.list.forEach(function (p) {
        var terms = p.terms(); //look for opening brackets

        for (var i = 0; i < terms.length; i += 1) {
          var t = terms[i];

          if (open.test(t.pre)) {
            //look for the closing bracket..
            for (var o = i; o < terms.length; o += 1) {
              if (close.test(terms[o].post)) {
                var len = o - i + 1;
                list.push(p.buildFrom(t.id, len));
                i = o;
                break;
              }
            }
          }
        }
      }); //support nth result

      if (typeof n === 'number') {
        if (list[n]) {
          list = [list[n]];
        } else {
          list = [];
        }

        return new Parentheses(list, this, this.world);
      }

      return new Parentheses(list, this, this.world);
    };

    return Doc;
  };

  var Parentheses = addMethod$6;

  var addMethod$7 = function addMethod(Doc) {
    /**  */
    var Possessives = /*#__PURE__*/function (_Doc) {
      _inherits(Possessives, _Doc);

      var _super = _createSuper(Possessives);

      function Possessives(list, from, world) {
        var _this;

        _classCallCheck(this, Possessives);

        _this = _super.call(this, list, from, world);
        _this.contracted = null;
        return _this;
      }
      /** turn didn't into 'did not' */


      _createClass(Possessives, [{
        key: "strip",
        value: function strip() {
          this.list.forEach(function (p) {
            var terms = p.terms();
            terms.forEach(function (t) {
              var str = t.text.replace(/'s$/, '');
              t.set(str || t.text);
            });
          });
          return this;
        }
      }]);

      return Possessives;
    }(Doc); //find contractable, expanded-contractions
    // const findExpanded = r => {
    //   let remain = r.not('#Contraction')
    //   let m = remain.match('(#Noun|#QuestionWord) (#Copula|did|do|have|had|could|would|will)')
    //   m.concat(remain.match('(they|we|you|i) have'))
    //   m.concat(remain.match('i am'))
    //   m.concat(remain.match('(#Copula|#Modal|do|does|have|has|can|will) not'))
    //   return m
    // }


    Doc.prototype.possessives = function (n) {
      //find currently-contracted
      var found = this.match('#Noun+? #Possessive'); //todo: split consecutive contractions

      if (typeof n === 'number') {
        found = found.get(n);
      }

      return new Possessives(found.list, this, this.world);
    };

    return Doc;
  };

  var Possessives = addMethod$7;

  var pairs = {
    "\"": "\"",
    // 'StraightDoubleQuotes'
    "\uFF02": "\uFF02",
    // 'StraightDoubleQuotesWide'
    "'": "'",
    // 'StraightSingleQuotes'
    "\u201C": "\u201D",
    // 'CommaDoubleQuotes'
    "\u2018": "\u2019",
    // 'CommaSingleQuotes'
    "\u201F": "\u201D",
    // 'CurlyDoubleQuotesReversed'
    "\u201B": "\u2019",
    // 'CurlySingleQuotesReversed'
    "\u201E": "\u201D",
    // 'LowCurlyDoubleQuotes'
    "\u2E42": "\u201D",
    // 'LowCurlyDoubleQuotesReversed'
    "\u201A": "\u2019",
    // 'LowCurlySingleQuotes'
    "\xAB": "\xBB",
    // 'AngleDoubleQuotes'
    "\u2039": "\u203A",
    // 'AngleSingleQuotes'
    // Prime 'non quotation'
    "\u2035": "\u2032",
    // 'PrimeSingleQuotes'
    "\u2036": "\u2033",
    // 'PrimeDoubleQuotes'
    "\u2037": "\u2034",
    // 'PrimeTripleQuotes'
    // Prime 'quotation' variation
    "\u301D": "\u301E",
    // 'PrimeDoubleQuotes'
    "`": "\xB4",
    // 'PrimeSingleQuotes'
    "\u301F": "\u301E" // 'LowPrimeDoubleQuotesReversed'

  };
  var hasOpen = RegExp('(' + Object.keys(pairs).join('|') + ')');

  var addMethod$8 = function addMethod(Doc) {
    /** "these things" */
    var Quotations = /*#__PURE__*/function (_Doc) {
      _inherits(Quotations, _Doc);

      var _super = _createSuper(Quotations);

      function Quotations() {
        _classCallCheck(this, Quotations);

        return _super.apply(this, arguments);
      }

      _createClass(Quotations, [{
        key: "unwrap",

        /** remove the quote characters */
        value: function unwrap() {
          return this;
        }
      }]);

      return Quotations;
    }(Doc);

    Doc.prototype.quotations = function (n) {
      var list = [];
      this.list.forEach(function (p) {
        var terms = p.terms(); //look for opening quotes

        for (var i = 0; i < terms.length; i += 1) {
          var t = terms[i];

          if (hasOpen.test(t.pre)) {
            var _char = (t.pre.match(hasOpen) || [])[0];
            var want = pairs[_char]; // if (!want) {
            //   console.warn('missing quote char ' + char)
            // }
            //look for the closing bracket..

            for (var o = i; o < terms.length; o += 1) {
              if (terms[o].post.indexOf(want) !== -1) {
                var len = o - i + 1;
                list.push(p.buildFrom(t.id, len));
                i = o;
                break;
              }
            }
          }
        }
      }); //support nth result

      if (typeof n === 'number') {
        if (list[n]) {
          list = [list[n]];
        } else {
          list = [];
        }

        return new Quotations(list, this, this.world);
      }

      return new Quotations(list, this, this.world);
    }; // alias


    Doc.prototype.quotes = Doc.prototype.quotations;
    return Doc;
  };

  var Quotations = addMethod$8;

  // walked => walk  - turn a verb into it's root form
  var toInfinitive$1 = function toInfinitive(parsed, world) {
    var verb = parsed.verb; // console.log(parsed)
    // verb.debug()
    //1. if it's already infinitive

    var str = verb.text('reduced');

    if (verb.has('#Infinitive')) {
      return str;
    } // 2. world transform does the heavy-lifting


    var tense = null;

    if (verb.has('#PastTense')) {
      tense = 'PastTense';
    } else if (verb.has('#Gerund')) {
      tense = 'Gerund';
    } else if (verb.has('#PresentTense')) {
      tense = 'PresentTense';
    } else if (verb.has('#Participle')) {
      tense = 'Participle';
    } else if (verb.has('#Actor')) {
      tense = 'Actor';
    }

    return world.transforms.toInfinitive(str, world, tense);
  };

  var toInfinitive_1$1 = toInfinitive$1;

  // spencer walks -> singular
  // we walk -> plural
  // the most-recent noun-phrase, before this verb.
  var findNoun = function findNoun(vb) {
    var noun = vb.lookBehind('#Noun+').last();
    return noun;
  }; //sometimes you can tell if a verb is plural/singular, just by the verb
  // i am / we were
  // othertimes you need its subject 'we walk' vs 'i walk'


  var isPlural$3 = function isPlural(parsed) {
    var vb = parsed.verb;

    if (vb.has('(are|were|does)') || parsed.auxiliary.has('(are|were|does)')) {
      return true;
    }

    if (vb.has('(is|am|do|was)') || parsed.auxiliary.has('(is|am|do|was)')) {
      return false;
    } //consider its prior noun


    var noun = findNoun(vb);

    if (noun.has('(we|they|you)')) {
      return true;
    }

    if (noun.has('#Plural')) {
      return true;
    }

    if (noun.has('#Singular')) {
      return false;
    }

    return null;
  };

  var isPlural_1$2 = isPlural$3;

  // #Copula : is           -> 'is not'
  // #PastTense : walked    -> did not walk
  // #PresentTense : walks  -> does not walk
  // #Gerund : walking:     -> not walking
  // #Infinitive : walk     -> do not walk

  var toNegative = function toNegative(parsed, world) {
    var vb = parsed.verb; // if it's already negative...

    if (parsed.negative.found) {
      return;
    } // would walk -> would not walk


    if (parsed.auxiliary.found) {
      parsed.auxiliary.eq(0).append('not'); // 'would not have' ➔ 'would not have'

      if (parsed.auxiliary.has('#Modal have not')) {
        parsed.auxiliary.replace('have not', 'not have');
      }

      return;
    } // is walking -> is not walking


    if (vb.has('(#Copula|will|has|had|do)')) {
      vb.append('not');
      return;
    } // walked -> did not walk


    if (vb.has('#PastTense')) {
      var inf = toInfinitive_1$1(parsed, world);
      vb.replaceWith(inf, true);
      vb.prepend('did not');
      return;
    } // walks -> does not walk


    if (vb.has('#PresentTense')) {
      var _inf = toInfinitive_1$1(parsed, world);

      vb.replaceWith(_inf, true);

      if (isPlural_1$2(parsed)) {
        vb.prepend('do not');
      } else {
        vb.prepend('does not');
      }

      return;
    } //walking -> not walking


    if (vb.has('#Gerund')) {
      var _inf2 = toInfinitive_1$1(parsed, world);

      vb.replaceWith(_inf2, true);
      vb.prepend('not');
      return;
    } //fallback 1:  walk -> does not walk


    if (isPlural_1$2(parsed)) {
      vb.prepend('does not');
      return;
    } //fallback 2:  walk -> do not walk


    vb.prepend('do not');
    return;
  };

  var toNegative_1 = toNegative;

  // who/what is doing this verb?
  // get the prior verb most-likely doing this action
  // (it can not-exist - 'close the door')
  var getSubject = function getSubject(vb) {
    var behind = vb.lookBehind();
    var lastNoun = behind.nouns(null, {
      keep_anaphora: true
    }).last(); // support 'that' and 'this'

    if (!lastNoun.found) {
      lastNoun = behind.match('(that|this|each)').last();
      lastNoun = lastNoun.tag('#Noun').nouns();
    }

    return lastNoun;
  };

  var getSubject_1 = getSubject;

  var parseVerb = function parseVerb(vb) {
    var parsed = {
      adverb: vb.match('#Adverb+'),
      // 'really'
      negative: vb.match('#Negative'),
      // 'not'
      auxiliary: vb.match('#Auxiliary+').not('(#Negative|#Adverb)'),
      // 'will' of 'will go'
      particle: vb.match('#Particle'),
      // 'up' of 'pull up'
      verb: vb.match('#Verb+').not('(#Adverb|#Negative|#Auxiliary|#Particle)'),
      original: vb,
      subject: getSubject_1(vb)
    }; // fallback, if no verb found

    if (!parsed.verb.found) {
      // blank-everything
      Object.keys(parsed).forEach(function (k) {
        parsed[k] = parsed[k].not('.');
      }); // it's all the verb

      parsed.verb = vb;
      return parsed;
    } //


    if (parsed.adverb && parsed.adverb.found) {
      var match = parsed.adverb.text('reduced') + '$';

      if (vb.has(match)) {
        parsed.adverbAfter = true;
      }
    }

    return parsed;
  };

  var parse$2 = parseVerb;

  /** too many special cases for is/was/will be*/

  var toBe = function toBe(parsed) {
    var isI = false;
    var plural = isPlural_1$2(parsed);
    var isNegative = parsed.negative.found; //account for 'i is' -> 'i am' irregular
    // if (vb.parent && vb.parent.has('i #Adverb? #Copula')) {
    //   isI = true;
    // }
    // 'i look', not 'i looks'

    if (parsed.verb.lookBehind('(i|we) (#Adverb|#Verb)?$').found) {
      isI = true;
    }

    var obj = {
      PastTense: 'was',
      PresentTense: 'is',
      FutureTense: 'will be',
      Infinitive: 'is',
      Gerund: 'being',
      Actor: '',
      PerfectTense: 'been',
      Pluperfect: 'been'
    }; //"i is" -> "i am"

    if (isI === true) {
      obj.PresentTense = 'am';
      obj.Infinitive = 'am';
    }

    if (plural) {
      obj.PastTense = 'were';
      obj.PresentTense = 'are';
      obj.Infinitive = 'are';
    }

    if (isNegative) {
      obj.PastTense += ' not';
      obj.PresentTense += ' not';
      obj.FutureTense = 'will not be';
      obj.Infinitive += ' not';
      obj.PerfectTense = 'not ' + obj.PerfectTense;
      obj.Pluperfect = 'not ' + obj.Pluperfect;
      obj.Gerund = 'not ' + obj.Gerund;
    }

    return obj;
  };

  var toBe_1 = toBe;

  // 'may/could/should' -> 'may/could/should have'
  var doModal = function doModal(parsed) {
    var str = parsed.verb.text();
    var res = {
      PastTense: str + ' have',
      PresentTense: str,
      FutureTense: str,
      Infinitive: str // Gerund: ,
      // Actor: '',
      // PerfectTense: '',
      // Pluperfect: '',

    };
    return res;
  };

  var doModal_1 = doModal;

  var conjugate$2 = function conjugate(parsed, world) {
    var verb = parsed.verb; //special handling of 'is', 'will be', etc.

    if (verb.has('#Copula') || verb.out('normal') === 'be' && parsed.auxiliary.has('will')) {
      return toBe_1(parsed);
    } // special handling of 'are walking'


    if (parsed.auxiliary.has('are') && verb.has('#Gerund')) {
      var og = parsed.original.clone();
      var past = og.clone().replace('are', 'were');
      var fut = og.clone().replace('are', 'will be');

      var _infinitive = toInfinitive_1$1(parsed, world);

      var res = {
        PastTense: past.text(),
        PresentTense: og.text(),
        FutureTense: fut.text(),
        Infinitive: _infinitive
      };
      return res;
    } // special handling of 'he could.'


    if (verb.has('#Modal')) {
      return doModal_1(parsed);
    } // dont conjugate imperative form - 'close the door'
    // if (parsed.auxiliary.has('do')) {
    //   let str = parsed.original.text()
    //   let res = {
    //     PastTense: str,
    //     PresentTense: str,
    //     FutureTense: str,
    //     Infinitive: str,
    //   }
    //   return res
    // }


    var hasHyphen = parsed.verb.termList(0).hasHyphen();
    var infinitive = toInfinitive_1$1(parsed, world);

    if (!infinitive) {
      return {};
    }

    var forms = world.transforms.conjugate(infinitive, world);
    forms.Infinitive = infinitive; // add particle to phrasal verbs ('fall over')

    if (parsed.particle.found) {
      var particle = parsed.particle.text();
      var space = hasHyphen === true ? '-' : ' ';
      Object.keys(forms).forEach(function (k) {
        return forms[k] += space + particle;
      });
    } //put the adverb at the end?
    // if (parsed.adverb.found) {
    // let adverb = parsed.adverb.text()
    // let space = hasHyphen === true ? '-' : ' '
    // if (parsed.adverbAfter === true) {
    //   Object.keys(forms).forEach(k => (forms[k] += space + adverb))
    // } else {
    //   Object.keys(forms).forEach(k => (forms[k] = adverb + space + forms[k]))
    // }
    // }
    //apply negative


    var isNegative = parsed.negative.found;

    if (isNegative) {
      forms.PastTense = 'did not ' + forms.Infinitive;
      forms.PresentTense = 'does not ' + forms.Infinitive;
      forms.Gerund = 'not ' + forms.Gerund;
    } //future Tense is pretty straightforward


    if (!forms.FutureTense) {
      if (isNegative) {
        forms.FutureTense = 'will not ' + forms.Infinitive;
      } else {
        forms.FutureTense = 'will ' + forms.Infinitive;
      }
    }

    if (isNegative) {
      forms.Infinitive = 'not ' + forms.Infinitive;
    }

    return forms;
  };

  var conjugate_1$1 = conjugate$2;

  // verb-phrases that are orders - 'close the door'
  // these should not be conjugated
  var isImperative = function isImperative(parsed) {
    // do the dishes
    if (parsed.auxiliary.has('do')) {
      return true;
    } // speak the truth
    // if (parsed.verb.has('^#Infinitive')) {
    //   // 'i speak' is not imperative
    //   if (parsed.subject.has('(i|we|you|they)')) {
    //     return false
    //   }
    //   return true
    // }


    return false;
  }; // // basically, don't conjugate it
  // exports.toImperative = function (parsed) {
  //   let str = parsed.original.text()
  //   let res = {
  //     PastTense: str,
  //     PresentTense: str,
  //     FutureTense: str,
  //     Infinitive: str,
  //   }
  //   return res
  // }


  var imperative = {
    isImperative: isImperative
  };

  // if something is 'modal-ish' we are forced to use past-participle
  // ('i could drove' is wrong)

  var useParticiple = function useParticiple(parsed) {
    if (parsed.auxiliary.has('(could|should|would|may|can|must)')) {
      return true;
    }

    if (parsed.auxiliary.has('am .+? being')) {
      return true;
    }

    if (parsed.auxiliary.has('had .+? been')) {
      return true;
    }

    return false;
  }; // conjugate 'drive' ➔ 'have driven'


  var toParticiple = function toParticiple(parsed, world) {
    //is it already a participle?
    if (parsed.auxiliary.has('(have|had)') && parsed.verb.has('#Participle')) {
      return;
    } // try to swap the main verb to its participle form


    var obj = conjugate_1$1(parsed, world);
    var str = obj.Participle || obj.PastTense;

    if (str) {
      parsed.verb.replaceWith(str, false);
    } // 'am being driven' ➔ 'have been driven'


    if (parsed.auxiliary.has('am .+? being')) {
      parsed.auxiliary.remove('am');
      parsed.auxiliary.replace('being', 'have been');
    } // add a 'have'


    if (!parsed.auxiliary.has('have')) {
      parsed.auxiliary.append('have');
    } // tag it as a participle


    parsed.verb.tag('Participle', 'toParticiple'); // turn 'i can swim' to -> 'i could swim'

    parsed.auxiliary.replace('can', 'could'); //'must be' ➔ 'must have been'

    parsed.auxiliary.replace('be have', 'have been'); //'not have' ➔ 'have not'

    parsed.auxiliary.replace('not have', 'have not'); // ensure all new words are tagged right

    parsed.auxiliary.tag('Auxiliary');
  };

  var participle = {
    useParticiple: useParticiple,
    toParticiple: toParticiple
  };

  var isImperative$1 = imperative.isImperative;
  var _toParticiple = participle.toParticiple,
      useParticiple$1 = participle.useParticiple; // remove any tense-information in auxiliary verbs

  var makeNeutral = function makeNeutral(parsed) {
    //remove tense-info from auxiliaries
    parsed.auxiliary.remove('(will|are|am|being)');
    parsed.auxiliary.remove('(did|does)');
    parsed.auxiliary.remove('(had|has|have)'); //our conjugation includes the 'not' and the phrasal-verb particle

    parsed.particle.remove();
    parsed.negative.remove();
    return parsed;
  };

  var methods$7 = {
    /** overload the original json with verb information */
    json: function json(options) {
      var _this = this;

      var n = null;

      if (typeof options === 'number') {
        n = options;
        options = null;
      }

      options = options || {
        text: true,
        normal: true,
        trim: true,
        terms: true
      };
      var res = [];
      this.forEach(function (p) {
        var json = p.json(options)[0];
        var parsed = parse$2(p);
        json.parts = {};
        Object.keys(parsed).forEach(function (k) {
          if (parsed[k] && parsed[k].isA === 'Doc') {
            json.parts[k] = parsed[k].text('normal');
          } else {
            json.parts[k] = parsed[k];
          }
        });
        json.isNegative = p.has('#Negative');
        json.conjugations = conjugate_1$1(parsed, _this.world);
        res.push(json);
      });

      if (n !== null) {
        return res[n];
      }

      return res;
    },

    /** grab the adverbs describing these verbs */
    adverbs: function adverbs() {
      var list = []; // look at internal adverbs

      this.forEach(function (vb) {
        var advb = parse$2(vb).adverb;

        if (advb.found) {
          list = list.concat(advb.list);
        }
      }); // look for leading adverbs

      var m = this.lookBehind('#Adverb+$');

      if (m.found) {
        list = m.list.concat(list);
      } // look for trailing adverbs


      m = this.lookAhead('^#Adverb+');

      if (m.found) {
        list = list.concat(m.list);
      }

      return this.buildFrom(list);
    },
    /// Verb Inflection

    /**return verbs like 'we walk' and not 'spencer walks' */
    isPlural: function isPlural() {
      var _this2 = this;

      var list = [];
      this.forEach(function (vb) {
        var parsed = parse$2(vb);

        if (isPlural_1$2(parsed, _this2.world) === true) {
          list.push(vb.list[0]);
        }
      });
      return this.buildFrom(list);
    },

    /** return verbs like 'spencer walks' and not 'we walk' */
    isSingular: function isSingular() {
      var _this3 = this;

      var list = [];
      this.forEach(function (vb) {
        var parsed = parse$2(vb);

        if (isPlural_1$2(parsed, _this3.world) === false) {
          list.push(vb.list[0]);
        }
      });
      return this.buildFrom(list);
    },
    /// Conjugation

    /** return all forms of this verb  */
    conjugate: function conjugate() {
      var _this4 = this;

      var result = [];
      this.forEach(function (vb) {
        var parsed = parse$2(vb);

        var forms = conjugate_1$1(parsed, _this4.world);

        result.push(forms);
      });
      return result;
    },

    /** walk ➔ walked*/
    toPastTense: function toPastTense() {
      var _this5 = this;

      this.forEach(function (vb) {
        var parsed = parse$2(vb); // should we support 'would swim' ➔ 'would have swam'

        if (useParticiple$1(parsed)) {
          _toParticiple(parsed, _this5.world);

          return;
        }

        if (isImperative$1(parsed)) {
          return;
        } // don't conjugate 'to be'


        if (vb.has('be') && vb.lookBehind('to$').found) {
          return;
        } // handle 'is raining' -> 'was raining'


        if (parsed.verb.has('#Gerund') && parsed.auxiliary.has('(is|will|was)')) {
          vb.replace('is', 'was');
          return;
        }

        var str = conjugate_1$1(parsed, _this5.world).PastTense;

        if (str) {
          parsed = makeNeutral(parsed);
          parsed.verb.replaceWith(str, false); // vb.tag('PastTense')
        }
      });
      return this;
    },

    /** walk ➔ walks */
    toPresentTense: function toPresentTense() {
      var _this6 = this;

      this.forEach(function (vb) {
        var parsed = parse$2(vb);

        var obj = conjugate_1$1(parsed, _this6.world);

        var str = obj.PresentTense; // 'i look', not 'i looks'

        if (vb.lookBehind('(i|we) (#Adverb|#Verb)?$').found) {
          str = obj.Infinitive;
        }

        if (str) {
          //awkward support for present-participle form
          // -- should we support 'have been swimming' ➔ 'am swimming'
          if (parsed.auxiliary.has('(have|had) been')) {
            parsed.auxiliary.replace('(have|had) been', 'am being');

            if (obj.Particle) {
              str = obj.Particle || obj.PastTense;
            }

            return;
          }

          parsed.verb.replaceWith(str, false);
          parsed.verb.tag('PresentTense');
          parsed = makeNeutral(parsed); // avoid 'he would walks'

          parsed.auxiliary.remove('#Modal');
        }
      });
      return this;
    },

    /** walk ➔ will walk*/
    toFutureTense: function toFutureTense() {
      var _this7 = this;

      this.forEach(function (vb) {
        var parsed = parse$2(vb); // 'i should drive' is already future-enough

        if (useParticiple$1(parsed)) {
          return;
        }

        var str = conjugate_1$1(parsed, _this7.world).FutureTense;

        if (str) {
          parsed = makeNeutral(parsed); // avoid 'he would will go'

          parsed.auxiliary.remove('#Modal');
          parsed.verb.replaceWith(str, false);
          parsed.verb.tag('FutureTense');
        }
      });
      return this;
    },

    /** walks ➔ walk */
    toInfinitive: function toInfinitive() {
      var _this8 = this;

      this.forEach(function (vb) {
        var parsed = parse$2(vb);

        var str = conjugate_1$1(parsed, _this8.world).Infinitive;

        if (str) {
          vb.replaceWith(str, false);
          vb.tag('Infinitive');
        }
      });
      return this;
    },

    /** walk ➔ walking */
    toGerund: function toGerund() {
      var _this9 = this;

      this.forEach(function (vb) {
        var parsed = parse$2(vb);

        var str = conjugate_1$1(parsed, _this9.world).Gerund;

        if (str) {
          vb.replaceWith(str, false);
          vb.tag('Gerund');
        }
      });
      return this;
    },

    /** drive ➔ driven - naked past-participle if it exists, otherwise past-tense */
    toParticiple: function toParticiple() {
      var _this10 = this;

      this.forEach(function (vb) {
        var parsed = parse$2(vb);
        var noAux = !parsed.auxiliary.found;

        _toParticiple(parsed, _this10.world); // dirty trick to  ensure our new auxiliary is found


        if (noAux) {
          parsed.verb.prepend(parsed.auxiliary.text());
          parsed.auxiliary.remove();
        }
      });
      return this;
    },
    /// Negation

    /** return only verbs with 'not'*/
    isNegative: function isNegative() {
      return this["if"]('#Negative');
    },

    /**  return only verbs without 'not'*/
    isPositive: function isPositive() {
      return this.ifNo('#Negative');
    },

    /** add a 'not' to these verbs */
    toNegative: function toNegative() {
      var _this11 = this;

      this.list.forEach(function (p) {
        var doc = _this11.buildFrom([p]);

        var parsed = parse$2(doc);

        toNegative_1(parsed, doc.world);
      });
      return this;
    },

    /** remove 'not' from these verbs */
    toPositive: function toPositive() {
      var m = this.match('do not #Verb');

      if (m.found) {
        m.remove('do not');
      }

      return this.remove('#Negative');
    },

    /** who, or what is doing this action? */
    subject: function subject() {
      var list = [];
      this.forEach(function (p) {
        var found = getSubject_1(p);

        if (found.list[0]) {
          list.push(found.list[0]);
        }
      });
      return this.buildFrom(list);
    }
  };

  var addMethod$9 = function addMethod(Doc) {
    /**  */
    var Verbs = /*#__PURE__*/function (_Doc) {
      _inherits(Verbs, _Doc);

      var _super = _createSuper(Verbs);

      function Verbs() {
        _classCallCheck(this, Verbs);

        return _super.apply(this, arguments);
      }

      return Verbs;
    }(Doc); // add-in our methods


    Object.assign(Verbs.prototype, methods$7); // aliases

    Verbs.prototype.negate = Verbs.prototype.toNegative;

    Doc.prototype.verbs = function (n) {
      var match = this.match('(#Adverb|#Auxiliary|#Verb|#Negative|#Particle)+'); // try to ignore leading and trailing adverbs

      match = match.not('^#Adverb+');
      match = match.not('#Adverb+$'); // handle commas:
      // don't split 'really, really'

      var keep = match.match('(#Adverb && @hasComma) #Adverb'); // // but split the other commas

      var m = match.not(keep).splitAfter('@hasComma'); // i was shocked looking at...

      var gerund = m.match('#PastTense #Gerund');

      if (!gerund.has('(been|am|#Auxiliary) #Gerund')) {
        m = m.splitBefore(gerund.match('#Gerund'));
      } // combine them back together


      m = m.concat(keep);
      m.sort('index'); //handle slashes?
      //ensure there's actually a verb

      m = m["if"]('#Verb'); // the reason he will is ...

      if (m.has('(is|was)$')) {
        m = m.splitBefore('(is|was)$');
      } //ensure it's not two verbs


      if (m.has('#PresentTense #Adverb #PresentTense')) {
        m = m.splitBefore('#Adverb #PresentTense');
      } //grab (n)th result


      if (typeof n === 'number') {
        m = m.get(n);
      }

      var vb = new Verbs(m.list, this, this.world);
      return vb;
    };

    return Doc;
  };

  var Verbs = addMethod$9;

  var addMethod$a = function addMethod(Doc) {
    /**  */
    var People = /*#__PURE__*/function (_Doc) {
      _inherits(People, _Doc);

      var _super = _createSuper(People);

      function People() {
        _classCallCheck(this, People);

        return _super.apply(this, arguments);
      }

      return People;
    }(Doc);

    Doc.prototype.people = function (n) {
      var match = this.splitAfter('@hasComma');
      match = match.match('#Person+'); //grab (n)th result

      if (typeof n === 'number') {
        match = match.get(n);
      }

      return new People(match.list, this, this.world);
    };

    return Doc;
  };

  var People = addMethod$a;

  var subclass = [Abbreviations, Acronyms, Clauses, Contractions, Lists, Nouns, Parentheses, Possessives, Quotations, Verbs, People];

  var extend = function extend(Doc) {
    // add basic methods
    Object.keys(_simple).forEach(function (k) {
      return Doc.prototype[k] = _simple[k];
    }); // add subclassed methods

    subclass.forEach(function (addFn) {
      return addFn(Doc);
    });
    return Doc;
  };

  var Subset = extend;

  var methods$8 = {
    misc: methods$4,
    selections: _simple
  };
  /** a parsed text object */

  var Doc = /*#__PURE__*/function () {
    function Doc(list, from, world) {
      var _this = this;

      _classCallCheck(this, Doc);

      this.list = list; //quiet these properties in console.logs

      Object.defineProperty(this, 'from', {
        enumerable: false,
        value: from,
        writable: true
      }); //borrow some missing data from parent

      if (world === undefined && from !== undefined) {
        world = from.world;
      } //'world' getter


      Object.defineProperty(this, 'world', {
        enumerable: false,
        value: world,
        writable: true
      }); //fast-scans for our data

      Object.defineProperty(this, '_cache', {
        enumerable: false,
        writable: true,
        value: {}
      }); //'found' getter

      Object.defineProperty(this, 'found', {
        get: function get() {
          return _this.list.length > 0;
        }
      }); //'length' getter

      Object.defineProperty(this, 'length', {
        get: function get() {
          return _this.list.length;
        }
      }); // this is way easier than .constructor.name...

      Object.defineProperty(this, 'isA', {
        get: function get() {
          return 'Doc';
        }
      });
    }
    /** run part-of-speech tagger on all results*/


    _createClass(Doc, [{
      key: "tagger",
      value: function tagger() {
        return _02Tagger(this);
      }
      /** pool is stored on phrase objects */

    }, {
      key: "pool",
      value: function pool() {
        if (this.list.length > 0) {
          return this.list[0].pool;
        }

        return this.all().list[0].pool;
      }
    }]);

    return Doc;
  }();
  /** create a new Document object */


  Doc.prototype.buildFrom = function (list) {
    list = list.map(function (p) {
      return p.clone(true);
    }); // new this.constructor()

    var doc = new Doc(list, this, this.world);
    return doc;
  };
  /** create a new Document from plaintext. */


  Doc.prototype.fromText = function (str) {
    var list = _01Tokenizer(str, this.world, this.pool());
    return this.buildFrom(list);
  };

  Object.assign(Doc.prototype, methods$8.misc);
  Object.assign(Doc.prototype, methods$8.selections); //add sub-classes

  Subset(Doc); //aliases

  var aliases$1 = {
    untag: 'unTag',
    and: 'match',
    notIf: 'ifNo',
    only: 'if',
    onlyIf: 'if'
  };
  Object.keys(aliases$1).forEach(function (k) {
    return Doc.prototype[k] = Doc.prototype[aliases$1[k]];
  });
  var Doc_1 = Doc;

  var smallTagger = function smallTagger(doc) {
    var terms = doc.termList();
    _01Lexicon(terms, doc.world);
    return doc;
  };

  var tiny = smallTagger;

  function instance(worldInstance) {
    //blast-out our word-lists, just once
    var world = worldInstance;
    /** parse and tag text into a compromise object  */

    var nlp = function nlp() {
      var text = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
      var lexicon = arguments.length > 1 ? arguments[1] : undefined;

      if (lexicon) {
        world.addWords(lexicon);
      }

      var list = _01Tokenizer(text, world);
      var doc = new Doc_1(list, null, world);
      doc.tagger();
      return doc;
    };
    /** parse text into a compromise object, without running POS-tagging */


    nlp.tokenize = function () {
      var text = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
      var lexicon = arguments.length > 1 ? arguments[1] : undefined;
      var w = world;

      if (lexicon) {
        w = w.clone();
        w.words = {};
        w.addWords(lexicon);
      }

      var list = _01Tokenizer(text, w);
      var doc = new Doc_1(list, null, w);

      if (lexicon) {
        tiny(doc);
      }

      return doc;
    };
    /** mix in a compromise-plugin */


    nlp.extend = function (fn) {
      fn(Doc_1, world, this, Phrase_1, Term_1, Pool_1);
      return this;
    };
    /** create a compromise Doc object from .json() results */


    nlp.fromJSON = function (json) {
      var list = fromJSON_1(json, world);
      return new Doc_1(list, null, world);
    };
    /** make a deep-copy of the library state */


    nlp.clone = function () {
      return instance(world.clone());
    };
    /** log our decision-making for debugging */


    nlp.verbose = function () {
      var bool = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
      world.verbose(bool);
      return this;
    };
    /** grab currently-used World object */


    nlp.world = function () {
      return world;
    };
    /** pre-parse any match statements */


    nlp.parseMatch = function (str) {
      return syntax_1(str);
    };
    /** current version of the library */


    nlp.version = _version; // alias

    nlp["import"] = nlp.load;
    return nlp;
  }

  var src = instance(new World_1());

  return src;

})));

},{}],4:[function(require,module,exports){
/*!
 * jQuery JavaScript Library v3.5.1
 * https://jquery.com/
 *
 * Includes Sizzle.js
 * https://sizzlejs.com/
 *
 * Copyright JS Foundation and other contributors
 * Released under the MIT license
 * https://jquery.org/license
 *
 * Date: 2020-05-04T22:49Z
 */
( function( global, factory ) {

	"use strict";

	if ( typeof module === "object" && typeof module.exports === "object" ) {

		// For CommonJS and CommonJS-like environments where a proper `window`
		// is present, execute the factory and get jQuery.
		// For environments that do not have a `window` with a `document`
		// (such as Node.js), expose a factory as module.exports.
		// This accentuates the need for the creation of a real `window`.
		// e.g. var jQuery = require("jquery")(window);
		// See ticket #14549 for more info.
		module.exports = global.document ?
			factory( global, true ) :
			function( w ) {
				if ( !w.document ) {
					throw new Error( "jQuery requires a window with a document" );
				}
				return factory( w );
			};
	} else {
		factory( global );
	}

// Pass this if window is not defined yet
} )( typeof window !== "undefined" ? window : this, function( window, noGlobal ) {

// Edge <= 12 - 13+, Firefox <=18 - 45+, IE 10 - 11, Safari 5.1 - 9+, iOS 6 - 9.1
// throw exceptions when non-strict code (e.g., ASP.NET 4.5) accesses strict mode
// arguments.callee.caller (trac-13335). But as of jQuery 3.0 (2016), strict mode should be common
// enough that all such attempts are guarded in a try block.
"use strict";

var arr = [];

var getProto = Object.getPrototypeOf;

var slice = arr.slice;

var flat = arr.flat ? function( array ) {
	return arr.flat.call( array );
} : function( array ) {
	return arr.concat.apply( [], array );
};


var push = arr.push;

var indexOf = arr.indexOf;

var class2type = {};

var toString = class2type.toString;

var hasOwn = class2type.hasOwnProperty;

var fnToString = hasOwn.toString;

var ObjectFunctionString = fnToString.call( Object );

var support = {};

var isFunction = function isFunction( obj ) {

      // Support: Chrome <=57, Firefox <=52
      // In some browsers, typeof returns "function" for HTML <object> elements
      // (i.e., `typeof document.createElement( "object" ) === "function"`).
      // We don't want to classify *any* DOM node as a function.
      return typeof obj === "function" && typeof obj.nodeType !== "number";
  };


var isWindow = function isWindow( obj ) {
		return obj != null && obj === obj.window;
	};


var document = window.document;



	var preservedScriptAttributes = {
		type: true,
		src: true,
		nonce: true,
		noModule: true
	};

	function DOMEval( code, node, doc ) {
		doc = doc || document;

		var i, val,
			script = doc.createElement( "script" );

		script.text = code;
		if ( node ) {
			for ( i in preservedScriptAttributes ) {

				// Support: Firefox 64+, Edge 18+
				// Some browsers don't support the "nonce" property on scripts.
				// On the other hand, just using `getAttribute` is not enough as
				// the `nonce` attribute is reset to an empty string whenever it
				// becomes browsing-context connected.
				// See https://github.com/whatwg/html/issues/2369
				// See https://html.spec.whatwg.org/#nonce-attributes
				// The `node.getAttribute` check was added for the sake of
				// `jQuery.globalEval` so that it can fake a nonce-containing node
				// via an object.
				val = node[ i ] || node.getAttribute && node.getAttribute( i );
				if ( val ) {
					script.setAttribute( i, val );
				}
			}
		}
		doc.head.appendChild( script ).parentNode.removeChild( script );
	}


function toType( obj ) {
	if ( obj == null ) {
		return obj + "";
	}

	// Support: Android <=2.3 only (functionish RegExp)
	return typeof obj === "object" || typeof obj === "function" ?
		class2type[ toString.call( obj ) ] || "object" :
		typeof obj;
}
/* global Symbol */
// Defining this global in .eslintrc.json would create a danger of using the global
// unguarded in another place, it seems safer to define global only for this module



var
	version = "3.5.1",

	// Define a local copy of jQuery
	jQuery = function( selector, context ) {

		// The jQuery object is actually just the init constructor 'enhanced'
		// Need init if jQuery is called (just allow error to be thrown if not included)
		return new jQuery.fn.init( selector, context );
	};

jQuery.fn = jQuery.prototype = {

	// The current version of jQuery being used
	jquery: version,

	constructor: jQuery,

	// The default length of a jQuery object is 0
	length: 0,

	toArray: function() {
		return slice.call( this );
	},

	// Get the Nth element in the matched element set OR
	// Get the whole matched element set as a clean array
	get: function( num ) {

		// Return all the elements in a clean array
		if ( num == null ) {
			return slice.call( this );
		}

		// Return just the one element from the set
		return num < 0 ? this[ num + this.length ] : this[ num ];
	},

	// Take an array of elements and push it onto the stack
	// (returning the new matched element set)
	pushStack: function( elems ) {

		// Build a new jQuery matched element set
		var ret = jQuery.merge( this.constructor(), elems );

		// Add the old object onto the stack (as a reference)
		ret.prevObject = this;

		// Return the newly-formed element set
		return ret;
	},

	// Execute a callback for every element in the matched set.
	each: function( callback ) {
		return jQuery.each( this, callback );
	},

	map: function( callback ) {
		return this.pushStack( jQuery.map( this, function( elem, i ) {
			return callback.call( elem, i, elem );
		} ) );
	},

	slice: function() {
		return this.pushStack( slice.apply( this, arguments ) );
	},

	first: function() {
		return this.eq( 0 );
	},

	last: function() {
		return this.eq( -1 );
	},

	even: function() {
		return this.pushStack( jQuery.grep( this, function( _elem, i ) {
			return ( i + 1 ) % 2;
		} ) );
	},

	odd: function() {
		return this.pushStack( jQuery.grep( this, function( _elem, i ) {
			return i % 2;
		} ) );
	},

	eq: function( i ) {
		var len = this.length,
			j = +i + ( i < 0 ? len : 0 );
		return this.pushStack( j >= 0 && j < len ? [ this[ j ] ] : [] );
	},

	end: function() {
		return this.prevObject || this.constructor();
	},

	// For internal use only.
	// Behaves like an Array's method, not like a jQuery method.
	push: push,
	sort: arr.sort,
	splice: arr.splice
};

jQuery.extend = jQuery.fn.extend = function() {
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[ 0 ] || {},
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;

		// Skip the boolean and the target
		target = arguments[ i ] || {};
		i++;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && !isFunction( target ) ) {
		target = {};
	}

	// Extend jQuery itself if only one argument is passed
	if ( i === length ) {
		target = this;
		i--;
	}

	for ( ; i < length; i++ ) {

		// Only deal with non-null/undefined values
		if ( ( options = arguments[ i ] ) != null ) {

			// Extend the base object
			for ( name in options ) {
				copy = options[ name ];

				// Prevent Object.prototype pollution
				// Prevent never-ending loop
				if ( name === "__proto__" || target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( jQuery.isPlainObject( copy ) ||
					( copyIsArray = Array.isArray( copy ) ) ) ) {
					src = target[ name ];

					// Ensure proper type for the source value
					if ( copyIsArray && !Array.isArray( src ) ) {
						clone = [];
					} else if ( !copyIsArray && !jQuery.isPlainObject( src ) ) {
						clone = {};
					} else {
						clone = src;
					}
					copyIsArray = false;

					// Never move original objects, clone them
					target[ name ] = jQuery.extend( deep, clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

jQuery.extend( {

	// Unique for each copy of jQuery on the page
	expando: "jQuery" + ( version + Math.random() ).replace( /\D/g, "" ),

	// Assume jQuery is ready without the ready module
	isReady: true,

	error: function( msg ) {
		throw new Error( msg );
	},

	noop: function() {},

	isPlainObject: function( obj ) {
		var proto, Ctor;

		// Detect obvious negatives
		// Use toString instead of jQuery.type to catch host objects
		if ( !obj || toString.call( obj ) !== "[object Object]" ) {
			return false;
		}

		proto = getProto( obj );

		// Objects with no prototype (e.g., `Object.create( null )`) are plain
		if ( !proto ) {
			return true;
		}

		// Objects with prototype are plain iff they were constructed by a global Object function
		Ctor = hasOwn.call( proto, "constructor" ) && proto.constructor;
		return typeof Ctor === "function" && fnToString.call( Ctor ) === ObjectFunctionString;
	},

	isEmptyObject: function( obj ) {
		var name;

		for ( name in obj ) {
			return false;
		}
		return true;
	},

	// Evaluates a script in a provided context; falls back to the global one
	// if not specified.
	globalEval: function( code, options, doc ) {
		DOMEval( code, { nonce: options && options.nonce }, doc );
	},

	each: function( obj, callback ) {
		var length, i = 0;

		if ( isArrayLike( obj ) ) {
			length = obj.length;
			for ( ; i < length; i++ ) {
				if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
					break;
				}
			}
		} else {
			for ( i in obj ) {
				if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
					break;
				}
			}
		}

		return obj;
	},

	// results is for internal usage only
	makeArray: function( arr, results ) {
		var ret = results || [];

		if ( arr != null ) {
			if ( isArrayLike( Object( arr ) ) ) {
				jQuery.merge( ret,
					typeof arr === "string" ?
					[ arr ] : arr
				);
			} else {
				push.call( ret, arr );
			}
		}

		return ret;
	},

	inArray: function( elem, arr, i ) {
		return arr == null ? -1 : indexOf.call( arr, elem, i );
	},

	// Support: Android <=4.0 only, PhantomJS 1 only
	// push.apply(_, arraylike) throws on ancient WebKit
	merge: function( first, second ) {
		var len = +second.length,
			j = 0,
			i = first.length;

		for ( ; j < len; j++ ) {
			first[ i++ ] = second[ j ];
		}

		first.length = i;

		return first;
	},

	grep: function( elems, callback, invert ) {
		var callbackInverse,
			matches = [],
			i = 0,
			length = elems.length,
			callbackExpect = !invert;

		// Go through the array, only saving the items
		// that pass the validator function
		for ( ; i < length; i++ ) {
			callbackInverse = !callback( elems[ i ], i );
			if ( callbackInverse !== callbackExpect ) {
				matches.push( elems[ i ] );
			}
		}

		return matches;
	},

	// arg is for internal usage only
	map: function( elems, callback, arg ) {
		var length, value,
			i = 0,
			ret = [];

		// Go through the array, translating each of the items to their new values
		if ( isArrayLike( elems ) ) {
			length = elems.length;
			for ( ; i < length; i++ ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret.push( value );
				}
			}

		// Go through every key on the object,
		} else {
			for ( i in elems ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret.push( value );
				}
			}
		}

		// Flatten any nested arrays
		return flat( ret );
	},

	// A global GUID counter for objects
	guid: 1,

	// jQuery.support is not used in Core but other projects attach their
	// properties to it so it needs to exist.
	support: support
} );

if ( typeof Symbol === "function" ) {
	jQuery.fn[ Symbol.iterator ] = arr[ Symbol.iterator ];
}

// Populate the class2type map
jQuery.each( "Boolean Number String Function Array Date RegExp Object Error Symbol".split( " " ),
function( _i, name ) {
	class2type[ "[object " + name + "]" ] = name.toLowerCase();
} );

function isArrayLike( obj ) {

	// Support: real iOS 8.2 only (not reproducible in simulator)
	// `in` check used to prevent JIT error (gh-2145)
	// hasOwn isn't used here due to false negatives
	// regarding Nodelist length in IE
	var length = !!obj && "length" in obj && obj.length,
		type = toType( obj );

	if ( isFunction( obj ) || isWindow( obj ) ) {
		return false;
	}

	return type === "array" || length === 0 ||
		typeof length === "number" && length > 0 && ( length - 1 ) in obj;
}
var Sizzle =
/*!
 * Sizzle CSS Selector Engine v2.3.5
 * https://sizzlejs.com/
 *
 * Copyright JS Foundation and other contributors
 * Released under the MIT license
 * https://js.foundation/
 *
 * Date: 2020-03-14
 */
( function( window ) {
var i,
	support,
	Expr,
	getText,
	isXML,
	tokenize,
	compile,
	select,
	outermostContext,
	sortInput,
	hasDuplicate,

	// Local document vars
	setDocument,
	document,
	docElem,
	documentIsHTML,
	rbuggyQSA,
	rbuggyMatches,
	matches,
	contains,

	// Instance-specific data
	expando = "sizzle" + 1 * new Date(),
	preferredDoc = window.document,
	dirruns = 0,
	done = 0,
	classCache = createCache(),
	tokenCache = createCache(),
	compilerCache = createCache(),
	nonnativeSelectorCache = createCache(),
	sortOrder = function( a, b ) {
		if ( a === b ) {
			hasDuplicate = true;
		}
		return 0;
	},

	// Instance methods
	hasOwn = ( {} ).hasOwnProperty,
	arr = [],
	pop = arr.pop,
	pushNative = arr.push,
	push = arr.push,
	slice = arr.slice,

	// Use a stripped-down indexOf as it's faster than native
	// https://jsperf.com/thor-indexof-vs-for/5
	indexOf = function( list, elem ) {
		var i = 0,
			len = list.length;
		for ( ; i < len; i++ ) {
			if ( list[ i ] === elem ) {
				return i;
			}
		}
		return -1;
	},

	booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|" +
		"ismap|loop|multiple|open|readonly|required|scoped",

	// Regular expressions

	// http://www.w3.org/TR/css3-selectors/#whitespace
	whitespace = "[\\x20\\t\\r\\n\\f]",

	// https://www.w3.org/TR/css-syntax-3/#ident-token-diagram
	identifier = "(?:\\\\[\\da-fA-F]{1,6}" + whitespace +
		"?|\\\\[^\\r\\n\\f]|[\\w-]|[^\0-\\x7f])+",

	// Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
	attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace +

		// Operator (capture 2)
		"*([*^$|!~]?=)" + whitespace +

		// "Attribute values must be CSS identifiers [capture 5]
		// or strings [capture 3 or capture 4]"
		"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" +
		whitespace + "*\\]",

	pseudos = ":(" + identifier + ")(?:\\((" +

		// To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
		// 1. quoted (capture 3; capture 4 or capture 5)
		"('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +

		// 2. simple (capture 6)
		"((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +

		// 3. anything else (capture 2)
		".*" +
		")\\)|)",

	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
	rwhitespace = new RegExp( whitespace + "+", "g" ),
	rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" +
		whitespace + "+$", "g" ),

	rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
	rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace +
		"*" ),
	rdescend = new RegExp( whitespace + "|>" ),

	rpseudo = new RegExp( pseudos ),
	ridentifier = new RegExp( "^" + identifier + "$" ),

	matchExpr = {
		"ID": new RegExp( "^#(" + identifier + ")" ),
		"CLASS": new RegExp( "^\\.(" + identifier + ")" ),
		"TAG": new RegExp( "^(" + identifier + "|[*])" ),
		"ATTR": new RegExp( "^" + attributes ),
		"PSEUDO": new RegExp( "^" + pseudos ),
		"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" +
			whitespace + "*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" +
			whitespace + "*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
		"bool": new RegExp( "^(?:" + booleans + ")$", "i" ),

		// For use in libraries implementing .is()
		// We use this for POS matching in `select`
		"needsContext": new RegExp( "^" + whitespace +
			"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + whitespace +
			"*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
	},

	rhtml = /HTML$/i,
	rinputs = /^(?:input|select|textarea|button)$/i,
	rheader = /^h\d$/i,

	rnative = /^[^{]+\{\s*\[native \w/,

	// Easily-parseable/retrievable ID or TAG or CLASS selectors
	rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

	rsibling = /[+~]/,

	// CSS escapes
	// http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
	runescape = new RegExp( "\\\\[\\da-fA-F]{1,6}" + whitespace + "?|\\\\([^\\r\\n\\f])", "g" ),
	funescape = function( escape, nonHex ) {
		var high = "0x" + escape.slice( 1 ) - 0x10000;

		return nonHex ?

			// Strip the backslash prefix from a non-hex escape sequence
			nonHex :

			// Replace a hexadecimal escape sequence with the encoded Unicode code point
			// Support: IE <=11+
			// For values outside the Basic Multilingual Plane (BMP), manually construct a
			// surrogate pair
			high < 0 ?
				String.fromCharCode( high + 0x10000 ) :
				String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
	},

	// CSS string/identifier serialization
	// https://drafts.csswg.org/cssom/#common-serializing-idioms
	rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\0-\x1f\x7f-\uFFFF\w-]/g,
	fcssescape = function( ch, asCodePoint ) {
		if ( asCodePoint ) {

			// U+0000 NULL becomes U+FFFD REPLACEMENT CHARACTER
			if ( ch === "\0" ) {
				return "\uFFFD";
			}

			// Control characters and (dependent upon position) numbers get escaped as code points
			return ch.slice( 0, -1 ) + "\\" +
				ch.charCodeAt( ch.length - 1 ).toString( 16 ) + " ";
		}

		// Other potentially-special ASCII characters get backslash-escaped
		return "\\" + ch;
	},

	// Used for iframes
	// See setDocument()
	// Removing the function wrapper causes a "Permission Denied"
	// error in IE
	unloadHandler = function() {
		setDocument();
	},

	inDisabledFieldset = addCombinator(
		function( elem ) {
			return elem.disabled === true && elem.nodeName.toLowerCase() === "fieldset";
		},
		{ dir: "parentNode", next: "legend" }
	);

// Optimize for push.apply( _, NodeList )
try {
	push.apply(
		( arr = slice.call( preferredDoc.childNodes ) ),
		preferredDoc.childNodes
	);

	// Support: Android<4.0
	// Detect silently failing push.apply
	// eslint-disable-next-line no-unused-expressions
	arr[ preferredDoc.childNodes.length ].nodeType;
} catch ( e ) {
	push = { apply: arr.length ?

		// Leverage slice if possible
		function( target, els ) {
			pushNative.apply( target, slice.call( els ) );
		} :

		// Support: IE<9
		// Otherwise append directly
		function( target, els ) {
			var j = target.length,
				i = 0;

			// Can't trust NodeList.length
			while ( ( target[ j++ ] = els[ i++ ] ) ) {}
			target.length = j - 1;
		}
	};
}

function Sizzle( selector, context, results, seed ) {
	var m, i, elem, nid, match, groups, newSelector,
		newContext = context && context.ownerDocument,

		// nodeType defaults to 9, since context defaults to document
		nodeType = context ? context.nodeType : 9;

	results = results || [];

	// Return early from calls with invalid selector or context
	if ( typeof selector !== "string" || !selector ||
		nodeType !== 1 && nodeType !== 9 && nodeType !== 11 ) {

		return results;
	}

	// Try to shortcut find operations (as opposed to filters) in HTML documents
	if ( !seed ) {
		setDocument( context );
		context = context || document;

		if ( documentIsHTML ) {

			// If the selector is sufficiently simple, try using a "get*By*" DOM method
			// (excepting DocumentFragment context, where the methods don't exist)
			if ( nodeType !== 11 && ( match = rquickExpr.exec( selector ) ) ) {

				// ID selector
				if ( ( m = match[ 1 ] ) ) {

					// Document context
					if ( nodeType === 9 ) {
						if ( ( elem = context.getElementById( m ) ) ) {

							// Support: IE, Opera, Webkit
							// TODO: identify versions
							// getElementById can match elements by name instead of ID
							if ( elem.id === m ) {
								results.push( elem );
								return results;
							}
						} else {
							return results;
						}

					// Element context
					} else {

						// Support: IE, Opera, Webkit
						// TODO: identify versions
						// getElementById can match elements by name instead of ID
						if ( newContext && ( elem = newContext.getElementById( m ) ) &&
							contains( context, elem ) &&
							elem.id === m ) {

							results.push( elem );
							return results;
						}
					}

				// Type selector
				} else if ( match[ 2 ] ) {
					push.apply( results, context.getElementsByTagName( selector ) );
					return results;

				// Class selector
				} else if ( ( m = match[ 3 ] ) && support.getElementsByClassName &&
					context.getElementsByClassName ) {

					push.apply( results, context.getElementsByClassName( m ) );
					return results;
				}
			}

			// Take advantage of querySelectorAll
			if ( support.qsa &&
				!nonnativeSelectorCache[ selector + " " ] &&
				( !rbuggyQSA || !rbuggyQSA.test( selector ) ) &&

				// Support: IE 8 only
				// Exclude object elements
				( nodeType !== 1 || context.nodeName.toLowerCase() !== "object" ) ) {

				newSelector = selector;
				newContext = context;

				// qSA considers elements outside a scoping root when evaluating child or
				// descendant combinators, which is not what we want.
				// In such cases, we work around the behavior by prefixing every selector in the
				// list with an ID selector referencing the scope context.
				// The technique has to be used as well when a leading combinator is used
				// as such selectors are not recognized by querySelectorAll.
				// Thanks to Andrew Dupont for this technique.
				if ( nodeType === 1 &&
					( rdescend.test( selector ) || rcombinators.test( selector ) ) ) {

					// Expand context for sibling selectors
					newContext = rsibling.test( selector ) && testContext( context.parentNode ) ||
						context;

					// We can use :scope instead of the ID hack if the browser
					// supports it & if we're not changing the context.
					if ( newContext !== context || !support.scope ) {

						// Capture the context ID, setting it first if necessary
						if ( ( nid = context.getAttribute( "id" ) ) ) {
							nid = nid.replace( rcssescape, fcssescape );
						} else {
							context.setAttribute( "id", ( nid = expando ) );
						}
					}

					// Prefix every selector in the list
					groups = tokenize( selector );
					i = groups.length;
					while ( i-- ) {
						groups[ i ] = ( nid ? "#" + nid : ":scope" ) + " " +
							toSelector( groups[ i ] );
					}
					newSelector = groups.join( "," );
				}

				try {
					push.apply( results,
						newContext.querySelectorAll( newSelector )
					);
					return results;
				} catch ( qsaError ) {
					nonnativeSelectorCache( selector, true );
				} finally {
					if ( nid === expando ) {
						context.removeAttribute( "id" );
					}
				}
			}
		}
	}

	// All others
	return select( selector.replace( rtrim, "$1" ), context, results, seed );
}

/**
 * Create key-value caches of limited size
 * @returns {function(string, object)} Returns the Object data after storing it on itself with
 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
 *	deleting the oldest entry
 */
function createCache() {
	var keys = [];

	function cache( key, value ) {

		// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
		if ( keys.push( key + " " ) > Expr.cacheLength ) {

			// Only keep the most recent entries
			delete cache[ keys.shift() ];
		}
		return ( cache[ key + " " ] = value );
	}
	return cache;
}

/**
 * Mark a function for special use by Sizzle
 * @param {Function} fn The function to mark
 */
function markFunction( fn ) {
	fn[ expando ] = true;
	return fn;
}

/**
 * Support testing using an element
 * @param {Function} fn Passed the created element and returns a boolean result
 */
function assert( fn ) {
	var el = document.createElement( "fieldset" );

	try {
		return !!fn( el );
	} catch ( e ) {
		return false;
	} finally {

		// Remove from its parent by default
		if ( el.parentNode ) {
			el.parentNode.removeChild( el );
		}

		// release memory in IE
		el = null;
	}
}

/**
 * Adds the same handler for all of the specified attrs
 * @param {String} attrs Pipe-separated list of attributes
 * @param {Function} handler The method that will be applied
 */
function addHandle( attrs, handler ) {
	var arr = attrs.split( "|" ),
		i = arr.length;

	while ( i-- ) {
		Expr.attrHandle[ arr[ i ] ] = handler;
	}
}

/**
 * Checks document order of two siblings
 * @param {Element} a
 * @param {Element} b
 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
 */
function siblingCheck( a, b ) {
	var cur = b && a,
		diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
			a.sourceIndex - b.sourceIndex;

	// Use IE sourceIndex if available on both nodes
	if ( diff ) {
		return diff;
	}

	// Check if b follows a
	if ( cur ) {
		while ( ( cur = cur.nextSibling ) ) {
			if ( cur === b ) {
				return -1;
			}
		}
	}

	return a ? 1 : -1;
}

/**
 * Returns a function to use in pseudos for input types
 * @param {String} type
 */
function createInputPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return name === "input" && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for buttons
 * @param {String} type
 */
function createButtonPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return ( name === "input" || name === "button" ) && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for :enabled/:disabled
 * @param {Boolean} disabled true for :disabled; false for :enabled
 */
function createDisabledPseudo( disabled ) {

	// Known :disabled false positives: fieldset[disabled] > legend:nth-of-type(n+2) :can-disable
	return function( elem ) {

		// Only certain elements can match :enabled or :disabled
		// https://html.spec.whatwg.org/multipage/scripting.html#selector-enabled
		// https://html.spec.whatwg.org/multipage/scripting.html#selector-disabled
		if ( "form" in elem ) {

			// Check for inherited disabledness on relevant non-disabled elements:
			// * listed form-associated elements in a disabled fieldset
			//   https://html.spec.whatwg.org/multipage/forms.html#category-listed
			//   https://html.spec.whatwg.org/multipage/forms.html#concept-fe-disabled
			// * option elements in a disabled optgroup
			//   https://html.spec.whatwg.org/multipage/forms.html#concept-option-disabled
			// All such elements have a "form" property.
			if ( elem.parentNode && elem.disabled === false ) {

				// Option elements defer to a parent optgroup if present
				if ( "label" in elem ) {
					if ( "label" in elem.parentNode ) {
						return elem.parentNode.disabled === disabled;
					} else {
						return elem.disabled === disabled;
					}
				}

				// Support: IE 6 - 11
				// Use the isDisabled shortcut property to check for disabled fieldset ancestors
				return elem.isDisabled === disabled ||

					// Where there is no isDisabled, check manually
					/* jshint -W018 */
					elem.isDisabled !== !disabled &&
					inDisabledFieldset( elem ) === disabled;
			}

			return elem.disabled === disabled;

		// Try to winnow out elements that can't be disabled before trusting the disabled property.
		// Some victims get caught in our net (label, legend, menu, track), but it shouldn't
		// even exist on them, let alone have a boolean value.
		} else if ( "label" in elem ) {
			return elem.disabled === disabled;
		}

		// Remaining elements are neither :enabled nor :disabled
		return false;
	};
}

/**
 * Returns a function to use in pseudos for positionals
 * @param {Function} fn
 */
function createPositionalPseudo( fn ) {
	return markFunction( function( argument ) {
		argument = +argument;
		return markFunction( function( seed, matches ) {
			var j,
				matchIndexes = fn( [], seed.length, argument ),
				i = matchIndexes.length;

			// Match elements found at the specified indexes
			while ( i-- ) {
				if ( seed[ ( j = matchIndexes[ i ] ) ] ) {
					seed[ j ] = !( matches[ j ] = seed[ j ] );
				}
			}
		} );
	} );
}

/**
 * Checks a node for validity as a Sizzle context
 * @param {Element|Object=} context
 * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
 */
function testContext( context ) {
	return context && typeof context.getElementsByTagName !== "undefined" && context;
}

// Expose support vars for convenience
support = Sizzle.support = {};

/**
 * Detects XML nodes
 * @param {Element|Object} elem An element or a document
 * @returns {Boolean} True iff elem is a non-HTML XML node
 */
isXML = Sizzle.isXML = function( elem ) {
	var namespace = elem.namespaceURI,
		docElem = ( elem.ownerDocument || elem ).documentElement;

	// Support: IE <=8
	// Assume HTML when documentElement doesn't yet exist, such as inside loading iframes
	// https://bugs.jquery.com/ticket/4833
	return !rhtml.test( namespace || docElem && docElem.nodeName || "HTML" );
};

/**
 * Sets document-related variables once based on the current document
 * @param {Element|Object} [doc] An element or document object to use to set the document
 * @returns {Object} Returns the current document
 */
setDocument = Sizzle.setDocument = function( node ) {
	var hasCompare, subWindow,
		doc = node ? node.ownerDocument || node : preferredDoc;

	// Return early if doc is invalid or already selected
	// Support: IE 11+, Edge 17 - 18+
	// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
	// two documents; shallow comparisons work.
	// eslint-disable-next-line eqeqeq
	if ( doc == document || doc.nodeType !== 9 || !doc.documentElement ) {
		return document;
	}

	// Update global variables
	document = doc;
	docElem = document.documentElement;
	documentIsHTML = !isXML( document );

	// Support: IE 9 - 11+, Edge 12 - 18+
	// Accessing iframe documents after unload throws "permission denied" errors (jQuery #13936)
	// Support: IE 11+, Edge 17 - 18+
	// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
	// two documents; shallow comparisons work.
	// eslint-disable-next-line eqeqeq
	if ( preferredDoc != document &&
		( subWindow = document.defaultView ) && subWindow.top !== subWindow ) {

		// Support: IE 11, Edge
		if ( subWindow.addEventListener ) {
			subWindow.addEventListener( "unload", unloadHandler, false );

		// Support: IE 9 - 10 only
		} else if ( subWindow.attachEvent ) {
			subWindow.attachEvent( "onunload", unloadHandler );
		}
	}

	// Support: IE 8 - 11+, Edge 12 - 18+, Chrome <=16 - 25 only, Firefox <=3.6 - 31 only,
	// Safari 4 - 5 only, Opera <=11.6 - 12.x only
	// IE/Edge & older browsers don't support the :scope pseudo-class.
	// Support: Safari 6.0 only
	// Safari 6.0 supports :scope but it's an alias of :root there.
	support.scope = assert( function( el ) {
		docElem.appendChild( el ).appendChild( document.createElement( "div" ) );
		return typeof el.querySelectorAll !== "undefined" &&
			!el.querySelectorAll( ":scope fieldset div" ).length;
	} );

	/* Attributes
	---------------------------------------------------------------------- */

	// Support: IE<8
	// Verify that getAttribute really returns attributes and not properties
	// (excepting IE8 booleans)
	support.attributes = assert( function( el ) {
		el.className = "i";
		return !el.getAttribute( "className" );
	} );

	/* getElement(s)By*
	---------------------------------------------------------------------- */

	// Check if getElementsByTagName("*") returns only elements
	support.getElementsByTagName = assert( function( el ) {
		el.appendChild( document.createComment( "" ) );
		return !el.getElementsByTagName( "*" ).length;
	} );

	// Support: IE<9
	support.getElementsByClassName = rnative.test( document.getElementsByClassName );

	// Support: IE<10
	// Check if getElementById returns elements by name
	// The broken getElementById methods don't pick up programmatically-set names,
	// so use a roundabout getElementsByName test
	support.getById = assert( function( el ) {
		docElem.appendChild( el ).id = expando;
		return !document.getElementsByName || !document.getElementsByName( expando ).length;
	} );

	// ID filter and find
	if ( support.getById ) {
		Expr.filter[ "ID" ] = function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				return elem.getAttribute( "id" ) === attrId;
			};
		};
		Expr.find[ "ID" ] = function( id, context ) {
			if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
				var elem = context.getElementById( id );
				return elem ? [ elem ] : [];
			}
		};
	} else {
		Expr.filter[ "ID" ] =  function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				var node = typeof elem.getAttributeNode !== "undefined" &&
					elem.getAttributeNode( "id" );
				return node && node.value === attrId;
			};
		};

		// Support: IE 6 - 7 only
		// getElementById is not reliable as a find shortcut
		Expr.find[ "ID" ] = function( id, context ) {
			if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
				var node, i, elems,
					elem = context.getElementById( id );

				if ( elem ) {

					// Verify the id attribute
					node = elem.getAttributeNode( "id" );
					if ( node && node.value === id ) {
						return [ elem ];
					}

					// Fall back on getElementsByName
					elems = context.getElementsByName( id );
					i = 0;
					while ( ( elem = elems[ i++ ] ) ) {
						node = elem.getAttributeNode( "id" );
						if ( node && node.value === id ) {
							return [ elem ];
						}
					}
				}

				return [];
			}
		};
	}

	// Tag
	Expr.find[ "TAG" ] = support.getElementsByTagName ?
		function( tag, context ) {
			if ( typeof context.getElementsByTagName !== "undefined" ) {
				return context.getElementsByTagName( tag );

			// DocumentFragment nodes don't have gEBTN
			} else if ( support.qsa ) {
				return context.querySelectorAll( tag );
			}
		} :

		function( tag, context ) {
			var elem,
				tmp = [],
				i = 0,

				// By happy coincidence, a (broken) gEBTN appears on DocumentFragment nodes too
				results = context.getElementsByTagName( tag );

			// Filter out possible comments
			if ( tag === "*" ) {
				while ( ( elem = results[ i++ ] ) ) {
					if ( elem.nodeType === 1 ) {
						tmp.push( elem );
					}
				}

				return tmp;
			}
			return results;
		};

	// Class
	Expr.find[ "CLASS" ] = support.getElementsByClassName && function( className, context ) {
		if ( typeof context.getElementsByClassName !== "undefined" && documentIsHTML ) {
			return context.getElementsByClassName( className );
		}
	};

	/* QSA/matchesSelector
	---------------------------------------------------------------------- */

	// QSA and matchesSelector support

	// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
	rbuggyMatches = [];

	// qSa(:focus) reports false when true (Chrome 21)
	// We allow this because of a bug in IE8/9 that throws an error
	// whenever `document.activeElement` is accessed on an iframe
	// So, we allow :focus to pass through QSA all the time to avoid the IE error
	// See https://bugs.jquery.com/ticket/13378
	rbuggyQSA = [];

	if ( ( support.qsa = rnative.test( document.querySelectorAll ) ) ) {

		// Build QSA regex
		// Regex strategy adopted from Diego Perini
		assert( function( el ) {

			var input;

			// Select is set to empty string on purpose
			// This is to test IE's treatment of not explicitly
			// setting a boolean content attribute,
			// since its presence should be enough
			// https://bugs.jquery.com/ticket/12359
			docElem.appendChild( el ).innerHTML = "<a id='" + expando + "'></a>" +
				"<select id='" + expando + "-\r\\' msallowcapture=''>" +
				"<option selected=''></option></select>";

			// Support: IE8, Opera 11-12.16
			// Nothing should be selected when empty strings follow ^= or $= or *=
			// The test attribute must be unknown in Opera but "safe" for WinRT
			// https://msdn.microsoft.com/en-us/library/ie/hh465388.aspx#attribute_section
			if ( el.querySelectorAll( "[msallowcapture^='']" ).length ) {
				rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:''|\"\")" );
			}

			// Support: IE8
			// Boolean attributes and "value" are not treated correctly
			if ( !el.querySelectorAll( "[selected]" ).length ) {
				rbuggyQSA.push( "\\[" + whitespace + "*(?:value|" + booleans + ")" );
			}

			// Support: Chrome<29, Android<4.4, Safari<7.0+, iOS<7.0+, PhantomJS<1.9.8+
			if ( !el.querySelectorAll( "[id~=" + expando + "-]" ).length ) {
				rbuggyQSA.push( "~=" );
			}

			// Support: IE 11+, Edge 15 - 18+
			// IE 11/Edge don't find elements on a `[name='']` query in some cases.
			// Adding a temporary attribute to the document before the selection works
			// around the issue.
			// Interestingly, IE 10 & older don't seem to have the issue.
			input = document.createElement( "input" );
			input.setAttribute( "name", "" );
			el.appendChild( input );
			if ( !el.querySelectorAll( "[name='']" ).length ) {
				rbuggyQSA.push( "\\[" + whitespace + "*name" + whitespace + "*=" +
					whitespace + "*(?:''|\"\")" );
			}

			// Webkit/Opera - :checked should return selected option elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			// IE8 throws error here and will not see later tests
			if ( !el.querySelectorAll( ":checked" ).length ) {
				rbuggyQSA.push( ":checked" );
			}

			// Support: Safari 8+, iOS 8+
			// https://bugs.webkit.org/show_bug.cgi?id=136851
			// In-page `selector#id sibling-combinator selector` fails
			if ( !el.querySelectorAll( "a#" + expando + "+*" ).length ) {
				rbuggyQSA.push( ".#.+[+~]" );
			}

			// Support: Firefox <=3.6 - 5 only
			// Old Firefox doesn't throw on a badly-escaped identifier.
			el.querySelectorAll( "\\\f" );
			rbuggyQSA.push( "[\\r\\n\\f]" );
		} );

		assert( function( el ) {
			el.innerHTML = "<a href='' disabled='disabled'></a>" +
				"<select disabled='disabled'><option/></select>";

			// Support: Windows 8 Native Apps
			// The type and name attributes are restricted during .innerHTML assignment
			var input = document.createElement( "input" );
			input.setAttribute( "type", "hidden" );
			el.appendChild( input ).setAttribute( "name", "D" );

			// Support: IE8
			// Enforce case-sensitivity of name attribute
			if ( el.querySelectorAll( "[name=d]" ).length ) {
				rbuggyQSA.push( "name" + whitespace + "*[*^$|!~]?=" );
			}

			// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
			// IE8 throws error here and will not see later tests
			if ( el.querySelectorAll( ":enabled" ).length !== 2 ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Support: IE9-11+
			// IE's :disabled selector does not pick up the children of disabled fieldsets
			docElem.appendChild( el ).disabled = true;
			if ( el.querySelectorAll( ":disabled" ).length !== 2 ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Support: Opera 10 - 11 only
			// Opera 10-11 does not throw on post-comma invalid pseudos
			el.querySelectorAll( "*,:x" );
			rbuggyQSA.push( ",.*:" );
		} );
	}

	if ( ( support.matchesSelector = rnative.test( ( matches = docElem.matches ||
		docElem.webkitMatchesSelector ||
		docElem.mozMatchesSelector ||
		docElem.oMatchesSelector ||
		docElem.msMatchesSelector ) ) ) ) {

		assert( function( el ) {

			// Check to see if it's possible to do matchesSelector
			// on a disconnected node (IE 9)
			support.disconnectedMatch = matches.call( el, "*" );

			// This should fail with an exception
			// Gecko does not error, returns false instead
			matches.call( el, "[s!='']:x" );
			rbuggyMatches.push( "!=", pseudos );
		} );
	}

	rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join( "|" ) );
	rbuggyMatches = rbuggyMatches.length && new RegExp( rbuggyMatches.join( "|" ) );

	/* Contains
	---------------------------------------------------------------------- */
	hasCompare = rnative.test( docElem.compareDocumentPosition );

	// Element contains another
	// Purposefully self-exclusive
	// As in, an element does not contain itself
	contains = hasCompare || rnative.test( docElem.contains ) ?
		function( a, b ) {
			var adown = a.nodeType === 9 ? a.documentElement : a,
				bup = b && b.parentNode;
			return a === bup || !!( bup && bup.nodeType === 1 && (
				adown.contains ?
					adown.contains( bup ) :
					a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
			) );
		} :
		function( a, b ) {
			if ( b ) {
				while ( ( b = b.parentNode ) ) {
					if ( b === a ) {
						return true;
					}
				}
			}
			return false;
		};

	/* Sorting
	---------------------------------------------------------------------- */

	// Document order sorting
	sortOrder = hasCompare ?
	function( a, b ) {

		// Flag for duplicate removal
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		// Sort on method existence if only one input has compareDocumentPosition
		var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
		if ( compare ) {
			return compare;
		}

		// Calculate position if both inputs belong to the same document
		// Support: IE 11+, Edge 17 - 18+
		// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
		// two documents; shallow comparisons work.
		// eslint-disable-next-line eqeqeq
		compare = ( a.ownerDocument || a ) == ( b.ownerDocument || b ) ?
			a.compareDocumentPosition( b ) :

			// Otherwise we know they are disconnected
			1;

		// Disconnected nodes
		if ( compare & 1 ||
			( !support.sortDetached && b.compareDocumentPosition( a ) === compare ) ) {

			// Choose the first element that is related to our preferred document
			// Support: IE 11+, Edge 17 - 18+
			// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
			// two documents; shallow comparisons work.
			// eslint-disable-next-line eqeqeq
			if ( a == document || a.ownerDocument == preferredDoc &&
				contains( preferredDoc, a ) ) {
				return -1;
			}

			// Support: IE 11+, Edge 17 - 18+
			// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
			// two documents; shallow comparisons work.
			// eslint-disable-next-line eqeqeq
			if ( b == document || b.ownerDocument == preferredDoc &&
				contains( preferredDoc, b ) ) {
				return 1;
			}

			// Maintain original order
			return sortInput ?
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;
		}

		return compare & 4 ? -1 : 1;
	} :
	function( a, b ) {

		// Exit early if the nodes are identical
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		var cur,
			i = 0,
			aup = a.parentNode,
			bup = b.parentNode,
			ap = [ a ],
			bp = [ b ];

		// Parentless nodes are either documents or disconnected
		if ( !aup || !bup ) {

			// Support: IE 11+, Edge 17 - 18+
			// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
			// two documents; shallow comparisons work.
			/* eslint-disable eqeqeq */
			return a == document ? -1 :
				b == document ? 1 :
				/* eslint-enable eqeqeq */
				aup ? -1 :
				bup ? 1 :
				sortInput ?
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;

		// If the nodes are siblings, we can do a quick check
		} else if ( aup === bup ) {
			return siblingCheck( a, b );
		}

		// Otherwise we need full lists of their ancestors for comparison
		cur = a;
		while ( ( cur = cur.parentNode ) ) {
			ap.unshift( cur );
		}
		cur = b;
		while ( ( cur = cur.parentNode ) ) {
			bp.unshift( cur );
		}

		// Walk down the tree looking for a discrepancy
		while ( ap[ i ] === bp[ i ] ) {
			i++;
		}

		return i ?

			// Do a sibling check if the nodes have a common ancestor
			siblingCheck( ap[ i ], bp[ i ] ) :

			// Otherwise nodes in our document sort first
			// Support: IE 11+, Edge 17 - 18+
			// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
			// two documents; shallow comparisons work.
			/* eslint-disable eqeqeq */
			ap[ i ] == preferredDoc ? -1 :
			bp[ i ] == preferredDoc ? 1 :
			/* eslint-enable eqeqeq */
			0;
	};

	return document;
};

Sizzle.matches = function( expr, elements ) {
	return Sizzle( expr, null, null, elements );
};

Sizzle.matchesSelector = function( elem, expr ) {
	setDocument( elem );

	if ( support.matchesSelector && documentIsHTML &&
		!nonnativeSelectorCache[ expr + " " ] &&
		( !rbuggyMatches || !rbuggyMatches.test( expr ) ) &&
		( !rbuggyQSA     || !rbuggyQSA.test( expr ) ) ) {

		try {
			var ret = matches.call( elem, expr );

			// IE 9's matchesSelector returns false on disconnected nodes
			if ( ret || support.disconnectedMatch ||

				// As well, disconnected nodes are said to be in a document
				// fragment in IE 9
				elem.document && elem.document.nodeType !== 11 ) {
				return ret;
			}
		} catch ( e ) {
			nonnativeSelectorCache( expr, true );
		}
	}

	return Sizzle( expr, document, null, [ elem ] ).length > 0;
};

Sizzle.contains = function( context, elem ) {

	// Set document vars if needed
	// Support: IE 11+, Edge 17 - 18+
	// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
	// two documents; shallow comparisons work.
	// eslint-disable-next-line eqeqeq
	if ( ( context.ownerDocument || context ) != document ) {
		setDocument( context );
	}
	return contains( context, elem );
};

Sizzle.attr = function( elem, name ) {

	// Set document vars if needed
	// Support: IE 11+, Edge 17 - 18+
	// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
	// two documents; shallow comparisons work.
	// eslint-disable-next-line eqeqeq
	if ( ( elem.ownerDocument || elem ) != document ) {
		setDocument( elem );
	}

	var fn = Expr.attrHandle[ name.toLowerCase() ],

		// Don't get fooled by Object.prototype properties (jQuery #13807)
		val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
			fn( elem, name, !documentIsHTML ) :
			undefined;

	return val !== undefined ?
		val :
		support.attributes || !documentIsHTML ?
			elem.getAttribute( name ) :
			( val = elem.getAttributeNode( name ) ) && val.specified ?
				val.value :
				null;
};

Sizzle.escape = function( sel ) {
	return ( sel + "" ).replace( rcssescape, fcssescape );
};

Sizzle.error = function( msg ) {
	throw new Error( "Syntax error, unrecognized expression: " + msg );
};

/**
 * Document sorting and removing duplicates
 * @param {ArrayLike} results
 */
Sizzle.uniqueSort = function( results ) {
	var elem,
		duplicates = [],
		j = 0,
		i = 0;

	// Unless we *know* we can detect duplicates, assume their presence
	hasDuplicate = !support.detectDuplicates;
	sortInput = !support.sortStable && results.slice( 0 );
	results.sort( sortOrder );

	if ( hasDuplicate ) {
		while ( ( elem = results[ i++ ] ) ) {
			if ( elem === results[ i ] ) {
				j = duplicates.push( i );
			}
		}
		while ( j-- ) {
			results.splice( duplicates[ j ], 1 );
		}
	}

	// Clear input after sorting to release objects
	// See https://github.com/jquery/sizzle/pull/225
	sortInput = null;

	return results;
};

/**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
getText = Sizzle.getText = function( elem ) {
	var node,
		ret = "",
		i = 0,
		nodeType = elem.nodeType;

	if ( !nodeType ) {

		// If no nodeType, this is expected to be an array
		while ( ( node = elem[ i++ ] ) ) {

			// Do not traverse comment nodes
			ret += getText( node );
		}
	} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {

		// Use textContent for elements
		// innerText usage removed for consistency of new lines (jQuery #11153)
		if ( typeof elem.textContent === "string" ) {
			return elem.textContent;
		} else {

			// Traverse its children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				ret += getText( elem );
			}
		}
	} else if ( nodeType === 3 || nodeType === 4 ) {
		return elem.nodeValue;
	}

	// Do not include comment or processing instruction nodes

	return ret;
};

Expr = Sizzle.selectors = {

	// Can be adjusted by the user
	cacheLength: 50,

	createPseudo: markFunction,

	match: matchExpr,

	attrHandle: {},

	find: {},

	relative: {
		">": { dir: "parentNode", first: true },
		" ": { dir: "parentNode" },
		"+": { dir: "previousSibling", first: true },
		"~": { dir: "previousSibling" }
	},

	preFilter: {
		"ATTR": function( match ) {
			match[ 1 ] = match[ 1 ].replace( runescape, funescape );

			// Move the given value to match[3] whether quoted or unquoted
			match[ 3 ] = ( match[ 3 ] || match[ 4 ] ||
				match[ 5 ] || "" ).replace( runescape, funescape );

			if ( match[ 2 ] === "~=" ) {
				match[ 3 ] = " " + match[ 3 ] + " ";
			}

			return match.slice( 0, 4 );
		},

		"CHILD": function( match ) {

			/* matches from matchExpr["CHILD"]
				1 type (only|nth|...)
				2 what (child|of-type)
				3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
				4 xn-component of xn+y argument ([+-]?\d*n|)
				5 sign of xn-component
				6 x of xn-component
				7 sign of y-component
				8 y of y-component
			*/
			match[ 1 ] = match[ 1 ].toLowerCase();

			if ( match[ 1 ].slice( 0, 3 ) === "nth" ) {

				// nth-* requires argument
				if ( !match[ 3 ] ) {
					Sizzle.error( match[ 0 ] );
				}

				// numeric x and y parameters for Expr.filter.CHILD
				// remember that false/true cast respectively to 0/1
				match[ 4 ] = +( match[ 4 ] ?
					match[ 5 ] + ( match[ 6 ] || 1 ) :
					2 * ( match[ 3 ] === "even" || match[ 3 ] === "odd" ) );
				match[ 5 ] = +( ( match[ 7 ] + match[ 8 ] ) || match[ 3 ] === "odd" );

				// other types prohibit arguments
			} else if ( match[ 3 ] ) {
				Sizzle.error( match[ 0 ] );
			}

			return match;
		},

		"PSEUDO": function( match ) {
			var excess,
				unquoted = !match[ 6 ] && match[ 2 ];

			if ( matchExpr[ "CHILD" ].test( match[ 0 ] ) ) {
				return null;
			}

			// Accept quoted arguments as-is
			if ( match[ 3 ] ) {
				match[ 2 ] = match[ 4 ] || match[ 5 ] || "";

			// Strip excess characters from unquoted arguments
			} else if ( unquoted && rpseudo.test( unquoted ) &&

				// Get excess from tokenize (recursively)
				( excess = tokenize( unquoted, true ) ) &&

				// advance to the next closing parenthesis
				( excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length ) ) {

				// excess is a negative index
				match[ 0 ] = match[ 0 ].slice( 0, excess );
				match[ 2 ] = unquoted.slice( 0, excess );
			}

			// Return only captures needed by the pseudo filter method (type and argument)
			return match.slice( 0, 3 );
		}
	},

	filter: {

		"TAG": function( nodeNameSelector ) {
			var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
			return nodeNameSelector === "*" ?
				function() {
					return true;
				} :
				function( elem ) {
					return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
				};
		},

		"CLASS": function( className ) {
			var pattern = classCache[ className + " " ];

			return pattern ||
				( pattern = new RegExp( "(^|" + whitespace +
					")" + className + "(" + whitespace + "|$)" ) ) && classCache(
						className, function( elem ) {
							return pattern.test(
								typeof elem.className === "string" && elem.className ||
								typeof elem.getAttribute !== "undefined" &&
									elem.getAttribute( "class" ) ||
								""
							);
				} );
		},

		"ATTR": function( name, operator, check ) {
			return function( elem ) {
				var result = Sizzle.attr( elem, name );

				if ( result == null ) {
					return operator === "!=";
				}
				if ( !operator ) {
					return true;
				}

				result += "";

				/* eslint-disable max-len */

				return operator === "=" ? result === check :
					operator === "!=" ? result !== check :
					operator === "^=" ? check && result.indexOf( check ) === 0 :
					operator === "*=" ? check && result.indexOf( check ) > -1 :
					operator === "$=" ? check && result.slice( -check.length ) === check :
					operator === "~=" ? ( " " + result.replace( rwhitespace, " " ) + " " ).indexOf( check ) > -1 :
					operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
					false;
				/* eslint-enable max-len */

			};
		},

		"CHILD": function( type, what, _argument, first, last ) {
			var simple = type.slice( 0, 3 ) !== "nth",
				forward = type.slice( -4 ) !== "last",
				ofType = what === "of-type";

			return first === 1 && last === 0 ?

				// Shortcut for :nth-*(n)
				function( elem ) {
					return !!elem.parentNode;
				} :

				function( elem, _context, xml ) {
					var cache, uniqueCache, outerCache, node, nodeIndex, start,
						dir = simple !== forward ? "nextSibling" : "previousSibling",
						parent = elem.parentNode,
						name = ofType && elem.nodeName.toLowerCase(),
						useCache = !xml && !ofType,
						diff = false;

					if ( parent ) {

						// :(first|last|only)-(child|of-type)
						if ( simple ) {
							while ( dir ) {
								node = elem;
								while ( ( node = node[ dir ] ) ) {
									if ( ofType ?
										node.nodeName.toLowerCase() === name :
										node.nodeType === 1 ) {

										return false;
									}
								}

								// Reverse direction for :only-* (if we haven't yet done so)
								start = dir = type === "only" && !start && "nextSibling";
							}
							return true;
						}

						start = [ forward ? parent.firstChild : parent.lastChild ];

						// non-xml :nth-child(...) stores cache data on `parent`
						if ( forward && useCache ) {

							// Seek `elem` from a previously-cached index

							// ...in a gzip-friendly way
							node = parent;
							outerCache = node[ expando ] || ( node[ expando ] = {} );

							// Support: IE <9 only
							// Defend against cloned attroperties (jQuery gh-1709)
							uniqueCache = outerCache[ node.uniqueID ] ||
								( outerCache[ node.uniqueID ] = {} );

							cache = uniqueCache[ type ] || [];
							nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
							diff = nodeIndex && cache[ 2 ];
							node = nodeIndex && parent.childNodes[ nodeIndex ];

							while ( ( node = ++nodeIndex && node && node[ dir ] ||

								// Fallback to seeking `elem` from the start
								( diff = nodeIndex = 0 ) || start.pop() ) ) {

								// When found, cache indexes on `parent` and break
								if ( node.nodeType === 1 && ++diff && node === elem ) {
									uniqueCache[ type ] = [ dirruns, nodeIndex, diff ];
									break;
								}
							}

						} else {

							// Use previously-cached element index if available
							if ( useCache ) {

								// ...in a gzip-friendly way
								node = elem;
								outerCache = node[ expando ] || ( node[ expando ] = {} );

								// Support: IE <9 only
								// Defend against cloned attroperties (jQuery gh-1709)
								uniqueCache = outerCache[ node.uniqueID ] ||
									( outerCache[ node.uniqueID ] = {} );

								cache = uniqueCache[ type ] || [];
								nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
								diff = nodeIndex;
							}

							// xml :nth-child(...)
							// or :nth-last-child(...) or :nth(-last)?-of-type(...)
							if ( diff === false ) {

								// Use the same loop as above to seek `elem` from the start
								while ( ( node = ++nodeIndex && node && node[ dir ] ||
									( diff = nodeIndex = 0 ) || start.pop() ) ) {

									if ( ( ofType ?
										node.nodeName.toLowerCase() === name :
										node.nodeType === 1 ) &&
										++diff ) {

										// Cache the index of each encountered element
										if ( useCache ) {
											outerCache = node[ expando ] ||
												( node[ expando ] = {} );

											// Support: IE <9 only
											// Defend against cloned attroperties (jQuery gh-1709)
											uniqueCache = outerCache[ node.uniqueID ] ||
												( outerCache[ node.uniqueID ] = {} );

											uniqueCache[ type ] = [ dirruns, diff ];
										}

										if ( node === elem ) {
											break;
										}
									}
								}
							}
						}

						// Incorporate the offset, then check against cycle size
						diff -= last;
						return diff === first || ( diff % first === 0 && diff / first >= 0 );
					}
				};
		},

		"PSEUDO": function( pseudo, argument ) {

			// pseudo-class names are case-insensitive
			// http://www.w3.org/TR/selectors/#pseudo-classes
			// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
			// Remember that setFilters inherits from pseudos
			var args,
				fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
					Sizzle.error( "unsupported pseudo: " + pseudo );

			// The user may use createPseudo to indicate that
			// arguments are needed to create the filter function
			// just as Sizzle does
			if ( fn[ expando ] ) {
				return fn( argument );
			}

			// But maintain support for old signatures
			if ( fn.length > 1 ) {
				args = [ pseudo, pseudo, "", argument ];
				return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
					markFunction( function( seed, matches ) {
						var idx,
							matched = fn( seed, argument ),
							i = matched.length;
						while ( i-- ) {
							idx = indexOf( seed, matched[ i ] );
							seed[ idx ] = !( matches[ idx ] = matched[ i ] );
						}
					} ) :
					function( elem ) {
						return fn( elem, 0, args );
					};
			}

			return fn;
		}
	},

	pseudos: {

		// Potentially complex pseudos
		"not": markFunction( function( selector ) {

			// Trim the selector passed to compile
			// to avoid treating leading and trailing
			// spaces as combinators
			var input = [],
				results = [],
				matcher = compile( selector.replace( rtrim, "$1" ) );

			return matcher[ expando ] ?
				markFunction( function( seed, matches, _context, xml ) {
					var elem,
						unmatched = matcher( seed, null, xml, [] ),
						i = seed.length;

					// Match elements unmatched by `matcher`
					while ( i-- ) {
						if ( ( elem = unmatched[ i ] ) ) {
							seed[ i ] = !( matches[ i ] = elem );
						}
					}
				} ) :
				function( elem, _context, xml ) {
					input[ 0 ] = elem;
					matcher( input, null, xml, results );

					// Don't keep the element (issue #299)
					input[ 0 ] = null;
					return !results.pop();
				};
		} ),

		"has": markFunction( function( selector ) {
			return function( elem ) {
				return Sizzle( selector, elem ).length > 0;
			};
		} ),

		"contains": markFunction( function( text ) {
			text = text.replace( runescape, funescape );
			return function( elem ) {
				return ( elem.textContent || getText( elem ) ).indexOf( text ) > -1;
			};
		} ),

		// "Whether an element is represented by a :lang() selector
		// is based solely on the element's language value
		// being equal to the identifier C,
		// or beginning with the identifier C immediately followed by "-".
		// The matching of C against the element's language value is performed case-insensitively.
		// The identifier C does not have to be a valid language name."
		// http://www.w3.org/TR/selectors/#lang-pseudo
		"lang": markFunction( function( lang ) {

			// lang value must be a valid identifier
			if ( !ridentifier.test( lang || "" ) ) {
				Sizzle.error( "unsupported lang: " + lang );
			}
			lang = lang.replace( runescape, funescape ).toLowerCase();
			return function( elem ) {
				var elemLang;
				do {
					if ( ( elemLang = documentIsHTML ?
						elem.lang :
						elem.getAttribute( "xml:lang" ) || elem.getAttribute( "lang" ) ) ) {

						elemLang = elemLang.toLowerCase();
						return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
					}
				} while ( ( elem = elem.parentNode ) && elem.nodeType === 1 );
				return false;
			};
		} ),

		// Miscellaneous
		"target": function( elem ) {
			var hash = window.location && window.location.hash;
			return hash && hash.slice( 1 ) === elem.id;
		},

		"root": function( elem ) {
			return elem === docElem;
		},

		"focus": function( elem ) {
			return elem === document.activeElement &&
				( !document.hasFocus || document.hasFocus() ) &&
				!!( elem.type || elem.href || ~elem.tabIndex );
		},

		// Boolean properties
		"enabled": createDisabledPseudo( false ),
		"disabled": createDisabledPseudo( true ),

		"checked": function( elem ) {

			// In CSS3, :checked should return both checked and selected elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			var nodeName = elem.nodeName.toLowerCase();
			return ( nodeName === "input" && !!elem.checked ) ||
				( nodeName === "option" && !!elem.selected );
		},

		"selected": function( elem ) {

			// Accessing this property makes selected-by-default
			// options in Safari work properly
			if ( elem.parentNode ) {
				// eslint-disable-next-line no-unused-expressions
				elem.parentNode.selectedIndex;
			}

			return elem.selected === true;
		},

		// Contents
		"empty": function( elem ) {

			// http://www.w3.org/TR/selectors/#empty-pseudo
			// :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
			//   but not by others (comment: 8; processing instruction: 7; etc.)
			// nodeType < 6 works because attributes (2) do not appear as children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				if ( elem.nodeType < 6 ) {
					return false;
				}
			}
			return true;
		},

		"parent": function( elem ) {
			return !Expr.pseudos[ "empty" ]( elem );
		},

		// Element/input types
		"header": function( elem ) {
			return rheader.test( elem.nodeName );
		},

		"input": function( elem ) {
			return rinputs.test( elem.nodeName );
		},

		"button": function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === "button" || name === "button";
		},

		"text": function( elem ) {
			var attr;
			return elem.nodeName.toLowerCase() === "input" &&
				elem.type === "text" &&

				// Support: IE<8
				// New HTML5 attribute values (e.g., "search") appear with elem.type === "text"
				( ( attr = elem.getAttribute( "type" ) ) == null ||
					attr.toLowerCase() === "text" );
		},

		// Position-in-collection
		"first": createPositionalPseudo( function() {
			return [ 0 ];
		} ),

		"last": createPositionalPseudo( function( _matchIndexes, length ) {
			return [ length - 1 ];
		} ),

		"eq": createPositionalPseudo( function( _matchIndexes, length, argument ) {
			return [ argument < 0 ? argument + length : argument ];
		} ),

		"even": createPositionalPseudo( function( matchIndexes, length ) {
			var i = 0;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		} ),

		"odd": createPositionalPseudo( function( matchIndexes, length ) {
			var i = 1;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		} ),

		"lt": createPositionalPseudo( function( matchIndexes, length, argument ) {
			var i = argument < 0 ?
				argument + length :
				argument > length ?
					length :
					argument;
			for ( ; --i >= 0; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		} ),

		"gt": createPositionalPseudo( function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; ++i < length; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		} )
	}
};

Expr.pseudos[ "nth" ] = Expr.pseudos[ "eq" ];

// Add button/input type pseudos
for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
	Expr.pseudos[ i ] = createInputPseudo( i );
}
for ( i in { submit: true, reset: true } ) {
	Expr.pseudos[ i ] = createButtonPseudo( i );
}

// Easy API for creating new setFilters
function setFilters() {}
setFilters.prototype = Expr.filters = Expr.pseudos;
Expr.setFilters = new setFilters();

tokenize = Sizzle.tokenize = function( selector, parseOnly ) {
	var matched, match, tokens, type,
		soFar, groups, preFilters,
		cached = tokenCache[ selector + " " ];

	if ( cached ) {
		return parseOnly ? 0 : cached.slice( 0 );
	}

	soFar = selector;
	groups = [];
	preFilters = Expr.preFilter;

	while ( soFar ) {

		// Comma and first run
		if ( !matched || ( match = rcomma.exec( soFar ) ) ) {
			if ( match ) {

				// Don't consume trailing commas as valid
				soFar = soFar.slice( match[ 0 ].length ) || soFar;
			}
			groups.push( ( tokens = [] ) );
		}

		matched = false;

		// Combinators
		if ( ( match = rcombinators.exec( soFar ) ) ) {
			matched = match.shift();
			tokens.push( {
				value: matched,

				// Cast descendant combinators to space
				type: match[ 0 ].replace( rtrim, " " )
			} );
			soFar = soFar.slice( matched.length );
		}

		// Filters
		for ( type in Expr.filter ) {
			if ( ( match = matchExpr[ type ].exec( soFar ) ) && ( !preFilters[ type ] ||
				( match = preFilters[ type ]( match ) ) ) ) {
				matched = match.shift();
				tokens.push( {
					value: matched,
					type: type,
					matches: match
				} );
				soFar = soFar.slice( matched.length );
			}
		}

		if ( !matched ) {
			break;
		}
	}

	// Return the length of the invalid excess
	// if we're just parsing
	// Otherwise, throw an error or return tokens
	return parseOnly ?
		soFar.length :
		soFar ?
			Sizzle.error( selector ) :

			// Cache the tokens
			tokenCache( selector, groups ).slice( 0 );
};

function toSelector( tokens ) {
	var i = 0,
		len = tokens.length,
		selector = "";
	for ( ; i < len; i++ ) {
		selector += tokens[ i ].value;
	}
	return selector;
}

function addCombinator( matcher, combinator, base ) {
	var dir = combinator.dir,
		skip = combinator.next,
		key = skip || dir,
		checkNonElements = base && key === "parentNode",
		doneName = done++;

	return combinator.first ?

		// Check against closest ancestor/preceding element
		function( elem, context, xml ) {
			while ( ( elem = elem[ dir ] ) ) {
				if ( elem.nodeType === 1 || checkNonElements ) {
					return matcher( elem, context, xml );
				}
			}
			return false;
		} :

		// Check against all ancestor/preceding elements
		function( elem, context, xml ) {
			var oldCache, uniqueCache, outerCache,
				newCache = [ dirruns, doneName ];

			// We can't set arbitrary data on XML nodes, so they don't benefit from combinator caching
			if ( xml ) {
				while ( ( elem = elem[ dir ] ) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						if ( matcher( elem, context, xml ) ) {
							return true;
						}
					}
				}
			} else {
				while ( ( elem = elem[ dir ] ) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						outerCache = elem[ expando ] || ( elem[ expando ] = {} );

						// Support: IE <9 only
						// Defend against cloned attroperties (jQuery gh-1709)
						uniqueCache = outerCache[ elem.uniqueID ] ||
							( outerCache[ elem.uniqueID ] = {} );

						if ( skip && skip === elem.nodeName.toLowerCase() ) {
							elem = elem[ dir ] || elem;
						} else if ( ( oldCache = uniqueCache[ key ] ) &&
							oldCache[ 0 ] === dirruns && oldCache[ 1 ] === doneName ) {

							// Assign to newCache so results back-propagate to previous elements
							return ( newCache[ 2 ] = oldCache[ 2 ] );
						} else {

							// Reuse newcache so results back-propagate to previous elements
							uniqueCache[ key ] = newCache;

							// A match means we're done; a fail means we have to keep checking
							if ( ( newCache[ 2 ] = matcher( elem, context, xml ) ) ) {
								return true;
							}
						}
					}
				}
			}
			return false;
		};
}

function elementMatcher( matchers ) {
	return matchers.length > 1 ?
		function( elem, context, xml ) {
			var i = matchers.length;
			while ( i-- ) {
				if ( !matchers[ i ]( elem, context, xml ) ) {
					return false;
				}
			}
			return true;
		} :
		matchers[ 0 ];
}

function multipleContexts( selector, contexts, results ) {
	var i = 0,
		len = contexts.length;
	for ( ; i < len; i++ ) {
		Sizzle( selector, contexts[ i ], results );
	}
	return results;
}

function condense( unmatched, map, filter, context, xml ) {
	var elem,
		newUnmatched = [],
		i = 0,
		len = unmatched.length,
		mapped = map != null;

	for ( ; i < len; i++ ) {
		if ( ( elem = unmatched[ i ] ) ) {
			if ( !filter || filter( elem, context, xml ) ) {
				newUnmatched.push( elem );
				if ( mapped ) {
					map.push( i );
				}
			}
		}
	}

	return newUnmatched;
}

function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
	if ( postFilter && !postFilter[ expando ] ) {
		postFilter = setMatcher( postFilter );
	}
	if ( postFinder && !postFinder[ expando ] ) {
		postFinder = setMatcher( postFinder, postSelector );
	}
	return markFunction( function( seed, results, context, xml ) {
		var temp, i, elem,
			preMap = [],
			postMap = [],
			preexisting = results.length,

			// Get initial elements from seed or context
			elems = seed || multipleContexts(
				selector || "*",
				context.nodeType ? [ context ] : context,
				[]
			),

			// Prefilter to get matcher input, preserving a map for seed-results synchronization
			matcherIn = preFilter && ( seed || !selector ) ?
				condense( elems, preMap, preFilter, context, xml ) :
				elems,

			matcherOut = matcher ?

				// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
				postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

					// ...intermediate processing is necessary
					[] :

					// ...otherwise use results directly
					results :
				matcherIn;

		// Find primary matches
		if ( matcher ) {
			matcher( matcherIn, matcherOut, context, xml );
		}

		// Apply postFilter
		if ( postFilter ) {
			temp = condense( matcherOut, postMap );
			postFilter( temp, [], context, xml );

			// Un-match failing elements by moving them back to matcherIn
			i = temp.length;
			while ( i-- ) {
				if ( ( elem = temp[ i ] ) ) {
					matcherOut[ postMap[ i ] ] = !( matcherIn[ postMap[ i ] ] = elem );
				}
			}
		}

		if ( seed ) {
			if ( postFinder || preFilter ) {
				if ( postFinder ) {

					// Get the final matcherOut by condensing this intermediate into postFinder contexts
					temp = [];
					i = matcherOut.length;
					while ( i-- ) {
						if ( ( elem = matcherOut[ i ] ) ) {

							// Restore matcherIn since elem is not yet a final match
							temp.push( ( matcherIn[ i ] = elem ) );
						}
					}
					postFinder( null, ( matcherOut = [] ), temp, xml );
				}

				// Move matched elements from seed to results to keep them synchronized
				i = matcherOut.length;
				while ( i-- ) {
					if ( ( elem = matcherOut[ i ] ) &&
						( temp = postFinder ? indexOf( seed, elem ) : preMap[ i ] ) > -1 ) {

						seed[ temp ] = !( results[ temp ] = elem );
					}
				}
			}

		// Add elements to results, through postFinder if defined
		} else {
			matcherOut = condense(
				matcherOut === results ?
					matcherOut.splice( preexisting, matcherOut.length ) :
					matcherOut
			);
			if ( postFinder ) {
				postFinder( null, results, matcherOut, xml );
			} else {
				push.apply( results, matcherOut );
			}
		}
	} );
}

function matcherFromTokens( tokens ) {
	var checkContext, matcher, j,
		len = tokens.length,
		leadingRelative = Expr.relative[ tokens[ 0 ].type ],
		implicitRelative = leadingRelative || Expr.relative[ " " ],
		i = leadingRelative ? 1 : 0,

		// The foundational matcher ensures that elements are reachable from top-level context(s)
		matchContext = addCombinator( function( elem ) {
			return elem === checkContext;
		}, implicitRelative, true ),
		matchAnyContext = addCombinator( function( elem ) {
			return indexOf( checkContext, elem ) > -1;
		}, implicitRelative, true ),
		matchers = [ function( elem, context, xml ) {
			var ret = ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
				( checkContext = context ).nodeType ?
					matchContext( elem, context, xml ) :
					matchAnyContext( elem, context, xml ) );

			// Avoid hanging onto element (issue #299)
			checkContext = null;
			return ret;
		} ];

	for ( ; i < len; i++ ) {
		if ( ( matcher = Expr.relative[ tokens[ i ].type ] ) ) {
			matchers = [ addCombinator( elementMatcher( matchers ), matcher ) ];
		} else {
			matcher = Expr.filter[ tokens[ i ].type ].apply( null, tokens[ i ].matches );

			// Return special upon seeing a positional matcher
			if ( matcher[ expando ] ) {

				// Find the next relative operator (if any) for proper handling
				j = ++i;
				for ( ; j < len; j++ ) {
					if ( Expr.relative[ tokens[ j ].type ] ) {
						break;
					}
				}
				return setMatcher(
					i > 1 && elementMatcher( matchers ),
					i > 1 && toSelector(

					// If the preceding token was a descendant combinator, insert an implicit any-element `*`
					tokens
						.slice( 0, i - 1 )
						.concat( { value: tokens[ i - 2 ].type === " " ? "*" : "" } )
					).replace( rtrim, "$1" ),
					matcher,
					i < j && matcherFromTokens( tokens.slice( i, j ) ),
					j < len && matcherFromTokens( ( tokens = tokens.slice( j ) ) ),
					j < len && toSelector( tokens )
				);
			}
			matchers.push( matcher );
		}
	}

	return elementMatcher( matchers );
}

function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
	var bySet = setMatchers.length > 0,
		byElement = elementMatchers.length > 0,
		superMatcher = function( seed, context, xml, results, outermost ) {
			var elem, j, matcher,
				matchedCount = 0,
				i = "0",
				unmatched = seed && [],
				setMatched = [],
				contextBackup = outermostContext,

				// We must always have either seed elements or outermost context
				elems = seed || byElement && Expr.find[ "TAG" ]( "*", outermost ),

				// Use integer dirruns iff this is the outermost matcher
				dirrunsUnique = ( dirruns += contextBackup == null ? 1 : Math.random() || 0.1 ),
				len = elems.length;

			if ( outermost ) {

				// Support: IE 11+, Edge 17 - 18+
				// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
				// two documents; shallow comparisons work.
				// eslint-disable-next-line eqeqeq
				outermostContext = context == document || context || outermost;
			}

			// Add elements passing elementMatchers directly to results
			// Support: IE<9, Safari
			// Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id
			for ( ; i !== len && ( elem = elems[ i ] ) != null; i++ ) {
				if ( byElement && elem ) {
					j = 0;

					// Support: IE 11+, Edge 17 - 18+
					// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
					// two documents; shallow comparisons work.
					// eslint-disable-next-line eqeqeq
					if ( !context && elem.ownerDocument != document ) {
						setDocument( elem );
						xml = !documentIsHTML;
					}
					while ( ( matcher = elementMatchers[ j++ ] ) ) {
						if ( matcher( elem, context || document, xml ) ) {
							results.push( elem );
							break;
						}
					}
					if ( outermost ) {
						dirruns = dirrunsUnique;
					}
				}

				// Track unmatched elements for set filters
				if ( bySet ) {

					// They will have gone through all possible matchers
					if ( ( elem = !matcher && elem ) ) {
						matchedCount--;
					}

					// Lengthen the array for every element, matched or not
					if ( seed ) {
						unmatched.push( elem );
					}
				}
			}

			// `i` is now the count of elements visited above, and adding it to `matchedCount`
			// makes the latter nonnegative.
			matchedCount += i;

			// Apply set filters to unmatched elements
			// NOTE: This can be skipped if there are no unmatched elements (i.e., `matchedCount`
			// equals `i`), unless we didn't visit _any_ elements in the above loop because we have
			// no element matchers and no seed.
			// Incrementing an initially-string "0" `i` allows `i` to remain a string only in that
			// case, which will result in a "00" `matchedCount` that differs from `i` but is also
			// numerically zero.
			if ( bySet && i !== matchedCount ) {
				j = 0;
				while ( ( matcher = setMatchers[ j++ ] ) ) {
					matcher( unmatched, setMatched, context, xml );
				}

				if ( seed ) {

					// Reintegrate element matches to eliminate the need for sorting
					if ( matchedCount > 0 ) {
						while ( i-- ) {
							if ( !( unmatched[ i ] || setMatched[ i ] ) ) {
								setMatched[ i ] = pop.call( results );
							}
						}
					}

					// Discard index placeholder values to get only actual matches
					setMatched = condense( setMatched );
				}

				// Add matches to results
				push.apply( results, setMatched );

				// Seedless set matches succeeding multiple successful matchers stipulate sorting
				if ( outermost && !seed && setMatched.length > 0 &&
					( matchedCount + setMatchers.length ) > 1 ) {

					Sizzle.uniqueSort( results );
				}
			}

			// Override manipulation of globals by nested matchers
			if ( outermost ) {
				dirruns = dirrunsUnique;
				outermostContext = contextBackup;
			}

			return unmatched;
		};

	return bySet ?
		markFunction( superMatcher ) :
		superMatcher;
}

compile = Sizzle.compile = function( selector, match /* Internal Use Only */ ) {
	var i,
		setMatchers = [],
		elementMatchers = [],
		cached = compilerCache[ selector + " " ];

	if ( !cached ) {

		// Generate a function of recursive functions that can be used to check each element
		if ( !match ) {
			match = tokenize( selector );
		}
		i = match.length;
		while ( i-- ) {
			cached = matcherFromTokens( match[ i ] );
			if ( cached[ expando ] ) {
				setMatchers.push( cached );
			} else {
				elementMatchers.push( cached );
			}
		}

		// Cache the compiled function
		cached = compilerCache(
			selector,
			matcherFromGroupMatchers( elementMatchers, setMatchers )
		);

		// Save selector and tokenization
		cached.selector = selector;
	}
	return cached;
};

/**
 * A low-level selection function that works with Sizzle's compiled
 *  selector functions
 * @param {String|Function} selector A selector or a pre-compiled
 *  selector function built with Sizzle.compile
 * @param {Element} context
 * @param {Array} [results]
 * @param {Array} [seed] A set of elements to match against
 */
select = Sizzle.select = function( selector, context, results, seed ) {
	var i, tokens, token, type, find,
		compiled = typeof selector === "function" && selector,
		match = !seed && tokenize( ( selector = compiled.selector || selector ) );

	results = results || [];

	// Try to minimize operations if there is only one selector in the list and no seed
	// (the latter of which guarantees us context)
	if ( match.length === 1 ) {

		// Reduce context if the leading compound selector is an ID
		tokens = match[ 0 ] = match[ 0 ].slice( 0 );
		if ( tokens.length > 2 && ( token = tokens[ 0 ] ).type === "ID" &&
			context.nodeType === 9 && documentIsHTML && Expr.relative[ tokens[ 1 ].type ] ) {

			context = ( Expr.find[ "ID" ]( token.matches[ 0 ]
				.replace( runescape, funescape ), context ) || [] )[ 0 ];
			if ( !context ) {
				return results;

			// Precompiled matchers will still verify ancestry, so step up a level
			} else if ( compiled ) {
				context = context.parentNode;
			}

			selector = selector.slice( tokens.shift().value.length );
		}

		// Fetch a seed set for right-to-left matching
		i = matchExpr[ "needsContext" ].test( selector ) ? 0 : tokens.length;
		while ( i-- ) {
			token = tokens[ i ];

			// Abort if we hit a combinator
			if ( Expr.relative[ ( type = token.type ) ] ) {
				break;
			}
			if ( ( find = Expr.find[ type ] ) ) {

				// Search, expanding context for leading sibling combinators
				if ( ( seed = find(
					token.matches[ 0 ].replace( runescape, funescape ),
					rsibling.test( tokens[ 0 ].type ) && testContext( context.parentNode ) ||
						context
				) ) ) {

					// If seed is empty or no tokens remain, we can return early
					tokens.splice( i, 1 );
					selector = seed.length && toSelector( tokens );
					if ( !selector ) {
						push.apply( results, seed );
						return results;
					}

					break;
				}
			}
		}
	}

	// Compile and execute a filtering function if one is not provided
	// Provide `match` to avoid retokenization if we modified the selector above
	( compiled || compile( selector, match ) )(
		seed,
		context,
		!documentIsHTML,
		results,
		!context || rsibling.test( selector ) && testContext( context.parentNode ) || context
	);
	return results;
};

// One-time assignments

// Sort stability
support.sortStable = expando.split( "" ).sort( sortOrder ).join( "" ) === expando;

// Support: Chrome 14-35+
// Always assume duplicates if they aren't passed to the comparison function
support.detectDuplicates = !!hasDuplicate;

// Initialize against the default document
setDocument();

// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
// Detached nodes confoundingly follow *each other*
support.sortDetached = assert( function( el ) {

	// Should return 1, but returns 4 (following)
	return el.compareDocumentPosition( document.createElement( "fieldset" ) ) & 1;
} );

// Support: IE<8
// Prevent attribute/property "interpolation"
// https://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if ( !assert( function( el ) {
	el.innerHTML = "<a href='#'></a>";
	return el.firstChild.getAttribute( "href" ) === "#";
} ) ) {
	addHandle( "type|href|height|width", function( elem, name, isXML ) {
		if ( !isXML ) {
			return elem.getAttribute( name, name.toLowerCase() === "type" ? 1 : 2 );
		}
	} );
}

// Support: IE<9
// Use defaultValue in place of getAttribute("value")
if ( !support.attributes || !assert( function( el ) {
	el.innerHTML = "<input/>";
	el.firstChild.setAttribute( "value", "" );
	return el.firstChild.getAttribute( "value" ) === "";
} ) ) {
	addHandle( "value", function( elem, _name, isXML ) {
		if ( !isXML && elem.nodeName.toLowerCase() === "input" ) {
			return elem.defaultValue;
		}
	} );
}

// Support: IE<9
// Use getAttributeNode to fetch booleans when getAttribute lies
if ( !assert( function( el ) {
	return el.getAttribute( "disabled" ) == null;
} ) ) {
	addHandle( booleans, function( elem, name, isXML ) {
		var val;
		if ( !isXML ) {
			return elem[ name ] === true ? name.toLowerCase() :
				( val = elem.getAttributeNode( name ) ) && val.specified ?
					val.value :
					null;
		}
	} );
}

return Sizzle;

} )( window );



jQuery.find = Sizzle;
jQuery.expr = Sizzle.selectors;

// Deprecated
jQuery.expr[ ":" ] = jQuery.expr.pseudos;
jQuery.uniqueSort = jQuery.unique = Sizzle.uniqueSort;
jQuery.text = Sizzle.getText;
jQuery.isXMLDoc = Sizzle.isXML;
jQuery.contains = Sizzle.contains;
jQuery.escapeSelector = Sizzle.escape;




var dir = function( elem, dir, until ) {
	var matched = [],
		truncate = until !== undefined;

	while ( ( elem = elem[ dir ] ) && elem.nodeType !== 9 ) {
		if ( elem.nodeType === 1 ) {
			if ( truncate && jQuery( elem ).is( until ) ) {
				break;
			}
			matched.push( elem );
		}
	}
	return matched;
};


var siblings = function( n, elem ) {
	var matched = [];

	for ( ; n; n = n.nextSibling ) {
		if ( n.nodeType === 1 && n !== elem ) {
			matched.push( n );
		}
	}

	return matched;
};


var rneedsContext = jQuery.expr.match.needsContext;



function nodeName( elem, name ) {

  return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();

};
var rsingleTag = ( /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i );



// Implement the identical functionality for filter and not
function winnow( elements, qualifier, not ) {
	if ( isFunction( qualifier ) ) {
		return jQuery.grep( elements, function( elem, i ) {
			return !!qualifier.call( elem, i, elem ) !== not;
		} );
	}

	// Single element
	if ( qualifier.nodeType ) {
		return jQuery.grep( elements, function( elem ) {
			return ( elem === qualifier ) !== not;
		} );
	}

	// Arraylike of elements (jQuery, arguments, Array)
	if ( typeof qualifier !== "string" ) {
		return jQuery.grep( elements, function( elem ) {
			return ( indexOf.call( qualifier, elem ) > -1 ) !== not;
		} );
	}

	// Filtered directly for both simple and complex selectors
	return jQuery.filter( qualifier, elements, not );
}

jQuery.filter = function( expr, elems, not ) {
	var elem = elems[ 0 ];

	if ( not ) {
		expr = ":not(" + expr + ")";
	}

	if ( elems.length === 1 && elem.nodeType === 1 ) {
		return jQuery.find.matchesSelector( elem, expr ) ? [ elem ] : [];
	}

	return jQuery.find.matches( expr, jQuery.grep( elems, function( elem ) {
		return elem.nodeType === 1;
	} ) );
};

jQuery.fn.extend( {
	find: function( selector ) {
		var i, ret,
			len = this.length,
			self = this;

		if ( typeof selector !== "string" ) {
			return this.pushStack( jQuery( selector ).filter( function() {
				for ( i = 0; i < len; i++ ) {
					if ( jQuery.contains( self[ i ], this ) ) {
						return true;
					}
				}
			} ) );
		}

		ret = this.pushStack( [] );

		for ( i = 0; i < len; i++ ) {
			jQuery.find( selector, self[ i ], ret );
		}

		return len > 1 ? jQuery.uniqueSort( ret ) : ret;
	},
	filter: function( selector ) {
		return this.pushStack( winnow( this, selector || [], false ) );
	},
	not: function( selector ) {
		return this.pushStack( winnow( this, selector || [], true ) );
	},
	is: function( selector ) {
		return !!winnow(
			this,

			// If this is a positional/relative selector, check membership in the returned set
			// so $("p:first").is("p:last") won't return true for a doc with two "p".
			typeof selector === "string" && rneedsContext.test( selector ) ?
				jQuery( selector ) :
				selector || [],
			false
		).length;
	}
} );


// Initialize a jQuery object


// A central reference to the root jQuery(document)
var rootjQuery,

	// A simple way to check for HTML strings
	// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
	// Strict HTML recognition (#11290: must start with <)
	// Shortcut simple #id case for speed
	rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/,

	init = jQuery.fn.init = function( selector, context, root ) {
		var match, elem;

		// HANDLE: $(""), $(null), $(undefined), $(false)
		if ( !selector ) {
			return this;
		}

		// Method init() accepts an alternate rootjQuery
		// so migrate can support jQuery.sub (gh-2101)
		root = root || rootjQuery;

		// Handle HTML strings
		if ( typeof selector === "string" ) {
			if ( selector[ 0 ] === "<" &&
				selector[ selector.length - 1 ] === ">" &&
				selector.length >= 3 ) {

				// Assume that strings that start and end with <> are HTML and skip the regex check
				match = [ null, selector, null ];

			} else {
				match = rquickExpr.exec( selector );
			}

			// Match html or make sure no context is specified for #id
			if ( match && ( match[ 1 ] || !context ) ) {

				// HANDLE: $(html) -> $(array)
				if ( match[ 1 ] ) {
					context = context instanceof jQuery ? context[ 0 ] : context;

					// Option to run scripts is true for back-compat
					// Intentionally let the error be thrown if parseHTML is not present
					jQuery.merge( this, jQuery.parseHTML(
						match[ 1 ],
						context && context.nodeType ? context.ownerDocument || context : document,
						true
					) );

					// HANDLE: $(html, props)
					if ( rsingleTag.test( match[ 1 ] ) && jQuery.isPlainObject( context ) ) {
						for ( match in context ) {

							// Properties of context are called as methods if possible
							if ( isFunction( this[ match ] ) ) {
								this[ match ]( context[ match ] );

							// ...and otherwise set as attributes
							} else {
								this.attr( match, context[ match ] );
							}
						}
					}

					return this;

				// HANDLE: $(#id)
				} else {
					elem = document.getElementById( match[ 2 ] );

					if ( elem ) {

						// Inject the element directly into the jQuery object
						this[ 0 ] = elem;
						this.length = 1;
					}
					return this;
				}

			// HANDLE: $(expr, $(...))
			} else if ( !context || context.jquery ) {
				return ( context || root ).find( selector );

			// HANDLE: $(expr, context)
			// (which is just equivalent to: $(context).find(expr)
			} else {
				return this.constructor( context ).find( selector );
			}

		// HANDLE: $(DOMElement)
		} else if ( selector.nodeType ) {
			this[ 0 ] = selector;
			this.length = 1;
			return this;

		// HANDLE: $(function)
		// Shortcut for document ready
		} else if ( isFunction( selector ) ) {
			return root.ready !== undefined ?
				root.ready( selector ) :

				// Execute immediately if ready is not present
				selector( jQuery );
		}

		return jQuery.makeArray( selector, this );
	};

// Give the init function the jQuery prototype for later instantiation
init.prototype = jQuery.fn;

// Initialize central reference
rootjQuery = jQuery( document );


var rparentsprev = /^(?:parents|prev(?:Until|All))/,

	// Methods guaranteed to produce a unique set when starting from a unique set
	guaranteedUnique = {
		children: true,
		contents: true,
		next: true,
		prev: true
	};

jQuery.fn.extend( {
	has: function( target ) {
		var targets = jQuery( target, this ),
			l = targets.length;

		return this.filter( function() {
			var i = 0;
			for ( ; i < l; i++ ) {
				if ( jQuery.contains( this, targets[ i ] ) ) {
					return true;
				}
			}
		} );
	},

	closest: function( selectors, context ) {
		var cur,
			i = 0,
			l = this.length,
			matched = [],
			targets = typeof selectors !== "string" && jQuery( selectors );

		// Positional selectors never match, since there's no _selection_ context
		if ( !rneedsContext.test( selectors ) ) {
			for ( ; i < l; i++ ) {
				for ( cur = this[ i ]; cur && cur !== context; cur = cur.parentNode ) {

					// Always skip document fragments
					if ( cur.nodeType < 11 && ( targets ?
						targets.index( cur ) > -1 :

						// Don't pass non-elements to Sizzle
						cur.nodeType === 1 &&
							jQuery.find.matchesSelector( cur, selectors ) ) ) {

						matched.push( cur );
						break;
					}
				}
			}
		}

		return this.pushStack( matched.length > 1 ? jQuery.uniqueSort( matched ) : matched );
	},

	// Determine the position of an element within the set
	index: function( elem ) {

		// No argument, return index in parent
		if ( !elem ) {
			return ( this[ 0 ] && this[ 0 ].parentNode ) ? this.first().prevAll().length : -1;
		}

		// Index in selector
		if ( typeof elem === "string" ) {
			return indexOf.call( jQuery( elem ), this[ 0 ] );
		}

		// Locate the position of the desired element
		return indexOf.call( this,

			// If it receives a jQuery object, the first element is used
			elem.jquery ? elem[ 0 ] : elem
		);
	},

	add: function( selector, context ) {
		return this.pushStack(
			jQuery.uniqueSort(
				jQuery.merge( this.get(), jQuery( selector, context ) )
			)
		);
	},

	addBack: function( selector ) {
		return this.add( selector == null ?
			this.prevObject : this.prevObject.filter( selector )
		);
	}
} );

function sibling( cur, dir ) {
	while ( ( cur = cur[ dir ] ) && cur.nodeType !== 1 ) {}
	return cur;
}

jQuery.each( {
	parent: function( elem ) {
		var parent = elem.parentNode;
		return parent && parent.nodeType !== 11 ? parent : null;
	},
	parents: function( elem ) {
		return dir( elem, "parentNode" );
	},
	parentsUntil: function( elem, _i, until ) {
		return dir( elem, "parentNode", until );
	},
	next: function( elem ) {
		return sibling( elem, "nextSibling" );
	},
	prev: function( elem ) {
		return sibling( elem, "previousSibling" );
	},
	nextAll: function( elem ) {
		return dir( elem, "nextSibling" );
	},
	prevAll: function( elem ) {
		return dir( elem, "previousSibling" );
	},
	nextUntil: function( elem, _i, until ) {
		return dir( elem, "nextSibling", until );
	},
	prevUntil: function( elem, _i, until ) {
		return dir( elem, "previousSibling", until );
	},
	siblings: function( elem ) {
		return siblings( ( elem.parentNode || {} ).firstChild, elem );
	},
	children: function( elem ) {
		return siblings( elem.firstChild );
	},
	contents: function( elem ) {
		if ( elem.contentDocument != null &&

			// Support: IE 11+
			// <object> elements with no `data` attribute has an object
			// `contentDocument` with a `null` prototype.
			getProto( elem.contentDocument ) ) {

			return elem.contentDocument;
		}

		// Support: IE 9 - 11 only, iOS 7 only, Android Browser <=4.3 only
		// Treat the template element as a regular one in browsers that
		// don't support it.
		if ( nodeName( elem, "template" ) ) {
			elem = elem.content || elem;
		}

		return jQuery.merge( [], elem.childNodes );
	}
}, function( name, fn ) {
	jQuery.fn[ name ] = function( until, selector ) {
		var matched = jQuery.map( this, fn, until );

		if ( name.slice( -5 ) !== "Until" ) {
			selector = until;
		}

		if ( selector && typeof selector === "string" ) {
			matched = jQuery.filter( selector, matched );
		}

		if ( this.length > 1 ) {

			// Remove duplicates
			if ( !guaranteedUnique[ name ] ) {
				jQuery.uniqueSort( matched );
			}

			// Reverse order for parents* and prev-derivatives
			if ( rparentsprev.test( name ) ) {
				matched.reverse();
			}
		}

		return this.pushStack( matched );
	};
} );
var rnothtmlwhite = ( /[^\x20\t\r\n\f]+/g );



// Convert String-formatted options into Object-formatted ones
function createOptions( options ) {
	var object = {};
	jQuery.each( options.match( rnothtmlwhite ) || [], function( _, flag ) {
		object[ flag ] = true;
	} );
	return object;
}

/*
 * Create a callback list using the following parameters:
 *
 *	options: an optional list of space-separated options that will change how
 *			the callback list behaves or a more traditional option object
 *
 * By default a callback list will act like an event callback list and can be
 * "fired" multiple times.
 *
 * Possible options:
 *
 *	once:			will ensure the callback list can only be fired once (like a Deferred)
 *
 *	memory:			will keep track of previous values and will call any callback added
 *					after the list has been fired right away with the latest "memorized"
 *					values (like a Deferred)
 *
 *	unique:			will ensure a callback can only be added once (no duplicate in the list)
 *
 *	stopOnFalse:	interrupt callings when a callback returns false
 *
 */
jQuery.Callbacks = function( options ) {

	// Convert options from String-formatted to Object-formatted if needed
	// (we check in cache first)
	options = typeof options === "string" ?
		createOptions( options ) :
		jQuery.extend( {}, options );

	var // Flag to know if list is currently firing
		firing,

		// Last fire value for non-forgettable lists
		memory,

		// Flag to know if list was already fired
		fired,

		// Flag to prevent firing
		locked,

		// Actual callback list
		list = [],

		// Queue of execution data for repeatable lists
		queue = [],

		// Index of currently firing callback (modified by add/remove as needed)
		firingIndex = -1,

		// Fire callbacks
		fire = function() {

			// Enforce single-firing
			locked = locked || options.once;

			// Execute callbacks for all pending executions,
			// respecting firingIndex overrides and runtime changes
			fired = firing = true;
			for ( ; queue.length; firingIndex = -1 ) {
				memory = queue.shift();
				while ( ++firingIndex < list.length ) {

					// Run callback and check for early termination
					if ( list[ firingIndex ].apply( memory[ 0 ], memory[ 1 ] ) === false &&
						options.stopOnFalse ) {

						// Jump to end and forget the data so .add doesn't re-fire
						firingIndex = list.length;
						memory = false;
					}
				}
			}

			// Forget the data if we're done with it
			if ( !options.memory ) {
				memory = false;
			}

			firing = false;

			// Clean up if we're done firing for good
			if ( locked ) {

				// Keep an empty list if we have data for future add calls
				if ( memory ) {
					list = [];

				// Otherwise, this object is spent
				} else {
					list = "";
				}
			}
		},

		// Actual Callbacks object
		self = {

			// Add a callback or a collection of callbacks to the list
			add: function() {
				if ( list ) {

					// If we have memory from a past run, we should fire after adding
					if ( memory && !firing ) {
						firingIndex = list.length - 1;
						queue.push( memory );
					}

					( function add( args ) {
						jQuery.each( args, function( _, arg ) {
							if ( isFunction( arg ) ) {
								if ( !options.unique || !self.has( arg ) ) {
									list.push( arg );
								}
							} else if ( arg && arg.length && toType( arg ) !== "string" ) {

								// Inspect recursively
								add( arg );
							}
						} );
					} )( arguments );

					if ( memory && !firing ) {
						fire();
					}
				}
				return this;
			},

			// Remove a callback from the list
			remove: function() {
				jQuery.each( arguments, function( _, arg ) {
					var index;
					while ( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
						list.splice( index, 1 );

						// Handle firing indexes
						if ( index <= firingIndex ) {
							firingIndex--;
						}
					}
				} );
				return this;
			},

			// Check if a given callback is in the list.
			// If no argument is given, return whether or not list has callbacks attached.
			has: function( fn ) {
				return fn ?
					jQuery.inArray( fn, list ) > -1 :
					list.length > 0;
			},

			// Remove all callbacks from the list
			empty: function() {
				if ( list ) {
					list = [];
				}
				return this;
			},

			// Disable .fire and .add
			// Abort any current/pending executions
			// Clear all callbacks and values
			disable: function() {
				locked = queue = [];
				list = memory = "";
				return this;
			},
			disabled: function() {
				return !list;
			},

			// Disable .fire
			// Also disable .add unless we have memory (since it would have no effect)
			// Abort any pending executions
			lock: function() {
				locked = queue = [];
				if ( !memory && !firing ) {
					list = memory = "";
				}
				return this;
			},
			locked: function() {
				return !!locked;
			},

			// Call all callbacks with the given context and arguments
			fireWith: function( context, args ) {
				if ( !locked ) {
					args = args || [];
					args = [ context, args.slice ? args.slice() : args ];
					queue.push( args );
					if ( !firing ) {
						fire();
					}
				}
				return this;
			},

			// Call all the callbacks with the given arguments
			fire: function() {
				self.fireWith( this, arguments );
				return this;
			},

			// To know if the callbacks have already been called at least once
			fired: function() {
				return !!fired;
			}
		};

	return self;
};


function Identity( v ) {
	return v;
}
function Thrower( ex ) {
	throw ex;
}

function adoptValue( value, resolve, reject, noValue ) {
	var method;

	try {

		// Check for promise aspect first to privilege synchronous behavior
		if ( value && isFunction( ( method = value.promise ) ) ) {
			method.call( value ).done( resolve ).fail( reject );

		// Other thenables
		} else if ( value && isFunction( ( method = value.then ) ) ) {
			method.call( value, resolve, reject );

		// Other non-thenables
		} else {

			// Control `resolve` arguments by letting Array#slice cast boolean `noValue` to integer:
			// * false: [ value ].slice( 0 ) => resolve( value )
			// * true: [ value ].slice( 1 ) => resolve()
			resolve.apply( undefined, [ value ].slice( noValue ) );
		}

	// For Promises/A+, convert exceptions into rejections
	// Since jQuery.when doesn't unwrap thenables, we can skip the extra checks appearing in
	// Deferred#then to conditionally suppress rejection.
	} catch ( value ) {

		// Support: Android 4.0 only
		// Strict mode functions invoked without .call/.apply get global-object context
		reject.apply( undefined, [ value ] );
	}
}

jQuery.extend( {

	Deferred: function( func ) {
		var tuples = [

				// action, add listener, callbacks,
				// ... .then handlers, argument index, [final state]
				[ "notify", "progress", jQuery.Callbacks( "memory" ),
					jQuery.Callbacks( "memory" ), 2 ],
				[ "resolve", "done", jQuery.Callbacks( "once memory" ),
					jQuery.Callbacks( "once memory" ), 0, "resolved" ],
				[ "reject", "fail", jQuery.Callbacks( "once memory" ),
					jQuery.Callbacks( "once memory" ), 1, "rejected" ]
			],
			state = "pending",
			promise = {
				state: function() {
					return state;
				},
				always: function() {
					deferred.done( arguments ).fail( arguments );
					return this;
				},
				"catch": function( fn ) {
					return promise.then( null, fn );
				},

				// Keep pipe for back-compat
				pipe: function( /* fnDone, fnFail, fnProgress */ ) {
					var fns = arguments;

					return jQuery.Deferred( function( newDefer ) {
						jQuery.each( tuples, function( _i, tuple ) {

							// Map tuples (progress, done, fail) to arguments (done, fail, progress)
							var fn = isFunction( fns[ tuple[ 4 ] ] ) && fns[ tuple[ 4 ] ];

							// deferred.progress(function() { bind to newDefer or newDefer.notify })
							// deferred.done(function() { bind to newDefer or newDefer.resolve })
							// deferred.fail(function() { bind to newDefer or newDefer.reject })
							deferred[ tuple[ 1 ] ]( function() {
								var returned = fn && fn.apply( this, arguments );
								if ( returned && isFunction( returned.promise ) ) {
									returned.promise()
										.progress( newDefer.notify )
										.done( newDefer.resolve )
										.fail( newDefer.reject );
								} else {
									newDefer[ tuple[ 0 ] + "With" ](
										this,
										fn ? [ returned ] : arguments
									);
								}
							} );
						} );
						fns = null;
					} ).promise();
				},
				then: function( onFulfilled, onRejected, onProgress ) {
					var maxDepth = 0;
					function resolve( depth, deferred, handler, special ) {
						return function() {
							var that = this,
								args = arguments,
								mightThrow = function() {
									var returned, then;

									// Support: Promises/A+ section 2.3.3.3.3
									// https://promisesaplus.com/#point-59
									// Ignore double-resolution attempts
									if ( depth < maxDepth ) {
										return;
									}

									returned = handler.apply( that, args );

									// Support: Promises/A+ section 2.3.1
									// https://promisesaplus.com/#point-48
									if ( returned === deferred.promise() ) {
										throw new TypeError( "Thenable self-resolution" );
									}

									// Support: Promises/A+ sections 2.3.3.1, 3.5
									// https://promisesaplus.com/#point-54
									// https://promisesaplus.com/#point-75
									// Retrieve `then` only once
									then = returned &&

										// Support: Promises/A+ section 2.3.4
										// https://promisesaplus.com/#point-64
										// Only check objects and functions for thenability
										( typeof returned === "object" ||
											typeof returned === "function" ) &&
										returned.then;

									// Handle a returned thenable
									if ( isFunction( then ) ) {

										// Special processors (notify) just wait for resolution
										if ( special ) {
											then.call(
												returned,
												resolve( maxDepth, deferred, Identity, special ),
												resolve( maxDepth, deferred, Thrower, special )
											);

										// Normal processors (resolve) also hook into progress
										} else {

											// ...and disregard older resolution values
											maxDepth++;

											then.call(
												returned,
												resolve( maxDepth, deferred, Identity, special ),
												resolve( maxDepth, deferred, Thrower, special ),
												resolve( maxDepth, deferred, Identity,
													deferred.notifyWith )
											);
										}

									// Handle all other returned values
									} else {

										// Only substitute handlers pass on context
										// and multiple values (non-spec behavior)
										if ( handler !== Identity ) {
											that = undefined;
											args = [ returned ];
										}

										// Process the value(s)
										// Default process is resolve
										( special || deferred.resolveWith )( that, args );
									}
								},

								// Only normal processors (resolve) catch and reject exceptions
								process = special ?
									mightThrow :
									function() {
										try {
											mightThrow();
										} catch ( e ) {

											if ( jQuery.Deferred.exceptionHook ) {
												jQuery.Deferred.exceptionHook( e,
													process.stackTrace );
											}

											// Support: Promises/A+ section 2.3.3.3.4.1
											// https://promisesaplus.com/#point-61
											// Ignore post-resolution exceptions
											if ( depth + 1 >= maxDepth ) {

												// Only substitute handlers pass on context
												// and multiple values (non-spec behavior)
												if ( handler !== Thrower ) {
													that = undefined;
													args = [ e ];
												}

												deferred.rejectWith( that, args );
											}
										}
									};

							// Support: Promises/A+ section 2.3.3.3.1
							// https://promisesaplus.com/#point-57
							// Re-resolve promises immediately to dodge false rejection from
							// subsequent errors
							if ( depth ) {
								process();
							} else {

								// Call an optional hook to record the stack, in case of exception
								// since it's otherwise lost when execution goes async
								if ( jQuery.Deferred.getStackHook ) {
									process.stackTrace = jQuery.Deferred.getStackHook();
								}
								window.setTimeout( process );
							}
						};
					}

					return jQuery.Deferred( function( newDefer ) {

						// progress_handlers.add( ... )
						tuples[ 0 ][ 3 ].add(
							resolve(
								0,
								newDefer,
								isFunction( onProgress ) ?
									onProgress :
									Identity,
								newDefer.notifyWith
							)
						);

						// fulfilled_handlers.add( ... )
						tuples[ 1 ][ 3 ].add(
							resolve(
								0,
								newDefer,
								isFunction( onFulfilled ) ?
									onFulfilled :
									Identity
							)
						);

						// rejected_handlers.add( ... )
						tuples[ 2 ][ 3 ].add(
							resolve(
								0,
								newDefer,
								isFunction( onRejected ) ?
									onRejected :
									Thrower
							)
						);
					} ).promise();
				},

				// Get a promise for this deferred
				// If obj is provided, the promise aspect is added to the object
				promise: function( obj ) {
					return obj != null ? jQuery.extend( obj, promise ) : promise;
				}
			},
			deferred = {};

		// Add list-specific methods
		jQuery.each( tuples, function( i, tuple ) {
			var list = tuple[ 2 ],
				stateString = tuple[ 5 ];

			// promise.progress = list.add
			// promise.done = list.add
			// promise.fail = list.add
			promise[ tuple[ 1 ] ] = list.add;

			// Handle state
			if ( stateString ) {
				list.add(
					function() {

						// state = "resolved" (i.e., fulfilled)
						// state = "rejected"
						state = stateString;
					},

					// rejected_callbacks.disable
					// fulfilled_callbacks.disable
					tuples[ 3 - i ][ 2 ].disable,

					// rejected_handlers.disable
					// fulfilled_handlers.disable
					tuples[ 3 - i ][ 3 ].disable,

					// progress_callbacks.lock
					tuples[ 0 ][ 2 ].lock,

					// progress_handlers.lock
					tuples[ 0 ][ 3 ].lock
				);
			}

			// progress_handlers.fire
			// fulfilled_handlers.fire
			// rejected_handlers.fire
			list.add( tuple[ 3 ].fire );

			// deferred.notify = function() { deferred.notifyWith(...) }
			// deferred.resolve = function() { deferred.resolveWith(...) }
			// deferred.reject = function() { deferred.rejectWith(...) }
			deferred[ tuple[ 0 ] ] = function() {
				deferred[ tuple[ 0 ] + "With" ]( this === deferred ? undefined : this, arguments );
				return this;
			};

			// deferred.notifyWith = list.fireWith
			// deferred.resolveWith = list.fireWith
			// deferred.rejectWith = list.fireWith
			deferred[ tuple[ 0 ] + "With" ] = list.fireWith;
		} );

		// Make the deferred a promise
		promise.promise( deferred );

		// Call given func if any
		if ( func ) {
			func.call( deferred, deferred );
		}

		// All done!
		return deferred;
	},

	// Deferred helper
	when: function( singleValue ) {
		var

			// count of uncompleted subordinates
			remaining = arguments.length,

			// count of unprocessed arguments
			i = remaining,

			// subordinate fulfillment data
			resolveContexts = Array( i ),
			resolveValues = slice.call( arguments ),

			// the master Deferred
			master = jQuery.Deferred(),

			// subordinate callback factory
			updateFunc = function( i ) {
				return function( value ) {
					resolveContexts[ i ] = this;
					resolveValues[ i ] = arguments.length > 1 ? slice.call( arguments ) : value;
					if ( !( --remaining ) ) {
						master.resolveWith( resolveContexts, resolveValues );
					}
				};
			};

		// Single- and empty arguments are adopted like Promise.resolve
		if ( remaining <= 1 ) {
			adoptValue( singleValue, master.done( updateFunc( i ) ).resolve, master.reject,
				!remaining );

			// Use .then() to unwrap secondary thenables (cf. gh-3000)
			if ( master.state() === "pending" ||
				isFunction( resolveValues[ i ] && resolveValues[ i ].then ) ) {

				return master.then();
			}
		}

		// Multiple arguments are aggregated like Promise.all array elements
		while ( i-- ) {
			adoptValue( resolveValues[ i ], updateFunc( i ), master.reject );
		}

		return master.promise();
	}
} );


// These usually indicate a programmer mistake during development,
// warn about them ASAP rather than swallowing them by default.
var rerrorNames = /^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;

jQuery.Deferred.exceptionHook = function( error, stack ) {

	// Support: IE 8 - 9 only
	// Console exists when dev tools are open, which can happen at any time
	if ( window.console && window.console.warn && error && rerrorNames.test( error.name ) ) {
		window.console.warn( "jQuery.Deferred exception: " + error.message, error.stack, stack );
	}
};




jQuery.readyException = function( error ) {
	window.setTimeout( function() {
		throw error;
	} );
};




// The deferred used on DOM ready
var readyList = jQuery.Deferred();

jQuery.fn.ready = function( fn ) {

	readyList
		.then( fn )

		// Wrap jQuery.readyException in a function so that the lookup
		// happens at the time of error handling instead of callback
		// registration.
		.catch( function( error ) {
			jQuery.readyException( error );
		} );

	return this;
};

jQuery.extend( {

	// Is the DOM ready to be used? Set to true once it occurs.
	isReady: false,

	// A counter to track how many items to wait for before
	// the ready event fires. See #6781
	readyWait: 1,

	// Handle when the DOM is ready
	ready: function( wait ) {

		// Abort if there are pending holds or we're already ready
		if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
			return;
		}

		// Remember that the DOM is ready
		jQuery.isReady = true;

		// If a normal DOM Ready event fired, decrement, and wait if need be
		if ( wait !== true && --jQuery.readyWait > 0 ) {
			return;
		}

		// If there are functions bound, to execute
		readyList.resolveWith( document, [ jQuery ] );
	}
} );

jQuery.ready.then = readyList.then;

// The ready event handler and self cleanup method
function completed() {
	document.removeEventListener( "DOMContentLoaded", completed );
	window.removeEventListener( "load", completed );
	jQuery.ready();
}

// Catch cases where $(document).ready() is called
// after the browser event has already occurred.
// Support: IE <=9 - 10 only
// Older IE sometimes signals "interactive" too soon
if ( document.readyState === "complete" ||
	( document.readyState !== "loading" && !document.documentElement.doScroll ) ) {

	// Handle it asynchronously to allow scripts the opportunity to delay ready
	window.setTimeout( jQuery.ready );

} else {

	// Use the handy event callback
	document.addEventListener( "DOMContentLoaded", completed );

	// A fallback to window.onload, that will always work
	window.addEventListener( "load", completed );
}




// Multifunctional method to get and set values of a collection
// The value/s can optionally be executed if it's a function
var access = function( elems, fn, key, value, chainable, emptyGet, raw ) {
	var i = 0,
		len = elems.length,
		bulk = key == null;

	// Sets many values
	if ( toType( key ) === "object" ) {
		chainable = true;
		for ( i in key ) {
			access( elems, fn, i, key[ i ], true, emptyGet, raw );
		}

	// Sets one value
	} else if ( value !== undefined ) {
		chainable = true;

		if ( !isFunction( value ) ) {
			raw = true;
		}

		if ( bulk ) {

			// Bulk operations run against the entire set
			if ( raw ) {
				fn.call( elems, value );
				fn = null;

			// ...except when executing function values
			} else {
				bulk = fn;
				fn = function( elem, _key, value ) {
					return bulk.call( jQuery( elem ), value );
				};
			}
		}

		if ( fn ) {
			for ( ; i < len; i++ ) {
				fn(
					elems[ i ], key, raw ?
					value :
					value.call( elems[ i ], i, fn( elems[ i ], key ) )
				);
			}
		}
	}

	if ( chainable ) {
		return elems;
	}

	// Gets
	if ( bulk ) {
		return fn.call( elems );
	}

	return len ? fn( elems[ 0 ], key ) : emptyGet;
};


// Matches dashed string for camelizing
var rmsPrefix = /^-ms-/,
	rdashAlpha = /-([a-z])/g;

// Used by camelCase as callback to replace()
function fcamelCase( _all, letter ) {
	return letter.toUpperCase();
}

// Convert dashed to camelCase; used by the css and data modules
// Support: IE <=9 - 11, Edge 12 - 15
// Microsoft forgot to hump their vendor prefix (#9572)
function camelCase( string ) {
	return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
}
var acceptData = function( owner ) {

	// Accepts only:
	//  - Node
	//    - Node.ELEMENT_NODE
	//    - Node.DOCUMENT_NODE
	//  - Object
	//    - Any
	return owner.nodeType === 1 || owner.nodeType === 9 || !( +owner.nodeType );
};




function Data() {
	this.expando = jQuery.expando + Data.uid++;
}

Data.uid = 1;

Data.prototype = {

	cache: function( owner ) {

		// Check if the owner object already has a cache
		var value = owner[ this.expando ];

		// If not, create one
		if ( !value ) {
			value = {};

			// We can accept data for non-element nodes in modern browsers,
			// but we should not, see #8335.
			// Always return an empty object.
			if ( acceptData( owner ) ) {

				// If it is a node unlikely to be stringify-ed or looped over
				// use plain assignment
				if ( owner.nodeType ) {
					owner[ this.expando ] = value;

				// Otherwise secure it in a non-enumerable property
				// configurable must be true to allow the property to be
				// deleted when data is removed
				} else {
					Object.defineProperty( owner, this.expando, {
						value: value,
						configurable: true
					} );
				}
			}
		}

		return value;
	},
	set: function( owner, data, value ) {
		var prop,
			cache = this.cache( owner );

		// Handle: [ owner, key, value ] args
		// Always use camelCase key (gh-2257)
		if ( typeof data === "string" ) {
			cache[ camelCase( data ) ] = value;

		// Handle: [ owner, { properties } ] args
		} else {

			// Copy the properties one-by-one to the cache object
			for ( prop in data ) {
				cache[ camelCase( prop ) ] = data[ prop ];
			}
		}
		return cache;
	},
	get: function( owner, key ) {
		return key === undefined ?
			this.cache( owner ) :

			// Always use camelCase key (gh-2257)
			owner[ this.expando ] && owner[ this.expando ][ camelCase( key ) ];
	},
	access: function( owner, key, value ) {

		// In cases where either:
		//
		//   1. No key was specified
		//   2. A string key was specified, but no value provided
		//
		// Take the "read" path and allow the get method to determine
		// which value to return, respectively either:
		//
		//   1. The entire cache object
		//   2. The data stored at the key
		//
		if ( key === undefined ||
				( ( key && typeof key === "string" ) && value === undefined ) ) {

			return this.get( owner, key );
		}

		// When the key is not a string, or both a key and value
		// are specified, set or extend (existing objects) with either:
		//
		//   1. An object of properties
		//   2. A key and value
		//
		this.set( owner, key, value );

		// Since the "set" path can have two possible entry points
		// return the expected data based on which path was taken[*]
		return value !== undefined ? value : key;
	},
	remove: function( owner, key ) {
		var i,
			cache = owner[ this.expando ];

		if ( cache === undefined ) {
			return;
		}

		if ( key !== undefined ) {

			// Support array or space separated string of keys
			if ( Array.isArray( key ) ) {

				// If key is an array of keys...
				// We always set camelCase keys, so remove that.
				key = key.map( camelCase );
			} else {
				key = camelCase( key );

				// If a key with the spaces exists, use it.
				// Otherwise, create an array by matching non-whitespace
				key = key in cache ?
					[ key ] :
					( key.match( rnothtmlwhite ) || [] );
			}

			i = key.length;

			while ( i-- ) {
				delete cache[ key[ i ] ];
			}
		}

		// Remove the expando if there's no more data
		if ( key === undefined || jQuery.isEmptyObject( cache ) ) {

			// Support: Chrome <=35 - 45
			// Webkit & Blink performance suffers when deleting properties
			// from DOM nodes, so set to undefined instead
			// https://bugs.chromium.org/p/chromium/issues/detail?id=378607 (bug restricted)
			if ( owner.nodeType ) {
				owner[ this.expando ] = undefined;
			} else {
				delete owner[ this.expando ];
			}
		}
	},
	hasData: function( owner ) {
		var cache = owner[ this.expando ];
		return cache !== undefined && !jQuery.isEmptyObject( cache );
	}
};
var dataPriv = new Data();

var dataUser = new Data();



//	Implementation Summary
//
//	1. Enforce API surface and semantic compatibility with 1.9.x branch
//	2. Improve the module's maintainability by reducing the storage
//		paths to a single mechanism.
//	3. Use the same single mechanism to support "private" and "user" data.
//	4. _Never_ expose "private" data to user code (TODO: Drop _data, _removeData)
//	5. Avoid exposing implementation details on user objects (eg. expando properties)
//	6. Provide a clear path for implementation upgrade to WeakMap in 2014

var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
	rmultiDash = /[A-Z]/g;

function getData( data ) {
	if ( data === "true" ) {
		return true;
	}

	if ( data === "false" ) {
		return false;
	}

	if ( data === "null" ) {
		return null;
	}

	// Only convert to a number if it doesn't change the string
	if ( data === +data + "" ) {
		return +data;
	}

	if ( rbrace.test( data ) ) {
		return JSON.parse( data );
	}

	return data;
}

function dataAttr( elem, key, data ) {
	var name;

	// If nothing was found internally, try to fetch any
	// data from the HTML5 data-* attribute
	if ( data === undefined && elem.nodeType === 1 ) {
		name = "data-" + key.replace( rmultiDash, "-$&" ).toLowerCase();
		data = elem.getAttribute( name );

		if ( typeof data === "string" ) {
			try {
				data = getData( data );
			} catch ( e ) {}

			// Make sure we set the data so it isn't changed later
			dataUser.set( elem, key, data );
		} else {
			data = undefined;
		}
	}
	return data;
}

jQuery.extend( {
	hasData: function( elem ) {
		return dataUser.hasData( elem ) || dataPriv.hasData( elem );
	},

	data: function( elem, name, data ) {
		return dataUser.access( elem, name, data );
	},

	removeData: function( elem, name ) {
		dataUser.remove( elem, name );
	},

	// TODO: Now that all calls to _data and _removeData have been replaced
	// with direct calls to dataPriv methods, these can be deprecated.
	_data: function( elem, name, data ) {
		return dataPriv.access( elem, name, data );
	},

	_removeData: function( elem, name ) {
		dataPriv.remove( elem, name );
	}
} );

jQuery.fn.extend( {
	data: function( key, value ) {
		var i, name, data,
			elem = this[ 0 ],
			attrs = elem && elem.attributes;

		// Gets all values
		if ( key === undefined ) {
			if ( this.length ) {
				data = dataUser.get( elem );

				if ( elem.nodeType === 1 && !dataPriv.get( elem, "hasDataAttrs" ) ) {
					i = attrs.length;
					while ( i-- ) {

						// Support: IE 11 only
						// The attrs elements can be null (#14894)
						if ( attrs[ i ] ) {
							name = attrs[ i ].name;
							if ( name.indexOf( "data-" ) === 0 ) {
								name = camelCase( name.slice( 5 ) );
								dataAttr( elem, name, data[ name ] );
							}
						}
					}
					dataPriv.set( elem, "hasDataAttrs", true );
				}
			}

			return data;
		}

		// Sets multiple values
		if ( typeof key === "object" ) {
			return this.each( function() {
				dataUser.set( this, key );
			} );
		}

		return access( this, function( value ) {
			var data;

			// The calling jQuery object (element matches) is not empty
			// (and therefore has an element appears at this[ 0 ]) and the
			// `value` parameter was not undefined. An empty jQuery object
			// will result in `undefined` for elem = this[ 0 ] which will
			// throw an exception if an attempt to read a data cache is made.
			if ( elem && value === undefined ) {

				// Attempt to get data from the cache
				// The key will always be camelCased in Data
				data = dataUser.get( elem, key );
				if ( data !== undefined ) {
					return data;
				}

				// Attempt to "discover" the data in
				// HTML5 custom data-* attrs
				data = dataAttr( elem, key );
				if ( data !== undefined ) {
					return data;
				}

				// We tried really hard, but the data doesn't exist.
				return;
			}

			// Set the data...
			this.each( function() {

				// We always store the camelCased key
				dataUser.set( this, key, value );
			} );
		}, null, value, arguments.length > 1, null, true );
	},

	removeData: function( key ) {
		return this.each( function() {
			dataUser.remove( this, key );
		} );
	}
} );


jQuery.extend( {
	queue: function( elem, type, data ) {
		var queue;

		if ( elem ) {
			type = ( type || "fx" ) + "queue";
			queue = dataPriv.get( elem, type );

			// Speed up dequeue by getting out quickly if this is just a lookup
			if ( data ) {
				if ( !queue || Array.isArray( data ) ) {
					queue = dataPriv.access( elem, type, jQuery.makeArray( data ) );
				} else {
					queue.push( data );
				}
			}
			return queue || [];
		}
	},

	dequeue: function( elem, type ) {
		type = type || "fx";

		var queue = jQuery.queue( elem, type ),
			startLength = queue.length,
			fn = queue.shift(),
			hooks = jQuery._queueHooks( elem, type ),
			next = function() {
				jQuery.dequeue( elem, type );
			};

		// If the fx queue is dequeued, always remove the progress sentinel
		if ( fn === "inprogress" ) {
			fn = queue.shift();
			startLength--;
		}

		if ( fn ) {

			// Add a progress sentinel to prevent the fx queue from being
			// automatically dequeued
			if ( type === "fx" ) {
				queue.unshift( "inprogress" );
			}

			// Clear up the last queue stop function
			delete hooks.stop;
			fn.call( elem, next, hooks );
		}

		if ( !startLength && hooks ) {
			hooks.empty.fire();
		}
	},

	// Not public - generate a queueHooks object, or return the current one
	_queueHooks: function( elem, type ) {
		var key = type + "queueHooks";
		return dataPriv.get( elem, key ) || dataPriv.access( elem, key, {
			empty: jQuery.Callbacks( "once memory" ).add( function() {
				dataPriv.remove( elem, [ type + "queue", key ] );
			} )
		} );
	}
} );

jQuery.fn.extend( {
	queue: function( type, data ) {
		var setter = 2;

		if ( typeof type !== "string" ) {
			data = type;
			type = "fx";
			setter--;
		}

		if ( arguments.length < setter ) {
			return jQuery.queue( this[ 0 ], type );
		}

		return data === undefined ?
			this :
			this.each( function() {
				var queue = jQuery.queue( this, type, data );

				// Ensure a hooks for this queue
				jQuery._queueHooks( this, type );

				if ( type === "fx" && queue[ 0 ] !== "inprogress" ) {
					jQuery.dequeue( this, type );
				}
			} );
	},
	dequeue: function( type ) {
		return this.each( function() {
			jQuery.dequeue( this, type );
		} );
	},
	clearQueue: function( type ) {
		return this.queue( type || "fx", [] );
	},

	// Get a promise resolved when queues of a certain type
	// are emptied (fx is the type by default)
	promise: function( type, obj ) {
		var tmp,
			count = 1,
			defer = jQuery.Deferred(),
			elements = this,
			i = this.length,
			resolve = function() {
				if ( !( --count ) ) {
					defer.resolveWith( elements, [ elements ] );
				}
			};

		if ( typeof type !== "string" ) {
			obj = type;
			type = undefined;
		}
		type = type || "fx";

		while ( i-- ) {
			tmp = dataPriv.get( elements[ i ], type + "queueHooks" );
			if ( tmp && tmp.empty ) {
				count++;
				tmp.empty.add( resolve );
			}
		}
		resolve();
		return defer.promise( obj );
	}
} );
var pnum = ( /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/ ).source;

var rcssNum = new RegExp( "^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i" );


var cssExpand = [ "Top", "Right", "Bottom", "Left" ];

var documentElement = document.documentElement;



	var isAttached = function( elem ) {
			return jQuery.contains( elem.ownerDocument, elem );
		},
		composed = { composed: true };

	// Support: IE 9 - 11+, Edge 12 - 18+, iOS 10.0 - 10.2 only
	// Check attachment across shadow DOM boundaries when possible (gh-3504)
	// Support: iOS 10.0-10.2 only
	// Early iOS 10 versions support `attachShadow` but not `getRootNode`,
	// leading to errors. We need to check for `getRootNode`.
	if ( documentElement.getRootNode ) {
		isAttached = function( elem ) {
			return jQuery.contains( elem.ownerDocument, elem ) ||
				elem.getRootNode( composed ) === elem.ownerDocument;
		};
	}
var isHiddenWithinTree = function( elem, el ) {

		// isHiddenWithinTree might be called from jQuery#filter function;
		// in that case, element will be second argument
		elem = el || elem;

		// Inline style trumps all
		return elem.style.display === "none" ||
			elem.style.display === "" &&

			// Otherwise, check computed style
			// Support: Firefox <=43 - 45
			// Disconnected elements can have computed display: none, so first confirm that elem is
			// in the document.
			isAttached( elem ) &&

			jQuery.css( elem, "display" ) === "none";
	};



function adjustCSS( elem, prop, valueParts, tween ) {
	var adjusted, scale,
		maxIterations = 20,
		currentValue = tween ?
			function() {
				return tween.cur();
			} :
			function() {
				return jQuery.css( elem, prop, "" );
			},
		initial = currentValue(),
		unit = valueParts && valueParts[ 3 ] || ( jQuery.cssNumber[ prop ] ? "" : "px" ),

		// Starting value computation is required for potential unit mismatches
		initialInUnit = elem.nodeType &&
			( jQuery.cssNumber[ prop ] || unit !== "px" && +initial ) &&
			rcssNum.exec( jQuery.css( elem, prop ) );

	if ( initialInUnit && initialInUnit[ 3 ] !== unit ) {

		// Support: Firefox <=54
		// Halve the iteration target value to prevent interference from CSS upper bounds (gh-2144)
		initial = initial / 2;

		// Trust units reported by jQuery.css
		unit = unit || initialInUnit[ 3 ];

		// Iteratively approximate from a nonzero starting point
		initialInUnit = +initial || 1;

		while ( maxIterations-- ) {

			// Evaluate and update our best guess (doubling guesses that zero out).
			// Finish if the scale equals or crosses 1 (making the old*new product non-positive).
			jQuery.style( elem, prop, initialInUnit + unit );
			if ( ( 1 - scale ) * ( 1 - ( scale = currentValue() / initial || 0.5 ) ) <= 0 ) {
				maxIterations = 0;
			}
			initialInUnit = initialInUnit / scale;

		}

		initialInUnit = initialInUnit * 2;
		jQuery.style( elem, prop, initialInUnit + unit );

		// Make sure we update the tween properties later on
		valueParts = valueParts || [];
	}

	if ( valueParts ) {
		initialInUnit = +initialInUnit || +initial || 0;

		// Apply relative offset (+=/-=) if specified
		adjusted = valueParts[ 1 ] ?
			initialInUnit + ( valueParts[ 1 ] + 1 ) * valueParts[ 2 ] :
			+valueParts[ 2 ];
		if ( tween ) {
			tween.unit = unit;
			tween.start = initialInUnit;
			tween.end = adjusted;
		}
	}
	return adjusted;
}


var defaultDisplayMap = {};

function getDefaultDisplay( elem ) {
	var temp,
		doc = elem.ownerDocument,
		nodeName = elem.nodeName,
		display = defaultDisplayMap[ nodeName ];

	if ( display ) {
		return display;
	}

	temp = doc.body.appendChild( doc.createElement( nodeName ) );
	display = jQuery.css( temp, "display" );

	temp.parentNode.removeChild( temp );

	if ( display === "none" ) {
		display = "block";
	}
	defaultDisplayMap[ nodeName ] = display;

	return display;
}

function showHide( elements, show ) {
	var display, elem,
		values = [],
		index = 0,
		length = elements.length;

	// Determine new display value for elements that need to change
	for ( ; index < length; index++ ) {
		elem = elements[ index ];
		if ( !elem.style ) {
			continue;
		}

		display = elem.style.display;
		if ( show ) {

			// Since we force visibility upon cascade-hidden elements, an immediate (and slow)
			// check is required in this first loop unless we have a nonempty display value (either
			// inline or about-to-be-restored)
			if ( display === "none" ) {
				values[ index ] = dataPriv.get( elem, "display" ) || null;
				if ( !values[ index ] ) {
					elem.style.display = "";
				}
			}
			if ( elem.style.display === "" && isHiddenWithinTree( elem ) ) {
				values[ index ] = getDefaultDisplay( elem );
			}
		} else {
			if ( display !== "none" ) {
				values[ index ] = "none";

				// Remember what we're overwriting
				dataPriv.set( elem, "display", display );
			}
		}
	}

	// Set the display of the elements in a second loop to avoid constant reflow
	for ( index = 0; index < length; index++ ) {
		if ( values[ index ] != null ) {
			elements[ index ].style.display = values[ index ];
		}
	}

	return elements;
}

jQuery.fn.extend( {
	show: function() {
		return showHide( this, true );
	},
	hide: function() {
		return showHide( this );
	},
	toggle: function( state ) {
		if ( typeof state === "boolean" ) {
			return state ? this.show() : this.hide();
		}

		return this.each( function() {
			if ( isHiddenWithinTree( this ) ) {
				jQuery( this ).show();
			} else {
				jQuery( this ).hide();
			}
		} );
	}
} );
var rcheckableType = ( /^(?:checkbox|radio)$/i );

var rtagName = ( /<([a-z][^\/\0>\x20\t\r\n\f]*)/i );

var rscriptType = ( /^$|^module$|\/(?:java|ecma)script/i );



( function() {
	var fragment = document.createDocumentFragment(),
		div = fragment.appendChild( document.createElement( "div" ) ),
		input = document.createElement( "input" );

	// Support: Android 4.0 - 4.3 only
	// Check state lost if the name is set (#11217)
	// Support: Windows Web Apps (WWA)
	// `name` and `type` must use .setAttribute for WWA (#14901)
	input.setAttribute( "type", "radio" );
	input.setAttribute( "checked", "checked" );
	input.setAttribute( "name", "t" );

	div.appendChild( input );

	// Support: Android <=4.1 only
	// Older WebKit doesn't clone checked state correctly in fragments
	support.checkClone = div.cloneNode( true ).cloneNode( true ).lastChild.checked;

	// Support: IE <=11 only
	// Make sure textarea (and checkbox) defaultValue is properly cloned
	div.innerHTML = "<textarea>x</textarea>";
	support.noCloneChecked = !!div.cloneNode( true ).lastChild.defaultValue;

	// Support: IE <=9 only
	// IE <=9 replaces <option> tags with their contents when inserted outside of
	// the select element.
	div.innerHTML = "<option></option>";
	support.option = !!div.lastChild;
} )();


// We have to close these tags to support XHTML (#13200)
var wrapMap = {

	// XHTML parsers do not magically insert elements in the
	// same way that tag soup parsers do. So we cannot shorten
	// this by omitting <tbody> or other required elements.
	thead: [ 1, "<table>", "</table>" ],
	col: [ 2, "<table><colgroup>", "</colgroup></table>" ],
	tr: [ 2, "<table><tbody>", "</tbody></table>" ],
	td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],

	_default: [ 0, "", "" ]
};

wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
wrapMap.th = wrapMap.td;

// Support: IE <=9 only
if ( !support.option ) {
	wrapMap.optgroup = wrapMap.option = [ 1, "<select multiple='multiple'>", "</select>" ];
}


function getAll( context, tag ) {

	// Support: IE <=9 - 11 only
	// Use typeof to avoid zero-argument method invocation on host objects (#15151)
	var ret;

	if ( typeof context.getElementsByTagName !== "undefined" ) {
		ret = context.getElementsByTagName( tag || "*" );

	} else if ( typeof context.querySelectorAll !== "undefined" ) {
		ret = context.querySelectorAll( tag || "*" );

	} else {
		ret = [];
	}

	if ( tag === undefined || tag && nodeName( context, tag ) ) {
		return jQuery.merge( [ context ], ret );
	}

	return ret;
}


// Mark scripts as having already been evaluated
function setGlobalEval( elems, refElements ) {
	var i = 0,
		l = elems.length;

	for ( ; i < l; i++ ) {
		dataPriv.set(
			elems[ i ],
			"globalEval",
			!refElements || dataPriv.get( refElements[ i ], "globalEval" )
		);
	}
}


var rhtml = /<|&#?\w+;/;

function buildFragment( elems, context, scripts, selection, ignored ) {
	var elem, tmp, tag, wrap, attached, j,
		fragment = context.createDocumentFragment(),
		nodes = [],
		i = 0,
		l = elems.length;

	for ( ; i < l; i++ ) {
		elem = elems[ i ];

		if ( elem || elem === 0 ) {

			// Add nodes directly
			if ( toType( elem ) === "object" ) {

				// Support: Android <=4.0 only, PhantomJS 1 only
				// push.apply(_, arraylike) throws on ancient WebKit
				jQuery.merge( nodes, elem.nodeType ? [ elem ] : elem );

			// Convert non-html into a text node
			} else if ( !rhtml.test( elem ) ) {
				nodes.push( context.createTextNode( elem ) );

			// Convert html into DOM nodes
			} else {
				tmp = tmp || fragment.appendChild( context.createElement( "div" ) );

				// Deserialize a standard representation
				tag = ( rtagName.exec( elem ) || [ "", "" ] )[ 1 ].toLowerCase();
				wrap = wrapMap[ tag ] || wrapMap._default;
				tmp.innerHTML = wrap[ 1 ] + jQuery.htmlPrefilter( elem ) + wrap[ 2 ];

				// Descend through wrappers to the right content
				j = wrap[ 0 ];
				while ( j-- ) {
					tmp = tmp.lastChild;
				}

				// Support: Android <=4.0 only, PhantomJS 1 only
				// push.apply(_, arraylike) throws on ancient WebKit
				jQuery.merge( nodes, tmp.childNodes );

				// Remember the top-level container
				tmp = fragment.firstChild;

				// Ensure the created nodes are orphaned (#12392)
				tmp.textContent = "";
			}
		}
	}

	// Remove wrapper from fragment
	fragment.textContent = "";

	i = 0;
	while ( ( elem = nodes[ i++ ] ) ) {

		// Skip elements already in the context collection (trac-4087)
		if ( selection && jQuery.inArray( elem, selection ) > -1 ) {
			if ( ignored ) {
				ignored.push( elem );
			}
			continue;
		}

		attached = isAttached( elem );

		// Append to fragment
		tmp = getAll( fragment.appendChild( elem ), "script" );

		// Preserve script evaluation history
		if ( attached ) {
			setGlobalEval( tmp );
		}

		// Capture executables
		if ( scripts ) {
			j = 0;
			while ( ( elem = tmp[ j++ ] ) ) {
				if ( rscriptType.test( elem.type || "" ) ) {
					scripts.push( elem );
				}
			}
		}
	}

	return fragment;
}


var
	rkeyEvent = /^key/,
	rmouseEvent = /^(?:mouse|pointer|contextmenu|drag|drop)|click/,
	rtypenamespace = /^([^.]*)(?:\.(.+)|)/;

function returnTrue() {
	return true;
}

function returnFalse() {
	return false;
}

// Support: IE <=9 - 11+
// focus() and blur() are asynchronous, except when they are no-op.
// So expect focus to be synchronous when the element is already active,
// and blur to be synchronous when the element is not already active.
// (focus and blur are always synchronous in other supported browsers,
// this just defines when we can count on it).
function expectSync( elem, type ) {
	return ( elem === safeActiveElement() ) === ( type === "focus" );
}

// Support: IE <=9 only
// Accessing document.activeElement can throw unexpectedly
// https://bugs.jquery.com/ticket/13393
function safeActiveElement() {
	try {
		return document.activeElement;
	} catch ( err ) { }
}

function on( elem, types, selector, data, fn, one ) {
	var origFn, type;

	// Types can be a map of types/handlers
	if ( typeof types === "object" ) {

		// ( types-Object, selector, data )
		if ( typeof selector !== "string" ) {

			// ( types-Object, data )
			data = data || selector;
			selector = undefined;
		}
		for ( type in types ) {
			on( elem, type, selector, data, types[ type ], one );
		}
		return elem;
	}

	if ( data == null && fn == null ) {

		// ( types, fn )
		fn = selector;
		data = selector = undefined;
	} else if ( fn == null ) {
		if ( typeof selector === "string" ) {

			// ( types, selector, fn )
			fn = data;
			data = undefined;
		} else {

			// ( types, data, fn )
			fn = data;
			data = selector;
			selector = undefined;
		}
	}
	if ( fn === false ) {
		fn = returnFalse;
	} else if ( !fn ) {
		return elem;
	}

	if ( one === 1 ) {
		origFn = fn;
		fn = function( event ) {

			// Can use an empty set, since event contains the info
			jQuery().off( event );
			return origFn.apply( this, arguments );
		};

		// Use same guid so caller can remove using origFn
		fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
	}
	return elem.each( function() {
		jQuery.event.add( this, types, fn, data, selector );
	} );
}

/*
 * Helper functions for managing events -- not part of the public interface.
 * Props to Dean Edwards' addEvent library for many of the ideas.
 */
jQuery.event = {

	global: {},

	add: function( elem, types, handler, data, selector ) {

		var handleObjIn, eventHandle, tmp,
			events, t, handleObj,
			special, handlers, type, namespaces, origType,
			elemData = dataPriv.get( elem );

		// Only attach events to objects that accept data
		if ( !acceptData( elem ) ) {
			return;
		}

		// Caller can pass in an object of custom data in lieu of the handler
		if ( handler.handler ) {
			handleObjIn = handler;
			handler = handleObjIn.handler;
			selector = handleObjIn.selector;
		}

		// Ensure that invalid selectors throw exceptions at attach time
		// Evaluate against documentElement in case elem is a non-element node (e.g., document)
		if ( selector ) {
			jQuery.find.matchesSelector( documentElement, selector );
		}

		// Make sure that the handler has a unique ID, used to find/remove it later
		if ( !handler.guid ) {
			handler.guid = jQuery.guid++;
		}

		// Init the element's event structure and main handler, if this is the first
		if ( !( events = elemData.events ) ) {
			events = elemData.events = Object.create( null );
		}
		if ( !( eventHandle = elemData.handle ) ) {
			eventHandle = elemData.handle = function( e ) {

				// Discard the second event of a jQuery.event.trigger() and
				// when an event is called after a page has unloaded
				return typeof jQuery !== "undefined" && jQuery.event.triggered !== e.type ?
					jQuery.event.dispatch.apply( elem, arguments ) : undefined;
			};
		}

		// Handle multiple events separated by a space
		types = ( types || "" ).match( rnothtmlwhite ) || [ "" ];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[ t ] ) || [];
			type = origType = tmp[ 1 ];
			namespaces = ( tmp[ 2 ] || "" ).split( "." ).sort();

			// There *must* be a type, no attaching namespace-only handlers
			if ( !type ) {
				continue;
			}

			// If event changes its type, use the special event handlers for the changed type
			special = jQuery.event.special[ type ] || {};

			// If selector defined, determine special event api type, otherwise given type
			type = ( selector ? special.delegateType : special.bindType ) || type;

			// Update special based on newly reset type
			special = jQuery.event.special[ type ] || {};

			// handleObj is passed to all event handlers
			handleObj = jQuery.extend( {
				type: type,
				origType: origType,
				data: data,
				handler: handler,
				guid: handler.guid,
				selector: selector,
				needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
				namespace: namespaces.join( "." )
			}, handleObjIn );

			// Init the event handler queue if we're the first
			if ( !( handlers = events[ type ] ) ) {
				handlers = events[ type ] = [];
				handlers.delegateCount = 0;

				// Only use addEventListener if the special events handler returns false
				if ( !special.setup ||
					special.setup.call( elem, data, namespaces, eventHandle ) === false ) {

					if ( elem.addEventListener ) {
						elem.addEventListener( type, eventHandle );
					}
				}
			}

			if ( special.add ) {
				special.add.call( elem, handleObj );

				if ( !handleObj.handler.guid ) {
					handleObj.handler.guid = handler.guid;
				}
			}

			// Add to the element's handler list, delegates in front
			if ( selector ) {
				handlers.splice( handlers.delegateCount++, 0, handleObj );
			} else {
				handlers.push( handleObj );
			}

			// Keep track of which events have ever been used, for event optimization
			jQuery.event.global[ type ] = true;
		}

	},

	// Detach an event or set of events from an element
	remove: function( elem, types, handler, selector, mappedTypes ) {

		var j, origCount, tmp,
			events, t, handleObj,
			special, handlers, type, namespaces, origType,
			elemData = dataPriv.hasData( elem ) && dataPriv.get( elem );

		if ( !elemData || !( events = elemData.events ) ) {
			return;
		}

		// Once for each type.namespace in types; type may be omitted
		types = ( types || "" ).match( rnothtmlwhite ) || [ "" ];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[ t ] ) || [];
			type = origType = tmp[ 1 ];
			namespaces = ( tmp[ 2 ] || "" ).split( "." ).sort();

			// Unbind all events (on this namespace, if provided) for the element
			if ( !type ) {
				for ( type in events ) {
					jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
				}
				continue;
			}

			special = jQuery.event.special[ type ] || {};
			type = ( selector ? special.delegateType : special.bindType ) || type;
			handlers = events[ type ] || [];
			tmp = tmp[ 2 ] &&
				new RegExp( "(^|\\.)" + namespaces.join( "\\.(?:.*\\.|)" ) + "(\\.|$)" );

			// Remove matching events
			origCount = j = handlers.length;
			while ( j-- ) {
				handleObj = handlers[ j ];

				if ( ( mappedTypes || origType === handleObj.origType ) &&
					( !handler || handler.guid === handleObj.guid ) &&
					( !tmp || tmp.test( handleObj.namespace ) ) &&
					( !selector || selector === handleObj.selector ||
						selector === "**" && handleObj.selector ) ) {
					handlers.splice( j, 1 );

					if ( handleObj.selector ) {
						handlers.delegateCount--;
					}
					if ( special.remove ) {
						special.remove.call( elem, handleObj );
					}
				}
			}

			// Remove generic event handler if we removed something and no more handlers exist
			// (avoids potential for endless recursion during removal of special event handlers)
			if ( origCount && !handlers.length ) {
				if ( !special.teardown ||
					special.teardown.call( elem, namespaces, elemData.handle ) === false ) {

					jQuery.removeEvent( elem, type, elemData.handle );
				}

				delete events[ type ];
			}
		}

		// Remove data and the expando if it's no longer used
		if ( jQuery.isEmptyObject( events ) ) {
			dataPriv.remove( elem, "handle events" );
		}
	},

	dispatch: function( nativeEvent ) {

		var i, j, ret, matched, handleObj, handlerQueue,
			args = new Array( arguments.length ),

			// Make a writable jQuery.Event from the native event object
			event = jQuery.event.fix( nativeEvent ),

			handlers = (
					dataPriv.get( this, "events" ) || Object.create( null )
				)[ event.type ] || [],
			special = jQuery.event.special[ event.type ] || {};

		// Use the fix-ed jQuery.Event rather than the (read-only) native event
		args[ 0 ] = event;

		for ( i = 1; i < arguments.length; i++ ) {
			args[ i ] = arguments[ i ];
		}

		event.delegateTarget = this;

		// Call the preDispatch hook for the mapped type, and let it bail if desired
		if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
			return;
		}

		// Determine handlers
		handlerQueue = jQuery.event.handlers.call( this, event, handlers );

		// Run delegates first; they may want to stop propagation beneath us
		i = 0;
		while ( ( matched = handlerQueue[ i++ ] ) && !event.isPropagationStopped() ) {
			event.currentTarget = matched.elem;

			j = 0;
			while ( ( handleObj = matched.handlers[ j++ ] ) &&
				!event.isImmediatePropagationStopped() ) {

				// If the event is namespaced, then each handler is only invoked if it is
				// specially universal or its namespaces are a superset of the event's.
				if ( !event.rnamespace || handleObj.namespace === false ||
					event.rnamespace.test( handleObj.namespace ) ) {

					event.handleObj = handleObj;
					event.data = handleObj.data;

					ret = ( ( jQuery.event.special[ handleObj.origType ] || {} ).handle ||
						handleObj.handler ).apply( matched.elem, args );

					if ( ret !== undefined ) {
						if ( ( event.result = ret ) === false ) {
							event.preventDefault();
							event.stopPropagation();
						}
					}
				}
			}
		}

		// Call the postDispatch hook for the mapped type
		if ( special.postDispatch ) {
			special.postDispatch.call( this, event );
		}

		return event.result;
	},

	handlers: function( event, handlers ) {
		var i, handleObj, sel, matchedHandlers, matchedSelectors,
			handlerQueue = [],
			delegateCount = handlers.delegateCount,
			cur = event.target;

		// Find delegate handlers
		if ( delegateCount &&

			// Support: IE <=9
			// Black-hole SVG <use> instance trees (trac-13180)
			cur.nodeType &&

			// Support: Firefox <=42
			// Suppress spec-violating clicks indicating a non-primary pointer button (trac-3861)
			// https://www.w3.org/TR/DOM-Level-3-Events/#event-type-click
			// Support: IE 11 only
			// ...but not arrow key "clicks" of radio inputs, which can have `button` -1 (gh-2343)
			!( event.type === "click" && event.button >= 1 ) ) {

			for ( ; cur !== this; cur = cur.parentNode || this ) {

				// Don't check non-elements (#13208)
				// Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
				if ( cur.nodeType === 1 && !( event.type === "click" && cur.disabled === true ) ) {
					matchedHandlers = [];
					matchedSelectors = {};
					for ( i = 0; i < delegateCount; i++ ) {
						handleObj = handlers[ i ];

						// Don't conflict with Object.prototype properties (#13203)
						sel = handleObj.selector + " ";

						if ( matchedSelectors[ sel ] === undefined ) {
							matchedSelectors[ sel ] = handleObj.needsContext ?
								jQuery( sel, this ).index( cur ) > -1 :
								jQuery.find( sel, this, null, [ cur ] ).length;
						}
						if ( matchedSelectors[ sel ] ) {
							matchedHandlers.push( handleObj );
						}
					}
					if ( matchedHandlers.length ) {
						handlerQueue.push( { elem: cur, handlers: matchedHandlers } );
					}
				}
			}
		}

		// Add the remaining (directly-bound) handlers
		cur = this;
		if ( delegateCount < handlers.length ) {
			handlerQueue.push( { elem: cur, handlers: handlers.slice( delegateCount ) } );
		}

		return handlerQueue;
	},

	addProp: function( name, hook ) {
		Object.defineProperty( jQuery.Event.prototype, name, {
			enumerable: true,
			configurable: true,

			get: isFunction( hook ) ?
				function() {
					if ( this.originalEvent ) {
							return hook( this.originalEvent );
					}
				} :
				function() {
					if ( this.originalEvent ) {
							return this.originalEvent[ name ];
					}
				},

			set: function( value ) {
				Object.defineProperty( this, name, {
					enumerable: true,
					configurable: true,
					writable: true,
					value: value
				} );
			}
		} );
	},

	fix: function( originalEvent ) {
		return originalEvent[ jQuery.expando ] ?
			originalEvent :
			new jQuery.Event( originalEvent );
	},

	special: {
		load: {

			// Prevent triggered image.load events from bubbling to window.load
			noBubble: true
		},
		click: {

			// Utilize native event to ensure correct state for checkable inputs
			setup: function( data ) {

				// For mutual compressibility with _default, replace `this` access with a local var.
				// `|| data` is dead code meant only to preserve the variable through minification.
				var el = this || data;

				// Claim the first handler
				if ( rcheckableType.test( el.type ) &&
					el.click && nodeName( el, "input" ) ) {

					// dataPriv.set( el, "click", ... )
					leverageNative( el, "click", returnTrue );
				}

				// Return false to allow normal processing in the caller
				return false;
			},
			trigger: function( data ) {

				// For mutual compressibility with _default, replace `this` access with a local var.
				// `|| data` is dead code meant only to preserve the variable through minification.
				var el = this || data;

				// Force setup before triggering a click
				if ( rcheckableType.test( el.type ) &&
					el.click && nodeName( el, "input" ) ) {

					leverageNative( el, "click" );
				}

				// Return non-false to allow normal event-path propagation
				return true;
			},

			// For cross-browser consistency, suppress native .click() on links
			// Also prevent it if we're currently inside a leveraged native-event stack
			_default: function( event ) {
				var target = event.target;
				return rcheckableType.test( target.type ) &&
					target.click && nodeName( target, "input" ) &&
					dataPriv.get( target, "click" ) ||
					nodeName( target, "a" );
			}
		},

		beforeunload: {
			postDispatch: function( event ) {

				// Support: Firefox 20+
				// Firefox doesn't alert if the returnValue field is not set.
				if ( event.result !== undefined && event.originalEvent ) {
					event.originalEvent.returnValue = event.result;
				}
			}
		}
	}
};

// Ensure the presence of an event listener that handles manually-triggered
// synthetic events by interrupting progress until reinvoked in response to
// *native* events that it fires directly, ensuring that state changes have
// already occurred before other listeners are invoked.
function leverageNative( el, type, expectSync ) {

	// Missing expectSync indicates a trigger call, which must force setup through jQuery.event.add
	if ( !expectSync ) {
		if ( dataPriv.get( el, type ) === undefined ) {
			jQuery.event.add( el, type, returnTrue );
		}
		return;
	}

	// Register the controller as a special universal handler for all event namespaces
	dataPriv.set( el, type, false );
	jQuery.event.add( el, type, {
		namespace: false,
		handler: function( event ) {
			var notAsync, result,
				saved = dataPriv.get( this, type );

			if ( ( event.isTrigger & 1 ) && this[ type ] ) {

				// Interrupt processing of the outer synthetic .trigger()ed event
				// Saved data should be false in such cases, but might be a leftover capture object
				// from an async native handler (gh-4350)
				if ( !saved.length ) {

					// Store arguments for use when handling the inner native event
					// There will always be at least one argument (an event object), so this array
					// will not be confused with a leftover capture object.
					saved = slice.call( arguments );
					dataPriv.set( this, type, saved );

					// Trigger the native event and capture its result
					// Support: IE <=9 - 11+
					// focus() and blur() are asynchronous
					notAsync = expectSync( this, type );
					this[ type ]();
					result = dataPriv.get( this, type );
					if ( saved !== result || notAsync ) {
						dataPriv.set( this, type, false );
					} else {
						result = {};
					}
					if ( saved !== result ) {

						// Cancel the outer synthetic event
						event.stopImmediatePropagation();
						event.preventDefault();
						return result.value;
					}

				// If this is an inner synthetic event for an event with a bubbling surrogate
				// (focus or blur), assume that the surrogate already propagated from triggering the
				// native event and prevent that from happening again here.
				// This technically gets the ordering wrong w.r.t. to `.trigger()` (in which the
				// bubbling surrogate propagates *after* the non-bubbling base), but that seems
				// less bad than duplication.
				} else if ( ( jQuery.event.special[ type ] || {} ).delegateType ) {
					event.stopPropagation();
				}

			// If this is a native event triggered above, everything is now in order
			// Fire an inner synthetic event with the original arguments
			} else if ( saved.length ) {

				// ...and capture the result
				dataPriv.set( this, type, {
					value: jQuery.event.trigger(

						// Support: IE <=9 - 11+
						// Extend with the prototype to reset the above stopImmediatePropagation()
						jQuery.extend( saved[ 0 ], jQuery.Event.prototype ),
						saved.slice( 1 ),
						this
					)
				} );

				// Abort handling of the native event
				event.stopImmediatePropagation();
			}
		}
	} );
}

jQuery.removeEvent = function( elem, type, handle ) {

	// This "if" is needed for plain objects
	if ( elem.removeEventListener ) {
		elem.removeEventListener( type, handle );
	}
};

jQuery.Event = function( src, props ) {

	// Allow instantiation without the 'new' keyword
	if ( !( this instanceof jQuery.Event ) ) {
		return new jQuery.Event( src, props );
	}

	// Event object
	if ( src && src.type ) {
		this.originalEvent = src;
		this.type = src.type;

		// Events bubbling up the document may have been marked as prevented
		// by a handler lower down the tree; reflect the correct value.
		this.isDefaultPrevented = src.defaultPrevented ||
				src.defaultPrevented === undefined &&

				// Support: Android <=2.3 only
				src.returnValue === false ?
			returnTrue :
			returnFalse;

		// Create target properties
		// Support: Safari <=6 - 7 only
		// Target should not be a text node (#504, #13143)
		this.target = ( src.target && src.target.nodeType === 3 ) ?
			src.target.parentNode :
			src.target;

		this.currentTarget = src.currentTarget;
		this.relatedTarget = src.relatedTarget;

	// Event type
	} else {
		this.type = src;
	}

	// Put explicitly provided properties onto the event object
	if ( props ) {
		jQuery.extend( this, props );
	}

	// Create a timestamp if incoming event doesn't have one
	this.timeStamp = src && src.timeStamp || Date.now();

	// Mark it as fixed
	this[ jQuery.expando ] = true;
};

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// https://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
jQuery.Event.prototype = {
	constructor: jQuery.Event,
	isDefaultPrevented: returnFalse,
	isPropagationStopped: returnFalse,
	isImmediatePropagationStopped: returnFalse,
	isSimulated: false,

	preventDefault: function() {
		var e = this.originalEvent;

		this.isDefaultPrevented = returnTrue;

		if ( e && !this.isSimulated ) {
			e.preventDefault();
		}
	},
	stopPropagation: function() {
		var e = this.originalEvent;

		this.isPropagationStopped = returnTrue;

		if ( e && !this.isSimulated ) {
			e.stopPropagation();
		}
	},
	stopImmediatePropagation: function() {
		var e = this.originalEvent;

		this.isImmediatePropagationStopped = returnTrue;

		if ( e && !this.isSimulated ) {
			e.stopImmediatePropagation();
		}

		this.stopPropagation();
	}
};

// Includes all common event props including KeyEvent and MouseEvent specific props
jQuery.each( {
	altKey: true,
	bubbles: true,
	cancelable: true,
	changedTouches: true,
	ctrlKey: true,
	detail: true,
	eventPhase: true,
	metaKey: true,
	pageX: true,
	pageY: true,
	shiftKey: true,
	view: true,
	"char": true,
	code: true,
	charCode: true,
	key: true,
	keyCode: true,
	button: true,
	buttons: true,
	clientX: true,
	clientY: true,
	offsetX: true,
	offsetY: true,
	pointerId: true,
	pointerType: true,
	screenX: true,
	screenY: true,
	targetTouches: true,
	toElement: true,
	touches: true,

	which: function( event ) {
		var button = event.button;

		// Add which for key events
		if ( event.which == null && rkeyEvent.test( event.type ) ) {
			return event.charCode != null ? event.charCode : event.keyCode;
		}

		// Add which for click: 1 === left; 2 === middle; 3 === right
		if ( !event.which && button !== undefined && rmouseEvent.test( event.type ) ) {
			if ( button & 1 ) {
				return 1;
			}

			if ( button & 2 ) {
				return 3;
			}

			if ( button & 4 ) {
				return 2;
			}

			return 0;
		}

		return event.which;
	}
}, jQuery.event.addProp );

jQuery.each( { focus: "focusin", blur: "focusout" }, function( type, delegateType ) {
	jQuery.event.special[ type ] = {

		// Utilize native event if possible so blur/focus sequence is correct
		setup: function() {

			// Claim the first handler
			// dataPriv.set( this, "focus", ... )
			// dataPriv.set( this, "blur", ... )
			leverageNative( this, type, expectSync );

			// Return false to allow normal processing in the caller
			return false;
		},
		trigger: function() {

			// Force setup before trigger
			leverageNative( this, type );

			// Return non-false to allow normal event-path propagation
			return true;
		},

		delegateType: delegateType
	};
} );

// Create mouseenter/leave events using mouseover/out and event-time checks
// so that event delegation works in jQuery.
// Do the same for pointerenter/pointerleave and pointerover/pointerout
//
// Support: Safari 7 only
// Safari sends mouseenter too often; see:
// https://bugs.chromium.org/p/chromium/issues/detail?id=470258
// for the description of the bug (it existed in older Chrome versions as well).
jQuery.each( {
	mouseenter: "mouseover",
	mouseleave: "mouseout",
	pointerenter: "pointerover",
	pointerleave: "pointerout"
}, function( orig, fix ) {
	jQuery.event.special[ orig ] = {
		delegateType: fix,
		bindType: fix,

		handle: function( event ) {
			var ret,
				target = this,
				related = event.relatedTarget,
				handleObj = event.handleObj;

			// For mouseenter/leave call the handler if related is outside the target.
			// NB: No relatedTarget if the mouse left/entered the browser window
			if ( !related || ( related !== target && !jQuery.contains( target, related ) ) ) {
				event.type = handleObj.origType;
				ret = handleObj.handler.apply( this, arguments );
				event.type = fix;
			}
			return ret;
		}
	};
} );

jQuery.fn.extend( {

	on: function( types, selector, data, fn ) {
		return on( this, types, selector, data, fn );
	},
	one: function( types, selector, data, fn ) {
		return on( this, types, selector, data, fn, 1 );
	},
	off: function( types, selector, fn ) {
		var handleObj, type;
		if ( types && types.preventDefault && types.handleObj ) {

			// ( event )  dispatched jQuery.Event
			handleObj = types.handleObj;
			jQuery( types.delegateTarget ).off(
				handleObj.namespace ?
					handleObj.origType + "." + handleObj.namespace :
					handleObj.origType,
				handleObj.selector,
				handleObj.handler
			);
			return this;
		}
		if ( typeof types === "object" ) {

			// ( types-object [, selector] )
			for ( type in types ) {
				this.off( type, selector, types[ type ] );
			}
			return this;
		}
		if ( selector === false || typeof selector === "function" ) {

			// ( types [, fn] )
			fn = selector;
			selector = undefined;
		}
		if ( fn === false ) {
			fn = returnFalse;
		}
		return this.each( function() {
			jQuery.event.remove( this, types, fn, selector );
		} );
	}
} );


var

	// Support: IE <=10 - 11, Edge 12 - 13 only
	// In IE/Edge using regex groups here causes severe slowdowns.
	// See https://connect.microsoft.com/IE/feedback/details/1736512/
	rnoInnerhtml = /<script|<style|<link/i,

	// checked="checked" or checked
	rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
	rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;

// Prefer a tbody over its parent table for containing new rows
function manipulationTarget( elem, content ) {
	if ( nodeName( elem, "table" ) &&
		nodeName( content.nodeType !== 11 ? content : content.firstChild, "tr" ) ) {

		return jQuery( elem ).children( "tbody" )[ 0 ] || elem;
	}

	return elem;
}

// Replace/restore the type attribute of script elements for safe DOM manipulation
function disableScript( elem ) {
	elem.type = ( elem.getAttribute( "type" ) !== null ) + "/" + elem.type;
	return elem;
}
function restoreScript( elem ) {
	if ( ( elem.type || "" ).slice( 0, 5 ) === "true/" ) {
		elem.type = elem.type.slice( 5 );
	} else {
		elem.removeAttribute( "type" );
	}

	return elem;
}

function cloneCopyEvent( src, dest ) {
	var i, l, type, pdataOld, udataOld, udataCur, events;

	if ( dest.nodeType !== 1 ) {
		return;
	}

	// 1. Copy private data: events, handlers, etc.
	if ( dataPriv.hasData( src ) ) {
		pdataOld = dataPriv.get( src );
		events = pdataOld.events;

		if ( events ) {
			dataPriv.remove( dest, "handle events" );

			for ( type in events ) {
				for ( i = 0, l = events[ type ].length; i < l; i++ ) {
					jQuery.event.add( dest, type, events[ type ][ i ] );
				}
			}
		}
	}

	// 2. Copy user data
	if ( dataUser.hasData( src ) ) {
		udataOld = dataUser.access( src );
		udataCur = jQuery.extend( {}, udataOld );

		dataUser.set( dest, udataCur );
	}
}

// Fix IE bugs, see support tests
function fixInput( src, dest ) {
	var nodeName = dest.nodeName.toLowerCase();

	// Fails to persist the checked state of a cloned checkbox or radio button.
	if ( nodeName === "input" && rcheckableType.test( src.type ) ) {
		dest.checked = src.checked;

	// Fails to return the selected option to the default selected state when cloning options
	} else if ( nodeName === "input" || nodeName === "textarea" ) {
		dest.defaultValue = src.defaultValue;
	}
}

function domManip( collection, args, callback, ignored ) {

	// Flatten any nested arrays
	args = flat( args );

	var fragment, first, scripts, hasScripts, node, doc,
		i = 0,
		l = collection.length,
		iNoClone = l - 1,
		value = args[ 0 ],
		valueIsFunction = isFunction( value );

	// We can't cloneNode fragments that contain checked, in WebKit
	if ( valueIsFunction ||
			( l > 1 && typeof value === "string" &&
				!support.checkClone && rchecked.test( value ) ) ) {
		return collection.each( function( index ) {
			var self = collection.eq( index );
			if ( valueIsFunction ) {
				args[ 0 ] = value.call( this, index, self.html() );
			}
			domManip( self, args, callback, ignored );
		} );
	}

	if ( l ) {
		fragment = buildFragment( args, collection[ 0 ].ownerDocument, false, collection, ignored );
		first = fragment.firstChild;

		if ( fragment.childNodes.length === 1 ) {
			fragment = first;
		}

		// Require either new content or an interest in ignored elements to invoke the callback
		if ( first || ignored ) {
			scripts = jQuery.map( getAll( fragment, "script" ), disableScript );
			hasScripts = scripts.length;

			// Use the original fragment for the last item
			// instead of the first because it can end up
			// being emptied incorrectly in certain situations (#8070).
			for ( ; i < l; i++ ) {
				node = fragment;

				if ( i !== iNoClone ) {
					node = jQuery.clone( node, true, true );

					// Keep references to cloned scripts for later restoration
					if ( hasScripts ) {

						// Support: Android <=4.0 only, PhantomJS 1 only
						// push.apply(_, arraylike) throws on ancient WebKit
						jQuery.merge( scripts, getAll( node, "script" ) );
					}
				}

				callback.call( collection[ i ], node, i );
			}

			if ( hasScripts ) {
				doc = scripts[ scripts.length - 1 ].ownerDocument;

				// Reenable scripts
				jQuery.map( scripts, restoreScript );

				// Evaluate executable scripts on first document insertion
				for ( i = 0; i < hasScripts; i++ ) {
					node = scripts[ i ];
					if ( rscriptType.test( node.type || "" ) &&
						!dataPriv.access( node, "globalEval" ) &&
						jQuery.contains( doc, node ) ) {

						if ( node.src && ( node.type || "" ).toLowerCase()  !== "module" ) {

							// Optional AJAX dependency, but won't run scripts if not present
							if ( jQuery._evalUrl && !node.noModule ) {
								jQuery._evalUrl( node.src, {
									nonce: node.nonce || node.getAttribute( "nonce" )
								}, doc );
							}
						} else {
							DOMEval( node.textContent.replace( rcleanScript, "" ), node, doc );
						}
					}
				}
			}
		}
	}

	return collection;
}

function remove( elem, selector, keepData ) {
	var node,
		nodes = selector ? jQuery.filter( selector, elem ) : elem,
		i = 0;

	for ( ; ( node = nodes[ i ] ) != null; i++ ) {
		if ( !keepData && node.nodeType === 1 ) {
			jQuery.cleanData( getAll( node ) );
		}

		if ( node.parentNode ) {
			if ( keepData && isAttached( node ) ) {
				setGlobalEval( getAll( node, "script" ) );
			}
			node.parentNode.removeChild( node );
		}
	}

	return elem;
}

jQuery.extend( {
	htmlPrefilter: function( html ) {
		return html;
	},

	clone: function( elem, dataAndEvents, deepDataAndEvents ) {
		var i, l, srcElements, destElements,
			clone = elem.cloneNode( true ),
			inPage = isAttached( elem );

		// Fix IE cloning issues
		if ( !support.noCloneChecked && ( elem.nodeType === 1 || elem.nodeType === 11 ) &&
				!jQuery.isXMLDoc( elem ) ) {

			// We eschew Sizzle here for performance reasons: https://jsperf.com/getall-vs-sizzle/2
			destElements = getAll( clone );
			srcElements = getAll( elem );

			for ( i = 0, l = srcElements.length; i < l; i++ ) {
				fixInput( srcElements[ i ], destElements[ i ] );
			}
		}

		// Copy the events from the original to the clone
		if ( dataAndEvents ) {
			if ( deepDataAndEvents ) {
				srcElements = srcElements || getAll( elem );
				destElements = destElements || getAll( clone );

				for ( i = 0, l = srcElements.length; i < l; i++ ) {
					cloneCopyEvent( srcElements[ i ], destElements[ i ] );
				}
			} else {
				cloneCopyEvent( elem, clone );
			}
		}

		// Preserve script evaluation history
		destElements = getAll( clone, "script" );
		if ( destElements.length > 0 ) {
			setGlobalEval( destElements, !inPage && getAll( elem, "script" ) );
		}

		// Return the cloned set
		return clone;
	},

	cleanData: function( elems ) {
		var data, elem, type,
			special = jQuery.event.special,
			i = 0;

		for ( ; ( elem = elems[ i ] ) !== undefined; i++ ) {
			if ( acceptData( elem ) ) {
				if ( ( data = elem[ dataPriv.expando ] ) ) {
					if ( data.events ) {
						for ( type in data.events ) {
							if ( special[ type ] ) {
								jQuery.event.remove( elem, type );

							// This is a shortcut to avoid jQuery.event.remove's overhead
							} else {
								jQuery.removeEvent( elem, type, data.handle );
							}
						}
					}

					// Support: Chrome <=35 - 45+
					// Assign undefined instead of using delete, see Data#remove
					elem[ dataPriv.expando ] = undefined;
				}
				if ( elem[ dataUser.expando ] ) {

					// Support: Chrome <=35 - 45+
					// Assign undefined instead of using delete, see Data#remove
					elem[ dataUser.expando ] = undefined;
				}
			}
		}
	}
} );

jQuery.fn.extend( {
	detach: function( selector ) {
		return remove( this, selector, true );
	},

	remove: function( selector ) {
		return remove( this, selector );
	},

	text: function( value ) {
		return access( this, function( value ) {
			return value === undefined ?
				jQuery.text( this ) :
				this.empty().each( function() {
					if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
						this.textContent = value;
					}
				} );
		}, null, value, arguments.length );
	},

	append: function() {
		return domManip( this, arguments, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				var target = manipulationTarget( this, elem );
				target.appendChild( elem );
			}
		} );
	},

	prepend: function() {
		return domManip( this, arguments, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				var target = manipulationTarget( this, elem );
				target.insertBefore( elem, target.firstChild );
			}
		} );
	},

	before: function() {
		return domManip( this, arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this );
			}
		} );
	},

	after: function() {
		return domManip( this, arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this.nextSibling );
			}
		} );
	},

	empty: function() {
		var elem,
			i = 0;

		for ( ; ( elem = this[ i ] ) != null; i++ ) {
			if ( elem.nodeType === 1 ) {

				// Prevent memory leaks
				jQuery.cleanData( getAll( elem, false ) );

				// Remove any remaining nodes
				elem.textContent = "";
			}
		}

		return this;
	},

	clone: function( dataAndEvents, deepDataAndEvents ) {
		dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
		deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

		return this.map( function() {
			return jQuery.clone( this, dataAndEvents, deepDataAndEvents );
		} );
	},

	html: function( value ) {
		return access( this, function( value ) {
			var elem = this[ 0 ] || {},
				i = 0,
				l = this.length;

			if ( value === undefined && elem.nodeType === 1 ) {
				return elem.innerHTML;
			}

			// See if we can take a shortcut and just use innerHTML
			if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
				!wrapMap[ ( rtagName.exec( value ) || [ "", "" ] )[ 1 ].toLowerCase() ] ) {

				value = jQuery.htmlPrefilter( value );

				try {
					for ( ; i < l; i++ ) {
						elem = this[ i ] || {};

						// Remove element nodes and prevent memory leaks
						if ( elem.nodeType === 1 ) {
							jQuery.cleanData( getAll( elem, false ) );
							elem.innerHTML = value;
						}
					}

					elem = 0;

				// If using innerHTML throws an exception, use the fallback method
				} catch ( e ) {}
			}

			if ( elem ) {
				this.empty().append( value );
			}
		}, null, value, arguments.length );
	},

	replaceWith: function() {
		var ignored = [];

		// Make the changes, replacing each non-ignored context element with the new content
		return domManip( this, arguments, function( elem ) {
			var parent = this.parentNode;

			if ( jQuery.inArray( this, ignored ) < 0 ) {
				jQuery.cleanData( getAll( this ) );
				if ( parent ) {
					parent.replaceChild( elem, this );
				}
			}

		// Force callback invocation
		}, ignored );
	}
} );

jQuery.each( {
	appendTo: "append",
	prependTo: "prepend",
	insertBefore: "before",
	insertAfter: "after",
	replaceAll: "replaceWith"
}, function( name, original ) {
	jQuery.fn[ name ] = function( selector ) {
		var elems,
			ret = [],
			insert = jQuery( selector ),
			last = insert.length - 1,
			i = 0;

		for ( ; i <= last; i++ ) {
			elems = i === last ? this : this.clone( true );
			jQuery( insert[ i ] )[ original ]( elems );

			// Support: Android <=4.0 only, PhantomJS 1 only
			// .get() because push.apply(_, arraylike) throws on ancient WebKit
			push.apply( ret, elems.get() );
		}

		return this.pushStack( ret );
	};
} );
var rnumnonpx = new RegExp( "^(" + pnum + ")(?!px)[a-z%]+$", "i" );

var getStyles = function( elem ) {

		// Support: IE <=11 only, Firefox <=30 (#15098, #14150)
		// IE throws on elements created in popups
		// FF meanwhile throws on frame elements through "defaultView.getComputedStyle"
		var view = elem.ownerDocument.defaultView;

		if ( !view || !view.opener ) {
			view = window;
		}

		return view.getComputedStyle( elem );
	};

var swap = function( elem, options, callback ) {
	var ret, name,
		old = {};

	// Remember the old values, and insert the new ones
	for ( name in options ) {
		old[ name ] = elem.style[ name ];
		elem.style[ name ] = options[ name ];
	}

	ret = callback.call( elem );

	// Revert the old values
	for ( name in options ) {
		elem.style[ name ] = old[ name ];
	}

	return ret;
};


var rboxStyle = new RegExp( cssExpand.join( "|" ), "i" );



( function() {

	// Executing both pixelPosition & boxSizingReliable tests require only one layout
	// so they're executed at the same time to save the second computation.
	function computeStyleTests() {

		// This is a singleton, we need to execute it only once
		if ( !div ) {
			return;
		}

		container.style.cssText = "position:absolute;left:-11111px;width:60px;" +
			"margin-top:1px;padding:0;border:0";
		div.style.cssText =
			"position:relative;display:block;box-sizing:border-box;overflow:scroll;" +
			"margin:auto;border:1px;padding:1px;" +
			"width:60%;top:1%";
		documentElement.appendChild( container ).appendChild( div );

		var divStyle = window.getComputedStyle( div );
		pixelPositionVal = divStyle.top !== "1%";

		// Support: Android 4.0 - 4.3 only, Firefox <=3 - 44
		reliableMarginLeftVal = roundPixelMeasures( divStyle.marginLeft ) === 12;

		// Support: Android 4.0 - 4.3 only, Safari <=9.1 - 10.1, iOS <=7.0 - 9.3
		// Some styles come back with percentage values, even though they shouldn't
		div.style.right = "60%";
		pixelBoxStylesVal = roundPixelMeasures( divStyle.right ) === 36;

		// Support: IE 9 - 11 only
		// Detect misreporting of content dimensions for box-sizing:border-box elements
		boxSizingReliableVal = roundPixelMeasures( divStyle.width ) === 36;

		// Support: IE 9 only
		// Detect overflow:scroll screwiness (gh-3699)
		// Support: Chrome <=64
		// Don't get tricked when zoom affects offsetWidth (gh-4029)
		div.style.position = "absolute";
		scrollboxSizeVal = roundPixelMeasures( div.offsetWidth / 3 ) === 12;

		documentElement.removeChild( container );

		// Nullify the div so it wouldn't be stored in the memory and
		// it will also be a sign that checks already performed
		div = null;
	}

	function roundPixelMeasures( measure ) {
		return Math.round( parseFloat( measure ) );
	}

	var pixelPositionVal, boxSizingReliableVal, scrollboxSizeVal, pixelBoxStylesVal,
		reliableTrDimensionsVal, reliableMarginLeftVal,
		container = document.createElement( "div" ),
		div = document.createElement( "div" );

	// Finish early in limited (non-browser) environments
	if ( !div.style ) {
		return;
	}

	// Support: IE <=9 - 11 only
	// Style of cloned element affects source element cloned (#8908)
	div.style.backgroundClip = "content-box";
	div.cloneNode( true ).style.backgroundClip = "";
	support.clearCloneStyle = div.style.backgroundClip === "content-box";

	jQuery.extend( support, {
		boxSizingReliable: function() {
			computeStyleTests();
			return boxSizingReliableVal;
		},
		pixelBoxStyles: function() {
			computeStyleTests();
			return pixelBoxStylesVal;
		},
		pixelPosition: function() {
			computeStyleTests();
			return pixelPositionVal;
		},
		reliableMarginLeft: function() {
			computeStyleTests();
			return reliableMarginLeftVal;
		},
		scrollboxSize: function() {
			computeStyleTests();
			return scrollboxSizeVal;
		},

		// Support: IE 9 - 11+, Edge 15 - 18+
		// IE/Edge misreport `getComputedStyle` of table rows with width/height
		// set in CSS while `offset*` properties report correct values.
		// Behavior in IE 9 is more subtle than in newer versions & it passes
		// some versions of this test; make sure not to make it pass there!
		reliableTrDimensions: function() {
			var table, tr, trChild, trStyle;
			if ( reliableTrDimensionsVal == null ) {
				table = document.createElement( "table" );
				tr = document.createElement( "tr" );
				trChild = document.createElement( "div" );

				table.style.cssText = "position:absolute;left:-11111px";
				tr.style.height = "1px";
				trChild.style.height = "9px";

				documentElement
					.appendChild( table )
					.appendChild( tr )
					.appendChild( trChild );

				trStyle = window.getComputedStyle( tr );
				reliableTrDimensionsVal = parseInt( trStyle.height ) > 3;

				documentElement.removeChild( table );
			}
			return reliableTrDimensionsVal;
		}
	} );
} )();


function curCSS( elem, name, computed ) {
	var width, minWidth, maxWidth, ret,

		// Support: Firefox 51+
		// Retrieving style before computed somehow
		// fixes an issue with getting wrong values
		// on detached elements
		style = elem.style;

	computed = computed || getStyles( elem );

	// getPropertyValue is needed for:
	//   .css('filter') (IE 9 only, #12537)
	//   .css('--customProperty) (#3144)
	if ( computed ) {
		ret = computed.getPropertyValue( name ) || computed[ name ];

		if ( ret === "" && !isAttached( elem ) ) {
			ret = jQuery.style( elem, name );
		}

		// A tribute to the "awesome hack by Dean Edwards"
		// Android Browser returns percentage for some values,
		// but width seems to be reliably pixels.
		// This is against the CSSOM draft spec:
		// https://drafts.csswg.org/cssom/#resolved-values
		if ( !support.pixelBoxStyles() && rnumnonpx.test( ret ) && rboxStyle.test( name ) ) {

			// Remember the original values
			width = style.width;
			minWidth = style.minWidth;
			maxWidth = style.maxWidth;

			// Put in the new values to get a computed value out
			style.minWidth = style.maxWidth = style.width = ret;
			ret = computed.width;

			// Revert the changed values
			style.width = width;
			style.minWidth = minWidth;
			style.maxWidth = maxWidth;
		}
	}

	return ret !== undefined ?

		// Support: IE <=9 - 11 only
		// IE returns zIndex value as an integer.
		ret + "" :
		ret;
}


function addGetHookIf( conditionFn, hookFn ) {

	// Define the hook, we'll check on the first run if it's really needed.
	return {
		get: function() {
			if ( conditionFn() ) {

				// Hook not needed (or it's not possible to use it due
				// to missing dependency), remove it.
				delete this.get;
				return;
			}

			// Hook needed; redefine it so that the support test is not executed again.
			return ( this.get = hookFn ).apply( this, arguments );
		}
	};
}


var cssPrefixes = [ "Webkit", "Moz", "ms" ],
	emptyStyle = document.createElement( "div" ).style,
	vendorProps = {};

// Return a vendor-prefixed property or undefined
function vendorPropName( name ) {

	// Check for vendor prefixed names
	var capName = name[ 0 ].toUpperCase() + name.slice( 1 ),
		i = cssPrefixes.length;

	while ( i-- ) {
		name = cssPrefixes[ i ] + capName;
		if ( name in emptyStyle ) {
			return name;
		}
	}
}

// Return a potentially-mapped jQuery.cssProps or vendor prefixed property
function finalPropName( name ) {
	var final = jQuery.cssProps[ name ] || vendorProps[ name ];

	if ( final ) {
		return final;
	}
	if ( name in emptyStyle ) {
		return name;
	}
	return vendorProps[ name ] = vendorPropName( name ) || name;
}


var

	// Swappable if display is none or starts with table
	// except "table", "table-cell", or "table-caption"
	// See here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
	rdisplayswap = /^(none|table(?!-c[ea]).+)/,
	rcustomProp = /^--/,
	cssShow = { position: "absolute", visibility: "hidden", display: "block" },
	cssNormalTransform = {
		letterSpacing: "0",
		fontWeight: "400"
	};

function setPositiveNumber( _elem, value, subtract ) {

	// Any relative (+/-) values have already been
	// normalized at this point
	var matches = rcssNum.exec( value );
	return matches ?

		// Guard against undefined "subtract", e.g., when used as in cssHooks
		Math.max( 0, matches[ 2 ] - ( subtract || 0 ) ) + ( matches[ 3 ] || "px" ) :
		value;
}

function boxModelAdjustment( elem, dimension, box, isBorderBox, styles, computedVal ) {
	var i = dimension === "width" ? 1 : 0,
		extra = 0,
		delta = 0;

	// Adjustment may not be necessary
	if ( box === ( isBorderBox ? "border" : "content" ) ) {
		return 0;
	}

	for ( ; i < 4; i += 2 ) {

		// Both box models exclude margin
		if ( box === "margin" ) {
			delta += jQuery.css( elem, box + cssExpand[ i ], true, styles );
		}

		// If we get here with a content-box, we're seeking "padding" or "border" or "margin"
		if ( !isBorderBox ) {

			// Add padding
			delta += jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );

			// For "border" or "margin", add border
			if ( box !== "padding" ) {
				delta += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );

			// But still keep track of it otherwise
			} else {
				extra += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}

		// If we get here with a border-box (content + padding + border), we're seeking "content" or
		// "padding" or "margin"
		} else {

			// For "content", subtract padding
			if ( box === "content" ) {
				delta -= jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );
			}

			// For "content" or "padding", subtract border
			if ( box !== "margin" ) {
				delta -= jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		}
	}

	// Account for positive content-box scroll gutter when requested by providing computedVal
	if ( !isBorderBox && computedVal >= 0 ) {

		// offsetWidth/offsetHeight is a rounded sum of content, padding, scroll gutter, and border
		// Assuming integer scroll gutter, subtract the rest and round down
		delta += Math.max( 0, Math.ceil(
			elem[ "offset" + dimension[ 0 ].toUpperCase() + dimension.slice( 1 ) ] -
			computedVal -
			delta -
			extra -
			0.5

		// If offsetWidth/offsetHeight is unknown, then we can't determine content-box scroll gutter
		// Use an explicit zero to avoid NaN (gh-3964)
		) ) || 0;
	}

	return delta;
}

function getWidthOrHeight( elem, dimension, extra ) {

	// Start with computed style
	var styles = getStyles( elem ),

		// To avoid forcing a reflow, only fetch boxSizing if we need it (gh-4322).
		// Fake content-box until we know it's needed to know the true value.
		boxSizingNeeded = !support.boxSizingReliable() || extra,
		isBorderBox = boxSizingNeeded &&
			jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
		valueIsBorderBox = isBorderBox,

		val = curCSS( elem, dimension, styles ),
		offsetProp = "offset" + dimension[ 0 ].toUpperCase() + dimension.slice( 1 );

	// Support: Firefox <=54
	// Return a confounding non-pixel value or feign ignorance, as appropriate.
	if ( rnumnonpx.test( val ) ) {
		if ( !extra ) {
			return val;
		}
		val = "auto";
	}


	// Support: IE 9 - 11 only
	// Use offsetWidth/offsetHeight for when box sizing is unreliable.
	// In those cases, the computed value can be trusted to be border-box.
	if ( ( !support.boxSizingReliable() && isBorderBox ||

		// Support: IE 10 - 11+, Edge 15 - 18+
		// IE/Edge misreport `getComputedStyle` of table rows with width/height
		// set in CSS while `offset*` properties report correct values.
		// Interestingly, in some cases IE 9 doesn't suffer from this issue.
		!support.reliableTrDimensions() && nodeName( elem, "tr" ) ||

		// Fall back to offsetWidth/offsetHeight when value is "auto"
		// This happens for inline elements with no explicit setting (gh-3571)
		val === "auto" ||

		// Support: Android <=4.1 - 4.3 only
		// Also use offsetWidth/offsetHeight for misreported inline dimensions (gh-3602)
		!parseFloat( val ) && jQuery.css( elem, "display", false, styles ) === "inline" ) &&

		// Make sure the element is visible & connected
		elem.getClientRects().length ) {

		isBorderBox = jQuery.css( elem, "boxSizing", false, styles ) === "border-box";

		// Where available, offsetWidth/offsetHeight approximate border box dimensions.
		// Where not available (e.g., SVG), assume unreliable box-sizing and interpret the
		// retrieved value as a content box dimension.
		valueIsBorderBox = offsetProp in elem;
		if ( valueIsBorderBox ) {
			val = elem[ offsetProp ];
		}
	}

	// Normalize "" and auto
	val = parseFloat( val ) || 0;

	// Adjust for the element's box model
	return ( val +
		boxModelAdjustment(
			elem,
			dimension,
			extra || ( isBorderBox ? "border" : "content" ),
			valueIsBorderBox,
			styles,

			// Provide the current computed size to request scroll gutter calculation (gh-3589)
			val
		)
	) + "px";
}

jQuery.extend( {

	// Add in style property hooks for overriding the default
	// behavior of getting and setting a style property
	cssHooks: {
		opacity: {
			get: function( elem, computed ) {
				if ( computed ) {

					// We should always get a number back from opacity
					var ret = curCSS( elem, "opacity" );
					return ret === "" ? "1" : ret;
				}
			}
		}
	},

	// Don't automatically add "px" to these possibly-unitless properties
	cssNumber: {
		"animationIterationCount": true,
		"columnCount": true,
		"fillOpacity": true,
		"flexGrow": true,
		"flexShrink": true,
		"fontWeight": true,
		"gridArea": true,
		"gridColumn": true,
		"gridColumnEnd": true,
		"gridColumnStart": true,
		"gridRow": true,
		"gridRowEnd": true,
		"gridRowStart": true,
		"lineHeight": true,
		"opacity": true,
		"order": true,
		"orphans": true,
		"widows": true,
		"zIndex": true,
		"zoom": true
	},

	// Add in properties whose names you wish to fix before
	// setting or getting the value
	cssProps: {},

	// Get and set the style property on a DOM Node
	style: function( elem, name, value, extra ) {

		// Don't set styles on text and comment nodes
		if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
			return;
		}

		// Make sure that we're working with the right name
		var ret, type, hooks,
			origName = camelCase( name ),
			isCustomProp = rcustomProp.test( name ),
			style = elem.style;

		// Make sure that we're working with the right name. We don't
		// want to query the value if it is a CSS custom property
		// since they are user-defined.
		if ( !isCustomProp ) {
			name = finalPropName( origName );
		}

		// Gets hook for the prefixed version, then unprefixed version
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// Check if we're setting a value
		if ( value !== undefined ) {
			type = typeof value;

			// Convert "+=" or "-=" to relative numbers (#7345)
			if ( type === "string" && ( ret = rcssNum.exec( value ) ) && ret[ 1 ] ) {
				value = adjustCSS( elem, name, ret );

				// Fixes bug #9237
				type = "number";
			}

			// Make sure that null and NaN values aren't set (#7116)
			if ( value == null || value !== value ) {
				return;
			}

			// If a number was passed in, add the unit (except for certain CSS properties)
			// The isCustomProp check can be removed in jQuery 4.0 when we only auto-append
			// "px" to a few hardcoded values.
			if ( type === "number" && !isCustomProp ) {
				value += ret && ret[ 3 ] || ( jQuery.cssNumber[ origName ] ? "" : "px" );
			}

			// background-* props affect original clone's values
			if ( !support.clearCloneStyle && value === "" && name.indexOf( "background" ) === 0 ) {
				style[ name ] = "inherit";
			}

			// If a hook was provided, use that value, otherwise just set the specified value
			if ( !hooks || !( "set" in hooks ) ||
				( value = hooks.set( elem, value, extra ) ) !== undefined ) {

				if ( isCustomProp ) {
					style.setProperty( name, value );
				} else {
					style[ name ] = value;
				}
			}

		} else {

			// If a hook was provided get the non-computed value from there
			if ( hooks && "get" in hooks &&
				( ret = hooks.get( elem, false, extra ) ) !== undefined ) {

				return ret;
			}

			// Otherwise just get the value from the style object
			return style[ name ];
		}
	},

	css: function( elem, name, extra, styles ) {
		var val, num, hooks,
			origName = camelCase( name ),
			isCustomProp = rcustomProp.test( name );

		// Make sure that we're working with the right name. We don't
		// want to modify the value if it is a CSS custom property
		// since they are user-defined.
		if ( !isCustomProp ) {
			name = finalPropName( origName );
		}

		// Try prefixed name followed by the unprefixed name
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// If a hook was provided get the computed value from there
		if ( hooks && "get" in hooks ) {
			val = hooks.get( elem, true, extra );
		}

		// Otherwise, if a way to get the computed value exists, use that
		if ( val === undefined ) {
			val = curCSS( elem, name, styles );
		}

		// Convert "normal" to computed value
		if ( val === "normal" && name in cssNormalTransform ) {
			val = cssNormalTransform[ name ];
		}

		// Make numeric if forced or a qualifier was provided and val looks numeric
		if ( extra === "" || extra ) {
			num = parseFloat( val );
			return extra === true || isFinite( num ) ? num || 0 : val;
		}

		return val;
	}
} );

jQuery.each( [ "height", "width" ], function( _i, dimension ) {
	jQuery.cssHooks[ dimension ] = {
		get: function( elem, computed, extra ) {
			if ( computed ) {

				// Certain elements can have dimension info if we invisibly show them
				// but it must have a current display style that would benefit
				return rdisplayswap.test( jQuery.css( elem, "display" ) ) &&

					// Support: Safari 8+
					// Table columns in Safari have non-zero offsetWidth & zero
					// getBoundingClientRect().width unless display is changed.
					// Support: IE <=11 only
					// Running getBoundingClientRect on a disconnected node
					// in IE throws an error.
					( !elem.getClientRects().length || !elem.getBoundingClientRect().width ) ?
						swap( elem, cssShow, function() {
							return getWidthOrHeight( elem, dimension, extra );
						} ) :
						getWidthOrHeight( elem, dimension, extra );
			}
		},

		set: function( elem, value, extra ) {
			var matches,
				styles = getStyles( elem ),

				// Only read styles.position if the test has a chance to fail
				// to avoid forcing a reflow.
				scrollboxSizeBuggy = !support.scrollboxSize() &&
					styles.position === "absolute",

				// To avoid forcing a reflow, only fetch boxSizing if we need it (gh-3991)
				boxSizingNeeded = scrollboxSizeBuggy || extra,
				isBorderBox = boxSizingNeeded &&
					jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
				subtract = extra ?
					boxModelAdjustment(
						elem,
						dimension,
						extra,
						isBorderBox,
						styles
					) :
					0;

			// Account for unreliable border-box dimensions by comparing offset* to computed and
			// faking a content-box to get border and padding (gh-3699)
			if ( isBorderBox && scrollboxSizeBuggy ) {
				subtract -= Math.ceil(
					elem[ "offset" + dimension[ 0 ].toUpperCase() + dimension.slice( 1 ) ] -
					parseFloat( styles[ dimension ] ) -
					boxModelAdjustment( elem, dimension, "border", false, styles ) -
					0.5
				);
			}

			// Convert to pixels if value adjustment is needed
			if ( subtract && ( matches = rcssNum.exec( value ) ) &&
				( matches[ 3 ] || "px" ) !== "px" ) {

				elem.style[ dimension ] = value;
				value = jQuery.css( elem, dimension );
			}

			return setPositiveNumber( elem, value, subtract );
		}
	};
} );

jQuery.cssHooks.marginLeft = addGetHookIf( support.reliableMarginLeft,
	function( elem, computed ) {
		if ( computed ) {
			return ( parseFloat( curCSS( elem, "marginLeft" ) ) ||
				elem.getBoundingClientRect().left -
					swap( elem, { marginLeft: 0 }, function() {
						return elem.getBoundingClientRect().left;
					} )
				) + "px";
		}
	}
);

// These hooks are used by animate to expand properties
jQuery.each( {
	margin: "",
	padding: "",
	border: "Width"
}, function( prefix, suffix ) {
	jQuery.cssHooks[ prefix + suffix ] = {
		expand: function( value ) {
			var i = 0,
				expanded = {},

				// Assumes a single number if not a string
				parts = typeof value === "string" ? value.split( " " ) : [ value ];

			for ( ; i < 4; i++ ) {
				expanded[ prefix + cssExpand[ i ] + suffix ] =
					parts[ i ] || parts[ i - 2 ] || parts[ 0 ];
			}

			return expanded;
		}
	};

	if ( prefix !== "margin" ) {
		jQuery.cssHooks[ prefix + suffix ].set = setPositiveNumber;
	}
} );

jQuery.fn.extend( {
	css: function( name, value ) {
		return access( this, function( elem, name, value ) {
			var styles, len,
				map = {},
				i = 0;

			if ( Array.isArray( name ) ) {
				styles = getStyles( elem );
				len = name.length;

				for ( ; i < len; i++ ) {
					map[ name[ i ] ] = jQuery.css( elem, name[ i ], false, styles );
				}

				return map;
			}

			return value !== undefined ?
				jQuery.style( elem, name, value ) :
				jQuery.css( elem, name );
		}, name, value, arguments.length > 1 );
	}
} );


function Tween( elem, options, prop, end, easing ) {
	return new Tween.prototype.init( elem, options, prop, end, easing );
}
jQuery.Tween = Tween;

Tween.prototype = {
	constructor: Tween,
	init: function( elem, options, prop, end, easing, unit ) {
		this.elem = elem;
		this.prop = prop;
		this.easing = easing || jQuery.easing._default;
		this.options = options;
		this.start = this.now = this.cur();
		this.end = end;
		this.unit = unit || ( jQuery.cssNumber[ prop ] ? "" : "px" );
	},
	cur: function() {
		var hooks = Tween.propHooks[ this.prop ];

		return hooks && hooks.get ?
			hooks.get( this ) :
			Tween.propHooks._default.get( this );
	},
	run: function( percent ) {
		var eased,
			hooks = Tween.propHooks[ this.prop ];

		if ( this.options.duration ) {
			this.pos = eased = jQuery.easing[ this.easing ](
				percent, this.options.duration * percent, 0, 1, this.options.duration
			);
		} else {
			this.pos = eased = percent;
		}
		this.now = ( this.end - this.start ) * eased + this.start;

		if ( this.options.step ) {
			this.options.step.call( this.elem, this.now, this );
		}

		if ( hooks && hooks.set ) {
			hooks.set( this );
		} else {
			Tween.propHooks._default.set( this );
		}
		return this;
	}
};

Tween.prototype.init.prototype = Tween.prototype;

Tween.propHooks = {
	_default: {
		get: function( tween ) {
			var result;

			// Use a property on the element directly when it is not a DOM element,
			// or when there is no matching style property that exists.
			if ( tween.elem.nodeType !== 1 ||
				tween.elem[ tween.prop ] != null && tween.elem.style[ tween.prop ] == null ) {
				return tween.elem[ tween.prop ];
			}

			// Passing an empty string as a 3rd parameter to .css will automatically
			// attempt a parseFloat and fallback to a string if the parse fails.
			// Simple values such as "10px" are parsed to Float;
			// complex values such as "rotate(1rad)" are returned as-is.
			result = jQuery.css( tween.elem, tween.prop, "" );

			// Empty strings, null, undefined and "auto" are converted to 0.
			return !result || result === "auto" ? 0 : result;
		},
		set: function( tween ) {

			// Use step hook for back compat.
			// Use cssHook if its there.
			// Use .style if available and use plain properties where available.
			if ( jQuery.fx.step[ tween.prop ] ) {
				jQuery.fx.step[ tween.prop ]( tween );
			} else if ( tween.elem.nodeType === 1 && (
					jQuery.cssHooks[ tween.prop ] ||
					tween.elem.style[ finalPropName( tween.prop ) ] != null ) ) {
				jQuery.style( tween.elem, tween.prop, tween.now + tween.unit );
			} else {
				tween.elem[ tween.prop ] = tween.now;
			}
		}
	}
};

// Support: IE <=9 only
// Panic based approach to setting things on disconnected nodes
Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
	set: function( tween ) {
		if ( tween.elem.nodeType && tween.elem.parentNode ) {
			tween.elem[ tween.prop ] = tween.now;
		}
	}
};

jQuery.easing = {
	linear: function( p ) {
		return p;
	},
	swing: function( p ) {
		return 0.5 - Math.cos( p * Math.PI ) / 2;
	},
	_default: "swing"
};

jQuery.fx = Tween.prototype.init;

// Back compat <1.8 extension point
jQuery.fx.step = {};




var
	fxNow, inProgress,
	rfxtypes = /^(?:toggle|show|hide)$/,
	rrun = /queueHooks$/;

function schedule() {
	if ( inProgress ) {
		if ( document.hidden === false && window.requestAnimationFrame ) {
			window.requestAnimationFrame( schedule );
		} else {
			window.setTimeout( schedule, jQuery.fx.interval );
		}

		jQuery.fx.tick();
	}
}

// Animations created synchronously will run synchronously
function createFxNow() {
	window.setTimeout( function() {
		fxNow = undefined;
	} );
	return ( fxNow = Date.now() );
}

// Generate parameters to create a standard animation
function genFx( type, includeWidth ) {
	var which,
		i = 0,
		attrs = { height: type };

	// If we include width, step value is 1 to do all cssExpand values,
	// otherwise step value is 2 to skip over Left and Right
	includeWidth = includeWidth ? 1 : 0;
	for ( ; i < 4; i += 2 - includeWidth ) {
		which = cssExpand[ i ];
		attrs[ "margin" + which ] = attrs[ "padding" + which ] = type;
	}

	if ( includeWidth ) {
		attrs.opacity = attrs.width = type;
	}

	return attrs;
}

function createTween( value, prop, animation ) {
	var tween,
		collection = ( Animation.tweeners[ prop ] || [] ).concat( Animation.tweeners[ "*" ] ),
		index = 0,
		length = collection.length;
	for ( ; index < length; index++ ) {
		if ( ( tween = collection[ index ].call( animation, prop, value ) ) ) {

			// We're done with this property
			return tween;
		}
	}
}

function defaultPrefilter( elem, props, opts ) {
	var prop, value, toggle, hooks, oldfire, propTween, restoreDisplay, display,
		isBox = "width" in props || "height" in props,
		anim = this,
		orig = {},
		style = elem.style,
		hidden = elem.nodeType && isHiddenWithinTree( elem ),
		dataShow = dataPriv.get( elem, "fxshow" );

	// Queue-skipping animations hijack the fx hooks
	if ( !opts.queue ) {
		hooks = jQuery._queueHooks( elem, "fx" );
		if ( hooks.unqueued == null ) {
			hooks.unqueued = 0;
			oldfire = hooks.empty.fire;
			hooks.empty.fire = function() {
				if ( !hooks.unqueued ) {
					oldfire();
				}
			};
		}
		hooks.unqueued++;

		anim.always( function() {

			// Ensure the complete handler is called before this completes
			anim.always( function() {
				hooks.unqueued--;
				if ( !jQuery.queue( elem, "fx" ).length ) {
					hooks.empty.fire();
				}
			} );
		} );
	}

	// Detect show/hide animations
	for ( prop in props ) {
		value = props[ prop ];
		if ( rfxtypes.test( value ) ) {
			delete props[ prop ];
			toggle = toggle || value === "toggle";
			if ( value === ( hidden ? "hide" : "show" ) ) {

				// Pretend to be hidden if this is a "show" and
				// there is still data from a stopped show/hide
				if ( value === "show" && dataShow && dataShow[ prop ] !== undefined ) {
					hidden = true;

				// Ignore all other no-op show/hide data
				} else {
					continue;
				}
			}
			orig[ prop ] = dataShow && dataShow[ prop ] || jQuery.style( elem, prop );
		}
	}

	// Bail out if this is a no-op like .hide().hide()
	propTween = !jQuery.isEmptyObject( props );
	if ( !propTween && jQuery.isEmptyObject( orig ) ) {
		return;
	}

	// Restrict "overflow" and "display" styles during box animations
	if ( isBox && elem.nodeType === 1 ) {

		// Support: IE <=9 - 11, Edge 12 - 15
		// Record all 3 overflow attributes because IE does not infer the shorthand
		// from identically-valued overflowX and overflowY and Edge just mirrors
		// the overflowX value there.
		opts.overflow = [ style.overflow, style.overflowX, style.overflowY ];

		// Identify a display type, preferring old show/hide data over the CSS cascade
		restoreDisplay = dataShow && dataShow.display;
		if ( restoreDisplay == null ) {
			restoreDisplay = dataPriv.get( elem, "display" );
		}
		display = jQuery.css( elem, "display" );
		if ( display === "none" ) {
			if ( restoreDisplay ) {
				display = restoreDisplay;
			} else {

				// Get nonempty value(s) by temporarily forcing visibility
				showHide( [ elem ], true );
				restoreDisplay = elem.style.display || restoreDisplay;
				display = jQuery.css( elem, "display" );
				showHide( [ elem ] );
			}
		}

		// Animate inline elements as inline-block
		if ( display === "inline" || display === "inline-block" && restoreDisplay != null ) {
			if ( jQuery.css( elem, "float" ) === "none" ) {

				// Restore the original display value at the end of pure show/hide animations
				if ( !propTween ) {
					anim.done( function() {
						style.display = restoreDisplay;
					} );
					if ( restoreDisplay == null ) {
						display = style.display;
						restoreDisplay = display === "none" ? "" : display;
					}
				}
				style.display = "inline-block";
			}
		}
	}

	if ( opts.overflow ) {
		style.overflow = "hidden";
		anim.always( function() {
			style.overflow = opts.overflow[ 0 ];
			style.overflowX = opts.overflow[ 1 ];
			style.overflowY = opts.overflow[ 2 ];
		} );
	}

	// Implement show/hide animations
	propTween = false;
	for ( prop in orig ) {

		// General show/hide setup for this element animation
		if ( !propTween ) {
			if ( dataShow ) {
				if ( "hidden" in dataShow ) {
					hidden = dataShow.hidden;
				}
			} else {
				dataShow = dataPriv.access( elem, "fxshow", { display: restoreDisplay } );
			}

			// Store hidden/visible for toggle so `.stop().toggle()` "reverses"
			if ( toggle ) {
				dataShow.hidden = !hidden;
			}

			// Show elements before animating them
			if ( hidden ) {
				showHide( [ elem ], true );
			}

			/* eslint-disable no-loop-func */

			anim.done( function() {

			/* eslint-enable no-loop-func */

				// The final step of a "hide" animation is actually hiding the element
				if ( !hidden ) {
					showHide( [ elem ] );
				}
				dataPriv.remove( elem, "fxshow" );
				for ( prop in orig ) {
					jQuery.style( elem, prop, orig[ prop ] );
				}
			} );
		}

		// Per-property setup
		propTween = createTween( hidden ? dataShow[ prop ] : 0, prop, anim );
		if ( !( prop in dataShow ) ) {
			dataShow[ prop ] = propTween.start;
			if ( hidden ) {
				propTween.end = propTween.start;
				propTween.start = 0;
			}
		}
	}
}

function propFilter( props, specialEasing ) {
	var index, name, easing, value, hooks;

	// camelCase, specialEasing and expand cssHook pass
	for ( index in props ) {
		name = camelCase( index );
		easing = specialEasing[ name ];
		value = props[ index ];
		if ( Array.isArray( value ) ) {
			easing = value[ 1 ];
			value = props[ index ] = value[ 0 ];
		}

		if ( index !== name ) {
			props[ name ] = value;
			delete props[ index ];
		}

		hooks = jQuery.cssHooks[ name ];
		if ( hooks && "expand" in hooks ) {
			value = hooks.expand( value );
			delete props[ name ];

			// Not quite $.extend, this won't overwrite existing keys.
			// Reusing 'index' because we have the correct "name"
			for ( index in value ) {
				if ( !( index in props ) ) {
					props[ index ] = value[ index ];
					specialEasing[ index ] = easing;
				}
			}
		} else {
			specialEasing[ name ] = easing;
		}
	}
}

function Animation( elem, properties, options ) {
	var result,
		stopped,
		index = 0,
		length = Animation.prefilters.length,
		deferred = jQuery.Deferred().always( function() {

			// Don't match elem in the :animated selector
			delete tick.elem;
		} ),
		tick = function() {
			if ( stopped ) {
				return false;
			}
			var currentTime = fxNow || createFxNow(),
				remaining = Math.max( 0, animation.startTime + animation.duration - currentTime ),

				// Support: Android 2.3 only
				// Archaic crash bug won't allow us to use `1 - ( 0.5 || 0 )` (#12497)
				temp = remaining / animation.duration || 0,
				percent = 1 - temp,
				index = 0,
				length = animation.tweens.length;

			for ( ; index < length; index++ ) {
				animation.tweens[ index ].run( percent );
			}

			deferred.notifyWith( elem, [ animation, percent, remaining ] );

			// If there's more to do, yield
			if ( percent < 1 && length ) {
				return remaining;
			}

			// If this was an empty animation, synthesize a final progress notification
			if ( !length ) {
				deferred.notifyWith( elem, [ animation, 1, 0 ] );
			}

			// Resolve the animation and report its conclusion
			deferred.resolveWith( elem, [ animation ] );
			return false;
		},
		animation = deferred.promise( {
			elem: elem,
			props: jQuery.extend( {}, properties ),
			opts: jQuery.extend( true, {
				specialEasing: {},
				easing: jQuery.easing._default
			}, options ),
			originalProperties: properties,
			originalOptions: options,
			startTime: fxNow || createFxNow(),
			duration: options.duration,
			tweens: [],
			createTween: function( prop, end ) {
				var tween = jQuery.Tween( elem, animation.opts, prop, end,
						animation.opts.specialEasing[ prop ] || animation.opts.easing );
				animation.tweens.push( tween );
				return tween;
			},
			stop: function( gotoEnd ) {
				var index = 0,

					// If we are going to the end, we want to run all the tweens
					// otherwise we skip this part
					length = gotoEnd ? animation.tweens.length : 0;
				if ( stopped ) {
					return this;
				}
				stopped = true;
				for ( ; index < length; index++ ) {
					animation.tweens[ index ].run( 1 );
				}

				// Resolve when we played the last frame; otherwise, reject
				if ( gotoEnd ) {
					deferred.notifyWith( elem, [ animation, 1, 0 ] );
					deferred.resolveWith( elem, [ animation, gotoEnd ] );
				} else {
					deferred.rejectWith( elem, [ animation, gotoEnd ] );
				}
				return this;
			}
		} ),
		props = animation.props;

	propFilter( props, animation.opts.specialEasing );

	for ( ; index < length; index++ ) {
		result = Animation.prefilters[ index ].call( animation, elem, props, animation.opts );
		if ( result ) {
			if ( isFunction( result.stop ) ) {
				jQuery._queueHooks( animation.elem, animation.opts.queue ).stop =
					result.stop.bind( result );
			}
			return result;
		}
	}

	jQuery.map( props, createTween, animation );

	if ( isFunction( animation.opts.start ) ) {
		animation.opts.start.call( elem, animation );
	}

	// Attach callbacks from options
	animation
		.progress( animation.opts.progress )
		.done( animation.opts.done, animation.opts.complete )
		.fail( animation.opts.fail )
		.always( animation.opts.always );

	jQuery.fx.timer(
		jQuery.extend( tick, {
			elem: elem,
			anim: animation,
			queue: animation.opts.queue
		} )
	);

	return animation;
}

jQuery.Animation = jQuery.extend( Animation, {

	tweeners: {
		"*": [ function( prop, value ) {
			var tween = this.createTween( prop, value );
			adjustCSS( tween.elem, prop, rcssNum.exec( value ), tween );
			return tween;
		} ]
	},

	tweener: function( props, callback ) {
		if ( isFunction( props ) ) {
			callback = props;
			props = [ "*" ];
		} else {
			props = props.match( rnothtmlwhite );
		}

		var prop,
			index = 0,
			length = props.length;

		for ( ; index < length; index++ ) {
			prop = props[ index ];
			Animation.tweeners[ prop ] = Animation.tweeners[ prop ] || [];
			Animation.tweeners[ prop ].unshift( callback );
		}
	},

	prefilters: [ defaultPrefilter ],

	prefilter: function( callback, prepend ) {
		if ( prepend ) {
			Animation.prefilters.unshift( callback );
		} else {
			Animation.prefilters.push( callback );
		}
	}
} );

jQuery.speed = function( speed, easing, fn ) {
	var opt = speed && typeof speed === "object" ? jQuery.extend( {}, speed ) : {
		complete: fn || !fn && easing ||
			isFunction( speed ) && speed,
		duration: speed,
		easing: fn && easing || easing && !isFunction( easing ) && easing
	};

	// Go to the end state if fx are off
	if ( jQuery.fx.off ) {
		opt.duration = 0;

	} else {
		if ( typeof opt.duration !== "number" ) {
			if ( opt.duration in jQuery.fx.speeds ) {
				opt.duration = jQuery.fx.speeds[ opt.duration ];

			} else {
				opt.duration = jQuery.fx.speeds._default;
			}
		}
	}

	// Normalize opt.queue - true/undefined/null -> "fx"
	if ( opt.queue == null || opt.queue === true ) {
		opt.queue = "fx";
	}

	// Queueing
	opt.old = opt.complete;

	opt.complete = function() {
		if ( isFunction( opt.old ) ) {
			opt.old.call( this );
		}

		if ( opt.queue ) {
			jQuery.dequeue( this, opt.queue );
		}
	};

	return opt;
};

jQuery.fn.extend( {
	fadeTo: function( speed, to, easing, callback ) {

		// Show any hidden elements after setting opacity to 0
		return this.filter( isHiddenWithinTree ).css( "opacity", 0 ).show()

			// Animate to the value specified
			.end().animate( { opacity: to }, speed, easing, callback );
	},
	animate: function( prop, speed, easing, callback ) {
		var empty = jQuery.isEmptyObject( prop ),
			optall = jQuery.speed( speed, easing, callback ),
			doAnimation = function() {

				// Operate on a copy of prop so per-property easing won't be lost
				var anim = Animation( this, jQuery.extend( {}, prop ), optall );

				// Empty animations, or finishing resolves immediately
				if ( empty || dataPriv.get( this, "finish" ) ) {
					anim.stop( true );
				}
			};
			doAnimation.finish = doAnimation;

		return empty || optall.queue === false ?
			this.each( doAnimation ) :
			this.queue( optall.queue, doAnimation );
	},
	stop: function( type, clearQueue, gotoEnd ) {
		var stopQueue = function( hooks ) {
			var stop = hooks.stop;
			delete hooks.stop;
			stop( gotoEnd );
		};

		if ( typeof type !== "string" ) {
			gotoEnd = clearQueue;
			clearQueue = type;
			type = undefined;
		}
		if ( clearQueue ) {
			this.queue( type || "fx", [] );
		}

		return this.each( function() {
			var dequeue = true,
				index = type != null && type + "queueHooks",
				timers = jQuery.timers,
				data = dataPriv.get( this );

			if ( index ) {
				if ( data[ index ] && data[ index ].stop ) {
					stopQueue( data[ index ] );
				}
			} else {
				for ( index in data ) {
					if ( data[ index ] && data[ index ].stop && rrun.test( index ) ) {
						stopQueue( data[ index ] );
					}
				}
			}

			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this &&
					( type == null || timers[ index ].queue === type ) ) {

					timers[ index ].anim.stop( gotoEnd );
					dequeue = false;
					timers.splice( index, 1 );
				}
			}

			// Start the next in the queue if the last step wasn't forced.
			// Timers currently will call their complete callbacks, which
			// will dequeue but only if they were gotoEnd.
			if ( dequeue || !gotoEnd ) {
				jQuery.dequeue( this, type );
			}
		} );
	},
	finish: function( type ) {
		if ( type !== false ) {
			type = type || "fx";
		}
		return this.each( function() {
			var index,
				data = dataPriv.get( this ),
				queue = data[ type + "queue" ],
				hooks = data[ type + "queueHooks" ],
				timers = jQuery.timers,
				length = queue ? queue.length : 0;

			// Enable finishing flag on private data
			data.finish = true;

			// Empty the queue first
			jQuery.queue( this, type, [] );

			if ( hooks && hooks.stop ) {
				hooks.stop.call( this, true );
			}

			// Look for any active animations, and finish them
			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this && timers[ index ].queue === type ) {
					timers[ index ].anim.stop( true );
					timers.splice( index, 1 );
				}
			}

			// Look for any animations in the old queue and finish them
			for ( index = 0; index < length; index++ ) {
				if ( queue[ index ] && queue[ index ].finish ) {
					queue[ index ].finish.call( this );
				}
			}

			// Turn off finishing flag
			delete data.finish;
		} );
	}
} );

jQuery.each( [ "toggle", "show", "hide" ], function( _i, name ) {
	var cssFn = jQuery.fn[ name ];
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return speed == null || typeof speed === "boolean" ?
			cssFn.apply( this, arguments ) :
			this.animate( genFx( name, true ), speed, easing, callback );
	};
} );

// Generate shortcuts for custom animations
jQuery.each( {
	slideDown: genFx( "show" ),
	slideUp: genFx( "hide" ),
	slideToggle: genFx( "toggle" ),
	fadeIn: { opacity: "show" },
	fadeOut: { opacity: "hide" },
	fadeToggle: { opacity: "toggle" }
}, function( name, props ) {
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return this.animate( props, speed, easing, callback );
	};
} );

jQuery.timers = [];
jQuery.fx.tick = function() {
	var timer,
		i = 0,
		timers = jQuery.timers;

	fxNow = Date.now();

	for ( ; i < timers.length; i++ ) {
		timer = timers[ i ];

		// Run the timer and safely remove it when done (allowing for external removal)
		if ( !timer() && timers[ i ] === timer ) {
			timers.splice( i--, 1 );
		}
	}

	if ( !timers.length ) {
		jQuery.fx.stop();
	}
	fxNow = undefined;
};

jQuery.fx.timer = function( timer ) {
	jQuery.timers.push( timer );
	jQuery.fx.start();
};

jQuery.fx.interval = 13;
jQuery.fx.start = function() {
	if ( inProgress ) {
		return;
	}

	inProgress = true;
	schedule();
};

jQuery.fx.stop = function() {
	inProgress = null;
};

jQuery.fx.speeds = {
	slow: 600,
	fast: 200,

	// Default speed
	_default: 400
};


// Based off of the plugin by Clint Helfers, with permission.
// https://web.archive.org/web/20100324014747/http://blindsignals.com/index.php/2009/07/jquery-delay/
jQuery.fn.delay = function( time, type ) {
	time = jQuery.fx ? jQuery.fx.speeds[ time ] || time : time;
	type = type || "fx";

	return this.queue( type, function( next, hooks ) {
		var timeout = window.setTimeout( next, time );
		hooks.stop = function() {
			window.clearTimeout( timeout );
		};
	} );
};


( function() {
	var input = document.createElement( "input" ),
		select = document.createElement( "select" ),
		opt = select.appendChild( document.createElement( "option" ) );

	input.type = "checkbox";

	// Support: Android <=4.3 only
	// Default value for a checkbox should be "on"
	support.checkOn = input.value !== "";

	// Support: IE <=11 only
	// Must access selectedIndex to make default options select
	support.optSelected = opt.selected;

	// Support: IE <=11 only
	// An input loses its value after becoming a radio
	input = document.createElement( "input" );
	input.value = "t";
	input.type = "radio";
	support.radioValue = input.value === "t";
} )();


var boolHook,
	attrHandle = jQuery.expr.attrHandle;

jQuery.fn.extend( {
	attr: function( name, value ) {
		return access( this, jQuery.attr, name, value, arguments.length > 1 );
	},

	removeAttr: function( name ) {
		return this.each( function() {
			jQuery.removeAttr( this, name );
		} );
	}
} );

jQuery.extend( {
	attr: function( elem, name, value ) {
		var ret, hooks,
			nType = elem.nodeType;

		// Don't get/set attributes on text, comment and attribute nodes
		if ( nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		// Fallback to prop when attributes are not supported
		if ( typeof elem.getAttribute === "undefined" ) {
			return jQuery.prop( elem, name, value );
		}

		// Attribute hooks are determined by the lowercase version
		// Grab necessary hook if one is defined
		if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {
			hooks = jQuery.attrHooks[ name.toLowerCase() ] ||
				( jQuery.expr.match.bool.test( name ) ? boolHook : undefined );
		}

		if ( value !== undefined ) {
			if ( value === null ) {
				jQuery.removeAttr( elem, name );
				return;
			}

			if ( hooks && "set" in hooks &&
				( ret = hooks.set( elem, value, name ) ) !== undefined ) {
				return ret;
			}

			elem.setAttribute( name, value + "" );
			return value;
		}

		if ( hooks && "get" in hooks && ( ret = hooks.get( elem, name ) ) !== null ) {
			return ret;
		}

		ret = jQuery.find.attr( elem, name );

		// Non-existent attributes return null, we normalize to undefined
		return ret == null ? undefined : ret;
	},

	attrHooks: {
		type: {
			set: function( elem, value ) {
				if ( !support.radioValue && value === "radio" &&
					nodeName( elem, "input" ) ) {
					var val = elem.value;
					elem.setAttribute( "type", value );
					if ( val ) {
						elem.value = val;
					}
					return value;
				}
			}
		}
	},

	removeAttr: function( elem, value ) {
		var name,
			i = 0,

			// Attribute names can contain non-HTML whitespace characters
			// https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
			attrNames = value && value.match( rnothtmlwhite );

		if ( attrNames && elem.nodeType === 1 ) {
			while ( ( name = attrNames[ i++ ] ) ) {
				elem.removeAttribute( name );
			}
		}
	}
} );

// Hooks for boolean attributes
boolHook = {
	set: function( elem, value, name ) {
		if ( value === false ) {

			// Remove boolean attributes when set to false
			jQuery.removeAttr( elem, name );
		} else {
			elem.setAttribute( name, name );
		}
		return name;
	}
};

jQuery.each( jQuery.expr.match.bool.source.match( /\w+/g ), function( _i, name ) {
	var getter = attrHandle[ name ] || jQuery.find.attr;

	attrHandle[ name ] = function( elem, name, isXML ) {
		var ret, handle,
			lowercaseName = name.toLowerCase();

		if ( !isXML ) {

			// Avoid an infinite loop by temporarily removing this function from the getter
			handle = attrHandle[ lowercaseName ];
			attrHandle[ lowercaseName ] = ret;
			ret = getter( elem, name, isXML ) != null ?
				lowercaseName :
				null;
			attrHandle[ lowercaseName ] = handle;
		}
		return ret;
	};
} );




var rfocusable = /^(?:input|select|textarea|button)$/i,
	rclickable = /^(?:a|area)$/i;

jQuery.fn.extend( {
	prop: function( name, value ) {
		return access( this, jQuery.prop, name, value, arguments.length > 1 );
	},

	removeProp: function( name ) {
		return this.each( function() {
			delete this[ jQuery.propFix[ name ] || name ];
		} );
	}
} );

jQuery.extend( {
	prop: function( elem, name, value ) {
		var ret, hooks,
			nType = elem.nodeType;

		// Don't get/set properties on text, comment and attribute nodes
		if ( nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {

			// Fix name and attach hooks
			name = jQuery.propFix[ name ] || name;
			hooks = jQuery.propHooks[ name ];
		}

		if ( value !== undefined ) {
			if ( hooks && "set" in hooks &&
				( ret = hooks.set( elem, value, name ) ) !== undefined ) {
				return ret;
			}

			return ( elem[ name ] = value );
		}

		if ( hooks && "get" in hooks && ( ret = hooks.get( elem, name ) ) !== null ) {
			return ret;
		}

		return elem[ name ];
	},

	propHooks: {
		tabIndex: {
			get: function( elem ) {

				// Support: IE <=9 - 11 only
				// elem.tabIndex doesn't always return the
				// correct value when it hasn't been explicitly set
				// https://web.archive.org/web/20141116233347/http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
				// Use proper attribute retrieval(#12072)
				var tabindex = jQuery.find.attr( elem, "tabindex" );

				if ( tabindex ) {
					return parseInt( tabindex, 10 );
				}

				if (
					rfocusable.test( elem.nodeName ) ||
					rclickable.test( elem.nodeName ) &&
					elem.href
				) {
					return 0;
				}

				return -1;
			}
		}
	},

	propFix: {
		"for": "htmlFor",
		"class": "className"
	}
} );

// Support: IE <=11 only
// Accessing the selectedIndex property
// forces the browser to respect setting selected
// on the option
// The getter ensures a default option is selected
// when in an optgroup
// eslint rule "no-unused-expressions" is disabled for this code
// since it considers such accessions noop
if ( !support.optSelected ) {
	jQuery.propHooks.selected = {
		get: function( elem ) {

			/* eslint no-unused-expressions: "off" */

			var parent = elem.parentNode;
			if ( parent && parent.parentNode ) {
				parent.parentNode.selectedIndex;
			}
			return null;
		},
		set: function( elem ) {

			/* eslint no-unused-expressions: "off" */

			var parent = elem.parentNode;
			if ( parent ) {
				parent.selectedIndex;

				if ( parent.parentNode ) {
					parent.parentNode.selectedIndex;
				}
			}
		}
	};
}

jQuery.each( [
	"tabIndex",
	"readOnly",
	"maxLength",
	"cellSpacing",
	"cellPadding",
	"rowSpan",
	"colSpan",
	"useMap",
	"frameBorder",
	"contentEditable"
], function() {
	jQuery.propFix[ this.toLowerCase() ] = this;
} );




	// Strip and collapse whitespace according to HTML spec
	// https://infra.spec.whatwg.org/#strip-and-collapse-ascii-whitespace
	function stripAndCollapse( value ) {
		var tokens = value.match( rnothtmlwhite ) || [];
		return tokens.join( " " );
	}


function getClass( elem ) {
	return elem.getAttribute && elem.getAttribute( "class" ) || "";
}

function classesToArray( value ) {
	if ( Array.isArray( value ) ) {
		return value;
	}
	if ( typeof value === "string" ) {
		return value.match( rnothtmlwhite ) || [];
	}
	return [];
}

jQuery.fn.extend( {
	addClass: function( value ) {
		var classes, elem, cur, curValue, clazz, j, finalValue,
			i = 0;

		if ( isFunction( value ) ) {
			return this.each( function( j ) {
				jQuery( this ).addClass( value.call( this, j, getClass( this ) ) );
			} );
		}

		classes = classesToArray( value );

		if ( classes.length ) {
			while ( ( elem = this[ i++ ] ) ) {
				curValue = getClass( elem );
				cur = elem.nodeType === 1 && ( " " + stripAndCollapse( curValue ) + " " );

				if ( cur ) {
					j = 0;
					while ( ( clazz = classes[ j++ ] ) ) {
						if ( cur.indexOf( " " + clazz + " " ) < 0 ) {
							cur += clazz + " ";
						}
					}

					// Only assign if different to avoid unneeded rendering.
					finalValue = stripAndCollapse( cur );
					if ( curValue !== finalValue ) {
						elem.setAttribute( "class", finalValue );
					}
				}
			}
		}

		return this;
	},

	removeClass: function( value ) {
		var classes, elem, cur, curValue, clazz, j, finalValue,
			i = 0;

		if ( isFunction( value ) ) {
			return this.each( function( j ) {
				jQuery( this ).removeClass( value.call( this, j, getClass( this ) ) );
			} );
		}

		if ( !arguments.length ) {
			return this.attr( "class", "" );
		}

		classes = classesToArray( value );

		if ( classes.length ) {
			while ( ( elem = this[ i++ ] ) ) {
				curValue = getClass( elem );

				// This expression is here for better compressibility (see addClass)
				cur = elem.nodeType === 1 && ( " " + stripAndCollapse( curValue ) + " " );

				if ( cur ) {
					j = 0;
					while ( ( clazz = classes[ j++ ] ) ) {

						// Remove *all* instances
						while ( cur.indexOf( " " + clazz + " " ) > -1 ) {
							cur = cur.replace( " " + clazz + " ", " " );
						}
					}

					// Only assign if different to avoid unneeded rendering.
					finalValue = stripAndCollapse( cur );
					if ( curValue !== finalValue ) {
						elem.setAttribute( "class", finalValue );
					}
				}
			}
		}

		return this;
	},

	toggleClass: function( value, stateVal ) {
		var type = typeof value,
			isValidValue = type === "string" || Array.isArray( value );

		if ( typeof stateVal === "boolean" && isValidValue ) {
			return stateVal ? this.addClass( value ) : this.removeClass( value );
		}

		if ( isFunction( value ) ) {
			return this.each( function( i ) {
				jQuery( this ).toggleClass(
					value.call( this, i, getClass( this ), stateVal ),
					stateVal
				);
			} );
		}

		return this.each( function() {
			var className, i, self, classNames;

			if ( isValidValue ) {

				// Toggle individual class names
				i = 0;
				self = jQuery( this );
				classNames = classesToArray( value );

				while ( ( className = classNames[ i++ ] ) ) {

					// Check each className given, space separated list
					if ( self.hasClass( className ) ) {
						self.removeClass( className );
					} else {
						self.addClass( className );
					}
				}

			// Toggle whole class name
			} else if ( value === undefined || type === "boolean" ) {
				className = getClass( this );
				if ( className ) {

					// Store className if set
					dataPriv.set( this, "__className__", className );
				}

				// If the element has a class name or if we're passed `false`,
				// then remove the whole classname (if there was one, the above saved it).
				// Otherwise bring back whatever was previously saved (if anything),
				// falling back to the empty string if nothing was stored.
				if ( this.setAttribute ) {
					this.setAttribute( "class",
						className || value === false ?
						"" :
						dataPriv.get( this, "__className__" ) || ""
					);
				}
			}
		} );
	},

	hasClass: function( selector ) {
		var className, elem,
			i = 0;

		className = " " + selector + " ";
		while ( ( elem = this[ i++ ] ) ) {
			if ( elem.nodeType === 1 &&
				( " " + stripAndCollapse( getClass( elem ) ) + " " ).indexOf( className ) > -1 ) {
					return true;
			}
		}

		return false;
	}
} );




var rreturn = /\r/g;

jQuery.fn.extend( {
	val: function( value ) {
		var hooks, ret, valueIsFunction,
			elem = this[ 0 ];

		if ( !arguments.length ) {
			if ( elem ) {
				hooks = jQuery.valHooks[ elem.type ] ||
					jQuery.valHooks[ elem.nodeName.toLowerCase() ];

				if ( hooks &&
					"get" in hooks &&
					( ret = hooks.get( elem, "value" ) ) !== undefined
				) {
					return ret;
				}

				ret = elem.value;

				// Handle most common string cases
				if ( typeof ret === "string" ) {
					return ret.replace( rreturn, "" );
				}

				// Handle cases where value is null/undef or number
				return ret == null ? "" : ret;
			}

			return;
		}

		valueIsFunction = isFunction( value );

		return this.each( function( i ) {
			var val;

			if ( this.nodeType !== 1 ) {
				return;
			}

			if ( valueIsFunction ) {
				val = value.call( this, i, jQuery( this ).val() );
			} else {
				val = value;
			}

			// Treat null/undefined as ""; convert numbers to string
			if ( val == null ) {
				val = "";

			} else if ( typeof val === "number" ) {
				val += "";

			} else if ( Array.isArray( val ) ) {
				val = jQuery.map( val, function( value ) {
					return value == null ? "" : value + "";
				} );
			}

			hooks = jQuery.valHooks[ this.type ] || jQuery.valHooks[ this.nodeName.toLowerCase() ];

			// If set returns undefined, fall back to normal setting
			if ( !hooks || !( "set" in hooks ) || hooks.set( this, val, "value" ) === undefined ) {
				this.value = val;
			}
		} );
	}
} );

jQuery.extend( {
	valHooks: {
		option: {
			get: function( elem ) {

				var val = jQuery.find.attr( elem, "value" );
				return val != null ?
					val :

					// Support: IE <=10 - 11 only
					// option.text throws exceptions (#14686, #14858)
					// Strip and collapse whitespace
					// https://html.spec.whatwg.org/#strip-and-collapse-whitespace
					stripAndCollapse( jQuery.text( elem ) );
			}
		},
		select: {
			get: function( elem ) {
				var value, option, i,
					options = elem.options,
					index = elem.selectedIndex,
					one = elem.type === "select-one",
					values = one ? null : [],
					max = one ? index + 1 : options.length;

				if ( index < 0 ) {
					i = max;

				} else {
					i = one ? index : 0;
				}

				// Loop through all the selected options
				for ( ; i < max; i++ ) {
					option = options[ i ];

					// Support: IE <=9 only
					// IE8-9 doesn't update selected after form reset (#2551)
					if ( ( option.selected || i === index ) &&

							// Don't return options that are disabled or in a disabled optgroup
							!option.disabled &&
							( !option.parentNode.disabled ||
								!nodeName( option.parentNode, "optgroup" ) ) ) {

						// Get the specific value for the option
						value = jQuery( option ).val();

						// We don't need an array for one selects
						if ( one ) {
							return value;
						}

						// Multi-Selects return an array
						values.push( value );
					}
				}

				return values;
			},

			set: function( elem, value ) {
				var optionSet, option,
					options = elem.options,
					values = jQuery.makeArray( value ),
					i = options.length;

				while ( i-- ) {
					option = options[ i ];

					/* eslint-disable no-cond-assign */

					if ( option.selected =
						jQuery.inArray( jQuery.valHooks.option.get( option ), values ) > -1
					) {
						optionSet = true;
					}

					/* eslint-enable no-cond-assign */
				}

				// Force browsers to behave consistently when non-matching value is set
				if ( !optionSet ) {
					elem.selectedIndex = -1;
				}
				return values;
			}
		}
	}
} );

// Radios and checkboxes getter/setter
jQuery.each( [ "radio", "checkbox" ], function() {
	jQuery.valHooks[ this ] = {
		set: function( elem, value ) {
			if ( Array.isArray( value ) ) {
				return ( elem.checked = jQuery.inArray( jQuery( elem ).val(), value ) > -1 );
			}
		}
	};
	if ( !support.checkOn ) {
		jQuery.valHooks[ this ].get = function( elem ) {
			return elem.getAttribute( "value" ) === null ? "on" : elem.value;
		};
	}
} );




// Return jQuery for attributes-only inclusion


support.focusin = "onfocusin" in window;


var rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
	stopPropagationCallback = function( e ) {
		e.stopPropagation();
	};

jQuery.extend( jQuery.event, {

	trigger: function( event, data, elem, onlyHandlers ) {

		var i, cur, tmp, bubbleType, ontype, handle, special, lastElement,
			eventPath = [ elem || document ],
			type = hasOwn.call( event, "type" ) ? event.type : event,
			namespaces = hasOwn.call( event, "namespace" ) ? event.namespace.split( "." ) : [];

		cur = lastElement = tmp = elem = elem || document;

		// Don't do events on text and comment nodes
		if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
			return;
		}

		// focus/blur morphs to focusin/out; ensure we're not firing them right now
		if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
			return;
		}

		if ( type.indexOf( "." ) > -1 ) {

			// Namespaced trigger; create a regexp to match event type in handle()
			namespaces = type.split( "." );
			type = namespaces.shift();
			namespaces.sort();
		}
		ontype = type.indexOf( ":" ) < 0 && "on" + type;

		// Caller can pass in a jQuery.Event object, Object, or just an event type string
		event = event[ jQuery.expando ] ?
			event :
			new jQuery.Event( type, typeof event === "object" && event );

		// Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
		event.isTrigger = onlyHandlers ? 2 : 3;
		event.namespace = namespaces.join( "." );
		event.rnamespace = event.namespace ?
			new RegExp( "(^|\\.)" + namespaces.join( "\\.(?:.*\\.|)" ) + "(\\.|$)" ) :
			null;

		// Clean up the event in case it is being reused
		event.result = undefined;
		if ( !event.target ) {
			event.target = elem;
		}

		// Clone any incoming data and prepend the event, creating the handler arg list
		data = data == null ?
			[ event ] :
			jQuery.makeArray( data, [ event ] );

		// Allow special events to draw outside the lines
		special = jQuery.event.special[ type ] || {};
		if ( !onlyHandlers && special.trigger && special.trigger.apply( elem, data ) === false ) {
			return;
		}

		// Determine event propagation path in advance, per W3C events spec (#9951)
		// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
		if ( !onlyHandlers && !special.noBubble && !isWindow( elem ) ) {

			bubbleType = special.delegateType || type;
			if ( !rfocusMorph.test( bubbleType + type ) ) {
				cur = cur.parentNode;
			}
			for ( ; cur; cur = cur.parentNode ) {
				eventPath.push( cur );
				tmp = cur;
			}

			// Only add window if we got to document (e.g., not plain obj or detached DOM)
			if ( tmp === ( elem.ownerDocument || document ) ) {
				eventPath.push( tmp.defaultView || tmp.parentWindow || window );
			}
		}

		// Fire handlers on the event path
		i = 0;
		while ( ( cur = eventPath[ i++ ] ) && !event.isPropagationStopped() ) {
			lastElement = cur;
			event.type = i > 1 ?
				bubbleType :
				special.bindType || type;

			// jQuery handler
			handle = (
					dataPriv.get( cur, "events" ) || Object.create( null )
				)[ event.type ] &&
				dataPriv.get( cur, "handle" );
			if ( handle ) {
				handle.apply( cur, data );
			}

			// Native handler
			handle = ontype && cur[ ontype ];
			if ( handle && handle.apply && acceptData( cur ) ) {
				event.result = handle.apply( cur, data );
				if ( event.result === false ) {
					event.preventDefault();
				}
			}
		}
		event.type = type;

		// If nobody prevented the default action, do it now
		if ( !onlyHandlers && !event.isDefaultPrevented() ) {

			if ( ( !special._default ||
				special._default.apply( eventPath.pop(), data ) === false ) &&
				acceptData( elem ) ) {

				// Call a native DOM method on the target with the same name as the event.
				// Don't do default actions on window, that's where global variables be (#6170)
				if ( ontype && isFunction( elem[ type ] ) && !isWindow( elem ) ) {

					// Don't re-trigger an onFOO event when we call its FOO() method
					tmp = elem[ ontype ];

					if ( tmp ) {
						elem[ ontype ] = null;
					}

					// Prevent re-triggering of the same event, since we already bubbled it above
					jQuery.event.triggered = type;

					if ( event.isPropagationStopped() ) {
						lastElement.addEventListener( type, stopPropagationCallback );
					}

					elem[ type ]();

					if ( event.isPropagationStopped() ) {
						lastElement.removeEventListener( type, stopPropagationCallback );
					}

					jQuery.event.triggered = undefined;

					if ( tmp ) {
						elem[ ontype ] = tmp;
					}
				}
			}
		}

		return event.result;
	},

	// Piggyback on a donor event to simulate a different one
	// Used only for `focus(in | out)` events
	simulate: function( type, elem, event ) {
		var e = jQuery.extend(
			new jQuery.Event(),
			event,
			{
				type: type,
				isSimulated: true
			}
		);

		jQuery.event.trigger( e, null, elem );
	}

} );

jQuery.fn.extend( {

	trigger: function( type, data ) {
		return this.each( function() {
			jQuery.event.trigger( type, data, this );
		} );
	},
	triggerHandler: function( type, data ) {
		var elem = this[ 0 ];
		if ( elem ) {
			return jQuery.event.trigger( type, data, elem, true );
		}
	}
} );


// Support: Firefox <=44
// Firefox doesn't have focus(in | out) events
// Related ticket - https://bugzilla.mozilla.org/show_bug.cgi?id=687787
//
// Support: Chrome <=48 - 49, Safari <=9.0 - 9.1
// focus(in | out) events fire after focus & blur events,
// which is spec violation - http://www.w3.org/TR/DOM-Level-3-Events/#events-focusevent-event-order
// Related ticket - https://bugs.chromium.org/p/chromium/issues/detail?id=449857
if ( !support.focusin ) {
	jQuery.each( { focus: "focusin", blur: "focusout" }, function( orig, fix ) {

		// Attach a single capturing handler on the document while someone wants focusin/focusout
		var handler = function( event ) {
			jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ) );
		};

		jQuery.event.special[ fix ] = {
			setup: function() {

				// Handle: regular nodes (via `this.ownerDocument`), window
				// (via `this.document`) & document (via `this`).
				var doc = this.ownerDocument || this.document || this,
					attaches = dataPriv.access( doc, fix );

				if ( !attaches ) {
					doc.addEventListener( orig, handler, true );
				}
				dataPriv.access( doc, fix, ( attaches || 0 ) + 1 );
			},
			teardown: function() {
				var doc = this.ownerDocument || this.document || this,
					attaches = dataPriv.access( doc, fix ) - 1;

				if ( !attaches ) {
					doc.removeEventListener( orig, handler, true );
					dataPriv.remove( doc, fix );

				} else {
					dataPriv.access( doc, fix, attaches );
				}
			}
		};
	} );
}
var location = window.location;

var nonce = { guid: Date.now() };

var rquery = ( /\?/ );



// Cross-browser xml parsing
jQuery.parseXML = function( data ) {
	var xml;
	if ( !data || typeof data !== "string" ) {
		return null;
	}

	// Support: IE 9 - 11 only
	// IE throws on parseFromString with invalid input.
	try {
		xml = ( new window.DOMParser() ).parseFromString( data, "text/xml" );
	} catch ( e ) {
		xml = undefined;
	}

	if ( !xml || xml.getElementsByTagName( "parsererror" ).length ) {
		jQuery.error( "Invalid XML: " + data );
	}
	return xml;
};


var
	rbracket = /\[\]$/,
	rCRLF = /\r?\n/g,
	rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
	rsubmittable = /^(?:input|select|textarea|keygen)/i;

function buildParams( prefix, obj, traditional, add ) {
	var name;

	if ( Array.isArray( obj ) ) {

		// Serialize array item.
		jQuery.each( obj, function( i, v ) {
			if ( traditional || rbracket.test( prefix ) ) {

				// Treat each array item as a scalar.
				add( prefix, v );

			} else {

				// Item is non-scalar (array or object), encode its numeric index.
				buildParams(
					prefix + "[" + ( typeof v === "object" && v != null ? i : "" ) + "]",
					v,
					traditional,
					add
				);
			}
		} );

	} else if ( !traditional && toType( obj ) === "object" ) {

		// Serialize object item.
		for ( name in obj ) {
			buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
		}

	} else {

		// Serialize scalar item.
		add( prefix, obj );
	}
}

// Serialize an array of form elements or a set of
// key/values into a query string
jQuery.param = function( a, traditional ) {
	var prefix,
		s = [],
		add = function( key, valueOrFunction ) {

			// If value is a function, invoke it and use its return value
			var value = isFunction( valueOrFunction ) ?
				valueOrFunction() :
				valueOrFunction;

			s[ s.length ] = encodeURIComponent( key ) + "=" +
				encodeURIComponent( value == null ? "" : value );
		};

	if ( a == null ) {
		return "";
	}

	// If an array was passed in, assume that it is an array of form elements.
	if ( Array.isArray( a ) || ( a.jquery && !jQuery.isPlainObject( a ) ) ) {

		// Serialize the form elements
		jQuery.each( a, function() {
			add( this.name, this.value );
		} );

	} else {

		// If traditional, encode the "old" way (the way 1.3.2 or older
		// did it), otherwise encode params recursively.
		for ( prefix in a ) {
			buildParams( prefix, a[ prefix ], traditional, add );
		}
	}

	// Return the resulting serialization
	return s.join( "&" );
};

jQuery.fn.extend( {
	serialize: function() {
		return jQuery.param( this.serializeArray() );
	},
	serializeArray: function() {
		return this.map( function() {

			// Can add propHook for "elements" to filter or add form elements
			var elements = jQuery.prop( this, "elements" );
			return elements ? jQuery.makeArray( elements ) : this;
		} )
		.filter( function() {
			var type = this.type;

			// Use .is( ":disabled" ) so that fieldset[disabled] works
			return this.name && !jQuery( this ).is( ":disabled" ) &&
				rsubmittable.test( this.nodeName ) && !rsubmitterTypes.test( type ) &&
				( this.checked || !rcheckableType.test( type ) );
		} )
		.map( function( _i, elem ) {
			var val = jQuery( this ).val();

			if ( val == null ) {
				return null;
			}

			if ( Array.isArray( val ) ) {
				return jQuery.map( val, function( val ) {
					return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
				} );
			}

			return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
		} ).get();
	}
} );


var
	r20 = /%20/g,
	rhash = /#.*$/,
	rantiCache = /([?&])_=[^&]*/,
	rheaders = /^(.*?):[ \t]*([^\r\n]*)$/mg,

	// #7653, #8125, #8152: local protocol detection
	rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
	rnoContent = /^(?:GET|HEAD)$/,
	rprotocol = /^\/\//,

	/* Prefilters
	 * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
	 * 2) These are called:
	 *    - BEFORE asking for a transport
	 *    - AFTER param serialization (s.data is a string if s.processData is true)
	 * 3) key is the dataType
	 * 4) the catchall symbol "*" can be used
	 * 5) execution will start with transport dataType and THEN continue down to "*" if needed
	 */
	prefilters = {},

	/* Transports bindings
	 * 1) key is the dataType
	 * 2) the catchall symbol "*" can be used
	 * 3) selection will start with transport dataType and THEN go to "*" if needed
	 */
	transports = {},

	// Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
	allTypes = "*/".concat( "*" ),

	// Anchor tag for parsing the document origin
	originAnchor = document.createElement( "a" );
	originAnchor.href = location.href;

// Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
function addToPrefiltersOrTransports( structure ) {

	// dataTypeExpression is optional and defaults to "*"
	return function( dataTypeExpression, func ) {

		if ( typeof dataTypeExpression !== "string" ) {
			func = dataTypeExpression;
			dataTypeExpression = "*";
		}

		var dataType,
			i = 0,
			dataTypes = dataTypeExpression.toLowerCase().match( rnothtmlwhite ) || [];

		if ( isFunction( func ) ) {

			// For each dataType in the dataTypeExpression
			while ( ( dataType = dataTypes[ i++ ] ) ) {

				// Prepend if requested
				if ( dataType[ 0 ] === "+" ) {
					dataType = dataType.slice( 1 ) || "*";
					( structure[ dataType ] = structure[ dataType ] || [] ).unshift( func );

				// Otherwise append
				} else {
					( structure[ dataType ] = structure[ dataType ] || [] ).push( func );
				}
			}
		}
	};
}

// Base inspection function for prefilters and transports
function inspectPrefiltersOrTransports( structure, options, originalOptions, jqXHR ) {

	var inspected = {},
		seekingTransport = ( structure === transports );

	function inspect( dataType ) {
		var selected;
		inspected[ dataType ] = true;
		jQuery.each( structure[ dataType ] || [], function( _, prefilterOrFactory ) {
			var dataTypeOrTransport = prefilterOrFactory( options, originalOptions, jqXHR );
			if ( typeof dataTypeOrTransport === "string" &&
				!seekingTransport && !inspected[ dataTypeOrTransport ] ) {

				options.dataTypes.unshift( dataTypeOrTransport );
				inspect( dataTypeOrTransport );
				return false;
			} else if ( seekingTransport ) {
				return !( selected = dataTypeOrTransport );
			}
		} );
		return selected;
	}

	return inspect( options.dataTypes[ 0 ] ) || !inspected[ "*" ] && inspect( "*" );
}

// A special extend for ajax options
// that takes "flat" options (not to be deep extended)
// Fixes #9887
function ajaxExtend( target, src ) {
	var key, deep,
		flatOptions = jQuery.ajaxSettings.flatOptions || {};

	for ( key in src ) {
		if ( src[ key ] !== undefined ) {
			( flatOptions[ key ] ? target : ( deep || ( deep = {} ) ) )[ key ] = src[ key ];
		}
	}
	if ( deep ) {
		jQuery.extend( true, target, deep );
	}

	return target;
}

/* Handles responses to an ajax request:
 * - finds the right dataType (mediates between content-type and expected dataType)
 * - returns the corresponding response
 */
function ajaxHandleResponses( s, jqXHR, responses ) {

	var ct, type, finalDataType, firstDataType,
		contents = s.contents,
		dataTypes = s.dataTypes;

	// Remove auto dataType and get content-type in the process
	while ( dataTypes[ 0 ] === "*" ) {
		dataTypes.shift();
		if ( ct === undefined ) {
			ct = s.mimeType || jqXHR.getResponseHeader( "Content-Type" );
		}
	}

	// Check if we're dealing with a known content-type
	if ( ct ) {
		for ( type in contents ) {
			if ( contents[ type ] && contents[ type ].test( ct ) ) {
				dataTypes.unshift( type );
				break;
			}
		}
	}

	// Check to see if we have a response for the expected dataType
	if ( dataTypes[ 0 ] in responses ) {
		finalDataType = dataTypes[ 0 ];
	} else {

		// Try convertible dataTypes
		for ( type in responses ) {
			if ( !dataTypes[ 0 ] || s.converters[ type + " " + dataTypes[ 0 ] ] ) {
				finalDataType = type;
				break;
			}
			if ( !firstDataType ) {
				firstDataType = type;
			}
		}

		// Or just use first one
		finalDataType = finalDataType || firstDataType;
	}

	// If we found a dataType
	// We add the dataType to the list if needed
	// and return the corresponding response
	if ( finalDataType ) {
		if ( finalDataType !== dataTypes[ 0 ] ) {
			dataTypes.unshift( finalDataType );
		}
		return responses[ finalDataType ];
	}
}

/* Chain conversions given the request and the original response
 * Also sets the responseXXX fields on the jqXHR instance
 */
function ajaxConvert( s, response, jqXHR, isSuccess ) {
	var conv2, current, conv, tmp, prev,
		converters = {},

		// Work with a copy of dataTypes in case we need to modify it for conversion
		dataTypes = s.dataTypes.slice();

	// Create converters map with lowercased keys
	if ( dataTypes[ 1 ] ) {
		for ( conv in s.converters ) {
			converters[ conv.toLowerCase() ] = s.converters[ conv ];
		}
	}

	current = dataTypes.shift();

	// Convert to each sequential dataType
	while ( current ) {

		if ( s.responseFields[ current ] ) {
			jqXHR[ s.responseFields[ current ] ] = response;
		}

		// Apply the dataFilter if provided
		if ( !prev && isSuccess && s.dataFilter ) {
			response = s.dataFilter( response, s.dataType );
		}

		prev = current;
		current = dataTypes.shift();

		if ( current ) {

			// There's only work to do if current dataType is non-auto
			if ( current === "*" ) {

				current = prev;

			// Convert response if prev dataType is non-auto and differs from current
			} else if ( prev !== "*" && prev !== current ) {

				// Seek a direct converter
				conv = converters[ prev + " " + current ] || converters[ "* " + current ];

				// If none found, seek a pair
				if ( !conv ) {
					for ( conv2 in converters ) {

						// If conv2 outputs current
						tmp = conv2.split( " " );
						if ( tmp[ 1 ] === current ) {

							// If prev can be converted to accepted input
							conv = converters[ prev + " " + tmp[ 0 ] ] ||
								converters[ "* " + tmp[ 0 ] ];
							if ( conv ) {

								// Condense equivalence converters
								if ( conv === true ) {
									conv = converters[ conv2 ];

								// Otherwise, insert the intermediate dataType
								} else if ( converters[ conv2 ] !== true ) {
									current = tmp[ 0 ];
									dataTypes.unshift( tmp[ 1 ] );
								}
								break;
							}
						}
					}
				}

				// Apply converter (if not an equivalence)
				if ( conv !== true ) {

					// Unless errors are allowed to bubble, catch and return them
					if ( conv && s.throws ) {
						response = conv( response );
					} else {
						try {
							response = conv( response );
						} catch ( e ) {
							return {
								state: "parsererror",
								error: conv ? e : "No conversion from " + prev + " to " + current
							};
						}
					}
				}
			}
		}
	}

	return { state: "success", data: response };
}

jQuery.extend( {

	// Counter for holding the number of active queries
	active: 0,

	// Last-Modified header cache for next request
	lastModified: {},
	etag: {},

	ajaxSettings: {
		url: location.href,
		type: "GET",
		isLocal: rlocalProtocol.test( location.protocol ),
		global: true,
		processData: true,
		async: true,
		contentType: "application/x-www-form-urlencoded; charset=UTF-8",

		/*
		timeout: 0,
		data: null,
		dataType: null,
		username: null,
		password: null,
		cache: null,
		throws: false,
		traditional: false,
		headers: {},
		*/

		accepts: {
			"*": allTypes,
			text: "text/plain",
			html: "text/html",
			xml: "application/xml, text/xml",
			json: "application/json, text/javascript"
		},

		contents: {
			xml: /\bxml\b/,
			html: /\bhtml/,
			json: /\bjson\b/
		},

		responseFields: {
			xml: "responseXML",
			text: "responseText",
			json: "responseJSON"
		},

		// Data converters
		// Keys separate source (or catchall "*") and destination types with a single space
		converters: {

			// Convert anything to text
			"* text": String,

			// Text to html (true = no transformation)
			"text html": true,

			// Evaluate text as a json expression
			"text json": JSON.parse,

			// Parse text as xml
			"text xml": jQuery.parseXML
		},

		// For options that shouldn't be deep extended:
		// you can add your own custom options here if
		// and when you create one that shouldn't be
		// deep extended (see ajaxExtend)
		flatOptions: {
			url: true,
			context: true
		}
	},

	// Creates a full fledged settings object into target
	// with both ajaxSettings and settings fields.
	// If target is omitted, writes into ajaxSettings.
	ajaxSetup: function( target, settings ) {
		return settings ?

			// Building a settings object
			ajaxExtend( ajaxExtend( target, jQuery.ajaxSettings ), settings ) :

			// Extending ajaxSettings
			ajaxExtend( jQuery.ajaxSettings, target );
	},

	ajaxPrefilter: addToPrefiltersOrTransports( prefilters ),
	ajaxTransport: addToPrefiltersOrTransports( transports ),

	// Main method
	ajax: function( url, options ) {

		// If url is an object, simulate pre-1.5 signature
		if ( typeof url === "object" ) {
			options = url;
			url = undefined;
		}

		// Force options to be an object
		options = options || {};

		var transport,

			// URL without anti-cache param
			cacheURL,

			// Response headers
			responseHeadersString,
			responseHeaders,

			// timeout handle
			timeoutTimer,

			// Url cleanup var
			urlAnchor,

			// Request state (becomes false upon send and true upon completion)
			completed,

			// To know if global events are to be dispatched
			fireGlobals,

			// Loop variable
			i,

			// uncached part of the url
			uncached,

			// Create the final options object
			s = jQuery.ajaxSetup( {}, options ),

			// Callbacks context
			callbackContext = s.context || s,

			// Context for global events is callbackContext if it is a DOM node or jQuery collection
			globalEventContext = s.context &&
				( callbackContext.nodeType || callbackContext.jquery ) ?
					jQuery( callbackContext ) :
					jQuery.event,

			// Deferreds
			deferred = jQuery.Deferred(),
			completeDeferred = jQuery.Callbacks( "once memory" ),

			// Status-dependent callbacks
			statusCode = s.statusCode || {},

			// Headers (they are sent all at once)
			requestHeaders = {},
			requestHeadersNames = {},

			// Default abort message
			strAbort = "canceled",

			// Fake xhr
			jqXHR = {
				readyState: 0,

				// Builds headers hashtable if needed
				getResponseHeader: function( key ) {
					var match;
					if ( completed ) {
						if ( !responseHeaders ) {
							responseHeaders = {};
							while ( ( match = rheaders.exec( responseHeadersString ) ) ) {
								responseHeaders[ match[ 1 ].toLowerCase() + " " ] =
									( responseHeaders[ match[ 1 ].toLowerCase() + " " ] || [] )
										.concat( match[ 2 ] );
							}
						}
						match = responseHeaders[ key.toLowerCase() + " " ];
					}
					return match == null ? null : match.join( ", " );
				},

				// Raw string
				getAllResponseHeaders: function() {
					return completed ? responseHeadersString : null;
				},

				// Caches the header
				setRequestHeader: function( name, value ) {
					if ( completed == null ) {
						name = requestHeadersNames[ name.toLowerCase() ] =
							requestHeadersNames[ name.toLowerCase() ] || name;
						requestHeaders[ name ] = value;
					}
					return this;
				},

				// Overrides response content-type header
				overrideMimeType: function( type ) {
					if ( completed == null ) {
						s.mimeType = type;
					}
					return this;
				},

				// Status-dependent callbacks
				statusCode: function( map ) {
					var code;
					if ( map ) {
						if ( completed ) {

							// Execute the appropriate callbacks
							jqXHR.always( map[ jqXHR.status ] );
						} else {

							// Lazy-add the new callbacks in a way that preserves old ones
							for ( code in map ) {
								statusCode[ code ] = [ statusCode[ code ], map[ code ] ];
							}
						}
					}
					return this;
				},

				// Cancel the request
				abort: function( statusText ) {
					var finalText = statusText || strAbort;
					if ( transport ) {
						transport.abort( finalText );
					}
					done( 0, finalText );
					return this;
				}
			};

		// Attach deferreds
		deferred.promise( jqXHR );

		// Add protocol if not provided (prefilters might expect it)
		// Handle falsy url in the settings object (#10093: consistency with old signature)
		// We also use the url parameter if available
		s.url = ( ( url || s.url || location.href ) + "" )
			.replace( rprotocol, location.protocol + "//" );

		// Alias method option to type as per ticket #12004
		s.type = options.method || options.type || s.method || s.type;

		// Extract dataTypes list
		s.dataTypes = ( s.dataType || "*" ).toLowerCase().match( rnothtmlwhite ) || [ "" ];

		// A cross-domain request is in order when the origin doesn't match the current origin.
		if ( s.crossDomain == null ) {
			urlAnchor = document.createElement( "a" );

			// Support: IE <=8 - 11, Edge 12 - 15
			// IE throws exception on accessing the href property if url is malformed,
			// e.g. http://example.com:80x/
			try {
				urlAnchor.href = s.url;

				// Support: IE <=8 - 11 only
				// Anchor's host property isn't correctly set when s.url is relative
				urlAnchor.href = urlAnchor.href;
				s.crossDomain = originAnchor.protocol + "//" + originAnchor.host !==
					urlAnchor.protocol + "//" + urlAnchor.host;
			} catch ( e ) {

				// If there is an error parsing the URL, assume it is crossDomain,
				// it can be rejected by the transport if it is invalid
				s.crossDomain = true;
			}
		}

		// Convert data if not already a string
		if ( s.data && s.processData && typeof s.data !== "string" ) {
			s.data = jQuery.param( s.data, s.traditional );
		}

		// Apply prefilters
		inspectPrefiltersOrTransports( prefilters, s, options, jqXHR );

		// If request was aborted inside a prefilter, stop there
		if ( completed ) {
			return jqXHR;
		}

		// We can fire global events as of now if asked to
		// Don't fire events if jQuery.event is undefined in an AMD-usage scenario (#15118)
		fireGlobals = jQuery.event && s.global;

		// Watch for a new set of requests
		if ( fireGlobals && jQuery.active++ === 0 ) {
			jQuery.event.trigger( "ajaxStart" );
		}

		// Uppercase the type
		s.type = s.type.toUpperCase();

		// Determine if request has content
		s.hasContent = !rnoContent.test( s.type );

		// Save the URL in case we're toying with the If-Modified-Since
		// and/or If-None-Match header later on
		// Remove hash to simplify url manipulation
		cacheURL = s.url.replace( rhash, "" );

		// More options handling for requests with no content
		if ( !s.hasContent ) {

			// Remember the hash so we can put it back
			uncached = s.url.slice( cacheURL.length );

			// If data is available and should be processed, append data to url
			if ( s.data && ( s.processData || typeof s.data === "string" ) ) {
				cacheURL += ( rquery.test( cacheURL ) ? "&" : "?" ) + s.data;

				// #9682: remove data so that it's not used in an eventual retry
				delete s.data;
			}

			// Add or update anti-cache param if needed
			if ( s.cache === false ) {
				cacheURL = cacheURL.replace( rantiCache, "$1" );
				uncached = ( rquery.test( cacheURL ) ? "&" : "?" ) + "_=" + ( nonce.guid++ ) +
					uncached;
			}

			// Put hash and anti-cache on the URL that will be requested (gh-1732)
			s.url = cacheURL + uncached;

		// Change '%20' to '+' if this is encoded form body content (gh-2658)
		} else if ( s.data && s.processData &&
			( s.contentType || "" ).indexOf( "application/x-www-form-urlencoded" ) === 0 ) {
			s.data = s.data.replace( r20, "+" );
		}

		// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
		if ( s.ifModified ) {
			if ( jQuery.lastModified[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-Modified-Since", jQuery.lastModified[ cacheURL ] );
			}
			if ( jQuery.etag[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-None-Match", jQuery.etag[ cacheURL ] );
			}
		}

		// Set the correct header, if data is being sent
		if ( s.data && s.hasContent && s.contentType !== false || options.contentType ) {
			jqXHR.setRequestHeader( "Content-Type", s.contentType );
		}

		// Set the Accepts header for the server, depending on the dataType
		jqXHR.setRequestHeader(
			"Accept",
			s.dataTypes[ 0 ] && s.accepts[ s.dataTypes[ 0 ] ] ?
				s.accepts[ s.dataTypes[ 0 ] ] +
					( s.dataTypes[ 0 ] !== "*" ? ", " + allTypes + "; q=0.01" : "" ) :
				s.accepts[ "*" ]
		);

		// Check for headers option
		for ( i in s.headers ) {
			jqXHR.setRequestHeader( i, s.headers[ i ] );
		}

		// Allow custom headers/mimetypes and early abort
		if ( s.beforeSend &&
			( s.beforeSend.call( callbackContext, jqXHR, s ) === false || completed ) ) {

			// Abort if not done already and return
			return jqXHR.abort();
		}

		// Aborting is no longer a cancellation
		strAbort = "abort";

		// Install callbacks on deferreds
		completeDeferred.add( s.complete );
		jqXHR.done( s.success );
		jqXHR.fail( s.error );

		// Get transport
		transport = inspectPrefiltersOrTransports( transports, s, options, jqXHR );

		// If no transport, we auto-abort
		if ( !transport ) {
			done( -1, "No Transport" );
		} else {
			jqXHR.readyState = 1;

			// Send global event
			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxSend", [ jqXHR, s ] );
			}

			// If request was aborted inside ajaxSend, stop there
			if ( completed ) {
				return jqXHR;
			}

			// Timeout
			if ( s.async && s.timeout > 0 ) {
				timeoutTimer = window.setTimeout( function() {
					jqXHR.abort( "timeout" );
				}, s.timeout );
			}

			try {
				completed = false;
				transport.send( requestHeaders, done );
			} catch ( e ) {

				// Rethrow post-completion exceptions
				if ( completed ) {
					throw e;
				}

				// Propagate others as results
				done( -1, e );
			}
		}

		// Callback for when everything is done
		function done( status, nativeStatusText, responses, headers ) {
			var isSuccess, success, error, response, modified,
				statusText = nativeStatusText;

			// Ignore repeat invocations
			if ( completed ) {
				return;
			}

			completed = true;

			// Clear timeout if it exists
			if ( timeoutTimer ) {
				window.clearTimeout( timeoutTimer );
			}

			// Dereference transport for early garbage collection
			// (no matter how long the jqXHR object will be used)
			transport = undefined;

			// Cache response headers
			responseHeadersString = headers || "";

			// Set readyState
			jqXHR.readyState = status > 0 ? 4 : 0;

			// Determine if successful
			isSuccess = status >= 200 && status < 300 || status === 304;

			// Get response data
			if ( responses ) {
				response = ajaxHandleResponses( s, jqXHR, responses );
			}

			// Use a noop converter for missing script
			if ( !isSuccess && jQuery.inArray( "script", s.dataTypes ) > -1 ) {
				s.converters[ "text script" ] = function() {};
			}

			// Convert no matter what (that way responseXXX fields are always set)
			response = ajaxConvert( s, response, jqXHR, isSuccess );

			// If successful, handle type chaining
			if ( isSuccess ) {

				// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
				if ( s.ifModified ) {
					modified = jqXHR.getResponseHeader( "Last-Modified" );
					if ( modified ) {
						jQuery.lastModified[ cacheURL ] = modified;
					}
					modified = jqXHR.getResponseHeader( "etag" );
					if ( modified ) {
						jQuery.etag[ cacheURL ] = modified;
					}
				}

				// if no content
				if ( status === 204 || s.type === "HEAD" ) {
					statusText = "nocontent";

				// if not modified
				} else if ( status === 304 ) {
					statusText = "notmodified";

				// If we have data, let's convert it
				} else {
					statusText = response.state;
					success = response.data;
					error = response.error;
					isSuccess = !error;
				}
			} else {

				// Extract error from statusText and normalize for non-aborts
				error = statusText;
				if ( status || !statusText ) {
					statusText = "error";
					if ( status < 0 ) {
						status = 0;
					}
				}
			}

			// Set data for the fake xhr object
			jqXHR.status = status;
			jqXHR.statusText = ( nativeStatusText || statusText ) + "";

			// Success/Error
			if ( isSuccess ) {
				deferred.resolveWith( callbackContext, [ success, statusText, jqXHR ] );
			} else {
				deferred.rejectWith( callbackContext, [ jqXHR, statusText, error ] );
			}

			// Status-dependent callbacks
			jqXHR.statusCode( statusCode );
			statusCode = undefined;

			if ( fireGlobals ) {
				globalEventContext.trigger( isSuccess ? "ajaxSuccess" : "ajaxError",
					[ jqXHR, s, isSuccess ? success : error ] );
			}

			// Complete
			completeDeferred.fireWith( callbackContext, [ jqXHR, statusText ] );

			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxComplete", [ jqXHR, s ] );

				// Handle the global AJAX counter
				if ( !( --jQuery.active ) ) {
					jQuery.event.trigger( "ajaxStop" );
				}
			}
		}

		return jqXHR;
	},

	getJSON: function( url, data, callback ) {
		return jQuery.get( url, data, callback, "json" );
	},

	getScript: function( url, callback ) {
		return jQuery.get( url, undefined, callback, "script" );
	}
} );

jQuery.each( [ "get", "post" ], function( _i, method ) {
	jQuery[ method ] = function( url, data, callback, type ) {

		// Shift arguments if data argument was omitted
		if ( isFunction( data ) ) {
			type = type || callback;
			callback = data;
			data = undefined;
		}

		// The url can be an options object (which then must have .url)
		return jQuery.ajax( jQuery.extend( {
			url: url,
			type: method,
			dataType: type,
			data: data,
			success: callback
		}, jQuery.isPlainObject( url ) && url ) );
	};
} );

jQuery.ajaxPrefilter( function( s ) {
	var i;
	for ( i in s.headers ) {
		if ( i.toLowerCase() === "content-type" ) {
			s.contentType = s.headers[ i ] || "";
		}
	}
} );


jQuery._evalUrl = function( url, options, doc ) {
	return jQuery.ajax( {
		url: url,

		// Make this explicit, since user can override this through ajaxSetup (#11264)
		type: "GET",
		dataType: "script",
		cache: true,
		async: false,
		global: false,

		// Only evaluate the response if it is successful (gh-4126)
		// dataFilter is not invoked for failure responses, so using it instead
		// of the default converter is kludgy but it works.
		converters: {
			"text script": function() {}
		},
		dataFilter: function( response ) {
			jQuery.globalEval( response, options, doc );
		}
	} );
};


jQuery.fn.extend( {
	wrapAll: function( html ) {
		var wrap;

		if ( this[ 0 ] ) {
			if ( isFunction( html ) ) {
				html = html.call( this[ 0 ] );
			}

			// The elements to wrap the target around
			wrap = jQuery( html, this[ 0 ].ownerDocument ).eq( 0 ).clone( true );

			if ( this[ 0 ].parentNode ) {
				wrap.insertBefore( this[ 0 ] );
			}

			wrap.map( function() {
				var elem = this;

				while ( elem.firstElementChild ) {
					elem = elem.firstElementChild;
				}

				return elem;
			} ).append( this );
		}

		return this;
	},

	wrapInner: function( html ) {
		if ( isFunction( html ) ) {
			return this.each( function( i ) {
				jQuery( this ).wrapInner( html.call( this, i ) );
			} );
		}

		return this.each( function() {
			var self = jQuery( this ),
				contents = self.contents();

			if ( contents.length ) {
				contents.wrapAll( html );

			} else {
				self.append( html );
			}
		} );
	},

	wrap: function( html ) {
		var htmlIsFunction = isFunction( html );

		return this.each( function( i ) {
			jQuery( this ).wrapAll( htmlIsFunction ? html.call( this, i ) : html );
		} );
	},

	unwrap: function( selector ) {
		this.parent( selector ).not( "body" ).each( function() {
			jQuery( this ).replaceWith( this.childNodes );
		} );
		return this;
	}
} );


jQuery.expr.pseudos.hidden = function( elem ) {
	return !jQuery.expr.pseudos.visible( elem );
};
jQuery.expr.pseudos.visible = function( elem ) {
	return !!( elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length );
};




jQuery.ajaxSettings.xhr = function() {
	try {
		return new window.XMLHttpRequest();
	} catch ( e ) {}
};

var xhrSuccessStatus = {

		// File protocol always yields status code 0, assume 200
		0: 200,

		// Support: IE <=9 only
		// #1450: sometimes IE returns 1223 when it should be 204
		1223: 204
	},
	xhrSupported = jQuery.ajaxSettings.xhr();

support.cors = !!xhrSupported && ( "withCredentials" in xhrSupported );
support.ajax = xhrSupported = !!xhrSupported;

jQuery.ajaxTransport( function( options ) {
	var callback, errorCallback;

	// Cross domain only allowed if supported through XMLHttpRequest
	if ( support.cors || xhrSupported && !options.crossDomain ) {
		return {
			send: function( headers, complete ) {
				var i,
					xhr = options.xhr();

				xhr.open(
					options.type,
					options.url,
					options.async,
					options.username,
					options.password
				);

				// Apply custom fields if provided
				if ( options.xhrFields ) {
					for ( i in options.xhrFields ) {
						xhr[ i ] = options.xhrFields[ i ];
					}
				}

				// Override mime type if needed
				if ( options.mimeType && xhr.overrideMimeType ) {
					xhr.overrideMimeType( options.mimeType );
				}

				// X-Requested-With header
				// For cross-domain requests, seeing as conditions for a preflight are
				// akin to a jigsaw puzzle, we simply never set it to be sure.
				// (it can always be set on a per-request basis or even using ajaxSetup)
				// For same-domain requests, won't change header if already provided.
				if ( !options.crossDomain && !headers[ "X-Requested-With" ] ) {
					headers[ "X-Requested-With" ] = "XMLHttpRequest";
				}

				// Set headers
				for ( i in headers ) {
					xhr.setRequestHeader( i, headers[ i ] );
				}

				// Callback
				callback = function( type ) {
					return function() {
						if ( callback ) {
							callback = errorCallback = xhr.onload =
								xhr.onerror = xhr.onabort = xhr.ontimeout =
									xhr.onreadystatechange = null;

							if ( type === "abort" ) {
								xhr.abort();
							} else if ( type === "error" ) {

								// Support: IE <=9 only
								// On a manual native abort, IE9 throws
								// errors on any property access that is not readyState
								if ( typeof xhr.status !== "number" ) {
									complete( 0, "error" );
								} else {
									complete(

										// File: protocol always yields status 0; see #8605, #14207
										xhr.status,
										xhr.statusText
									);
								}
							} else {
								complete(
									xhrSuccessStatus[ xhr.status ] || xhr.status,
									xhr.statusText,

									// Support: IE <=9 only
									// IE9 has no XHR2 but throws on binary (trac-11426)
									// For XHR2 non-text, let the caller handle it (gh-2498)
									( xhr.responseType || "text" ) !== "text"  ||
									typeof xhr.responseText !== "string" ?
										{ binary: xhr.response } :
										{ text: xhr.responseText },
									xhr.getAllResponseHeaders()
								);
							}
						}
					};
				};

				// Listen to events
				xhr.onload = callback();
				errorCallback = xhr.onerror = xhr.ontimeout = callback( "error" );

				// Support: IE 9 only
				// Use onreadystatechange to replace onabort
				// to handle uncaught aborts
				if ( xhr.onabort !== undefined ) {
					xhr.onabort = errorCallback;
				} else {
					xhr.onreadystatechange = function() {

						// Check readyState before timeout as it changes
						if ( xhr.readyState === 4 ) {

							// Allow onerror to be called first,
							// but that will not handle a native abort
							// Also, save errorCallback to a variable
							// as xhr.onerror cannot be accessed
							window.setTimeout( function() {
								if ( callback ) {
									errorCallback();
								}
							} );
						}
					};
				}

				// Create the abort callback
				callback = callback( "abort" );

				try {

					// Do send the request (this may raise an exception)
					xhr.send( options.hasContent && options.data || null );
				} catch ( e ) {

					// #14683: Only rethrow if this hasn't been notified as an error yet
					if ( callback ) {
						throw e;
					}
				}
			},

			abort: function() {
				if ( callback ) {
					callback();
				}
			}
		};
	}
} );




// Prevent auto-execution of scripts when no explicit dataType was provided (See gh-2432)
jQuery.ajaxPrefilter( function( s ) {
	if ( s.crossDomain ) {
		s.contents.script = false;
	}
} );

// Install script dataType
jQuery.ajaxSetup( {
	accepts: {
		script: "text/javascript, application/javascript, " +
			"application/ecmascript, application/x-ecmascript"
	},
	contents: {
		script: /\b(?:java|ecma)script\b/
	},
	converters: {
		"text script": function( text ) {
			jQuery.globalEval( text );
			return text;
		}
	}
} );

// Handle cache's special case and crossDomain
jQuery.ajaxPrefilter( "script", function( s ) {
	if ( s.cache === undefined ) {
		s.cache = false;
	}
	if ( s.crossDomain ) {
		s.type = "GET";
	}
} );

// Bind script tag hack transport
jQuery.ajaxTransport( "script", function( s ) {

	// This transport only deals with cross domain or forced-by-attrs requests
	if ( s.crossDomain || s.scriptAttrs ) {
		var script, callback;
		return {
			send: function( _, complete ) {
				script = jQuery( "<script>" )
					.attr( s.scriptAttrs || {} )
					.prop( { charset: s.scriptCharset, src: s.url } )
					.on( "load error", callback = function( evt ) {
						script.remove();
						callback = null;
						if ( evt ) {
							complete( evt.type === "error" ? 404 : 200, evt.type );
						}
					} );

				// Use native DOM manipulation to avoid our domManip AJAX trickery
				document.head.appendChild( script[ 0 ] );
			},
			abort: function() {
				if ( callback ) {
					callback();
				}
			}
		};
	}
} );




var oldCallbacks = [],
	rjsonp = /(=)\?(?=&|$)|\?\?/;

// Default jsonp settings
jQuery.ajaxSetup( {
	jsonp: "callback",
	jsonpCallback: function() {
		var callback = oldCallbacks.pop() || ( jQuery.expando + "_" + ( nonce.guid++ ) );
		this[ callback ] = true;
		return callback;
	}
} );

// Detect, normalize options and install callbacks for jsonp requests
jQuery.ajaxPrefilter( "json jsonp", function( s, originalSettings, jqXHR ) {

	var callbackName, overwritten, responseContainer,
		jsonProp = s.jsonp !== false && ( rjsonp.test( s.url ) ?
			"url" :
			typeof s.data === "string" &&
				( s.contentType || "" )
					.indexOf( "application/x-www-form-urlencoded" ) === 0 &&
				rjsonp.test( s.data ) && "data"
		);

	// Handle iff the expected data type is "jsonp" or we have a parameter to set
	if ( jsonProp || s.dataTypes[ 0 ] === "jsonp" ) {

		// Get callback name, remembering preexisting value associated with it
		callbackName = s.jsonpCallback = isFunction( s.jsonpCallback ) ?
			s.jsonpCallback() :
			s.jsonpCallback;

		// Insert callback into url or form data
		if ( jsonProp ) {
			s[ jsonProp ] = s[ jsonProp ].replace( rjsonp, "$1" + callbackName );
		} else if ( s.jsonp !== false ) {
			s.url += ( rquery.test( s.url ) ? "&" : "?" ) + s.jsonp + "=" + callbackName;
		}

		// Use data converter to retrieve json after script execution
		s.converters[ "script json" ] = function() {
			if ( !responseContainer ) {
				jQuery.error( callbackName + " was not called" );
			}
			return responseContainer[ 0 ];
		};

		// Force json dataType
		s.dataTypes[ 0 ] = "json";

		// Install callback
		overwritten = window[ callbackName ];
		window[ callbackName ] = function() {
			responseContainer = arguments;
		};

		// Clean-up function (fires after converters)
		jqXHR.always( function() {

			// If previous value didn't exist - remove it
			if ( overwritten === undefined ) {
				jQuery( window ).removeProp( callbackName );

			// Otherwise restore preexisting value
			} else {
				window[ callbackName ] = overwritten;
			}

			// Save back as free
			if ( s[ callbackName ] ) {

				// Make sure that re-using the options doesn't screw things around
				s.jsonpCallback = originalSettings.jsonpCallback;

				// Save the callback name for future use
				oldCallbacks.push( callbackName );
			}

			// Call if it was a function and we have a response
			if ( responseContainer && isFunction( overwritten ) ) {
				overwritten( responseContainer[ 0 ] );
			}

			responseContainer = overwritten = undefined;
		} );

		// Delegate to script
		return "script";
	}
} );




// Support: Safari 8 only
// In Safari 8 documents created via document.implementation.createHTMLDocument
// collapse sibling forms: the second one becomes a child of the first one.
// Because of that, this security measure has to be disabled in Safari 8.
// https://bugs.webkit.org/show_bug.cgi?id=137337
support.createHTMLDocument = ( function() {
	var body = document.implementation.createHTMLDocument( "" ).body;
	body.innerHTML = "<form></form><form></form>";
	return body.childNodes.length === 2;
} )();


// Argument "data" should be string of html
// context (optional): If specified, the fragment will be created in this context,
// defaults to document
// keepScripts (optional): If true, will include scripts passed in the html string
jQuery.parseHTML = function( data, context, keepScripts ) {
	if ( typeof data !== "string" ) {
		return [];
	}
	if ( typeof context === "boolean" ) {
		keepScripts = context;
		context = false;
	}

	var base, parsed, scripts;

	if ( !context ) {

		// Stop scripts or inline event handlers from being executed immediately
		// by using document.implementation
		if ( support.createHTMLDocument ) {
			context = document.implementation.createHTMLDocument( "" );

			// Set the base href for the created document
			// so any parsed elements with URLs
			// are based on the document's URL (gh-2965)
			base = context.createElement( "base" );
			base.href = document.location.href;
			context.head.appendChild( base );
		} else {
			context = document;
		}
	}

	parsed = rsingleTag.exec( data );
	scripts = !keepScripts && [];

	// Single tag
	if ( parsed ) {
		return [ context.createElement( parsed[ 1 ] ) ];
	}

	parsed = buildFragment( [ data ], context, scripts );

	if ( scripts && scripts.length ) {
		jQuery( scripts ).remove();
	}

	return jQuery.merge( [], parsed.childNodes );
};


/**
 * Load a url into a page
 */
jQuery.fn.load = function( url, params, callback ) {
	var selector, type, response,
		self = this,
		off = url.indexOf( " " );

	if ( off > -1 ) {
		selector = stripAndCollapse( url.slice( off ) );
		url = url.slice( 0, off );
	}

	// If it's a function
	if ( isFunction( params ) ) {

		// We assume that it's the callback
		callback = params;
		params = undefined;

	// Otherwise, build a param string
	} else if ( params && typeof params === "object" ) {
		type = "POST";
	}

	// If we have elements to modify, make the request
	if ( self.length > 0 ) {
		jQuery.ajax( {
			url: url,

			// If "type" variable is undefined, then "GET" method will be used.
			// Make value of this field explicit since
			// user can override it through ajaxSetup method
			type: type || "GET",
			dataType: "html",
			data: params
		} ).done( function( responseText ) {

			// Save response for use in complete callback
			response = arguments;

			self.html( selector ?

				// If a selector was specified, locate the right elements in a dummy div
				// Exclude scripts to avoid IE 'Permission Denied' errors
				jQuery( "<div>" ).append( jQuery.parseHTML( responseText ) ).find( selector ) :

				// Otherwise use the full result
				responseText );

		// If the request succeeds, this function gets "data", "status", "jqXHR"
		// but they are ignored because response was set above.
		// If it fails, this function gets "jqXHR", "status", "error"
		} ).always( callback && function( jqXHR, status ) {
			self.each( function() {
				callback.apply( this, response || [ jqXHR.responseText, status, jqXHR ] );
			} );
		} );
	}

	return this;
};




jQuery.expr.pseudos.animated = function( elem ) {
	return jQuery.grep( jQuery.timers, function( fn ) {
		return elem === fn.elem;
	} ).length;
};




jQuery.offset = {
	setOffset: function( elem, options, i ) {
		var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition,
			position = jQuery.css( elem, "position" ),
			curElem = jQuery( elem ),
			props = {};

		// Set position first, in-case top/left are set even on static elem
		if ( position === "static" ) {
			elem.style.position = "relative";
		}

		curOffset = curElem.offset();
		curCSSTop = jQuery.css( elem, "top" );
		curCSSLeft = jQuery.css( elem, "left" );
		calculatePosition = ( position === "absolute" || position === "fixed" ) &&
			( curCSSTop + curCSSLeft ).indexOf( "auto" ) > -1;

		// Need to be able to calculate position if either
		// top or left is auto and position is either absolute or fixed
		if ( calculatePosition ) {
			curPosition = curElem.position();
			curTop = curPosition.top;
			curLeft = curPosition.left;

		} else {
			curTop = parseFloat( curCSSTop ) || 0;
			curLeft = parseFloat( curCSSLeft ) || 0;
		}

		if ( isFunction( options ) ) {

			// Use jQuery.extend here to allow modification of coordinates argument (gh-1848)
			options = options.call( elem, i, jQuery.extend( {}, curOffset ) );
		}

		if ( options.top != null ) {
			props.top = ( options.top - curOffset.top ) + curTop;
		}
		if ( options.left != null ) {
			props.left = ( options.left - curOffset.left ) + curLeft;
		}

		if ( "using" in options ) {
			options.using.call( elem, props );

		} else {
			if ( typeof props.top === "number" ) {
				props.top += "px";
			}
			if ( typeof props.left === "number" ) {
				props.left += "px";
			}
			curElem.css( props );
		}
	}
};

jQuery.fn.extend( {

	// offset() relates an element's border box to the document origin
	offset: function( options ) {

		// Preserve chaining for setter
		if ( arguments.length ) {
			return options === undefined ?
				this :
				this.each( function( i ) {
					jQuery.offset.setOffset( this, options, i );
				} );
		}

		var rect, win,
			elem = this[ 0 ];

		if ( !elem ) {
			return;
		}

		// Return zeros for disconnected and hidden (display: none) elements (gh-2310)
		// Support: IE <=11 only
		// Running getBoundingClientRect on a
		// disconnected node in IE throws an error
		if ( !elem.getClientRects().length ) {
			return { top: 0, left: 0 };
		}

		// Get document-relative position by adding viewport scroll to viewport-relative gBCR
		rect = elem.getBoundingClientRect();
		win = elem.ownerDocument.defaultView;
		return {
			top: rect.top + win.pageYOffset,
			left: rect.left + win.pageXOffset
		};
	},

	// position() relates an element's margin box to its offset parent's padding box
	// This corresponds to the behavior of CSS absolute positioning
	position: function() {
		if ( !this[ 0 ] ) {
			return;
		}

		var offsetParent, offset, doc,
			elem = this[ 0 ],
			parentOffset = { top: 0, left: 0 };

		// position:fixed elements are offset from the viewport, which itself always has zero offset
		if ( jQuery.css( elem, "position" ) === "fixed" ) {

			// Assume position:fixed implies availability of getBoundingClientRect
			offset = elem.getBoundingClientRect();

		} else {
			offset = this.offset();

			// Account for the *real* offset parent, which can be the document or its root element
			// when a statically positioned element is identified
			doc = elem.ownerDocument;
			offsetParent = elem.offsetParent || doc.documentElement;
			while ( offsetParent &&
				( offsetParent === doc.body || offsetParent === doc.documentElement ) &&
				jQuery.css( offsetParent, "position" ) === "static" ) {

				offsetParent = offsetParent.parentNode;
			}
			if ( offsetParent && offsetParent !== elem && offsetParent.nodeType === 1 ) {

				// Incorporate borders into its offset, since they are outside its content origin
				parentOffset = jQuery( offsetParent ).offset();
				parentOffset.top += jQuery.css( offsetParent, "borderTopWidth", true );
				parentOffset.left += jQuery.css( offsetParent, "borderLeftWidth", true );
			}
		}

		// Subtract parent offsets and element margins
		return {
			top: offset.top - parentOffset.top - jQuery.css( elem, "marginTop", true ),
			left: offset.left - parentOffset.left - jQuery.css( elem, "marginLeft", true )
		};
	},

	// This method will return documentElement in the following cases:
	// 1) For the element inside the iframe without offsetParent, this method will return
	//    documentElement of the parent window
	// 2) For the hidden or detached element
	// 3) For body or html element, i.e. in case of the html node - it will return itself
	//
	// but those exceptions were never presented as a real life use-cases
	// and might be considered as more preferable results.
	//
	// This logic, however, is not guaranteed and can change at any point in the future
	offsetParent: function() {
		return this.map( function() {
			var offsetParent = this.offsetParent;

			while ( offsetParent && jQuery.css( offsetParent, "position" ) === "static" ) {
				offsetParent = offsetParent.offsetParent;
			}

			return offsetParent || documentElement;
		} );
	}
} );

// Create scrollLeft and scrollTop methods
jQuery.each( { scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function( method, prop ) {
	var top = "pageYOffset" === prop;

	jQuery.fn[ method ] = function( val ) {
		return access( this, function( elem, method, val ) {

			// Coalesce documents and windows
			var win;
			if ( isWindow( elem ) ) {
				win = elem;
			} else if ( elem.nodeType === 9 ) {
				win = elem.defaultView;
			}

			if ( val === undefined ) {
				return win ? win[ prop ] : elem[ method ];
			}

			if ( win ) {
				win.scrollTo(
					!top ? val : win.pageXOffset,
					top ? val : win.pageYOffset
				);

			} else {
				elem[ method ] = val;
			}
		}, method, val, arguments.length );
	};
} );

// Support: Safari <=7 - 9.1, Chrome <=37 - 49
// Add the top/left cssHooks using jQuery.fn.position
// Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
// Blink bug: https://bugs.chromium.org/p/chromium/issues/detail?id=589347
// getComputedStyle returns percent when specified for top/left/bottom/right;
// rather than make the css module depend on the offset module, just check for it here
jQuery.each( [ "top", "left" ], function( _i, prop ) {
	jQuery.cssHooks[ prop ] = addGetHookIf( support.pixelPosition,
		function( elem, computed ) {
			if ( computed ) {
				computed = curCSS( elem, prop );

				// If curCSS returns percentage, fallback to offset
				return rnumnonpx.test( computed ) ?
					jQuery( elem ).position()[ prop ] + "px" :
					computed;
			}
		}
	);
} );


// Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
jQuery.each( { Height: "height", Width: "width" }, function( name, type ) {
	jQuery.each( { padding: "inner" + name, content: type, "": "outer" + name },
		function( defaultExtra, funcName ) {

		// Margin is only for outerHeight, outerWidth
		jQuery.fn[ funcName ] = function( margin, value ) {
			var chainable = arguments.length && ( defaultExtra || typeof margin !== "boolean" ),
				extra = defaultExtra || ( margin === true || value === true ? "margin" : "border" );

			return access( this, function( elem, type, value ) {
				var doc;

				if ( isWindow( elem ) ) {

					// $( window ).outerWidth/Height return w/h including scrollbars (gh-1729)
					return funcName.indexOf( "outer" ) === 0 ?
						elem[ "inner" + name ] :
						elem.document.documentElement[ "client" + name ];
				}

				// Get document width or height
				if ( elem.nodeType === 9 ) {
					doc = elem.documentElement;

					// Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height],
					// whichever is greatest
					return Math.max(
						elem.body[ "scroll" + name ], doc[ "scroll" + name ],
						elem.body[ "offset" + name ], doc[ "offset" + name ],
						doc[ "client" + name ]
					);
				}

				return value === undefined ?

					// Get width or height on the element, requesting but not forcing parseFloat
					jQuery.css( elem, type, extra ) :

					// Set width or height on the element
					jQuery.style( elem, type, value, extra );
			}, type, chainable ? margin : undefined, chainable );
		};
	} );
} );


jQuery.each( [
	"ajaxStart",
	"ajaxStop",
	"ajaxComplete",
	"ajaxError",
	"ajaxSuccess",
	"ajaxSend"
], function( _i, type ) {
	jQuery.fn[ type ] = function( fn ) {
		return this.on( type, fn );
	};
} );




jQuery.fn.extend( {

	bind: function( types, data, fn ) {
		return this.on( types, null, data, fn );
	},
	unbind: function( types, fn ) {
		return this.off( types, null, fn );
	},

	delegate: function( selector, types, data, fn ) {
		return this.on( types, selector, data, fn );
	},
	undelegate: function( selector, types, fn ) {

		// ( namespace ) or ( selector, types [, fn] )
		return arguments.length === 1 ?
			this.off( selector, "**" ) :
			this.off( types, selector || "**", fn );
	},

	hover: function( fnOver, fnOut ) {
		return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
	}
} );

jQuery.each( ( "blur focus focusin focusout resize scroll click dblclick " +
	"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
	"change select submit keydown keypress keyup contextmenu" ).split( " " ),
	function( _i, name ) {

		// Handle event binding
		jQuery.fn[ name ] = function( data, fn ) {
			return arguments.length > 0 ?
				this.on( name, null, data, fn ) :
				this.trigger( name );
		};
	} );




// Support: Android <=4.0 only
// Make sure we trim BOM and NBSP
var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;

// Bind a function to a context, optionally partially applying any
// arguments.
// jQuery.proxy is deprecated to promote standards (specifically Function#bind)
// However, it is not slated for removal any time soon
jQuery.proxy = function( fn, context ) {
	var tmp, args, proxy;

	if ( typeof context === "string" ) {
		tmp = fn[ context ];
		context = fn;
		fn = tmp;
	}

	// Quick check to determine if target is callable, in the spec
	// this throws a TypeError, but we will just return undefined.
	if ( !isFunction( fn ) ) {
		return undefined;
	}

	// Simulated bind
	args = slice.call( arguments, 2 );
	proxy = function() {
		return fn.apply( context || this, args.concat( slice.call( arguments ) ) );
	};

	// Set the guid of unique handler to the same of original handler, so it can be removed
	proxy.guid = fn.guid = fn.guid || jQuery.guid++;

	return proxy;
};

jQuery.holdReady = function( hold ) {
	if ( hold ) {
		jQuery.readyWait++;
	} else {
		jQuery.ready( true );
	}
};
jQuery.isArray = Array.isArray;
jQuery.parseJSON = JSON.parse;
jQuery.nodeName = nodeName;
jQuery.isFunction = isFunction;
jQuery.isWindow = isWindow;
jQuery.camelCase = camelCase;
jQuery.type = toType;

jQuery.now = Date.now;

jQuery.isNumeric = function( obj ) {

	// As of jQuery 3.0, isNumeric is limited to
	// strings and numbers (primitives or objects)
	// that can be coerced to finite numbers (gh-2662)
	var type = jQuery.type( obj );
	return ( type === "number" || type === "string" ) &&

		// parseFloat NaNs numeric-cast false positives ("")
		// ...but misinterprets leading-number strings, particularly hex literals ("0x...")
		// subtraction forces infinities to NaN
		!isNaN( obj - parseFloat( obj ) );
};

jQuery.trim = function( text ) {
	return text == null ?
		"" :
		( text + "" ).replace( rtrim, "" );
};



// Register as a named AMD module, since jQuery can be concatenated with other
// files that may use define, but not via a proper concatenation script that
// understands anonymous AMD modules. A named AMD is safest and most robust
// way to register. Lowercase jquery is used because AMD module names are
// derived from file names, and jQuery is normally delivered in a lowercase
// file name. Do this after creating the global so that if an AMD module wants
// to call noConflict to hide this version of jQuery, it will work.

// Note that for maximum portability, libraries that are not jQuery should
// declare themselves as anonymous modules, and avoid setting a global if an
// AMD loader is present. jQuery is a special case. For more information, see
// https://github.com/jrburke/requirejs/wiki/Updating-existing-libraries#wiki-anon

if ( typeof define === "function" && define.amd ) {
	define( "jquery", [], function() {
		return jQuery;
	} );
}




var

	// Map over jQuery in case of overwrite
	_jQuery = window.jQuery,

	// Map over the $ in case of overwrite
	_$ = window.$;

jQuery.noConflict = function( deep ) {
	if ( window.$ === jQuery ) {
		window.$ = _$;
	}

	if ( deep && window.jQuery === jQuery ) {
		window.jQuery = _jQuery;
	}

	return jQuery;
};

// Expose jQuery and $ identifiers, even in AMD
// (#7102#comment:10, https://github.com/jquery/jquery/pull/557)
// and CommonJS for browser emulators (#13566)
if ( typeof noGlobal === "undefined" ) {
	window.jQuery = window.$ = jQuery;
}




return jQuery;
} );

},{}],5:[function(require,module,exports){
/*global define:false */
/**
 * Copyright 2012-2017 Craig Campbell
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Mousetrap is a simple keyboard shortcut library for Javascript with
 * no external dependencies
 *
 * @version 1.6.5
 * @url craig.is/killing/mice
 */
(function(window, document, undefined) {

    // Check if mousetrap is used inside browser, if not, return
    if (!window) {
        return;
    }

    /**
     * mapping of special keycodes to their corresponding keys
     *
     * everything in this dictionary cannot use keypress events
     * so it has to be here to map to the correct keycodes for
     * keyup/keydown events
     *
     * @type {Object}
     */
    var _MAP = {
        8: 'backspace',
        9: 'tab',
        13: 'enter',
        16: 'shift',
        17: 'ctrl',
        18: 'alt',
        20: 'capslock',
        27: 'esc',
        32: 'space',
        33: 'pageup',
        34: 'pagedown',
        35: 'end',
        36: 'home',
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down',
        45: 'ins',
        46: 'del',
        91: 'meta',
        93: 'meta',
        224: 'meta'
    };

    /**
     * mapping for special characters so they can support
     *
     * this dictionary is only used incase you want to bind a
     * keyup or keydown event to one of these keys
     *
     * @type {Object}
     */
    var _KEYCODE_MAP = {
        106: '*',
        107: '+',
        109: '-',
        110: '.',
        111 : '/',
        186: ';',
        187: '=',
        188: ',',
        189: '-',
        190: '.',
        191: '/',
        192: '`',
        219: '[',
        220: '\\',
        221: ']',
        222: '\''
    };

    /**
     * this is a mapping of keys that require shift on a US keypad
     * back to the non shift equivelents
     *
     * this is so you can use keyup events with these keys
     *
     * note that this will only work reliably on US keyboards
     *
     * @type {Object}
     */
    var _SHIFT_MAP = {
        '~': '`',
        '!': '1',
        '@': '2',
        '#': '3',
        '$': '4',
        '%': '5',
        '^': '6',
        '&': '7',
        '*': '8',
        '(': '9',
        ')': '0',
        '_': '-',
        '+': '=',
        ':': ';',
        '\"': '\'',
        '<': ',',
        '>': '.',
        '?': '/',
        '|': '\\'
    };

    /**
     * this is a list of special strings you can use to map
     * to modifier keys when you specify your keyboard shortcuts
     *
     * @type {Object}
     */
    var _SPECIAL_ALIASES = {
        'option': 'alt',
        'command': 'meta',
        'return': 'enter',
        'escape': 'esc',
        'plus': '+',
        'mod': /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? 'meta' : 'ctrl'
    };

    /**
     * variable to store the flipped version of _MAP from above
     * needed to check if we should use keypress or not when no action
     * is specified
     *
     * @type {Object|undefined}
     */
    var _REVERSE_MAP;

    /**
     * loop through the f keys, f1 to f19 and add them to the map
     * programatically
     */
    for (var i = 1; i < 20; ++i) {
        _MAP[111 + i] = 'f' + i;
    }

    /**
     * loop through to map numbers on the numeric keypad
     */
    for (i = 0; i <= 9; ++i) {

        // This needs to use a string cause otherwise since 0 is falsey
        // mousetrap will never fire for numpad 0 pressed as part of a keydown
        // event.
        //
        // @see https://github.com/ccampbell/mousetrap/pull/258
        _MAP[i + 96] = i.toString();
    }

    /**
     * cross browser add event method
     *
     * @param {Element|HTMLDocument} object
     * @param {string} type
     * @param {Function} callback
     * @returns void
     */
    function _addEvent(object, type, callback) {
        if (object.addEventListener) {
            object.addEventListener(type, callback, false);
            return;
        }

        object.attachEvent('on' + type, callback);
    }

    /**
     * takes the event and returns the key character
     *
     * @param {Event} e
     * @return {string}
     */
    function _characterFromEvent(e) {

        // for keypress events we should return the character as is
        if (e.type == 'keypress') {
            var character = String.fromCharCode(e.which);

            // if the shift key is not pressed then it is safe to assume
            // that we want the character to be lowercase.  this means if
            // you accidentally have caps lock on then your key bindings
            // will continue to work
            //
            // the only side effect that might not be desired is if you
            // bind something like 'A' cause you want to trigger an
            // event when capital A is pressed caps lock will no longer
            // trigger the event.  shift+a will though.
            if (!e.shiftKey) {
                character = character.toLowerCase();
            }

            return character;
        }

        // for non keypress events the special maps are needed
        if (_MAP[e.which]) {
            return _MAP[e.which];
        }

        if (_KEYCODE_MAP[e.which]) {
            return _KEYCODE_MAP[e.which];
        }

        // if it is not in the special map

        // with keydown and keyup events the character seems to always
        // come in as an uppercase character whether you are pressing shift
        // or not.  we should make sure it is always lowercase for comparisons
        return String.fromCharCode(e.which).toLowerCase();
    }

    /**
     * checks if two arrays are equal
     *
     * @param {Array} modifiers1
     * @param {Array} modifiers2
     * @returns {boolean}
     */
    function _modifiersMatch(modifiers1, modifiers2) {
        return modifiers1.sort().join(',') === modifiers2.sort().join(',');
    }

    /**
     * takes a key event and figures out what the modifiers are
     *
     * @param {Event} e
     * @returns {Array}
     */
    function _eventModifiers(e) {
        var modifiers = [];

        if (e.shiftKey) {
            modifiers.push('shift');
        }

        if (e.altKey) {
            modifiers.push('alt');
        }

        if (e.ctrlKey) {
            modifiers.push('ctrl');
        }

        if (e.metaKey) {
            modifiers.push('meta');
        }

        return modifiers;
    }

    /**
     * prevents default for this event
     *
     * @param {Event} e
     * @returns void
     */
    function _preventDefault(e) {
        if (e.preventDefault) {
            e.preventDefault();
            return;
        }

        e.returnValue = false;
    }

    /**
     * stops propogation for this event
     *
     * @param {Event} e
     * @returns void
     */
    function _stopPropagation(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
            return;
        }

        e.cancelBubble = true;
    }

    /**
     * determines if the keycode specified is a modifier key or not
     *
     * @param {string} key
     * @returns {boolean}
     */
    function _isModifier(key) {
        return key == 'shift' || key == 'ctrl' || key == 'alt' || key == 'meta';
    }

    /**
     * reverses the map lookup so that we can look for specific keys
     * to see what can and can't use keypress
     *
     * @return {Object}
     */
    function _getReverseMap() {
        if (!_REVERSE_MAP) {
            _REVERSE_MAP = {};
            for (var key in _MAP) {

                // pull out the numeric keypad from here cause keypress should
                // be able to detect the keys from the character
                if (key > 95 && key < 112) {
                    continue;
                }

                if (_MAP.hasOwnProperty(key)) {
                    _REVERSE_MAP[_MAP[key]] = key;
                }
            }
        }
        return _REVERSE_MAP;
    }

    /**
     * picks the best action based on the key combination
     *
     * @param {string} key - character for key
     * @param {Array} modifiers
     * @param {string=} action passed in
     */
    function _pickBestAction(key, modifiers, action) {

        // if no action was picked in we should try to pick the one
        // that we think would work best for this key
        if (!action) {
            action = _getReverseMap()[key] ? 'keydown' : 'keypress';
        }

        // modifier keys don't work as expected with keypress,
        // switch to keydown
        if (action == 'keypress' && modifiers.length) {
            action = 'keydown';
        }

        return action;
    }

    /**
     * Converts from a string key combination to an array
     *
     * @param  {string} combination like "command+shift+l"
     * @return {Array}
     */
    function _keysFromString(combination) {
        if (combination === '+') {
            return ['+'];
        }

        combination = combination.replace(/\+{2}/g, '+plus');
        return combination.split('+');
    }

    /**
     * Gets info for a specific key combination
     *
     * @param  {string} combination key combination ("command+s" or "a" or "*")
     * @param  {string=} action
     * @returns {Object}
     */
    function _getKeyInfo(combination, action) {
        var keys;
        var key;
        var i;
        var modifiers = [];

        // take the keys from this pattern and figure out what the actual
        // pattern is all about
        keys = _keysFromString(combination);

        for (i = 0; i < keys.length; ++i) {
            key = keys[i];

            // normalize key names
            if (_SPECIAL_ALIASES[key]) {
                key = _SPECIAL_ALIASES[key];
            }

            // if this is not a keypress event then we should
            // be smart about using shift keys
            // this will only work for US keyboards however
            if (action && action != 'keypress' && _SHIFT_MAP[key]) {
                key = _SHIFT_MAP[key];
                modifiers.push('shift');
            }

            // if this key is a modifier then add it to the list of modifiers
            if (_isModifier(key)) {
                modifiers.push(key);
            }
        }

        // depending on what the key combination is
        // we will try to pick the best event for it
        action = _pickBestAction(key, modifiers, action);

        return {
            key: key,
            modifiers: modifiers,
            action: action
        };
    }

    function _belongsTo(element, ancestor) {
        if (element === null || element === document) {
            return false;
        }

        if (element === ancestor) {
            return true;
        }

        return _belongsTo(element.parentNode, ancestor);
    }

    function Mousetrap(targetElement) {
        var self = this;

        targetElement = targetElement || document;

        if (!(self instanceof Mousetrap)) {
            return new Mousetrap(targetElement);
        }

        /**
         * element to attach key events to
         *
         * @type {Element}
         */
        self.target = targetElement;

        /**
         * a list of all the callbacks setup via Mousetrap.bind()
         *
         * @type {Object}
         */
        self._callbacks = {};

        /**
         * direct map of string combinations to callbacks used for trigger()
         *
         * @type {Object}
         */
        self._directMap = {};

        /**
         * keeps track of what level each sequence is at since multiple
         * sequences can start out with the same sequence
         *
         * @type {Object}
         */
        var _sequenceLevels = {};

        /**
         * variable to store the setTimeout call
         *
         * @type {null|number}
         */
        var _resetTimer;

        /**
         * temporary state where we will ignore the next keyup
         *
         * @type {boolean|string}
         */
        var _ignoreNextKeyup = false;

        /**
         * temporary state where we will ignore the next keypress
         *
         * @type {boolean}
         */
        var _ignoreNextKeypress = false;

        /**
         * are we currently inside of a sequence?
         * type of action ("keyup" or "keydown" or "keypress") or false
         *
         * @type {boolean|string}
         */
        var _nextExpectedAction = false;

        /**
         * resets all sequence counters except for the ones passed in
         *
         * @param {Object} doNotReset
         * @returns void
         */
        function _resetSequences(doNotReset) {
            doNotReset = doNotReset || {};

            var activeSequences = false,
                key;

            for (key in _sequenceLevels) {
                if (doNotReset[key]) {
                    activeSequences = true;
                    continue;
                }
                _sequenceLevels[key] = 0;
            }

            if (!activeSequences) {
                _nextExpectedAction = false;
            }
        }

        /**
         * finds all callbacks that match based on the keycode, modifiers,
         * and action
         *
         * @param {string} character
         * @param {Array} modifiers
         * @param {Event|Object} e
         * @param {string=} sequenceName - name of the sequence we are looking for
         * @param {string=} combination
         * @param {number=} level
         * @returns {Array}
         */
        function _getMatches(character, modifiers, e, sequenceName, combination, level) {
            var i;
            var callback;
            var matches = [];
            var action = e.type;

            // if there are no events related to this keycode
            if (!self._callbacks[character]) {
                return [];
            }

            // if a modifier key is coming up on its own we should allow it
            if (action == 'keyup' && _isModifier(character)) {
                modifiers = [character];
            }

            // loop through all callbacks for the key that was pressed
            // and see if any of them match
            for (i = 0; i < self._callbacks[character].length; ++i) {
                callback = self._callbacks[character][i];

                // if a sequence name is not specified, but this is a sequence at
                // the wrong level then move onto the next match
                if (!sequenceName && callback.seq && _sequenceLevels[callback.seq] != callback.level) {
                    continue;
                }

                // if the action we are looking for doesn't match the action we got
                // then we should keep going
                if (action != callback.action) {
                    continue;
                }

                // if this is a keypress event and the meta key and control key
                // are not pressed that means that we need to only look at the
                // character, otherwise check the modifiers as well
                //
                // chrome will not fire a keypress if meta or control is down
                // safari will fire a keypress if meta or meta+shift is down
                // firefox will fire a keypress if meta or control is down
                if ((action == 'keypress' && !e.metaKey && !e.ctrlKey) || _modifiersMatch(modifiers, callback.modifiers)) {

                    // when you bind a combination or sequence a second time it
                    // should overwrite the first one.  if a sequenceName or
                    // combination is specified in this call it does just that
                    //
                    // @todo make deleting its own method?
                    var deleteCombo = !sequenceName && callback.combo == combination;
                    var deleteSequence = sequenceName && callback.seq == sequenceName && callback.level == level;
                    if (deleteCombo || deleteSequence) {
                        self._callbacks[character].splice(i, 1);
                    }

                    matches.push(callback);
                }
            }

            return matches;
        }

        /**
         * actually calls the callback function
         *
         * if your callback function returns false this will use the jquery
         * convention - prevent default and stop propogation on the event
         *
         * @param {Function} callback
         * @param {Event} e
         * @returns void
         */
        function _fireCallback(callback, e, combo, sequence) {

            // if this event should not happen stop here
            if (self.stopCallback(e, e.target || e.srcElement, combo, sequence)) {
                return;
            }

            if (callback(e, combo) === false) {
                _preventDefault(e);
                _stopPropagation(e);
            }
        }

        /**
         * handles a character key event
         *
         * @param {string} character
         * @param {Array} modifiers
         * @param {Event} e
         * @returns void
         */
        self._handleKey = function(character, modifiers, e) {
            var callbacks = _getMatches(character, modifiers, e);
            var i;
            var doNotReset = {};
            var maxLevel = 0;
            var processedSequenceCallback = false;

            // Calculate the maxLevel for sequences so we can only execute the longest callback sequence
            for (i = 0; i < callbacks.length; ++i) {
                if (callbacks[i].seq) {
                    maxLevel = Math.max(maxLevel, callbacks[i].level);
                }
            }

            // loop through matching callbacks for this key event
            for (i = 0; i < callbacks.length; ++i) {

                // fire for all sequence callbacks
                // this is because if for example you have multiple sequences
                // bound such as "g i" and "g t" they both need to fire the
                // callback for matching g cause otherwise you can only ever
                // match the first one
                if (callbacks[i].seq) {

                    // only fire callbacks for the maxLevel to prevent
                    // subsequences from also firing
                    //
                    // for example 'a option b' should not cause 'option b' to fire
                    // even though 'option b' is part of the other sequence
                    //
                    // any sequences that do not match here will be discarded
                    // below by the _resetSequences call
                    if (callbacks[i].level != maxLevel) {
                        continue;
                    }

                    processedSequenceCallback = true;

                    // keep a list of which sequences were matches for later
                    doNotReset[callbacks[i].seq] = 1;
                    _fireCallback(callbacks[i].callback, e, callbacks[i].combo, callbacks[i].seq);
                    continue;
                }

                // if there were no sequence matches but we are still here
                // that means this is a regular match so we should fire that
                if (!processedSequenceCallback) {
                    _fireCallback(callbacks[i].callback, e, callbacks[i].combo);
                }
            }

            // if the key you pressed matches the type of sequence without
            // being a modifier (ie "keyup" or "keypress") then we should
            // reset all sequences that were not matched by this event
            //
            // this is so, for example, if you have the sequence "h a t" and you
            // type "h e a r t" it does not match.  in this case the "e" will
            // cause the sequence to reset
            //
            // modifier keys are ignored because you can have a sequence
            // that contains modifiers such as "enter ctrl+space" and in most
            // cases the modifier key will be pressed before the next key
            //
            // also if you have a sequence such as "ctrl+b a" then pressing the
            // "b" key will trigger a "keypress" and a "keydown"
            //
            // the "keydown" is expected when there is a modifier, but the
            // "keypress" ends up matching the _nextExpectedAction since it occurs
            // after and that causes the sequence to reset
            //
            // we ignore keypresses in a sequence that directly follow a keydown
            // for the same character
            var ignoreThisKeypress = e.type == 'keypress' && _ignoreNextKeypress;
            if (e.type == _nextExpectedAction && !_isModifier(character) && !ignoreThisKeypress) {
                _resetSequences(doNotReset);
            }

            _ignoreNextKeypress = processedSequenceCallback && e.type == 'keydown';
        };

        /**
         * handles a keydown event
         *
         * @param {Event} e
         * @returns void
         */
        function _handleKeyEvent(e) {

            // normalize e.which for key events
            // @see http://stackoverflow.com/questions/4285627/javascript-keycode-vs-charcode-utter-confusion
            if (typeof e.which !== 'number') {
                e.which = e.keyCode;
            }

            var character = _characterFromEvent(e);

            // no character found then stop
            if (!character) {
                return;
            }

            // need to use === for the character check because the character can be 0
            if (e.type == 'keyup' && _ignoreNextKeyup === character) {
                _ignoreNextKeyup = false;
                return;
            }

            self.handleKey(character, _eventModifiers(e), e);
        }

        /**
         * called to set a 1 second timeout on the specified sequence
         *
         * this is so after each key press in the sequence you have 1 second
         * to press the next key before you have to start over
         *
         * @returns void
         */
        function _resetSequenceTimer() {
            clearTimeout(_resetTimer);
            _resetTimer = setTimeout(_resetSequences, 1000);
        }

        /**
         * binds a key sequence to an event
         *
         * @param {string} combo - combo specified in bind call
         * @param {Array} keys
         * @param {Function} callback
         * @param {string=} action
         * @returns void
         */
        function _bindSequence(combo, keys, callback, action) {

            // start off by adding a sequence level record for this combination
            // and setting the level to 0
            _sequenceLevels[combo] = 0;

            /**
             * callback to increase the sequence level for this sequence and reset
             * all other sequences that were active
             *
             * @param {string} nextAction
             * @returns {Function}
             */
            function _increaseSequence(nextAction) {
                return function() {
                    _nextExpectedAction = nextAction;
                    ++_sequenceLevels[combo];
                    _resetSequenceTimer();
                };
            }

            /**
             * wraps the specified callback inside of another function in order
             * to reset all sequence counters as soon as this sequence is done
             *
             * @param {Event} e
             * @returns void
             */
            function _callbackAndReset(e) {
                _fireCallback(callback, e, combo);

                // we should ignore the next key up if the action is key down
                // or keypress.  this is so if you finish a sequence and
                // release the key the final key will not trigger a keyup
                if (action !== 'keyup') {
                    _ignoreNextKeyup = _characterFromEvent(e);
                }

                // weird race condition if a sequence ends with the key
                // another sequence begins with
                setTimeout(_resetSequences, 10);
            }

            // loop through keys one at a time and bind the appropriate callback
            // function.  for any key leading up to the final one it should
            // increase the sequence. after the final, it should reset all sequences
            //
            // if an action is specified in the original bind call then that will
            // be used throughout.  otherwise we will pass the action that the
            // next key in the sequence should match.  this allows a sequence
            // to mix and match keypress and keydown events depending on which
            // ones are better suited to the key provided
            for (var i = 0; i < keys.length; ++i) {
                var isFinal = i + 1 === keys.length;
                var wrappedCallback = isFinal ? _callbackAndReset : _increaseSequence(action || _getKeyInfo(keys[i + 1]).action);
                _bindSingle(keys[i], wrappedCallback, action, combo, i);
            }
        }

        /**
         * binds a single keyboard combination
         *
         * @param {string} combination
         * @param {Function} callback
         * @param {string=} action
         * @param {string=} sequenceName - name of sequence if part of sequence
         * @param {number=} level - what part of the sequence the command is
         * @returns void
         */
        function _bindSingle(combination, callback, action, sequenceName, level) {

            // store a direct mapped reference for use with Mousetrap.trigger
            self._directMap[combination + ':' + action] = callback;

            // make sure multiple spaces in a row become a single space
            combination = combination.replace(/\s+/g, ' ');

            var sequence = combination.split(' ');
            var info;

            // if this pattern is a sequence of keys then run through this method
            // to reprocess each pattern one key at a time
            if (sequence.length > 1) {
                _bindSequence(combination, sequence, callback, action);
                return;
            }

            info = _getKeyInfo(combination, action);

            // make sure to initialize array if this is the first time
            // a callback is added for this key
            self._callbacks[info.key] = self._callbacks[info.key] || [];

            // remove an existing match if there is one
            _getMatches(info.key, info.modifiers, {type: info.action}, sequenceName, combination, level);

            // add this call back to the array
            // if it is a sequence put it at the beginning
            // if not put it at the end
            //
            // this is important because the way these are processed expects
            // the sequence ones to come first
            self._callbacks[info.key][sequenceName ? 'unshift' : 'push']({
                callback: callback,
                modifiers: info.modifiers,
                action: info.action,
                seq: sequenceName,
                level: level,
                combo: combination
            });
        }

        /**
         * binds multiple combinations to the same callback
         *
         * @param {Array} combinations
         * @param {Function} callback
         * @param {string|undefined} action
         * @returns void
         */
        self._bindMultiple = function(combinations, callback, action) {
            for (var i = 0; i < combinations.length; ++i) {
                _bindSingle(combinations[i], callback, action);
            }
        };

        // start!
        _addEvent(targetElement, 'keypress', _handleKeyEvent);
        _addEvent(targetElement, 'keydown', _handleKeyEvent);
        _addEvent(targetElement, 'keyup', _handleKeyEvent);
    }

    /**
     * binds an event to mousetrap
     *
     * can be a single key, a combination of keys separated with +,
     * an array of keys, or a sequence of keys separated by spaces
     *
     * be sure to list the modifier keys first to make sure that the
     * correct key ends up getting bound (the last key in the pattern)
     *
     * @param {string|Array} keys
     * @param {Function} callback
     * @param {string=} action - 'keypress', 'keydown', or 'keyup'
     * @returns void
     */
    Mousetrap.prototype.bind = function(keys, callback, action) {
        var self = this;
        keys = keys instanceof Array ? keys : [keys];
        self._bindMultiple.call(self, keys, callback, action);
        return self;
    };

    /**
     * unbinds an event to mousetrap
     *
     * the unbinding sets the callback function of the specified key combo
     * to an empty function and deletes the corresponding key in the
     * _directMap dict.
     *
     * TODO: actually remove this from the _callbacks dictionary instead
     * of binding an empty function
     *
     * the keycombo+action has to be exactly the same as
     * it was defined in the bind method
     *
     * @param {string|Array} keys
     * @param {string} action
     * @returns void
     */
    Mousetrap.prototype.unbind = function(keys, action) {
        var self = this;
        return self.bind.call(self, keys, function() {}, action);
    };

    /**
     * triggers an event that has already been bound
     *
     * @param {string} keys
     * @param {string=} action
     * @returns void
     */
    Mousetrap.prototype.trigger = function(keys, action) {
        var self = this;
        if (self._directMap[keys + ':' + action]) {
            self._directMap[keys + ':' + action]({}, keys);
        }
        return self;
    };

    /**
     * resets the library back to its initial state.  this is useful
     * if you want to clear out the current keyboard shortcuts and bind
     * new ones - for example if you switch to another page
     *
     * @returns void
     */
    Mousetrap.prototype.reset = function() {
        var self = this;
        self._callbacks = {};
        self._directMap = {};
        return self;
    };

    /**
     * should we stop this event before firing off callbacks
     *
     * @param {Event} e
     * @param {Element} element
     * @return {boolean}
     */
    Mousetrap.prototype.stopCallback = function(e, element) {
        var self = this;

        // if the element has the class "mousetrap" then no need to stop
        if ((' ' + element.className + ' ').indexOf(' mousetrap ') > -1) {
            return false;
        }

        if (_belongsTo(element, self.target)) {
            return false;
        }

        // Events originating from a shadow DOM are re-targetted and `e.target` is the shadow host,
        // not the initial event target in the shadow tree. Note that not all events cross the
        // shadow boundary.
        // For shadow trees with `mode: 'open'`, the initial event target is the first element in
        // the event’s composed path. For shadow trees with `mode: 'closed'`, the initial event
        // target cannot be obtained.
        if ('composedPath' in e && typeof e.composedPath === 'function') {
            // For open shadow trees, update `element` so that the following check works.
            var initialEventTarget = e.composedPath()[0];
            if (initialEventTarget !== e.target) {
                element = initialEventTarget;
            }
        }

        // stop for input, select, and textarea
        return element.tagName == 'INPUT' || element.tagName == 'SELECT' || element.tagName == 'TEXTAREA' || element.isContentEditable;
    };

    /**
     * exposes _handleKey publicly so it can be overwritten by extensions
     */
    Mousetrap.prototype.handleKey = function() {
        var self = this;
        return self._handleKey.apply(self, arguments);
    };

    /**
     * allow custom key mappings
     */
    Mousetrap.addKeycodes = function(object) {
        for (var key in object) {
            if (object.hasOwnProperty(key)) {
                _MAP[key] = object[key];
            }
        }
        _REVERSE_MAP = null;
    };

    /**
     * Init the global mousetrap functions
     *
     * This method is needed to allow the global mousetrap functions to work
     * now that mousetrap is a constructor function.
     */
    Mousetrap.init = function() {
        var documentMousetrap = Mousetrap(document);
        for (var method in documentMousetrap) {
            if (method.charAt(0) !== '_') {
                Mousetrap[method] = (function(method) {
                    return function() {
                        return documentMousetrap[method].apply(documentMousetrap, arguments);
                    };
                } (method));
            }
        }
    };

    Mousetrap.init();

    // expose mousetrap to the global object
    window.Mousetrap = Mousetrap;

    // expose as a common js module
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Mousetrap;
    }

    // expose mousetrap as an AMD module
    if (typeof define === 'function' && define.amd) {
        define(function() {
            return Mousetrap;
        });
    }
}) (typeof window !== 'undefined' ? window : null, typeof  window !== 'undefined' ? document : null);

},{}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.greek_prefixes = void 0;
const greek_prefixes = ['an', 'an', 'ap', 'di', 'dy', 'ec', 'eg', 'en', 'em', 'eo', 'ep', 'eu', 'id', 'is', 'my', 'ne', 'od', 'oo', 'ot', 'sy', 'ur', 'ur', 'zo', 'pto', 'pyl', 'acr', 'aer', 'agr', 'ana', 'ant', 'apo', 'aut', 'bar', 'bio', 'cac', 'cat', 'cen', 'cen', 'con', 'cub', 'cyn', 'dec', 'dek', 'dem', 'dia', 'dox', 'eco', 'ego', 'eme', 'eos', 'epi', 'erg', 'eso', 'eth', 'eur', 'exo', 'geo', 'gen', 'hem', 'hal', 'hen', 'hex', 'hod', 'hol', 'hor', 'hor', 'hyo', 'hyp', 'ide', 'idi', 'iso', 'kil', 'lei', 'lep', 'lip', 'log', 'meg', 'mei', 'men', 'mer', 'mes', 'mim', 'mis', 'mit', 'mne', 'mon', 'myx', 'nes', 'nom', 'oct', 'oed', 'oen', 'omm', 'ont', 'opt', 'pan', 'pam', 'par', 'ped', 'pin', 'pis', 'pol', 'por', 'pro', 'rhe', 'sei', 'sit', 'syn', 'syl', 'sym', 'tax', 'the', 'the', 'tom', 'ton', 'top', 'tox', 'tri', 'ulo', 'uro', 'uro', 'xen', 'xer', 'zon', 'zyg', 'psil', 'prot', 'pros', 'amph', 'anem', 'anti', 'anth', 'arct', 'astr', 'athl', 'auto', 'basi', 'bibl', 'briz', 'brom', 'brom', 'call', 'carp', 'carp', 'cata', 'chir', 'cine', 'cirr', 'clad', 'clav', 'coel', 'copr', 'cosm', 'crep', 'cris', 'crit', 'cten', 'cyan', 'cycl', 'cyst', 'deca', 'deka', 'delt', 'derm', 'dexi', 'dino', 'dipl', 'ecto', 'endo', 'engy', 'eoso', 'etho', 'ethi', 'ethm', 'ethn', 'etym', 'fant', 'glia', 'gram', 'gymn', 'haem', 'hapl', 'heli', 'hemi', 'hept', 'herp', 'heur', 'hipp', 'home', 'horm', 'hyal', 'hydr', 'hygr', 'hypn', 'icos', 'kine', 'lamp', 'leps', 'leuc', 'leuk', 'lith', 'metr', 'meta', 'micr', 'myri', 'myth', 'narc', 'naut', 'necr', 'nect', 'nema', 'neur', 'noth', 'noto', 'oeco', 'ogdo', 'olig', 'onom', 'ophi', 'orch', 'orth', 'pach', 'paed', 'pale', 'path', 'patr', 'pect', 'pent', 'pept', 'peri', 'petr', 'phae', 'phag', 'pher', 'phil', 'phob', 'phon', 'phor', 'phos', 'phot', 'phyl', 'phys', 'plac', 'plas', 'plec', 'plut', 'pneu', 'poie', 'pole', 'poli', 'poli', 'poly', 'raph', 'rhag', 'rhig', 'rhin', 'rhiz', 'rhod', 'sarc', 'scel', 'scop', 'sema', 'siph', 'soma', 'soph', 'stea', 'steg', 'sten', 'stig', 'stom', 'styl', 'tach', 'tars', 'taur', 'tele', 'tele', 'temn', 'tetr', 'than', 'thus', 'ther', 'thym', 'thyr', 'trag', 'trit', 'trop', 'xiph', 'proct', 'ptych', 'amphi', 'arche', 'archi', 'arche', 'arist', 'arthr', 'bathy', 'batho', 'blenn', 'blast', 'botan', 'brady', 'bront', 'calli', 'calyp', 'cardi', 'centr', 'ceram', 'cerat', 'chlor', 'chore', 'chrom', 'chron', 'chrys', 'clast', 'clist', 'cochl', 'corac', 'cotyl', 'crani', 'cross', 'crypt', 'dendr', 'dodec', 'dynam', 'ennea', 'gastr', 'graph', 'heter', 'homal', 'hyper', 'klept', 'lekan', 'macro', 'melan', 'meter', 'morph', 'nephr', 'nomad', 'odont', 'organ', 'osteo', 'palae', 'palin', 'peran', 'phleg', 'phloe', 'phren', 'phryn', 'phyll', 'plagi', 'platy', 'plesi', 'pleth', 'pleur', 'pogon', 'polem', 'potam', 'rhabd', 'rhomb', 'scaph', 'schem', 'schis', 'scler', 'scoli', 'scept', 'scyph', 'selen', 'solen', 'sperm', 'sphen', 'spher', 'stern', 'stich', 'stoch', 'taeni', 'techn', 'therm', 'thyre', 'traum', 'trema', 'trich', 'troch', 'troph', 'xanth', 'psych', 'archae', 'brachi', 'brachy', 'bronch', 'cathar', 'cephal', 'chelon', 'cleist', 'cosmet', 'cylind', 'dactyl', 'deuter', 'dogmat', 'erythr', 'galact', 'hendec', 'ichthy', 'mening', 'myrmec', 'omphal', 'opisth', 'opoter', 'ornith', 'ostrac', 'persic', 'phalar', 'phaner', 'phragm', 'plinth', 'prasin', 'presby', 'rhynch', 'scalen', 'strept', 'stroph', 'thalam', 'theori', 'trachy', 'trapez', 'tympan', 'aesthet', 'anthrop', 'branchi', 'cleithr', 'epistem', 'parthen', 'phalang', 'pharmac', 'porphyr', 'sacchar', 'sphinct', 'stalact', 'stalagm', 'thalass', 'oesophag', 'ophthalm', 'physalid', 'pentecost', 'treiskaidek'];
exports.greek_prefixes = greek_prefixes;

},{}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildSettingsFrom = buildSettingsFrom;

var _jquery = _interopRequireDefault(require("jquery"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function genSettingBody(map) {
  let tag = "div";
  let class_bus = "";

  switch (map.type) {
    case "button":
      class_bus += " settings-button";
      break;

    case "value":
      class_bus += "settings-value";
      break;

    case "option":
      class_bus += " settings-option";
      break;

    case "choice":
      class_bus += " settings-choice";
      break;

    default:
      break;
  }

  let element = (0, _jquery.default)(document.createElement(tag));
  element.addClass(class_bus);
  element.attr("id", map.key);
  return element;
}

function buildSettingsFrom(map) {
  let element = genSettingBody(map); // element += `<div class='${map.key}'>${map.key}`

  if (map.elements && map.elements.length > 0) {
    map.elements.forEach(el_map => {
      buildSettingsFrom(el_map).appendTo(element);
    });
  }

  if (map.choices) {
    map.choices.forEach((choice, index) => {
      // console.log(choice)
      let templ = map.element_template(choice, index);
      templ.type = "option";
      buildSettingsFrom(templ).appendTo(element);
    });
  }

  if (map.click) {
    element.on("click", map.click);
  }

  if (map.icon) {
    let icon = (0, _jquery.default)(document.createElement("div"));
    icon.html(map.icon);
    element.append(icon);
  } // console.log(element)


  return element;
}

},{"jquery":4}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "default", {
  enumerable: true,
  get: function () {
    return _lector.default;
  }
});
Object.defineProperty(exports, "wfy", {
  enumerable: true,
  get: function () {
    return _helper.wfy;
  }
});

var _lector = _interopRequireDefault(require("./pragmas/lector.js"));

var _helper = require("./pragmas/helper.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

},{"./pragmas/helper.js":9,"./pragmas/lector.js":10}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.wfy = wfy;
exports.crush = crush;
exports.generateDifficultyIndex = generateDifficultyIndex;
exports.wordValue = wordValue;
exports.charsMsAt = charsMsAt;

var _jquery = _interopRequireDefault(require("jquery"));

var _greek = require("../composers/greek");

var _compromise = _interopRequireDefault(require("compromise"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function wfy(element) {
  element = (0, _jquery.default)(element);
  let wfied_text = "";

  for (let el of element.text().split(" ")) {
    wfied_text += `<w>${el}</w> `;
  }

  return element.html(wfied_text.slice(0, -1));
}

function crush(n) {
  const xa = 1;
  const ya = 4;
  const xb = 7;
  const yb = 6;
  const xc = 8;
  const yc = 7;
  const xd = 16;
  const yd = 10;
  if (n <= xa) return ya;
  if (n <= xb) return (yb - ya) / (xb - xa) * (n - xa) + ya;
  if (n <= xc) return (yc - yb) / (xc - xb) * (n - xb) + yb;
  return (yd - yc) / (xd - xc) * (n - xc) + yc;
}

function generateDifficultyIndex(word) {
  // returns 0-1 with 0 being not difficult at all
  let d = 0;
  let w = (0, _compromise.default)(word.text());

  if (w.has('#Verb')) {
    d += .5;
  }

  if (w.has('#Acronym')) {
    d += .8;
  }

  let greekF = howGreek(word.text());

  if (greekF > 1) {
    d += greekF / 10;
  }

  return Math.min(1, Math.min(d, 1));
}

function wordValue(word, d) {
  return crush(word.text().length) * (d + 1);
}

function charsMsAt(wpm) {
  const avgCharsInWord = 4.7;
  return 1000 / (wpm / 60 * avgCharsInWord);
}

function howGreek(word) {
  let length = word.length;
  if (length < 5) return 0;

  for (let prefix of _greek.greek_prefixes) {
    if (prefix.length >= length - 3) return 0;
    if (prefix == word.substring(0, prefix.length)) return prefix.length;
  }

  return 0;
}

},{"../composers/greek":6,"compromise":3,"jquery":4}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _jquery = _interopRequireDefault(require("jquery"));

var _helper = require("./helper.js");

var _pragma = _interopRequireDefault(require("./pragma.js"));

var _mark = _interopRequireDefault(require("./mark.js"));

var _word = _interopRequireDefault(require("./word.js"));

var _mousetrap = _interopRequireDefault(require("mousetrap"));

var _settings = _interopRequireDefault(require("./settings"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Lector extends _pragma.default {
  constructor(element, options = {}) {
    super(element);
    this.setup_options(options);
    this.reading = false;
    this.reader = new _word.default(this.element, this, new _mark.default(this)); // this.reader.children[7].read()

    this.read(); // new Pragma(this.target, { mouseover: () => this.target.fadeOut() })

    let other = {
      key: "settings",
      elements: [{
        key: "settings",
        type: "button",
        icon: "settings",
        elements: [{
          key: "color",
          value: 1,
          type: "choice",
          element_template: (key, index) => {
            return {
              key: key,
              value: index,
              icon: `<div style='width:25px;height:25px;border-radius:25px;background:${key}'></div>`,
              click: () => {
                this.mark.color = index;
              }
            };
          },
          choices: this.mark.colors
        }, {
          key: "font",
          value: 1,
          type: "choice",
          element_template: (key, index) => {
            return {
              key: key,
              value: index,
              icon: `<div style='width:25px;height:25px;border-radius:25px;font-family:${key}'>Aa</div>`,
              click: () => {
                this.font = key;
              }
            };
          },
          choices: this.fonts
        }, {
          key: "fovea",
          value: 5,
          elements: [{
            key: "fovea -",
            type: "button",
            icon: "-",
            click: () => {
              this.mark.fovea -= 1;
            }
          }, {
            key: "fovea-monitor"
          }, {
            key: "fovea +",
            icon: "+",
            click: () => {
              this.mark.fovea += 1;
            }
          }],
          type: "value",
          min: 3,
          max: 15,
          step: 1
        }]
      }, {
        key: "wpm",
        value: 250,
        type: "value_verbose",
        min: 10,
        max: 4000,
        step: 10
      }]
    };
    this.settings = new _settings.default(this, other);
    this.reader.mark.settings.add({
      wpm: 250
    });

    _mousetrap.default.bind(["a", 'space'], () => {
      if (!this.reading) {
        this.read();
      } else {
        this.pause();
      } // return false to prevent default browser behavior
      // and stop event from bubbling


      return false;
    });
  }

  get mark() {
    return this.reader.mark;
  }

  get fonts() {
    return ["Open Sans", "Arial", "Helvetica", "Space Mono"];
  }

  set font(font) {
    this.reader.element.css({
      "font-family": font
    });
  }

  read() {
    this.reading = true;
    this.reader.read();
  }

  pause() {
    this.reading = false;
    this.reader.pause();
  }

  setup_options(options) {
    this.options = {
      // these are the default values
      toolbar: options.toolbar || false,
      topbar: options.topbar || false,
      loop: options.loop || false,
      autostart: options.autostart || false,
      interactive: options.interactive || true,
      shortcuts: options.shortcuts || true,
      // if interactive is false, this option doesnt do anything
      freadify: options.freadify == null ? true : options.freadify // will convert plain text to .frd format (scroll to the .frd format section for more)

    };

    if (this.options.freadify) {
      this.element.replaceWith((0, _helper.wfy)(this.element));
    }
  }

}

exports.default = Lector;

},{"./helper.js":9,"./mark.js":11,"./pragma.js":12,"./settings":13,"./word.js":14,"jquery":4,"mousetrap":5}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _jquery = _interopRequireDefault(require("jquery"));

var _pragma = _interopRequireDefault(require("./pragma"));

var _animejs = _interopRequireDefault(require("animejs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// mark is responsible for marking words in the screen
class Mark extends _pragma.default {
  constructor(parent) {
    super((0, _jquery.default)("<marker></marker>"));
    this.element.css({
      'position': 'absolute',
      'outline': 'solid 0px red',
      'background-color': '#FFDf6C',
      'width': '10px',
      'height': '20px',
      'z-index': '10',
      'opacity': '100%',
      'mix-blend-mode': 'darken',
      'border-radius': '3px'
    });
    this.parent = parent;
    this.parent.element.append(this.element);
    this.isBeingSummoned = false;
    this.element.width("180px");
    this.colors = ["tomato", "#FFDFD6", "teal"];
  }

  get settings() {
    return this.parent.settings;
  }

  set color(index) {
    this.settings.set({
      "color": this.colors[index]
    });
    this.element.css({
      "background": this.colors[index]
    });
  }

  get fovea() {
    return this.settings.get("fovea") || 4;
  }

  set fovea(n) {
    console.table(['writing fovea', this.settings.get("fovea")]);
    this.settings.set({
      "fovea": n
    });
    this.element.css({
      "width": this.settings.get("fovea") * 30
    });
  }

  get wpm() {
    return this.settings.get('wpm');
  }

  set wpm(n) {
    this.settings.set({
      "wpm": n
    });
  }

  pause() {
    if (this.current_anime) {
      this.current_anime.remove('marker');
      this.isBeingSummoned = false;
    }
  }

  moveTo(blueprint, duration, complete = () => {}) {
    if (this.isBeingSummoned) return new Promise((resolve, reject) => resolve());
    return new Promise((resolve, reject) => {
      this.isBeingSummoned = true;
      this.current_anime = (0, _animejs.default)({
        targets: 'marker',
        left: blueprint.left,
        top: blueprint.top,
        height: blueprint.height,
        easing: blueprint.ease || 'easeInOutExpo',
        duration: duration,
        complete: anim => {
          this.isBeingSummoned = false;
          complete();
          resolve();
        }
      });
    });
  }

  mark(word, time = 200, ease = "easeInOutExpo") {
    return this.moveTo({
      top: word.top(),
      left: word.x(this.width()),
      height: word.height(),
      ease: ease
    }, time, () => {// console.log(`FROM MARK -> marked ${word.text()}`)
    });
  }

  guide(word) {
    const before_weight = .4;
    const after_weight = 1 - before_weight;
    return new Promise((resolve, reject) => {
      let first_transition = word.first_in_line() ? 500 : this.last_marked ? this.last_marked.time(this.wpm) * before_weight : 0;
      let first_ease = word.first_in_line() ? "easeInOutExpo" : "linear";
      return this.moveTo({
        top: word.top(),
        left: word.x(this.width()) - word.width() / 2,
        height: word.height(),
        ease: first_ease
      }, first_transition).then(() => {
        this.mark(word, word.time(this.wpm) * after_weight, "linear").then(() => {
          this.last_marked = word;
          resolve();
        });
      });
    });
  }

}

exports.default = Mark;

},{"./pragma":12,"animejs":2,"jquery":4}],12:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _jquery = _interopRequireDefault(require("jquery"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// a pragma is defined as a concept, which has an actual physical object "connected"
// with it
class Pragma {
  constructor(element, listeners = {}) {
    this.element = (0, _jquery.default)(element);
    this.children = [];
    this.setup_listeners(listeners);
  }

  add(spragma) {
    this.children.push(spragma);
  }

  setup_listeners(listeners) {
    Object.entries(listeners).forEach(([on, cb]) => {
      this.element.on(on, () => cb());
    });
  }

  click() {}

  text() {
    return this.element.text();
  }

  offset() {
    return this.element.offset();
  }

  left() {
    return this.offset().left;
  }

  top() {
    return this.offset().top;
  }

  height() {
    return this.element.height();
  }

  width() {
    return this.element.width();
  }

  x(relative_width) {
    return this.left() + this.width() / 2 - relative_width / 2;
  }

}

exports.default = Pragma;

},{"jquery":4}],13:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _jquery = _interopRequireDefault(require("jquery"));

var _pragma = _interopRequireDefault(require("./pragma"));

var _animejs = _interopRequireDefault(require("animejs"));

var _settings_builder = require("../composers/settings_builder");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Settings extends _pragma.default {
  constructor(parent, map = {}, settings = {}) {
    super((0, _settings_builder.buildSettingsFrom)(map));
    this.s = settings;
    this.element.appendTo(document.body);
    this.parent = parent;
    this.setup_listeners({
      "mouseover": this.mouseover
    }); // console.log("ive been created")
  }

  onset(key, val) {
    console.log(`set ${key} to ${val}`);
  }

  onget(key, val) {// console.log(`got ${val} from ${key}`)
  }

  get(n) {
    this.onget(n, this.s[n]);
    return this.s[n];
  }

  set(n) {
    this.add(n);
  }

  add(n) {
    Object.entries(n).forEach(([key, value]) => {
      this.s[key] = value;
      this.onset(key, value);
    });
  }

  mouseover() {// console.log("i've been hovered")
  }

}

exports.default = Settings;

},{"../composers/settings_builder":7,"./pragma":12,"animejs":2,"jquery":4}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _pragma = _interopRequireDefault(require("./pragma.js"));

var _helper = require("./helper.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Word extends _pragma.default {
  constructor(element, parent, mark = null, index = 0) {
    super(element);
    this.parent = parent;
    this.mark = mark || this.parent.mark;
    this.cursor = 0;
    this.index = index;
    this.addKids();

    if (this.virgin()) {
      let listeners = {
        "click": () => this.click(),
        "mouseover": () => this.mouseover(),
        "mouseout": () => this.mouseout()
      };
      this.setup_listeners(listeners);
    }
  }

  virgin() {
    return this.children.length == 0;
  }

  click() {
    this.summon();
  }

  mouseover() {}

  mouseout() {}

  pause() {
    if (this.virgin()) return new Promise((resolve, reject) => {
      this.summon();
      this.onpause();
      resolve();
    }); // word is not virgin

    this.stop_flag = true;
    return new Promise((resolve, reject) => {
      this.stop_flag = false;
      this.mark.pause();
      this.onpause(); // this.children[this.cursor].summon()

      resolve();
    });
  }

  summon() {
    if (!this.virgin()) return false;
    return this.parent.pause().then(() => {
      this.mark.mark(this);
      this.parent.cursor = this.index;
    });
  }

  onread() {
    console.log('yyet');
  }

  onpause() {
    console.log('paused reading');
  }

  ondone() {
    console.log('done reading');
  }

  read() {
    // if (this.children.length - this.cursor > 0){
    if (!this.virgin() && this.children.length - this.cursor > 0) {
      if (this.stop_flag) {
        return new Promise((resolve, reject) => {
          this.stop_flag = false;
          resolve();
        });
      }

      this.children[this.cursor].read().then(() => {
        this.cursor += 1;
        this.onread();
        return this.read();
      });
      return;
    } else {
      if (this.virgin()) return this.mark.guide(this);
    }

    this.ondone();
  }

  sibling(n) {
    return this.parent ? this.parent.children[this.index + n] : null;
  }

  next() {
    return this.sibling(1);
  }

  pre() {
    return this.sibling(-1);
  }

  same_line(n) {
    return this.sibling(n) != null && (this.sibling(n).top() - this.top()) ** 2 < 10;
  }

  first_in_line() {
    return !this.same_line(-1);
  }

  last_in_line() {
    return !this.same_line(1);
  }

  time(wpm = 250) {
    return (0, _helper.charsMsAt)(wpm) * (0, _helper.wordValue)(this, (0, _helper.generateDifficultyIndex)(this));
  }

  addKids() {
    let index = 0;
    this.element.find("w").each((x, el) => {
      if (el.textContent.length > 0) {
        this.add(new Word(el, this, this.mark, index));
        index += 1;
      }
    });
  }

}

exports.default = Word;

},{"./helper.js":9,"./pragma.js":12}]},{},[1]);

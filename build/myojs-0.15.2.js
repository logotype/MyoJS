/*! 
 * MyoJS v0.15.2
 * https://github.com/logotype/myojs.git
 * 
 * Copyright 2015 Victor Norgren
 * Released under the MIT license
 */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            currentQueue[queueIndex].run();
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.8.3';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  var property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = property('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = isArrayLike(obj) ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(arguments, true, true, 1);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    return _.unzip(arguments);
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions
  function createPredicateIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  }

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions
  function createIndexFinder(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
            i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
            length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  }

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var args = slice.call(arguments, 2);
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys =  _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(object, oiteratee, context) {
    var result = {}, obj = object, iteratee, keys;
    if (obj == null) return result;
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj);
      iteratee = optimizeCb(oiteratee, context);
    } else {
      keys = flatten(arguments, false, false, 1);
      iteratee = function(value, key, obj) { return key in obj; };
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = property;

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));

},{}],4:[function(require,module,exports){

/**
 * Module dependencies.
 */

var global = (function() { return this; })();

/**
 * WebSocket constructor.
 */

var WebSocket = global.WebSocket || global.MozWebSocket;

/**
 * Module exports.
 */

module.exports = WebSocket ? ws : null;

/**
 * WebSocket constructor.
 *
 * The third `opts` options object gets ignored in web browsers, since it's
 * non-standard, and throws a TypeError if passed to the constructor.
 * See: https://github.com/einaros/ws/issues/227
 *
 * @param {String} uri
 * @param {Array} protocols (optional)
 * @param {Object) opts (optional)
 * @api public
 */

function ws(uri, protocols, opts) {
  var instance;
  if (protocols) {
    instance = new WebSocket(uri, protocols);
  } else {
    instance = new WebSocket(uri);
  }
  return instance;
}

if (WebSocket) ws.prototype = WebSocket.prototype;

},{}],5:[function(require,module,exports){
var CircularBuffer = module.exports = function(size) {
    'use strict';
    var self = this;

    self.pos = 0;
    self._buf = [];
    self.size = size;
};

CircularBuffer.prototype.get = function(i) {
    'use strict';
    var self = this;

    if (i === undefined) {
        i = 0;
    }
    if (i >= self.size) {
        return undefined;
    }
    if (i >= self._buf.length) {
        return undefined;
    }
    return self._buf[(self.pos - i - 1) % self.size];
};

CircularBuffer.prototype.push = function(o) {
    'use strict';
    var self = this;

    self._buf[self.pos % self.size] = o;
    return self.pos++;
};

},{}],6:[function(require,module,exports){
var Pose = require('./Pose'),
    Quaternion = require('./Quaternion'),
    Vector3 = require('./Vector3');

var Frame = module.exports = function(data) {
    'use strict';
    var self = this;

    if (!data) {
        throw new Error('Missing constructor arguments');
    }
    if (typeof data !== 'object') {
        throw new Error('Constructor parameter needs to be an object');
    }
    if (!data.hasOwnProperty('id') || data.id !== parseInt(data.id, 10)) {
        throw new Error('Frame id needs to be of type integer');
    }
    if (!data.hasOwnProperty('timestamp') || typeof data.timestamp !== 'string') {
        throw new Error('Timestamp needs to be of type string');
    }

    /**
     * A unique ID for this Frame. Consecutive frames processed by the Myo
     * have consecutive increasing values.
     * @member id
     * @memberof Myo.Frame.prototype
     * @type {number}
     */
    self.id = data.id;

    /**
     * The frame capture time in microseconds elapsed since the Myo started.
     * @member timestamp
     * @memberof Myo.Frame.prototype
     * @type {string}
     */
    self.timestamp = data.timestamp;

    if (data.euler) {
        self.euler = data.euler;
    }

    if (data.rssi) {
        self.rssi = data.rssi;
    }

    if (data.event) {
        self.event = data.event;
    }

    /**
     * A change in pose has been detected.
     * @member pose
     * @memberof Myo.Pose.prototype
     * @type {Pose}
     */
    if (data.pose) {
        self.pose = new Pose(data.pose);
    } else {
        self.pose = Pose.invalid();
    }

    /**
     * A change in pose has been detected.
     * @member pose
     * @memberof Myo.Pose.prototype
     * @type {Pose}
     */
    if (data.rotation) {
        self.rotation = new Quaternion(data.rotation);
    } else {
        self.rotation = Quaternion.invalid();
    }

    if (data.accel) {
        self.accel = new Vector3(data.accel);
    } else {
        self.accel = Vector3.invalid();
    }

    if (data.gyro) {
        self.gyro = new Vector3(data.gyro);
    } else {
        self.gyro = Vector3.invalid();
    }

    /**
     * EMG data
     */
    if (data.emg) {
        self.emg = data.emg;
    } else {
        self.emg = [];
    }

    self.data = data;
    self.type = 'frame';
};


/**
 * Returns a string containing this Frame in a human readable format.
 * @return
 *
 */
Frame.prototype.toString = function() {
    'use strict';
    var self = this;

    return '[Frame id:' + self.id + ' timestamp:' + self.timestamp + ' accel:' + self.accel.toString() + ']';
};

},{"./Pose":10,"./Quaternion":11,"./Vector3":12}],7:[function(require,module,exports){
var EventEmitter = require('events').EventEmitter,
    Myo = require('./Myo'),
    _ = require('underscore');

var Hub = module.exports = function(opt) {
    'use strict';
    var self = this;

    self.connectionType = require('./connection/BaseConnection');
    self.connection = new self.connectionType(opt);
    self.historyType = require('./CircularBuffer');
    self.history = new self.historyType(200);
    self.myos = [];

    self.connection.connect();

    var hub = this;

    // Forward events
    self.connection.on('deviceInfo', function() {
        hub.myo = new Myo(hub.connection);
    });
    self.connection.on('frame', function(frame) {
        hub.history.push(frame);
        hub.emit('frame', frame);
    });
    self.connection.on('pose', function(pose) {
        hub.emit('pose', pose);
    });
    self.connection.on('event', function(event) {
        hub.emit(event.type);
    });
    self.connection.on('ready', function() {
        hub.emit('ready');
    });
    self.connection.on('connect', function() {
        hub.emit('connect');
    });
    self.connection.on('disconnect', function() {
        hub.emit('disconnect');
    });
};

/**
 * Returns a frame of tracking data from the Myo.
 *
 * Use the optional history parameter to specify which frame to retrieve.
 * Call frame() or frame(0) to access the most recent frame; call frame(1) to
 * access the previous frame, and so on. If you use a history value greater
 * than the number of stored frames, then the hub returns an invalid frame.
 *
 * @method frame
 * @memberof Myo.hub.prototype
 * @param {number} num The age of the frame to return, counting backwards from
 * the most recent frame (0) into the past and up to the maximum age (59).
 * @returns {Myo.Frame} The specified frame; or, if no history
 * parameter is specified, the newest frame. If a frame is not available at
 * the specified history position, an invalid Frame is returned.
 **/
Hub.prototype.frame = function(num) {
    'use strict';
    var self = this;

    return self.history.get(num) || null;
};

/**
 * Find a nearby Myo and pair with it, or time out after timeoutMilliseconds milliseconds if provided.
 *
 * <p>If timeout_ms is zero, this function blocks until a Myo is found. This function must
 * not be run concurrently with run() or runOnce().</p>
 */
Hub.prototype.waitForMyo = function(timeoutMilliseconds) {
    'use strict';
    var self = this;

    if (!timeoutMilliseconds || timeoutMilliseconds !== parseInt(timeoutMilliseconds, 10)) {
        throw new Error('timeoutMilliseconds needs to be of type integer');
    }
    self.connection.send({
        'waitForMyo': timeoutMilliseconds
    });
};

/**
 * Run the event loop for the specified duration (in milliseconds).
 */
Hub.prototype.run = function(durationMilliseconds) {
    'use strict';
    var self = this;

    if (!durationMilliseconds || durationMilliseconds !== parseInt(durationMilliseconds, 10)) {
        throw new Error('durationMilliseconds needs to be of type integer');
    }
    self.connection.send({
        'run': durationMilliseconds
    });
};

/**
 * Run the event loop until a single event occurs, or the specified
 * duration (in milliseconds) has elapsed.
 */
Hub.prototype.runOnce = function(durationMilliseconds) {
    'use strict';
    var self = this;

    if (!durationMilliseconds || durationMilliseconds !== parseInt(durationMilliseconds, 10)) {
        throw new Error('durationMilliseconds needs to be of type integer');
    }
    self.connection.send({
        'runOnce': durationMilliseconds
    });
};

_.extend(Hub.prototype, EventEmitter.prototype);

},{"./CircularBuffer":5,"./Myo":9,"./connection/BaseConnection":14,"events":1,"underscore":3}],8:[function(require,module,exports){
(function (global){
/**
 * Myo is the global namespace of the Myo API.
 * @namespace Myo
 */
var Myo = module.exports = {
    BaseConnection: require('./connection/BaseConnection'),
    Hub: require('./Hub'),
    Myo: require('./Myo'),
    CircularBuffer: require('./CircularBuffer'),
    Pose: require('./Pose'),
    Quaternion: require('./Quaternion'),
    Vector3: require('./Vector3'),
    Frame: require('./Frame'),
    Version: require('./Version.js')
};

/**
 * Browserify exports global to the window object.
 * @namespace Myo
 */
global.Myo = Myo;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./CircularBuffer":5,"./Frame":6,"./Hub":7,"./Myo":9,"./Pose":10,"./Quaternion":11,"./Vector3":12,"./Version.js":13,"./connection/BaseConnection":14}],9:[function(require,module,exports){
var Myo = module.exports = function(context) {
    'use strict';
    var self = this;

    if (!context) {
        throw new Error('Missing context');
    }

    /**
     * @private
     *
     */
    self.context = context;
};

/**
 * A vibration lasting a small amount of time (VibrationLengthShort)
 */
Myo.VIBRATION_SHORT = 0;

/**
 * A vibration lasting a moderate amount of time (VibrationLengthMedium)
 */
Myo.VIBRATION_MEDIUM = 1;

/**
 * A vibration lasting a long amount of time (VibrationLengthLong)
 */
Myo.VIBRATION_LONG = 2;

/**
 * Unlock for a fixed period of time.
 */
Myo.UNLOCK_TIMED = 0;

/**
 * Unlock until explicitly told to re-lock.
 */
Myo.UNLOCK_HOLD = 1;

/**
 * User did a single, discrete action, such as pausing a video.
 */
Myo.USER_ACTION_SINGLE = 0;

/**
 * Request the RSSI of the Myo.
 *
 * <p>An onRssi event will likely be generated with the value of the RSSI.</p>
 *
 */
Myo.prototype.requestRssi = function() {
    'use strict';
    var self = this;

    self.context.send({
        'requestRssi': true
    });
};

/**
 * Engage the Myo's built in vibration motor.
 * @param length
 *
 */
Myo.prototype.vibrate = function(length) {
    'use strict';
    var self = this;

    switch (length) {
        case Myo.VIBRATION_SHORT:
            self.context.send({
                'command': 'vibrate',
                'args': [Myo.VIBRATION_SHORT]
            });
            break;
        case Myo.VIBRATION_MEDIUM:
            self.context.send({
                'command': 'vibrate',
                'args': [Myo.VIBRATION_MEDIUM]
            });
            break;
        case Myo.VIBRATION_LONG:
            self.context.send({
                'command': 'vibrate',
                'args': [Myo.VIBRATION_LONG]
            });
            break;
        default:
            throw new Error('Valid values are: Myo.VIBRATION_SHORT, Myo.VIBRATION_MEDIUM, Myo.VIBRATION_LONG');
    }
};

/**
 * Unlock the given Myo.
 * Can be called when a Myo is paired.
 *
 */
Myo.prototype.unlock = function(option) {
    'use strict';
    var self = this;

    switch (option) {
        case Myo.UNLOCK_TIMED:
            self.context.send({
                'command': 'unlock',
                'args': [Myo.UNLOCK_TIMED]
            });
            break;
        case Myo.UNLOCK_HOLD:
            self.context.send({
                'command': 'unlock',
                'args': [Myo.UNLOCK_HOLD]
            });
            break;
        default:
            throw new Error('Valid values are: Myo.UNLOCK_TIMED, Myo.UNLOCK_HOLD');
    }
};

/**
 * Lock the given Myo immediately.
 * Can be called when a Myo is paired.
 *
 */
Myo.prototype.lock = function() {
    'use strict';
    var self = this;

    self.context.send({
        'command': 'lock'
    });
};

/**
 * Notify the given Myo that a user action was recognized.
 * Can be called when a Myo is paired. Will cause Myo to vibrate.
 *
 */
Myo.prototype.notifyUserAction = function(action) {
    'use strict';
    var self = this;

    switch (action) {
        case Myo.USER_ACTION_SINGLE:
            self.context.send({
                'command': 'notifyUserAction',
                'args': [Myo.USER_ACTION_SINGLE]
            });
            break;
        default:
            throw new Error('Valid values are: Myo.USER_ACTION_SINGLE');
    }
};

},{}],10:[function(require,module,exports){
var Pose = module.exports = function(data) {
    'use strict';
    var self = this;

    if (typeof data !== 'object' || Object.prototype.toString.call(data) === '[object Array]') {
        throw new Error('Constructor parameter needs to be an object');
    }

    /**
     * Indicates whether this is a valid Pose object.
     */
    self.valid = !data.hasOwnProperty('invalid');

    if (self.valid) {
        if (!data.hasOwnProperty('type') || data.type !== parseInt(data.type, 10)) {
            throw new Error('Pose type needs to be of type integer');
        }
    }

    /**
     * The pose being recognized.
     */
    self.type = data.type;

    /**
     * Rest pose.
     */
    self.POSE_REST = 0;

    /**
     * User is making a fist.
     */
    self.POSE_FIST = 1;

    /**
     * User has an open palm rotated towards the posterior of their wrist.
     */
    self.POSE_WAVE_IN = 2;

    /**
     * User has an open palm rotated towards the anterior of their wrist.
     */
    self.POSE_WAVE_OUT = 3;

    /**
     * User has an open palm with their fingers spread away from each other.
     */
    self.POSE_FINGERS_SPREAD = 4;

    /**
     * User tapped their thumb and middle finger together twice in succession.
     */
    self.DOUBLE_TAP = 5;
};

Pose.prototype.isEqualTo = function(other) {
    'use strict';
    var self = this;

    return self.type === other.type;
};

/**
 * An invalid Pose object.
 *
 * You can use this Pose instance in comparisons testing
 * whether a given Pose instance is valid or invalid.
 *
 */
Pose.invalid = function() {
    'use strict';
    return new Pose({
        invalid: true
    });
};

/**
 * Return a human-readable string representation of the pose.
 * @return
 *
 */
Pose.prototype.toString = function() {
    'use strict';
    var self = this;

    if (!self.valid) {
        return '[Pose invalid]';
    }
    switch (self.type) {
        case self.POSE_REST:
            return '[Pose type:' + self.type.toString() + ' POSE_REST]';
        case self.POSE_FIST:
            return '[Pose type:' + self.type.toString() + ' POSE_FIST]';
        case self.POSE_WAVE_IN:
            return '[Pose type:' + self.type.toString() + ' POSE_WAVE_IN]';
        case self.POSE_WAVE_OUT:
            return '[Pose type:' + self.type.toString() + ' POSE_WAVE_OUT]';
        case self.POSE_FINGERS_SPREAD:
            return '[Pose type:' + self.type.toString() + ' POSE_FINGERS_SPREAD]';
        case self.DOUBLE_TAP:
            return '[Pose type:' + self.type.toString() + ' DOUBLE_TAP]';
        default:
            return '[Pose type:' + self.type.toString() + ']';
    }
};

},{}],11:[function(require,module,exports){
var Quaternion = module.exports = function(data) {
    'use strict';
    var self = this;

    /**
     * Indicates whether this is a valid Quaternion object.
     */
    self.valid = !data.hasOwnProperty('invalid');

    if (self.valid) {
        if (Object.prototype.toString.call(data) !== '[object Array]') {
            throw new Error('Components needs to be an array');
        }
        if (isNaN(data[0]) || isNaN(data[1]) || isNaN(data[2]) || isNaN(data[3])) {
            throw new Error('Component values needs to be integers or numbers');
        }
        self.x = data[0];
        self.y = data[1];
        self.z = data[2];
        self.w = data[3];
    } else {
        self.x = NaN;
        self.y = NaN;
        self.z = NaN;
        self.w = NaN;
    }
};

/**
 * A normalized copy of this quaternion.
 * A normalized quaternion has the same direction as the original
 * quaternion, but with a length of one.
 * @return {Quaternion} A Quaternion object with a length of one, pointing in the same direction as this Quaternion object.
 *
 */
Quaternion.prototype.normalized = function() {
    'use strict';
    var self = this,
        magnitude = Math.sqrt(self.x * self.x + self.y * self.y + self.z * self.z + self.w * self.w);

    return new Quaternion([
        self.x / magnitude,
        self.y / magnitude,
        self.z / magnitude,
        self.w / magnitude
    ]);
};

/**
 * A copy of this quaternion pointing in the opposite direction.
 *
 */
Quaternion.prototype.conjugate = function() {
    'use strict';
    var self = this;

    return new Quaternion([-self.x, -self.y, -self.z,
        self.w
    ]);
};

/**
 * Convert Quaternion to Euler angles.
 * @see http://www.euclideanspace.com/maths/geometry/rotations/conversions/quaternionToEuler/
 *
 */
Quaternion.prototype.toEuler = function() {
    'use strict';
    var self = this,
        test, heading, attitude, bank, sqx, sqy, sqz, sqw, unit;

    sqw = self.w * self.w;
    sqx = self.x * self.x;
    sqy = self.y * self.y;
    sqz = self.z * self.z;
    unit = sqx + sqy + sqz + sqw; // If normalised is one, otherwise is correction factor
    test = self.x * self.y + self.z * self.w;
    if (test > 0.499 * unit /* Singularity at north pole */ ) {
        heading = 2 * Math.atan2(self.x, self.w);
        attitude = Math.PI / 2;
        bank = 0;
        return;
    } else if (test < -0.499 * unit /* Singularity at south pole */ ) {
        heading = -2 * Math.atan2(self.x, self.w);
        attitude = -Math.PI / 2;
        bank = 0;
        return;
    } else {
        heading = Math.atan2(2 * self.y * self.w - 2 * self.x * self.z, sqx - sqy - sqz + sqw);
        attitude = Math.asin(2 * test / unit);
        bank = Math.atan2(2 * self.x * self.w - 2 * self.y * self.z, -sqx + sqy - sqz + sqw);
    }

    return {
        heading: heading, // Heading = rotation about y axis
        attitude: attitude, // Attitude = rotation about z axis
        bank: bank // Bank = rotation about x axis
    };
};

/**
 * Convert Quaternion to Euler angles (roll).
 *
 */
Quaternion.prototype.roll = function() {
    'use strict';
    var self = this;

    return Math.atan2(2 * self.y * self.w - 2 * self.x * self.z, 1 - 2 * self.y * self.y - 2 * self.z * self.z);
};

/**
 * Convert Quaternion to Euler angles (pitch).
 *
 */
Quaternion.prototype.pitch = function() {
    'use strict';
    var self = this;

    return Math.atan2(2 * self.x * self.w - 2 * self.y * self.z, 1 - 2 * self.x * self.x - 2 * self.z * self.z);
};

/**
 * Convert Quaternion to Euler angles (yaw).
 *
 */
Quaternion.prototype.yaw = function() {
    'use strict';
    var self = this;

    return Math.asin(2 * self.x * self.y + 2 * self.z * self.w);
};

/**
 * An invalid Quaternion object.
 *
 * You can use this Quaternion instance in comparisons testing
 * whether a given Quaternion instance is valid or invalid.
 *
 */
Quaternion.invalid = function() {
    'use strict';
    return new Quaternion({
        invalid: true
    });
};

/**
 * Returns a string containing this quaternion in a human readable format: (x, y, z, w).
 * @return
 *
 */
Quaternion.prototype.toString = function() {
    'use strict';
    var self = this;

    if (!self.valid) {
        return '[Quaternion invalid]';
    }
    return '[Quaternion x:' + self.x + ' y:' + self.y + ' z:' + self.z + ' w:' + self.w + ']';
};

},{}],12:[function(require,module,exports){
var Vector3 = module.exports = function(data) {
    'use strict';
    var self = this;

    if (!data) {
        throw new Error('Missing constructor arguments');
    }
    if (typeof data !== 'object') {
        throw new Error('Constructor parameter needs to be an object');
    }

    /**
     * Indicates whether this is a valid Vector3 object.
     */
    self.valid = !data.hasOwnProperty('invalid');

    if (self.valid) {
        if (!data || Object.prototype.toString.call(data) !== '[object Array]') {
            throw new Error('Components needs to be an array');
        }
        if (isNaN(data[0]) || isNaN(data[1]) || isNaN(data[2])) {
            throw new Error('Component values needs to be integers or numbers');
        }
        self.x = data[0];
        self.y = data[1];
        self.z = data[2];
    } else {
        self.x = NaN;
        self.y = NaN;
        self.z = NaN;
    }
};

/**
 * A copy of this vector pointing in the opposite direction.
 * @return {Vector3} A Vector3 object with all components negated.
 *
 */
Vector3.prototype.opposite = function() {
    'use strict';
    var self = this;

    return new Vector3([-self.x, -self.y, -self.z]);
};

/**
 * Add vectors component-wise.
 * @param other
 * @return {Vector3}
 *
 */
Vector3.prototype.plus = function(other) {
    'use strict';
    var self = this;

    return new Vector3([
        self.x + other.x,
        self.y + other.y,
        self.z + other.z
    ]);
};

/**
 * Add vectors component-wise and assign the value.
 * @param other
 * @return {Vector3} This Vector3.
 *
 */
Vector3.prototype.plusAssign = function(other) {
    'use strict';
    var self = this;

    self.x += other.x;
    self.y += other.y;
    self.z += other.z;
    return self;
};

/**
 * A copy of this vector pointing in the opposite direction (conjugate).
 * @param other
 * @return {Vector3}
 *
 */
Vector3.prototype.minus = function(other) {
    'use strict';
    var self = this;

    return new Vector3([
        self.x - other.x,
        self.y - other.y,
        self.z - other.z
    ]);
};

/**
 * A copy of this vector pointing in the opposite direction and assign the value.
 * @param other
 * @return {Vector3} This Vector3.
 *
 */
Vector3.prototype.minusAssign = function(other) {
    'use strict';
    var self = this;

    self.x -= other.x;
    self.y -= other.y;
    self.z -= other.z;
    return this;
};

/**
 * Multiply vector by a scalar.
 * @param scalar
 * @return {Vector3}
 *
 */
Vector3.prototype.multiply = function(scalar) {
    'use strict';
    var self = this;

    return new Vector3([
        self.x * scalar,
        self.y * scalar,
        self.z * scalar
    ]);
};

/**
 * Multiply vector by a scalar and assign the quotient.
 * @param scalar
 * @return {Vector3} This Vector3.
 *
 */
Vector3.prototype.multiplyAssign = function(scalar) {
    'use strict';
    var self = this;

    self.x *= scalar;
    self.y *= scalar;
    self.z *= scalar;
    return this;
};

/**
 * Divide vector by a scalar.
 * @param scalar
 * @return {Vector3}
 *
 */
Vector3.prototype.divide = function(scalar) {
    'use strict';
    var self = this;

    return new Vector3([
        self.x / scalar,
        self.y / scalar,
        self.z / scalar
    ]);
};

/**
 * Divide vector by a scalar and assign the value.
 * @param scalar
 * @return {Vector3} This Vector3.
 *
 */
Vector3.prototype.divideAssign = function(scalar) {
    'use strict';
    var self = this;

    self.x /= scalar;
    self.y /= scalar;
    self.z /= scalar;
    return this;
};

/**
 * Compare Vector equality/inequality component-wise.
 * @param other The Vector3 to compare with.
 * @return {boolean} true; if equal, false otherwise.
 *
 */
Vector3.prototype.isEqualTo = function(other) {
    'use strict';
    var self = this;

    return !(self.x !== other.x || self.y !== other.y || self.z !== other.z);
};

/**
 * The angle between this vector and the specified vector in radians.
 *
 * <p>The angle is measured in the plane formed by the two vectors.
 * The angle returned is always the smaller of the two conjugate angles.
 * Thus <code>A.angleTo(B) === B.angleTo(A)</code> and is always a positive value less
 * than or equal to pi radians (180 degrees).</p>
 *
 * <p>If either vector has zero length, then this function returns zero.</p>
 *
 * @param other A Vector object.
 * @return {number} The angle between this vector and the specified vector in radians.
 *
 */
Vector3.prototype.angleTo = function(other) {
    'use strict';
    var self = this,
        denom = self.magnitudeSquared() * other.magnitudeSquared();
    if (denom <= 0) {
        return 0;
    } else {
        return Math.acos(self.dot(other) / Math.sqrt(denom));
    }
};

/**
 * The cross product of this vector and the specified vector.
 *
 * The cross product is a vector orthogonal to both original vectors.
 * It has a magnitude equal to the area of a parallelogram having the
 * two vectors as sides. The direction of the returned vector is
 * determined by the right-hand rule. Thus <code>A.cross(B) === -B.cross(A)</code>.
 *
 * @param other A Vector object.
 * @return {Vector3} The cross product of this vector and the specified vector.
 *
 */
Vector3.prototype.cross = function(other) {
    'use strict';
    var self = this;

    return new Vector3([
        (self.y * other.z) - (self.z * other.y), (self.z * other.x) - (self.x * other.z), (self.x * other.y) - (self.y * other.x)
    ]);
};

/**
 * The distance between the point represented by this Vector
 * object and a point represented by the specified Vector object.
 *
 * @param other A Vector object.
 * @return {number} The distance from this point to the specified point.
 *
 */
Vector3.prototype.distanceTo = function(other) {
    'use strict';
    var self = this;

    return Math.sqrt((self.x - other.x) * (self.x - other.x) + (self.y - other.y) * (self.y - other.y) + (self.z - other.z) * (self.z - other.z));
};

/**
 * The dot product of this vector with another vector.
 * The dot product is the magnitude of the projection of this vector
 * onto the specified vector.
 *
 * @param other A Vector object.
 * @return {number} The dot product of this vector and the specified vector.
 *
 */
Vector3.prototype.dot = function(other) {
    'use strict';
    var self = this;

    return (self.x * other.x) + (self.y * other.y) + (self.z * other.z);
};

/**
 * Returns true if all of the vector's components are finite.
 * @return {boolean} If any component is NaN or infinite, then this returns false.
 *
 */
Vector3.prototype.isValid = function() {
    'use strict';
    var self = this;

    return (self.x <= Number.MAX_VALUE && self.x >= -Number.MAX_VALUE) && (self.y <= Number.MAX_VALUE && self.y >= -Number.MAX_VALUE) && (self.z <= Number.MAX_VALUE && self.z >= -Number.MAX_VALUE);
};

/**
 * The magnitude, or length, of this vector.
 * The magnitude is the L2 norm, or Euclidean distance between the
 * origin and the point represented by the (x, y, z) components
 * of this Vector object.
 *
 * @return {number} The length of this vector.
 *
 */
Vector3.prototype.magnitude = function() {
    'use strict';
    var self = this;

    return Math.sqrt(self.x * self.x + self.y * self.y + self.z * self.z);
};

/**
 * The square of the magnitude, or length, of this vector.
 * @return {number} The square of the length of this vector.
 *
 */
Vector3.prototype.magnitudeSquared = function() {
    'use strict';
    var self = this;

    return self.x * self.x + self.y * self.y + self.z * self.z;
};

/**
 * A normalized copy of this vector.
 * A normalized vector has the same direction as the original
 * vector, but with a length of one.
 * @return {Vector3} A Vector object with a length of one, pointing in the same direction as this Vector object.
 *
 */
Vector3.prototype.normalized = function() {
    'use strict';
    var self = this,
        denom = self.magnitudeSquared();
    if (denom <= 0) {
        return new Vector3([
            0,
            0,
            0
        ]);
    }

    denom = 1 / Math.sqrt(denom);
    return new Vector3([
        self.x * denom,
        self.y * denom,
        self.z * denom
    ]);
};

/**
 * The pitch angle in radians.
 * Pitch is the angle between the negative z-axis and the projection
 * of the vector onto the y-z plane. In other words, pitch represents
 * rotation around the x-axis. If the vector points upward, the
 * returned angle is between 0 and pi radians (180 degrees); if it
 * points downward, the angle is between 0 and -pi radians.
 *
 * @return {number} The angle of this vector above or below the horizon (x-z plane).
 *
 */
Vector3.prototype.pitch = function() {
    'use strict';
    var self = this;

    return Math.atan2(self.y, -self.z);
};

/**
 * The yaw angle in radians.
 * Yaw is the angle between the negative z-axis and the projection
 * of the vector onto the x-z plane. In other words, yaw represents
 * rotation around the y-axis. If the vector points to the right of
 * the negative z-axis, then the returned angle is between 0 and pi
 * radians (180 degrees); if it points to the left, the angle is
 * between 0 and -pi radians.
 *
 * @return {number} The angle of this vector to the right or left of the negative z-axis.
 *
 */
Vector3.prototype.yaw = function() {
    'use strict';
    var self = this;

    return Math.atan2(self.x, -self.z);
};

/**
 * The roll angle in radians.
 * Roll is the angle between the y-axis and the projection of the vector
 * onto the x-y plane. In other words, roll represents rotation around
 * the z-axis. If the vector points to the left of the y-axis, then the
 * returned angle is between 0 and pi radians (180 degrees); if it
 * points to the right, the angle is between 0 and -pi radians.
 *
 * Use this function to get roll angle of the plane to which this vector
 * is a normal. For example, if this vector represents the normal to
 * the palm, then this function returns the tilt or roll of the palm
 * plane compared to the horizontal (x-z) plane.
 *
 * @return {number} The angle of this vector to the right or left of the y-axis.
 *
 */
Vector3.prototype.roll = function() {
    'use strict';
    var self = this;

    return Math.atan2(self.x, -self.y);
};

/**
 * The zero vector: (0, 0, 0)
 * @return {Vector3}
 *
 */
Vector3.zero = function() {
    'use strict';
    return new Vector3([
        0,
        0,
        0
    ]);
};

/**
 * The x-axis unit vector: (1, 0, 0)
 * @return {Vector3}
 *
 */
Vector3.xAxis = function() {
    'use strict';
    return new Vector3([
        1,
        0,
        0
    ]);
};

/**
 * The y-axis unit vector: (0, 1, 0)
 * @return {Vector3}
 *
 */
Vector3.yAxis = function() {
    'use strict';
    return new Vector3([
        0,
        1,
        0
    ]);
};

/**
 * The z-axis unit vector: (0, 0, 1)
 * @return {Vector3}
 *
 */
Vector3.zAxis = function() {
    'use strict';
    return new Vector3([
        0,
        0,
        1
    ]);
};

/**
 * The unit vector pointing left along the negative x-axis: (-1, 0, 0)
 * @return {Vector3}
 *
 */
Vector3.left = function() {
    'use strict';
    return new Vector3([-1,
        0,
        0
    ]);
};

/**
 * The unit vector pointing right along the positive x-axis: (1, 0, 0)
 * @return {Vector3}
 *
 */
Vector3.right = function() {
    'use strict';
    var self = this;

    return self.xAxis();
};

/**
 * The unit vector pointing down along the negative y-axis: (0, -1, 0)
 * @return {Vector3}
 *
 */
Vector3.down = function() {
    'use strict';
    return new Vector3([
        0, -1,
        0
    ]);
};

/**
 * The unit vector pointing up along the positive x-axis: (0, 1, 0)
 * @return {Vector3}
 *
 */
Vector3.up = function() {
    'use strict';
    var self = this;

    return self.yAxis();
};

/**
 * The unit vector pointing forward along the negative z-axis: (0, 0, -1)
 * @return {Vector3}
 *
 */
Vector3.forward = function() {
    'use strict';
    return new Vector3([
        0,
        0, -1
    ]);
};

/**
 * The unit vector pointing backward along the positive z-axis: (0, 0, 1)
 * @return {Vector3}
 *
 */
Vector3.backward = function() {
    'use strict';
    var self = this;

    return self.zAxis();
};

/**
 * An invalid Vector3 object.
 *
 * You can use this Vector3 instance in comparisons testing
 * whether a given Vector3 instance is valid or invalid.
 * @return {Vector3}
 *
 */
Vector3.invalid = function() {
    'use strict';
    return new Vector3({
        invalid: true
    });
};

/**
 * Returns a string containing this vector in a human readable format: (x, y, z).
 * @return {String}
 *
 */
Vector3.prototype.toString = function() {
    'use strict';
    var self = this;

    if (!self.valid) {
        return '[Vector3 invalid]';
    }
    return '[Vector3 x:' + self.x + ' y:' + self.y + ' z:' + self.z + ']';
};

},{}],13:[function(require,module,exports){
// This file is automatically updated from package.json by grunt.
module.exports = {
    full: '0.15.2',
    major: 0,
    minor: 155555,
    dot: 2
};

},{}],14:[function(require,module,exports){
(function (process){
var Frame = require('../Frame'),
    EventEmitter = require('events').EventEmitter,
    _ = require('underscore');

var BaseConnection = module.exports = function(options) {
    'use strict';
    var self = this;

    if (options) {
        if (typeof options !== 'object') {
            throw new Error('Constructor parameter needs to be an object');
        }
        if (!options.hasOwnProperty('host') || typeof options.host !== 'string') {
            throw new Error('Host needs to be of type string');
        }
        if (!options.hasOwnProperty('port') || options.port !== parseInt(options.port, 10)) {
            throw new Error('Port needs to be of type integer');
        }
    }

    self.options = _.defaults(options || {}, {
        host: '127.0.0.1',
        port: 6450
    });

    self.host = self.options.host;
    self.port = self.options.port;
    self.connected = false;
};

BaseConnection.prototype.getUrl = function() {
    'use strict';
    var self = this;

    return 'ws://' + self.host + ':' + self.port + '/';
};

BaseConnection.prototype.handleOpen = function() {
    'use strict';
    var self = this;

    if (!self.connected) {
        self.send({
            'command': 'requestDeviceInfo'
        });
        return 'connecting';
    } else {
        return 'connected';
    }
};

BaseConnection.prototype.handleClose = function() {
    'use strict';
    var self = this;

    if (self.connected) {
        self.disconnect();
        self.startReconnection();
        return 'disconnecting';
    } else {
        return 'disconnected';
    }
};

BaseConnection.prototype.startReconnection = function() {
    'use strict';
    var self = this,
        connection = this;
    if (!self.reconnectionTimer) {
        self.reconnectionTimer = setInterval(function() {
            connection.reconnect();
        }, 500);
        return 'reconnecting';
    } else {
        return 'already reconnecting';
    }
};

BaseConnection.prototype.stopReconnection = function() {
    'use strict';
    var self = this;

    self.reconnectionTimer = clearInterval(self.reconnectionTimer);
};

// By default, disconnect will prevent auto-reconnection.
// Pass in true to allow the reconnection loop not be interrupted continue
BaseConnection.prototype.disconnect = function(allowReconnect) {
    'use strict';
    var self = this;

    if (!allowReconnect) {
        self.stopReconnection();
    }
    if (!self.socket) {
        return;
    }
    self.socket.close();
    delete self.socket;
    if (self.connected) {
        self.connected = false;
        self.emit('disconnect');
    }
    return true;
};

BaseConnection.prototype.reconnect = function() {
    'use strict';
    var self = this;

    if (self.connected) {
        self.stopReconnection();
        return 'stopReconnection';
    } else {
        self.disconnect(true);
        self.connect();
        return 'connect';
    }
};

BaseConnection.prototype.handleData = function(data) {
    'use strict';
    var self = this,
        message, frameObject, frame, deviceInfo;

    if (!data) {
        throw new Error('No data received');
    }

    // TODO Profile performance of this try/catch block
    try {
        message = JSON.parse(data);
    } catch (exception) {
        throw new Error('Invalid JSON');
    }

    // Wait for deviceInfo until connected
    if (!self.connected && message.hasOwnProperty('frame')) {
        frame = message.frame;
        if (frame.hasOwnProperty('deviceInfo')) {
            deviceInfo = frame.deviceInfo;
            self.emit('deviceInfo', deviceInfo);
            self.connected = true;
            self.emit('connect');
            return;
        }
    }

    if (!self.connected) {
        return;
    }

    if (message.hasOwnProperty('frame')) {
        frameObject = new Frame(message.frame);
        self.emit(frameObject.type, frameObject);

        // Emit pose if existing
        if (frameObject.pose) {
            self.emit('pose', frameObject.pose);
        }

        // Emit event if existing
        if (frameObject.event) {
            self.emit('event', frameObject.event);
        }
    }
};

BaseConnection.prototype.connect = function() {
    'use strict';
    var self = this;

    if (self.socket) {
        return 'socket already created';
    }

    self.emit('ready');

    var inNode = (typeof(process) !== 'undefined' && process.versions && process.versions.node),
        connection = this,
        ConnectionType;

    if (inNode) {
        ConnectionType = require('ws');
        self.socket = new ConnectionType(self.getUrl());
    } else {
        self.socket = new WebSocket(self.getUrl());
    }

    self.socket.onopen = function() {
        connection.handleOpen();
    };
    self.socket.onclose = function(data) {
        connection.handleClose(data.code, data.reason);
    };
    self.socket.onmessage = function(message) {
        connection.handleData(message.data);
    };
    self.socket.onerror = function(data) {
        connection.handleClose('connectError', data.data);
    };

    return true;
};

BaseConnection.prototype.send = function(data) {
    'use strict';
    var self = this;

    if (typeof data !== 'object' || typeof data === 'string') {
        throw new Error('Parameter needs to be an object');
    }
    self.socket.send(JSON.stringify(data));
};

_.extend(BaseConnection.prototype, EventEmitter.prototype);

}).call(this,require('_process'))
},{"../Frame":6,"_process":2,"events":1,"underscore":3,"ws":4}]},{},[8]);

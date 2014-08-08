/*! 
 * MyoJS v0.8.6
 * https://github.com/logotype/myojs.git
 * 
 * Copyright 2014 Victor Norgren
 * Released under the MIT license
 */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
      } else {
        throw TypeError('Uncaught, unspecified "error" event.');
      }
      return false;
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

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

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
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],3:[function(require,module,exports){
//     Underscore.js 1.6.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.6.0';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return obj;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, length = obj.length; i < length; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      var keys = _.keys(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
      }
    }
    return obj;
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var result;
    any(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(predicate, context);
    each(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, function(value, index, list) {
      return !predicate.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(predicate, context);
    each(obj, function(value, index, list) {
      if (!(result = result && predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(predicate, context);
    each(obj, function(value, index, list) {
      if (result || (result = predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matches(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matches(attrs));
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    var result = -Infinity, lastComputed = -Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed > lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    var result = Infinity, lastComputed = Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed < lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Shuffle an array, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (obj.length !== +obj.length) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return value;
    return _.property(value);
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {
    iterator = lookupIterator(iterator);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iterator.call(context, value, index, list)
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
    return function(obj, iterator, context) {
      var result = {};
      iterator = lookupIterator(iterator);
      each(obj, function(value, index) {
        var key = iterator.call(context, value, index, obj);
        behavior(result, key, value);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, key, value) {
    _.has(result, key) ? result[key].push(value) : result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, key, value) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, key) {
    _.has(result, key) ? result[key]++ : result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[0];
    if (n < 0) return [];
    return slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[array.length - 1];
    return slice.call(array, Math.max(array.length - n, 0));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    each(input, function(value) {
      if (_.isArray(value) || _.isArguments(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Split an array into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(array, predicate) {
    var pass = [], fail = [];
    each(array, function(elem) {
      (predicate(elem) ? pass : fail).push(elem);
    });
    return [pass, fail];
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.contains(other, item);
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var length = _.max(_.pluck(arguments, 'length').concat(0));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, '' + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(length);

    while(idx < length) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    return function() {
      var position = 0;
      var args = boundArgs.slice();
      for (var i = 0, length = args.length; i < length; i++) {
        if (args[i] === _) args[i] = arguments[position++];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return func.apply(this, args);
    };
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) throw new Error('bindAll must be passed function names');
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
        context = args = null;
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
      if (last < wait) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) {
        timeout = setTimeout(later, wait);
      }
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = new Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = new Array(length);
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
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
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

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             _.isFunction(bCtor) && (bCtor instanceof bCtor))
                        && ('constructor' in a && 'constructor' in b)) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
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
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  _.constant = function(value) {
    return function () {
      return value;
    };
  };

  _.property = function(key) {
    return function(obj) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
  _.matches = function(attrs) {
    return function(obj) {
      if (obj === attrs) return true; //avoid comparing an object to itself.
      for (var key in attrs) {
        if (attrs[key] !== obj[key])
          return false;
      }
      return true;
    }
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(Math.max(0, n));
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
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
  _.now = Date.now || function() { return new Date().getTime(); };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
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
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

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
}).call(this);

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
  this.pos = 0;
  this._buf = [];
  this.size = size;
};

CircularBuffer.prototype.get = function(i) {
  if (i == undefined) i = 0;
  if (i >= this.size) return undefined;
  if (i >= this._buf.length) return undefined;
  return this._buf[(this.pos - i - 1) % this.size];
};

CircularBuffer.prototype.push = function(o) {
  this._buf[this.pos % this.size] = o;
  return this.pos++;
};

},{}],6:[function(require,module,exports){
var Hub = require("./Hub"),
    Myo = require("./Myo"),
    Pose = require("./Pose"),
    Quaternion = require("./Quaternion"),
    Vector3 = require("./Vector3"),
    _ = require("underscore");

var Frame = module.exports = function (data) {
    /**
     * A unique ID for this Frame. Consecutive frames processed by the Myo
     * have consecutive increasing values.
     * @member id
     * @memberof Myo.Frame.prototype
     * @type {number}
     */
    this.id = data.id;

    /**
     * The frame capture time in microseconds elapsed since the Myo started.
     * @member timestamp
     * @memberof Myo.Frame.prototype
     * @type {number}
     */
    this.timestamp = data.timestamp;

    if (data["euler"]) {
        this.euler = data["euler"];
    }

    /**
     * A change in pose has been detected.
     * @member pose
     * @memberof Myo.Pose.prototype
     * @type {Pose}
     */
    if (data["pose"]) {
        this.pose = new Pose(data["pose"]);
    } else {
        this.pose = Pose.invalid();
    }

    /**
     * A change in pose has been detected.
     * @member pose
     * @memberof Myo.Pose.prototype
     * @type {Pose}
     */
    if (data["rotation"]) {
        this.rotation = new Quaternion(data["rotation"]);
    } else {
        this.rotation = Quaternion.invalid();
    }

    if (data["accel"]) {
        this.accel = new Vector3(data["accel"]);
    } else {
        this.accel = Vector3.invalid();
    }

    if (data["gyro"]) {
        this.gyro = new Vector3(data["gyro"]);
    } else {
        this.gyro = Vector3.invalid();
    }

    this.data = data;
    this.type = 'frame';
};


/**
 * Returns a string containing this Frame in a human readable format.
 * @return
 *
 */
Frame.prototype.toString = function () {
    return "[Frame id:" + this.id + " timestamp:" + this.timestamp + " accel:" + this.accel.toString() + "]";
};
},{"./Hub":7,"./Myo":9,"./Pose":10,"./Quaternion":11,"./Vector3":12,"underscore":3}],7:[function(require,module,exports){
var BaseConnection = require('./connection/BaseConnection').BaseConnection,
    EventEmitter = require('events').EventEmitter,
    CircularBuffer = require("./CircularBuffer"),
    _ = require('underscore');

var Hub = module.exports = function (data, opt) {
    this.connectionType = require('./connection/BaseConnection');
    this.myoType = require('./Myo');
    this.connection = new this.connectionType(opt);
    this.historyType = require('./CircularBuffer');
    this.history = new this.historyType(200);
    this.myos = [];
    this.listeners = [];

    var hub = this;

    // Forward events
    this.connection.on('deviceInfo', function (data) {
        hub.myo = new hub.myoType(data, hub.connection);
    });

    // Forward events
    this.connection.on('frame', function (frame) {
        hub.history.push(frame);
        hub.emit('frame', frame);
    });
    this.connection.on('pose', function (pose) {
        hub.emit('pose', pose);
    });
    this.connection.on('ready', function () {
        hub.emit('ready');
    });
    this.connection.on('connect', function () {
        hub.emit('connect');
    });
    this.connection.on('disconnect', function () {
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
Hub.prototype.frame = function (num) {
    return this.history.get(num) || null;
};

/**
 * Find a nearby Myo and pair with it, or time out after timeoutMilliseconds milliseconds if provided.
 *
 * <p>If timeout_ms is zero, this function blocks until a Myo is found. This function must
 * not be run concurrently with run() or runOnce().</p>
 */
Hub.prototype.waitForMyo = function (timeoutMilliseconds) {
    var myo = this.connection.send({
        "waitForMyo": timeoutMilliseconds
    });
    if (myo) {
        myo.context = this.connection;
        this.myos.push(myo);
        return myo;
    }

    return null;
};

/**
 * Register a listener to be called when device events occur.
 */
Hub.prototype.addListener = function (listener) {
    this.listeners.push(listener);
    this.connection.send({
        "addListener": listener
    });
};

/**
 * Remove a previously registered listener.
 */
Hub.prototype.removeListener = function (listener) {
    var i = 0;
    for (i; i < this.listeners.length; i++) {
        if (this.listeners[i] == listener) {
            this.listeners.splice(i, 1);
            break;
        }
    }
};

/**
 * Run the event loop for the specified duration (in milliseconds).
 */
Hub.prototype.run = function (durationMilliseconds) {
    this.connection.send({
        "run": durationMilliseconds
    });
};

/**
 * Run the event loop until a single event occurs, or the specified
 * duration (in milliseconds) has elapsed.
 */
Hub.prototype.runOnce = function (durationMilliseconds) {
    this.connection.send({
        "runOnce": durationMilliseconds
    });
};

_.extend(Hub.prototype, EventEmitter.prototype);

},{"./CircularBuffer":5,"./Myo":9,"./connection/BaseConnection":14,"events":1,"underscore":3}],8:[function(require,module,exports){
/**
 * Myo is the global namespace of the Myo API.
 * @namespace Myo
 */
module.exports = {
    Hub: require("./Hub"),
    Myo: require("./Myo"),
    CircularBuffer: require("./CircularBuffer"),
    Pose: require("./Pose"),
    Quaternion: require("./Quaternion"),
    Vector3: require("./Vector3"),
    Frame: require("./Frame"),
    Version: require('./Version.js')
};
},{"./CircularBuffer":5,"./Frame":6,"./Hub":7,"./Myo":9,"./Pose":10,"./Quaternion":11,"./Vector3":12,"./Version.js":13}],9:[function(require,module,exports){
var EventEmitter = require('events').EventEmitter;

var Myo = module.exports = function (data, context) {
    /**
     * A vibration lasting a small amount of time (VibrationLengthShort)
     */
    this.VIBRATION_SHORT = 0;

    /**
     * A vibration lasting a moderate amount of time (VibrationLengthMedium)
     */
    this.VIBRATION_MEDIUM = 1;

    /**
     * A vibration lasting a long amount of time (VibrationLengthLong)
     */
    this.VIBRATION_LONG = 2;

    /**
     * @private
     * Native Extension context object.
     *
     */
    this.context = context;
};

/**
 * Request the RSSI of the Myo.
 *
 * <p>An onRssi event will likely be generated with the value of the RSSI.</p>
 *
 */
Myo.prototype.requestRssi = function () {
    this.context.send({
        "requestRssi": true
    });
};

/**
 * Engage the Myo's built in vibration motor.
 * @param length
 *
 */
Myo.prototype.vibrate = function (length) {
    switch (length) {
        case this.VIBRATION_SHORT:
            this.context.send({"command":"vibrate", "args" : [this.VIBRATION_SHORT]});
            break;
        case this.VIBRATION_MEDIUM:
            this.context.send({"command":"vibrate", "args" : [this.VIBRATION_MEDIUM]});
            break;
        case this.VIBRATION_LONG:
            this.context.send({"command":"vibrate", "args" : [this.VIBRATION_LONG]});
            break;
        default:
            throw new Error("Valid values are: Myo.VIBRATION_SHORT, Myo.VIBRATION_MEDIUM, Myo.VIBRATION_LONG");
            break;
    }
};
},{"events":1}],10:[function(require,module,exports){
var Pose = module.exports = function (data) {
    /**
     * Indicates whether this is a valid Pose object.
     */
    this.valid = data.hasOwnProperty("invalid") ? false : true;

    /**
     * The pose being recognized.
     */
    this.type = data.type;

    /**
     * Default pose type when no pose is being made (PoseTypeNone)
     */
    this.POSE_REST = 0;

    /**
     * Clenching fingers together to make a fist (PoseTypeFist)
     */
    this.POSE_FIST = 1;

    /**
     * Turning your palm towards yourself (PoseTypeWaveIn)
     */
    this.POSE_WAVE_IN = 2;

    /**
     * Turning your palm away from yourself (PoseTypeWaveOut)
     */
    this.POSE_WAVE_OUT = 3;

    /**
     * Spreading your fingers and extending your palm (PoseTypeFingersSpread)
     */
    this.POSE_FINGERS_SPREAD = 4;

    /**
     * Thumb to pinky (unlock)
     */
    this.POSE_RESERVED_1 = 5;

    /**
     * Thumb to pinky (unlock)
     */
    this.POSE_THUMB_TO_PINKY = 6;
};

Pose.prototype.isEqualTo = function (other) {
    return this.type == other.type;
};

/**
 * An invalid Pose object.
 *
 * You can use this Pose instance in comparisons testing
 * whether a given Pose instance is valid or invalid.
 *
 */
Pose.invalid = function() {
    return new Pose({ invalid: true, type: 65536 });
};

/**
 * Return a human-readable string representation of the pose.
 * @return
 *
 */
Pose.prototype.toString = function () {
    if(!this.valid) {
        return "[Pose invalid]";
    }
    switch (this.type) {
        case this.POSE_REST:
            return "[Pose type:" + this.type.toString() + " POSE_NONE]";
            break;
        case this.POSE_FIST:
            return "[Pose type:" + this.type.toString() + " POSE_FIST]";
            break;
        case this.POSE_WAVE_IN:
            return "[Pose type:" + this.type.toString() + " POSE_WAVE_IN]";
            break;
        case this.POSE_WAVE_OUT:
            return "[Pose type:" + this.type.toString() + " POSE_WAVE_OUT]";
            break;
        case this.POSE_FINGERS_SPREAD:
            return "[Pose type:" + this.type.toString() + " POSE_FINGERS_SPREAD]";
            break;
        case this.POSE_RESERVED_1:
            return "[Pose type:" + this.type.toString() + " POSE_RESERVED_1]";
            break;
        case this.POSE_THUMB_TO_PINKY:
            return "[Pose type:" + this.type.toString() + " POSE_THUMB_TO_PINKY]";
            break;
        default:
            break;
    }
    return "[Pose type:" + this.type.toString() + "]";
};
},{}],11:[function(require,module,exports){
var Quaternion = module.exports = function (data) {
    /**
     * Indicates whether this is a valid Quaternion object.
     */
    this.valid = data.hasOwnProperty("invalid") ? false : true;

    if(this.valid) {
        this.x = data[0];
        this.y = data[1];
        this.z = data[2];
        this.w = data[3];
    } else {
        this.x = NaN;
        this.y = NaN;
        this.z = NaN;
        this.w = NaN;
    }
};

Quaternion.prototype.normalized = function () {
    var magnitude = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    return new Quaternion({
        x: this.x / magnitude,
        y: this.y / magnitude,
        z: this.z / magnitude,
        w: this.w / magnitude
    });
};

Quaternion.prototype.conjugate = function () {
    return new Quaternion({
        x: -this.x,
        y: -this.y,
        z: -this.z,
        w: this.w
    });
};

Quaternion.prototype.roll = function (rotation) {
    return Math.atan2(2 * rotation.y * rotation.w - 2 * rotation.x * rotation.z, 1 - 2 * rotation.y * rotation.y - 2 * rotation.z * rotation.z);
};

Quaternion.prototype.pitch = function (rotation) {
    return Math.atan2(2 * rotation.x * rotation.w - 2 * rotation.y * rotation.z, 1 - 2 * rotation.x * rotation.x - 2 * rotation.z * rotation.z);
};

Quaternion.prototype.yaw = function (rotation) {
    return Math.asin(2 * rotation.x * rotation.y + 2 * rotation.z * rotation.w);
};

/**
 * An invalid Quaternion object.
 *
 * You can use this Quaternion instance in comparisons testing
 * whether a given Quaternion instance is valid or invalid.
 *
 */
Quaternion.invalid = function() {
    return new Quaternion({ invalid: true,
        x: NaN,
        y: NaN,
        z: NaN
    });
};

/**
 * Returns a string containing this quaternion in a human readable format: (x, y, z, w).
 * @return
 *
 */
Quaternion.prototype.toString = function () {
    if(!this.valid) {
        return "[Quaternion invalid]";
    }
    return "[Quaternion x:" + this.x + " y:" + this.y + " z:" + this.z + " w:" + this.w + "]";
};
},{}],12:[function(require,module,exports){
var Vector3 = module.exports = function (data) {
    /**
     * Indicates whether this is a valid Vector3 object.
     */
    this.valid = data.hasOwnProperty("invalid") ? false : true;

    if(this.valid) {
        this.x = data[0];
        this.y = data[1];
        this.z = data[2];
    } else {
        this.x = NaN;
        this.y = NaN;
        this.z = NaN;
    }
};

/**
 * A copy of this vector pointing in the opposite direction.
 * @return A Vector3 object with all components negated.
 *
 */
Vector3.prototype.opposite = function () {
    return new Vector3({
        x: -this.x,
        y: -this.y,
        z: -this.z
    });
};

/**
 * Add vectors component-wise.
 * @param other
 * @return
 *
 */
Vector3.prototype.plus = function (other) {
    return new Vector3({
        x: this.x + other.x,
        y: this.y + other.y,
        z: this.z + other.z
    });
};

/**
 * Add vectors component-wise and assign the value.
 * @param other
 * @return This Vector3.
 *
 */
Vector3.prototype.plusAssign = function (other) {
    this.x += other.x;
    this.y += other.y;
    this.z += other.z;
    return this;
};

/**
 * A copy of this vector pointing in the opposite direction.
 * @param other
 * @return
 *
 */
Vector3.prototype.minus = function (other) {
    return new Vector3({
        x: this.x - other.x,
        y: this.y - other.y,
        z: this.z - other.z
    });
};

/**
 * A copy of this vector pointing in the opposite direction and assign the value.
 * @param other
 * @return This Vector3.
 *
 */
Vector3.prototype.minusAssign = function (other) {
    this.x -= other.x;
    this.y -= other.y;
    this.z -= other.z;
    return this;
};

/**
 * Multiply vector by a scalar.
 * @param scalar
 * @return
 *
 */
Vector3.prototype.multiply = function (scalar) {
    return new Vector3({
        x: this.x * scalar,
        y: this.y * scalar,
        z: this.z * scalar
    });
};

/**
 * Multiply vector by a scalar and assign the quotient.
 * @param scalar
 * @return This Vector3.
 *
 */
Vector3.prototype.multiplyAssign = function (scalar) {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
    return this;
};

/**
 * Divide vector by a scalar.
 * @param scalar
 * @return
 *
 */
Vector3.prototype.divide = function (scalar) {
    return new Vector3({
        x: this.x / scalar,
        y: this.y / scalar,
        z: this.z / scalar
    });
};

/**
 * Divide vector by a scalar and assign the value.
 * @param scalar
 * @return This Vector3.
 *
 */
Vector3.prototype.divideAssign = function (scalar) {
    this.x /= scalar;
    this.y /= scalar;
    this.z /= scalar;
    return this;
};

/**
 * Compare Vector equality/inequality component-wise.
 * @param other The Vector3 to compare with.
 * @return True; if equal, False otherwise.
 *
 */
Vector3.prototype.isEqualTo = function (other) {
    if (this.x != other.x || this.y != other.y || this.z != other.z)
        return false;
    else
        return true;
};

/**
 * The angle between this vector and the specified vector in radians.
 *
 * <p>The angle is measured in the plane formed by the two vectors.
 * The angle returned is always the smaller of the two conjugate angles.
 * Thus <code>A.angleTo(B) == B.angleTo(A)</code> and is always a positive value less
 * than or equal to pi radians (180 degrees).</p>
 *
 * <p>If either vector has zero length, then this function returns zero.</p>
 *
 * @param other A Vector object.
 * @return The angle between this vector and the specified vector in radians.
 *
 */
Vector3.prototype.angleTo = function (other) {
    var denom = this.magnitudeSquared() * other.magnitudeSquared();
    if (denom <= 0)
        return 0;

    return Math.acos(this.dot(other) / Math.sqrt(denom));
};

/**
 * The cross product of this vector and the specified vector.
 *
 * The cross product is a vector orthogonal to both original vectors.
 * It has a magnitude equal to the area of a parallelogram having the
 * two vectors as sides. The direction of the returned vector is
 * determined by the right-hand rule. Thus <code>A.cross(B) == -B.cross(A)</code>.
 *
 * @param other A Vector object.
 * @return The cross product of this vector and the specified vector.
 *
 */
Vector3.prototype.cross = function (other) {
    return new Vector3({
        x: (this.y * other.z) - (this.z * other.y),
        y: (this.z * other.x) - (this.x * other.z),
        z: (this.x * other.y) - (this.y * other.x)
    });
};

/**
 * The distance between the point represented by this Vector
 * object and a point represented by the specified Vector object.
 *
 * @param other A Vector object.
 * @return The distance from this point to the specified point.
 *
 */
Vector3.prototype.distanceTo = function (other) {
    return Math.sqrt((this.x - other.x) * (this.x - other.x) + (this.y - other.y) * (this.y - other.y) + (this.z - other.z) * (this.z - other.z));
};

/**
 * The dot product of this vector with another vector.
 * The dot product is the magnitude of the projection of this vector
 * onto the specified vector.
 *
 * @param other A Vector object.
 * @return The dot product of this vector and the specified vector.
 *
 */
Vector3.prototype.dot = function (other) {
    return (this.x * other.x) + (this.y * other.y) + (this.z * other.z);
};

/**
 * Returns true if all of the vector's components are finite.
 * @return If any component is NaN or infinite, then this returns false.
 *
 */
Vector3.prototype.isValid = function () {
    return (this.x <= Number.MAX_VALUE && this.x >= -Number.MAX_VALUE) && (this.y <= Number.MAX_VALUE && this.y >= -Number.MAX_VALUE) && (this.z <= Number.MAX_VALUE && this.z >= -Number.MAX_VALUE);
};

/**
 * The magnitude, or length, of this vector.
 * The magnitude is the L2 norm, or Euclidean distance between the
 * origin and the point represented by the (x, y, z) components
 * of this Vector object.
 *
 * @return The length of this vector.
 *
 */
Vector3.prototype.magnitude = function () {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
};

/**
 * The square of the magnitude, or length, of this vector.
 * @return The square of the length of this vector.
 *
 */
Vector3.prototype.magnitudeSquared = function () {
    return this.x * this.x + this.y * this.y + this.z * this.z;
};

/**
 * A normalized copy of this vector.
 * A normalized vector has the same direction as the original
 * vector, but with a length of one.
 * @return A Vector object with a length of one, pointing in the same direction as this Vector object.
 *
 */
Vector3.prototype.normalized = function () {
    var denom = this.magnitudeSquared();
    if (denom <= 0)
        return new Vector3({
            x: 0,
            y: 0,
            z: 0
        });

    denom = 1 / Math.sqrt(denom);
    return new Vector3({
        x: this.x * denom,
        y: this.y * denom,
        z: this.z * denom
    });
};

/**
 * The pitch angle in radians.
 * Pitch is the angle between the negative z-axis and the projection
 * of the vector onto the y-z plane. In other words, pitch represents
 * rotation around the x-axis. If the vector points upward, the
 * returned angle is between 0 and pi radians (180 degrees); if it
 * points downward, the angle is between 0 and -pi radians.
 *
 * @return The angle of this vector above or below the horizon (x-z plane).
 *
 */
Vector3.prototype.pitch = function () {
    return Math.atan2(this.y, -this.z);
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
 * @return The angle of this vector to the right or left of the negative z-axis.
 *
 */
Vector3.prototype.yaw = function () {
    return Math.atan2(this.x, -this.z);
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
 * @return The angle of this vector to the right or left of the y-axis.
 *
 */
Vector3.prototype.roll = function () {
    return Math.atan2(this.x, -this.y);
};

/**
 * The zero vector: (0, 0, 0)
 * @return
 *
 */
Vector3.prototype.zero = function () {
    return new Vector3({
        x: 0,
        y: 0,
        z: 0
    });
};

/**
 * The x-axis unit vector: (1, 0, 0)
 * @return
 *
 */
Vector3.prototype.xAxis = function () {
    return new Vector3({
        x: 1,
        y: 0,
        z: 0
    });
};

/**
 * The y-axis unit vector: (0, 1, 0)
 * @return
 *
 */
Vector3.prototype.yAxis = function () {
    return new Vector3({
        x: 0,
        y: 1,
        z: 0
    });
};

/**
 * The z-axis unit vector: (0, 0, 1)
 * @return
 *
 */
Vector3.prototype.zAxis = function () {
    return new Vector3({
        x: 0,
        y: 0,
        z: 1
    });
};

/**
 * The unit vector pointing left along the negative x-axis: (-1, 0, 0)
 * @return
 *
 */
Vector3.prototype.left = function () {
    return new Vector3({
        x: -1,
        y: 0,
        z: 0
    });
};

/**
 * The unit vector pointing right along the positive x-axis: (1, 0, 0)
 * @return
 *
 */
Vector3.prototype.right = function () {
    return this.xAxis();
};

/**
 * The unit vector pointing down along the negative y-axis: (0, -1, 0)
 * @return
 *
 */
Vector3.prototype.down = function () {
    return new Vector3({
        x: 0,
        y: -1,
        z: 0
    });
};

/**
 * The unit vector pointing up along the positive x-axis: (0, 1, 0)
 * @return
 *
 */
Vector3.prototype.up = function () {
    return this.yAxis();
};

/**
 * The unit vector pointing forward along the negative z-axis: (0, 0, -1)
 * @return
 *
 */
Vector3.prototype.forward = function () {
    return new Vector3({
        x: 0,
        y: 0,
        z: -1
    });
};

/**
 * The unit vector pointing backward along the positive z-axis: (0, 0, 1)
 * @return
 *
 */
Vector3.prototype.backward = function () {
    return this.zAxis();
};

/**
 * An invalid Vector3 object.
 *
 * You can use this Vector3 instance in comparisons testing
 * whether a given Vector3 instance is valid or invalid.
 *
 */
Vector3.invalid = function() {
    return new Vector3({ invalid: true });
};

/**
 * Returns a string containing this vector in a human readable format: (x, y, z).
 * @return
 *
 */
Vector3.prototype.toString = function () {
    if(!this.valid) {
        return "[Vector3 invalid]";
    }
    return "[Vector3 x:" + this.x + " y:" + this.y + " z:" + this.z + "]";
};
},{}],13:[function(require,module,exports){
// This file is automatically updated from package.json by grunt.
module.exports = {
    full: '0.8.6',
    major: 0,
    minor: 8,
    dot: 6
}
},{}],14:[function(require,module,exports){
(function (process){
var Frame = require('../Frame'),
    EventEmitter = require('events').EventEmitter,
    _ = require('underscore');

var BaseConnection = module.exports = function (options) {
    "use strict";

    this.options = _.defaults(options || {}, {
        host: '127.0.0.1',
        port: 6450
    });
    this.host = this.options.host;
    this.port = this.options.port;
    this.connect();
};

BaseConnection.prototype.getUrl = function () {
    "use strict";

    return "ws://" + this.host + ":" + this.port + "/";
};

BaseConnection.prototype.handleOpen = function () {
    "use strict";

    if (!this.connected) {
        this.send({
            "command": "requestDeviceInfo"
        });
    }
};

BaseConnection.prototype.handleClose = function (code, reason) {
    "use strict";

    console.log("handleClose: " + code + ", reason: " + reason);

    if (!this.connected) return;
    this.disconnect();
    this.startReconnection();
};

BaseConnection.prototype.startReconnection = function () {
    "use strict";

    var connection = this;
    if (!this.reconnectionTimer) {
        (this.reconnectionTimer = setInterval(function () {
            connection.reconnect()
        }, 500));
    }
};

BaseConnection.prototype.stopReconnection = function () {
    "use strict";

    this.reconnectionTimer = clearInterval(this.reconnectionTimer);
};

// By default, disconnect will prevent auto-reconnection.
// Pass in true to allow the reconnection loop not be interrupted continue
BaseConnection.prototype.disconnect = function (allowReconnect) {
    "use strict";

    if (!allowReconnect) this.stopReconnection();
    if (!this.socket) return;
    this.socket.close();
    delete this.socket;
    if (this.connected) {
        this.connected = false;
        this.emit('disconnect');
    }
    return true;
};

BaseConnection.prototype.reconnect = function () {
    "use strict";

    if (this.connected) {
        this.stopReconnection();
    } else {
        this.disconnect(true);
        this.connect();
    }
};

BaseConnection.prototype.handleData = function (data) {
    "use strict";

    var message, messageEvent, frame, deviceInfo;

    message = JSON.parse(data);

    // Wait for deviceInfo until connected
    if (!this.connected && message.hasOwnProperty("frame")) {
        frame = message["frame"];
        if (frame.hasOwnProperty("deviceInfo")) {
            deviceInfo = frame["deviceInfo"];
            this.emit('deviceInfo', deviceInfo);
            this.connected = true;
            this.emit('connect');
        }
    }

    if (!this.connected) return;

    if (message.hasOwnProperty("frame")) {
        messageEvent = new Frame(message.frame);
        this.emit(messageEvent.type, messageEvent);

        // Emit pose if existing
        if (messageEvent.pose) {
            this.emit("pose", messageEvent.pose);
        }
    }
};

BaseConnection.prototype.connect = function () {
    "use strict";

    if (this.socket) return;

    this.emit('ready');

    var inNode = (typeof (process) !== 'undefined' && process.versions && process.versions.node),
        connection = this,
        connectionType;

    if (inNode) {
        connectionType = require('ws');
        this.socket = new connectionType(this.getUrl());
    } else {
        this.socket = new WebSocket(this.getUrl());
    }

    this.socket.onopen = function () {
        connection.handleOpen();
    };
    this.socket.onclose = function (data) {
        connection.handleClose(data['code'], data['reason']);
    };
    this.socket.onmessage = function (message) {
        connection.handleData(message.data)
    };
    this.socket.onerror = function (data) {
        connection.handleClose('connectError', data['data'])
    };

    return true;
};

BaseConnection.prototype.send = function (data) {
    "use strict";
    this.socket.send(JSON.stringify(data));
};

_.extend(BaseConnection.prototype, EventEmitter.prototype);
}).call(this,require("FWaASH"))
},{"../Frame":6,"FWaASH":2,"events":1,"underscore":3,"ws":4}],15:[function(require,module,exports){
if (typeof(window) !== 'undefined' && typeof(window.requestAnimationFrame) !== 'function') {
  window.requestAnimationFrame = (
    window.webkitRequestAnimationFrame   ||
    window.mozRequestAnimationFrame      ||
    window.oRequestAnimationFrame        ||
    window.msRequestAnimationFrame       ||
    function(callback) { setTimeout(callback, 1000 / 60); }
  );
}

Myo = module.exports = require("../src/Index");

},{"../src/Index":8}]},{},[15]);
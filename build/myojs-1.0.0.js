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
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CircularBuffer = (function () {
    function CircularBuffer(size) {
        _classCallCheck(this, CircularBuffer);

        this.pos = 0;
        this._buf = [];
        this.size = size;
    }

    _createClass(CircularBuffer, [{
        key: "get",
        value: function get(i) {
            if (!i || i === null) {
                i = 0;
            }
            if (i >= this.size) {
                return null;
            }
            if (i >= this._buf.length) {
                return null;
            }
            return this._buf[(this.pos - i - 1) % this.size];
        }
    }, {
        key: "push",
        value: function push(o) {
            this._buf[this.pos % this.size] = o;
            return this.pos++;
        }
    }]);

    return CircularBuffer;
})();

exports.CircularBuffer = CircularBuffer;

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _PoseJs = require('./Pose.js');

var _QuaternionJs = require('./Quaternion.js');

var _Vector3Js = require('./Vector3.js');

var Frame = (function () {
    function Frame(data) {
        _classCallCheck(this, Frame);

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
        this.id = data.id;

        /**
         * The frame capture time in microseconds elapsed since the Myo started.
         * @member timestamp
         * @memberof Myo.Frame.prototype
         * @type {string}
         */
        this.timestamp = data.timestamp;

        if (data.euler) {
            this.euler = data.euler;
        }

        if (data.rssi) {
            this.rssi = data.rssi;
        }

        if (data.event) {
            this.event = data.event;
        }

        /**
         * A change in pose has been detected.
         * @member pose
         * @memberof Myo.Pose.prototype
         * @type {Pose}
         */
        if (data.pose) {
            this.pose = new _PoseJs.Pose(data.pose);
        } else {
            this.pose = _PoseJs.Pose.invalid();
        }

        /**
         * A change in pose has been detected.
         * @member pose
         * @memberof Myo.Pose.prototype
         * @type {Pose}
         */
        if (data.rotation) {
            this.rotation = new _QuaternionJs.Quaternion(data.rotation);
        } else {
            this.rotation = _QuaternionJs.Quaternion.invalid();
        }

        if (data.accel) {
            this.accel = new _Vector3Js.Vector3(data.accel);
        } else {
            this.accel = _Vector3Js.Vector3.invalid();
        }

        if (data.gyro) {
            this.gyro = new _Vector3Js.Vector3(data.gyro);
        } else {
            this.gyro = _Vector3Js.Vector3.invalid();
        }

        /**
         * EMG data
         */
        if (data.emg) {
            this.emg = data.emg;
        } else {
            this.emg = [];
        }

        this.data = data;
        this.type = 'frame';
    }

    /**
     * Returns a string containing this Frame in a human readable format.
     * @return
     *
     */

    _createClass(Frame, [{
        key: 'toString',
        value: function toString() {
            return '[Frame id:' + this.id + ' timestamp:' + this.timestamp + ' accel:' + this.accel.toString() + ']';
        }
    }]);

    return Frame;
})();

exports.Frame = Frame;

},{"./Pose.js":7,"./Quaternion.js":8,"./Vector3.js":9}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _events = require('events');

var _MyoJs = require('./Myo.js');

var _connectionBaseConnectionJs = require('./connection/BaseConnection.js');

var _CircularBufferJs = require('./CircularBuffer.js');

var Hub = (function (_EventEmitter) {
    _inherits(Hub, _EventEmitter);

    function Hub(opt) {
        var _this = this;

        _classCallCheck(this, Hub);

        _get(Object.getPrototypeOf(Hub.prototype), 'constructor', this).call(this, opt);

        this.connection = new _connectionBaseConnectionJs.BaseConnection(opt);
        this.history = new _CircularBufferJs.CircularBuffer(200);
        this.myos = [];

        this.connection.connect();

        this.connection.on('deviceInfo', function () {
            _this.myo = new _MyoJs.Myo(_this.connection);
        });
        this.connection.on('frame', function (frame) {
            _this.history.push(frame);
            _this.emit('frame', frame);
        });
        this.connection.on('pose', function (pose) {
            _this.emit('pose', pose);
        });
        this.connection.on('event', function (event) {
            _this.emit(event.type);
        });
        this.connection.on('ready', function () {
            _this.emit('ready');
        });
        this.connection.on('connect', function () {
            _this.emit('connect');
        });
        this.connection.on('disconnect', function () {
            _this.emit('disconnect');
        });
    }

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

    _createClass(Hub, [{
        key: 'frame',
        value: function frame(num) {
            return this.history.get(num) || null;
        }

        /**
         * Find a nearby Myo and pair with it, or time out after timeoutMilliseconds milliseconds if provided.
         *
         * <p>If timeout_ms is zero, this method blocks until a Myo is found. This method must
         * not be run concurrently with run() or runOnce().</p>
         */
    }, {
        key: 'waitForMyo',
        value: function waitForMyo(timeoutMilliseconds) {
            if (!timeoutMilliseconds || timeoutMilliseconds !== parseInt(timeoutMilliseconds, 10)) {
                throw new Error('timeoutMilliseconds needs to be of type integer');
            }
            this.connection.send({
                'waitForMyo': timeoutMilliseconds
            });
        }

        /**
         * Run the event loop for the specified duration (in milliseconds).
         */
    }, {
        key: 'run',
        value: function run(durationMilliseconds) {
            if (!durationMilliseconds || durationMilliseconds !== parseInt(durationMilliseconds, 10)) {
                throw new Error('durationMilliseconds needs to be of type integer');
            }
            this.connection.send({
                'run': durationMilliseconds
            });
        }

        /**
         * Run the event loop until a single event occurs, or the specified
         * duration (in milliseconds) has elapsed.
         */
    }, {
        key: 'runOnce',
        value: function runOnce(durationMilliseconds) {
            if (!durationMilliseconds || durationMilliseconds !== parseInt(durationMilliseconds, 10)) {
                throw new Error('durationMilliseconds needs to be of type integer');
            }
            this.connection.send({
                'runOnce': durationMilliseconds
            });
        }

        /**
         * Returns a string containing this hub in a human readable format.
         * @return
         *
         */
    }, {
        key: 'toString',
        value: function toString() {
            return '[Hub history:' + this.history + ']';
        }
    }]);

    return Hub;
})(_events.EventEmitter);

exports.Hub = Hub;

},{"./CircularBuffer.js":2,"./Myo.js":6,"./connection/BaseConnection.js":10,"events":1}],5:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _connectionBaseConnectionJs = require('./connection/BaseConnection.js');

var _HubJs = require('./Hub.js');

var _MyoJs = require('./Myo.js');

var _CircularBufferJs = require('./CircularBuffer.js');

var _PoseJs = require('./Pose.js');

var _QuaternionJs = require('./Quaternion.js');

var _Vector3Js = require('./Vector3.js');

var _FrameJs = require('./Frame.js');

var MyoJS = (function () {
    function MyoJS() {
        _classCallCheck(this, MyoJS);
    }

    _createClass(MyoJS, null, [{
        key: 'BaseConnection',
        value: function BaseConnection() {
            return _connectionBaseConnectionJs.BaseConnection;
        }
    }, {
        key: 'CircularBuffer',
        value: function CircularBuffer() {
            return _CircularBufferJs.CircularBuffer;
        }
    }, {
        key: 'Hub',
        value: function Hub() {
            return new _HubJs.Hub();
        }
    }, {
        key: 'Myo',
        value: function Myo() {
            return _MyoJs.Myo;
        }
    }, {
        key: 'Frame',
        value: function Frame() {
            return _FrameJs.Frame;
        }
    }, {
        key: 'Pose',
        value: function Pose() {
            return _PoseJs.Pose;
        }
    }, {
        key: 'Quaternion',
        value: function Quaternion() {
            return _QuaternionJs.Quaternion;
        }
    }, {
        key: 'Vector3',
        value: function Vector3() {
            return _Vector3Js.Vector3;
        }
    }]);

    return MyoJS;
})();

exports.MyoJS = MyoJS;
exports['default'] = MyoJS;

/**
 * Browserify exports global to the window object.
 * @namespace Myo
 */
global.Myo = MyoJS;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./CircularBuffer.js":2,"./Frame.js":3,"./Hub.js":4,"./Myo.js":6,"./Pose.js":7,"./Quaternion.js":8,"./Vector3.js":9,"./connection/BaseConnection.js":10}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Myo = (function () {
    function Myo(context) {
        _classCallCheck(this, Myo);

        if (!context) {
            throw new Error('Missing context');
        }

        /**
         * @private
         *
         */
        this.context = context;
    }

    /**
     * A vibration lasting a small amount of time (VibrationLengthShort)
     */

    /**
     * Request the RSSI of the Myo.
     *
     * <p>An onRssi event will likely be generated with the value of the RSSI.</p>
     *
     */

    _createClass(Myo, [{
        key: 'requestRssi',
        value: function requestRssi() {
            this.context.send({
                'requestRssi': true
            });
        }

        /**
         * Engage the Myo's built in vibration motor.
         * @param length
         *
         */
    }, {
        key: 'vibrate',
        value: function vibrate(length) {
            switch (length) {
                case Myo.VIBRATION_SHORT:
                    this.context.send({
                        'command': 'vibrate',
                        'args': [Myo.VIBRATION_SHORT]
                    });
                    break;
                case Myo.VIBRATION_MEDIUM:
                    this.context.send({
                        'command': 'vibrate',
                        'args': [Myo.VIBRATION_MEDIUM]
                    });
                    break;
                case Myo.VIBRATION_LONG:
                    this.context.send({
                        'command': 'vibrate',
                        'args': [Myo.VIBRATION_LONG]
                    });
                    break;
                default:
                    throw new Error('Valid values are: Myo.VIBRATION_SHORT, Myo.VIBRATION_MEDIUM, Myo.VIBRATION_LONG');
            }
        }

        /**
         * Unlock the given Myo.
         * Can be called when a Myo is paired.
         *
         */
    }, {
        key: 'unlock',
        value: function unlock(option) {
            switch (option) {
                case Myo.UNLOCK_TIMED:
                    this.context.send({
                        'command': 'unlock',
                        'args': [Myo.UNLOCK_TIMED]
                    });
                    break;
                case Myo.UNLOCK_HOLD:
                    this.context.send({
                        'command': 'unlock',
                        'args': [Myo.UNLOCK_HOLD]
                    });
                    break;
                default:
                    throw new Error('Valid values are: Myo.UNLOCK_TIMED, Myo.UNLOCK_HOLD');
            }
        }

        /**
         * Lock the given Myo immediately.
         * Can be called when a Myo is paired.
         *
         */
    }, {
        key: 'lock',
        value: function lock() {
            this.context.send({
                'command': 'lock'
            });
        }

        /**
         * Notify the given Myo that a user action was recognized.
         * Can be called when a Myo is paired. Will cause Myo to vibrate.
         *
         */
    }, {
        key: 'notifyUserAction',
        value: function notifyUserAction(action) {
            switch (action) {
                case Myo.USER_ACTION_SINGLE:
                    this.context.send({
                        'command': 'notifyUserAction',
                        'args': [Myo.USER_ACTION_SINGLE]
                    });
                    break;
                default:
                    throw new Error('Valid values are: Myo.USER_ACTION_SINGLE');
            }
        }
    }]);

    return Myo;
})();

exports.Myo = Myo;
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

},{}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Pose = (function () {
    function Pose(data) {
        _classCallCheck(this, Pose);

        if (typeof data !== 'object' || Object.prototype.toString.call(data) === '[object Array]') {
            throw new Error('Constructor parameter needs to be an object');
        }

        /**
         * The pose being recognized.
         */
        this.type = data.type;

        /**
         * Indicates whether this is a valid Pose object.
         */
        this.valid = !data.hasOwnProperty('invalid');

        if (this.valid) {
            if (!data.hasOwnProperty('type') || data.type !== parseInt(data.type, 10)) {
                throw new Error('Pose type needs to be of type integer');
            }
        }
    }

    /**
     * Rest pose.
     */

    _createClass(Pose, [{
        key: 'isEqualTo',
        value: function isEqualTo(other) {
            return this.type === other.type;
        }

        /**
         * An invalid Pose object.
         *
         * You can use this Pose instance in comparisons testing
         * whether a given Pose instance is valid or invalid.
         *
         */
    }, {
        key: 'toString',

        /**
         * Return a human-readable string representation of the pose.
         * @return
         *
         */
        value: function toString() {
            if (!this.valid) {
                return '[Pose invalid]';
            }
            switch (this.type) {
                case Pose.POSE_REST:
                    return '[Pose type:' + this.type.toString() + ' POSE_REST]';
                case Pose.POSE_FIST:
                    return '[Pose type:' + this.type.toString() + ' POSE_FIST]';
                case Pose.POSE_WAVE_IN:
                    return '[Pose type:' + this.type.toString() + ' POSE_WAVE_IN]';
                case Pose.POSE_WAVE_OUT:
                    return '[Pose type:' + this.type.toString() + ' POSE_WAVE_OUT]';
                case Pose.POSE_FINGERS_SPREAD:
                    return '[Pose type:' + this.type.toString() + ' POSE_FINGERS_SPREAD]';
                case Pose.POSE_DOUBLE_TAP:
                    return '[Pose type:' + this.type.toString() + ' POSE_DOUBLE_TAP]';
                default:
                    return '[Pose type:' + this.type.toString() + ']';
            }
        }
    }], [{
        key: 'invalid',
        value: function invalid() {
            return new Pose({
                invalid: true
            });
        }
    }]);

    return Pose;
})();

exports.Pose = Pose;
Pose.POSE_REST = 0;

/**
 * User is making a fist.
 */
Pose.POSE_FIST = 1;

/**
 * User has an open palm rotated towards the posterior of their wrist.
 */
Pose.POSE_WAVE_IN = 2;

/**
 * User has an open palm rotated towards the anterior of their wrist.
 */
Pose.POSE_WAVE_OUT = 3;

/**
 * User has an open palm with their fingers spread away from each other.
 */
Pose.POSE_FINGERS_SPREAD = 4;

/**
 * User tapped their thumb and middle finger together twice in succession.
 */
Pose.POSE_DOUBLE_TAP = 5;

},{}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Quaternion = (function () {
    function Quaternion(data) {
        _classCallCheck(this, Quaternion);

        /**
         * Indicates whether this is a valid Quaternion object.
         */
        this.valid = !data.hasOwnProperty('invalid');

        if (this.valid) {
            if (Object.prototype.toString.call(data) !== '[object Array]') {
                throw new Error('Components needs to be an array');
            }
            if (isNaN(data[0]) || isNaN(data[1]) || isNaN(data[2]) || isNaN(data[3])) {
                throw new Error('Component values needs to be integers or numbers');
            }
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
    }

    /**
     * A normalized copy of this quaternion.
     * A normalized quaternion has the same direction as the original
     * quaternion, but with a length of one.
     * @return {Quaternion} A Quaternion object with a length of one, pointing in the same direction as this Quaternion object.
     *
     */

    _createClass(Quaternion, [{
        key: 'normalized',
        value: function normalized() {
            var magnitude = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);

            return new Quaternion([this.x / magnitude, this.y / magnitude, this.z / magnitude, this.w / magnitude]);
        }

        /**
         * A copy of this quaternion pointing in the opposite direction.
         *
         */
    }, {
        key: 'conjugate',
        value: function conjugate() {
            return new Quaternion([-this.x, -this.y, -this.z, this.w]);
        }

        /**
         * Convert Quaternion to Euler angles.
         * @see http://www.euclideanspace.com/maths/geometry/rotations/conversions/quaternionToEuler/
         *
         */
    }, {
        key: 'toEuler',
        value: function toEuler() {
            'use strict';
            var test, heading, attitude, bank, sqx, sqy, sqz, sqw, unit;

            sqw = this.w * this.w;
            sqx = this.x * this.x;
            sqy = this.y * this.y;
            sqz = this.z * this.z;
            unit = sqx + sqy + sqz + sqw; // If normalised is one, otherwise is correction factor
            test = this.x * this.y + this.z * this.w;
            if (test > 0.499 * unit /* Singularity at north pole */) {
                    heading = 2 * Math.atan2(this.x, this.w);
                    attitude = Math.PI / 2;
                    bank = 0;
                } else if (test < -0.499 * unit /* Singularity at south pole */) {
                    heading = -2 * Math.atan2(this.x, this.w);
                    attitude = -Math.PI / 2;
                    bank = 0;
                } else {
                heading = Math.atan2(2 * this.y * this.w - 2 * this.x * this.z, sqx - sqy - sqz + sqw);
                attitude = Math.asin(2 * test / unit);
                bank = Math.atan2(2 * this.x * this.w - 2 * this.y * this.z, -sqx + sqy - sqz + sqw);
            }

            return {
                heading: heading, // Heading = rotation about y axis
                attitude: attitude, // Attitude = rotation about z axis
                bank: bank // Bank = rotation about x axis
            };
        }

        /**
         * Convert Quaternion to Euler angles (roll).
         *
         */
    }, {
        key: 'roll',
        value: function roll() {
            return Math.atan2(2 * this.y * this.w - 2 * this.x * this.z, 1 - 2 * this.y * this.y - 2 * this.z * this.z);
        }

        /**
         * Convert Quaternion to Euler angles (pitch).
         *
         */
    }, {
        key: 'pitch',
        value: function pitch() {
            return Math.atan2(2 * this.x * this.w - 2 * this.y * this.z, 1 - 2 * this.x * this.x - 2 * this.z * this.z);
        }

        /**
         * Convert Quaternion to Euler angles (yaw).
         *
         */
    }, {
        key: 'yaw',
        value: function yaw() {
            return Math.asin(2 * this.x * this.y + 2 * this.z * this.w);
        }

        /**
         * An invalid Quaternion object.
         *
         * You can use this Quaternion instance in comparisons testing
         * whether a given Quaternion instance is valid or invalid.
         *
         */
    }, {
        key: 'toString',

        /**
         * Returns a string containing this quaternion in a human readable format: (x, y, z, w).
         * @return
         *
         */
        value: function toString() {
            if (!this.valid) {
                return '[Quaternion invalid]';
            }
            return '[Quaternion x:' + this.x + ' y:' + this.y + ' z:' + this.z + ' w:' + this.w + ']';
        }
    }], [{
        key: 'invalid',
        value: function invalid() {
            return new Quaternion({
                invalid: true
            });
        }
    }]);

    return Quaternion;
})();

exports.Quaternion = Quaternion;

},{}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Vector3 = (function () {
    function Vector3(data) {
        _classCallCheck(this, Vector3);

        if (!data) {
            throw new Error('Missing constructor arguments');
        }
        if (typeof data !== 'object') {
            throw new Error('Constructor parameter needs to be an object');
        }

        /**
         * Indicates whether this is a valid Vector3 object.
         */
        this.valid = !data.hasOwnProperty('invalid');

        if (this.valid) {
            if (!data || Object.prototype.toString.call(data) !== '[object Array]') {
                throw new Error('Components needs to be an array');
            }
            if (isNaN(data[0]) || isNaN(data[1]) || isNaN(data[2])) {
                throw new Error('Component values needs to be integers or numbers');
            }
            this.x = data[0];
            this.y = data[1];
            this.z = data[2];
        } else {
            this.x = NaN;
            this.y = NaN;
            this.z = NaN;
        }
    }

    /**
     * A copy of this vector pointing in the opposite direction.
     * @return {Vector3} A Vector3 object with all components negated.
     *
     */

    _createClass(Vector3, [{
        key: 'opposite',
        value: function opposite() {
            return new Vector3([-this.x, -this.y, -this.z]);
        }

        /**
         * Add vectors component-wise.
         * @param other
         * @return {Vector3}
         *
         */
    }, {
        key: 'plus',
        value: function plus(other) {
            return new Vector3([this.x + other.x, this.y + other.y, this.z + other.z]);
        }

        /**
         * Add vectors component-wise and assign the value.
         * @param other
         * @return {Vector3} This Vector3.
         *
         */
    }, {
        key: 'plusAssign',
        value: function plusAssign(other) {
            this.x += other.x;
            this.y += other.y;
            this.z += other.z;
            return this;
        }

        /**
         * A copy of this vector pointing in the opposite direction (conjugate).
         * @param other
         * @return {Vector3}
         *
         */
    }, {
        key: 'minus',
        value: function minus(other) {
            return new Vector3([this.x - other.x, this.y - other.y, this.z - other.z]);
        }

        /**
         * A copy of this vector pointing in the opposite direction and assign the value.
         * @param other
         * @return {Vector3} This Vector3.
         *
         */
    }, {
        key: 'minusAssign',
        value: function minusAssign(other) {
            this.x -= other.x;
            this.y -= other.y;
            this.z -= other.z;
            return this;
        }

        /**
         * Multiply vector by a scalar.
         * @param scalar
         * @return {Vector3}
         *
         */
    }, {
        key: 'multiply',
        value: function multiply(scalar) {
            return new Vector3([this.x * scalar, this.y * scalar, this.z * scalar]);
        }

        /**
         * Multiply vector by a scalar and assign the quotient.
         * @param scalar
         * @return {Vector3} This Vector3.
         *
         */
    }, {
        key: 'multiplyAssign',
        value: function multiplyAssign(scalar) {
            this.x *= scalar;
            this.y *= scalar;
            this.z *= scalar;
            return this;
        }

        /**
         * Divide vector by a scalar.
         * @param scalar
         * @return {Vector3}
         *
         */
    }, {
        key: 'divide',
        value: function divide(scalar) {
            return new Vector3([this.x / scalar, this.y / scalar, this.z / scalar]);
        }

        /**
         * Divide vector by a scalar and assign the value.
         * @param scalar
         * @return {Vector3} This Vector3.
         *
         */
    }, {
        key: 'divideAssign',
        value: function divideAssign(scalar) {
            this.x /= scalar;
            this.y /= scalar;
            this.z /= scalar;
            return this;
        }

        /**
         * Compare Vector equality/inequality component-wise.
         * @param other The Vector3 to compare with.
         * @return {boolean} true; if equal, false otherwise.
         *
         */
    }, {
        key: 'isEqualTo',
        value: function isEqualTo(other) {
            return !(this.x !== other.x || this.y !== other.y || this.z !== other.z);
        }

        /**
         * The angle between this vector and the specified vector in radians.
         *
         * <p>The angle is measured in the plane formed by the two vectors.
         * The angle returned is always the smaller of the two conjugate angles.
         * Thus <code>A.angleTo(B) === B.angleTo(A)</code> and is always a positive value less
         * than or equal to pi radians (180 degrees).</p>
         *
         * <p>If either vector has zero length, then this method returns zero.</p>
         *
         * @param other A Vector object.
         * @return {number} The angle between this vector and the specified vector in radians.
         *
         */
    }, {
        key: 'angleTo',
        value: function angleTo(other) {
            var denom = this.magnitudeSquared() * other.magnitudeSquared(),
                returnValue;

            if (denom <= 0) {
                returnValue = 0;
            } else {
                returnValue = Math.acos(this.dot(other) / Math.sqrt(denom));
            }
            return returnValue;
        }

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
    }, {
        key: 'cross',
        value: function cross(other) {
            return new Vector3([this.y * other.z - this.z * other.y, this.z * other.x - this.x * other.z, this.x * other.y - this.y * other.x]);
        }

        /**
         * The distance between the point represented by this Vector
         * object and a point represented by the specified Vector object.
         *
         * @param other A Vector object.
         * @return {number} The distance from this point to the specified point.
         *
         */
    }, {
        key: 'distanceTo',
        value: function distanceTo(other) {
            return Math.sqrt((this.x - other.x) * (this.x - other.x) + (this.y - other.y) * (this.y - other.y) + (this.z - other.z) * (this.z - other.z));
        }

        /**
         * The dot product of this vector with another vector.
         * The dot product is the magnitude of the projection of this vector
         * onto the specified vector.
         *
         * @param other A Vector object.
         * @return {number} The dot product of this vector and the specified vector.
         *
         */
    }, {
        key: 'dot',
        value: function dot(other) {
            return this.x * other.x + this.y * other.y + this.z * other.z;
        }

        /**
         * Returns true if all of the vector's components are finite.
         * @return {boolean} If any component is NaN or infinite, then this returns false.
         *
         */
    }, {
        key: 'isValid',
        value: function isValid() {
            return this.x <= Number.MAX_VALUE && this.x >= -Number.MAX_VALUE && this.y <= Number.MAX_VALUE && this.y >= -Number.MAX_VALUE && this.z <= Number.MAX_VALUE && this.z >= -Number.MAX_VALUE;
        }

        /**
         * The magnitude, or length, of this vector.
         * The magnitude is the L2 norm, or Euclidean distance between the
         * origin and the point represented by the (x, y, z) components
         * of this Vector object.
         *
         * @return {number} The length of this vector.
         *
         */
    }, {
        key: 'magnitude',
        value: function magnitude() {
            return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        }

        /**
         * The square of the magnitude, or length, of this vector.
         * @return {number} The square of the length of this vector.
         *
         */
    }, {
        key: 'magnitudeSquared',
        value: function magnitudeSquared() {
            return this.x * this.x + this.y * this.y + this.z * this.z;
        }

        /**
         * A normalized copy of this vector.
         * A normalized vector has the same direction as the original
         * vector, but with a length of one.
         * @return {Vector3} A Vector object with a length of one, pointing in the same direction as this Vector object.
         *
         */
    }, {
        key: 'normalized',
        value: function normalized() {
            var denom = this.magnitudeSquared();
            if (denom <= 0) {
                return new Vector3([0, 0, 0]);
            }

            denom = 1 / Math.sqrt(denom);
            return new Vector3([this.x * denom, this.y * denom, this.z * denom]);
        }

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
    }, {
        key: 'pitch',
        value: function pitch() {
            return Math.atan2(this.y, -this.z);
        }

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
    }, {
        key: 'yaw',
        value: function yaw() {
            return Math.atan2(this.x, -this.z);
        }

        /**
         * The roll angle in radians.
         * Roll is the angle between the y-axis and the projection of the vector
         * onto the x-y plane. In other words, roll represents rotation around
         * the z-axis. If the vector points to the left of the y-axis, then the
         * returned angle is between 0 and pi radians (180 degrees); if it
         * points to the right, the angle is between 0 and -pi radians.
         *
         * Use this method to get roll angle of the plane to which this vector
         * is a normal. For example, if this vector represents the normal to
         * the palm, then this method returns the tilt or roll of the palm
         * plane compared to the horizontal (x-z) plane.
         *
         * @return {number} The angle of this vector to the right or left of the y-axis.
         *
         */
    }, {
        key: 'roll',
        value: function roll() {
            return Math.atan2(this.x, -this.y);
        }

        /**
         * The zero vector: (0, 0, 0)
         * @return {Vector3}
         *
         */
    }, {
        key: 'toString',

        /**
         * Returns a string containing this vector in a human readable format: (x, y, z).
         * @return {String}
         *
         */
        value: function toString() {
            if (!this.valid) {
                return '[Vector3 invalid]';
            }
            return '[Vector3 x:' + this.x + ' y:' + this.y + ' z:' + this.z + ']';
        }
    }], [{
        key: 'zero',
        value: function zero() {
            return new Vector3([0, 0, 0]);
        }

        /**
         * The x-axis unit vector: (1, 0, 0)
         * @return {Vector3}
         *
         */
    }, {
        key: 'xAxis',
        value: function xAxis() {
            return new Vector3([1, 0, 0]);
        }

        /**
         * The y-axis unit vector: (0, 1, 0)
         * @return {Vector3}
         *
         */
    }, {
        key: 'yAxis',
        value: function yAxis() {
            return new Vector3([0, 1, 0]);
        }

        /**
         * The z-axis unit vector: (0, 0, 1)
         * @return {Vector3}
         *
         */
    }, {
        key: 'zAxis',
        value: function zAxis() {
            return new Vector3([0, 0, 1]);
        }

        /**
         * The unit vector pointing left along the negative x-axis: (-1, 0, 0)
         * @return {Vector3}
         *
         */
    }, {
        key: 'left',
        value: function left() {
            return new Vector3([-1, 0, 0]);
        }

        /**
         * The unit vector pointing right along the positive x-axis: (1, 0, 0)
         * @return {Vector3}
         *
         */
    }, {
        key: 'right',
        value: function right() {
            return Vector3.xAxis();
        }

        /**
         * The unit vector pointing down along the negative y-axis: (0, -1, 0)
         * @return {Vector3}
         *
         */
    }, {
        key: 'down',
        value: function down() {
            return new Vector3([0, -1, 0]);
        }

        /**
         * The unit vector pointing up along the positive x-axis: (0, 1, 0)
         * @return {Vector3}
         *
         */
    }, {
        key: 'up',
        value: function up() {
            return Vector3.yAxis();
        }

        /**
         * The unit vector pointing forward along the negative z-axis: (0, 0, -1)
         * @return {Vector3}
         *
         */
    }, {
        key: 'forward',
        value: function forward() {
            return new Vector3([0, 0, -1]);
        }

        /**
         * The unit vector pointing backward along the positive z-axis: (0, 0, 1)
         * @return {Vector3}
         *
         */
    }, {
        key: 'backward',
        value: function backward() {
            return Vector3.zAxis();
        }

        /**
         * An invalid Vector3 object.
         *
         * You can use this Vector3 instance in comparisons testing
         * whether a given Vector3 instance is valid or invalid.
         * @return {Vector3}
         *
         */
    }, {
        key: 'invalid',
        value: function invalid() {
            return new Vector3({
                invalid: true
            });
        }
    }]);

    return Vector3;
})();

exports.Vector3 = Vector3;

},{}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _events = require('events');

var _FrameJs = require('./../Frame.js');

var BaseConnection = (function (_EventEmitter) {
    _inherits(BaseConnection, _EventEmitter);

    function BaseConnection() {
        var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        var _ref$host = _ref.host;
        var host = _ref$host === undefined ? '127.0.0.1' : _ref$host;
        var _ref$port = _ref.port;
        var port = _ref$port === undefined ? 6450 : _ref$port;

        _classCallCheck(this, BaseConnection);

        _get(Object.getPrototypeOf(BaseConnection.prototype), 'constructor', this).call(this);

        if (typeof host !== 'string') {
            throw new Error('Host needs to be of type string');
        }
        if (port !== parseInt(port, 10)) {
            throw new Error('Port needs to be of type integer');
        }

        this.host = host;
        this.port = port;
        this.connected = false;
    }

    _createClass(BaseConnection, [{
        key: 'getUrl',
        value: function getUrl() {
            return 'ws://' + this.host + ':' + this.port + '/';
        }
    }, {
        key: 'handleOpen',
        value: function handleOpen() {
            var returnValue;

            if (!this.connected) {
                this.send({
                    'command': 'requestDeviceInfo'
                });
                returnValue = 'connecting';
            } else {
                returnValue = 'connected';
            }
            return returnValue;
        }
    }, {
        key: 'handleClose',
        value: function handleClose() {
            var returnValue;

            if (this.connected) {
                this.disconnect();
                this.startReconnection();
                returnValue = 'disconnecting';
            } else {
                returnValue = 'disconnected';
            }
            return returnValue;
        }
    }, {
        key: 'startReconnection',
        value: function startReconnection() {
            var _this = this;

            var returnValue;

            if (!this.reconnectionTimer) {
                this.reconnectionTimer = setInterval(function () {
                    _this.reconnect();
                }, 500);
                returnValue = 'reconnecting';
            } else {
                returnValue = 'already reconnecting';
            }
            return returnValue;
        }
    }, {
        key: 'stopReconnection',
        value: function stopReconnection() {
            this.reconnectionTimer = clearInterval(this.reconnectionTimer);
        }
    }, {
        key: 'disconnect',
        value: function disconnect(allowReconnect) {
            if (!allowReconnect) {
                this.stopReconnection();
            }
            if (!this.socket) {
                return;
            }
            this.socket.close();
            delete this.socket;
            if (this.connected) {
                this.connected = false;
                this.emit('disconnect');
            }
            return true;
        }
    }, {
        key: 'reconnect',
        value: function reconnect() {
            var returnValue;

            if (this.connected) {
                this.stopReconnection();
                returnValue = 'stopReconnection';
            } else {
                this.disconnect(true);
                this.connect();
                returnValue = 'connect';
            }
            return returnValue;
        }
    }, {
        key: 'handleData',
        value: function handleData(data) {
            var message, frameObject, frame, deviceInfo;

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
            if (!this.connected && message.hasOwnProperty('frame')) {
                frame = message.frame;
                if (frame.hasOwnProperty('deviceInfo')) {
                    deviceInfo = frame.deviceInfo;
                    this.emit('deviceInfo', deviceInfo);
                    this.connected = true;
                    this.emit('connect');
                    return;
                }
            }

            if (!this.connected) {
                return;
            }

            if (message.hasOwnProperty('frame')) {
                frameObject = new _FrameJs.Frame(message.frame);
                this.emit(frameObject.type, frameObject);

                // Emit pose if existing
                if (frameObject.pose) {
                    this.emit('pose', frameObject.pose);
                }

                // Emit event if existing
                if (frameObject.event) {
                    this.emit('event', frameObject.event);
                }
            }
        }
    }, {
        key: 'connect',
        value: function connect() {
            var _this2 = this;

            var inBrowser = typeof window !== 'undefined';

            if (this.socket) {
                return 'socket already created';
            }

            this.emit('ready');

            if (inBrowser) {
                this.socket = new WebSocket(this.getUrl());
            } else {
                var ConnectionType = require('ws');
                this.socket = new ConnectionType(this.getUrl());
            }

            this.socket.onopen = function () {
                _this2.handleOpen();
            };
            this.socket.onclose = function (data) {
                _this2.handleClose(data.code, data.reason);
            };
            this.socket.onmessage = function (message) {
                _this2.handleData(message.data);
            };
            this.socket.onerror = function (data) {
                _this2.handleClose('connectError', data.data);
            };

            return true;
        }
    }, {
        key: 'send',
        value: function send(data) {
            if (typeof data !== 'object' || typeof data === 'string') {
                throw new Error('Parameter needs to be an object');
            }
            this.socket.send(JSON.stringify(data));
        }
    }]);

    return BaseConnection;
})(_events.EventEmitter);

exports.BaseConnection = BaseConnection;

},{"./../Frame.js":3,"events":1,"ws":undefined}]},{},[5])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsIi9Vc2Vycy9sb2dvdHlwZS9TaXRlcy9teW9qcy9zcmMvQ2lyY3VsYXJCdWZmZXIuanMiLCIvVXNlcnMvbG9nb3R5cGUvU2l0ZXMvbXlvanMvc3JjL0ZyYW1lLmpzIiwiL1VzZXJzL2xvZ290eXBlL1NpdGVzL215b2pzL3NyYy9IdWIuanMiLCIvVXNlcnMvbG9nb3R5cGUvU2l0ZXMvbXlvanMvc3JjL0luZGV4LmpzIiwiL1VzZXJzL2xvZ290eXBlL1NpdGVzL215b2pzL3NyYy9NeW8uanMiLCIvVXNlcnMvbG9nb3R5cGUvU2l0ZXMvbXlvanMvc3JjL1Bvc2UuanMiLCIvVXNlcnMvbG9nb3R5cGUvU2l0ZXMvbXlvanMvc3JjL1F1YXRlcm5pb24uanMiLCIvVXNlcnMvbG9nb3R5cGUvU2l0ZXMvbXlvanMvc3JjL1ZlY3RvcjMuanMiLCIvVXNlcnMvbG9nb3R5cGUvU2l0ZXMvbXlvanMvc3JjL2Nvbm5lY3Rpb24vQmFzZUNvbm5lY3Rpb24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7SUM3U2EsY0FBYztBQUNaLGFBREYsY0FBYyxDQUNYLElBQUksRUFBRTs4QkFEVCxjQUFjOztBQUduQixZQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztBQUNiLFlBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBQ2YsWUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7S0FDcEI7O2lCQU5RLGNBQWM7O2VBUXBCLGFBQUMsQ0FBQyxFQUFFO0FBQ0gsZ0JBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksRUFBRTtBQUNsQixpQkFBQyxHQUFHLENBQUMsQ0FBQzthQUNUO0FBQ0QsZ0JBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUU7QUFDaEIsdUJBQU8sSUFBSSxDQUFDO2FBQ2Y7QUFDRCxnQkFBSSxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7QUFDdkIsdUJBQU8sSUFBSSxDQUFDO2FBQ2Y7QUFDRCxtQkFBTyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBLEdBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3BEOzs7ZUFFRyxjQUFDLENBQUMsRUFBRTtBQUNKLGdCQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNwQyxtQkFBTyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7U0FDckI7OztXQXhCUSxjQUFjOzs7Ozs7Ozs7Ozs7Ozs7O3NCQ0FSLFdBQVc7OzRCQUNMLGlCQUFpQjs7eUJBQ3BCLGNBQWM7O0lBRXZCLEtBQUs7QUFDSCxhQURGLEtBQUssQ0FDRixJQUFJLEVBQUU7OEJBRFQsS0FBSzs7QUFHVixZQUFJLENBQUMsSUFBSSxFQUFFO0FBQ1Asa0JBQU0sSUFBSSxLQUFLLENBQUMsK0JBQStCLENBQUMsQ0FBQztTQUNwRDtBQUNELFlBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxFQUFFO0FBQzFCLGtCQUFNLElBQUksS0FBSyxDQUFDLDZDQUE2QyxDQUFDLENBQUM7U0FDbEU7QUFDRCxZQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsRUFBRSxLQUFLLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFO0FBQ2pFLGtCQUFNLElBQUksS0FBSyxDQUFDLHNDQUFzQyxDQUFDLENBQUM7U0FDM0Q7QUFDRCxZQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsSUFBSSxPQUFPLElBQUksQ0FBQyxTQUFTLEtBQUssUUFBUSxFQUFFO0FBQ3pFLGtCQUFNLElBQUksS0FBSyxDQUFDLHNDQUFzQyxDQUFDLENBQUM7U0FDM0Q7Ozs7Ozs7OztBQVNELFlBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQzs7Ozs7Ozs7QUFRbEIsWUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDOztBQUVoQyxZQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7QUFDWixnQkFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1NBQzNCOztBQUVELFlBQUksSUFBSSxDQUFDLElBQUksRUFBRTtBQUNYLGdCQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7U0FDekI7O0FBRUQsWUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFO0FBQ1osZ0JBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztTQUMzQjs7Ozs7Ozs7QUFRRCxZQUFJLElBQUksQ0FBQyxJQUFJLEVBQUU7QUFDWCxnQkFBSSxDQUFDLElBQUksR0FBRyxpQkFBUyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDbkMsTUFBTTtBQUNILGdCQUFJLENBQUMsSUFBSSxHQUFHLGFBQUssT0FBTyxFQUFFLENBQUM7U0FDOUI7Ozs7Ozs7O0FBUUQsWUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO0FBQ2YsZ0JBQUksQ0FBQyxRQUFRLEdBQUcsNkJBQWUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQ2pELE1BQU07QUFDSCxnQkFBSSxDQUFDLFFBQVEsR0FBRyx5QkFBVyxPQUFPLEVBQUUsQ0FBQztTQUN4Qzs7QUFFRCxZQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7QUFDWixnQkFBSSxDQUFDLEtBQUssR0FBRyx1QkFBWSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDeEMsTUFBTTtBQUNILGdCQUFJLENBQUMsS0FBSyxHQUFHLG1CQUFRLE9BQU8sRUFBRSxDQUFDO1NBQ2xDOztBQUVELFlBQUksSUFBSSxDQUFDLElBQUksRUFBRTtBQUNYLGdCQUFJLENBQUMsSUFBSSxHQUFHLHVCQUFZLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUN0QyxNQUFNO0FBQ0gsZ0JBQUksQ0FBQyxJQUFJLEdBQUcsbUJBQVEsT0FBTyxFQUFFLENBQUM7U0FDakM7Ozs7O0FBS0QsWUFBSSxJQUFJLENBQUMsR0FBRyxFQUFFO0FBQ1YsZ0JBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztTQUN2QixNQUFNO0FBQ0gsZ0JBQUksQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDO1NBQ2pCOztBQUVELFlBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ2pCLFlBQUksQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDO0tBQ3ZCOzs7Ozs7OztpQkE1RlEsS0FBSzs7ZUFtR04sb0JBQUc7QUFDUCxtQkFBTyxZQUFZLEdBQUcsSUFBSSxDQUFDLEVBQUUsR0FBRyxhQUFhLEdBQUcsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsR0FBRyxHQUFHLENBQUM7U0FDNUc7OztXQXJHUSxLQUFLOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztzQkNKUyxRQUFROztxQkFDakIsVUFBVTs7MENBQ0MsZ0NBQWdDOztnQ0FDaEMscUJBQXFCOztJQUVyQyxHQUFHO2NBQUgsR0FBRzs7QUFDRCxhQURGLEdBQUcsQ0FDQSxHQUFHLEVBQUU7Ozs4QkFEUixHQUFHOztBQUVSLG1DQUZLLEdBQUcsNkNBRUYsR0FBRyxFQUFFOztBQUVYLFlBQUksQ0FBQyxVQUFVLEdBQUcsK0NBQW1CLEdBQUcsQ0FBQyxDQUFDO0FBQzFDLFlBQUksQ0FBQyxPQUFPLEdBQUcscUNBQW1CLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZDLFlBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDOztBQUVmLFlBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7O0FBRTFCLFlBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxZQUFNO0FBQ25DLGtCQUFLLEdBQUcsR0FBRyxlQUFRLE1BQUssVUFBVSxDQUFDLENBQUM7U0FDdkMsQ0FBQyxDQUFDO0FBQ0gsWUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLFVBQUMsS0FBSyxFQUFLO0FBQ25DLGtCQUFLLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDekIsa0JBQUssSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztTQUM3QixDQUFDLENBQUM7QUFDSCxZQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsVUFBQyxJQUFJLEVBQUs7QUFDakMsa0JBQUssSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztTQUMzQixDQUFDLENBQUM7QUFDSCxZQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsVUFBQyxLQUFLLEVBQUs7QUFDbkMsa0JBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUN6QixDQUFDLENBQUM7QUFDSCxZQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsWUFBTTtBQUM5QixrQkFBSyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDdEIsQ0FBQyxDQUFDO0FBQ0gsWUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLFlBQU07QUFDaEMsa0JBQUssSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ3hCLENBQUMsQ0FBQztBQUNILFlBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxZQUFNO0FBQ25DLGtCQUFLLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztTQUMzQixDQUFDLENBQUM7S0FDTjs7Ozs7Ozs7Ozs7Ozs7Ozs7OztpQkFoQ1EsR0FBRzs7ZUFrRFAsZUFBQyxHQUFHLEVBQUU7QUFDUCxtQkFBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUM7U0FDeEM7Ozs7Ozs7Ozs7ZUFRUyxvQkFBQyxtQkFBbUIsRUFBRTtBQUM1QixnQkFBSSxDQUFDLG1CQUFtQixJQUFJLG1CQUFtQixLQUFLLFFBQVEsQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLENBQUMsRUFBRTtBQUNuRixzQkFBTSxJQUFJLEtBQUssQ0FBQyxpREFBaUQsQ0FBQyxDQUFDO2FBQ3RFO0FBQ0QsZ0JBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO0FBQ2pCLDRCQUFZLEVBQUUsbUJBQW1CO2FBQ3BDLENBQUMsQ0FBQztTQUNOOzs7Ozs7O2VBS0UsYUFBQyxvQkFBb0IsRUFBRTtBQUN0QixnQkFBSSxDQUFDLG9CQUFvQixJQUFJLG9CQUFvQixLQUFLLFFBQVEsQ0FBQyxvQkFBb0IsRUFBRSxFQUFFLENBQUMsRUFBRTtBQUN0RixzQkFBTSxJQUFJLEtBQUssQ0FBQyxrREFBa0QsQ0FBQyxDQUFDO2FBQ3ZFO0FBQ0QsZ0JBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO0FBQ2pCLHFCQUFLLEVBQUUsb0JBQW9CO2FBQzlCLENBQUMsQ0FBQztTQUNOOzs7Ozs7OztlQU1NLGlCQUFDLG9CQUFvQixFQUFFO0FBQzFCLGdCQUFJLENBQUMsb0JBQW9CLElBQUksb0JBQW9CLEtBQUssUUFBUSxDQUFDLG9CQUFvQixFQUFFLEVBQUUsQ0FBQyxFQUFFO0FBQ3RGLHNCQUFNLElBQUksS0FBSyxDQUFDLGtEQUFrRCxDQUFDLENBQUM7YUFDdkU7QUFDRCxnQkFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUM7QUFDakIseUJBQVMsRUFBRSxvQkFBb0I7YUFDbEMsQ0FBQyxDQUFDO1NBQ047Ozs7Ozs7OztlQU9PLG9CQUFHO0FBQ1AsbUJBQU8sZUFBZSxHQUFHLElBQUksQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDO1NBQy9DOzs7V0FyR1EsR0FBRzs7Ozs7Ozs7Ozs7Ozs7Ozs7MENDTGdDLGdDQUFnQzs7cUJBQ3RELFVBQVU7O3FCQUNWLFVBQVU7O2dDQUNZLHFCQUFxQjs7c0JBQ3pDLFdBQVc7OzRCQUNDLGlCQUFpQjs7eUJBQ3ZCLGNBQWM7O3VCQUNsQixZQUFZOztJQUU3QixLQUFLO0FBQ0gsYUFERixLQUFLLEdBQ0E7OEJBREwsS0FBSztLQUdiOztpQkFIUSxLQUFLOztlQUtPLDBCQUFHO0FBQ3BCLDhEQUF1QjtTQUMxQjs7O2VBRW9CLDBCQUFHO0FBQ3BCLG9EQUF1QjtTQUMxQjs7O2VBRVMsZUFBRztBQUNULG1CQUFPLGdCQUFVLENBQUM7U0FDckI7OztlQUVTLGVBQUc7QUFDVCw4QkFBWTtTQUNmOzs7ZUFFVyxpQkFBRztBQUNYLGtDQUFjO1NBQ2pCOzs7ZUFFVSxnQkFBRztBQUNWLGdDQUFhO1NBQ2hCOzs7ZUFFZ0Isc0JBQUc7QUFDaEIsNENBQW1CO1NBQ3RCOzs7ZUFFYSxtQkFBRztBQUNiLHNDQUFnQjtTQUNuQjs7O1dBbkNRLEtBQUs7Ozs7cUJBc0NILEtBQUs7Ozs7OztBQU1wQixNQUFNLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQzs7Ozs7Ozs7Ozs7Ozs7O0lDckROLEdBQUc7QUFDRCxhQURGLEdBQUcsQ0FDQSxPQUFPLEVBQUU7OEJBRFosR0FBRzs7QUFHUixZQUFJLENBQUMsT0FBTyxFQUFFO0FBQ1Ysa0JBQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztTQUN0Qzs7Ozs7O0FBTUQsWUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7S0FDMUI7Ozs7Ozs7Ozs7Ozs7aUJBWlEsR0FBRzs7ZUFxQkQsdUJBQUc7QUFDVixnQkFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7QUFDZCw2QkFBYSxFQUFFLElBQUk7YUFDdEIsQ0FBQyxDQUFDO1NBQ047Ozs7Ozs7OztlQU9NLGlCQUFDLE1BQU0sRUFBRTtBQUNaLG9CQUFRLE1BQU07QUFDVixxQkFBSyxHQUFHLENBQUMsZUFBZTtBQUNwQix3QkFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7QUFDZCxpQ0FBUyxFQUFFLFNBQVM7QUFDcEIsOEJBQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUM7cUJBQ2hDLENBQUMsQ0FBQztBQUNILDBCQUFNO0FBQUEsQUFDVixxQkFBSyxHQUFHLENBQUMsZ0JBQWdCO0FBQ3JCLHdCQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztBQUNkLGlDQUFTLEVBQUUsU0FBUztBQUNwQiw4QkFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDO3FCQUNqQyxDQUFDLENBQUM7QUFDSCwwQkFBTTtBQUFBLEFBQ1YscUJBQUssR0FBRyxDQUFDLGNBQWM7QUFDbkIsd0JBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO0FBQ2QsaUNBQVMsRUFBRSxTQUFTO0FBQ3BCLDhCQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDO3FCQUMvQixDQUFDLENBQUM7QUFDSCwwQkFBTTtBQUFBLEFBQ1Y7QUFDSSwwQkFBTSxJQUFJLEtBQUssQ0FBQyxpRkFBaUYsQ0FBQyxDQUFDO0FBQUEsYUFDMUc7U0FDSjs7Ozs7Ozs7O2VBT0ssZ0JBQUMsTUFBTSxFQUFFO0FBQ1gsb0JBQVEsTUFBTTtBQUNWLHFCQUFLLEdBQUcsQ0FBQyxZQUFZO0FBQ2pCLHdCQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztBQUNkLGlDQUFTLEVBQUUsUUFBUTtBQUNuQiw4QkFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQztxQkFDN0IsQ0FBQyxDQUFDO0FBQ0gsMEJBQU07QUFBQSxBQUNWLHFCQUFLLEdBQUcsQ0FBQyxXQUFXO0FBQ2hCLHdCQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztBQUNkLGlDQUFTLEVBQUUsUUFBUTtBQUNuQiw4QkFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQztxQkFDNUIsQ0FBQyxDQUFDO0FBQ0gsMEJBQU07QUFBQSxBQUNWO0FBQ0ksMEJBQU0sSUFBSSxLQUFLLENBQUMscURBQXFELENBQUMsQ0FBQztBQUFBLGFBQzlFO1NBQ0o7Ozs7Ozs7OztlQU9HLGdCQUFHO0FBQ0gsZ0JBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO0FBQ2QseUJBQVMsRUFBRSxNQUFNO2FBQ3BCLENBQUMsQ0FBQztTQUNOOzs7Ozs7Ozs7ZUFPZSwwQkFBQyxNQUFNLEVBQUU7QUFDckIsb0JBQVEsTUFBTTtBQUNWLHFCQUFLLEdBQUcsQ0FBQyxrQkFBa0I7QUFDdkIsd0JBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO0FBQ2QsaUNBQVMsRUFBRSxrQkFBa0I7QUFDN0IsOEJBQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQztxQkFDbkMsQ0FBQyxDQUFDO0FBQ0gsMEJBQU07QUFBQSxBQUNWO0FBQ0ksMEJBQU0sSUFBSSxLQUFLLENBQUMsMENBQTBDLENBQUMsQ0FBQztBQUFBLGFBQ25FO1NBQ0o7OztXQTVHUSxHQUFHOzs7O0FBa0hoQixHQUFHLENBQUMsZUFBZSxHQUFHLENBQUMsQ0FBQzs7Ozs7QUFLeEIsR0FBRyxDQUFDLGdCQUFnQixHQUFHLENBQUMsQ0FBQzs7Ozs7QUFLekIsR0FBRyxDQUFDLGNBQWMsR0FBRyxDQUFDLENBQUM7Ozs7O0FBS3ZCLEdBQUcsQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDOzs7OztBQUtyQixHQUFHLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQzs7Ozs7QUFLcEIsR0FBRyxDQUFDLGtCQUFrQixHQUFHLENBQUMsQ0FBQzs7Ozs7Ozs7Ozs7OztJQzNJZCxJQUFJO0FBQ0YsYUFERixJQUFJLENBQ0QsSUFBSSxFQUFFOzhCQURULElBQUk7O0FBR1QsWUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLElBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLGdCQUFnQixFQUFFO0FBQ3ZGLGtCQUFNLElBQUksS0FBSyxDQUFDLDZDQUE2QyxDQUFDLENBQUM7U0FDbEU7Ozs7O0FBS0QsWUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDOzs7OztBQUt0QixZQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQzs7QUFFN0MsWUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFO0FBQ1osZ0JBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLEVBQUU7QUFDdkUsc0JBQU0sSUFBSSxLQUFLLENBQUMsdUNBQXVDLENBQUMsQ0FBQzthQUM1RDtTQUNKO0tBQ0o7Ozs7OztpQkF0QlEsSUFBSTs7ZUF3QkosbUJBQUMsS0FBSyxFQUFFO0FBQ2IsbUJBQU8sSUFBSSxDQUFDLElBQUksS0FBSyxLQUFLLENBQUMsSUFBSSxDQUFDO1NBQ25DOzs7Ozs7Ozs7Ozs7Ozs7OztlQW9CTyxvQkFBRztBQUNQLGdCQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRTtBQUNiLHVCQUFPLGdCQUFnQixDQUFDO2FBQzNCO0FBQ0Qsb0JBQVEsSUFBSSxDQUFDLElBQUk7QUFDYixxQkFBSyxJQUFJLENBQUMsU0FBUztBQUNmLDJCQUFPLGFBQWEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLGFBQWEsQ0FBQztBQUFBLEFBQ2hFLHFCQUFLLElBQUksQ0FBQyxTQUFTO0FBQ2YsMkJBQU8sYUFBYSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsYUFBYSxDQUFDO0FBQUEsQUFDaEUscUJBQUssSUFBSSxDQUFDLFlBQVk7QUFDbEIsMkJBQU8sYUFBYSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsZ0JBQWdCLENBQUM7QUFBQSxBQUNuRSxxQkFBSyxJQUFJLENBQUMsYUFBYTtBQUNuQiwyQkFBTyxhQUFhLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxpQkFBaUIsQ0FBQztBQUFBLEFBQ3BFLHFCQUFLLElBQUksQ0FBQyxtQkFBbUI7QUFDekIsMkJBQU8sYUFBYSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsdUJBQXVCLENBQUM7QUFBQSxBQUMxRSxxQkFBSyxJQUFJLENBQUMsZUFBZTtBQUNyQiwyQkFBTyxhQUFhLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxtQkFBbUIsQ0FBQztBQUFBLEFBQ3RFO0FBQ0ksMkJBQU8sYUFBYSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsR0FBRyxDQUFDO0FBQUEsYUFDekQ7U0FDSjs7O2VBL0JhLG1CQUFHO0FBQ2IsbUJBQU8sSUFBSSxJQUFJLENBQUM7QUFDWix1QkFBTyxFQUFFLElBQUk7YUFDaEIsQ0FBQyxDQUFDO1NBQ047OztXQXZDUSxJQUFJOzs7O0FBd0VqQixJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQzs7Ozs7QUFLbkIsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7Ozs7O0FBS25CLElBQUksQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDOzs7OztBQUt0QixJQUFJLENBQUMsYUFBYSxHQUFHLENBQUMsQ0FBQzs7Ozs7QUFLdkIsSUFBSSxDQUFDLG1CQUFtQixHQUFHLENBQUMsQ0FBQzs7Ozs7QUFLN0IsSUFBSSxDQUFDLGVBQWUsR0FBRyxDQUFDLENBQUM7Ozs7Ozs7Ozs7Ozs7SUNqR1osVUFBVTtBQUNSLGFBREYsVUFBVSxDQUNQLElBQUksRUFBRTs4QkFEVCxVQUFVOzs7OztBQU1mLFlBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDOztBQUU3QyxZQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7QUFDWixnQkFBSSxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssZ0JBQWdCLEVBQUU7QUFDM0Qsc0JBQU0sSUFBSSxLQUFLLENBQUMsaUNBQWlDLENBQUMsQ0FBQzthQUN0RDtBQUNELGdCQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtBQUN0RSxzQkFBTSxJQUFJLEtBQUssQ0FBQyxrREFBa0QsQ0FBQyxDQUFDO2FBQ3ZFO0FBQ0QsZ0JBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2pCLGdCQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNqQixnQkFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDakIsZ0JBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3BCLE1BQU07QUFDSCxnQkFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7QUFDYixnQkFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7QUFDYixnQkFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7QUFDYixnQkFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7U0FDaEI7S0FDSjs7Ozs7Ozs7OztpQkF6QlEsVUFBVTs7ZUFrQ1Qsc0JBQUc7QUFDVCxnQkFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzs7QUFFakcsbUJBQU8sSUFBSSxVQUFVLENBQUMsQ0FDbEIsSUFBSSxDQUFDLENBQUMsR0FBRyxTQUFTLEVBQ2xCLElBQUksQ0FBQyxDQUFDLEdBQUcsU0FBUyxFQUNsQixJQUFJLENBQUMsQ0FBQyxHQUFHLFNBQVMsRUFDbEIsSUFBSSxDQUFDLENBQUMsR0FBRyxTQUFTLENBQ3JCLENBQUMsQ0FBQztTQUNOOzs7Ozs7OztlQU1RLHFCQUFHO0FBQ1IsbUJBQU8sSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsRUFDNUMsSUFBSSxDQUFDLENBQUMsQ0FDVCxDQUFDLENBQUM7U0FDTjs7Ozs7Ozs7O2VBT00sbUJBQUc7QUFDTix3QkFBWSxDQUFDO0FBQ2IsZ0JBQUksSUFBSSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUM7O0FBRTVELGVBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDdEIsZUFBRyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUN0QixlQUFHLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ3RCLGVBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDdEIsZ0JBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUM7QUFDN0IsZ0JBQUksR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ3pDLGdCQUFJLElBQUksR0FBRyxLQUFLLEdBQUcsSUFBSSxrQ0FBbUM7QUFDdEQsMkJBQU8sR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN6Qyw0QkFBUSxHQUFHLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZCLHdCQUFJLEdBQUcsQ0FBQyxDQUFDO2lCQUNaLE1BQU0sSUFBSSxJQUFJLEdBQUcsQ0FBQyxLQUFLLEdBQUcsSUFBSSxrQ0FBbUM7QUFDOUQsMkJBQU8sR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzFDLDRCQUFRLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUN4Qix3QkFBSSxHQUFHLENBQUMsQ0FBQztpQkFDWixNQUFNO0FBQ0gsdUJBQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQztBQUN2Rix3QkFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQztBQUN0QyxvQkFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUM7YUFDeEY7O0FBRUQsbUJBQU87QUFDSCx1QkFBTyxFQUFFLE9BQU87QUFDaEIsd0JBQVEsRUFBRSxRQUFRO0FBQ2xCLG9CQUFJLEVBQUUsSUFBSTthQUNiLENBQUM7U0FDTDs7Ozs7Ozs7ZUFNRyxnQkFBRztBQUNILG1CQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUMvRzs7Ozs7Ozs7ZUFNSSxpQkFBRztBQUNKLG1CQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUMvRzs7Ozs7Ozs7ZUFNRSxlQUFHO0FBQ0YsbUJBQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUMvRDs7Ozs7Ozs7Ozs7Ozs7Ozs7ZUFvQk8sb0JBQUc7QUFDUCxnQkFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUU7QUFDYix1QkFBTyxzQkFBc0IsQ0FBQzthQUNqQztBQUNELG1CQUFPLGdCQUFnQixHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO1NBQzdGOzs7ZUFoQmEsbUJBQUc7QUFDYixtQkFBTyxJQUFJLFVBQVUsQ0FBQztBQUNsQix1QkFBTyxFQUFFLElBQUk7YUFDaEIsQ0FBQyxDQUFDO1NBQ047OztXQTlIUSxVQUFVOzs7Ozs7Ozs7Ozs7Ozs7O0lDQVYsT0FBTztBQUNMLGFBREYsT0FBTyxDQUNKLElBQUksRUFBRTs4QkFEVCxPQUFPOztBQUdaLFlBQUksQ0FBQyxJQUFJLEVBQUU7QUFDUCxrQkFBTSxJQUFJLEtBQUssQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO1NBQ3BEO0FBQ0QsWUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUU7QUFDMUIsa0JBQU0sSUFBSSxLQUFLLENBQUMsNkNBQTZDLENBQUMsQ0FBQztTQUNsRTs7Ozs7QUFLRCxZQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQzs7QUFFN0MsWUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFO0FBQ1osZ0JBQUksQ0FBQyxJQUFJLElBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLGdCQUFnQixFQUFFO0FBQ3BFLHNCQUFNLElBQUksS0FBSyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7YUFDdEQ7QUFDRCxnQkFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtBQUNwRCxzQkFBTSxJQUFJLEtBQUssQ0FBQyxrREFBa0QsQ0FBQyxDQUFDO2FBQ3ZFO0FBQ0QsZ0JBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2pCLGdCQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNqQixnQkFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDcEIsTUFBTTtBQUNILGdCQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUNiLGdCQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUNiLGdCQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztTQUNoQjtLQUNKOzs7Ozs7OztpQkE5QlEsT0FBTzs7ZUFxQ1Isb0JBQUc7QUFDUCxtQkFBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNuRDs7Ozs7Ozs7OztlQVFHLGNBQUMsS0FBSyxFQUFFO0FBQ1IsbUJBQU8sSUFBSSxPQUFPLENBQUMsQ0FDZixJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQ2hCLElBQUksQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsRUFDaEIsSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUNuQixDQUFDLENBQUM7U0FDTjs7Ozs7Ozs7OztlQVFTLG9CQUFDLEtBQUssRUFBRTtBQUNkLGdCQUFJLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDbEIsZ0JBQUksQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQztBQUNsQixnQkFBSSxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQ2xCLG1CQUFPLElBQUksQ0FBQztTQUNmOzs7Ozs7Ozs7O2VBUUksZUFBQyxLQUFLLEVBQUU7QUFDVCxtQkFBTyxJQUFJLE9BQU8sQ0FBQyxDQUNmLElBQUksQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsRUFDaEIsSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUNoQixJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQ25CLENBQUMsQ0FBQztTQUNOOzs7Ozs7Ozs7O2VBUVUscUJBQUMsS0FBSyxFQUFFO0FBQ2YsZ0JBQUksQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQztBQUNsQixnQkFBSSxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQ2xCLGdCQUFJLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDbEIsbUJBQU8sSUFBSSxDQUFDO1NBQ2Y7Ozs7Ozs7Ozs7ZUFRTyxrQkFBQyxNQUFNLEVBQUU7QUFDYixtQkFBTyxJQUFJLE9BQU8sQ0FBQyxDQUNmLElBQUksQ0FBQyxDQUFDLEdBQUcsTUFBTSxFQUNmLElBQUksQ0FBQyxDQUFDLEdBQUcsTUFBTSxFQUNmLElBQUksQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUNsQixDQUFDLENBQUM7U0FDTjs7Ozs7Ozs7OztlQVFhLHdCQUFDLE1BQU0sRUFBRTtBQUNuQixnQkFBSSxDQUFDLENBQUMsSUFBSSxNQUFNLENBQUM7QUFDakIsZ0JBQUksQ0FBQyxDQUFDLElBQUksTUFBTSxDQUFDO0FBQ2pCLGdCQUFJLENBQUMsQ0FBQyxJQUFJLE1BQU0sQ0FBQztBQUNqQixtQkFBTyxJQUFJLENBQUM7U0FDZjs7Ozs7Ozs7OztlQVFLLGdCQUFDLE1BQU0sRUFBRTtBQUNYLG1CQUFPLElBQUksT0FBTyxDQUFDLENBQ2YsSUFBSSxDQUFDLENBQUMsR0FBRyxNQUFNLEVBQ2YsSUFBSSxDQUFDLENBQUMsR0FBRyxNQUFNLEVBQ2YsSUFBSSxDQUFDLENBQUMsR0FBRyxNQUFNLENBQ2xCLENBQUMsQ0FBQztTQUNOOzs7Ozs7Ozs7O2VBUVcsc0JBQUMsTUFBTSxFQUFFO0FBQ2pCLGdCQUFJLENBQUMsQ0FBQyxJQUFJLE1BQU0sQ0FBQztBQUNqQixnQkFBSSxDQUFDLENBQUMsSUFBSSxNQUFNLENBQUM7QUFDakIsZ0JBQUksQ0FBQyxDQUFDLElBQUksTUFBTSxDQUFDO0FBQ2pCLG1CQUFPLElBQUksQ0FBQztTQUNmOzs7Ozs7Ozs7O2VBUVEsbUJBQUMsS0FBSyxFQUFFO0FBQ2IsbUJBQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxLQUFLLEtBQUssQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsS0FBSyxLQUFLLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQSxBQUFDLENBQUM7U0FDNUU7Ozs7Ozs7Ozs7Ozs7Ozs7OztlQWdCTSxpQkFBQyxLQUFLLEVBQUU7QUFDWCxnQkFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsS0FBSyxDQUFDLGdCQUFnQixFQUFFO2dCQUMxRCxXQUFXLENBQUM7O0FBRWhCLGdCQUFJLEtBQUssSUFBSSxDQUFDLEVBQUU7QUFDWiwyQkFBVyxHQUFHLENBQUMsQ0FBQzthQUNuQixNQUFNO0FBQ0gsMkJBQVcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2FBQy9EO0FBQ0QsbUJBQU8sV0FBVyxDQUFDO1NBQ3RCOzs7Ozs7Ozs7Ozs7Ozs7O2VBY0ksZUFBQyxLQUFLLEVBQUU7QUFDVCxtQkFBTyxJQUFJLE9BQU8sQ0FBQyxDQUNmLElBQUksQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQ25DLElBQUksQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQ25DLElBQUksQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQ3RDLENBQUMsQ0FBQztTQUNOOzs7Ozs7Ozs7Ozs7ZUFVUyxvQkFBQyxLQUFLLEVBQUU7QUFDZCxtQkFBTyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFBLElBQUssSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFBLEFBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQSxJQUFLLElBQUksQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQSxBQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUEsSUFBSyxJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUEsQUFBQyxDQUFDLENBQUM7U0FDako7Ozs7Ozs7Ozs7Ozs7ZUFXRSxhQUFDLEtBQUssRUFBRTtBQUNQLG1CQUFPLElBQUksQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO1NBQ2pFOzs7Ozs7Ozs7ZUFPTSxtQkFBRztBQUNOLG1CQUFPLElBQUksQ0FBQyxDQUFDLElBQUksTUFBTSxDQUFDLFNBQVMsSUFDN0IsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLElBQzNCLElBQUksQ0FBQyxDQUFDLElBQUksTUFBTSxDQUFDLFNBQVMsSUFDMUIsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLElBQzNCLElBQUksQ0FBQyxDQUFDLElBQUksTUFBTSxDQUFDLFNBQVMsSUFDMUIsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUM7U0FDbkM7Ozs7Ozs7Ozs7Ozs7ZUFXUSxxQkFBRztBQUNSLG1CQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUN6RTs7Ozs7Ozs7O2VBT2UsNEJBQUc7QUFDZixtQkFBTyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztTQUM5RDs7Ozs7Ozs7Ozs7ZUFTUyxzQkFBRztBQUNULGdCQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztBQUNwQyxnQkFBSSxLQUFLLElBQUksQ0FBQyxFQUFFO0FBQ1osdUJBQU8sSUFBSSxPQUFPLENBQUMsQ0FDZixDQUFDLEVBQ0QsQ0FBQyxFQUNELENBQUMsQ0FDSixDQUFDLENBQUM7YUFDTjs7QUFFRCxpQkFBSyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzdCLG1CQUFPLElBQUksT0FBTyxDQUFDLENBQ2YsSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLEVBQ2QsSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLEVBQ2QsSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQ2pCLENBQUMsQ0FBQztTQUNOOzs7Ozs7Ozs7Ozs7Ozs7ZUFhSSxpQkFBRztBQUNKLG1CQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUN0Qzs7Ozs7Ozs7Ozs7Ozs7OztlQWNFLGVBQUc7QUFDRixtQkFBTyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDdEM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2VBa0JHLGdCQUFHO0FBQ0gsbUJBQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3RDOzs7Ozs7Ozs7Ozs7Ozs7ZUF3SU8sb0JBQUc7QUFDUCxnQkFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUU7QUFDYix1QkFBTyxtQkFBbUIsQ0FBQzthQUM5QjtBQUNELG1CQUFPLGFBQWEsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztTQUN6RTs7O2VBdElVLGdCQUFHO0FBQ1YsbUJBQU8sSUFBSSxPQUFPLENBQUMsQ0FDZixDQUFDLEVBQ0QsQ0FBQyxFQUNELENBQUMsQ0FDSixDQUFDLENBQUM7U0FDTjs7Ozs7Ozs7O2VBT1csaUJBQUc7QUFDWCxtQkFBTyxJQUFJLE9BQU8sQ0FBQyxDQUNmLENBQUMsRUFDRCxDQUFDLEVBQ0QsQ0FBQyxDQUNKLENBQUMsQ0FBQztTQUNOOzs7Ozs7Ozs7ZUFPVyxpQkFBRztBQUNYLG1CQUFPLElBQUksT0FBTyxDQUFDLENBQ2YsQ0FBQyxFQUNELENBQUMsRUFDRCxDQUFDLENBQ0osQ0FBQyxDQUFDO1NBQ047Ozs7Ozs7OztlQU9XLGlCQUFHO0FBQ1gsbUJBQU8sSUFBSSxPQUFPLENBQUMsQ0FDZixDQUFDLEVBQ0QsQ0FBQyxFQUNELENBQUMsQ0FDSixDQUFDLENBQUM7U0FDTjs7Ozs7Ozs7O2VBT1UsZ0JBQUc7QUFDVixtQkFBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUNsQixDQUFDLEVBQ0QsQ0FBQyxDQUNKLENBQUMsQ0FBQztTQUNOOzs7Ozs7Ozs7ZUFPVyxpQkFBRztBQUNYLG1CQUFPLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztTQUMxQjs7Ozs7Ozs7O2VBT1UsZ0JBQUc7QUFDVixtQkFBTyxJQUFJLE9BQU8sQ0FBQyxDQUNmLENBQUMsRUFBRSxDQUFDLENBQUMsRUFDTCxDQUFDLENBQ0osQ0FBQyxDQUFDO1NBQ047Ozs7Ozs7OztlQU9RLGNBQUc7QUFDUixtQkFBTyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7U0FDMUI7Ozs7Ozs7OztlQU9hLG1CQUFHO0FBQ2IsbUJBQU8sSUFBSSxPQUFPLENBQUMsQ0FDZixDQUFDLEVBQ0QsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUNSLENBQUMsQ0FBQztTQUNOOzs7Ozs7Ozs7ZUFPYyxvQkFBRztBQUNkLG1CQUFPLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztTQUMxQjs7Ozs7Ozs7Ozs7O2VBVWEsbUJBQUc7QUFDYixtQkFBTyxJQUFJLE9BQU8sQ0FBQztBQUNmLHVCQUFPLEVBQUUsSUFBSTthQUNoQixDQUFDLENBQUM7U0FDTjs7O1dBcmRRLE9BQU87Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3NCQ0FPLFFBQVE7O3VCQUNmLGVBQWU7O0lBRXRCLGNBQWM7Y0FBZCxjQUFjOztBQUNaLGFBREYsY0FBYyxHQUM2Qjt5RUFBSixFQUFFOzs2QkFBckMsSUFBSTtZQUFKLElBQUksNkJBQUcsV0FBVzs2QkFBRSxJQUFJO1lBQUosSUFBSSw2QkFBRyxJQUFJOzs4QkFEbkMsY0FBYzs7QUFFbkIsbUNBRkssY0FBYyw2Q0FFWDs7QUFFUixZQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRTtBQUMxQixrQkFBTSxJQUFJLEtBQUssQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO1NBQ3REO0FBQ0QsWUFBSSxJQUFJLEtBQUssUUFBUSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsRUFBRTtBQUM3QixrQkFBTSxJQUFJLEtBQUssQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDO1NBQ3ZEOztBQUVELFlBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ2pCLFlBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ2pCLFlBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO0tBQzFCOztpQkFkUSxjQUFjOztlQWdCakIsa0JBQUc7QUFDTCxtQkFBTyxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7U0FDdEQ7OztlQUVTLHNCQUFHO0FBQ1QsZ0JBQUksV0FBVyxDQUFDOztBQUVoQixnQkFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUU7QUFDakIsb0JBQUksQ0FBQyxJQUFJLENBQUM7QUFDTiw2QkFBUyxFQUFFLG1CQUFtQjtpQkFDakMsQ0FBQyxDQUFDO0FBQ0gsMkJBQVcsR0FBRyxZQUFZLENBQUM7YUFDOUIsTUFBTTtBQUNILDJCQUFXLEdBQUcsV0FBVyxDQUFDO2FBQzdCO0FBQ0QsbUJBQU8sV0FBVyxDQUFDO1NBQ3RCOzs7ZUFFVSx1QkFBRztBQUNWLGdCQUFJLFdBQVcsQ0FBQzs7QUFFaEIsZ0JBQUksSUFBSSxDQUFDLFNBQVMsRUFBRTtBQUNoQixvQkFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQ2xCLG9CQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztBQUN6QiwyQkFBVyxHQUFHLGVBQWUsQ0FBQzthQUNqQyxNQUFNO0FBQ0gsMkJBQVcsR0FBRyxjQUFjLENBQUM7YUFDaEM7QUFDRCxtQkFBTyxXQUFXLENBQUM7U0FDdEI7OztlQUVnQiw2QkFBRzs7O0FBQ2hCLGdCQUFJLFdBQVcsQ0FBQzs7QUFFaEIsZ0JBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUU7QUFDekIsb0JBQUksQ0FBQyxpQkFBaUIsR0FBRyxXQUFXLENBQUMsWUFBTTtBQUN2QywwQkFBSyxTQUFTLEVBQUUsQ0FBQztpQkFDcEIsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNSLDJCQUFXLEdBQUcsY0FBYyxDQUFDO2FBQ2hDLE1BQU07QUFDSCwyQkFBVyxHQUFHLHNCQUFzQixDQUFDO2FBQ3hDO0FBQ0QsbUJBQU8sV0FBVyxDQUFDO1NBQ3RCOzs7ZUFFZSw0QkFBRztBQUNmLGdCQUFJLENBQUMsaUJBQWlCLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1NBQ2xFOzs7ZUFFUyxvQkFBQyxjQUFjLEVBQUU7QUFDdkIsZ0JBQUksQ0FBQyxjQUFjLEVBQUU7QUFDakIsb0JBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2FBQzNCO0FBQ0QsZ0JBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFO0FBQ2QsdUJBQU87YUFDVjtBQUNELGdCQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ3BCLG1CQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7QUFDbkIsZ0JBQUksSUFBSSxDQUFDLFNBQVMsRUFBRTtBQUNoQixvQkFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7QUFDdkIsb0JBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7YUFDM0I7QUFDRCxtQkFBTyxJQUFJLENBQUM7U0FDZjs7O2VBRVEscUJBQUc7QUFDUixnQkFBSSxXQUFXLENBQUM7O0FBRWhCLGdCQUFJLElBQUksQ0FBQyxTQUFTLEVBQUU7QUFDaEIsb0JBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0FBQ3hCLDJCQUFXLEdBQUcsa0JBQWtCLENBQUM7YUFDcEMsTUFBTTtBQUNILG9CQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3RCLG9CQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDZiwyQkFBVyxHQUFHLFNBQVMsQ0FBQzthQUMzQjtBQUNELG1CQUFPLFdBQVcsQ0FBQztTQUN0Qjs7O2VBRVMsb0JBQUMsSUFBSSxFQUFFO0FBQ2IsZ0JBQUksT0FBTyxFQUNQLFdBQVcsRUFDWCxLQUFLLEVBQ0wsVUFBVSxDQUFDOztBQUVmLGdCQUFJLENBQUMsSUFBSSxFQUFFO0FBQ1Asc0JBQU0sSUFBSSxLQUFLLENBQUMsa0JBQWtCLENBQUMsQ0FBQzthQUN2Qzs7O0FBR0QsZ0JBQUk7QUFDQSx1QkFBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDOUIsQ0FBQyxPQUFPLFNBQVMsRUFBRTtBQUNoQixzQkFBTSxJQUFJLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQzthQUNuQzs7O0FBR0QsZ0JBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxJQUFJLE9BQU8sQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLEVBQUU7QUFDcEQscUJBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDO0FBQ3RCLG9CQUFJLEtBQUssQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLEVBQUU7QUFDcEMsOEJBQVUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDO0FBQzlCLHdCQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxVQUFVLENBQUMsQ0FBQztBQUNwQyx3QkFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7QUFDdEIsd0JBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDckIsMkJBQU87aUJBQ1Y7YUFDSjs7QUFFRCxnQkFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUU7QUFDakIsdUJBQU87YUFDVjs7QUFFRCxnQkFBSSxPQUFPLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxFQUFFO0FBQ2pDLDJCQUFXLEdBQUcsbUJBQVUsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3ZDLG9CQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUM7OztBQUd6QyxvQkFBSSxXQUFXLENBQUMsSUFBSSxFQUFFO0FBQ2xCLHdCQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7aUJBQ3ZDOzs7QUFHRCxvQkFBSSxXQUFXLENBQUMsS0FBSyxFQUFFO0FBQ25CLHdCQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7aUJBQ3pDO2FBQ0o7U0FDSjs7O2VBRU0sbUJBQUc7OztBQUNOLGdCQUFJLFNBQVMsR0FBRyxPQUFPLE1BQU0sQUFBQyxLQUFLLFdBQVcsQ0FBQzs7QUFFL0MsZ0JBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtBQUNiLHVCQUFPLHdCQUF3QixDQUFDO2FBQ25DOztBQUVELGdCQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDOztBQUVuQixnQkFBSSxTQUFTLEVBQUU7QUFDWCxvQkFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQzthQUM5QyxNQUFNO0FBQ0gsb0JBQU0sY0FBYyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNyQyxvQkFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLGNBQWMsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQzthQUNuRDs7QUFFRCxnQkFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsWUFBTTtBQUN2Qix1QkFBSyxVQUFVLEVBQUUsQ0FBQzthQUNyQixDQUFDO0FBQ0YsZ0JBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxHQUFHLFVBQUMsSUFBSSxFQUFLO0FBQzVCLHVCQUFLLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQzthQUM1QyxDQUFDO0FBQ0YsZ0JBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxHQUFHLFVBQUMsT0FBTyxFQUFLO0FBQ2pDLHVCQUFLLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDakMsQ0FBQztBQUNGLGdCQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sR0FBRyxVQUFDLElBQUksRUFBSztBQUM1Qix1QkFBSyxXQUFXLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUMvQyxDQUFDOztBQUVGLG1CQUFPLElBQUksQ0FBQztTQUNmOzs7ZUFFRyxjQUFDLElBQUksRUFBRTtBQUNQLGdCQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUU7QUFDdEQsc0JBQU0sSUFBSSxLQUFLLENBQUMsaUNBQWlDLENBQUMsQ0FBQzthQUN0RDtBQUNELGdCQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7U0FDMUM7OztXQXJMUSxjQUFjIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIHRoaXMuX2V2ZW50cyA9IHRoaXMuX2V2ZW50cyB8fCB7fTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gdGhpcy5fbWF4TGlzdGVuZXJzIHx8IHVuZGVmaW5lZDtcbn1cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuXG4vLyBCYWNrd2FyZHMtY29tcGF0IHdpdGggbm9kZSAwLjEwLnhcbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX21heExpc3RlbmVycyA9IHVuZGVmaW5lZDtcblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhbiAxMCBsaXN0ZW5lcnMgYXJlXG4vLyBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcblxuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICBpZiAoIWlzTnVtYmVyKG4pIHx8IG4gPCAwIHx8IGlzTmFOKG4pKVxuICAgIHRocm93IFR5cGVFcnJvcignbiBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gIHRoaXMuX21heExpc3RlbmVycyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgZXIsIGhhbmRsZXIsIGxlbiwgYXJncywgaSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cy5lcnJvciB8fFxuICAgICAgICAoaXNPYmplY3QodGhpcy5fZXZlbnRzLmVycm9yKSAmJiAhdGhpcy5fZXZlbnRzLmVycm9yLmxlbmd0aCkpIHtcbiAgICAgIGVyID0gYXJndW1lbnRzWzFdO1xuICAgICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgZXI7IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoJ1VuY2F1Z2h0LCB1bnNwZWNpZmllZCBcImVycm9yXCIgZXZlbnQuJyk7XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNVbmRlZmluZWQoaGFuZGxlcikpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGhhbmRsZXIpKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QoaGFuZGxlcikpIHtcbiAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG5cbiAgICBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICBpZiAodGhpcy5fZXZlbnRzLm5ld0xpc3RlbmVyKVxuICAgIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLFxuICAgICAgICAgICAgICBpc0Z1bmN0aW9uKGxpc3RlbmVyLmxpc3RlbmVyKSA/XG4gICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICBlbHNlIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2VcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG5cbiAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkgJiYgIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICB2YXIgbTtcbiAgICBpZiAoIWlzVW5kZWZpbmVkKHRoaXMuX21heExpc3RlbmVycykpIHtcbiAgICAgIG0gPSB0aGlzLl9tYXhMaXN0ZW5lcnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9XG5cbiAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgIGlmICh0eXBlb2YgY29uc29sZS50cmFjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBub3Qgc3VwcG9ydGVkIGluIElFIDEwXG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgdmFyIGZpcmVkID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gZygpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuXG4gICAgaWYgKCFmaXJlZCkge1xuICAgICAgZmlyZWQgPSB0cnVlO1xuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICBnLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHRoaXMub24odHlwZSwgZyk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBlbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWZmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZFxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBsaXN0LCBwb3NpdGlvbiwgbGVuZ3RoLCBpO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGxlbmd0aCA9IGxpc3QubGVuZ3RoO1xuICBwb3NpdGlvbiA9IC0xO1xuXG4gIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fFxuICAgICAgKGlzRnVuY3Rpb24obGlzdC5saXN0ZW5lcikgJiYgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGxpc3QpKSB7XG4gICAgZm9yIChpID0gbGVuZ3RoOyBpLS0gPiAwOykge1xuICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGxpc3RbaV0ubGlzdGVuZXIgJiYgbGlzdFtpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uIDwgMClcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaXN0LnNwbGljZShwb3NpdGlvbiwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIga2V5LCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgLy8gbm90IGxpc3RlbmluZyBmb3IgcmVtb3ZlTGlzdGVuZXIsIG5vIG5lZWQgdG8gZW1pdFxuICBpZiAoIXRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGZvciAoa2V5IGluIHRoaXMuX2V2ZW50cykge1xuICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhrZXkpO1xuICAgIH1cbiAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNGdW5jdGlvbihsaXN0ZW5lcnMpKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICB9IGVsc2Uge1xuICAgIC8vIExJRk8gb3JkZXJcbiAgICB3aGlsZSAobGlzdGVuZXJzLmxlbmd0aClcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzW2xpc3RlbmVycy5sZW5ndGggLSAxXSk7XG4gIH1cbiAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IFtdO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIGVsc2VcbiAgICByZXQgPSB0aGlzLl9ldmVudHNbdHlwZV0uc2xpY2UoKTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbkV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIWVtaXR0ZXIuX2V2ZW50cyB8fCAhZW1pdHRlci5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IDA7XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24oZW1pdHRlci5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSAxO1xuICBlbHNlXG4gICAgcmV0ID0gZW1pdHRlci5fZXZlbnRzW3R5cGVdLmxlbmd0aDtcbiAgcmV0dXJuIHJldDtcbn07XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbiIsImV4cG9ydCBjbGFzcyBDaXJjdWxhckJ1ZmZlciB7XG4gICAgY29uc3RydWN0b3Ioc2l6ZSkge1xuXG4gICAgICAgIHRoaXMucG9zID0gMDtcbiAgICAgICAgdGhpcy5fYnVmID0gW107XG4gICAgICAgIHRoaXMuc2l6ZSA9IHNpemU7XG4gICAgfVxuXG4gICAgZ2V0KGkpIHtcbiAgICAgICAgaWYgKCFpIHx8IGkgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGkgPSAwO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpID49IHRoaXMuc2l6ZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGkgPj0gdGhpcy5fYnVmLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX2J1ZlsodGhpcy5wb3MgLSBpIC0gMSkgJSB0aGlzLnNpemVdO1xuICAgIH1cblxuICAgIHB1c2gobykge1xuICAgICAgICB0aGlzLl9idWZbdGhpcy5wb3MgJSB0aGlzLnNpemVdID0gbztcbiAgICAgICAgcmV0dXJuIHRoaXMucG9zKys7XG4gICAgfVxufSIsImltcG9ydCB7UG9zZX0gZnJvbSAnLi9Qb3NlLmpzJztcbmltcG9ydCB7UXVhdGVybmlvbn0gZnJvbSAnLi9RdWF0ZXJuaW9uLmpzJztcbmltcG9ydCB7VmVjdG9yM30gZnJvbSAnLi9WZWN0b3IzLmpzJztcblxuZXhwb3J0IGNsYXNzIEZyYW1lIHtcbiAgICBjb25zdHJ1Y3RvcihkYXRhKSB7XG5cbiAgICAgICAgaWYgKCFkYXRhKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01pc3NpbmcgY29uc3RydWN0b3IgYXJndW1lbnRzJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBkYXRhICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb25zdHJ1Y3RvciBwYXJhbWV0ZXIgbmVlZHMgdG8gYmUgYW4gb2JqZWN0Jyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFkYXRhLmhhc093blByb3BlcnR5KCdpZCcpIHx8IGRhdGEuaWQgIT09IHBhcnNlSW50KGRhdGEuaWQsIDEwKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGcmFtZSBpZCBuZWVkcyB0byBiZSBvZiB0eXBlIGludGVnZXInKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWRhdGEuaGFzT3duUHJvcGVydHkoJ3RpbWVzdGFtcCcpIHx8IHR5cGVvZiBkYXRhLnRpbWVzdGFtcCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGltZXN0YW1wIG5lZWRzIHRvIGJlIG9mIHR5cGUgc3RyaW5nJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogQSB1bmlxdWUgSUQgZm9yIHRoaXMgRnJhbWUuIENvbnNlY3V0aXZlIGZyYW1lcyBwcm9jZXNzZWQgYnkgdGhlIE15b1xuICAgICAgICAgKiBoYXZlIGNvbnNlY3V0aXZlIGluY3JlYXNpbmcgdmFsdWVzLlxuICAgICAgICAgKiBAbWVtYmVyIGlkXG4gICAgICAgICAqIEBtZW1iZXJvZiBNeW8uRnJhbWUucHJvdG90eXBlXG4gICAgICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmlkID0gZGF0YS5pZDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGZyYW1lIGNhcHR1cmUgdGltZSBpbiBtaWNyb3NlY29uZHMgZWxhcHNlZCBzaW5jZSB0aGUgTXlvIHN0YXJ0ZWQuXG4gICAgICAgICAqIEBtZW1iZXIgdGltZXN0YW1wXG4gICAgICAgICAqIEBtZW1iZXJvZiBNeW8uRnJhbWUucHJvdG90eXBlXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnRpbWVzdGFtcCA9IGRhdGEudGltZXN0YW1wO1xuXG4gICAgICAgIGlmIChkYXRhLmV1bGVyKSB7XG4gICAgICAgICAgICB0aGlzLmV1bGVyID0gZGF0YS5ldWxlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXRhLnJzc2kpIHtcbiAgICAgICAgICAgIHRoaXMucnNzaSA9IGRhdGEucnNzaTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXRhLmV2ZW50KSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50ID0gZGF0YS5ldmVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBIGNoYW5nZSBpbiBwb3NlIGhhcyBiZWVuIGRldGVjdGVkLlxuICAgICAgICAgKiBAbWVtYmVyIHBvc2VcbiAgICAgICAgICogQG1lbWJlcm9mIE15by5Qb3NlLnByb3RvdHlwZVxuICAgICAgICAgKiBAdHlwZSB7UG9zZX1cbiAgICAgICAgICovXG4gICAgICAgIGlmIChkYXRhLnBvc2UpIHtcbiAgICAgICAgICAgIHRoaXMucG9zZSA9IG5ldyBQb3NlKGRhdGEucG9zZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnBvc2UgPSBQb3NlLmludmFsaWQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBIGNoYW5nZSBpbiBwb3NlIGhhcyBiZWVuIGRldGVjdGVkLlxuICAgICAgICAgKiBAbWVtYmVyIHBvc2VcbiAgICAgICAgICogQG1lbWJlcm9mIE15by5Qb3NlLnByb3RvdHlwZVxuICAgICAgICAgKiBAdHlwZSB7UG9zZX1cbiAgICAgICAgICovXG4gICAgICAgIGlmIChkYXRhLnJvdGF0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLnJvdGF0aW9uID0gbmV3IFF1YXRlcm5pb24oZGF0YS5yb3RhdGlvbik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnJvdGF0aW9uID0gUXVhdGVybmlvbi5pbnZhbGlkKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGF0YS5hY2NlbCkge1xuICAgICAgICAgICAgdGhpcy5hY2NlbCA9IG5ldyBWZWN0b3IzKGRhdGEuYWNjZWwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5hY2NlbCA9IFZlY3RvcjMuaW52YWxpZCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRhdGEuZ3lybykge1xuICAgICAgICAgICAgdGhpcy5neXJvID0gbmV3IFZlY3RvcjMoZGF0YS5neXJvKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZ3lybyA9IFZlY3RvcjMuaW52YWxpZCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEVNRyBkYXRhXG4gICAgICAgICAqL1xuICAgICAgICBpZiAoZGF0YS5lbWcpIHtcbiAgICAgICAgICAgIHRoaXMuZW1nID0gZGF0YS5lbWc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmVtZyA9IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICAgICAgdGhpcy50eXBlID0gJ2ZyYW1lJztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgc3RyaW5nIGNvbnRhaW5pbmcgdGhpcyBGcmFtZSBpbiBhIGh1bWFuIHJlYWRhYmxlIGZvcm1hdC5cbiAgICAgKiBAcmV0dXJuXG4gICAgICpcbiAgICAgKi9cbiAgICB0b1N0cmluZygpIHtcbiAgICAgICAgcmV0dXJuICdbRnJhbWUgaWQ6JyArIHRoaXMuaWQgKyAnIHRpbWVzdGFtcDonICsgdGhpcy50aW1lc3RhbXAgKyAnIGFjY2VsOicgKyB0aGlzLmFjY2VsLnRvU3RyaW5nKCkgKyAnXSc7XG4gICAgfVxufSIsImltcG9ydCB7RXZlbnRFbWl0dGVyfSBmcm9tICdldmVudHMnO1xuaW1wb3J0IHtNeW99IGZyb20gJy4vTXlvLmpzJztcbmltcG9ydCB7QmFzZUNvbm5lY3Rpb259IGZyb20gJy4vY29ubmVjdGlvbi9CYXNlQ29ubmVjdGlvbi5qcyc7XG5pbXBvcnQge0NpcmN1bGFyQnVmZmVyfSBmcm9tICcuL0NpcmN1bGFyQnVmZmVyLmpzJztcblxuZXhwb3J0IGNsYXNzIEh1YiBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gICAgY29uc3RydWN0b3Iob3B0KSB7XG4gICAgICAgIHN1cGVyKG9wdCk7XG5cbiAgICAgICAgdGhpcy5jb25uZWN0aW9uID0gbmV3IEJhc2VDb25uZWN0aW9uKG9wdCk7XG4gICAgICAgIHRoaXMuaGlzdG9yeSA9IG5ldyBDaXJjdWxhckJ1ZmZlcigyMDApO1xuICAgICAgICB0aGlzLm15b3MgPSBbXTtcblxuICAgICAgICB0aGlzLmNvbm5lY3Rpb24uY29ubmVjdCgpO1xuXG4gICAgICAgIHRoaXMuY29ubmVjdGlvbi5vbignZGV2aWNlSW5mbycsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMubXlvID0gbmV3IE15byh0aGlzLmNvbm5lY3Rpb24pO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uLm9uKCdmcmFtZScsIChmcmFtZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5oaXN0b3J5LnB1c2goZnJhbWUpO1xuICAgICAgICAgICAgdGhpcy5lbWl0KCdmcmFtZScsIGZyYW1lKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuY29ubmVjdGlvbi5vbigncG9zZScsIChwb3NlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmVtaXQoJ3Bvc2UnLCBwb3NlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuY29ubmVjdGlvbi5vbignZXZlbnQnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZW1pdChldmVudC50eXBlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuY29ubmVjdGlvbi5vbigncmVhZHknLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmVtaXQoJ3JlYWR5Jyk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmNvbm5lY3Rpb24ub24oJ2Nvbm5lY3QnLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmVtaXQoJ2Nvbm5lY3QnKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuY29ubmVjdGlvbi5vbignZGlzY29ubmVjdCcsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnZGlzY29ubmVjdCcpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgZnJhbWUgb2YgdHJhY2tpbmcgZGF0YSBmcm9tIHRoZSBNeW8uXG4gICAgICpcbiAgICAgKiBVc2UgdGhlIG9wdGlvbmFsIGhpc3RvcnkgcGFyYW1ldGVyIHRvIHNwZWNpZnkgd2hpY2ggZnJhbWUgdG8gcmV0cmlldmUuXG4gICAgICogQ2FsbCBmcmFtZSgpIG9yIGZyYW1lKDApIHRvIGFjY2VzcyB0aGUgbW9zdCByZWNlbnQgZnJhbWU7IGNhbGwgZnJhbWUoMSkgdG9cbiAgICAgKiBhY2Nlc3MgdGhlIHByZXZpb3VzIGZyYW1lLCBhbmQgc28gb24uIElmIHlvdSB1c2UgYSBoaXN0b3J5IHZhbHVlIGdyZWF0ZXJcbiAgICAgKiB0aGFuIHRoZSBudW1iZXIgb2Ygc3RvcmVkIGZyYW1lcywgdGhlbiB0aGUgaHViIHJldHVybnMgYW4gaW52YWxpZCBmcmFtZS5cbiAgICAgKlxuICAgICAqIEBtZXRob2QgZnJhbWVcbiAgICAgKiBAbWVtYmVyb2YgTXlvLmh1Yi5wcm90b3R5cGVcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbnVtIFRoZSBhZ2Ugb2YgdGhlIGZyYW1lIHRvIHJldHVybiwgY291bnRpbmcgYmFja3dhcmRzIGZyb21cbiAgICAgKiB0aGUgbW9zdCByZWNlbnQgZnJhbWUgKDApIGludG8gdGhlIHBhc3QgYW5kIHVwIHRvIHRoZSBtYXhpbXVtIGFnZSAoNTkpLlxuICAgICAqIEByZXR1cm5zIHtNeW8uRnJhbWV9IFRoZSBzcGVjaWZpZWQgZnJhbWU7IG9yLCBpZiBubyBoaXN0b3J5XG4gICAgICogcGFyYW1ldGVyIGlzIHNwZWNpZmllZCwgdGhlIG5ld2VzdCBmcmFtZS4gSWYgYSBmcmFtZSBpcyBub3QgYXZhaWxhYmxlIGF0XG4gICAgICogdGhlIHNwZWNpZmllZCBoaXN0b3J5IHBvc2l0aW9uLCBhbiBpbnZhbGlkIEZyYW1lIGlzIHJldHVybmVkLlxuICAgICAqKi9cbiAgICBmcmFtZShudW0pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaGlzdG9yeS5nZXQobnVtKSB8fCBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmQgYSBuZWFyYnkgTXlvIGFuZCBwYWlyIHdpdGggaXQsIG9yIHRpbWUgb3V0IGFmdGVyIHRpbWVvdXRNaWxsaXNlY29uZHMgbWlsbGlzZWNvbmRzIGlmIHByb3ZpZGVkLlxuICAgICAqXG4gICAgICogPHA+SWYgdGltZW91dF9tcyBpcyB6ZXJvLCB0aGlzIG1ldGhvZCBibG9ja3MgdW50aWwgYSBNeW8gaXMgZm91bmQuIFRoaXMgbWV0aG9kIG11c3RcbiAgICAgKiBub3QgYmUgcnVuIGNvbmN1cnJlbnRseSB3aXRoIHJ1bigpIG9yIHJ1bk9uY2UoKS48L3A+XG4gICAgICovXG4gICAgd2FpdEZvck15byh0aW1lb3V0TWlsbGlzZWNvbmRzKSB7XG4gICAgICAgIGlmICghdGltZW91dE1pbGxpc2Vjb25kcyB8fCB0aW1lb3V0TWlsbGlzZWNvbmRzICE9PSBwYXJzZUludCh0aW1lb3V0TWlsbGlzZWNvbmRzLCAxMCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigndGltZW91dE1pbGxpc2Vjb25kcyBuZWVkcyB0byBiZSBvZiB0eXBlIGludGVnZXInKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNvbm5lY3Rpb24uc2VuZCh7XG4gICAgICAgICAgICAnd2FpdEZvck15byc6IHRpbWVvdXRNaWxsaXNlY29uZHNcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUnVuIHRoZSBldmVudCBsb29wIGZvciB0aGUgc3BlY2lmaWVkIGR1cmF0aW9uIChpbiBtaWxsaXNlY29uZHMpLlxuICAgICAqL1xuICAgIHJ1bihkdXJhdGlvbk1pbGxpc2Vjb25kcykge1xuICAgICAgICBpZiAoIWR1cmF0aW9uTWlsbGlzZWNvbmRzIHx8IGR1cmF0aW9uTWlsbGlzZWNvbmRzICE9PSBwYXJzZUludChkdXJhdGlvbk1pbGxpc2Vjb25kcywgMTApKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2R1cmF0aW9uTWlsbGlzZWNvbmRzIG5lZWRzIHRvIGJlIG9mIHR5cGUgaW50ZWdlcicpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY29ubmVjdGlvbi5zZW5kKHtcbiAgICAgICAgICAgICdydW4nOiBkdXJhdGlvbk1pbGxpc2Vjb25kc1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSdW4gdGhlIGV2ZW50IGxvb3AgdW50aWwgYSBzaW5nbGUgZXZlbnQgb2NjdXJzLCBvciB0aGUgc3BlY2lmaWVkXG4gICAgICogZHVyYXRpb24gKGluIG1pbGxpc2Vjb25kcykgaGFzIGVsYXBzZWQuXG4gICAgICovXG4gICAgcnVuT25jZShkdXJhdGlvbk1pbGxpc2Vjb25kcykge1xuICAgICAgICBpZiAoIWR1cmF0aW9uTWlsbGlzZWNvbmRzIHx8IGR1cmF0aW9uTWlsbGlzZWNvbmRzICE9PSBwYXJzZUludChkdXJhdGlvbk1pbGxpc2Vjb25kcywgMTApKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2R1cmF0aW9uTWlsbGlzZWNvbmRzIG5lZWRzIHRvIGJlIG9mIHR5cGUgaW50ZWdlcicpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY29ubmVjdGlvbi5zZW5kKHtcbiAgICAgICAgICAgICdydW5PbmNlJzogZHVyYXRpb25NaWxsaXNlY29uZHNcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIHN0cmluZyBjb250YWluaW5nIHRoaXMgaHViIGluIGEgaHVtYW4gcmVhZGFibGUgZm9ybWF0LlxuICAgICAqIEByZXR1cm5cbiAgICAgKlxuICAgICAqL1xuICAgIHRvU3RyaW5nKCkge1xuICAgICAgICByZXR1cm4gJ1tIdWIgaGlzdG9yeTonICsgdGhpcy5oaXN0b3J5ICsgJ10nO1xuICAgIH1cbn0iLCJpbXBvcnQge0Jhc2VDb25uZWN0aW9uIGFzIF9CYXNlQ29ubmVjdGlvbn0gZnJvbSAnLi9jb25uZWN0aW9uL0Jhc2VDb25uZWN0aW9uLmpzJztcbmltcG9ydCB7SHViIGFzIF9IdWJ9IGZyb20gJy4vSHViLmpzJztcbmltcG9ydCB7TXlvIGFzIF9NeW99IGZyb20gJy4vTXlvLmpzJztcbmltcG9ydCB7Q2lyY3VsYXJCdWZmZXIgYXMgX0NpcmN1bGFyQnVmZmVyfSBmcm9tICcuL0NpcmN1bGFyQnVmZmVyLmpzJztcbmltcG9ydCB7UG9zZSBhcyBfUG9zZX0gZnJvbSAnLi9Qb3NlLmpzJztcbmltcG9ydCB7UXVhdGVybmlvbiBhcyBfUXVhdGVybmlvbn0gZnJvbSAnLi9RdWF0ZXJuaW9uLmpzJztcbmltcG9ydCB7VmVjdG9yMyBhcyBfVmVjdG9yM30gZnJvbSAnLi9WZWN0b3IzLmpzJztcbmltcG9ydCB7RnJhbWUgYXMgX0ZyYW1lfSBmcm9tICcuL0ZyYW1lLmpzJztcblxuZXhwb3J0IGNsYXNzIE15b0pTIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcblxuICAgIH1cblxuICAgIHN0YXRpYyBCYXNlQ29ubmVjdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIF9CYXNlQ29ubmVjdGlvbjtcbiAgICB9XG5cbiAgICBzdGF0aWMgQ2lyY3VsYXJCdWZmZXIoKSB7XG4gICAgICAgIHJldHVybiBfQ2lyY3VsYXJCdWZmZXI7XG4gICAgfVxuXG4gICAgc3RhdGljIEh1YigpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBfSHViKCk7XG4gICAgfVxuXG4gICAgc3RhdGljIE15bygpIHtcbiAgICAgICAgcmV0dXJuIF9NeW87XG4gICAgfVxuXG4gICAgc3RhdGljIEZyYW1lKCkge1xuICAgICAgICByZXR1cm4gX0ZyYW1lO1xuICAgIH1cblxuICAgIHN0YXRpYyBQb3NlKCkge1xuICAgICAgICByZXR1cm4gX1Bvc2U7XG4gICAgfVxuXG4gICAgc3RhdGljIFF1YXRlcm5pb24oKSB7XG4gICAgICAgIHJldHVybiBfUXVhdGVybmlvbjtcbiAgICB9XG5cbiAgICBzdGF0aWMgVmVjdG9yMygpIHtcbiAgICAgICAgcmV0dXJuIF9WZWN0b3IzO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTXlvSlM7XG5cbi8qKlxuICogQnJvd3NlcmlmeSBleHBvcnRzIGdsb2JhbCB0byB0aGUgd2luZG93IG9iamVjdC5cbiAqIEBuYW1lc3BhY2UgTXlvXG4gKi9cbmdsb2JhbC5NeW8gPSBNeW9KUztcbiIsImV4cG9ydCBjbGFzcyBNeW8ge1xuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQpIHtcblxuICAgICAgICBpZiAoIWNvbnRleHQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTWlzc2luZyBjb250ZXh0Jyk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICpcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0IHRoZSBSU1NJIG9mIHRoZSBNeW8uXG4gICAgICpcbiAgICAgKiA8cD5BbiBvblJzc2kgZXZlbnQgd2lsbCBsaWtlbHkgYmUgZ2VuZXJhdGVkIHdpdGggdGhlIHZhbHVlIG9mIHRoZSBSU1NJLjwvcD5cbiAgICAgKlxuICAgICAqL1xuICAgIHJlcXVlc3RSc3NpKCkge1xuICAgICAgICB0aGlzLmNvbnRleHQuc2VuZCh7XG4gICAgICAgICAgICAncmVxdWVzdFJzc2knOiB0cnVlXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEVuZ2FnZSB0aGUgTXlvJ3MgYnVpbHQgaW4gdmlicmF0aW9uIG1vdG9yLlxuICAgICAqIEBwYXJhbSBsZW5ndGhcbiAgICAgKlxuICAgICAqL1xuICAgIHZpYnJhdGUobGVuZ3RoKSB7XG4gICAgICAgIHN3aXRjaCAobGVuZ3RoKSB7XG4gICAgICAgICAgICBjYXNlIE15by5WSUJSQVRJT05fU0hPUlQ6XG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZXh0LnNlbmQoe1xuICAgICAgICAgICAgICAgICAgICAnY29tbWFuZCc6ICd2aWJyYXRlJyxcbiAgICAgICAgICAgICAgICAgICAgJ2FyZ3MnOiBbTXlvLlZJQlJBVElPTl9TSE9SVF1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgTXlvLlZJQlJBVElPTl9NRURJVU06XG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZXh0LnNlbmQoe1xuICAgICAgICAgICAgICAgICAgICAnY29tbWFuZCc6ICd2aWJyYXRlJyxcbiAgICAgICAgICAgICAgICAgICAgJ2FyZ3MnOiBbTXlvLlZJQlJBVElPTl9NRURJVU1dXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIE15by5WSUJSQVRJT05fTE9ORzpcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHQuc2VuZCh7XG4gICAgICAgICAgICAgICAgICAgICdjb21tYW5kJzogJ3ZpYnJhdGUnLFxuICAgICAgICAgICAgICAgICAgICAnYXJncyc6IFtNeW8uVklCUkFUSU9OX0xPTkddXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVmFsaWQgdmFsdWVzIGFyZTogTXlvLlZJQlJBVElPTl9TSE9SVCwgTXlvLlZJQlJBVElPTl9NRURJVU0sIE15by5WSUJSQVRJT05fTE9ORycpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVW5sb2NrIHRoZSBnaXZlbiBNeW8uXG4gICAgICogQ2FuIGJlIGNhbGxlZCB3aGVuIGEgTXlvIGlzIHBhaXJlZC5cbiAgICAgKlxuICAgICAqL1xuICAgIHVubG9jayhvcHRpb24pIHtcbiAgICAgICAgc3dpdGNoIChvcHRpb24pIHtcbiAgICAgICAgICAgIGNhc2UgTXlvLlVOTE9DS19USU1FRDpcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHQuc2VuZCh7XG4gICAgICAgICAgICAgICAgICAgICdjb21tYW5kJzogJ3VubG9jaycsXG4gICAgICAgICAgICAgICAgICAgICdhcmdzJzogW015by5VTkxPQ0tfVElNRURdXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIE15by5VTkxPQ0tfSE9MRDpcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHQuc2VuZCh7XG4gICAgICAgICAgICAgICAgICAgICdjb21tYW5kJzogJ3VubG9jaycsXG4gICAgICAgICAgICAgICAgICAgICdhcmdzJzogW015by5VTkxPQ0tfSE9MRF1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdWYWxpZCB2YWx1ZXMgYXJlOiBNeW8uVU5MT0NLX1RJTUVELCBNeW8uVU5MT0NLX0hPTEQnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIExvY2sgdGhlIGdpdmVuIE15byBpbW1lZGlhdGVseS5cbiAgICAgKiBDYW4gYmUgY2FsbGVkIHdoZW4gYSBNeW8gaXMgcGFpcmVkLlxuICAgICAqXG4gICAgICovXG4gICAgbG9jaygpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0LnNlbmQoe1xuICAgICAgICAgICAgJ2NvbW1hbmQnOiAnbG9jaydcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTm90aWZ5IHRoZSBnaXZlbiBNeW8gdGhhdCBhIHVzZXIgYWN0aW9uIHdhcyByZWNvZ25pemVkLlxuICAgICAqIENhbiBiZSBjYWxsZWQgd2hlbiBhIE15byBpcyBwYWlyZWQuIFdpbGwgY2F1c2UgTXlvIHRvIHZpYnJhdGUuXG4gICAgICpcbiAgICAgKi9cbiAgICBub3RpZnlVc2VyQWN0aW9uKGFjdGlvbikge1xuICAgICAgICBzd2l0Y2ggKGFjdGlvbikge1xuICAgICAgICAgICAgY2FzZSBNeW8uVVNFUl9BQ1RJT05fU0lOR0xFOlxuICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dC5zZW5kKHtcbiAgICAgICAgICAgICAgICAgICAgJ2NvbW1hbmQnOiAnbm90aWZ5VXNlckFjdGlvbicsXG4gICAgICAgICAgICAgICAgICAgICdhcmdzJzogW015by5VU0VSX0FDVElPTl9TSU5HTEVdXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVmFsaWQgdmFsdWVzIGFyZTogTXlvLlVTRVJfQUNUSU9OX1NJTkdMRScpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vKipcbiAqIEEgdmlicmF0aW9uIGxhc3RpbmcgYSBzbWFsbCBhbW91bnQgb2YgdGltZSAoVmlicmF0aW9uTGVuZ3RoU2hvcnQpXG4gKi9cbk15by5WSUJSQVRJT05fU0hPUlQgPSAwO1xuXG4vKipcbiAqIEEgdmlicmF0aW9uIGxhc3RpbmcgYSBtb2RlcmF0ZSBhbW91bnQgb2YgdGltZSAoVmlicmF0aW9uTGVuZ3RoTWVkaXVtKVxuICovXG5NeW8uVklCUkFUSU9OX01FRElVTSA9IDE7XG5cbi8qKlxuICogQSB2aWJyYXRpb24gbGFzdGluZyBhIGxvbmcgYW1vdW50IG9mIHRpbWUgKFZpYnJhdGlvbkxlbmd0aExvbmcpXG4gKi9cbk15by5WSUJSQVRJT05fTE9ORyA9IDI7XG5cbi8qKlxuICogVW5sb2NrIGZvciBhIGZpeGVkIHBlcmlvZCBvZiB0aW1lLlxuICovXG5NeW8uVU5MT0NLX1RJTUVEID0gMDtcblxuLyoqXG4gKiBVbmxvY2sgdW50aWwgZXhwbGljaXRseSB0b2xkIHRvIHJlLWxvY2suXG4gKi9cbk15by5VTkxPQ0tfSE9MRCA9IDE7XG5cbi8qKlxuICogVXNlciBkaWQgYSBzaW5nbGUsIGRpc2NyZXRlIGFjdGlvbiwgc3VjaCBhcyBwYXVzaW5nIGEgdmlkZW8uXG4gKi9cbk15by5VU0VSX0FDVElPTl9TSU5HTEUgPSAwOyIsImV4cG9ydCBjbGFzcyBQb3NlIHtcbiAgICBjb25zdHJ1Y3RvcihkYXRhKSB7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBkYXRhICE9PSAnb2JqZWN0JyB8fCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZGF0YSkgPT09ICdbb2JqZWN0IEFycmF5XScpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ29uc3RydWN0b3IgcGFyYW1ldGVyIG5lZWRzIHRvIGJlIGFuIG9iamVjdCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBwb3NlIGJlaW5nIHJlY29nbml6ZWQuXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnR5cGUgPSBkYXRhLnR5cGU7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEluZGljYXRlcyB3aGV0aGVyIHRoaXMgaXMgYSB2YWxpZCBQb3NlIG9iamVjdC5cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudmFsaWQgPSAhZGF0YS5oYXNPd25Qcm9wZXJ0eSgnaW52YWxpZCcpO1xuXG4gICAgICAgIGlmICh0aGlzLnZhbGlkKSB7XG4gICAgICAgICAgICBpZiAoIWRhdGEuaGFzT3duUHJvcGVydHkoJ3R5cGUnKSB8fCBkYXRhLnR5cGUgIT09IHBhcnNlSW50KGRhdGEudHlwZSwgMTApKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQb3NlIHR5cGUgbmVlZHMgdG8gYmUgb2YgdHlwZSBpbnRlZ2VyJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpc0VxdWFsVG8ob3RoZXIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHlwZSA9PT0gb3RoZXIudHlwZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBbiBpbnZhbGlkIFBvc2Ugb2JqZWN0LlxuICAgICAqXG4gICAgICogWW91IGNhbiB1c2UgdGhpcyBQb3NlIGluc3RhbmNlIGluIGNvbXBhcmlzb25zIHRlc3RpbmdcbiAgICAgKiB3aGV0aGVyIGEgZ2l2ZW4gUG9zZSBpbnN0YW5jZSBpcyB2YWxpZCBvciBpbnZhbGlkLlxuICAgICAqXG4gICAgICovXG4gICAgc3RhdGljIGludmFsaWQoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUG9zZSh7XG4gICAgICAgICAgICBpbnZhbGlkOiB0cnVlXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybiBhIGh1bWFuLXJlYWRhYmxlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgcG9zZS5cbiAgICAgKiBAcmV0dXJuXG4gICAgICpcbiAgICAgKi9cbiAgICB0b1N0cmluZygpIHtcbiAgICAgICAgaWYgKCF0aGlzLnZhbGlkKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1tQb3NlIGludmFsaWRdJztcbiAgICAgICAgfVxuICAgICAgICBzd2l0Y2ggKHRoaXMudHlwZSkge1xuICAgICAgICAgICAgY2FzZSBQb3NlLlBPU0VfUkVTVDpcbiAgICAgICAgICAgICAgICByZXR1cm4gJ1tQb3NlIHR5cGU6JyArIHRoaXMudHlwZS50b1N0cmluZygpICsgJyBQT1NFX1JFU1RdJztcbiAgICAgICAgICAgIGNhc2UgUG9zZS5QT1NFX0ZJU1Q6XG4gICAgICAgICAgICAgICAgcmV0dXJuICdbUG9zZSB0eXBlOicgKyB0aGlzLnR5cGUudG9TdHJpbmcoKSArICcgUE9TRV9GSVNUXSc7XG4gICAgICAgICAgICBjYXNlIFBvc2UuUE9TRV9XQVZFX0lOOlxuICAgICAgICAgICAgICAgIHJldHVybiAnW1Bvc2UgdHlwZTonICsgdGhpcy50eXBlLnRvU3RyaW5nKCkgKyAnIFBPU0VfV0FWRV9JTl0nO1xuICAgICAgICAgICAgY2FzZSBQb3NlLlBPU0VfV0FWRV9PVVQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuICdbUG9zZSB0eXBlOicgKyB0aGlzLnR5cGUudG9TdHJpbmcoKSArICcgUE9TRV9XQVZFX09VVF0nO1xuICAgICAgICAgICAgY2FzZSBQb3NlLlBPU0VfRklOR0VSU19TUFJFQUQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuICdbUG9zZSB0eXBlOicgKyB0aGlzLnR5cGUudG9TdHJpbmcoKSArICcgUE9TRV9GSU5HRVJTX1NQUkVBRF0nO1xuICAgICAgICAgICAgY2FzZSBQb3NlLlBPU0VfRE9VQkxFX1RBUDpcbiAgICAgICAgICAgICAgICByZXR1cm4gJ1tQb3NlIHR5cGU6JyArIHRoaXMudHlwZS50b1N0cmluZygpICsgJyBQT1NFX0RPVUJMRV9UQVBdJztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuICdbUG9zZSB0eXBlOicgKyB0aGlzLnR5cGUudG9TdHJpbmcoKSArICddJztcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyoqXG4gKiBSZXN0IHBvc2UuXG4gKi9cblBvc2UuUE9TRV9SRVNUID0gMDtcblxuLyoqXG4gKiBVc2VyIGlzIG1ha2luZyBhIGZpc3QuXG4gKi9cblBvc2UuUE9TRV9GSVNUID0gMTtcblxuLyoqXG4gKiBVc2VyIGhhcyBhbiBvcGVuIHBhbG0gcm90YXRlZCB0b3dhcmRzIHRoZSBwb3N0ZXJpb3Igb2YgdGhlaXIgd3Jpc3QuXG4gKi9cblBvc2UuUE9TRV9XQVZFX0lOID0gMjtcblxuLyoqXG4gKiBVc2VyIGhhcyBhbiBvcGVuIHBhbG0gcm90YXRlZCB0b3dhcmRzIHRoZSBhbnRlcmlvciBvZiB0aGVpciB3cmlzdC5cbiAqL1xuUG9zZS5QT1NFX1dBVkVfT1VUID0gMztcblxuLyoqXG4gKiBVc2VyIGhhcyBhbiBvcGVuIHBhbG0gd2l0aCB0aGVpciBmaW5nZXJzIHNwcmVhZCBhd2F5IGZyb20gZWFjaCBvdGhlci5cbiAqL1xuUG9zZS5QT1NFX0ZJTkdFUlNfU1BSRUFEID0gNDtcblxuLyoqXG4gKiBVc2VyIHRhcHBlZCB0aGVpciB0aHVtYiBhbmQgbWlkZGxlIGZpbmdlciB0b2dldGhlciB0d2ljZSBpbiBzdWNjZXNzaW9uLlxuICovXG5Qb3NlLlBPU0VfRE9VQkxFX1RBUCA9IDU7IiwiZXhwb3J0IGNsYXNzIFF1YXRlcm5pb24ge1xuICAgIGNvbnN0cnVjdG9yKGRhdGEpIHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogSW5kaWNhdGVzIHdoZXRoZXIgdGhpcyBpcyBhIHZhbGlkIFF1YXRlcm5pb24gb2JqZWN0LlxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy52YWxpZCA9ICFkYXRhLmhhc093blByb3BlcnR5KCdpbnZhbGlkJyk7XG5cbiAgICAgICAgaWYgKHRoaXMudmFsaWQpIHtcbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZGF0YSkgIT09ICdbb2JqZWN0IEFycmF5XScpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvbXBvbmVudHMgbmVlZHMgdG8gYmUgYW4gYXJyYXknKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpc05hTihkYXRhWzBdKSB8fCBpc05hTihkYXRhWzFdKSB8fCBpc05hTihkYXRhWzJdKSB8fCBpc05hTihkYXRhWzNdKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ29tcG9uZW50IHZhbHVlcyBuZWVkcyB0byBiZSBpbnRlZ2VycyBvciBudW1iZXJzJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnggPSBkYXRhWzBdO1xuICAgICAgICAgICAgdGhpcy55ID0gZGF0YVsxXTtcbiAgICAgICAgICAgIHRoaXMueiA9IGRhdGFbMl07XG4gICAgICAgICAgICB0aGlzLncgPSBkYXRhWzNdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy54ID0gTmFOO1xuICAgICAgICAgICAgdGhpcy55ID0gTmFOO1xuICAgICAgICAgICAgdGhpcy56ID0gTmFOO1xuICAgICAgICAgICAgdGhpcy53ID0gTmFOO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQSBub3JtYWxpemVkIGNvcHkgb2YgdGhpcyBxdWF0ZXJuaW9uLlxuICAgICAqIEEgbm9ybWFsaXplZCBxdWF0ZXJuaW9uIGhhcyB0aGUgc2FtZSBkaXJlY3Rpb24gYXMgdGhlIG9yaWdpbmFsXG4gICAgICogcXVhdGVybmlvbiwgYnV0IHdpdGggYSBsZW5ndGggb2Ygb25lLlxuICAgICAqIEByZXR1cm4ge1F1YXRlcm5pb259IEEgUXVhdGVybmlvbiBvYmplY3Qgd2l0aCBhIGxlbmd0aCBvZiBvbmUsIHBvaW50aW5nIGluIHRoZSBzYW1lIGRpcmVjdGlvbiBhcyB0aGlzIFF1YXRlcm5pb24gb2JqZWN0LlxuICAgICAqXG4gICAgICovXG4gICAgbm9ybWFsaXplZCgpIHtcbiAgICAgICAgbGV0IG1hZ25pdHVkZSA9IE1hdGguc3FydCh0aGlzLnggKiB0aGlzLnggKyB0aGlzLnkgKiB0aGlzLnkgKyB0aGlzLnogKiB0aGlzLnogKyB0aGlzLncgKiB0aGlzLncpO1xuXG4gICAgICAgIHJldHVybiBuZXcgUXVhdGVybmlvbihbXG4gICAgICAgICAgICB0aGlzLnggLyBtYWduaXR1ZGUsXG4gICAgICAgICAgICB0aGlzLnkgLyBtYWduaXR1ZGUsXG4gICAgICAgICAgICB0aGlzLnogLyBtYWduaXR1ZGUsXG4gICAgICAgICAgICB0aGlzLncgLyBtYWduaXR1ZGVcbiAgICAgICAgXSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQSBjb3B5IG9mIHRoaXMgcXVhdGVybmlvbiBwb2ludGluZyBpbiB0aGUgb3Bwb3NpdGUgZGlyZWN0aW9uLlxuICAgICAqXG4gICAgICovXG4gICAgY29uanVnYXRlKCkge1xuICAgICAgICByZXR1cm4gbmV3IFF1YXRlcm5pb24oWy10aGlzLngsIC10aGlzLnksIC10aGlzLnosXG4gICAgICAgICAgICB0aGlzLndcbiAgICAgICAgXSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydCBRdWF0ZXJuaW9uIHRvIEV1bGVyIGFuZ2xlcy5cbiAgICAgKiBAc2VlIGh0dHA6Ly93d3cuZXVjbGlkZWFuc3BhY2UuY29tL21hdGhzL2dlb21ldHJ5L3JvdGF0aW9ucy9jb252ZXJzaW9ucy9xdWF0ZXJuaW9uVG9FdWxlci9cbiAgICAgKlxuICAgICAqL1xuICAgIHRvRXVsZXIoKSB7XG4gICAgICAgICd1c2Ugc3RyaWN0JztcbiAgICAgICAgdmFyIHRlc3QsIGhlYWRpbmcsIGF0dGl0dWRlLCBiYW5rLCBzcXgsIHNxeSwgc3F6LCBzcXcsIHVuaXQ7XG5cbiAgICAgICAgc3F3ID0gdGhpcy53ICogdGhpcy53O1xuICAgICAgICBzcXggPSB0aGlzLnggKiB0aGlzLng7XG4gICAgICAgIHNxeSA9IHRoaXMueSAqIHRoaXMueTtcbiAgICAgICAgc3F6ID0gdGhpcy56ICogdGhpcy56O1xuICAgICAgICB1bml0ID0gc3F4ICsgc3F5ICsgc3F6ICsgc3F3OyAvLyBJZiBub3JtYWxpc2VkIGlzIG9uZSwgb3RoZXJ3aXNlIGlzIGNvcnJlY3Rpb24gZmFjdG9yXG4gICAgICAgIHRlc3QgPSB0aGlzLnggKiB0aGlzLnkgKyB0aGlzLnogKiB0aGlzLnc7XG4gICAgICAgIGlmICh0ZXN0ID4gMC40OTkgKiB1bml0IC8qIFNpbmd1bGFyaXR5IGF0IG5vcnRoIHBvbGUgKi8gKSB7XG4gICAgICAgICAgICBoZWFkaW5nID0gMiAqIE1hdGguYXRhbjIodGhpcy54LCB0aGlzLncpO1xuICAgICAgICAgICAgYXR0aXR1ZGUgPSBNYXRoLlBJIC8gMjtcbiAgICAgICAgICAgIGJhbmsgPSAwO1xuICAgICAgICB9IGVsc2UgaWYgKHRlc3QgPCAtMC40OTkgKiB1bml0IC8qIFNpbmd1bGFyaXR5IGF0IHNvdXRoIHBvbGUgKi8gKSB7XG4gICAgICAgICAgICBoZWFkaW5nID0gLTIgKiBNYXRoLmF0YW4yKHRoaXMueCwgdGhpcy53KTtcbiAgICAgICAgICAgIGF0dGl0dWRlID0gLU1hdGguUEkgLyAyO1xuICAgICAgICAgICAgYmFuayA9IDA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBoZWFkaW5nID0gTWF0aC5hdGFuMigyICogdGhpcy55ICogdGhpcy53IC0gMiAqIHRoaXMueCAqIHRoaXMueiwgc3F4IC0gc3F5IC0gc3F6ICsgc3F3KTtcbiAgICAgICAgICAgIGF0dGl0dWRlID0gTWF0aC5hc2luKDIgKiB0ZXN0IC8gdW5pdCk7XG4gICAgICAgICAgICBiYW5rID0gTWF0aC5hdGFuMigyICogdGhpcy54ICogdGhpcy53IC0gMiAqIHRoaXMueSAqIHRoaXMueiwgLXNxeCArIHNxeSAtIHNxeiArIHNxdyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaGVhZGluZzogaGVhZGluZywgLy8gSGVhZGluZyA9IHJvdGF0aW9uIGFib3V0IHkgYXhpc1xuICAgICAgICAgICAgYXR0aXR1ZGU6IGF0dGl0dWRlLCAvLyBBdHRpdHVkZSA9IHJvdGF0aW9uIGFib3V0IHogYXhpc1xuICAgICAgICAgICAgYmFuazogYmFuayAvLyBCYW5rID0gcm90YXRpb24gYWJvdXQgeCBheGlzXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydCBRdWF0ZXJuaW9uIHRvIEV1bGVyIGFuZ2xlcyAocm9sbCkuXG4gICAgICpcbiAgICAgKi9cbiAgICByb2xsKCkge1xuICAgICAgICByZXR1cm4gTWF0aC5hdGFuMigyICogdGhpcy55ICogdGhpcy53IC0gMiAqIHRoaXMueCAqIHRoaXMueiwgMSAtIDIgKiB0aGlzLnkgKiB0aGlzLnkgLSAyICogdGhpcy56ICogdGhpcy56KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IFF1YXRlcm5pb24gdG8gRXVsZXIgYW5nbGVzIChwaXRjaCkuXG4gICAgICpcbiAgICAgKi9cbiAgICBwaXRjaCgpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguYXRhbjIoMiAqIHRoaXMueCAqIHRoaXMudyAtIDIgKiB0aGlzLnkgKiB0aGlzLnosIDEgLSAyICogdGhpcy54ICogdGhpcy54IC0gMiAqIHRoaXMueiAqIHRoaXMueik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydCBRdWF0ZXJuaW9uIHRvIEV1bGVyIGFuZ2xlcyAoeWF3KS5cbiAgICAgKlxuICAgICAqL1xuICAgIHlhdygpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguYXNpbigyICogdGhpcy54ICogdGhpcy55ICsgMiAqIHRoaXMueiAqIHRoaXMudyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQW4gaW52YWxpZCBRdWF0ZXJuaW9uIG9iamVjdC5cbiAgICAgKlxuICAgICAqIFlvdSBjYW4gdXNlIHRoaXMgUXVhdGVybmlvbiBpbnN0YW5jZSBpbiBjb21wYXJpc29ucyB0ZXN0aW5nXG4gICAgICogd2hldGhlciBhIGdpdmVuIFF1YXRlcm5pb24gaW5zdGFuY2UgaXMgdmFsaWQgb3IgaW52YWxpZC5cbiAgICAgKlxuICAgICAqL1xuICAgIHN0YXRpYyBpbnZhbGlkKCkge1xuICAgICAgICByZXR1cm4gbmV3IFF1YXRlcm5pb24oe1xuICAgICAgICAgICAgaW52YWxpZDogdHJ1ZVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgc3RyaW5nIGNvbnRhaW5pbmcgdGhpcyBxdWF0ZXJuaW9uIGluIGEgaHVtYW4gcmVhZGFibGUgZm9ybWF0OiAoeCwgeSwgeiwgdykuXG4gICAgICogQHJldHVyblxuICAgICAqXG4gICAgICovXG4gICAgdG9TdHJpbmcoKSB7XG4gICAgICAgIGlmICghdGhpcy52YWxpZCkge1xuICAgICAgICAgICAgcmV0dXJuICdbUXVhdGVybmlvbiBpbnZhbGlkXSc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICdbUXVhdGVybmlvbiB4OicgKyB0aGlzLnggKyAnIHk6JyArIHRoaXMueSArICcgejonICsgdGhpcy56ICsgJyB3OicgKyB0aGlzLncgKyAnXSc7XG4gICAgfVxufSIsImV4cG9ydCBjbGFzcyBWZWN0b3IzIHtcbiAgICBjb25zdHJ1Y3RvcihkYXRhKSB7XG5cbiAgICAgICAgaWYgKCFkYXRhKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01pc3NpbmcgY29uc3RydWN0b3IgYXJndW1lbnRzJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBkYXRhICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb25zdHJ1Y3RvciBwYXJhbWV0ZXIgbmVlZHMgdG8gYmUgYW4gb2JqZWN0Jyk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogSW5kaWNhdGVzIHdoZXRoZXIgdGhpcyBpcyBhIHZhbGlkIFZlY3RvcjMgb2JqZWN0LlxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy52YWxpZCA9ICFkYXRhLmhhc093blByb3BlcnR5KCdpbnZhbGlkJyk7XG5cbiAgICAgICAgaWYgKHRoaXMudmFsaWQpIHtcbiAgICAgICAgICAgIGlmICghZGF0YSB8fCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZGF0YSkgIT09ICdbb2JqZWN0IEFycmF5XScpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvbXBvbmVudHMgbmVlZHMgdG8gYmUgYW4gYXJyYXknKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpc05hTihkYXRhWzBdKSB8fCBpc05hTihkYXRhWzFdKSB8fCBpc05hTihkYXRhWzJdKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ29tcG9uZW50IHZhbHVlcyBuZWVkcyB0byBiZSBpbnRlZ2VycyBvciBudW1iZXJzJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnggPSBkYXRhWzBdO1xuICAgICAgICAgICAgdGhpcy55ID0gZGF0YVsxXTtcbiAgICAgICAgICAgIHRoaXMueiA9IGRhdGFbMl07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnggPSBOYU47XG4gICAgICAgICAgICB0aGlzLnkgPSBOYU47XG4gICAgICAgICAgICB0aGlzLnogPSBOYU47XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBIGNvcHkgb2YgdGhpcyB2ZWN0b3IgcG9pbnRpbmcgaW4gdGhlIG9wcG9zaXRlIGRpcmVjdGlvbi5cbiAgICAgKiBAcmV0dXJuIHtWZWN0b3IzfSBBIFZlY3RvcjMgb2JqZWN0IHdpdGggYWxsIGNvbXBvbmVudHMgbmVnYXRlZC5cbiAgICAgKlxuICAgICAqL1xuICAgIG9wcG9zaXRlKCkge1xuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcjMoWy10aGlzLngsIC10aGlzLnksIC10aGlzLnpdKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgdmVjdG9ycyBjb21wb25lbnQtd2lzZS5cbiAgICAgKiBAcGFyYW0gb3RoZXJcbiAgICAgKiBAcmV0dXJuIHtWZWN0b3IzfVxuICAgICAqXG4gICAgICovXG4gICAgcGx1cyhvdGhlcikge1xuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcjMoW1xuICAgICAgICAgICAgdGhpcy54ICsgb3RoZXIueCxcbiAgICAgICAgICAgIHRoaXMueSArIG90aGVyLnksXG4gICAgICAgICAgICB0aGlzLnogKyBvdGhlci56XG4gICAgICAgIF0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZCB2ZWN0b3JzIGNvbXBvbmVudC13aXNlIGFuZCBhc3NpZ24gdGhlIHZhbHVlLlxuICAgICAqIEBwYXJhbSBvdGhlclxuICAgICAqIEByZXR1cm4ge1ZlY3RvcjN9IFRoaXMgVmVjdG9yMy5cbiAgICAgKlxuICAgICAqL1xuICAgIHBsdXNBc3NpZ24ob3RoZXIpIHtcbiAgICAgICAgdGhpcy54ICs9IG90aGVyLng7XG4gICAgICAgIHRoaXMueSArPSBvdGhlci55O1xuICAgICAgICB0aGlzLnogKz0gb3RoZXIuejtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQSBjb3B5IG9mIHRoaXMgdmVjdG9yIHBvaW50aW5nIGluIHRoZSBvcHBvc2l0ZSBkaXJlY3Rpb24gKGNvbmp1Z2F0ZSkuXG4gICAgICogQHBhcmFtIG90aGVyXG4gICAgICogQHJldHVybiB7VmVjdG9yM31cbiAgICAgKlxuICAgICAqL1xuICAgIG1pbnVzKG90aGVyKSB7XG4gICAgICAgIHJldHVybiBuZXcgVmVjdG9yMyhbXG4gICAgICAgICAgICB0aGlzLnggLSBvdGhlci54LFxuICAgICAgICAgICAgdGhpcy55IC0gb3RoZXIueSxcbiAgICAgICAgICAgIHRoaXMueiAtIG90aGVyLnpcbiAgICAgICAgXSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQSBjb3B5IG9mIHRoaXMgdmVjdG9yIHBvaW50aW5nIGluIHRoZSBvcHBvc2l0ZSBkaXJlY3Rpb24gYW5kIGFzc2lnbiB0aGUgdmFsdWUuXG4gICAgICogQHBhcmFtIG90aGVyXG4gICAgICogQHJldHVybiB7VmVjdG9yM30gVGhpcyBWZWN0b3IzLlxuICAgICAqXG4gICAgICovXG4gICAgbWludXNBc3NpZ24ob3RoZXIpIHtcbiAgICAgICAgdGhpcy54IC09IG90aGVyLng7XG4gICAgICAgIHRoaXMueSAtPSBvdGhlci55O1xuICAgICAgICB0aGlzLnogLT0gb3RoZXIuejtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTXVsdGlwbHkgdmVjdG9yIGJ5IGEgc2NhbGFyLlxuICAgICAqIEBwYXJhbSBzY2FsYXJcbiAgICAgKiBAcmV0dXJuIHtWZWN0b3IzfVxuICAgICAqXG4gICAgICovXG4gICAgbXVsdGlwbHkoc2NhbGFyKSB7XG4gICAgICAgIHJldHVybiBuZXcgVmVjdG9yMyhbXG4gICAgICAgICAgICB0aGlzLnggKiBzY2FsYXIsXG4gICAgICAgICAgICB0aGlzLnkgKiBzY2FsYXIsXG4gICAgICAgICAgICB0aGlzLnogKiBzY2FsYXJcbiAgICAgICAgXSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTXVsdGlwbHkgdmVjdG9yIGJ5IGEgc2NhbGFyIGFuZCBhc3NpZ24gdGhlIHF1b3RpZW50LlxuICAgICAqIEBwYXJhbSBzY2FsYXJcbiAgICAgKiBAcmV0dXJuIHtWZWN0b3IzfSBUaGlzIFZlY3RvcjMuXG4gICAgICpcbiAgICAgKi9cbiAgICBtdWx0aXBseUFzc2lnbihzY2FsYXIpIHtcbiAgICAgICAgdGhpcy54ICo9IHNjYWxhcjtcbiAgICAgICAgdGhpcy55ICo9IHNjYWxhcjtcbiAgICAgICAgdGhpcy56ICo9IHNjYWxhcjtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGl2aWRlIHZlY3RvciBieSBhIHNjYWxhci5cbiAgICAgKiBAcGFyYW0gc2NhbGFyXG4gICAgICogQHJldHVybiB7VmVjdG9yM31cbiAgICAgKlxuICAgICAqL1xuICAgIGRpdmlkZShzY2FsYXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3IzKFtcbiAgICAgICAgICAgIHRoaXMueCAvIHNjYWxhcixcbiAgICAgICAgICAgIHRoaXMueSAvIHNjYWxhcixcbiAgICAgICAgICAgIHRoaXMueiAvIHNjYWxhclxuICAgICAgICBdKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEaXZpZGUgdmVjdG9yIGJ5IGEgc2NhbGFyIGFuZCBhc3NpZ24gdGhlIHZhbHVlLlxuICAgICAqIEBwYXJhbSBzY2FsYXJcbiAgICAgKiBAcmV0dXJuIHtWZWN0b3IzfSBUaGlzIFZlY3RvcjMuXG4gICAgICpcbiAgICAgKi9cbiAgICBkaXZpZGVBc3NpZ24oc2NhbGFyKSB7XG4gICAgICAgIHRoaXMueCAvPSBzY2FsYXI7XG4gICAgICAgIHRoaXMueSAvPSBzY2FsYXI7XG4gICAgICAgIHRoaXMueiAvPSBzY2FsYXI7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbXBhcmUgVmVjdG9yIGVxdWFsaXR5L2luZXF1YWxpdHkgY29tcG9uZW50LXdpc2UuXG4gICAgICogQHBhcmFtIG90aGVyIFRoZSBWZWN0b3IzIHRvIGNvbXBhcmUgd2l0aC5cbiAgICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlOyBpZiBlcXVhbCwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgICAqXG4gICAgICovXG4gICAgaXNFcXVhbFRvKG90aGVyKSB7XG4gICAgICAgIHJldHVybiAhKHRoaXMueCAhPT0gb3RoZXIueCB8fCB0aGlzLnkgIT09IG90aGVyLnkgfHwgdGhpcy56ICE9PSBvdGhlci56KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgYW5nbGUgYmV0d2VlbiB0aGlzIHZlY3RvciBhbmQgdGhlIHNwZWNpZmllZCB2ZWN0b3IgaW4gcmFkaWFucy5cbiAgICAgKlxuICAgICAqIDxwPlRoZSBhbmdsZSBpcyBtZWFzdXJlZCBpbiB0aGUgcGxhbmUgZm9ybWVkIGJ5IHRoZSB0d28gdmVjdG9ycy5cbiAgICAgKiBUaGUgYW5nbGUgcmV0dXJuZWQgaXMgYWx3YXlzIHRoZSBzbWFsbGVyIG9mIHRoZSB0d28gY29uanVnYXRlIGFuZ2xlcy5cbiAgICAgKiBUaHVzIDxjb2RlPkEuYW5nbGVUbyhCKSA9PT0gQi5hbmdsZVRvKEEpPC9jb2RlPiBhbmQgaXMgYWx3YXlzIGEgcG9zaXRpdmUgdmFsdWUgbGVzc1xuICAgICAqIHRoYW4gb3IgZXF1YWwgdG8gcGkgcmFkaWFucyAoMTgwIGRlZ3JlZXMpLjwvcD5cbiAgICAgKlxuICAgICAqIDxwPklmIGVpdGhlciB2ZWN0b3IgaGFzIHplcm8gbGVuZ3RoLCB0aGVuIHRoaXMgbWV0aG9kIHJldHVybnMgemVyby48L3A+XG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3RoZXIgQSBWZWN0b3Igb2JqZWN0LlxuICAgICAqIEByZXR1cm4ge251bWJlcn0gVGhlIGFuZ2xlIGJldHdlZW4gdGhpcyB2ZWN0b3IgYW5kIHRoZSBzcGVjaWZpZWQgdmVjdG9yIGluIHJhZGlhbnMuXG4gICAgICpcbiAgICAgKi9cbiAgICBhbmdsZVRvKG90aGVyKSB7XG4gICAgICAgIHZhciBkZW5vbSA9IHRoaXMubWFnbml0dWRlU3F1YXJlZCgpICogb3RoZXIubWFnbml0dWRlU3F1YXJlZCgpLFxuICAgICAgICAgICAgcmV0dXJuVmFsdWU7XG5cbiAgICAgICAgaWYgKGRlbm9tIDw9IDApIHtcbiAgICAgICAgICAgIHJldHVyblZhbHVlID0gMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVyblZhbHVlID0gTWF0aC5hY29zKHRoaXMuZG90KG90aGVyKSAvIE1hdGguc3FydChkZW5vbSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXR1cm5WYWx1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgY3Jvc3MgcHJvZHVjdCBvZiB0aGlzIHZlY3RvciBhbmQgdGhlIHNwZWNpZmllZCB2ZWN0b3IuXG4gICAgICpcbiAgICAgKiBUaGUgY3Jvc3MgcHJvZHVjdCBpcyBhIHZlY3RvciBvcnRob2dvbmFsIHRvIGJvdGggb3JpZ2luYWwgdmVjdG9ycy5cbiAgICAgKiBJdCBoYXMgYSBtYWduaXR1ZGUgZXF1YWwgdG8gdGhlIGFyZWEgb2YgYSBwYXJhbGxlbG9ncmFtIGhhdmluZyB0aGVcbiAgICAgKiB0d28gdmVjdG9ycyBhcyBzaWRlcy4gVGhlIGRpcmVjdGlvbiBvZiB0aGUgcmV0dXJuZWQgdmVjdG9yIGlzXG4gICAgICogZGV0ZXJtaW5lZCBieSB0aGUgcmlnaHQtaGFuZCBydWxlLiBUaHVzIDxjb2RlPkEuY3Jvc3MoQikgPT09IC1CLmNyb3NzKEEpPC9jb2RlPi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvdGhlciBBIFZlY3RvciBvYmplY3QuXG4gICAgICogQHJldHVybiB7VmVjdG9yM30gVGhlIGNyb3NzIHByb2R1Y3Qgb2YgdGhpcyB2ZWN0b3IgYW5kIHRoZSBzcGVjaWZpZWQgdmVjdG9yLlxuICAgICAqXG4gICAgICovXG4gICAgY3Jvc3Mob3RoZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3IzKFtcbiAgICAgICAgICAgIHRoaXMueSAqIG90aGVyLnogLSB0aGlzLnogKiBvdGhlci55LFxuICAgICAgICAgICAgdGhpcy56ICogb3RoZXIueCAtIHRoaXMueCAqIG90aGVyLnosXG4gICAgICAgICAgICB0aGlzLnggKiBvdGhlci55IC0gdGhpcy55ICogb3RoZXIueFxuICAgICAgICBdKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZGlzdGFuY2UgYmV0d2VlbiB0aGUgcG9pbnQgcmVwcmVzZW50ZWQgYnkgdGhpcyBWZWN0b3JcbiAgICAgKiBvYmplY3QgYW5kIGEgcG9pbnQgcmVwcmVzZW50ZWQgYnkgdGhlIHNwZWNpZmllZCBWZWN0b3Igb2JqZWN0LlxuICAgICAqXG4gICAgICogQHBhcmFtIG90aGVyIEEgVmVjdG9yIG9iamVjdC5cbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IFRoZSBkaXN0YW5jZSBmcm9tIHRoaXMgcG9pbnQgdG8gdGhlIHNwZWNpZmllZCBwb2ludC5cbiAgICAgKlxuICAgICAqL1xuICAgIGRpc3RhbmNlVG8ob3RoZXIpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydCgodGhpcy54IC0gb3RoZXIueCkgKiAodGhpcy54IC0gb3RoZXIueCkgKyAodGhpcy55IC0gb3RoZXIueSkgKiAodGhpcy55IC0gb3RoZXIueSkgKyAodGhpcy56IC0gb3RoZXIueikgKiAodGhpcy56IC0gb3RoZXIueikpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBkb3QgcHJvZHVjdCBvZiB0aGlzIHZlY3RvciB3aXRoIGFub3RoZXIgdmVjdG9yLlxuICAgICAqIFRoZSBkb3QgcHJvZHVjdCBpcyB0aGUgbWFnbml0dWRlIG9mIHRoZSBwcm9qZWN0aW9uIG9mIHRoaXMgdmVjdG9yXG4gICAgICogb250byB0aGUgc3BlY2lmaWVkIHZlY3Rvci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvdGhlciBBIFZlY3RvciBvYmplY3QuXG4gICAgICogQHJldHVybiB7bnVtYmVyfSBUaGUgZG90IHByb2R1Y3Qgb2YgdGhpcyB2ZWN0b3IgYW5kIHRoZSBzcGVjaWZpZWQgdmVjdG9yLlxuICAgICAqXG4gICAgICovXG4gICAgZG90KG90aGVyKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnggKiBvdGhlci54ICsgdGhpcy55ICogb3RoZXIueSArIHRoaXMueiAqIG90aGVyLno7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0cnVlIGlmIGFsbCBvZiB0aGUgdmVjdG9yJ3MgY29tcG9uZW50cyBhcmUgZmluaXRlLlxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IElmIGFueSBjb21wb25lbnQgaXMgTmFOIG9yIGluZmluaXRlLCB0aGVuIHRoaXMgcmV0dXJucyBmYWxzZS5cbiAgICAgKlxuICAgICAqL1xuICAgIGlzVmFsaWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnggPD0gTnVtYmVyLk1BWF9WQUxVRSAmJlxuICAgICAgICAgICAgdGhpcy54ID49IC1OdW1iZXIuTUFYX1ZBTFVFICYmXG4gICAgICAgICAgICB0aGlzLnkgPD0gTnVtYmVyLk1BWF9WQUxVRSAmJlxuICAgICAgICAgICAgdGhpcy55ID49IC1OdW1iZXIuTUFYX1ZBTFVFICYmXG4gICAgICAgICAgICB0aGlzLnogPD0gTnVtYmVyLk1BWF9WQUxVRSAmJlxuICAgICAgICAgICAgdGhpcy56ID49IC1OdW1iZXIuTUFYX1ZBTFVFO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBtYWduaXR1ZGUsIG9yIGxlbmd0aCwgb2YgdGhpcyB2ZWN0b3IuXG4gICAgICogVGhlIG1hZ25pdHVkZSBpcyB0aGUgTDIgbm9ybSwgb3IgRXVjbGlkZWFuIGRpc3RhbmNlIGJldHdlZW4gdGhlXG4gICAgICogb3JpZ2luIGFuZCB0aGUgcG9pbnQgcmVwcmVzZW50ZWQgYnkgdGhlICh4LCB5LCB6KSBjb21wb25lbnRzXG4gICAgICogb2YgdGhpcyBWZWN0b3Igb2JqZWN0LlxuICAgICAqXG4gICAgICogQHJldHVybiB7bnVtYmVyfSBUaGUgbGVuZ3RoIG9mIHRoaXMgdmVjdG9yLlxuICAgICAqXG4gICAgICovXG4gICAgbWFnbml0dWRlKCkge1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMueCAqIHRoaXMueCArIHRoaXMueSAqIHRoaXMueSArIHRoaXMueiAqIHRoaXMueik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHNxdWFyZSBvZiB0aGUgbWFnbml0dWRlLCBvciBsZW5ndGgsIG9mIHRoaXMgdmVjdG9yLlxuICAgICAqIEByZXR1cm4ge251bWJlcn0gVGhlIHNxdWFyZSBvZiB0aGUgbGVuZ3RoIG9mIHRoaXMgdmVjdG9yLlxuICAgICAqXG4gICAgICovXG4gICAgbWFnbml0dWRlU3F1YXJlZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMueCAqIHRoaXMueCArIHRoaXMueSAqIHRoaXMueSArIHRoaXMueiAqIHRoaXMuejtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBIG5vcm1hbGl6ZWQgY29weSBvZiB0aGlzIHZlY3Rvci5cbiAgICAgKiBBIG5vcm1hbGl6ZWQgdmVjdG9yIGhhcyB0aGUgc2FtZSBkaXJlY3Rpb24gYXMgdGhlIG9yaWdpbmFsXG4gICAgICogdmVjdG9yLCBidXQgd2l0aCBhIGxlbmd0aCBvZiBvbmUuXG4gICAgICogQHJldHVybiB7VmVjdG9yM30gQSBWZWN0b3Igb2JqZWN0IHdpdGggYSBsZW5ndGggb2Ygb25lLCBwb2ludGluZyBpbiB0aGUgc2FtZSBkaXJlY3Rpb24gYXMgdGhpcyBWZWN0b3Igb2JqZWN0LlxuICAgICAqXG4gICAgICovXG4gICAgbm9ybWFsaXplZCgpIHtcbiAgICAgICAgdmFyIGRlbm9tID0gdGhpcy5tYWduaXR1ZGVTcXVhcmVkKCk7XG4gICAgICAgIGlmIChkZW5vbSA8PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFZlY3RvcjMoW1xuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICBdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRlbm9tID0gMSAvIE1hdGguc3FydChkZW5vbSk7XG4gICAgICAgIHJldHVybiBuZXcgVmVjdG9yMyhbXG4gICAgICAgICAgICB0aGlzLnggKiBkZW5vbSxcbiAgICAgICAgICAgIHRoaXMueSAqIGRlbm9tLFxuICAgICAgICAgICAgdGhpcy56ICogZGVub21cbiAgICAgICAgXSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHBpdGNoIGFuZ2xlIGluIHJhZGlhbnMuXG4gICAgICogUGl0Y2ggaXMgdGhlIGFuZ2xlIGJldHdlZW4gdGhlIG5lZ2F0aXZlIHotYXhpcyBhbmQgdGhlIHByb2plY3Rpb25cbiAgICAgKiBvZiB0aGUgdmVjdG9yIG9udG8gdGhlIHkteiBwbGFuZS4gSW4gb3RoZXIgd29yZHMsIHBpdGNoIHJlcHJlc2VudHNcbiAgICAgKiByb3RhdGlvbiBhcm91bmQgdGhlIHgtYXhpcy4gSWYgdGhlIHZlY3RvciBwb2ludHMgdXB3YXJkLCB0aGVcbiAgICAgKiByZXR1cm5lZCBhbmdsZSBpcyBiZXR3ZWVuIDAgYW5kIHBpIHJhZGlhbnMgKDE4MCBkZWdyZWVzKTsgaWYgaXRcbiAgICAgKiBwb2ludHMgZG93bndhcmQsIHRoZSBhbmdsZSBpcyBiZXR3ZWVuIDAgYW5kIC1waSByYWRpYW5zLlxuICAgICAqXG4gICAgICogQHJldHVybiB7bnVtYmVyfSBUaGUgYW5nbGUgb2YgdGhpcyB2ZWN0b3IgYWJvdmUgb3IgYmVsb3cgdGhlIGhvcml6b24gKHgteiBwbGFuZSkuXG4gICAgICpcbiAgICAgKi9cbiAgICBwaXRjaCgpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguYXRhbjIodGhpcy55LCAtdGhpcy56KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgeWF3IGFuZ2xlIGluIHJhZGlhbnMuXG4gICAgICogWWF3IGlzIHRoZSBhbmdsZSBiZXR3ZWVuIHRoZSBuZWdhdGl2ZSB6LWF4aXMgYW5kIHRoZSBwcm9qZWN0aW9uXG4gICAgICogb2YgdGhlIHZlY3RvciBvbnRvIHRoZSB4LXogcGxhbmUuIEluIG90aGVyIHdvcmRzLCB5YXcgcmVwcmVzZW50c1xuICAgICAqIHJvdGF0aW9uIGFyb3VuZCB0aGUgeS1heGlzLiBJZiB0aGUgdmVjdG9yIHBvaW50cyB0byB0aGUgcmlnaHQgb2ZcbiAgICAgKiB0aGUgbmVnYXRpdmUgei1heGlzLCB0aGVuIHRoZSByZXR1cm5lZCBhbmdsZSBpcyBiZXR3ZWVuIDAgYW5kIHBpXG4gICAgICogcmFkaWFucyAoMTgwIGRlZ3JlZXMpOyBpZiBpdCBwb2ludHMgdG8gdGhlIGxlZnQsIHRoZSBhbmdsZSBpc1xuICAgICAqIGJldHdlZW4gMCBhbmQgLXBpIHJhZGlhbnMuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IFRoZSBhbmdsZSBvZiB0aGlzIHZlY3RvciB0byB0aGUgcmlnaHQgb3IgbGVmdCBvZiB0aGUgbmVnYXRpdmUgei1heGlzLlxuICAgICAqXG4gICAgICovXG4gICAgeWF3KCkge1xuICAgICAgICByZXR1cm4gTWF0aC5hdGFuMih0aGlzLngsIC10aGlzLnopO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSByb2xsIGFuZ2xlIGluIHJhZGlhbnMuXG4gICAgICogUm9sbCBpcyB0aGUgYW5nbGUgYmV0d2VlbiB0aGUgeS1heGlzIGFuZCB0aGUgcHJvamVjdGlvbiBvZiB0aGUgdmVjdG9yXG4gICAgICogb250byB0aGUgeC15IHBsYW5lLiBJbiBvdGhlciB3b3Jkcywgcm9sbCByZXByZXNlbnRzIHJvdGF0aW9uIGFyb3VuZFxuICAgICAqIHRoZSB6LWF4aXMuIElmIHRoZSB2ZWN0b3IgcG9pbnRzIHRvIHRoZSBsZWZ0IG9mIHRoZSB5LWF4aXMsIHRoZW4gdGhlXG4gICAgICogcmV0dXJuZWQgYW5nbGUgaXMgYmV0d2VlbiAwIGFuZCBwaSByYWRpYW5zICgxODAgZGVncmVlcyk7IGlmIGl0XG4gICAgICogcG9pbnRzIHRvIHRoZSByaWdodCwgdGhlIGFuZ2xlIGlzIGJldHdlZW4gMCBhbmQgLXBpIHJhZGlhbnMuXG4gICAgICpcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gZ2V0IHJvbGwgYW5nbGUgb2YgdGhlIHBsYW5lIHRvIHdoaWNoIHRoaXMgdmVjdG9yXG4gICAgICogaXMgYSBub3JtYWwuIEZvciBleGFtcGxlLCBpZiB0aGlzIHZlY3RvciByZXByZXNlbnRzIHRoZSBub3JtYWwgdG9cbiAgICAgKiB0aGUgcGFsbSwgdGhlbiB0aGlzIG1ldGhvZCByZXR1cm5zIHRoZSB0aWx0IG9yIHJvbGwgb2YgdGhlIHBhbG1cbiAgICAgKiBwbGFuZSBjb21wYXJlZCB0byB0aGUgaG9yaXpvbnRhbCAoeC16KSBwbGFuZS5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge251bWJlcn0gVGhlIGFuZ2xlIG9mIHRoaXMgdmVjdG9yIHRvIHRoZSByaWdodCBvciBsZWZ0IG9mIHRoZSB5LWF4aXMuXG4gICAgICpcbiAgICAgKi9cbiAgICByb2xsKCkge1xuICAgICAgICByZXR1cm4gTWF0aC5hdGFuMih0aGlzLngsIC10aGlzLnkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSB6ZXJvIHZlY3RvcjogKDAsIDAsIDApXG4gICAgICogQHJldHVybiB7VmVjdG9yM31cbiAgICAgKlxuICAgICAqL1xuICAgIHN0YXRpYyB6ZXJvKCkge1xuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcjMoW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSB4LWF4aXMgdW5pdCB2ZWN0b3I6ICgxLCAwLCAwKVxuICAgICAqIEByZXR1cm4ge1ZlY3RvcjN9XG4gICAgICpcbiAgICAgKi9cbiAgICBzdGF0aWMgeEF4aXMoKSB7XG4gICAgICAgIHJldHVybiBuZXcgVmVjdG9yMyhbXG4gICAgICAgICAgICAxLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHktYXhpcyB1bml0IHZlY3RvcjogKDAsIDEsIDApXG4gICAgICogQHJldHVybiB7VmVjdG9yM31cbiAgICAgKlxuICAgICAqL1xuICAgIHN0YXRpYyB5QXhpcygpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3IzKFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAxLFxuICAgICAgICAgICAgMFxuICAgICAgICBdKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgei1heGlzIHVuaXQgdmVjdG9yOiAoMCwgMCwgMSlcbiAgICAgKiBAcmV0dXJuIHtWZWN0b3IzfVxuICAgICAqXG4gICAgICovXG4gICAgc3RhdGljIHpBeGlzKCkge1xuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcjMoW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAxXG4gICAgICAgIF0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSB1bml0IHZlY3RvciBwb2ludGluZyBsZWZ0IGFsb25nIHRoZSBuZWdhdGl2ZSB4LWF4aXM6ICgtMSwgMCwgMClcbiAgICAgKiBAcmV0dXJuIHtWZWN0b3IzfVxuICAgICAqXG4gICAgICovXG4gICAgc3RhdGljIGxlZnQoKSB7XG4gICAgICAgIHJldHVybiBuZXcgVmVjdG9yMyhbLTEsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgdW5pdCB2ZWN0b3IgcG9pbnRpbmcgcmlnaHQgYWxvbmcgdGhlIHBvc2l0aXZlIHgtYXhpczogKDEsIDAsIDApXG4gICAgICogQHJldHVybiB7VmVjdG9yM31cbiAgICAgKlxuICAgICAqL1xuICAgIHN0YXRpYyByaWdodCgpIHtcbiAgICAgICAgcmV0dXJuIFZlY3RvcjMueEF4aXMoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgdW5pdCB2ZWN0b3IgcG9pbnRpbmcgZG93biBhbG9uZyB0aGUgbmVnYXRpdmUgeS1heGlzOiAoMCwgLTEsIDApXG4gICAgICogQHJldHVybiB7VmVjdG9yM31cbiAgICAgKlxuICAgICAqL1xuICAgIHN0YXRpYyBkb3duKCkge1xuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcjMoW1xuICAgICAgICAgICAgMCwgLTEsXG4gICAgICAgICAgICAwXG4gICAgICAgIF0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSB1bml0IHZlY3RvciBwb2ludGluZyB1cCBhbG9uZyB0aGUgcG9zaXRpdmUgeC1heGlzOiAoMCwgMSwgMClcbiAgICAgKiBAcmV0dXJuIHtWZWN0b3IzfVxuICAgICAqXG4gICAgICovXG4gICAgc3RhdGljIHVwKCkge1xuICAgICAgICByZXR1cm4gVmVjdG9yMy55QXhpcygpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSB1bml0IHZlY3RvciBwb2ludGluZyBmb3J3YXJkIGFsb25nIHRoZSBuZWdhdGl2ZSB6LWF4aXM6ICgwLCAwLCAtMSlcbiAgICAgKiBAcmV0dXJuIHtWZWN0b3IzfVxuICAgICAqXG4gICAgICovXG4gICAgc3RhdGljIGZvcndhcmQoKSB7XG4gICAgICAgIHJldHVybiBuZXcgVmVjdG9yMyhbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCwgLTFcbiAgICAgICAgXSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHVuaXQgdmVjdG9yIHBvaW50aW5nIGJhY2t3YXJkIGFsb25nIHRoZSBwb3NpdGl2ZSB6LWF4aXM6ICgwLCAwLCAxKVxuICAgICAqIEByZXR1cm4ge1ZlY3RvcjN9XG4gICAgICpcbiAgICAgKi9cbiAgICBzdGF0aWMgYmFja3dhcmQoKSB7XG4gICAgICAgIHJldHVybiBWZWN0b3IzLnpBeGlzKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQW4gaW52YWxpZCBWZWN0b3IzIG9iamVjdC5cbiAgICAgKlxuICAgICAqIFlvdSBjYW4gdXNlIHRoaXMgVmVjdG9yMyBpbnN0YW5jZSBpbiBjb21wYXJpc29ucyB0ZXN0aW5nXG4gICAgICogd2hldGhlciBhIGdpdmVuIFZlY3RvcjMgaW5zdGFuY2UgaXMgdmFsaWQgb3IgaW52YWxpZC5cbiAgICAgKiBAcmV0dXJuIHtWZWN0b3IzfVxuICAgICAqXG4gICAgICovXG4gICAgc3RhdGljIGludmFsaWQoKSB7XG4gICAgICAgIHJldHVybiBuZXcgVmVjdG9yMyh7XG4gICAgICAgICAgICBpbnZhbGlkOiB0cnVlXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBzdHJpbmcgY29udGFpbmluZyB0aGlzIHZlY3RvciBpbiBhIGh1bWFuIHJlYWRhYmxlIGZvcm1hdDogKHgsIHksIHopLlxuICAgICAqIEByZXR1cm4ge1N0cmluZ31cbiAgICAgKlxuICAgICAqL1xuICAgIHRvU3RyaW5nKCkge1xuICAgICAgICBpZiAoIXRoaXMudmFsaWQpIHtcbiAgICAgICAgICAgIHJldHVybiAnW1ZlY3RvcjMgaW52YWxpZF0nO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnW1ZlY3RvcjMgeDonICsgdGhpcy54ICsgJyB5OicgKyB0aGlzLnkgKyAnIHo6JyArIHRoaXMueiArICddJztcbiAgICB9XG59IiwiaW1wb3J0IHtFdmVudEVtaXR0ZXJ9IGZyb20gJ2V2ZW50cyc7XG5pbXBvcnQge0ZyYW1lfSBmcm9tICcuLy4uL0ZyYW1lLmpzJztcblxuZXhwb3J0IGNsYXNzIEJhc2VDb25uZWN0aW9uIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgICBjb25zdHJ1Y3Rvcih7aG9zdCA9ICcxMjcuMC4wLjEnLCBwb3J0ID0gNjQ1MH0gPSB7fSkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIGlmICh0eXBlb2YgaG9zdCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSG9zdCBuZWVkcyB0byBiZSBvZiB0eXBlIHN0cmluZycpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwb3J0ICE9PSBwYXJzZUludChwb3J0LCAxMCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignUG9ydCBuZWVkcyB0byBiZSBvZiB0eXBlIGludGVnZXInKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaG9zdCA9IGhvc3Q7XG4gICAgICAgIHRoaXMucG9ydCA9IHBvcnQ7XG4gICAgICAgIHRoaXMuY29ubmVjdGVkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgZ2V0VXJsKCkge1xuICAgICAgICByZXR1cm4gJ3dzOi8vJyArIHRoaXMuaG9zdCArICc6JyArIHRoaXMucG9ydCArICcvJztcbiAgICB9XG5cbiAgICBoYW5kbGVPcGVuKCkge1xuICAgICAgICB2YXIgcmV0dXJuVmFsdWU7XG5cbiAgICAgICAgaWYgKCF0aGlzLmNvbm5lY3RlZCkge1xuICAgICAgICAgICAgdGhpcy5zZW5kKHtcbiAgICAgICAgICAgICAgICAnY29tbWFuZCc6ICdyZXF1ZXN0RGV2aWNlSW5mbydcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuVmFsdWUgPSAnY29ubmVjdGluZyc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm5WYWx1ZSA9ICdjb25uZWN0ZWQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXR1cm5WYWx1ZTtcbiAgICB9XG5cbiAgICBoYW5kbGVDbG9zZSgpIHtcbiAgICAgICAgdmFyIHJldHVyblZhbHVlO1xuXG4gICAgICAgIGlmICh0aGlzLmNvbm5lY3RlZCkge1xuICAgICAgICAgICAgdGhpcy5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICB0aGlzLnN0YXJ0UmVjb25uZWN0aW9uKCk7XG4gICAgICAgICAgICByZXR1cm5WYWx1ZSA9ICdkaXNjb25uZWN0aW5nJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVyblZhbHVlID0gJ2Rpc2Nvbm5lY3RlZCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldHVyblZhbHVlO1xuICAgIH1cblxuICAgIHN0YXJ0UmVjb25uZWN0aW9uKCkge1xuICAgICAgICB2YXIgcmV0dXJuVmFsdWU7XG5cbiAgICAgICAgaWYgKCF0aGlzLnJlY29ubmVjdGlvblRpbWVyKSB7XG4gICAgICAgICAgICB0aGlzLnJlY29ubmVjdGlvblRpbWVyID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMucmVjb25uZWN0KCk7XG4gICAgICAgICAgICB9LCA1MDApO1xuICAgICAgICAgICAgcmV0dXJuVmFsdWUgPSAncmVjb25uZWN0aW5nJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVyblZhbHVlID0gJ2FscmVhZHkgcmVjb25uZWN0aW5nJztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0dXJuVmFsdWU7XG4gICAgfVxuXG4gICAgc3RvcFJlY29ubmVjdGlvbigpIHtcbiAgICAgICAgdGhpcy5yZWNvbm5lY3Rpb25UaW1lciA9IGNsZWFySW50ZXJ2YWwodGhpcy5yZWNvbm5lY3Rpb25UaW1lcik7XG4gICAgfVxuXG4gICAgZGlzY29ubmVjdChhbGxvd1JlY29ubmVjdCkge1xuICAgICAgICBpZiAoIWFsbG93UmVjb25uZWN0KSB7XG4gICAgICAgICAgICB0aGlzLnN0b3BSZWNvbm5lY3Rpb24oKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuc29ja2V0KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zb2NrZXQuY2xvc2UoKTtcbiAgICAgICAgZGVsZXRlIHRoaXMuc29ja2V0O1xuICAgICAgICBpZiAodGhpcy5jb25uZWN0ZWQpIHtcbiAgICAgICAgICAgIHRoaXMuY29ubmVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLmVtaXQoJ2Rpc2Nvbm5lY3QnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICByZWNvbm5lY3QoKSB7XG4gICAgICAgIHZhciByZXR1cm5WYWx1ZTtcblxuICAgICAgICBpZiAodGhpcy5jb25uZWN0ZWQpIHtcbiAgICAgICAgICAgIHRoaXMuc3RvcFJlY29ubmVjdGlvbigpO1xuICAgICAgICAgICAgcmV0dXJuVmFsdWUgPSAnc3RvcFJlY29ubmVjdGlvbic7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmRpc2Nvbm5lY3QodHJ1ZSk7XG4gICAgICAgICAgICB0aGlzLmNvbm5lY3QoKTtcbiAgICAgICAgICAgIHJldHVyblZhbHVlID0gJ2Nvbm5lY3QnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXR1cm5WYWx1ZTtcbiAgICB9XG5cbiAgICBoYW5kbGVEYXRhKGRhdGEpIHtcbiAgICAgICAgdmFyIG1lc3NhZ2UsXG4gICAgICAgICAgICBmcmFtZU9iamVjdCxcbiAgICAgICAgICAgIGZyYW1lLFxuICAgICAgICAgICAgZGV2aWNlSW5mbztcblxuICAgICAgICBpZiAoIWRhdGEpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZGF0YSByZWNlaXZlZCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVE9ETyBQcm9maWxlIHBlcmZvcm1hbmNlIG9mIHRoaXMgdHJ5L2NhdGNoIGJsb2NrXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBtZXNzYWdlID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgSlNPTicpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gV2FpdCBmb3IgZGV2aWNlSW5mbyB1bnRpbCBjb25uZWN0ZWRcbiAgICAgICAgaWYgKCF0aGlzLmNvbm5lY3RlZCAmJiBtZXNzYWdlLmhhc093blByb3BlcnR5KCdmcmFtZScpKSB7XG4gICAgICAgICAgICBmcmFtZSA9IG1lc3NhZ2UuZnJhbWU7XG4gICAgICAgICAgICBpZiAoZnJhbWUuaGFzT3duUHJvcGVydHkoJ2RldmljZUluZm8nKSkge1xuICAgICAgICAgICAgICAgIGRldmljZUluZm8gPSBmcmFtZS5kZXZpY2VJbmZvO1xuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnZGV2aWNlSW5mbycsIGRldmljZUluZm8pO1xuICAgICAgICAgICAgICAgIHRoaXMuY29ubmVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ2Nvbm5lY3QnKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuY29ubmVjdGVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobWVzc2FnZS5oYXNPd25Qcm9wZXJ0eSgnZnJhbWUnKSkge1xuICAgICAgICAgICAgZnJhbWVPYmplY3QgPSBuZXcgRnJhbWUobWVzc2FnZS5mcmFtZSk7XG4gICAgICAgICAgICB0aGlzLmVtaXQoZnJhbWVPYmplY3QudHlwZSwgZnJhbWVPYmplY3QpO1xuXG4gICAgICAgICAgICAvLyBFbWl0IHBvc2UgaWYgZXhpc3RpbmdcbiAgICAgICAgICAgIGlmIChmcmFtZU9iamVjdC5wb3NlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdwb3NlJywgZnJhbWVPYmplY3QucG9zZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEVtaXQgZXZlbnQgaWYgZXhpc3RpbmdcbiAgICAgICAgICAgIGlmIChmcmFtZU9iamVjdC5ldmVudCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnZXZlbnQnLCBmcmFtZU9iamVjdC5ldmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb25uZWN0KCkge1xuICAgICAgICB2YXIgaW5Ccm93c2VyID0gdHlwZW9mKHdpbmRvdykgIT09ICd1bmRlZmluZWQnO1xuXG4gICAgICAgIGlmICh0aGlzLnNvY2tldCkge1xuICAgICAgICAgICAgcmV0dXJuICdzb2NrZXQgYWxyZWFkeSBjcmVhdGVkJztcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZW1pdCgncmVhZHknKTtcblxuICAgICAgICBpZiAoaW5Ccm93c2VyKSB7XG4gICAgICAgICAgICB0aGlzLnNvY2tldCA9IG5ldyBXZWJTb2NrZXQodGhpcy5nZXRVcmwoKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBDb25uZWN0aW9uVHlwZSA9IHJlcXVpcmUoJ3dzJyk7XG4gICAgICAgICAgICB0aGlzLnNvY2tldCA9IG5ldyBDb25uZWN0aW9uVHlwZSh0aGlzLmdldFVybCgpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc29ja2V0Lm9ub3BlbiA9ICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlT3BlbigpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLnNvY2tldC5vbmNsb3NlID0gKGRhdGEpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlQ2xvc2UoZGF0YS5jb2RlLCBkYXRhLnJlYXNvbik7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuc29ja2V0Lm9ubWVzc2FnZSA9IChtZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmhhbmRsZURhdGEobWVzc2FnZS5kYXRhKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5zb2NrZXQub25lcnJvciA9IChkYXRhKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmhhbmRsZUNsb3NlKCdjb25uZWN0RXJyb3InLCBkYXRhLmRhdGEpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHNlbmQoZGF0YSkge1xuICAgICAgICBpZiAodHlwZW9mIGRhdGEgIT09ICdvYmplY3QnIHx8IHR5cGVvZiBkYXRhID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQYXJhbWV0ZXIgbmVlZHMgdG8gYmUgYW4gb2JqZWN0Jyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zb2NrZXQuc2VuZChKU09OLnN0cmluZ2lmeShkYXRhKSk7XG4gICAgfVxufSJdfQ==

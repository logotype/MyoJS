[<img src="http://logotype.se/myo/logo_daemon.png">](https://github.com/logotype/myojs.git)

This is the JavaScript framework for working with Thalmic Labs Myo.

The Myo armband measures the electrical activity from your muscles to detect what gesture your hand is making. It also senses all of the motions and rotations of your hand and forearm.

[thalmic.com](http://www.thalmic.com)

[![Build Status](https://travis-ci.org/logotype/MyoJS.svg?branch=master)](https://travis-ci.org/logotype/MyoJS) [![NPM Version](https://badge.fury.io/js/myojs.svg)](http://badge.fury.io/js/myojs) [![Code Climate](https://codeclimate.com/github/logotype/MyoJS/badges/gpa.svg)](https://codeclimate.com/github/logotype/MyoJS) [![Test Coverage](https://codeclimate.com/github/logotype/MyoJS/badges/coverage.svg)](https://codeclimate.com/github/logotype/MyoJS/coverage)

Quick start
-----------

Clone the repo, `git clone git://github.com/logotype/myojs.git`.
MyoJS is dependent on the [myodaemon OSX app](https://github.com/logotype/myodaemon/blob/master/build/myodaemon.zip?raw=true), source code available here `git clone git://github.com/logotype/myodaemon.git`.

Create an instance of the `Hub` class:

```javascript
    const hub = Myo.Hub();

    hub.on('ready', () => {
        console.log('ready');
    });
    hub.on('connect', () => {
        console.log('connected');
    });
    hub.on('frame', (frame) => {
        // Get the most recent frame and report some basic information
    	console.log('Frame id: ' + frame.id + ', timestamp: ' + frame.timestamp);
    });
    hub.on('disconnect', () => {
        console.log('disconnect');
    });
```

What you'll get from the `frame` handler is a `Frame` instance, with properties such as `Quaternion`, `Matrix`, `Pose` and more.

Features
--------
<img src="http://logotype.se/myo/myodaemon.png?v5">
+ Modern, written in ES6/ES2015
+ Clean, lightweight and documented code
+ Same structure as official API
+ Supports both browser and node.js connections
+ Accelerometer, Gyroscope, Pose and more
+ Access to raw EMG data
+ Connects via [myodaemon OSX app](https://github.com/logotype/myodaemon)

Authors
-------

**Victor Norgren**

+ http://twitter.com/logotype
+ https://github.com/logotype
+ https://logotype.se


Copyright and license
---------------------

Copyright © 2017 logotype

Author: Victor Norgren

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:  The above copyright
notice and this permission notice shall be included in all copies or
substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
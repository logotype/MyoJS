import {BaseConnection as _BaseConnection} from './connection/BaseConnection.js';
import {Hub as _Hub} from './Hub.js';
import {Myo as _Myo} from './Myo.js';
import {CircularBuffer as _CircularBuffer} from './CircularBuffer.js';
import {Pose as _Pose} from './Pose.js';
import {Quaternion as _Quaternion} from './Quaternion.js';
import {Vector3 as _Vector3} from './Vector3.js';
import {Frame as _Frame} from './Frame.js';

export class MyoJS {
    constructor() {

    }

    static BaseConnection() {
        return _BaseConnection;
    }

    static CircularBuffer() {
        return _CircularBuffer;
    }

    static Hub() {
        return new _Hub();
    }

    static Myo() {
        return _Myo;
    }

    static Frame() {
        return _Frame;
    }

    static Pose() {
        return _Pose;
    }

    static Quaternion() {
        return _Quaternion;
    }

    static Vector3() {
        return _Vector3;
    }
}

export default MyoJS;

/**
 * Browserify exports global to the window object.
 * @namespace Myo
 */
global.Myo = MyoJS;

import BaseConnection from './connection/BaseConnection.js';
import Hub from './Hub.js';
import Myo from './Myo.js';
import CircularBuffer from './CircularBuffer.js';
import Pose from './Pose.js';
import Quaternion from './Quaternion.js';
import Vector3 from './Vector3.js';
import Frame from './Frame.js';

export default class MyoJS {
    constructor() {

    }

    static BaseConnection() {
        return BaseConnection;
    }

    static CircularBuffer() {
        return CircularBuffer;
    }

    static Hub() {
        return new Hub();
    }

    static Myo() {
        return Myo;
    }

    static Frame() {
        return Frame;
    }

    static Pose() {
        return Pose;
    }

    static Quaternion() {
        return Quaternion;
    }

    static Vector3() {
        return Vector3;
    }
}

/**
 * Exports global to the window object.
 * @namespace Myo
 */
global.Myo = MyoJS;

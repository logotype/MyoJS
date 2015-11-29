import {Pose} from './Pose.js';
import {Quaternion} from './Quaternion.js';
import {Vector3} from './Vector3.js';

export class Frame {
    constructor(data) {

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
            this.pose = new Pose(data.pose);
        } else {
            this.pose = Pose.invalid();
        }

        /**
         * A change in pose has been detected.
         * @member pose
         * @memberof Myo.Pose.prototype
         * @type {Pose}
         */
        if (data.rotation) {
            this.rotation = new Quaternion(data.rotation);
        } else {
            this.rotation = Quaternion.invalid();
        }

        if (data.accel) {
            this.accel = new Vector3(data.accel);
        } else {
            this.accel = Vector3.invalid();
        }

        if (data.gyro) {
            this.gyro = new Vector3(data.gyro);
        } else {
            this.gyro = Vector3.invalid();
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
    toString() {
        return `[Frame id:${this.id} timestamp:${this.timestamp} accel:${this.accel.toString()}]`;
    }
}
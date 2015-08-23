import {EventEmitter} from 'events';
import {Myo} from './Myo.js';
import {BaseConnection} from './connection/BaseConnection.js';
import {CircularBuffer} from './CircularBuffer.js';

export class Hub extends EventEmitter {
    constructor(opt) {
        super(opt);

        this.connection = new BaseConnection(opt);
        this.history = new CircularBuffer(200);
        this.myos = [];

        this.connection.connect();

        this.connection.on('deviceInfo', () => {
            this.myo = new Myo(this.connection);
        });
        this.connection.on('frame', (frame) => {
            this.history.push(frame);
            this.emit('frame', frame);
        });
        this.connection.on('pose', (pose) => {
            this.emit('pose', pose);
        });
        this.connection.on('event', (event) => {
            this.emit(event.type);
        });
        this.connection.on('ready', () => {
            this.emit('ready');
        });
        this.connection.on('connect', () => {
            this.emit('connect');
        });
        this.connection.on('disconnect', () => {
            this.emit('disconnect');
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
    frame(num) {
        return this.history.get(num) || null;
    }

    /**
     * Find a nearby Myo and pair with it, or time out after timeoutMilliseconds milliseconds if provided.
     *
     * <p>If timeout_ms is zero, this method blocks until a Myo is found. This method must
     * not be run concurrently with run() or runOnce().</p>
     */
    waitForMyo(timeoutMilliseconds) {
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
    run(durationMilliseconds) {
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
    runOnce(durationMilliseconds) {
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
    toString() {
        return '[Hub history:' + this.history + ']';
    }
}
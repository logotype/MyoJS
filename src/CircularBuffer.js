export class CircularBuffer {
    constructor(size) {

        this.pos = 0;
        this._buf = [];
        this.size = size;
    }

    get(i) {
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

    push(o) {
        this._buf[this.pos % this.size] = o;
        return this.pos++;
    }
}
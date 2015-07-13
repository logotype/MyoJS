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

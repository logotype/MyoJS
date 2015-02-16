var EventEmitter = require('events').EventEmitter,
    MyoJS = require('../src/Index.js'),
    assert = require('chai').assert;

describe('Myo', function(){
    describe('Constructor validation', function(){
        it('should return a Myo object', function(){
            var context = {};
            var myo = new MyoJS.Myo(context);
            assert.equal(myo.context, context);
            assert.equal(myo instanceof MyoJS.Myo, true);
        });
        it('should throw an error when missing arguments', function(){
            assert.throws(function() {
                new MyoJS.Myo();
            }, Error, 'Missing context');
        });
    });
    describe('#vibrate', function(){
        it('should call context', function(){
            var output = '';
            var context = {};
            context.send = function(message) { output = JSON.stringify(message) };
            var myo = new MyoJS.Myo(context);
            myo.vibrate(0);
            assert.equal(output, '{"command":"vibrate","args":[0]}');
        });
        it('should throw an error when passing incorrect value', function(){
            assert.throws(function() {
                var myo = new MyoJS.Myo({});
                myo.vibrate('incorrect');
            }, Error, 'Valid values are: Myo.VIBRATION_SHORT, Myo.VIBRATION_MEDIUM, Myo.VIBRATION_LONG');
        });
    });
    describe('#unlock', function(){
        it('should call context', function(){
            var output = '';
            var context = {};
            context.send = function(message) { output = JSON.stringify(message) };
            var myo = new MyoJS.Myo(context);
            myo.unlock(0);
            assert.equal(output, '{"command":"unlock","args":[0]}');
        });
        it('should throw an error when passing incorrect value', function(){
            assert.throws(function() {
                var myo = new MyoJS.Myo({});
                myo.unlock('incorrect');
            }, Error, 'Valid values are: Myo.UNLOCK_TIMED, Myo.UNLOCK_HOLD');
        });
    });
    describe('#lock', function(){
        it('should call context', function(){
            var output = '';
            var context = {};
            context.send = function(message) { output = JSON.stringify(message) };
            var myo = new MyoJS.Myo(context);
            myo.lock(0);
            assert.equal(output, '{"command":"lock"}');
        });
    });
    describe('#notifyUserAction', function(){
        it('should call context', function(){
            var output = '';
            var context = {};
            context.send = function(message) { output = JSON.stringify(message) };
            var myo = new MyoJS.Myo(context);
            myo.notifyUserAction(0);
            assert.equal(output, '{"command":"notifyUserAction","args":[0]}');
        });
        it('should throw an error when passing incorrect value', function(){
            assert.throws(function() {
                var myo = new MyoJS.Myo({});
                myo.notifyUserAction(1234);
            }, Error, 'Valid values are: Myo.USER_ACTION_SINGLE');
        });
    });
    describe('#requestRssi', function(){
        it('should call context', function(){
            var output = '';
            var context = {};
            context.send = function(message) { output = JSON.stringify(message) };
            var myo = new MyoJS.Myo(context);
            myo.requestRssi();
            assert.equal(output, '{"requestRssi":true}');
        });
    });
});

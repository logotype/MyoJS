import {assert} from 'chai';
import {Myo} from './../src/Myo.js';

describe('Myo', () => {
    describe('Constructor validation', () => {
        it('should return a Myo object', () => {
            let context = {};
            let myo = new Myo(context);
            assert.strictEqual(myo.context, context);
            assert.strictEqual(myo instanceof Myo, true);
        });
        it('should throw an error when missing arguments', () => {
            assert.throws(() =>  {
                new Myo();
            }, Error, 'Missing context');
        });
    });
    describe('#vibrate', () => {
        it('should throw an error when passing incorrect value', () => {
            assert.throws(() =>  {
                let myo = new Myo({});
                myo.vibrate('incorrect');
            }, Error, 'Valid values are: Myo.VIBRATION_SHORT, Myo.VIBRATION_MEDIUM, Myo.VIBRATION_LONG');
        });
        it('should call context with value Myo.VIBRATION_SHORT', () => {
            let output = '';
            let context = {};
            context.send = (message) => { output = JSON.stringify(message) };
            let myo = new Myo(context);
            myo.vibrate(Myo.VIBRATION_SHORT);
            assert.strictEqual(output, '{"command":"vibrate","args":[0]}');
        });
        it('should call context with value Myo.VIBRATION_MEDIUM', () => {
            let output = '';
            let context = {};
            context.send = (message) => { output = JSON.stringify(message) };
            let myo = new Myo(context);
            myo.vibrate(Myo.VIBRATION_MEDIUM);
            assert.strictEqual(output, '{"command":"vibrate","args":[1]}');
        });
        it('should call context with value Myo.VIBRATION_LONG', () => {
            let output = '';
            let context = {};
            context.send = (message) => { output = JSON.stringify(message) };
            let myo = new Myo(context);
            myo.vibrate(Myo.VIBRATION_LONG);
            assert.strictEqual(output, '{"command":"vibrate","args":[2]}');
        });
    });
    describe('#unlock', () => {
        it('should throw an error when passing incorrect value', () => {
            assert.throws(() =>  {
                let myo = new Myo({});
                myo.unlock('incorrect');
            }, Error, 'Valid values are: Myo.UNLOCK_TIMED, Myo.UNLOCK_HOLD');
        });
        it('should call context with value Myo.UNLOCK_TIMED', () => {
            let output = '';
            let context = {};
            context.send = (message) => { output = JSON.stringify(message) };
            let myo = new Myo(context);
            myo.unlock(Myo.UNLOCK_TIMED);
            assert.strictEqual(output, '{"command":"unlock","args":[0]}');
        });
        it('should call context with value Myo.UNLOCK_HOLD', () => {
            let output = '';
            let context = {};
            context.send = (message) => { output = JSON.stringify(message) };
            let myo = new Myo(context);
            myo.unlock(Myo.UNLOCK_HOLD);
            assert.strictEqual(output, '{"command":"unlock","args":[1]}');
        });
    });
    describe('#lock', () => {
        it('should call context', () => {
            let output = '';
            let context = {};
            context.send = (message) => { output = JSON.stringify(message) };
            let myo = new Myo(context);
            myo.lock(0);
            assert.strictEqual(output, '{"command":"lock"}');
        });
    });
    describe('#notifyUserAction', () => {
        it('should call context', () => {
            let output = '';
            let context = {};
            context.send = (message) => { output = JSON.stringify(message) };
            let myo = new Myo(context);
            myo.notifyUserAction(0);
            assert.strictEqual(output, '{"command":"notifyUserAction","args":[0]}');
        });
        it('should throw an error when passing incorrect value', () => {
            assert.throws(() =>  {
                let myo = new Myo({});
                myo.notifyUserAction(1234);
            }, Error, 'Valid values are: Myo.USER_ACTION_SINGLE');
        });
    });
    describe('#requestRssi', () => {
        it('should call context', () => {
            let output = '';
            let context = {};
            context.send = (message) => { output = JSON.stringify(message) };
            let myo = new Myo(context);
            myo.requestRssi();
            assert.strictEqual(output, '{"requestRssi":true}');
        });
    });
});

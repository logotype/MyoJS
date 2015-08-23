import {Hub} from './../src/Hub.js';
let hub = new Hub();

hub.on('ready', () => { console.log('ready'); });
hub.on('connect', () => { console.log('connected'); });
hub.on('disconnect', () => { console.log('disconnect'); });
hub.on('frame', (frame) => {
    console.log(frame.rotation.toString());
    console.log(frame.accel.toString());
    console.log(frame.gyro.toString());
});

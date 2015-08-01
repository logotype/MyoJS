var Myo = require('../src/Index'),
    hub = new Myo.Hub();

hub.on('ready', function() { console.log('ready'); });
hub.on('connect', function() { console.log('connected'); });
hub.on('disconnect', function() { console.log('disconnect'); });
hub.on('frame', function(frame) {
    console.log(frame.data);
});

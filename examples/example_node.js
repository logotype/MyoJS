var Myo = require('../template/entry'),
    hub = new Myo.Hub();

hub.on('ready', function() { console.log('ready'); });
hub.on('connect', function() { console.log('connected'); });
hub.on('disconnect', function() { console.log('disconnect'); });
hub.on('frame', function(frame) {
    console.dir(frame);

    if (frame.rotation) {
        console.log(frame.rotation.toString());
    }

    if (frame.pose && frame.pose.valid) {
        console.log(frame.pose.toString());
    }
});

var MyoJS = require('./../index'),
    hub = new Myo.Hub(),
    checkConnection;

hub.on('ready', function() { console.log('ready'); });
hub.on('connect', function() { console.log('connected'); });
hub.on('disconnect', function() { console.log('disconnect'); });
hub.on('frame', function(frame) {
    console.log(frame.rotation.toString());
    console.log(frame.accel.toString());
    console.log(frame.gyro.toString());
});

checkConnection = setInterval(function() {
    if(hub.connection.connected) {
        clearInterval(checkConnection);
    } else {
        console.log('Waiting for connection...');
    }
}, 1000);
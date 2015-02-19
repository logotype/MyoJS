/**
 * Myo is the global namespace of the Myo API.
 * @namespace Myo
 */
Myo = module.exports = {
    BaseConnection: require('./connection/BaseConnection'),
    Hub: require('./Hub'),
    Myo: require('./Myo'),
    CircularBuffer: require('./CircularBuffer'),
    Pose: require('./Pose'),
    Quaternion: require('./Quaternion'),
    Vector3: require('./Vector3'),
    Frame: require('./Frame'),
    Version: require('./Version.js')
};

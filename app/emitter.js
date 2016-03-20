/*********************************** EMITTER ***********************************/

var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter();

// emitter.on('connection', function(listener) {
//     emitter.on('followAlert', function (user) {
//         emitter.emit('followAlert', user);
//     });
// });

module.exports = emitter;
/************************************ MUSIC ***********************************/
var fs = require('fs');
var emitter = require('./emitter');

var filePath = 'C:\\Users\\Bo\\Apps\\PhantomBotv2\\addons\\youtubePlayer\\currentsong.txt';
var file = fs.readFileSync(filePath).toString().trim().replace(/(             \/\/)/, '');

emitter.emit('initSong', file);

var song = file;
fs.watchFile(filePath, function() {
    file = fs.readFileSync(filePath).toString().trim().replace(/(             \/\/)/, '');
    if (file != 'No song is currently playing.') {
        emitter.emit('newSong', file);
    }
    song = file;
});

module.exports.song = song;
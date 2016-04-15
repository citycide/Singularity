/************************************ MUSIC ***********************************/
const fs = require('fs'),
      emitter = require('./emitter');
const FILE_PATH = 'C:\\Users\\Bo\\Apps\\PhantomBotv2\\addons\\youtubePlayer\\currentsong.txt';

let file = fs.readFileSync(FILE_PATH).toString().trim().replace(/(             \/\/)/, '');

emitter.emit('initSong', file);

let song = file;
fs.watchFile(FILE_PATH, function() {
    file = fs.readFileSync(FILE_PATH).toString().trim().replace(/(             \/\/)/, '');
    if (file != 'No song is currently playing.') {
        emitter.emit('newSong', file);
    }
    song = file;
});

function getCurrentSong() {
    if (song === null || song === ' ') return 'No song is currently playing.';
    return song;
}

module.exports.getCurrentSong = getCurrentSong;
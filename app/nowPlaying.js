/************************************ MUSIC ***********************************/
const f = require('fs'),
      fs = require('fs-jetpack'),
      config = require('./configstore'),
      emitter = require('./emitter');

let filePath = config.get('nowPlayingFile') || null;
let sep = config.get('nowPlayingSep') || '             //             ';
// const FILE_PATH = 'C:\\Users\\Bo\\Apps\\PhantomBotv2\\addons\\youtubePlayer\\currentsong.txt';

global.io.on('setNowPlayingFile', (_path) => {
    config.set('nowPlayingFile', _path);
    filePath = config.get('nowPlayingFile');
});

global.io.on('setNowPlayingSep', (_sep) => {
    config.set('nowPlayingSep', _sep);
    sep = config.get('nowPlayingSep');
});

let file = fs.read(filePath).toString().replace(sep, '');

emitter.emit('initSong', file);

let song = file;
f.watchFile(filePath, () => {
    file = fs.read(filePath).toString().replace(sep, '');
    if (file != 'No song is currently playing.') {
        emitter.emit('newSong', file);
    }
    song = file;
});

function getCurrentSong() {
    if (song === null || song === ' ') return 'No song is currently playing.';
    return song.trim();
}

module.exports.getCurrentSong = getCurrentSong;
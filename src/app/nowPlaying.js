/************************************ MUSIC ***********************************/
'use strict';

import fs from 'fs';
import jetpack from 'fs-jetpack';
const config = require('./configstore'),
      emitter = require('./emitter');

let filePath = config.get('nowPlayingFile') || null;
let sep = config.get('nowPlayingSep') || '             //             ';
// const FILE_PATH = 'C:\\Users\\Bo\\Apps\\PhantomBotv2\\addons\\youtubePlayer\\currentsong.txt';

io.on('music:set:file', (_path) => {
    config.set('nowPlayingFile', _path);
    filePath = config.get('nowPlayingFile');
});

io.on('music:set:separator', (_sep) => {
    config.set('nowPlayingSep', _sep);
    sep = config.get('nowPlayingSep');
});

let song;
if (filePath !== null) {
    let file = jetpack.read(filePath).toString().replace(sep, '');

    io.emit('music:init', file);

    song = file;
    fs.watchFile(filePath, () => {
        file = jetpack.read(filePath).toString().replace(sep, '');
        if (file != 'No song is currently playing.') {
            io.emit('music:update', file);
        }
        song = file;
    });
}

const getCurrentSong = () => {
    if (song === null || song === ' ' || song === undefined) return 'No song is currently playing.';
    return song.trim();
};

module.exports.getCurrentSong = getCurrentSong;
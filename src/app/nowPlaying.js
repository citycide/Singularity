/************************************ MUSIC ***********************************/
'use strict';

import chokidar from 'chokidar';
import jetpack from 'fs-jetpack';

let filePath = Settings.get('nowPlayingFile') || null;
let sep = Settings.get('nowPlayingSep') || '             //             ';

io.on('music:set:file', (_path) => {
    Settings.set('nowPlayingFile', _path);
    filePath = Settings.get('nowPlayingFile');
});

io.on('music:set:separator', (_sep) => {
    Settings.set('nowPlayingSep', _sep);
    sep = Settings.get('nowPlayingSep');
});

let song;
if (filePath !== null) {
    let file = jetpack.read(filePath).toString().replace(sep, '');

    io.emit('music:init', file);

    song = file;
    const watcher = chokidar.watch(filePath, {
        persistent: true
    });

    watcher.on('change', (_path, stats) => {
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
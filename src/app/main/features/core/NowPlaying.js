/************************************ MUSIC ***********************************/
'use strict';

import chokidar from 'chokidar';
import jetpack from 'fs-jetpack';
import { EventEmitter } from 'events';

export default class NowPlaying extends EventEmitter {
    constructor(filePath, separator) {
        super();
        this.filePath = filePath || null;
        this.separator = separator || '             //             ';
        this.current = 'No song is currently playing.';
        this.watcher = null;

        this.watch();
    }

    watch() {
        if (!this.filePath) return;
        let file = jetpack.read(this.filePath).replace(this.separator, '').trim();
        this.current = file;
        this.emit('music:init', this.current);
        this.watcher = chokidar.watch(this.filePath, {
            persistent: true
        });

        this.watcher.on('change', (_path, stats) => {
            file = jetpack.read(this.filePath).replace(this.separator, '').trim();
            if (file !== 'No song is currently playing.' || file !== this.separator) {
                this.current = file;
                this.emit('music:update', this.current);
            }
        });
    }

    getCurrent() {
        if (!this.filePath) return;
        if (this.current === null || this.current === '' || this.current === undefined) return 'No song is currently playing.';
        return this.current;
    }

    updateFilePath(newPath) {
        this.watcher.unwatch(this.filePath);
        this.filePath = newPath;
        this.watcher.add(this.filePath);
    }

    updateSeparator(newSep) {
        this.separator = newSep;
    }
}
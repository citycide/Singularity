import path from 'path';
import chokidar from 'chokidar';

import userModules from '../../../app/main/utils/_userModuleSetup';

const MODULE_PATH = path.resolve(__dirname, '..', 'modules');
const files = new Map();

const load = function(_module) {
    if (!files.has(_module)) {
        const moduleType = isCoreModule(_module) ? 'core' : 'user';
        files.set(_module, moduleType);
        Logger.debug(`Module loaded (${moduleType}):: ${moduleType === 'core' ? makeRelPath(_module) : _module}`);
    }
    return require(_module);
};

const reload = function(_module) {
    if (!require.cache[_module]) {
        if (!files.has(_module)) {
            const moduleType = isCoreModule(_module) ? 'core' : 'user';
            files.set(_module, moduleType);
        }
        return require(_module);
    }

    const _temp = require.cache[_module];
    delete require.cache[_module];
    const fresh = require(_module);
    require.cache[_module] = _temp;
    Logger.debug(`Module reloaded:: ${makeRelPath(_module)}`);
    return fresh;
};

const unload = function(_module, options = {}) {
    if (!options.all) {
        if (files.has(_module)) {
            if (!DEV_MODE) {
                files.delete(_module);
                const moduleType = isCoreModule(_module) ? 'core' : 'user';
                Logger.debug(`Module unloaded (${moduleType}):: ` +
                    `${moduleType === 'core' ? makeRelPath(_module) : _module}`);
            }
        }
        delete require.cache[_module];
    } else {
        for (let [k, v] of files.entries()) {
            delete require.cache[k];
            if (v === 'core') {
                Logger.debug(`Module unloaded (core):: ${makeRelPath(k)}`);
            } else if (v === 'user') {
                Logger.debug(`Module unloaded (user):: ${k}`);
            }
        }

        files.clear();
    }
};

const isCoreModule = function(_path) {
    return (_path.startsWith(MODULE_PATH));
};

const makeRelPath = function(_path) {
    return `./modules${_path.replace(MODULE_PATH, '').replace(/\\/g, '/')}`;
};

export default {
    load,
    reload,
    unload,
    userModules,

    watcher: {
        start() {
            if (this._daemon) return;

            this._daemon = chokidar.watch([
                `${MODULE_PATH}/**/*.js`,
                Settings.get('userModulePath')
            ], {
                persistent: true
            });

            this._listen();
        },
        stop() {
            if (!this._daemon) return;

            this._daemon.close();
            this._daemon = null;
        },
        _daemon: null,
        _listen() {
            if (!this._daemon) return;

            this._daemon
                .on('ready', () => {})
                .on('error', error => Logger.err(`ERR in module watcher:: `, error))
                .on('add', _path => load(_path))
                .on('change', _path => reload(_path))
                .on('unlink', _path => unload(_path));
        }
    }
};



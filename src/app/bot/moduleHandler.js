import chokidar from 'chokidar';
import requireUncached from 'require-uncached';

const watcher = chokidar.watch(Settings.get('userModulePath'), {
    persistent: true
});

watcher.on('add', (path, stats) => {
    handler.reloadModule(path);
});

const handler = {
    /**
     * @function requireModule
     * @description Wraps the standard require syntax to clear the cached version first
     * @param {string} _module - Path to the module to be required
     * @return {module} Returns the module after being reloaded
     * @export
     */
    requireModule(_module) {
        return requireUncached(_module);
    },

    /**
     * @function reloadModule
     * @description Clears the cache of the specified module
     * @param {string} _module - Path to the module to be reloaded
     * @export
     */
    reloadModule(_module) {
        try {
            requireUncached(_module);
            return true;
        } catch (err) {
            Logger.error(err);
            return false;
        }
    }
};

export default handler;
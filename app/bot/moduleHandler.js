/********************* moduleHander.js *********************/
/**
 * @description
 * This handles the reloading of modules when they're updated.
 * To do this, it watches the /modules directory and all its
 * subdirectories for changes to *.js files. If it detects a
 * change, it will delete the require.cache for that module.
 * This forces Node to reload the script.
 */

// use chokidar for this
// http://stackoverflow.com/questions/1972242/auto-reload-of-files-in-node-js
// usage example: ```delete require.cache[$.command.getModule]```
    
const requireUncached = require('require-uncached');
const chokidar = require('chokidar');

// chokidar / file watching in general might be completely unnecessary here
// at least for changes to files. might still be useful for watching for new
// files, then emitting a request for command registry to get the new module's
// functions set up with the core. would prevent requiring an app restart
// ```/\.js$/```
const watcher = chokidar.watch('./modules/**/*.js', {
    persistent: true
});

watcher.on('add', (path, stats) => {
    exports.reloadModule(path);
});

module.exports = exports = {
    /**
     * @function requireModule
     * @description Wraps the standard require syntax to clear the cached version first
     * @param {string} _module - Path to the module to be required
     * @return {module} Returns the module after being reloaded
     * @export
     */
    requireModule: function(_module) {
        return requireUncached(_module);
    },

    /**
     * @function reloadModule
     * @description Clears the cache of the specified module
     * @param {string} _module - Path to the module to be reloaded
     * @export
     */
    reloadModule: function(_module) {
        try {
            requireUncached(_module);
            return true;
        } catch (err) {
            console.log(err);
            return false;
        }
    }
};
import path from 'path';
import jetpack from 'fs-jetpack';

export default function(rootDir) {
    try {
        jetpack.dir(Settings.get('userModulePath'));
    } catch (err) {
        if (err.message.substr(0, 31) === 'Destination path already exists') {
            Logger.trace('User module directory already in place');
        } else {
            Logger.error(err);
        }
    }
}
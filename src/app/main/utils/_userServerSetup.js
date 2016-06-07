import path from 'path';
import jetpack from 'fs-jetpack';

export default function(rootDir) {
    try {
        const src = jetpack.cwd(path.resolve(rootDir + '/public/views/user'));
        const dst = jetpack.cwd(Settings.get('userServerPath'));

        if (!jetpack.list(dst.path()) || jetpack.list(dst.path()).length < 1) {
            Logger.info('User server does not exist yet - initiating user server files');
            src.copy('.', dst.path());
        }
    } catch (err) {
        if (err.message.substr(0, 31) === 'Destination path already exists') {
            Logger.trace('User server already in place');
        } else {
            Logger.error(err);
        }
    }
}
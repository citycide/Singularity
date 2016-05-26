import {app, remote} from 'electron';
import path from 'path';

const DIR = path.resolve(`${(app ? app.getPath('home') : remote.require('electron').app.getPath('home'))}/singularity`); // eslint-disable-line
const serverPath = path.resolve(`${DIR}/server`);
const modulePath = path.resolve(`${DIR}/modules`);

export default {
    themeColor: '#03AFF9',
    enableJSONApi: true,
    nativeFrame: (process.platform !== 'win32'),
    setupComplete: false,
    sessionSecret: '9347asfg597y43wernhy59072rw345',
    clientID: '41i6e4g7i1snv0lz0mbnpr75e1hyp9p',
    dataPath: DIR,
    userServerPath: serverPath,
    userModulePath: modulePath
};

/*********************************** CONFIG ***********************************/
'use strict';

import SimpleJsonStore from 'simple-json-store';
import jetpack from 'fs-jetpack';
import path from 'path';

jetpack.dir(path.resolve(__dirname, '..', 'config'));
const config = new SimpleJsonStore(path.resolve(__dirname, '..', 'config', 'config.json'),
    {
        "port": 2881,
        "devMode": true,
        "setupComplete": false,
        "sessionSecret": "9347asfg597y43wernhy59072rw345",
        "clientID": "41i6e4g7i1snv0lz0mbnpr75e1hyp9p"
    }
);

module.exports = config;
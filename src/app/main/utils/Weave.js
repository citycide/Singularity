import { app, remote } from 'electron';
import jetpack from 'fs-jetpack';
import path from 'path';
import format from 'string-format';

export default class Weave {
    constructor(customLang) {
        let locale = (app || remote.app).getLocale();
        this.defaultLang = path.resolve(`${__dirname}/lang/en-US.json`);

        if (!customLang) {
            locale = Weave.directory[locale] || locale || 'en-US';
            this.localePath = path.resolve(`${__dirname}/lang/${locale}.json`);
        } else {
            this.localePath = customLang;
        }

        if (!jetpack.exists(this.localePath)) {
            this.localePath = this.defaultLang;
        }

        this.read();
    }

    get(key, ...args) {
        let str = this.lang[key] || this._lang[key];
        return str ? format(str, ...args) : Weave.MISSING;
    }

    set(key, value) {
        if (arguments.length < 2 || !this.lang) return false;

        this.lang[key] = value;
        this.write();
    }

    fork(toFileName) {
        const outPath = path.resolve(`${Settings.get('dataPath')}/lang/${toFileName}.json`);
        if (jetpack.exists(outPath)) {
            return Logger.error(`Could not create lang file ${toFileName}. File already exists.`);
        }

        this.read();
        jetpack.write(outPath, this.lang, { jsonIndent: 4 });
        this.localePath = outPath;
        Settings.set('langFile', outPath);
    }

    read() {
        this._lang = jetpack.read(this.defaultLang, 'json');
        this.lang = jetpack.read(this.localePath, 'json');
    }

    write(force) {
        const now = new Date().getTime();

        if ((now - this.lastWrite > 250) || force) {
            if (this.lang) {
                jetpack.write(this.localePath, this.lang, { jsonIndent: 4 });
            }
            if (this.saving) clearTimeout(this.saving);
        } else {
            if (this.saving) clearTimeout(this.saving);
            this.saving = setTimeout(::this.write, 275);
        }

        this.lastWrite = now;
    }
}

Weave.MISSING = 'Unknown language string.';

Weave.directory = {
    'en-029': 'en-US',
    'en-AU': 'en-US',
    'en-BZ': 'en-US',
    'en-CA': 'en-US',
    'en-GB': 'en-US',
    'en-IE': 'en-US',
    'en-IN': 'en-US',
    'en-JM': 'en-US',
    'en-MY': 'en-US',
    'en-NZ': 'en-US',
    'en-PH': 'en-US',
    'en-SG': 'en-US',
    'en-TT': 'en-US',
    'en-ZA': 'en-US',
    'en-ZW': 'en-US'
};

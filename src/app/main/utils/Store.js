/********************************** DATABASE **********************************/
'use strict';

import jetpack from 'fs-jetpack';
import moment from 'moment';
import SQL from 'sql.js';

export default class Store {
    constructor(fileName) {
        this.fileName = fileName;
        this.db = null;
        this.debug = false;
        this._init();
    }

    _init() {
        try {
            const file = jetpack.read(this.fileName, 'buffer');
            this.db = new SQL.Database(file);
        } catch (err) {
            Logger.error(err);
            this.db = new SQL.Database();
            this._write();
        }
    }

    _write() {
        try {
            const data = this.db.export();
            const buffer = new Buffer(data);
            jetpack.write(this.fileName, buffer);
            return true;
        } catch (err) {
            Logger.error(err);
            return false;
        }
    }

    run(query) {
        try {
            this.db.run(query);
            this._write();
            return true;
        } catch (err) {
            if (err.message === 'UNIQUE constraint failed: commands.name') return Logger.absurd('ERR in addCommand:: Command already exists.');
            if (err.message === 'UNIQUE constraint failed: settings.key') return Logger.absurd('ERR in addCommand:: Setting already exists.');
            Logger.error(err);
            return false;
        }
    }

    select(query) {
        try {
            return this.db.exec(query);
        } catch (err) {
            Logger.error(err);
            return false;
        }
    }
}

/** PUBLIC FUNCTIONS **/

Store.prototype.put = function (table, data, options, callback) {
    if (arguments.length > 3) {
        if (typeof(options) === 'function') {
            callback = options;
            options = {
                conflict: ' '
            };
        }
    } else {
        options = {
            conflict: ' '
        }
    }
    let conflict = (options.conflict !== ' ') ? this._getConflictString(options.conflict) : ' ';

    const keys = [];
    const values = [];
    for (let key in data) {
        if (!data.hasOwnProperty(key)) { continue; }
        keys.push(key);
        values.push(data[key]);
    }

    const queryString = `INSERT${conflict}INTO ${table} (${keys.join(',')}) VALUES ('${values.join("','")}');`;
    this.sql = queryString;

    if (callback) {
        let _err, _res;
        try {
            _res = this.run(queryString);
        } catch (err) {
            _err = err;
        }
        callback(_err, _res);
        return this;
    } else {
        let _res;
        try {
            _res = this.run(queryString);
        } catch (err) {
            if (this.debug) {
                throw err;
            }
            return null;
        }
        return _res;
    }
};

/**
 *
 * @param {string} table
 * @param {string|array} what
 * @param {object} where
 * @param {object} order
 * @param {string} limit
 * @returns {*}
 */
Store.prototype.get = function (table, what, where = null, order = null, limit = null) {
    if (!Array.isArray(what)) {
        what = what.split(', ');
        if (what.length < 1) what = ' * ';
    }
    const location = [];
    if (where) {
        for (let key in where) {
            if (!where.hasOwnProperty(key)) { continue; }
            if (typeof where[key] !== null && typeof where[key] === 'object') {
                for (let rule in where[key]) {
                    if (!where[key].hasOwnProperty(rule)) { continue; }
                    let operand = where[key][rule];
                    // console.log(rule, operand);
                    switch (rule) {
                        case 'gt':
                            location.push(`${key} > ${operand}`);
                            break;
                        case 'lt':
                            location.push(`${key} < ${operand}`);
                            break;
                        case 'gte':
                            location.push(`${key} >= ${operand}`);
                            break;
                        case 'lte':
                            location.push(`${key} <= ${operand}`);
                            break;
                        case 'not':
                            location.push(`${key} != '${operand}'`);
                            break;
                    }
                }
            } else {
                location.push(`${key} = '${where[key]}'`);
            }
        }
    }
    let orderString = '';
    if (order) {
        for (let key in order) {
            orderString = ` ORDER BY ${order[key]} ${key.toUpperCase()}`;
        }
    }

    let limitString = '';
    if (limit && typeof limit === 'string') {
        /**
         * 'limit' should be a string in one of two formats:
         * '[count]' to impose only a limit
         * '[offset], [count]' to impose a limit along with an offset (skip count)
         */
        limitString = ` LIMIT ${limit}`;
    }

    const queryString = `SELECT ${what.join(', ')} FROM ${table} ${(where) ? 'WHERE' : ''} ${location.join(' AND ')}${orderString}${limitString}`;
    this.sql = queryString;

    try {
        const contents = this.db.exec(queryString);
        if (contents.length) {
            const columns = contents[0].columns;
            const values = contents[0].values;
            const results = [];
            for (let i = 0; i < values.length; i++) {
                let line = {};
                for (let j = 0; j < columns.length; j++) {
                    line[columns[j]] = values[i][j];
                }
                results.push(line);
            }
            return results;
        } else {
            return null;
        }
    } catch (err) {
        if (this.debug) {
            throw err;
        }
        return null;
    }
};

Store.prototype.getValue = function (table, what, where) {
    const location = [];
    if (where) {
        for (let key in where) {
            if (!where.hasOwnProperty(key)) { continue; }
            location.push(`${key} = '${where[key]}'`);
        }
    }

    const queryString = `SELECT ${what} FROM ${table}${(where) ? ' WHERE ' : ''}${location.join(' AND ')}`;
    this.sql = queryString;

    try {
        const contents = this.db.exec(queryString);
        if (contents.length) {
            const columns = contents[0].columns;
            const values = contents[0].values;
            const results = [];
            for (let i = 0; i < values.length; i++) {
                const line = {};
                for (let j = 0; j < columns.length; j++) {
                    line[columns[j]] = values[i][j];
                }
                results.push(line);
            }
            return results[0][what];
        } else {
            return null;
        }
    } catch (err) {
        if (this.debug) {
            throw err;
        }
        return null;
    }
};

Store.prototype.del = function (table, where, callback) {
    const location = [];
    if (typeof(where) === 'function') {
        callback = where;
        where = [];
    }

    if (where) {
        for (let key in where) {
            if (!where.hasOwnProperty(key)) { continue; }
            location.push(`${key} = '${where[key]}'`);
        }
    }

    const queryString = `DELETE FROM ${table}${(where) ? ' WHERE ' : ''}${location.join(' AND ')}`;
    this.sql = queryString;

    if (callback) {
        let _err, _res;
        try {
            _res = this._delete(queryString);
        } catch (err) {
            _err = err;
        }
        callback(_err, _res);
        return this;
    } else {
        let _res;
        try {
            _res = this._delete(queryString);
        } catch (err) {
            if (this.debug) {
                throw err;
            }
            return null;
        }
        return _res;
    }
};

Store.prototype.update = function (table, data, where, options, callback) {
    if (arguments.length > 3) {
        if (typeof(options) === 'function') {
            callback = options;
            options = {
                conflict: ' '
            };
        }
    } else {
        options = {
            conflict: ' '
        }
    }
    let conflict = (options.conflict !== ' ') ? this._getConflictString(options.conflict) : ' ';

    const sets = [];
    const location = [];
    for (let key in data) {
        if (!data.hasOwnProperty(key)) { continue; }
        sets.push(`${key} = '${data[key]}'`);
    }
    for (let key in where) {
        if (!where.hasOwnProperty(key)) { continue; }
        location.push(`${key} = '${where[key]}'`);
    }

    const queryString = `UPDATE${conflict}${table} SET ${sets.join(', ')}${(location.length > 0 ? ' WHERE ' + location.join(' AND ') : '')}`;
    this.sql = queryString;

    if (callback) {
        let _err, _res;
        try {
            _res = this.run(queryString);
        } catch (err) {
            _err = err;
        }
        callback(_err, _res);
        return this;
    } else {
        let _res;
        try {
            _res = this.run(queryString);
        } catch (err) {
            if (this.debug) {
                throw err;
            }
            return null;
        }
        return _res;
    }
};

/** PRIVATE FUNCTIONS **/

Store.prototype._delete = function (query, location) {
    if (location) {
        for (let i = 0; i < location.length; i++) {
            query = query.replace('?', location[i]);
        }
    }

    this.sql = query;

    try {
        this.db.exec(query);
        this._write();
        return this.db.getRowsModified();
    } catch (err) {
        if (this.debug) {
            throw err;
        }
        return null;
    }
};

Store.prototype._update = function (query, data) {
    if (data) {
        for (let i = 0; i < data.length; i++) {
            query = query.replace('?', `'${data[i]}'`);
        }
    }

    this.sql = query;

    try {
        this.db.run(query);
        this._write();
        return this.db.getRowsModified();
    } catch (err) {
        if (this.debug) {
            throw err;
        }
        return null;
    }
};

Store.prototype._getConflictString = function (conflict) {
    let conflictString = ' ';
    switch (conflict) {
        case 'replace':
            conflictString = ' OR REPLACE ';
            break;
        case 'ignore':
            conflictString = ' OR IGNORE ';
            break;
        case 'update':
            conflictString = ' OR UPDATE ';
            break;
        case 'fail':
            conflictString = ' OR FAIL ';
            break;
        case 'rollback':
            conflictString = ' OR ROLLBACK ';
            break;
        default:
            conflictString = ' ';
            break;
    }
    return conflictString;
};
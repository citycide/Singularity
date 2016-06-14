import jetpack from 'fs-jetpack';
import SQL from 'sql.js';

export default class Trilogy {
    constructor(fileName, options = {}) {
        if (!fileName) throw new Error('Trilogy constructors must be provided a file path.');
        this.fileName = fileName;
        this.db = null;
        this.debug = options.debug || false;
        this._init();
    }

    _init() {
        try {
            const file = jetpack.read(this.fileName, 'buffer');
            this.db = new SQL.Database(file);
        } catch (err) {
            if (this.debug) {
                throw err;
            }
            this.db = new SQL.Database();
            this._write();
        }
    }

    _write() {
        try {
            const data = this.db.export();
            const buffer = new Buffer(data);
            jetpack.write(this.fileName, buffer);
        } catch (err) {
            if (this.debug) {
                throw err;
            }
        }
    }

    run(query) {
        try {
            this.db.run(query);
            this._write();
        } catch (err) {
            if (this.debug) {
                throw err;
            }
        }
    }

    select(query) {
        try {
            return this.db.exec(query);
        } catch (err) {
            if (this.debug) {
                throw err;
            }
        }
    }
}

/** PUBLIC FUNCTIONS **/

/**
 * Add a table to the database
 * @param {string} table
 * @param {Array} args
 * @param {boolean} ifNotExists
 * @param {function} callback
 * @returns {*}
 */
Trilogy.prototype.create = function(table, args, ifNotExists = true, callback = () => {}) {
    let query = [];
    let hasUnique = false;
    let hasPrimary = false;

    for (let key of args) {
        let keyString = [];
        let hasNotNull = false;

        if (key != null && typeof key === 'object') {
            if (!key.name) {
                if (this.debug) throw new TypeError();
                return;
            }

            let opts = Object.assign({}, this._defaultTableKeys, key);

            keyString.push(opts.name);
            keyString.push(opts.type.toUpperCase());

            if (opts.hasOwnProperty('primaryKey') && !hasPrimary) {
                hasPrimary = true;
                if (opts.primaryKey !== undefined) keyString.push('PRIMARY KEY');
            }

            if (opts.hasOwnProperty('notNull')) {
                hasNotNull = true;
                if (opts.notNull !== undefined) keyString.push('NOT NULL');
            }

            if (opts.hasOwnProperty('defaultValue')) {
                if (opts.defaultValue !== undefined) keyString.push(`DEFAULT ${key.defaultValue}`);
            }

            if (!hasUnique && opts.hasOwnProperty('unique')) {
                hasUnique = true;
                if (opts.unique !== undefined) keyString.push('UNIQUE');
            }

            query.push(keyString.join(' '));
        } else {
            keyString.push(`${key} TEXT`);
            query.push(keyString.join(' '));
        }
    }

    let columnString = query.join(', ');
    let queryString = (!ifNotExists)
        ? `CREATE TABLE ${table} (${columnString});`
        : `CREATE TABLE IF NOT EXISTS ${table} (${columnString});`;

    let _err, _res;
    try {
        _res = this.run(queryString);
    } catch (err) {
        if (this.debug) {
            throw err;
        }
        _err = err;
    }
    callback(_err, _res);

    return this;
};

/**
 * Insert values to the specified table
 * @param {string} table
 * @param {object} data
 * @param {object} options
 * @param {function} callback
 * @returns {Trilogy}
 */
Trilogy.prototype.put = function(table, data, options = { conflict: ' ' }, callback = () => {}) {
    let conflictString = (options.conflict !== ' ')
        ? this._getConflictString(options.conflict)
        : ' ';

    const keys = [];
    const values = [];

    for (let key in data) {
        if (!data.hasOwnProperty(key)) continue;
        keys.push(key);
        values.push(data[key]);
    }

    const queryString = `INSERT${conflictString}INTO ${table} (${keys.join(',')}) VALUES ('${values.join("','")}');`;
    this.sql = queryString;

    let _err, _res;
    try {
        _res = this.run(queryString);
    } catch (err) {
        if (this.debug) {
            throw err;
        }
        _err = err;
    }
    callback(_err, _res);

    return this;
};

/**
 * Retrieve all values meeting the criteria from the specified table
 * @param {string} table
 * @param {string|Array} what
 * @param {object} where
 * @param {object} order
 * @param {string} limit
 * @returns {*}
 */
Trilogy.prototype.get = function(table, what = '', where, order, limit) {
    if (!what) {
        if (this.debug) {
            throw new TypeError(`Trilogy#get :: 'what' parameter is required.`);
        }
        return;
    }

    let selectArray = null;
    let selectString = '*';
    if (!Array.isArray(what)) {
        if (typeof what === 'string' && what.length > 0) selectArray = what.split(', ');
    } else {
        selectString = what.join(', ');
    }

    if (selectArray) selectString = selectArray.join(', ');

    let location = [];
    if (where) {
        for (let key in where) {
            if (!where.hasOwnProperty(key)) continue;
            if (where[key] != null && typeof where[key] === 'object') {
                for (let rule in where[key]) {
                    if (!where[key].hasOwnProperty(rule)) continue;

                    let operand = where[key][rule];

                    let operandString = this._getOperandString(rule, key, operand);
                    if (operandString) {
                        location.push(operandString);
                    } else {
                        location.push(`${key} = '${where[key]}'`);
                    }
                }
            } else {
                location.push(`${key} = '${where[key]}'`);
            }
        }
    }
    let locationString = location.join(' AND ');

    let orderString = '';
    if (order) {
        for (let key in order) {
            if (!order.hasOwnProperty(key)) continue;
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

    const queryString = `SELECT ${selectString} FROM ${table} ${(where) ? 'WHERE' : ''} ${locationString}${orderString}${limitString}`;
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

/**
 * Retrieve the first value meeting the criteria from the specified table
 * @param {string} table
 * @param {string} what
 * @param {object} where
 * @returns {*}
 */
Trilogy.prototype.getValue = function(table, what, where) {
    const location = [];

    if (!table || !what) {
        if (this.debug) {
            throw new TypeError(`Trilogy#getValue :: 'table' & 'what' parameters are required.`);
        }
        return;
    }

    if (where) {
        for (let key in where) {
            if (!where.hasOwnProperty(key)) continue;
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
            return undefined;
        }
    } catch (err) {
        if (this.debug) {
            throw err;
        }
        return null;
    }
};

/**
 * Delete data from the specified table
 * @param {string} table
 * @param {object} where
 * @param {function} callback
 * @returns {*}
 */
Trilogy.prototype.del = function(table, where, callback = () => {}) {
    const location = [];

    if (!table || !where) {
        if (this.debug) {
            throw new TypeError(`Trilogy#del :: 'table' & 'where' parameters are required.`);
        }
        return;
    }

    if (where) {
        for (let key in where) {
            if (!where.hasOwnProperty(key)) continue;
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

/**
 * Update the specified table
 * @param {string} table
 * @param {object} data
 * @param {object} where
 * @param {object} options
 * @param {function} callback
 * @returns {*}
 */
Trilogy.prototype.update = function(table, data, where, options = { conflict: ' ' }, callback = () => {}) {
    if (!table || !data || !where) {
        if (this.debug) {
            throw new TypeError(`Trilogy#del :: 'table', 'data', & 'where' parameters are required.`);
        }
        return;
    }

    let conflictString = (options.conflict !== ' ')
        ? this._getConflictString(options.conflict)
        : ' ';

    const sets = [];
    for (let key in data) {
        if (!data.hasOwnProperty(key)) continue;
        sets.push(`${key} = '${data[key]}'`);
    }
    const setString = sets.join(', ');

    const location = [];
    for (let key in where) {
        if (!where.hasOwnProperty(key)) continue;
        location.push(`${key} = '${where[key]}'`);
    }
    const locationString = (location.length > 0)
        ? ' WHERE ' + location.join(' AND ')
        : '';

    const queryString = `UPDATE${conflictString}${table} SET ${setString} ${locationString}`;
    this.sql = queryString;

    let _err, _res;
    try {
        _res = this.run(queryString);
    } catch (err) {
        if (this.debug) {
            throw err;
        }
        _err = err;
    }
    callback(_err, _res);

    return this;
};

/** PRIVATE FUNCTIONS **/

/**
 * Run a prebuilt deletion query
 * @param {string} query - optionally parameterized query string
 * @param {Array} location - parameters for query replacement
 * @returns {Number} number of rows modified
 * @private
 */
Trilogy.prototype._delete = function(query, location) {
    if (location) {
        for (let key of location) {
            query = query.replace('?', location[key]);
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

/**
 * Run a prebuilt update query
 * @param {string} query - optionally parameterized query string
 * @param {Array} data - parameters for query replacement
 * @returns {Number} number of rows modified
 * @private
 */
Trilogy.prototype._update = function(query, data) {
    if (data) {
        for (let key of data) {
            query = query.replace('?', `'${data[key]}'`);
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

/**
 * Build an 'on conflict' clause query component
 * @param {string} conflict - the type of query to build
 * @returns {string} query component
 * @private
 */
Trilogy.prototype._getConflictString = function(conflict) {
    let conflictString = ' ';
    switch (conflict) {
        case 'replace':
            conflictString = ' OR REPLACE ';
            break;
        case 'ignore':
            conflictString = ' OR IGNORE ';
            break;
        case 'abort':
            conflictString = ' OR ABORT ';
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

/**
 * Build a rule string for 'where' clauses
 * @param {string} rule
 * @param {string} key
 * @param {string|Number} operand
 * @returns {string} query component
 * @private
 */
Trilogy.prototype._getOperandString = function(rule, key, operand) {
    let operandString = '';
    switch (rule) {
        case 'gt':
            operandString = `${key} > ${operand}`;
            break;
        case 'lt':
            operandString = `${key} < ${operand}`;
            break;
        case 'gte':
            operandString = `${key} >= ${operand}`;
            break;
        case 'lte':
            operandString = `${key} <= ${operand}`;
            break;
        case 'not':
            operandString = `${key} != '${operand}'`;
            break;
    }
    return operandString;
};

/**
 * Default options for table creation
 * @type {object}
 *      @property {string} name - this is required when creating tables so is not set here
 *      @property {boolean} primaryKey - whether the column is set as the primary key
 *      @property {boolean} unique - whether the column is flagged as unique
 *      @property {boolean} notNull - whether the column can be null or not
 *      @property {boolean|*} defaultValue - if false, no default value; otherwise sets a default
 *
 *      @TODO: change default value to undefined? null? instead to allow false as a default
 * @private
 */
Trilogy.prototype._defaultTableKeys = {
    // name: '',
    type: 'TEXT',
    primaryKey: undefined,
    unique: undefined,
    notNull: undefined,
    defaultValue: undefined
};

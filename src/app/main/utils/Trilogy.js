import jetpack from 'fs-jetpack';
import SQL from 'sql.js';

export default class Trilogy {
    constructor(fileName, options = {}) {
        if (!fileName) throw new Error('Trilogy constructors must be provided a file path.');
        this.fileName = fileName;
        this.db = null;
        this.debug = options.debug || false;
        this.errorListener = typeof options.errorListener === 'function'
            ? options.errorListener
            : null;
        this._init();
    }

    _init() {
        try {
            const file = jetpack.read(this.fileName, 'buffer');
            this.db = new SQL.Database(file);
        } catch (err) {
            this._errorHandler(err);
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
            this._errorHandler(err);
        }
    }

    run(query) {
        try {
            this.db.run(query);
            this._write();
        } catch (err) {
            this._errorHandler(err);
        }
    }

    select(query) {
        try {
            return this.db.exec(query);
        } catch (err) {
            this._errorHandler(err);
        }
    }
}

/** PUBLIC FUNCTIONS **/

/**
 * Add a table to the database
 * @param {string} table
 * @param {Array} columns
 * @param {object} options
 * @param {function} callback
 * @returns {*}
 */
Trilogy.prototype.create = function(table, columns, options = {}, callback = () => {}) {
    let query = [];
    let hasUnique = false;
    let hasPrimary = options.compositeKey ? true : false;
    options.ifNotExists = options.hasOwnProperty('ifNotExists') ? options.ifNotExists : true;

    for (let key of columns) {
        let keyString = [];
        let hasAutoIncr = false;

        if (key != null && typeof key === 'object') {
            if (!key.name) {
                if (this.debug) throw new TypeError(`Trilogy#create :: Column names are required.`);
                return;
            }

            let opts = Object.assign({}, this._defaultTableKeys, key);

            keyString.push(opts.name);
            keyString.push(opts.type.toUpperCase());

            if (!hasPrimary && opts.primaryKey !== undefined) {
                hasPrimary = true;
                keyString.push('PRIMARY KEY');

                if (opts.type.toUpperCase() === 'INTEGER') {
                    if (!hasAutoIncr && opts.autoIncrement !== undefined) {
                        hasAutoIncr = true;
                        keyString.push('AUTOINCREMENT');
                    }
                }
            }

            if (opts.notNull !== undefined) {
                keyString.push('NOT NULL');
            }

            if (opts.defaultValue !== undefined) keyString.push(`DEFAULT ${key.defaultValue}`);

            if (!hasUnique && opts.unique !== undefined) {
                hasUnique = true;
                keyString.push('UNIQUE');
            }

            query.push(keyString.join(' '));
        } else {
            keyString.push(`${key} TEXT`);
            query.push(keyString.join(' '));
        }
    }

    let primaryKeyString = options.compositeKey
        ? `, PRIMARY KEY (${options.compositeKey.join(', ')})`
        : '';

    let columnString = query.join(', ');
    let queryString = (!options.ifNotExists)
        ? `CREATE TABLE ${table} (${columnString}${primaryKeyString});`
        : `CREATE TABLE IF NOT EXISTS ${table} (${columnString}${primaryKeyString});`;

    let _err, _res;
    try {
        _res = this.run(queryString);
    } catch (err) {
        this._errorHandler(err);
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
        let value = data[key];
        if (typeof value === 'string' && value.match(/'/g)) {
            value = value.replace(/'/g, `''`);
        }
        values.push(value);
    }

    const queryString = `INSERT${conflictString}INTO ${table} (${keys.join(',')}) VALUES ('${values.join("','")}');`;
    this.sql = queryString;

    let _err, _res;
    try {
        _res = this.run(queryString);
    } catch (err) {
        this._errorHandler(err);
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
 * @param {object} [order]
 * @param {string} [limit]
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
            if (key === 'random' && order.random === true) {
                orderString = ` ORDER BY RANDOM()`;
                continue;
            }
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
                    let lineValue = values[i][j];
                    if (typeof lineValue === 'string' && lineValue.match(/('){2}/g)) {
                        lineValue = lineValue.replace(/('){2}/g, `'`);
                    }
                    line[columns[j]] = lineValue;
                }
                results.push(line);
            }
            return results;
        } else {
            return null;
        }
    } catch (err) {
        this._errorHandler(err);
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
    if (!table || !what) {
        if (this.debug) {
            throw new TypeError(`Trilogy#getValue :: 'table' & 'what' parameters are required.`);
        }
        return;
    }

    if (typeof what !== 'string') {
        if (this.debug) {
            throw new TypeError(`Trilogy#getValue :: 'what' parameter must be of type 'string'.`);
        }
        return;
    }

    const location = [];

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
                    let lineValue = values[i][j];
                    if (typeof lineValue === 'string' && lineValue.match(/('){2}/g)) {
                        lineValue = lineValue.replace(/('){2}/g, `'`);
                    }
                    line[columns[j]] = lineValue;
                }
                results.push(line);
            }
            return results[0][what];
        } else {
            return undefined;
        }
    } catch (err) {
        this._errorHandler(err);
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

    // eslint-disable-next-line
    if (where && typeof where != null && typeof where === 'object') {
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
            this._errorHandler(err);
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
        let value = data[key];
        if (typeof value === 'string' && value.match(/'/g)) {
            value = value.replace(/'/g, `''`);
        }
        sets.push(`${key} = '${value}'`);
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
        this._errorHandler(err);
        _err = err;
    }
    callback(_err, _res);

    return this;
};

Trilogy.prototype.count = function(table, what, where, options = {}) {
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

    let distinct = options.distinct ? 'DISTINCT ' : '';

    const queryString = `SELECT COUNT(${distinct}${selectString}) AS count FROM ${table} ${(where) ? 'WHERE' : ''} ${locationString}`;
    this.sql = queryString;

    try {
        const statement = this.db.prepare(queryString);
        const result = statement.getAsObject({});
        // eslint-disable-next-line
        if (typeof result != null && typeof result === 'object') {
            return result.count;
        } else {
            return null;
        }
    } catch (err) {
        this._errorHandler(err);
        return null;
    }
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
        this._errorHandler(err);
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
        this._errorHandler(err);
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
    autoIncrement: undefined,
    primaryKey: undefined,
    unique: undefined,
    notNull: undefined,
    defaultValue: undefined
};

Trilogy.prototype._errorHandler = function(err) {
    if (!this.debug) return;

    if (this.errorListener) {
        this.errorListener(err);
    } else {
        throw err;
    }
};

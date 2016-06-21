import _ from 'lodash';

export default {
    /**
     * String functions {string}
     */

    str: {
        /**
         * Check if a string is numeric
         * @param {string} value
         * @returns {boolean}
         */
        isNumeric(value) {
            if (_.isFinite(value)) return true;
            if (!_.isString(value)) return false;
            return (/^((?:\d+)?\.?(?:\d+)?)$/).test(value);
        },
        /**
         * Check if a string is either of 'true' or 'false'
         * @param {string} value
         * @returns {boolean}
         */
        isBoolean(value) {
            return (value === 'true' || value === 'false');
        }
    },

    /**
     * Number functions {number}
     */

    num: {
        isFinite: _.isFinite,
        random: _.random
    },

    /**
     * Array functions {Array}
     */

    arr: {
        random: _.sample,
        shuffle: _.shuffle
    },

    /**
     * General value functions {*}
     */

    /**
     * Coerce a value to a number if possible, else return 0
     * @param {*} value
     * @param {boolean} round - rounds to an integer if true
     * @returns {number}
     */
    toNumber(value, round) {
        if (round) return _.toInteger(value);
        return _.toFinite(value);
    },
    /**
     * Check if a value is null or undefined
     * @param {*} value
     * @returns {boolean} 'true' if value is null or undefined
     */
    isNil: _.isNil,
    /**
     * Check if a value is a plain object
     * @param {*} value
     * @returns {boolean} 'true' if value is an object
     */
    isObject: _.isPlainObject
};

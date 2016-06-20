import _ from 'lodash';

export default {
    str: {
        /**
         * Check if a string is a whole number
         * @param {string} value
         * @returns {boolean}
         * @reference http://stackoverflow.com/a/24457420
         */
        isNumeric(value) {
            return (/^\d+$/).test(value);
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
    num: {
        /**
         * Coerce a value to a number if possible
         * @param {*} value
         * @returns {number|null} 'number' if parsed, else null
         */
        validate(value) {
            if (!isNaN(parseInt(value))) {
                return parseInt(value);
            } else {
                return null;
            }
        },
        isFinite: _.isFinite,
        random: _.random
    },
    arr: {
        random: _.sample,
        shuffle: _.shuffle
    },
    val: {
        /**
         * Check if a value is null or undefined
         * @param {*} value
         * @returns {boolean} 'true' if value is null or undefined
         */
        isNullLike(value) {
            return value == null;
        }
    }
};

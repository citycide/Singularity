export default {
    str: {
        /**
         * Check if a string is a whole number
         * @param {string} value
         * @returns {boolean}
         * @reference http://stackoverflow.com/a/24457420
         */
        isNumeric(value) {
            return /^\d+$/.test(value);
        }
    },
    num: {
        /**
         * Coerce a value to a number if possible, or else null
         * @param {*} value
         * @returns {number}
         */
        validate(value) {
            if (!isNaN(parseInt(value))) {
                return parseInt(value);
            } else {
                return null;
            }
        }
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
}

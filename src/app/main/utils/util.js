export default {
    /**
     * Check if a string is a whole number
     * @param value
     * @returns {boolean}
     * @reference http://stackoverflow.com/a/24457420
     */
    str: {
        isNumeric(value) {
            return /^\d+$/.test(value);
        }
    },
    num: {
        validate(value) {
            if (!isNaN(parseInt(value))) {
                return parseInt(value);
            } else {
                return null;
            }
        }
    }
}
export default {
    /**
     * Check if a string is a whole number
     * @param value
     * @returns {boolean}
     * @reference http://stackoverflow.com/a/24457420
     */
    isNumeric: (value) => {
        return /^\d+$/.test(value);
    }
}
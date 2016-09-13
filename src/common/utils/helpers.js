import _ from 'lodash'

export const str = {
  /**
   * Check if a string is numeric
   * @param {string} value
   * @returns {boolean}
   */
  isNumeric (value) {
    if (_.isFinite(value)) return true
    if (!_.isString(value)) return false
    return (/^((?:\d+)?\.?(?:\d+)?)$/).test(value)
  },

  /**
   * Check if a string is either of 'true' or 'false'
   * @param {string} value
   * @returns {boolean}
   */
  isBoolean (value) {
    return (value === 'true' || value === 'false')
  }
}

export const val = {
  /**
   * Coerce a value to a number if possible, else return 0
   * @param {*} value
   * @param {boolean} [round] - rounds to an integer if true
   * @returns {number}
   */
  toNumber (value, round) {
    return round ? _.toInteger(value) : _.toFinite(value)
  }
}

export async function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default {
  str,
  val,
  num: {
    random: _.random
  },
  sleep
}

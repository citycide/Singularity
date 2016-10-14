import _ from 'lodash'

export function is (value, compare) {
  return _.isEqual(value, compare)
}

export function to (value) {
  return _.toString(value)
}

Object.assign(is, {
  string: _.isString,
  number: isNumber,
  finite: _.isFinite,
  object: _.isPlainObject,
  array: _.isArray,
  boolean: _.isBoolean,
  nil: _.isNil,
  empty: _.isEmpty,
  numeric: isNumeric,
  inRange: _.inRange,
  lt: _.lt,
  lte: _.lte,
  gt: _.gt,
  gte: _.gte,
  oneOf: _.includes
})

Object.assign(to, {
  number: toNumber,
  clamp: _.clamp,
  random: toRandom,
  string: _.toString,
  range: _.range,
  boolean: toBoolean
})

function isNumber (value, rounded = true) {
  return rounded ? _.isSafeInteger(value) : _.isFinite(value)
}

function isNumeric (value) {
  if (_.isFinite(value)) return true
  if (!_.isString(value)) return false
  return (/^((?:\d+)?\.?(?:\d+)?)$/).test(value)
}

function toRandom (value, upper) {
  if (_.isPlainObject(value) || _.isArray(value)) {
    return _.sample(value)
  } else {
    return _.random(value, upper)
  }
}

function toBoolean (value) {
  if (!value) return false
  if (value === true || value === false) return value
  return value === 'true'
}

function toNumber (value, round = true) {
  return round ? _.toSafeInteger(value) : _.toFinite(value)
}

export async function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default {
  is,
  to,
  sleep
}

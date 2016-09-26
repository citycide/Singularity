import moment from 'moment'
import path from 'path'

const log = function (file, data) {
  $.file.write(file, `${moment().format('LTS L')} :: ${data}`, true)
}

log.level = 1

log.clear = function (file) {
  if (!$.file.exists(file)) return

  $.file.write(file, '')
}

log.getLevel = function () {
  return log.level
}

log.setLevel = function (level) {
  level = parseInt(level)
  if (typeof level !== 'number') return
  log.level = level
}

const logTypes = {
  error: 0,
  event: 1,
  debug: 2,
  trace: 3
}

;(function () {
  for (let type of Object.keys(logTypes)) {
    // eslint-disable-next-line
    log[type] = function (file, data) {
      if (log.getLevel() < logTypes[type]) return

      const traced = captureStack()[1]
      const fileName = path.basename(traced.getFileName())
      const lineNum = traced.getLineNumber()
      const colNum = traced.getColumnNumber()

      const outPath = `${type}/${file}`
      $.file.write(outPath, `${moment()
      .format('LTS L')} :: ${fileName} (${lineNum}, ${colNum}) -> ${data}`, true)
    }
  }
})()

function captureStack () {
  const _ = Error.prepareStackTrace
  Error.prepareStackTrace = function (_, stack) {
    return stack
  }
  const stack = new Error().stack.slice(1)
  Error.prepareStackTrace = _
  return stack
}

export default log

$.log = log

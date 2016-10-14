import path from 'path'
import moment from 'moment'
import { each } from 'lodash'
import callsites from 'callsites'
import appLog from 'common/utils/logger'

const logTypes = {
  error: 0,
  event: 1,
  debug: 2,
  trace: 3
}

const log = function (file, data) {
  const line = `${moment().format('LTS L')} :: ${data}`
  $.file.write(file, line, true)
  appLog.bot(line)
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
  if (typeof level !== 'number') {
    level = logTypes[level] || 1
  }
  log.level = level
}

Object.keys(logTypes).map(type => {
  log[type] = function (file, data) {
    if (log.getLevel() < logTypes[type]) return

    const traced = callsites()[1]
    const fileName = path.basename(traced.getFileName())
    const lineNum = traced.getLineNumber()
    const colNum = traced.getColumnNumber()

    const outPath = `${type}/${file}`
    const time = moment().format('LTS L')
    const line = `${time} :: ${fileName} (${lineNum}, ${colNum}) -> ${data}`
    $.file.write(outPath, line, true)
    appLog.bot(line)
  }
}

export default log

$.log = log

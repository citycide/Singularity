import path from 'path'
import strat from 'strat'
import moment from 'moment'
import callsites from 'callsites'
import { log as appLog } from '../ipc-bridge'

const logLine = strat(
  '{time} :: {dirName}/{fileName} ({lineNum}, {colNum}) -> {data}'
)

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

    const meta = {}
    meta.dirName = path.basename(path.dirname(traced.getFileName()))
    meta.logName = file || meta.dirName
    meta.fileName = path.basename(traced.getFileName())
    meta.lineNum = traced.getLineNumber()
    meta.colNum = traced.getColumnNumber()
    meta.time = moment().format('LTS L')
    meta.data = data

    const outPath = `${type}/${meta.logName}`
    $.file.write(outPath, logLine(meta), true)
    appLog.bot(logLine(meta))
  }
})

export default log

$.log = log

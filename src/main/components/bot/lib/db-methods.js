import log from 'common/utils/logger'
import { botDB } from 'common/components/db'
import { is } from 'common/utils/helpers'

async function dbExists (table, where) {
  return is.object(await botDB.getRow(table, where))
}

async function getExtConfig (ext, key, defaultValue) {
  return botDB.get('extension_settings', 'value', {
    key, extension: ext
  }, defaultValue)
}

async function setExtConfig (ext, key, value) {
  return botDB.set('extension_settings', { value }, {
    key, extension: ext
  })
}

async function addTable (name, keyed) {
  if (await botDB.tableExists(name)) return
  if (!name || !is.string(name)) {
    log.bot(
      `ERR in core#addTable:: Expected parameter 'name' to be a string, received ${typeof name}`
    )
    return
  }

  const columns = keyed
    ? [{ name: 'id', type: 'integer', primary: true, increments: true }, 'value', 'info']
    : ['key', 'value', 'info']

  await botDB.addTable(name, columns)
}

async function addTableCustom (name, columns) {
  if (await botDB.tableExists(name)) return
  if (arguments.length < 2 || is.string(name) || !is.array(columns)) {
    log.bot(`ERR in core#addTableCustom:: wrong arguments.`)
    return
  }

  await botDB.addTable(name, columns)
}

export default function () {
  return {
    settings: {
      get: botDB.getConfig,
      set: botDB.setConfig,
      confirm: botDB.confirmConfig
    },

    db: {
      get: botDB.get,
      set: botDB.set,
      del: botDB.del,
      confirm: botDB.confirm,
      incr: botDB.incr,
      decr: botDB.decr,
      getRow: botDB.getRow,
      getRandomRow: botDB.getRandomRow,
      countRows: botDB.countRows,
      exists: dbExists,
      getExtConfig,
      setExtConfig,
      addTable,
      addTableCustom
    }
  }
}

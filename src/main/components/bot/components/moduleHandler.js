import path from 'path'
import Levers from 'levers'
import chokidar from 'chokidar'
import jetpack from 'fs-jetpack'
import { argv } from 'yargs'

import log from 'common/utils/logger'

const settings = new Levers('app')

const files = new Map()
const MODULE_PATH = path.resolve(__dirname, '..', 'modules')
const isCoreModule = _path => _path.startsWith(MODULE_PATH)
const getModuleType = _module => isCoreModule(_module) ? 'core' : 'user'
const makeRelPath = _path => `./modules${_path.replace(MODULE_PATH, '').replace(/\\/g, '/')}`

function load (_module) {
  if (!files.has(_module)) {
    const moduleType = getModuleType(_module)
    files.set(_module, moduleType)

    const modulePath = moduleType === 'core' ? makeRelPath(_module) : _module
    log.debug(`Module loaded (${moduleType}):: ${modulePath}`)
  }

  return require(_module)
}

function reload (_module) {
  if (!require.cache[_module]) {
    if (!files.has(_module)) {
      const moduleType = getModuleType(_module)
      files.set(_module, moduleType)
    }

    return require(_module)
  }

  const _temp = require.cache[_module]
  delete require.cache[_module]
  const fresh = require(_module)
  require.cache[_module] = _temp
  log.debug(`Module reloaded:: ${isCoreModule(_module) ? makeRelPath(_module) : _module}`)

  return fresh
}

function unload (_module, options = {}) {
  if (!options.all) {
    if (files.has(_module)) {
      if (!argv.dev) {
        files.delete(_module)
        const moduleType = getModuleType(_module)
        const modulePath = moduleType === 'core' ? makeRelPath(_module) : _module
        log.debug(`Module unloaded (${moduleType}):: ${modulePath}`)
      }
    }

    delete require.cache[_module]
  } else {
    for (let [k, v] of files.entries()) {
      delete require.cache[k]
      switch (v) {
        case 'core':
          log.debug(`Module unloaded (core):: ${makeRelPath(k)}`)
          break
        case 'user':
          log.debug(`Module unloaded (user):: ${k}`)
          break
      }
    }

    files.clear()
  }
}

export default {
  load,
  reload,
  unload,
  userModules,

  watcher: {
    daemon: null,

    start () {
      if (this.daemon) return

      this.daemon = chokidar.watch([
        `${MODULE_PATH}/**/*.js`,
        `${settings.get('userModulePath')}/**/*.js`
      ], {
        ignorePermissionErrors: true
      })

      this.listen()
    },

    stop () {
      if (!this.daemon) return

      this.daemon.close()
      this.daemon = null
    },

    listen () {
      if (!this.daemon) return

      this.daemon
          .on('ready', () => {})
          .on('error', e => log.error(`ERR in module watcher:: `, e.message))
          .on('add', _path => load(_path))
          .on('change', _path => reload(_path))
          .on('unlink', _path => unload(_path))
    }
  }
}

function userModules () {
  try {
    jetpack.dir(settings.get('userModulePath'))
  } catch (e) {
    if (e.message.substr(0, 31) === 'Destination path already exists') {
      log.trace('User module directory already in place')
    } else {
      log.error(e)
    }
  }
}

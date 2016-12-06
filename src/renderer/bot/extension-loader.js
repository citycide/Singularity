import _ from 'lodash'
import Levers from 'levers'
import { read, find, exists, dir } from 'fs-jetpack'
import { valid, satisfies } from 'semver'
import { resolve, dirname } from 'path'
import { remote } from 'electron'

import { log } from './ipc-bridge'
import InterfaceExtender from './interface-extender'
import './compile-require'

const settings = new Levers('app')
const ext = new Levers('ext')
const extRegistry = {}

function registerAll () {
  const matchOpts = { matching: 'ext.json' }
  const internal = resolve(__dirname, 'extensions')
  const external = getExtensionPath()

  ;[]
    .concat(find(internal, matchOpts))
    .concat(find(external, matchOpts))
    .map(file => resolve(file))
    .forEach(register)
}

function register (extPath) {
  const manifest = read(extPath, 'json') || {}
  const { name, version } = manifest

  if (!name || !version) {
    log.error(`Extension '${name}' has an invalid manifest.`)
  }

  if (_.has(extRegistry, name)) {
    log.error(`Extension '${name}' already loaded. Reloading.`)
    unloadModule(extPath, name)
  }

  const { valid, reason } = validate(extPath, manifest)
  if (!valid) return log.bot(reason)

  _.set(extRegistry, name, {
    manifest: extPath,
    module: manifest.module,
    component: manifest.component,
    interface: manifest.interface
  })

  const current = ext.get('installed', {})
  if (!_.has(current, [extPath])) {
    const updated = _.set(current, [extPath], {
      firstRun: true,
      installDate: Date.now()
    })
    ext.set('installed', updated)
  }

  log.trace(`Extension registered:: ${name} v${version}`)
  initialize(extPath, manifest)
}

function validate (extPath, manifest) {
  const {
    name,
    version,
    author = '<unlisted>',
    appEngine,
    files = {}
  } = manifest

  const extDir = dirname(extPath)

  if (!name) {
    return {
      valid: false,
      reason: `No name provided for extension at ${extPath}`
    }
  }

  if (!valid(version)) {
    log.warn(
      `Invalid version string '${version}' for '${name}'. ` +
      `This will probably prevent the extension from working. ` +
      `Contact author: ${author}`
    )
  }

  // check that the app & extension have compatible versions
  const appVersion = remote.app.getVersion()
  if (!satisfies(appVersion, appEngine)) {
    return {
      valid: false,
      reason: `Extension ${name} requires singularity ${appEngine}. ` +
              `You have v${appVersion}.`
    }
  }

  const file = [
    files.module && fileExists(extDir, files.module),
    files.component && fileExists(extDir, files.component),
    files.interface && fileExists(extDir, files.interface)
  ]

  // check that any `files` referenced exist
  if (!_.every(file.filter(v => !(_.isNil(v) || _.isEmpty(v))), Boolean)) {
    return {
      valid: false,
      reason: `Extension ${name} references files that don't exist. ` +
              `Contact author: ${author}`
    }
  }

  return { valid: true }
}

// Run the setup function in all present extension elements
function initialize (extPath, manifest) {
  const { name, version, files } = manifest
  const extDir = dirname(extPath)
  const current = ext.get('installed', {})

  if (files.interface) {
    try {
      const i = require(resolve(extDir, files.interface)).default
      i(new InterfaceExtender(manifest))
    } catch (e) {
      log.error(`Failed to initialize interface of ${name} :: ${e.message}`)
    }
  }

  if (files.language) {
    try {
      require(resolve(extDir, files.language)).default($)
    } catch (e) {
      log.error(`Failed to initialize language files of ${name} :: ${e.message}`)
    }
  }

  if (files.component) {
    try {
      require(resolve(extDir, files.component)).default($)
    } catch (e) {
      log.error(`Failed to initialize component of ${name} :: ${e.message}`)
    }
  }

  if (files.module) {
    $.once('ready', () => {
      try {
        require(resolve(extDir, files.module)).default($)
      } catch (e) {
        log.error(`Failed to initialize module of ${name} :: ${e.message}`)
      }

      log.debug(`Module loaded:: ${name} v${version}`)
    })
  }

  ext.set('installed', _.set(current, [extPath, 'firstRun'], false))
}

// called each time a command from the module is run
function loadModule (modulePath) {
  _.unset(require.cache, modulePath)
  return require(modulePath)
}

function unloadModule (extPath, name) {
  const modulePath = getExtensionProperty(name, 'module')
  _.unset(extRegistry, name)
  _.unset(require.cache, modulePath)
}

function getExtensionProperty (name, property) {
  if (!_.has(extRegistry, name)) return
  return Array.isArray(property)
    ? _.get(extRegistry, [name, ...property])
    : _.get(extRegistry, [name, property])
}

function getExtensionPath () {
  const directory = ext.get('path', settings.get('paths.extensions'))

  // ensure it exists
  dir(directory)
  return directory
}

function fileExists (extDir, element) {
  return exists(resolve(extDir, element)) === 'file'
}

export default {
  extRegistry,
  registerAll,
  loadModule,
  unloadModule,
  getExtensionPath,
  getExtensionProperty
}

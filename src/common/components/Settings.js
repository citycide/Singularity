import jetpack from 'fs-jetpack'
import { chmodSync } from 'fs'
import initialSettings from './lib/_initialSettings'
import createJSON from './lib/_jsonCreator'

class Settings {
  constructor (jsonPrefix, opts = {}) {
    this.PATH = createJSON(`${jsonPrefix || ''}.settings`)
    this.useDefaults = opts.useDefaults
    this.data = Object.assign({}, this.useDefaults ? initialSettings : {})
    this.lastSync = 0

    if (jetpack.exists(this.PATH) && !opts.wipeOldData) {
      this._load()
    } else {
      this._save(true)
      // Handle windows users running as admin
      chmodSync(this.PATH, '777')
    }
    this.coupled = true
  }

  get (key, defaultValue = null) {
    if (!this.coupled) {
      this._load()
    }
    return typeof this.data[key] === 'undefined' ? defaultValue : this.data[key]
  }

  set (key, value) {
    if (this.coupled) {
      this.data[key] = value
      this._save()
    }
  }

  del (key) {
    if (this.coupled) {
      delete this.data[key]
      this._save()
    }
  }

  _load (retryCount = 5) {
    let userSettings
    try {
      userSettings = jetpack.read(this.PATH, 'json')
    } catch (e) {
      if (retryCount > 0) {
        // Try again in 10 ms
        setTimeout(::this._load(retryCount - 1), 10)
        return
      }

      // Failed too many times
      userSettings = {}
    }
    this.data = Object.assign({}, this.useDefaults ? initialSettings : {}, userSettings)
  }

  _save (force) {
    const now = new Date().getTime()
    // Queue disk writes so they don't happen too frequently
    if ((now - this.lastSync > 250 || force)) {
      if (this.data) jetpack.write(this.PATH, this.data)
      if (this.saving) clearTimeout(this.saving)
    } else {
      if (this.saving) clearTimeout(this.saving)
      this.saving = setTimeout(::this._save, 275)
    }
    this.lastSync = now
  }

  destroy () {
    this.data = null
    jetpack.remove(this.PATH)
  }

  uncouple () {
    this.coupled = false
  }

  get path () {
    return this.PATH
  }
}

export default Settings

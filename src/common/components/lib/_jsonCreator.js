import { app, remote } from 'electron'
import jetpack from 'fs-jetpack'
import path from 'path'

export default function (fileName) {
  const source = app || remote.app
  const DIR = path.resolve(`${source.getPath('appData')}/singularity/json_store`)
  const PATH = path.resolve(DIR, `${fileName}.json`)

  if (!jetpack.exists(DIR)) {
    jetpack.dir(DIR)
  }

  return PATH
}

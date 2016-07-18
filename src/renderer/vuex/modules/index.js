import { readdirSync } from 'fs'

const files = readdirSync('.')
// const files = require.context('.', false, /\.js$/)
let modules = {}

files.forEach(key => {
  if (key === './index.js') return
  modules[key.replace(/(\.\/|\.js)/g, '')] = files(key).default
})

export default modules

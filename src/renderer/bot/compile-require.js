import Levers from 'levers'
import register from 'babel-register'

const settings = new Levers('app')

// workaround for fast-async error
try { require('nodent') } catch (e) {}

register({
  only: settings.get('paths.extensions') + '/**/*.js',
  babelrc: false,
  presets: [
    [require('babel-preset-modern-async'), {
      electron: true
    }]
  ],
  comments: false
})

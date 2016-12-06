import CopyWebpackPlugin from 'copy-webpack-plugin'
import { resolve } from 'path'
import { read } from 'fs-jetpack'

import { dependencies } from './package.json'

const externals = Object.keys(dependencies).reduce((p, c) => {
  return Object.assign(p, { [c]: `require('${c}')` })
}, {})

const src = resolve.bind(__dirname, 'src')
const build = resolve.bind(__dirname, 'build')

export default {
  target: 'electron',
  entry: src('renderer', 'main.js'),
  output: {
    path: build('renderer'),
    filename: 'bundle.js'
  },
  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel',
      exclude: /node_modules/,
      query: {
        ...read('./.babelrc', 'json'),
        cacheDirectory: true
      }
    }, {
      test: /\.vue$/,
      loader: 'vue'
    }, {
      test: /\.s[a|c]ss$/,
      loader: 'style!css!sass'
    }, {
      test: /\.(png|jpg|gif|svg)$/,
      loader: 'file',
      query: {
        name: '[name].[ext]?[hash]'
      }
    }]
  },
  resolve: {
    modules: ['node_modules', src()],
    extensions: ['', '.js', '.vue', '.css', '.json'],
    alias: {
      vue$: 'vue/dist/vue'
    }
  },
  externals,
  vue: {
    loaders: {
      js: 'babel',
      scss: 'style!css!sass'
    }
  },
  plugins: [
    new CopyWebpackPlugin([
      { context: src('main'), from: '**/*.{json,html}', to: build('main') },
      { context: src('common'), from: '**/*.json', to: build('common') },
      { context: src('renderer'), from: '*.html' },
      { context: src('renderer'), from: 'bot/*.html' },
      { context: src('renderer'), from: 'bot/extensions/**/*.json' }
    ])
  ]
}

import Levers from 'levers'
import { join, dirname } from 'path'
import { BrowserWindow, screen } from 'electron'
import windowDefaults from './lib/window-defaults'

const windowStorage = new Levers('window')

let uid = 1
let windows = new Map()

function obliterate (name) {
  windows.delete(name)
}

function set (window, name) {
  windows.set(name, { id: window.id, window })
}

export function add (name, options) {
  if (!name) name = 'window_' + (uid++)
  while (has(name)) name = name + (uid++)

  let opts = options || Object.assign({}, windowDefaults(), options)

  let window = new BrowserWindow(opts)
  window.obliterate = obliterate.bind(window, name)
  window.managerName = name

  window.on('closed', window.obliterate)

  set(window, name)
  return window
}

export function get (name) {
  return (windows.get(name) || {}).window
}

export function getAll () {
  return [...windows]
}

export function getByID (target) {
  for (let [_, { id, window }] of windows) {
    if (target === id) return window
  }
}

export function has (name) {
  return windows.has(name)
}

export function close (name) {
  if (has(name)) get(name).close()
}

export function createSplash () {
  let splash = add('splash', {
    show: false,
    width: 500,
    height: 300,
    backgroundColor: '#222232',
    frame: false,
    skipTaskbar: true,
    resizable: false,
    maximizable: false,
    center: true
  })

  const dir = dirname(require.main.filename)
  splash.loadURL(join('file://', dir, '..', 'renderer/splash.html'))
  splash.on('ready-to-show', () => { splash.show() })

  return splash
}

export function createBot () {
  let isDev = process.env.NODE_ENV === 'dev'
  let bot = add('bot', {
    show: false,
    skipTaskbar: !isDev,
    focusable: isDev
  })

  const dir = dirname(require.main.filename)
  bot.loadURL(join('file://', dir, '..', 'renderer/bot/index.html'))

  // if (isDev) bot.webContents.openDevTools('undocked')

  return bot
}

export function createMain () {
  let mainWindow = add('main', windowDefaults())
  global.mainAppWindow = mainWindow
  global.mainWindowID = mainWindow.id

  let position = windowStorage.get('position')
  let inBounds = false
  if (position) {
    screen.getAllDisplays().map(({ workArea }) => {
      if (
        position[0] >= workArea.x &&
        position[0] <= workArea.x + workArea.width &&
        position[1] >= workArea.y &&
        position[1] <= workArea.y + workArea.height
      ) {
        inBounds = true
      }
    })
  }

  let size = windowStorage.get('size', [1200, 800])

  mainWindow.setSize(...size)
  if (position && inBounds) {
    mainWindow.setPosition(...position)
  } else {
    mainWindow.center()
  }

  if (windowStorage.get('maximized', false)) mainWindow.maximize()

  const dir = dirname(require.main.filename)
  mainWindow.loadURL(join('file://', dir, '..', 'renderer/index.html'))

  return mainWindow
}

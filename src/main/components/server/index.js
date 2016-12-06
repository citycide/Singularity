import Koa from 'koa'
import serve from 'koa-static'
import mount from 'koa-mount'
import socketio from 'socket.io'
import { createServer } from 'http'
import { resolve } from 'path'
import { once } from 'lodash'
import Levers from 'levers'

const settings = new Levers('app')

const app = new Koa()

function startServer () {
  app.use(mount('/overlay', serve(resolve(__dirname, './public'))))
  app.use(mount('/user/overlay', serve(settings.get('paths.userServer'))))

  return createServer(app.callback())
}

function startSocket () {
  return socketio(getServer())
}

const getSocket = once(startSocket)
const getServer = once(startServer)

export { startServer, getServer, startSocket, getSocket }

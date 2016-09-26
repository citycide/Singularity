import Koa from 'koa'
import serve from 'koa-static'
import mount from 'koa-mount'
import socketio from 'socket.io'
import { createServer } from 'http'
import { resolve } from 'path'
import Levers from 'levers'

const settings = new Levers('app')

const app = new Koa()

app.use(mount('/overlay', serve(resolve(__dirname, './public'))))
app.use(mount('/user/overlay', serve(settings.get('paths.userServer'))))

const server = createServer(app.callback())
const io = socketio(server)

export { server, io }

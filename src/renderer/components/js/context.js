import context from 'electron-contextmenu-middleware'
import { middleware as debug } from 'debug-menu'
import input from 'electron-input-menu'

context.use(debug)
context.use(input)
context.activate()

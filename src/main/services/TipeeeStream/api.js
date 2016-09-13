import axios from 'axios'

const BASE_URL = 'https://api.tipeeestream.com/'
const VERSION = 'v1.0/'

export default class API {
  constructor (key) {
    this.key = key
  }

  get (url, options = {}) {
    const defaults = { method: 'get' }
    const opts = Object.assign({}, defaults, options)

    return this._request(url, opts)
  }

  _request (url, options = {}) {
    const defaults = {
      url: `${BASE_URL}${VERSION}${url}`,
      headers: { 'apiKey': this.key }
    }

    const opts = Object.assign({}, defaults, options)

    return axios.get(url, opts)
  }
}

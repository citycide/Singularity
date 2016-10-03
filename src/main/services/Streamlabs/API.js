import url from 'url'
import _ from 'lodash'
import rp from 'request-promise'
import apiData from './lib/apiData'

export default class API {
  constructor (options = {}) {
    this.token = options.token
    this.defaultAPIVersion = 'v1'
    this.apiVersion = _.has(apiData.API, options.apiVersion)
      ? options.apiVersion
      : this.defaultAPIVersion
    this.ad = apiData.API[this.apiVersion]
  }

  resolve (options) {
    return url.resolve(this.ad.base, options.path || '')
  }

  locateEndpoint (options, result, resultDefault) {
    let lookup = _.find(this.ad.endpoints, options || {})

    if (!_.isEmpty(result)) {
      lookup = _.result(lookup, result, resultDefault)
    }

    return lookup
  }

  request (options = {}) {
    const api = apiData.names[this.apiVersion]
    const endpointName = api[options.name]
    const ep = this.locateEndpoint({ name: endpointName })

    if (!ep) return false

    const uri = this.resolve({ path: ep.path })
    const headers = {
      Accept: ep.contentType,
      'Accept-Encoding': 'gzip, deflate, sdch',
      Connection: 'keep-alive'
    }
    const qs = { callback: '?' }

    const defaultQS = _.map(ep.queryOptions, e => {
      if (e.required) {
        return {
          [e.name]: e.defaultValue
        }
      }

      return {}
    })

    const qsOptions = _.defaults(options.qs || {}, defaultQS)

    if (ep.auth.required) {
      qs[ep.auth.qs] = this.token
    }

    _.merge(qs, qsOptions)

    const opts = {
      uri,
      method: ep.method,
      qs,
      headers,
      gzip: true,
      json: true
    }

    return rp(opts)
  }
}

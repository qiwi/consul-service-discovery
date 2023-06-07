/** @module @qiwi/consul-service-discovery */

import * as Consul from 'consul'

import { DEFAULT_TIMEOUT } from './defaults'
import { ICxt, ILibConfig } from './interface'
import { createLogger } from './logger'

export const createContext = (cxt: ILibConfig = {}): ICxt => {
  return {
    Consul: (opts) => {
      return cxt.Consul
        ? cxt.Consul(opts)
        : new Consul(opts) // should be new Consul(opts) for consul@1.x.x
    },
    Promise: cxt.Promise || Promise,
    logger: createLogger(cxt.logger || console),
    timeout: cxt.timeout || DEFAULT_TIMEOUT
  }
}

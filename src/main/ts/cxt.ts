/** @module @qiwi/consul-service-discovery */

import * as Consul from 'consul'

import { DEFAULT_TIMEOUT } from './defaults'
import { ICxt, ILibConfig } from './interface'
import { createLogger } from './logger'

export const createContext = (cxt: ILibConfig = {}): ICxt => {
  return {
    Consul: cxt.Consul || Consul,
    Promise: cxt.Promise || Promise,
    logger: createLogger(cxt.logger || console),
    timeout: cxt.timeout || DEFAULT_TIMEOUT
  }
}

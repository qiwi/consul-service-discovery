/** @module @qiwi/consul-service-discovery */

import { ICxt, ILibConfig } from './interface'
import * as Consul from 'consul'
import { createLogger } from './logger'
import { DEFAULT_TIMEOUT } from './defaults'

export const createContext = (cxt: ILibConfig = {}): ICxt => {
  return {
    Consul: cxt.Consul || Consul,
    Promise: cxt.Promise || Promise,
    logger: createLogger(cxt.logger || console),
    timeout: cxt.timeout || DEFAULT_TIMEOUT
  }
}

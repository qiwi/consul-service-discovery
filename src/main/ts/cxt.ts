/** @module @qiwi/consul-service-discovery */

import { ICxt, ILibConfig } from './interface'
import * as Consul from 'consul'
import { createeLogger } from './logger'

export const createContext = (cxt: ILibConfig = {}): ICxt => {
  return {
    Consul: cxt.Consul || Consul,
    Promise: cxt.Promise || Promise,
    logger: createeLogger(cxt.logger || console)
  }
}

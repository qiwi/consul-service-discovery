/** @module @qiwi/consul-service-discovery */

import { ICxt } from './interface'
import Consul from 'consul'

export const cxt: ICxt = {
  Consul: Consul,
  Promise: Promise,
  logger: console
}

export default cxt

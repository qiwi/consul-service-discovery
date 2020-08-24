/** @module @qiwi/consul-service-discovery */

import { ICtx } from './interface'
import * as Consul from 'consul'

export const ctx: ICtx = {
  Consul: Consul,
  Promise: Promise,
  logger: console
}

export default ctx

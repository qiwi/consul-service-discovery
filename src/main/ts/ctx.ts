import {IConsulClient, ICxt} from './interface'
import * as Consul from 'consul'

export const cxt: ICxt = {
  Consul: Consul as Consul.ConsulStatic,
  Promise: Promise,
  logger: console
}

export default cxt

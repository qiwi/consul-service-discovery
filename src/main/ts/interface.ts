import { ILogger, IPromiseConstructor } from '@qiwi/substrate'
export { ILogger, IPromise, IPromiseConstructor } from '@qiwi/substrate'
import * as Consul from 'consul'

export interface IConsulClientWatch extends NodeJS.EventEmitter {
  end (): void
}

export interface IConsulServiceHealth {
  service: any
}

export interface IConsulClient {
  watch (opts: Consul.Watch.Options): IConsulClientWatch
  health: IConsulServiceHealth
}

export interface IConsulClientFactory {
  (opts?: Consul.ConsulOptions): IConsulClient
}

export interface ICxt {
  Consul: IConsulClientFactory
  Promise: any
  logger: ILogger
}

export interface IConnectionParams {
  port: string
  host: string
}

export interface IConsulService {
  getConnectionParams (serviceName: string): Promise<IConnectionParams>
}

export interface IConnectionParams {
  host: string
  port: string
}

export interface IEntryPoint {
  Service: {
    Address: string
    Port: string
  }
  Node: {
    Address: string
  }
}

export interface ILibConfig {
  Promise?: any,
  logger?: ILogger,
  Consul?: IConsulClientFactory
}

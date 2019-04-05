import { ILogger, IPromiseConstructor } from '@qiwi/substrate'
export { ILogger } from '@qiwi/substrate'

export interface ICxt {
  Promise: IPromiseConstructor
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

export interface IConsulWatchOptions {
  service: string
  passing: boolean
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
  logger?: ILogger
}

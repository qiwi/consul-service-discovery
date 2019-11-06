/** @module @qiwi/consul-service-discovery */

import * as Consul from 'consul'
import { ILogger } from '@qiwi/substrate'

export { ILogger, IPromise, IPromiseConstructor } from '@qiwi/substrate'

export interface IConsulClientWatch extends NodeJS.EventEmitter {
  end (): void
}

export interface IConsulServiceHealth {
  service: any
}

export type TConsulAgentServiceRegisterOptions = Consul.Agent.Service.RegisterOptions

export type TConsulAgentCheckListOptions = Consul.Agent.Check.ListOptions

export interface IConsulAgentService {
  /**
   * Registers a new local service
   */
  register: {
    <TData>(opts: TConsulAgentServiceRegisterOptions, callback: Consul.Callback<TData>): void;
  }
  list: {
    <TData>(opts: TConsulAgentCheckListOptions, callback: Consul.Callback<TData>): void
  }
}

export interface IConsulAgent {
  service: IConsulAgentService
  [key: string]: any
}

export interface IConsulClient {
  watch (opts: Consul.Watch.Options): IConsulClientWatch
  health: IConsulServiceHealth,
  agent: IConsulAgent
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

export interface IConsulDiscoveryService {
  services: {
    [key: string]: IServiceEntry
  }
  id?: string
  getConnectionParams (serviceName: string): Promise<IConnectionParams | undefined>
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

export type IServiceName = string

export type IServiceEntry = {
  name: IServiceName,
  watcher: IConsulClientWatch,
  connections: Array<IConnectionParams>,
  sequentialErrorCount: number,
  promise?: Promise<IServiceEntry>
}

export type IGenerateIdOpts = {
  serviceName: string,
  port?: string | number,
  localAddress?: string,
  remoteAddress?: string
}

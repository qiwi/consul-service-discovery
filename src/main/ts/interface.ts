/** @module @qiwi/consul-service-discovery */

import * as Consul from 'consul'
import { ILogger, IPromise, IPromiseConstructor } from '@qiwi/substrate'

export { ILogger, IPromise, IPromiseConstructor }

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
  kv: {
    get: any
  }

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

export interface INormalizedConsulKvValue {
  createIndex?: number,
  modifyIndex?: number,
  lockIndex?: number,
  key?: string,
  flags?: number,
  value?: string
}

export interface IConsulDiscoveryService {
  services: {
    [key: string]: IServiceKvEntry | IServiceDiscoveryEntry
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

export interface IConsulKvValue {
  CreateIndex: number,
  ModifyIndex: number,
  LockIndex: number,
  Key: string,
  Flags: number,
  Value: string
}

export interface ILibConfig {
  Promise?: any,
  logger?: ILogger,
  Consul?: IConsulClientFactory
}

export type IServiceName = string

export type IDiscovery = 'discovery'
export type IKv = 'kv'

export type IServiceType = IDiscovery | IKv

export type IServiceDiscoveryEntry = {
  type: IDiscovery,
  name: IServiceName,
  watcher: IConsulClientWatch,
  sequentialErrorCount: number,
  promise?: Promise<IServiceDiscoveryEntry>
  data: Array<IConnectionParams>
}

export type IServiceKvEntry = {
  type: IKv,
  name: IServiceName,
  watcher: IConsulClientWatch,
  sequentialErrorCount: number,
  promise?: Promise<IServiceDiscoveryEntry>
  data: INormalizedConsulKvValue
}

export type IServiceEntry = IServiceKvEntry | IServiceDiscoveryEntry

export type IGenerateIdOpts = {
  serviceName: string,
  port?: string | number,
  localAddress?: string,
  remoteAddress?: string
}

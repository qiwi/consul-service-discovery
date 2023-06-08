/* eslint-disable no-use-before-define */
/** @module @qiwi/consul-service-discovery */

import type { ILogger } from '@qiwi/substrate'
import * as Consul from 'consul'
import { TInsideOutPromise } from 'inside-out-promise'

export interface IConsulClientWatch extends NodeJS.EventEmitter {
  end(): void
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

export type IConsulKvSetOptions = {
  key: string
  value: string | Buffer
  dc?: string
  flags?: number
  cas?: string
  acquire?: string
  release?: string
  token?: string
}

export interface IConsulClient {
  watch(opts: Consul.Watch.Options): IConsulClientWatch
  health: IConsulServiceHealth,
  agent: IConsulAgent
  kv: any
}

export interface IConsulClientFactory {
  (opts?: Consul.ConsulOptions): IConsulClient
}

export interface ICxt {
  Consul: IConsulClientFactory
  Promise: any
  logger: ILogger
  timeout: number
}

export interface IConnectionParams {
  port: string
  host: string
  secure?: boolean
  timeout?: number
}

export interface INormalizedConsulKvValue {
  createIndex?: number,
  modifyIndex?: number,
  lockIndex?: number,
  key?: string,
  flags?: number,
  value?: string | null
}

export interface IConsulEntries {
  discovery: { [key: string]: IServiceDiscoveryEntry }
  kv: { [key: string]: IServiceKvEntry }
}

export interface IConsulDiscoveryService {
  cxt: ICxt
  services: IConsulEntries
  id?: string
  getConnectionParams(serviceName: string): Promise<IConnectionParams | undefined>
  getKv(key: string): Promise<INormalizedConsulKvValue>
  clear(): Promise<void>
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
  timeout?: number
}

export type IServiceName = string

export type IDiscoveryServiceType = 'discovery'
export type IKvServiceType = 'kv'

export type IServiceType = IDiscoveryServiceType | IKvServiceType

export type IServiceDiscoveryEntry = {
  type: IDiscoveryServiceType,
  name: IServiceName,
  watcher: IConsulClientWatch,
  sequentialErrorCount: number,
  iop?: TInsideOutPromise<IServiceDiscoveryEntry>
  data: Array<IConnectionParams>
}

export type IServiceKvEntry = {
  type: IKvServiceType,
  name: IServiceName,
  watcher: IConsulClientWatch,
  sequentialErrorCount: number,
  iop?: TInsideOutPromise<IServiceDiscoveryEntry>
  data: INormalizedConsulKvValue
}

export type IServiceEntry = IServiceKvEntry | IServiceDiscoveryEntry

export type IGenerateIdOpts = {
  serviceName: string,
  port?: string | number,
  localAddress?: string,
  remoteAddress?: string
}

export type { ILogger, IPromise, IPromiseConstructor } from '@qiwi/substrate'

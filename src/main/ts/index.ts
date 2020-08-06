/** @module @qiwi/consul-service-discovery */

import * as Consul from 'consul'
import { v4 as uuid } from 'uuid'
import log from './logger'
import cxt from './ctx'
import { promiseFactory, sample, repeat } from './util'
import { IControlled } from 'push-it-to-the-limit'
import { IPromise } from '@qiwi/substrate'
import {
  IConnectionParams,
  IConsulDiscoveryService,
  IEntryPoint,
  IConsulKvValue,
  IServiceEntry,
  INormalizedConsulKvValue,
  ILibConfig,
  IConsulClient,
  IServiceName,
  IServiceDiscoveryEntry,
  IServiceKvEntry,
  IServiceType,
  IConsulClientWatch,
  IGenerateIdOpts,
  TConsulAgentServiceRegisterOptions,
  TConsulAgentCheckListOptions
} from './interface'

export * from './interface'
export const BACKOFF_MAX = 20000
export const WATCH_ERROR_LIMIT = 20

/**
 * @class ConsulDiscoveryService
 */
export class ConsulDiscoveryService implements IConsulDiscoveryService {
  public services: {
    [key: string]: IServiceDiscoveryEntry | IServiceKvEntry
  } = {}

  protected _consul: IConsulClient

  private _id?: string
  private _repeatableRegister?: IControlled

  constructor ({ host, port }: IConnectionParams) {
    this._consul = cxt.Consul({
      host,
      port: port.toString()
    })
  }

  public getValueByKey (key: string) {
    return this.ready(key, 'kv').then(({ data }) => data)
  }

  public ready (
    serviceName: string,
    type: IServiceType
  ): IPromise<IServiceDiscoveryEntry> {
    const service = this.getService(serviceName, type)

    if (service.promise) {
      return service.promise
    }

    const { resolve, reject, promise } = promiseFactory()

    service.promise = promise

    log.debug(`watcher initialized, service=${serviceName}`)
    ConsulDiscoveryService.watchOnChange(
      service,
      resolve,
      reject,
      this.services
    )
    ConsulDiscoveryService.watchOnError(service, reject, this.services)

    return promise
  }

  public getService (
    serviceName: IServiceName,
    type: IServiceType
  ): IServiceEntry {
    return this.services[serviceName] || this.createService(serviceName, type)
  }

  public createService (
    serviceName: IServiceName,
    type: IServiceType
  ): IServiceEntry {
    const watcher = this.getWatcher(serviceName, type)
    const service = {
      type,
      name: serviceName,
      watcher,
      data: type === 'kv' ? {} : [],
      sequentialErrorCount: 0
    }

    // @ts-ignore
    this.services[serviceName] = service

    // @ts-ignore
    return service
  }

  /**
   * Gets all service connections.
   * @param {string} serviceName
   * @return {Array<IConnectionParams>}
   */
  public getConnections (
    serviceName: string
  ): Promise<Array<IConnectionParams>> {
    return this.ready(serviceName, 'discovery').then(({ data }) => data)
  }

  /**
   * Gets random service connection.
   * @param {string} serviceName
   * @returns {IConnectionParams | undefined}
   */
  public getConnection (
    serviceName: string
  ): Promise<IConnectionParams | undefined> {
    return this.getConnections(serviceName).then(sample)
  }

  /**
   * @deprecated
   * @param {string} serviceName
   * @returns {IConnectionParams | undefined}
   */
  public getConnectionParams (
    serviceName: string
  ): Promise<IConnectionParams | undefined> {
    return this.getConnection(serviceName)
  }

  public getWatcher (
    serviceName: IServiceName,
    type: IServiceType
  ): IConsulClientWatch {
    const method =
      type === 'kv' ? this._consul.kv.get : this._consul.health.service

    const options =
      type === 'kv'
        ? {
          key: serviceName
        }
        : ({
          service: serviceName,
          passing: true
        } as Consul.Health.ServiceOptions)

    return this._consul.watch({
      method: method,
      options,
      backoffMax: BACKOFF_MAX
    } as Consul.Watch.Options)
  }

  public async register (
    opts: TConsulAgentServiceRegisterOptions,
    registerCheckInterval?: number
  ): Promise<any> {
    const reg = this._register.bind(this)

    if (registerCheckInterval) {
      if (this._repeatableRegister) {
        this._repeatableRegister.cancel()
      }
      this._repeatableRegister = repeat(reg, registerCheckInterval)
    }

    const register = this._repeatableRegister || reg

    return register(opts)
  }

  private async _register (
    opts: TConsulAgentServiceRegisterOptions
  ): Promise<any> {
    const id: string =
      this._id ||
      ConsulDiscoveryService.generateId({
        serviceName: opts.name,
        remoteAddress: opts.address,
        port: opts.port
      })
    this._id = id
    const _opts: Consul.Agent.Service.RegisterOptions = {
      id,
      ...opts
    }

    if (await this.find(id)) {
      return Promise.resolve(void 0)
    }

    const agentService = this._consul.agent.service
    const register = agentService.register.bind(agentService)

    return ConsulDiscoveryService.promisify(register, _opts)
  }

  public list (token?: string): Promise<any> {
    const opts: TConsulAgentCheckListOptions = token ? { token } : {}
    const agentService = this._consul.agent.service
    const getList = this._consul.agent.service.list.bind(agentService)

    return ConsulDiscoveryService.promisify(getList, opts)
  }

  static promisify (method, opts): Promise<any> {
    const { resolve, reject, promise } = promiseFactory()

    method(opts, (err, data) => {
      if (err) {
        reject.call(promise, err)

        return
      }

      resolve.call(promise, data)
    })

    return promise
  }

  public find (id): Promise<any> {
    return this.list()
      .then((res) => res[id])
      .catch((e) => {
        throw new Error(`fail find service: ${e}`)
      })
  }

  static generateId ({
                      serviceName,
                      localAddress = '0.0.0.0',
                      port = '',
                      remoteAddress = '0.0.0.0'
                    }: IGenerateIdOpts) {
    return `${serviceName}-${remoteAddress}-${localAddress}-${port}-${uuid()}`.replace(
      /\./g,
      '-'
    )
  }

  static configure (opts: ILibConfig): void {
    Object.assign(cxt, opts)

    promiseFactory.Promise = cxt.Promise
  }

  static normalizeKvValue (data: IConsulKvValue): INormalizedConsulKvValue {
    return Object.keys(data).reduce((acc, el) => {
      const key = el[0].toLowerCase() + el.slice(1)
      acc[key] = data[el]
      return acc
    }, {} as INormalizedConsulKvValue)
  }

  static normalizeEntryPoint (data: IEntryPoint[]): IConnectionParams[] {
    return data.reduce((memo: IConnectionParams[], entryPoint: IEntryPoint) => {
      const address = entryPoint.Service.Address || entryPoint.Node.Address
      const port = entryPoint.Service.Port

      if (address) {
        memo.push({
          host: address,
          port: port
        })
      }

      return memo
    }, [])
  }

  static handleKvValue (
    data: INormalizedConsulKvValue,
    services,
    service: IServiceEntry,
    resolve,
    reject
  ) {
    if (data.value) {
      service.sequentialErrorCount = 0
      service.data = data
    } else {
      log.warn(
        `watcher got empty or invalid kv data, service=${service.name}`,
        'data=',
        data
      )
    }
    if (data.value) {
      resolve(service)
    } else {
      this.handleError(
        service,
        reject,
        new Error('got empty or invalid connection params'),
        services
      )
    }
  }

  static handleConnectionParams (
    data: IConnectionParams[],
    services,
    service: IServiceDiscoveryEntry,
    resolve,
    reject
  ) {
    if (data.length > 0) {
      service.sequentialErrorCount = 0
      service.data.length = 0
      service.data.push(...data)
    } else {
      log.warn(
        `watcher got empty or invalid connection params, service=${service.name}`,
        'data=',
        data
      )
    }

    if (service.data.length) {
      resolve(service)
    } else {
      this.handleError(
        service,
        reject,
        new Error('got empty or invalid connection params'),
        services
      )
    }
  }

  static watchOnChange (
    service: IServiceEntry,
    resolve: Function,
    reject: Function,
    services: Record<string, IServiceEntry>
  ): void {
    if (service.watcher.listenerCount('change')) {
      return
    }

    service.watcher.on('change', (data: IEntryPoint[] | IConsulKvValue) => {
      const normalizedData:
        | IConnectionParams[]
        | INormalizedConsulKvValue = Array.isArray(data)
        ? ConsulDiscoveryService.normalizeEntryPoint(data)
        : ConsulDiscoveryService.normalizeKvValue(data)

      if (Array.isArray(normalizedData)) {
        //  @ts-ignore
        this.handleConnectionParams(normalizedData, services, service, resolve, reject)
      } else {
        this.handleKvValue(normalizedData, services, service, resolve, reject)
      }
    })
  }

  static watchOnError (
    service: IServiceEntry,
    reject: Function,
    services: Record<string, IServiceEntry>
  ): void {
    if (service.watcher.listenerCount('error')) {
      return
    }

    service.watcher.on('error', (err: Error) =>
      this.handleError(service, reject, err, services)
    )
  }

  static handleError (
    service: IServiceEntry,
    reject: Function,
    err: any,
    services: Record<string, IServiceEntry>
  ): void {
    service.sequentialErrorCount += 1

    log.error(`watcher error, service=${service.name}`, 'error=', err)
    log.info(`sequentialErrorCount=${service.sequentialErrorCount}`)
    reject(err)
    delete service.promise

    if (service.type === 'discovery' && service.data.length === 0) {
      ConsulDiscoveryService.clearService(services, service)
    }

    if (service.type === 'kv' && service.data.value === undefined) {
      ConsulDiscoveryService.clearService(services, service)
    }

    // Once WATCH_ERROR_LIMIT is reached, reset watcher and instances
    if (service.sequentialErrorCount >= WATCH_ERROR_LIMIT) {
      ConsulDiscoveryService.clearService(services, service)
      log.error(`watcher error limit is reached, service=${service.name}`)
    }
  }

  static clearService (
    services: Record<string, IServiceEntry>,
    service: IServiceEntry
  ) {
    service.watcher.end()
    delete services[service.name]
  }
}

export default ConsulDiscoveryService

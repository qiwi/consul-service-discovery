/** @module @qiwi/consul-service-discovery */

import Consul from 'consul'
import { createContext } from './cxt'
import { promiseFactory, sample, repeat } from './util'
import { IControlled } from 'push-it-to-the-limit'
import { IPromise } from '@qiwi/substrate'
import {
  IConnectionParams,
  IConsulDiscoveryService,
  INormalizedConsulKvValue,
  IConsulClient,
  IServiceName,
  IServiceDiscoveryEntry,
  IServiceKvEntry,
  IServiceType,
  IConsulClientWatch,
  TConsulAgentServiceRegisterOptions,
  TConsulAgentCheckListOptions,
  IConsulKvSetOptions, ILibConfig, ICxt, IConsulEntries
} from './interface'
import { ConsulUtils } from './consulUtils'

export * from './interface'
export const BACKOFF_MAX = 20000

/**
 * @class ConsulDiscoveryService
 */
export class ConsulDiscoveryService implements IConsulDiscoveryService {
  public services: IConsulEntries = {
    discovery: {},
    kv: {}
  }

  cxt: ICxt

  protected _consul: IConsulClient

  private _id?: string
  private _repeatableRegister?: IControlled

  constructor ({ host, port }: IConnectionParams, cxt: ILibConfig = {}) {
    this.cxt = createContext(cxt)
    this._consul = this.cxt.Consul({
      host,
      port: port.toString()
    })
  }

  public getKv (key: string): Promise<INormalizedConsulKvValue> {
    return this.ready(key, 'kv').then(({ data }) => data)
  }

  public setKv (data: IConsulKvSetOptions): IPromise<boolean> {
    return new Promise((resolve, reject) => {
      this._consul.kv.set(data, (err, res) => {
        if (err) {
          reject(err)
        }

        resolve(res)
      })
    })
  }

  public ready<T extends IServiceType> (
    serviceName: string,
    type: T
  ): IPromise<T extends 'discovery' ? IServiceDiscoveryEntry : IServiceKvEntry> {
    const service = this.getService(serviceName, type)

    if (service.iop) {
      // @ts-ignore
      return service.iop.promise
    }

    service.iop = promiseFactory()

    this.cxt.logger.debug(`watcher initialized, service=${serviceName}`)

    ConsulUtils.watchOnError(service, this.services[type], this.cxt.logger)
    ConsulUtils.watchOnChange(
      service,
      this.services[type],
      this.cxt.logger
    )

    return service.iop.promise as IPromise
  }

  public getService (
    serviceName: IServiceName,
    type: IServiceType
  ): IServiceDiscoveryEntry | IServiceKvEntry {
    return this.services[type][serviceName] || this.createService(serviceName, type)
  }

  public createService (
    serviceName: IServiceName,
    type: IServiceType
  ): IServiceDiscoveryEntry | IServiceKvEntry {
    const watcher = this.getWatcher(serviceName, type)
    const service: IServiceKvEntry | IServiceDiscoveryEntry = type === 'kv' ? {
      type,
      name: serviceName,
      watcher,
      data: {},
      sequentialErrorCount: 0
    } : {
      type,
      name: serviceName,
      watcher,
      data: [],
      sequentialErrorCount: 0
    }

    this.services[type][serviceName] = service

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
      ConsulUtils.generateId({
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

    return ConsulUtils.promisify(register, _opts)
      .then((data) => {
        this.cxt.logger.info(`service ${id} registered`)
        return data
      })
      .catch(e => {
        this.cxt.logger.error(`failed to register ${id}`)
        throw e
      })

  }

  public list (token?: string): Promise<any> {
    const opts: TConsulAgentCheckListOptions = token ? { token } : {}
    const agentService = this._consul.agent.service
    const getList = this._consul.agent.service.list.bind(agentService)

    return ConsulUtils.promisify(getList, opts)
  }

  public find (id): Promise<any> {
    return this.list()
      .then((res) => res[id])
      .catch((e) => {
        throw new Error(`fail find service: ${e}`)
      })
  }
}

export default ConsulDiscoveryService

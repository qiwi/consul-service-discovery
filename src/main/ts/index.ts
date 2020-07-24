/** @module @qiwi/consul-service-discovery */

import * as Consul from 'consul'
import { v4 as uuid } from 'uuid'
import log from './logger'
import cxt from './ctx'
import {
  promiseFactory,
  sample,
  repeat
} from './util'
import { IControlled } from 'push-it-to-the-limit'
import { IPromise } from '@qiwi/substrate'
import {
  IConnectionParams,
  IConsulDiscoveryService,
  IEntryPoint,
  ILibConfig,
  IConsulClient,
  IServiceName,
  IServiceEntry,
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
    [key: string]: IServiceEntry
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

  public ready (serviceName: string): IPromise<IServiceEntry> {
    const service = this.getService(serviceName)

    if (service.promise) {
      return service.promise
    }

    const {
      resolve,
      reject,
      promise
    } = promiseFactory()

    service.promise = promise

    log.debug(`watcher initialized, service=${serviceName}`)
    ConsulDiscoveryService.watchOnChange(service, resolve.bind(promise), reject.bind(promise), this.services)
    ConsulDiscoveryService.watchOnError(service, reject.bind(promise), this.services)

    return promise
  }

  public getService (serviceName: IServiceName): IServiceEntry {
    return this.services[serviceName] || this.createService(serviceName)
  }

  public createService (serviceName: IServiceName): IServiceEntry {
    const watcher = this.getWatcher(serviceName)
    const connections = []
    const service = {
      name: serviceName,
      watcher,
      connections,
      sequentialErrorCount: 0
    }
    this.services[serviceName] = service

    return service
  }

  /**
   * Gets all service connections.
   * @param {string} serviceName
   * @return {Array<IConnectionParams>}
   */
  public getConnections (serviceName: string): Promise<Array<IConnectionParams>> {
    return this.ready(serviceName).then(({ connections }) => connections)
  }

  /**
   * Gets random service connection.
   * @param {string} serviceName
   * @returns {IConnectionParams | undefined}
   */
  public getConnection (serviceName: string): Promise<IConnectionParams | undefined> {
    return this.getConnections(serviceName).then(sample)
  }

  /**
   * @deprecated
   * @param {string} serviceName
   * @returns {IConnectionParams | undefined}
   */
  public getConnectionParams (serviceName: string): Promise<IConnectionParams | undefined> {
    return this.getConnection(serviceName)
  }

  public getWatcher (serviceName: IServiceName): IConsulClientWatch {
    return this._consul.watch({
      method: this._consul.health.service,
      options: {
        service: serviceName,
        passing: true
      } as Consul.Health.ServiceOptions,
      backoffMax: BACKOFF_MAX
    } as Consul.Watch.Options)
  }

  public async register (opts: TConsulAgentServiceRegisterOptions, registerCheckInterval?: number): Promise<any> {
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

  private async _register (opts: TConsulAgentServiceRegisterOptions): Promise<any> {
    const id: string = this._id || ConsulDiscoveryService.generateId({
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
    const opts: TConsulAgentCheckListOptions = token
      ? { token }
      : {}
    const agentService = this._consul.agent.service
    const getList = this._consul.agent.service.list.bind(agentService)

    return ConsulDiscoveryService.promisify(getList, opts)
  }

  static promisify (method, opts): Promise<any> {
    const {
      resolve,
      reject,
      promise
    } = promiseFactory()

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
      .then(res => res[id])
      .catch(e => { throw new Error(`fail find service: ${e}`) })
  }

  static generateId ({ serviceName, localAddress = '0.0.0.0', port = '', remoteAddress = '0.0.0.0' }: IGenerateIdOpts) {
    return `${serviceName}-${remoteAddress}-${localAddress}-${port}-${uuid()}`
      .replace(/\./g, '-')
  }

  static configure (opts: ILibConfig): void {
    Object.assign(cxt, opts)

    promiseFactory.Promise = cxt.Promise
  }

  static watchOnChange (service: IServiceEntry, resolve: Function, reject: Function, services: Record<string, IServiceEntry>): void {
    service.watcher
      .on('change', (data: IEntryPoint[]) => {
        const connections: IConnectionParams[] = data.reduce((memo: IConnectionParams[], entryPoint: IEntryPoint) => {
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

        if (connections.length > 0) {
          service.sequentialErrorCount = 0
          service.connections.length = 0
          service.connections.push(...connections)
        } else {
          log.warn(`watcher got empty or invalid connection params, service=${service.name}`, 'data=', data)
        }

        if (service.connections.length) {
          resolve(service)
        } else {
          this.handleError(service, reject, new Error('got empty or invalid connection params'), services)
        }
      })
  }

  static watchOnError (service: IServiceEntry, reject: Function, services: Record<string, IServiceEntry>): void {
    service.watcher
      .on('error', (err: Error) => this.handleError(service, reject, err, services))
  }

  static handleError (service: IServiceEntry, reject: Function, err: any, services: Record<string, IServiceEntry>): void {
    service.sequentialErrorCount += 1

    log.error(`watcher error, service=${service.name}`, 'error=', err)
    log.info(`sequentialErrorCount=${service.sequentialErrorCount}`)

    // Once WATCH_ERROR_LIMIT is reached, reset watcher and instances
    if (service.sequentialErrorCount >= WATCH_ERROR_LIMIT) {
      service.watcher.end()
      delete service.promise
      delete services[service.name]

      log.error(`watcher error limit is reached, service=${service.name}`)
      reject(err)
    }
  }
}

export default ConsulDiscoveryService

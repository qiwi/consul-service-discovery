/** @module @qiwi/consul-service-discovery */

import * as Consul from 'consul'
import log from './logger'
import cxt from './ctx'
import * as uuid from 'uuid'
import {
  promiseFactory,
  sample,
  repeat
} from './util'
import { IControlled } from 'push-it-to-the-limit'
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

  public ready (serviceName: string): Promise<IServiceEntry> {
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
    ConsulDiscoveryService.watchOnChange(service, resolve.bind(promise), reject.bind(promise))
    ConsulDiscoveryService.watchOnError(service, reject.bind(promise))

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

  public getConnectionParams (serviceName: string): Promise<IConnectionParams | undefined> {
    return this.ready(serviceName)
      .then(service => sample(service.connections))
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

    const cxt = this._consul.agent.service
    const method = this._consul.agent.service.register.bind(cxt)

    return ConsulDiscoveryService.promisify(method, _opts)
  }

  public list (token?: string): Promise<any> {
    const opts: TConsulAgentCheckListOptions = token
      ? { token }
      : {}
    const cxt = this._consul.agent.service
    const method = this._consul.agent.service.list.bind(cxt)

    return ConsulDiscoveryService.promisify(method, opts)
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

  static watchOnChange (service: IServiceEntry, resolve: Function, reject: Function): void {
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
          this.handleError(service, reject, new Error('got empty or invalid connection params'))
        }
      })
  }

  static watchOnError (service: IServiceEntry, reject: Function): void {
    service.watcher
      .on('error', (err: Error) => this.handleError(service, reject, err))
  }

  static handleError (service: IServiceEntry, reject: Function, err: any): void {
    service.sequentialErrorCount += 1

    log.error(`watcher error, service=${service.name}`, 'error=', err)
    log.info(`sequentialErrorCount=${service.sequentialErrorCount}`)

    // Once WATCH_ERROR_LIMIT is reached, reset watcher and instances
    if (service.sequentialErrorCount >= WATCH_ERROR_LIMIT) {
      service.watcher.end()
      delete service.promise

      log.error(`watcher error limit is reached, service=${service.name}`)
      reject(err)
    }
  }
}

export default ConsulDiscoveryService

/** @module @qiwi/consul-service-discovery */

import * as Consul from 'consul'
import log from './logger'
import cxt from './ctx'
import * as uuid from 'uuid'

import {
  promiseFactory,
  sample
} from './util'
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
  TConsulAgentServiceRegisterOptions
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
  protected _id?: string
  protected _opts?: Consul.Agent.Service.RegisterOptions
  protected _consul: IConsulClient

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

  protected failToRegister (time) {
    const checkRegistration = () => {
      return this.getServiceList()
        .then((res) => {
          if (!res) this.reregistration()
        })
    }

    if (time) {
      setTimeout(() => {
        checkRegistration()
          .then(() => this.failToRegister(time))
      }, time)
    }
  }

  public register (opts: TConsulAgentServiceRegisterOptions, time): Promise<any> {
    const id = ConsulDiscoveryService.generateId({
      serviceName: opts.name,
      remoteAddress: opts.address,
      port: opts.port
    })
    this._id = id
    const _opts: Consul.Agent.Service.RegisterOptions = {
      id,
      ...opts
    }
    this._opts = _opts
    return new Promise<any>(((resolve, reject) => {
      this._consul.agent.service.register(_opts, (err) => {
        if (err) {
          reject(err)
        }
        resolve(true)
        if (time) {
          this.failToRegister(time)
        }
      })
    }))
  }

  public reregistration () {
    if (!this._opts) {
      throw new Error('opts is not defined')
    }
    return new Promise<any>(((resolve, reject) => {
      // @ts-ignore
      this._consul.agent.service.register(this._opts, (err) => {
        if (err) {
          reject(err)
        }
        resolve(true)
      })
    }))
  }

  public getServiceList (): Promise<any> {
    return new Promise<any>(((resolve, reject) => {
      this._consul.agent.service.list((err, result) => {
        if (err) {
          reject(err)
        }
        resolve(result)
      })
    }))
  }

  public find (): Promise<any> {
    return new Promise<any>(((resolve, reject) => {
      if (!this._id) {
        reject()
      } else {
        this.getServiceList()
        // @ts-ignore
          .then(res => resolve(Object.keys(res).includes(this._id)))
      }
    }))
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

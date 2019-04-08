import * as Consul from 'consul'

import {
  IConnectionParams,
  IConsulDiscoveryService,
  IEntryPoint,
  ILibConfig,
  IConsulClient,
  IServiceName,
  IServiceEntry,
  IConsulClientWatch
} from './interface'

export * from './interface'

import log from './logger'
import cxt from './ctx'
import {
  getDecomposedPromise,
  sample
} from './util'

const BACKOFF_MAX = 10000
const WATCH_ERROR_LIMIT = 20

export default class ConsulDiscoveryService implements IConsulDiscoveryService {
  public services = {}
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
    } = getDecomposedPromise()

    service.promise = promise

    log.debug(`watcher initialized, service=${serviceName}`)

    ConsulDiscoveryService.watchOnChange(service, resolve, reject)
    ConsulDiscoveryService.watchOnError(service, reject)

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

  static configure (opts: ILibConfig): void {
    Object.assign(cxt, opts)
  }

  static watchOnChange (service: IServiceEntry, resolve: Function, reject: Function): void {
    service.watcher
      .on('change', (data: IEntryPoint[]) => {
        service.connections.length = 0
        service.sequentialErrorCount = 0

        data.forEach((entryPoint: IEntryPoint) => {
          const address = entryPoint.Service.Address || entryPoint.Node.Address
          const port = entryPoint.Service.Port

          if (address) {
            service.connections.push({
              host: address,
              port: port
            })
          } else {
            log.warn(`watcher got empty connection params, service=${service.name}`, entryPoint)
          }
        })

        if (service.connections.length) {
          resolve(service)
        } else {
          reject()
        }
      })
  }

  static watchOnError (service: IServiceEntry, reject: Function): void {
    service.watcher
      .on('error', (err: Error) => {
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
      })
  }
}

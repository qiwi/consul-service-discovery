import * as Consul from 'consul'

import {
  IConnectionParams,
  IConsulDiscoveryService,
  IEntryPoint,
  ILibConfig,
  IConsulClient,
  ISeviceName,
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
  protected _instances: any = {}
  public instancesWatcher: any = {}
  protected _attempts: number = 0

  constructor ({ host, port }: IConnectionParams) {
    this._consul = cxt.Consul({
      host,
      port: port.toString()
    })
  }

  public init (serviceName: string): Promise<any> {
    const watcher = this.getWatcher(serviceName)
    const connections = []
    const service: IServiceEntry = {
      name: serviceName,
      watcher,
      connections,
      sequentialErrorCount: 0
    }
    const {
      resolve,
      reject,
      promise
    } = getDecomposedPromise()

    log.debug(`watcher initialized, service=${serviceName}`)

    this.services[serviceName] = service

    this._instances[serviceName] = []

    this.instancesWatcher[serviceName] = watcher
      .on('change', (data: IEntryPoint[]) => {
        this._instances[serviceName].length = 0

        data.forEach((entryPoint: IEntryPoint) => {
          const address = entryPoint.Service.Address || entryPoint.Node.Address
          const port = entryPoint.Service.Port

          if (address) {
            this._instances[serviceName].push({
              host: address,
              port: port
            })
          } else {
            log.warn(`watcher got empty connection params, service=${serviceName}`, entryPoint)
          }
        })

        if (this._instances[serviceName].length) {
          resolve(service)
        } else {
          reject()
        }
      })
      .on('error', (err: Error) => {
        log.error(`watcher error, service=${serviceName}`, 'error=', err)
        log.info(`attempt=${this._attempts}`)

        this._attempts += 1
        // Once WATCH_ERROR_LIMIT is reached, reset watcher and instances
        if (this._attempts >= WATCH_ERROR_LIMIT) {
          this._attempts = 0
          this._instances[serviceName].length = 0
          this.instancesWatcher[serviceName].end()

          log.error(`watcher error limit is reached, service=${serviceName}`)
          reject()
        }
      })

    return promise
  }

  public getService (serviceName: ISeviceName) {
    return cxt.Promise.resolve(this.services[serviceName] || this.init(serviceName))
  }

  public async getConnectionParams (serviceName: string): Promise<IConnectionParams> {
    if (!this._instances[serviceName]) {
      await this.init(serviceName)
    }

    return sample(this._instances[serviceName])
  }

  public getWatcher (serviceName: ISeviceName): IConsulClientWatch {
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
}

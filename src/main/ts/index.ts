import * as Consul from 'consul'

import {
  IConnectionParams,
  IConsulService,
  IEntryPoint,
  ILibConfig,
  IConsulClient
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

export default class ConsulDiscoveryService implements IConsulService {
  protected _consul: IConsulClient
  protected _instances: any = {}
  public instancesWatcher: any = {}
  protected _attempts: number = 0

  constructor (
    consulConnectionParams: IConnectionParams
  ) {
    this._consul = cxt.Consul({
      host: consulConnectionParams.host,
      port: consulConnectionParams.port.toString()
    })
  }

  public init (serviceName: string): Promise<any> {
    const {
      resolve,
      reject,
      promise
    } = getDecomposedPromise()

    this._instances[serviceName] = []

    log.debug(`watcher initialized, service=${serviceName}`)

    this.instancesWatcher[serviceName] = this._consul.watch({
      method: this._consul.health.service,
      options: {
        service: serviceName,
        passing: true
      } as Consul.Health.ServiceOptions,
      backoffMax: BACKOFF_MAX
    } as Consul.Watch.Options)
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
          resolve()
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

  public async getConnectionParams (serviceName: string): Promise<IConnectionParams> {
    if (!this._instances[serviceName]) {
      await this.init(serviceName)
    }

    return sample(this._instances[serviceName])
  }

  static configure (opts: ILibConfig): void {
    Object.assign(cxt, opts)
  }
}

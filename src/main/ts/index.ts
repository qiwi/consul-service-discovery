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
  once,
  sample
} from './util'

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
    let resolveInit
    let rejectInit

    const finallize = once((handler: any): void => handler())
    const promise = new cxt.Promise((resolve, reject) => {
      resolveInit = resolve
      rejectInit = reject
    })

    this._instances[serviceName] = []

    log.debug('initialized')

    this.instancesWatcher[serviceName] = this._consul.watch({
      method: this._consul.health.service,
      options: {
        service: serviceName,
        passing: true
      } as Consul.Health.ServiceOptions,
      backoffMax: 10000
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
            log.warn('Entry point connection param is empty', entryPoint)
          }
        })

        if (this._instances[serviceName].length) {
          finallize(resolveInit)
        } else {
          finallize(rejectInit)
        }
      })
      .on('error', (err: Error) => {
        log.error('Consul client error:', err)
        this._attempts += 1
        // wait for 20 errors and reset watch and instanses
        if (this._attempts >= 20) {
          this._attempts = 0
          this._instances[serviceName].length = 0
          this.instancesWatcher[serviceName].end()
          finallize(rejectInit)
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

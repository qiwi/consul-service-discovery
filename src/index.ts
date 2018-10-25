import * as Consul from 'consul'
import * as _ from 'lodash'

export interface IConnectionParams {
  port: string
  host: string
}

export interface IConsulService {
  getConnectionParams (serviceName: string): Promise<IConnectionParams>
}

export interface IConnectionParams {
  host: string
  port: string
}

export interface IConsulWatchOptions {
  service: string
  passing: boolean
}

export interface IEntryPoint {
  Service: {
    Address: string
    Port: string
  }
}

export default class ConsulDiscoveryService implements IConsulService {
  protected _consul: any
  protected _instances: any = {}
  public instancesWatcher: any = {}
  protected _attempts: number = 0

  constructor (
    consulConnectionParams: IConnectionParams,
    consul: any = Consul
  ) {
    this._consul = new consul({
      host: consulConnectionParams.host,
      port: consulConnectionParams.port.toString()
    })
  }

  public async init (serviceName: string): Promise<void> {
    let resolveInit: (value?: void | PromiseLike<void>) => void
    let rejectInit: (reason?: any) => void
    const finallize = _.once((handler: any): void => handler())

    const promise = new Promise<void>((resolve, reject) => {
      resolveInit = resolve
      rejectInit = reject
    })

    this.instancesWatcher[serviceName] = this._consul.watch({
      method: this._consul.health.service,
      options: {
        service: serviceName,
        passing: true
      } as IConsulWatchOptions,
      backoffMax: 10000
    })
      .on('change', (data: IEntryPoint[]) => {
        data.forEach((entryPoint: IEntryPoint) => {
          if (entryPoint.Service.Address) {
            this._instances[serviceName].push({
              host: entryPoint.Service.Address,
              port: entryPoint.Service.Port
            })
          } else {
            console.warn('One of entry point connection param is empty', entryPoint)
          }
        })
        if (this._instances[serviceName].length) {
          finallize(resolveInit)
        }
      })
      .on('error', (err: Error) => {
        console.error('Consul client error:', err)
        this._attempts += 1
        // wait for 20 errors and reset watch and instanses
        if (this._attempts >= 20) {
          this._attempts = 0
          this._instances[serviceName] = []
          this.instancesWatcher[serviceName].end()
          finallize(rejectInit)
        }
      })
    this._instances[serviceName] = []
    return promise
  }

  public async getConnectionParams (serviceName: string): Promise<IConnectionParams> {
    if (!this._instances[serviceName]) {
      await this.init(serviceName)
    }
    const index = Math.floor(Math.random() * this._instances[serviceName].length)
    return this._instances[serviceName][index]
  }
}

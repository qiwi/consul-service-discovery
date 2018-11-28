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
  Node: {
    Address: string
  }
}

export interface ILibConfig {
  Promise?: any,
  logger?: any
}

export interface ILogger {
  warn (...args: Array<any>)
  error (...args: Array<any>)
  log (...args: Array<any>)
  info (...args: Array<any>)
  debug (...args: Array<any>)
}

export const LOG_PREFIX = '[consul discovery]'

export interface ICxt {
  Promise: typeof Promise
  logger: ILogger
}

const cxt: ICxt = {
  Promise: Promise,
  logger: console
}

const log: ILogger = (() => {
  const wrap = (level, ...args) => cxt.logger[level](LOG_PREFIX, ...args)
  const error = wrap.bind(null, 'error')
  const warn = wrap.bind(null, 'warn')
  const debug = wrap.bind(null, 'debug')
  const info = wrap.bind(null, 'info')
  const log = wrap.bind(null, 'log')

  return {
    debug,
    log,
    info,
    warn,
    error
  }
})()

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

    this._instances[serviceName] = []

    log.debug('initialized')

    this.instancesWatcher[serviceName] = this._consul.watch({
      method: this._consul.health.service,
      options: {
        service: serviceName,
        passing: true
      } as IConsulWatchOptions,
      backoffMax: 10000
    })
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
    const index = Math.floor(Math.random() * this._instances[serviceName].length)
    return this._instances[serviceName][index]
  }

  static configure (opts: ILibConfig): void {
    Object.assign(cxt, opts)
  }
}

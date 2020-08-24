import { promiseFactory } from './util'
import {
  IConnectionParams,
  IConsulKvValue,
  IEntryPoint,
  IGenerateIdOpts,
  ILibConfig,
  INormalizedConsulKvValue, IServiceDiscoveryEntry, IServiceEntry
} from './interface'
import { v4 as uuid } from 'uuid'
import log from './logger'
import { WATCH_ERROR_LIMIT } from './index'

export class ConsulUtils {
  static promisify (method, opts): Promise<any> {
    const { resolve, reject, promise } = promiseFactory()

    method(opts, (err, data) => {
      if (err) {
        reject.call(promise, err)

        return
      }

      resolve.call(promise, data)
    })

    return promise
  }

  static generateId ({ serviceName, localAddress = '0.0.0.0', port = '', remoteAddress = '0.0.0.0' }: IGenerateIdOpts) {
    return `${serviceName}-${remoteAddress}-${localAddress}-${port}-${uuid()}`.replace(
      /\./g,
      '-'
    )
  }

  static configure (opts: ILibConfig, cxt, promiseFactory): void {
    Object.assign(cxt, opts)

    promiseFactory.Promise = cxt.Promise
  }

  static normalizeKvValue (data: IConsulKvValue): INormalizedConsulKvValue {
    return Object.keys(data).reduce((acc, el) => {
      const key = el[0].toLowerCase() + el.slice(1)
      acc[key] = data[el]
      return acc
    }, {} as INormalizedConsulKvValue)
  }

  static normalizeEntryPoint (data: IEntryPoint[]): IConnectionParams[] {
    return data.reduce((memo: IConnectionParams[], entryPoint: IEntryPoint) => {
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
  }

  static handleKvValue (
    data: INormalizedConsulKvValue,
    services,
    service: IServiceEntry,
    resolve,
    reject
  ) {
    if (data.value) {
      service.sequentialErrorCount = 0
      service.data = data
    } else {
      log.warn(
        `watcher got empty or invalid kv data, service=${service.name}`,
        'data=',
        data
      )
    }
    if ((service.data as INormalizedConsulKvValue).value) {
      resolve(service)
    } else {
      this.handleError(
        service,
        reject,
        new Error('got empty or invalid kv data'),
        services
      )
    }
  }

  static handleConnectionParams (
    data: IConnectionParams[],
    services,
    service: IServiceDiscoveryEntry,
    resolve,
    reject
  ) {
    if (data.length > 0) {
      service.sequentialErrorCount = 0
      service.data.length = 0
      service.data.push(...data)
    } else {
      log.warn(
        `watcher got empty or invalid connection params, service=${service.name}`,
        'data=',
        data
      )
    }

    if (service.data.length) {
      resolve(service)
    } else {
      this.handleError(
        service,
        reject,
        new Error('got empty or invalid connection params'),
        services
      )
    }
  }

  static watchOnChange (
    service: IServiceEntry,
    resolve: Function,
    reject: Function,
    services: Record<string, IServiceEntry>
  ): void {
    if (service.watcher.listenerCount('change')) {
      return
    }

    service.watcher.on('change', (data: IEntryPoint[] | IConsulKvValue) => {
      const normalizedData:
        | IConnectionParams[]
        | INormalizedConsulKvValue = Array.isArray(data)
        ? ConsulUtils.normalizeEntryPoint(data)
        : ConsulUtils.normalizeKvValue(data)

      if (Array.isArray(normalizedData)) {
        //  @ts-ignore
        this.handleConnectionParams(normalizedData, services, service, resolve, reject)
      } else {
        this.handleKvValue(normalizedData, services, service, resolve, reject)
      }
    })
  }

  static watchOnError (
    service: IServiceEntry,
    reject: Function,
    services: Record<string, IServiceEntry>
  ): void {
    if (service.watcher.listenerCount('error')) {
      return
    }

    service.watcher.on('error', (err: Error) =>
      this.handleError(service, reject, err, services)
    )
  }

  static handleError (
    service: IServiceEntry,
    reject: Function,
    err: any,
    services: Record<string, IServiceEntry>
  ): void {
    service.sequentialErrorCount += 1

    log.error(`watcher error, service=${service.name}`, 'error=', err)
    log.info(`sequentialErrorCount=${service.sequentialErrorCount}`)
    reject(err)
    delete service.promise

    if (service.type === 'discovery' && service.data.length === 0) {
      ConsulUtils.clearService(services, service)
    }

    if (service.type === 'kv' && (service.data.value === undefined || service.data.value === null)) {
      ConsulUtils.clearService(services, service)
    }

    // Once WATCH_ERROR_LIMIT is reached, reset watcher and instances
    if (service.sequentialErrorCount >= WATCH_ERROR_LIMIT) {
      ConsulUtils.clearService(services, service)
      log.error(`watcher error limit is reached, service=${service.name}`)
    }
  }

  static clearService (
    services: Record<string, IServiceEntry>,
    service: IServiceEntry
  ) {
    service.watcher.end()
    delete services[service.name]
  }
}

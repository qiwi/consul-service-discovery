import { promiseFactory } from './util'
import {
  IConnectionParams,
  IConsulKvValue,
  IEntryPoint,
  IGenerateIdOpts,
  ILogger,
  INormalizedConsulKvValue, IServiceDiscoveryEntry, IServiceEntry
} from './interface'
import { v4 as uuid } from 'uuid'

export const WATCH_ERROR_LIMIT = 20

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
    reject,
    logger: ILogger
  ) {
    if (data.value) {
      service.sequentialErrorCount = 0
      service.data = data
    } else {
      logger.warn(
        `watcher got empty or invalid kv data, service=${service.name}`,
        'data=',
        data
      )
    }
    if ((service.data as INormalizedConsulKvValue).value) {
      resolve(service)
    } else {
      ConsulUtils.handleError(
        service,
        reject,
        new Error('got empty or invalid kv data'),
        services,
        logger
      )
    }
  }

  static handleConnectionParams (
    data: IConnectionParams[],
    services,
    service: IServiceDiscoveryEntry,
    resolve,
    reject,
    logger: ILogger
  ) {

    if (data.length > 0) {
      service.sequentialErrorCount = 0
      service.data.length = 0
      service.data.push(...data)
    } else {
      logger.warn(
        `watcher got empty or invalid connection params, service=${service.name}`,
        'data=',
        data
      )
    }

    if (service.data.length) {
      resolve(service)
    } else {
      ConsulUtils.handleError(
        service,
        reject,
        new Error('got empty or invalid connection params'),
        services,
        logger
      )
    }
  }

  static watchOnChange (
    service: IServiceEntry,
    resolve: Function,
    reject: Function,
    services: Record<string, IServiceEntry>,
    logger: ILogger
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
        ConsulUtils.handleConnectionParams(normalizedData, services, service, resolve, reject, logger)
      } else {
        ConsulUtils.handleKvValue(normalizedData, services, service, resolve, reject, logger)
      }
    })
  }

  static watchOnError (
    service: IServiceEntry,
    reject: Function,
    services: Record<string, IServiceEntry>,
    logger: ILogger
  ): void {
    if (service.watcher.listenerCount('error')) {
      return
    }

    service.watcher.on('error', (err: Error) =>
      ConsulUtils.handleError(service, reject, err, services, logger)
    )
  }

  static handleError (
    service: IServiceEntry,
    reject: Function,
    err: any,
    services: Record<string, IServiceEntry>,
    logger: ILogger
  ): void {
    service.sequentialErrorCount += 1

    logger.error(`watcher error, service=${service.name}`, 'error=', err)
    logger.info(`sequentialErrorCount=${service.sequentialErrorCount}`)
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
      logger.error(`watcher error limit is reached, service=${service.name}`)
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

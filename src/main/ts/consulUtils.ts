import { v4 as uuid } from 'uuid'

import { WATCH_ERROR_LIMIT } from './defaults'
import {
  IConnectionParams,
  IConsulKvValue,
  IEntryPoint,
  IGenerateIdOpts,
  ILogger,
  INormalizedConsulKvValue, IServiceDiscoveryEntry, IServiceEntry
} from './interface'
import { promiseFactory } from './util'

export const ConsulUtils = {
  promisify (method, opts): Promise<any> {
    const { resolve, reject, promise } = promiseFactory()

    method(opts, (err, data) => {
      if (err) {
        reject.call(promise, err)

        return
      }

      resolve.call(promise, data)
    })

    return promise
  },

  generateId ({ serviceName, localAddress = '0.0.0.0', port = '', remoteAddress = '0.0.0.0' }: IGenerateIdOpts) {
    return `${serviceName}-${remoteAddress}-${localAddress}-${port}-${uuid()}`.replace(
      /\./g,
      '-'
    )
  },

  normalizeKvValue (data: IConsulKvValue): INormalizedConsulKvValue {
    return Object.keys(data).reduce((acc, el) => {
      const key = el[0].toLowerCase() + el.slice(1)
      acc[key] = data[el]
      return acc
    }, {} as INormalizedConsulKvValue)
  },

  normalizeEntryPoint (data: IEntryPoint[]): IConnectionParams[] {
    return data.reduce((memo: IConnectionParams[], entryPoint: IEntryPoint) => {
      const address = entryPoint.Service.Address || entryPoint.Node.Address
      const port = entryPoint.Service.Port

      if (address) {
        memo.push({
          host: address,
          port
        })
      }

      return memo
    }, [])
  },

  handleKvValue (
    data: INormalizedConsulKvValue,
    services,
    service: IServiceEntry,
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
      service.iop?.resolve(service)
    } else {
      ConsulUtils.handleError(
        service,
        new Error('got empty or invalid kv data'),
        services,
        logger
      )
    }
  },

  handleConnectionParams (
    data: IConnectionParams[],
    services,
    service: IServiceDiscoveryEntry,
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

    if (service.data.length > 0) {
      service.iop?.resolve(service)
    } else {
      ConsulUtils.handleError(
        service,
        new Error('got empty or invalid connection params'),
        services,
        logger
      )
    }
  },

  watchOnChange (
    service: IServiceEntry,
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

      if (service.iop?.isFulfilled()) {
        service.iop = promiseFactory()
      }

      if (Array.isArray(normalizedData)) {
        //  @ts-ignore
        ConsulUtils.handleConnectionParams(normalizedData, services, service, logger)
      } else {
        ConsulUtils.handleKvValue(normalizedData, services, service, logger)
      }
    })
  },

  watchOnError (
    service: IServiceEntry,
    services: Record<string, IServiceEntry>,
    logger: ILogger
  ): void {
    if (service.watcher.listenerCount('error')) {
      return
    }

    service.watcher.on('error', (err: Error) =>
      ConsulUtils.handleError(service, err, services, logger)
    )
  },

  handleError (
    service: IServiceEntry,
    err: any,
    services: Record<string, IServiceEntry>,
    logger: ILogger
  ): void {
    service.sequentialErrorCount += 1

    logger.error(`watcher error, service=${service.name} type=${service.type}`, 'error=', err)
    logger.info(`sequentialErrorCount=${service.sequentialErrorCount}, service=${service.name} type=${service.type}`)
    service.iop?.reject(err)
    delete service.iop

    // https://github.com/qiwi/consul-service-discovery/issues/81
    // Recreate instance if it hangs
    if (err.isPapi && /request timed out/.test(err.message)) {
      ConsulUtils.clearService(services, service)
      logger.error(`watcher timeout err=${err.message}`)

      return
    }

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
  },

  clearService (
    services: Record<string, IServiceEntry>,
    service: IServiceEntry
  ) {
    if (services[service.name]) {
      service.watcher.end()
      delete services[service.name]
    }
  },
};

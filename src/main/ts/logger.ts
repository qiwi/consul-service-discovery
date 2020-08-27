/** @module @qiwi/consul-service-discovery */

import { ILogger } from './interface'

export const LOG_PREFIX = '[consul discovery]'

export const LOG_LEVELS = ['trace', 'debug', 'info', 'log', 'warn', 'error']

export const createLogger = (logger): ILogger => ({...console, ...(LOG_LEVELS.reduce((memo: Object, level: string) => {
  memo[level] = (...args) => logger[level](LOG_PREFIX, ...args)
  return memo
}, {}))})

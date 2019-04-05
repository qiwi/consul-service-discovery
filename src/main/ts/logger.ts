import { ILogger } from './interface'
import { cxt } from './ctx'

export const LOG_PREFIX = '[consul discovery]'

export const LOG_LEVELS = ['trace', 'debug', 'info', 'log', 'warn', 'error']

export const logger: ILogger = {...console, ...(LOG_LEVELS.reduce((memo: Object, level: string) => {
  memo[level] = (...args) => cxt.logger[level](LOG_PREFIX, ...args)
  return memo
}, {}))}

export default logger

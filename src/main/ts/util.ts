import { cxt } from './ctx'

export { sample } from 'lodash'

export const getDecomposedPromise = () => {
  let _resolve
  let _reject
  let done: boolean = false

  const promise = new cxt.Promise((resolve, reject) => {
    _resolve = resolve
    _reject = reject
  })

  const finalize = (handler) => (data?: any) => {
    if (!done) {
      done = true
      return handler(data)
    }
  }

  const resolve = finalize((data?: any) => _resolve(data))
  const reject = finalize((err?: any) => _reject(err))

  return {
    promise,
    resolve,
    reject
  }
}

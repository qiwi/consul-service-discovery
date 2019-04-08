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

  const finalize = (handler) => () => {
    if (!done) {
      done = true
      return handler()
    }
  }

  const resolve = finalize(() => _resolve())
  const reject = finalize(() => _reject())

  return {
    promise,
    resolve,
    reject
  }
}

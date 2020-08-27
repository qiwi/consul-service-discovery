import { promiseFactory } from '../../main/ts/util'
import { ConsulUtils } from '../../main/ts/consulUtils'

describe('ConsulUtils', () => {
  describe('static', () => {
    describe('#normalizeKvValue', () => {
      it('normalize kv value', async () => {
        const value = {
          CreateIndex: 1,
          ModifyIndex: 2,
          LockIndex: 3,
          Key: 'string',
          Flags: 4,
          Value: 'string'
        }

        expect(ConsulUtils.normalizeKvValue(value)).toMatchObject({
          createIndex: 1,
          modifyIndex: 2,
          lockIndex: 3,
          key: 'string',
          flags: 4,
          value: 'string'
        })
      })
    })
    describe('#handleKvValue', () => {
      it('handle kv value', async () => {
        const value = {
          createIndex: 1,
          modifyIndex: 2,
          lockIndex: 3,
          key: 'string',
          flags: 4,
          value: 'string'
        }
        const { resolve, reject, promise } = promiseFactory()

        ConsulUtils.handleKvValue(value, { service: {} },
          // @ts-ignore
          { type: 'kv', data: {}, name: 'service', promise, sequentialErrorCount: 0, watcher: {} }, resolve, reject, console)
        expect(await promise).toMatchObject({})
      })
    })
    describe('#promisify', () => {
      it('reject on error', async () => {
        const method = (opts, fn) => {
          fn('test reject', null)
        }
        try {
          await ConsulUtils.promisify(method, 'test')
        } catch (e) {
          expect(e).toBe('test reject')
        }
      })
    })
  })

})

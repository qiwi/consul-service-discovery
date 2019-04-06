import ConsulDiscoveryService, { IConnectionParams, ILogger } from '../../main/ts/index'
import { LOG_PREFIX } from '../../main/ts/logger'
import cxt from '../../main/ts/ctx'
import { EventEmitter } from 'events'
import * as Bluebird from 'bluebird'
import { noop } from 'lodash'

interface IConsulClientMock {
  watch: (method: any, options: any) => void
  health: () => any
}

class ConsulClientMockEmmiter extends EventEmitter {
  end () {
    return
  }
}

class ConsulClientMock implements IConsulClientMock {
  _host: string
  _port: string

  constructor (
    host: string,
    port: string
  ) {
    this._host = host
    this._port = port
  }

  watch (
    method,
    options
  ) {
    return new ConsulClientMockEmmiter()
  }

  health () {
    return {
      service: noop
    }
  }

}

const onChangeResponse: any = [
  {
    Service: {
      Address: '0.0.0.0',
      Port: '8888'
    }
  }
]

const testParams: IConnectionParams = {
  host: '0.0.0.0',
  port: '8888'
}

const expectedError = 'test error'

const fakeLogger: ILogger = { ...console }

describe('ConsulServiceDiscovery', () => {
  describe('constructor', () => {
    it('returns proper instance', () => {
      const service = new ConsulDiscoveryService(
        testParams,
        ConsulClientMock
      )

      expect(service).toBeInstanceOf(ConsulDiscoveryService)
      expect(service.instancesWatcher).not.toBeUndefined()
    })
  })

  describe('prototype', () => {
    describe('#init', () => {
      it('instancesWatcher updates service conn data through subscription (onChange)', async () => {

        expect.assertions(1)
        const discoveryService = new ConsulDiscoveryService(
          testParams,
          ConsulClientMock
        )

        const serviceConnectionParams = discoveryService.getConnectionParams('testService')
        const instantWathcer = discoveryService.instancesWatcher['testService']

        instantWathcer.on('change', noop)
        instantWathcer.emit('change', onChangeResponse)

        // tslint:disable-next-line:no-floating-promises
        return expect(serviceConnectionParams).resolves.toEqual(testParams)

      }, 3000)

      it('rejects the result promise once attempt limit is reached (onError)', async () => {
        expect.assertions(1)
        const discoveryService = new ConsulDiscoveryService(
          testParams,
          ConsulClientMock
        )
        const serviceConnectionParams = discoveryService.getConnectionParams('testService')
        const instantWathcer = discoveryService.instancesWatcher['testService']
        instantWathcer.on('error', noop)
        for (let i = 0; i <= 20; i++) {
          instantWathcer.emit('error', expectedError)
        }

        // tslint:disable-next-line:no-floating-promises
        return expect(serviceConnectionParams).rejects.toEqual(undefined)
      }, 3000)
    })
  })

  describe('static', () => {
    describe('#configure', () => {
      it('supports logger customization', async () => {
        const spy = jest.spyOn(fakeLogger, 'debug')
        ConsulDiscoveryService.configure({ logger: fakeLogger })

        const res = new ConsulDiscoveryService(
          testParams,
          ConsulClientMock
        ).init('foo')

        // tslint:disable-next-line:no-floating-promises
        expect(res).resolves.toEqual(undefined)
        expect(cxt.logger).toBe(fakeLogger)
        expect(spy).toHaveBeenCalledWith(LOG_PREFIX, 'initialized')
      })

      it('supports custom Promises', async () => {
        ConsulDiscoveryService.configure({ Promise: Bluebird })

        const res = new ConsulDiscoveryService(
          testParams,
          ConsulClientMock
        )
          .init('bar')

        // tslint:disable-next-line:no-floating-promises
        expect(res).toBeInstanceOf(Bluebird)
        expect(cxt.Promise).toBe(Bluebird)
        // tslint:disable-next-line:no-floating-promises
        expect(res).resolves.toEqual(undefined)
      })
    })
  })
})

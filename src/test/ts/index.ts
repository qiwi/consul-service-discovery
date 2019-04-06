import ConsulDiscoveryService, { IConnectionParams, ILogger } from '../../main/ts/index'
import {LOG_PREFIX} from '../../main/ts/logger'
import cxt from '../../main/ts/ctx'
import { EventEmitter } from 'events'
import * as Bluebird from 'bluebird'

interface IConsulClientMock {
  watch: (method: any, options: any) => void
  health: () => any
}

class consulClientMockEmmiter extends EventEmitter {
  end() {
    return
  }
}

class consulClientMock implements IConsulClientMock {
  _host: string
  _port: string

  constructor(
    host: string,
    port: string
  ) {
    this._host = host
    this._port = port
  }

  watch(
    method,
    options
  ) {
    return new consulClientMockEmmiter()
  }

  health() {
    return {
      service: () => {}
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

const fakeLogger: ILogger = {
  trace() {},
  error() {},
  warn() {},
  log() {},
  info() {},
  debug() {}
}

describe('ConsulServiceDiscovery', () => {
  test('on change', async () => {

    expect.assertions(1)
    const discoveryService = new ConsulDiscoveryService(
      testParams,
      consulClientMock
    )

    const serviceConnectionParams = discoveryService.getConnectionParams('testService')
    const instantWathcer = discoveryService.instancesWatcher['testService']

    instantWathcer.on('change', () => {})
    instantWathcer.emit('change', onChangeResponse)
    expect(serviceConnectionParams).resolves.toEqual(testParams)

  }, 3000)

  test('on error', async () => {
    expect.assertions(1)
    const discoveryService = new ConsulDiscoveryService(
      testParams,
      consulClientMock
    )
    const serviceConnectionParams = discoveryService.getConnectionParams('testService')
    const instantWathcer = discoveryService.instancesWatcher['testService']
    instantWathcer.on('error', () => {})
    for (let i = 0; i <= 20; i++) {
      instantWathcer.emit('error', expectedError)
    }
    expect(serviceConnectionParams).rejects.toEqual(undefined)
  }, 3000)

  describe('constructor', () => {
    it('returns proper instance', () => {
      const service = new ConsulDiscoveryService(
        testParams,
        consulClientMock
      )

      expect(service).toBeInstanceOf(ConsulDiscoveryService)
      expect(service.getConnectionParams).not.toBeUndefined()
    })


  })

  describe('static', () => {
    describe('#configure', () => {
      it('supports logger customization', () => {
        const spy = jest.spyOn(fakeLogger, 'debug')
        ConsulDiscoveryService.configure({logger: fakeLogger})

        new ConsulDiscoveryService(
          testParams,
          consulClientMock
        ).init('foo')

        expect(cxt.logger).toBe(fakeLogger)
        expect(spy).toHaveBeenCalledWith(LOG_PREFIX, 'initialized');
      })

      it('supports custom Promises', () => {
        ConsulDiscoveryService.configure({Promise: Bluebird})

        expect(cxt.Promise).toBe(Bluebird)
        expect(new ConsulDiscoveryService(
          testParams,
          consulClientMock
        ).init('bar')).toBeInstanceOf(Bluebird)

      })
    })
  })
})

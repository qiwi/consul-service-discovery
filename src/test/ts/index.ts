import ConsulDiscoveryService, {
  IConnectionParams,
  IConsulClient, IConsulClientFactory,
  IConsulServiceHealth,
  ILogger
} from '../../main/ts/index'
import { LOG_PREFIX } from '../../main/ts/logger'
import cxt from '../../main/ts/ctx'
import { EventEmitter } from 'events'
import * as Bluebird from 'bluebird'
import * as Consul from 'consul'
import { noop } from 'lodash'

class FakeWatcher extends EventEmitter {
  end = noop
}

class ConsulClient implements IConsulClient {
  health: IConsulServiceHealth
  watch () {
    return new FakeWatcher()
  }
  constructor (opts?: Object | undefined) {
    this.health = { service: null }
  }
}

const ConsulClientFactory: IConsulClientFactory = (opts?: Consul.ConsulOptions) => {
  return new ConsulClient(opts)
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
  beforeAll(() => ConsulDiscoveryService.configure({ Consul: ConsulClientFactory }))

  describe('constructor', () => {
    it('returns proper instance', () => {
      const service = new ConsulDiscoveryService(testParams)

      expect(service).toBeInstanceOf(ConsulDiscoveryService)
      expect(service.instancesWatcher).not.toBeUndefined()
    })
  })

  describe('prototype', () => {
    describe('#getWatcher', () => {
      it('returns a new one Consul.Watcher instance', () => {
        const discoveryService = new ConsulDiscoveryService(testParams)
        const watcher = discoveryService.getWatcher('foo')

        expect(watcher).toBeInstanceOf(EventEmitter)
      })
    })

    describe('#init', () => {
      it('instancesWatcher updates service conn data through subscription (onChange)', async () => {

        expect.assertions(1)
        const discoveryService = new ConsulDiscoveryService(testParams)

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
          testParams
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

        const res = new ConsulDiscoveryService(testParams).init('foo')

        // tslint:disable-next-line:no-floating-promises
        expect(res).resolves.toEqual(undefined)
        expect(cxt.logger).toBe(fakeLogger)
        expect(spy).toHaveBeenCalledWith(LOG_PREFIX, 'watcher initialized, service=foo')
      })

      it('supports custom Promises', async () => {
        ConsulDiscoveryService.configure({ Promise: Bluebird })

        const res = new ConsulDiscoveryService(testParams).init('bar')

        // tslint:disable-next-line:no-floating-promises
        expect(res).toBeInstanceOf(Bluebird)
        expect(cxt.Promise).toBe(Bluebird)
        // tslint:disable-next-line:no-floating-promises
        expect(res).resolves.toEqual(undefined)
      })

      it('supports custom consul client factory', () => {
        ConsulDiscoveryService.configure({ Consul: ConsulClientFactory })

        expect(cxt.Consul).toBe(ConsulClientFactory)
      })
    })
  })
})

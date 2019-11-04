import def, {
  ConsulDiscoveryService,
  IConnectionParams, IConsulAgent, IConsulAgentService,
  IConsulClient,
  IConsulClientFactory,
  IConsulServiceHealth,
  ILogger,
  WATCH_ERROR_LIMIT
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

class FakeAgentService implements IConsulAgentService {
  entries: Array<any>
  constructor() {
    this.entries = []
  }
  register<TData> (opts: Consul.Agent.Service.RegisterOptions, cb: Consul.Callback<TData>): void {
    this.entries.push(opts)

    cb()

    return
  }
}

class ConsulClient implements IConsulClient {
  health: IConsulServiceHealth
  agent: IConsulAgent
  watch () {
    return new FakeWatcher()
  }
  constructor (opts?: Object | undefined) {
    this.health = { service: null }
    this.agent = {
      service: new FakeAgentService()
    }
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
  ConsulDiscoveryService.configure({ Consul: ConsulClientFactory })

  it('exposes ConsulDiscoveryService as module default', () => {
    expect(def).toBe(ConsulDiscoveryService)
  })

  describe('constructor', () => {
    it('returns proper instance', () => {
      const service = new ConsulDiscoveryService(testParams)

      expect(service).toBeInstanceOf(ConsulDiscoveryService)
    })
  })

  describe('prototype', () => {
    describe('#register', async () => {
      const service = new ConsulDiscoveryService(testParams)
      const name = 'self'
      const address = '127.0.0.1'
      const opts = {
        name,
        address
      }


      const res = await service.register(opts)

      expect(res).toBeTruthy()
    })

    describe('#getWatcher', () => {
      it('returns a new one Consul.Watcher instance', () => {
        const discoveryService = new ConsulDiscoveryService(testParams)
        const watcher = discoveryService.getWatcher('foo')

        expect(watcher).toBeInstanceOf(EventEmitter)
      })
    })

    describe('#getService', () => {
      const discoveryService = new ConsulDiscoveryService(testParams)

      it('creates new service entry', () => {
        const service = discoveryService.getService('foobar')

        discoveryService.services['foobar'].watcher.emit('change', onChangeResponse)

        expect(service).toEqual({
          name: 'foobar',
          watcher: expect.any(FakeWatcher),
          connections: [],
          sequentialErrorCount: 0
        })
      })

      it('returns cached service entry if exists', () => {
        const service = discoveryService.services['foobar']

        expect(service).not.toBeUndefined()

        expect(discoveryService.getService('foobar')).toBe(service)
      })
    })

    describe('#ready', () => {
      it('reuses service entry\'s promise', () => {
        const discoveryService = new ConsulDiscoveryService(testParams)

        // tslint:disable-next-line:no-floating-promises
        expect(discoveryService.ready('foo')).toBe(discoveryService.ready('foo'))
      })
    })

    describe('#getConnectionParams', () => {
      it('resolves service conn params through watcher subscription (onChange)', async () => {
        expect.assertions(1)
        const discoveryService = new ConsulDiscoveryService(testParams)

        const serviceConnectionParams = discoveryService.getConnectionParams('testService')
        const watcher = discoveryService.services['testService'].watcher

        watcher.emit('change', onChangeResponse)

        // tslint:disable-next-line:no-floating-promises
        return expect(serviceConnectionParams).resolves.toEqual(testParams)

      }, 1000)

      it('rejects the result promise once attempt limit is reached (onError)', async () => {
        expect.assertions(1)
        const discoveryService = new ConsulDiscoveryService(testParams)
        const serviceConnectionParams = discoveryService.getConnectionParams('testService')
        const watcher = discoveryService.services['testService'].watcher

        for (let i = 0; i <= WATCH_ERROR_LIMIT; i++) {
          watcher.emit('error', expectedError)
        }

        // tslint:disable-next-line:no-floating-promises
        return expect(serviceConnectionParams).rejects.toEqual(expectedError)
      }, 1000)

      it('rejects the result promise once attempt limit is reached (onChange)', async () => {
        const discoveryService = new ConsulDiscoveryService(testParams)
        const serviceConnectionParams = discoveryService.getConnectionParams('testService')
        const watcher = discoveryService.services['testService'].watcher

        for (let i = 0; i <= WATCH_ERROR_LIMIT; i++) {
          watcher.emit('change', [])
        }

        // tslint:disable-next-line:no-floating-promises
        return expect(serviceConnectionParams).rejects.toEqual(new Error('got empty or invalid connection params'))
      }, 1000)

      it('resolves promise with the previous valid response', async () => {
        const discoveryService = new ConsulDiscoveryService(testParams)
        const serviceConnectionParams = discoveryService.getConnectionParams('testService')
        const watcher = discoveryService.services['testService'].watcher

        watcher.emit('change', [
          {
            Service: {
              Port: '8888'
            },
            Node: {
              Address: '0.0.0.0'
            }
          }
        ])
        watcher.emit('change', [])

        // tslint:disable-next-line:no-floating-promises
        return expect(serviceConnectionParams).resolves.toEqual(testParams)
      }, 1000)
    })
  })

  describe('static', () => {
    describe('#configure', () => {
      it('supports logger customization', async () => {
        const spy = jest.spyOn(fakeLogger, 'debug')
        ConsulDiscoveryService.configure({ logger: fakeLogger })

        const res = new ConsulDiscoveryService(testParams).ready('foo')

        // tslint:disable-next-line:no-floating-promises
        expect(res).resolves.toEqual(undefined)
        expect(cxt.logger).toBe(fakeLogger)
        expect(spy).toHaveBeenCalledWith(LOG_PREFIX, 'watcher initialized, service=foo')
      })

      it('supports custom Promises', async () => {
        ConsulDiscoveryService.configure({ Promise: Bluebird })

        const res = new ConsulDiscoveryService(testParams).ready('bar')

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

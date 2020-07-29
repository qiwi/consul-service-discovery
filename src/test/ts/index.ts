import def, {
  ConsulDiscoveryService,
  IConnectionParams, IConsulAgent, IConsulAgentService,
  IConsulClient,
  IConsulClientFactory,
  IConsulServiceHealth,
  ILogger,
  TConsulAgentCheckListOptions,
  TConsulAgentServiceRegisterOptions
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
  entries: { [key: string]: any}

  constructor () {
    this.entries = {}
  }

  register<TData> (opts: TConsulAgentServiceRegisterOptions, cb: Consul.Callback<TData>): void {
    this.entries[opts.id || opts.name] = opts

    cb()
  }

  list<TData> (opts: TConsulAgentCheckListOptions, cb: Consul.Callback<any>): void {
    cb(undefined, this.entries)
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
    describe('#register', () => {
      it('returns void on success', async () => {
        const service = new ConsulDiscoveryService(testParams)
        const name = 'self'
        const address = '127.0.0.1'
        const opts = {
          name,
          address
        }
        const res = await service.register(opts)

        expect(res).toBeUndefined()
      })

      it('provides continuous (repeatable) registration', done => {
        const service = new ConsulDiscoveryService(testParams)
        const name = 'self'
        const address = '127.0.0.1'
        const opts = {
          name,
          address
        }
        // @ts-ignore
        const _registerSpy = jest.spyOn(service, '_register')
        // @ts-ignore
        const _listSpy = jest.spyOn(service, 'list')
        // @ts-ignore
        const _registerServiceSpy = jest.spyOn(service._consul.agent.service, 'register')

        service.register(opts, 10)

        // @ts-ignore
        expect(service._id).not.toBeUndefined()
        expect(_registerSpy).toHaveBeenCalledTimes(1)

        setTimeout(() => {
          // @ts-ignore
          service._consul.agent.service.entries = {}
        }, 25)

        setTimeout(() => {
          expect(_registerServiceSpy).toHaveBeenCalledTimes(2)
          expect(_registerSpy.mock.calls.length).toBeGreaterThanOrEqual(5)
          expect(_registerSpy.mock.calls.length).toBe(_listSpy.mock.calls.length)
          done()
        }, 60)
      })
    })

    describe('#list', () => {
      it('returns services list', async () => {
        const service = new ConsulDiscoveryService(testParams)
        const list = {
          'example-api123-127-0-0-1-0-0-0-0-8500-2238a091-a525-49b6-88a2-e755189cbe50':
          {
            ID:
              'example-api123-127-0-0-1-0-0-0-0-8500-2238a091-a525-49b6-88a2-e755189cbe50',
            Service: 'example-api123',
            Tags: [],
            Meta: {},
            Port: 8500,
            Address: '127.0.0.1',
            Weights: { Passing: 1, Warning: 1 },
            EnableTagOverride: false
          },
          'example-api123-127-0-0-1-0-0-0-0-8500-43ef28fa-bf73-4c4e-9a1e-b45cba92152b':
          {
            ID:
              'example-api123-127-0-0-1-0-0-0-0-8500-43ef28fa-bf73-4c4e-9a1e-b45cba92152b',
            Service: 'example-api123',
            Tags: [],
            Meta: {},
            Port: 8500,
            Address: '127.0.0.1',
            Weights: { Passing: 1, Warning: 1 },
            EnableTagOverride: false
          },
          'example-api123-127-0-0-1-0-0-0-0-8500-4bf34948-12c6-4feb-aa7b-8ce3ff278cd8':
          {
            ID:
              'example-api123-127-0-0-1-0-0-0-0-8500-4bf34948-12c6-4feb-aa7b-8ce3ff278cd8',
            Service: 'example-api123',
            Tags: [],
            Meta: {},
            Port: 8500,
            Address: '127.0.0.1',
            Weights: { Passing: 1, Warning: 1 },
            EnableTagOverride: false
          }
        }

        // @ts-ignore
        service._consul.agent.service.entries = list

        const res = await service.list()

        expect(res).toEqual(list)
      })
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
          connections: []
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

    describe('#getServiceConnections', () => {
      it('resolves available service connections', async () => {
        const discoveryService = new ConsulDiscoveryService(testParams)
        const promise = discoveryService.getConnections('service')
        const watcher = discoveryService.services['service'].watcher
        watcher.emit('change', [
          {
            Service: {
              Address: '10.10.0.1',
              Port: '8888'
            }
          },
          {
            Service: {
              Address: '10.10.0.2',
              Port: '8888'
            }
          }
        ])

        const serviceConnections = await promise

        expect(serviceConnections).toEqual([
          { host:  '10.10.0.1', port: '8888' },
          { host:  '10.10.0.2', port: '8888' }
        ])
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

      it('is compatible with `await` operator', async () => {
        const discoveryService = new ConsulDiscoveryService(testParams)
        const promise = discoveryService.getConnectionParams('testService')
        const watcher = discoveryService.services['testService'].watcher
        watcher.emit('change', onChangeResponse)

        const serviceConnectionParams = await promise

        expect(serviceConnectionParams).toEqual(testParams)
      })

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

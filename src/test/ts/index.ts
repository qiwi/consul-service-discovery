import { EventEmitter } from 'events'

import def, { ConsulDiscoveryService, WATCH_ERROR_LIMIT } from '../../main/ts/index'
import {
  ConsulClientFactory,
  expectedError,
  FakeWatcher,
  onChangeResponse,
  onChangeResponseKv,
  testParams
} from '../stub/mocks'

describe('ConsulServiceDiscovery', () => {
  it('exposes ConsulDiscoveryService as module default', () => {
    expect(def).toBe(ConsulDiscoveryService)
  })

  describe('constructor', () => {
    it('returns proper instance', () => {
      const service = new ConsulDiscoveryService(testParams, { Consul: ConsulClientFactory })

      expect(service).toBeInstanceOf(ConsulDiscoveryService)
    })
  })

  describe('prototype', () => {
    describe('#setKv', () => {
      it('', async () => {
        const service = new ConsulDiscoveryService(testParams, { Consul: ConsulClientFactory })
        expect(await service.setKv({ key: 'key', value: 'value' })).toEqual(true)
      })
    })

    describe('#register', () => {
      it('returns void on success', async () => {
        const service = new ConsulDiscoveryService(testParams, { Consul: ConsulClientFactory })
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
        const service = new ConsulDiscoveryService(testParams, { Consul: ConsulClientFactory })
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
        const service = new ConsulDiscoveryService(testParams, { Consul: ConsulClientFactory })
        const list = {
          'example-api123-127-0-0-1-0-0-0-0-8500-2238a091-a525-49b6-88a2-e755189cbe50':
          {
            ID:
              'example-api123-127-0-0-1-0-0-0-0-8500-2238a091-a525-49b6-88a2-e755189cbe50',
            // eslint-disable-next-line sonarjs/no-duplicate-string
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
        const discoveryService = new ConsulDiscoveryService(testParams, { Consul: ConsulClientFactory })
        const watcher = discoveryService.getWatcher('foo', 'discovery')

        expect(watcher).toBeInstanceOf(EventEmitter)
      })
    })

    describe('#getService', () => {
      const discoveryService = new ConsulDiscoveryService(testParams, { Consul: ConsulClientFactory })

      it('creates new discovery service entry', () => {
        const service = discoveryService.getService('foobar', 'discovery')

        discoveryService.services.discovery['foobar'].watcher.emit('change', onChangeResponse)

        expect(service).toEqual({
          name: 'foobar',
          type: 'discovery',
          watcher: expect.any(FakeWatcher),
          data: [],
          sequentialErrorCount: 0
        })
      })

      it('creates new kv service entry', () => {
        const service = discoveryService.getService('foobarbaz', 'kv')

        discoveryService.services.kv['foobarbaz'].watcher.emit('change', onChangeResponseKv)

        expect(service).toEqual({
          name: 'foobarbaz',
          type: 'kv',
          watcher: expect.any(FakeWatcher),
          data: {},
          sequentialErrorCount: 0
        })
      })

      it('returns cached service entry if exists', () => {
        const service = discoveryService.services.discovery['foobar']

        expect(service).not.toBeUndefined()

        expect(discoveryService.getService('foobar', 'discovery')).toBe(service)
      })
    })

    describe('#ready', () => {
      it('reuses service entry\'s promise', () => {
        const discoveryService = new ConsulDiscoveryService(testParams, { Consul: ConsulClientFactory })

        // tslint:disable-next-line:no-floating-promises
        expect(discoveryService.ready('foo', 'discovery')).toBe(discoveryService.ready('foo', 'discovery'))
      })
    })

    describe('#getKv', () => {
      it('getKv works correctly', async () => {
        const discoveryService = new ConsulDiscoveryService(testParams, { Consul: ConsulClientFactory })
        const promise = discoveryService.getKv('kvservice')
        const watcher = discoveryService.services.kv['kvservice'].watcher
        expect(watcher).not.toBeUndefined()
        expect(promise).not.toBeUndefined()
      })
    })

    describe('#getServiceConnections', () => {
      it('resolves available service connections', async () => {
        const discoveryService = new ConsulDiscoveryService(testParams, { Consul: ConsulClientFactory })
        const promise = discoveryService.getConnections('service')
        const watcher = discoveryService.services.discovery['service'].watcher
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
          { host: '10.10.0.1', port: '8888' },
          { host: '10.10.0.2', port: '8888' }
        ])
      })
    })

    describe('#getConnectionParams', () => {
      it('resolves service conn params through watcher subscription (onChange)', async () => {
        expect.assertions(1)
        const discoveryService = new ConsulDiscoveryService(testParams, { Consul: ConsulClientFactory })

        const serviceConnectionParams = discoveryService.getConnectionParams('testService')
        const watcher = discoveryService.services.discovery['testService'].watcher

        watcher.emit('change', onChangeResponse)

        // tslint:disable-next-line:no-floating-promises
        return expect(serviceConnectionParams).resolves.toEqual(testParams)

      }, 1000)

      it('is compatible with `await` operator', async () => {
        const discoveryService = new ConsulDiscoveryService(testParams, { Consul: ConsulClientFactory })
        const promise = discoveryService.getConnectionParams('testService')
        const watcher = discoveryService.services.discovery['testService'].watcher
        watcher.emit('change', onChangeResponse)

        const serviceConnectionParams = await promise

        expect(serviceConnectionParams).toEqual(testParams)
      })

      it('rejects the result promise once attempt limit is reached (onError)', async () => {
        expect.assertions(1)
        const discoveryService = new ConsulDiscoveryService(testParams, { Consul: ConsulClientFactory })
        const serviceConnectionParams = discoveryService.getConnectionParams('testService')
        const watcher = discoveryService.services.discovery['testService'].watcher

        for (let i = 0; i <= WATCH_ERROR_LIMIT; i++) {
          watcher.emit('error', expectedError)
        }

        // tslint:disable-next-line:no-floating-promises
        return expect(serviceConnectionParams).rejects.toEqual(expectedError)
      }, 1000)

      it('rejects the result promise once attempt limit is reached (onChange)', async () => {
        const discoveryService = new ConsulDiscoveryService(testParams, { Consul: ConsulClientFactory })
        const serviceConnectionParams = discoveryService.getConnectionParams('testService')
        const watcher = discoveryService.services.discovery['testService'].watcher

        for (let i = 0; i <= WATCH_ERROR_LIMIT; i++) {
          watcher.emit('change', [])
        }

        // tslint:disable-next-line:no-floating-promises
        return expect(serviceConnectionParams).rejects.toEqual(new Error('got empty or invalid connection params'))
      }, 1000)

      it('resolves promise with the previous valid response', async () => {
        const discoveryService = new ConsulDiscoveryService(testParams, { Consul: ConsulClientFactory })
        const serviceConnectionParams = discoveryService.getConnectionParams('testService')
        const watcher = discoveryService.services.discovery['testService'].watcher

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
})

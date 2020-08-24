import { EventEmitter } from 'events'
import { noop } from 'lodash'
import {
  IConnectionParams,
  IConsulAgent,
  IConsulAgentService,
  IConsulClient, IConsulKvValue, IConsulServiceHealth, ILogger,
  TConsulAgentCheckListOptions,
  TConsulAgentServiceRegisterOptions,
  IConsulClientFactory
} from '../../main/ts'
import * as Consul from 'consul'

export class FakeWatcher extends EventEmitter {
  end = noop
}

export class FakeAgentService implements IConsulAgentService {
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

export class ConsulClient implements IConsulClient {
  health: IConsulServiceHealth
  agent: IConsulAgent
  kv: any

  watch () {
    return new FakeWatcher()
  }

  constructor (opts?: Object | undefined) {
    this.health = { service: null }
    this.kv = {
      get: null,
      set: (_, cb) => {
        cb(null, true)
      }
    }
    this.agent = {
      service: new FakeAgentService()
    }
  }
}

export const onChangeResponse: any = [
  {
    Service: {
      Address: '0.0.0.0',
      Port: '8888'
    }
  }
]

export const onChangeResponseKv: IConsulKvValue = {
  CreateIndex: 1,
  ModifyIndex: 1,
  LockIndex: 1,
  Key: 'string',
  Flags: 1,
  Value: 'string'
}

export const testParams: IConnectionParams = {
  host: '0.0.0.0',
  port: '8888'
}

export const expectedError = 'test error'

export const fakeLogger: ILogger = { ...console }

export const ConsulClientFactory: IConsulClientFactory = (opts?: Consul.ConsulOptions) => {
  return new ConsulClient(opts)
}

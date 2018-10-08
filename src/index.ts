import * as Consul from 'consul'
import * as _ from 'lodash'

export interface IConnectionParams {
    post: string
    host: string
}

export interface IConsulService {
    getConnectionParams(serviceName: string): Promise<IConnectionParams>
}

export interface IConnectionParams {
    host: string;
    port: string;
}

export interface IConsulWatchOptions {
    service: string
    passing: boolean
}

export interface IEntryPoint {
    Service: {
        Address: string
        Port: string
    }
}

export default class ConsulService implements IConsulService {
    protected _consul: any
    protected _instances: any = {}
    protected _instancesWatcher: any
    protected _attempts: number = 0

    constructor(
        consulConnectionParams: IConnectionParams
    ) {
        this._consul = new Consul({
            host: consulConnectionParams.host,
            port: consulConnectionParams.port.toString()
        })
    }

    async init(serviceName: string): Promise<void> {
        let resolveInit: (value?: void | PromiseLike<void>) => void
        let rejectInit: (reason?: any) => void
        const finallize = _.once((handler: any): void => handler())

        const promise = new Promise<void>((resolve, reject) => {
            resolveInit = resolve
            rejectInit = reject
        })

        this._instancesWatcher = this._consul.watch({
            method: this._consul.health.service,
            options: {
                service: serviceName,
                passing: true
            } as IConsulWatchOptions,
            backoffMax: 10000
        })
        .on('change', (data: IEntryPoint[]) => {
            this._instances[serviceName] = []
            data.forEach((entryPoint: IEntryPoint) => {
                this._instances[serviceName].push({
                    host: entryPoint.Service.Address,
                    port: entryPoint.Service.Port
                })
            })
            if (this._instances[serviceName]) {
                finallize(resolveInit)
            }
        })
        .on('error', (err: Error) => {
            console.error('Consul client error:', err)
            this._attempts += 1
            // wait for 20 errors and reset watch and instanses
            if(this._attempts >= 20) {
                this._attempts = 0
                this._instances[serviceName] = {}
                this._instancesWatcher.end()
                finallize(rejectInit)
            }
        })
        return promise
    }

    async getConnectionParams(serviceName: string): Promise<IConnectionParams> {
        if (!this._instances[serviceName]) {
            await this.init(serviceName)
        }
        const index = Math.floor(Math.random() * this._instances[serviceName].length)
        return this._instances[serviceName][index]
    }
}

# Consul service discovery
[![CI](https://github.com/qiwi/consul-service-discovery/actions/workflows/ci.yaml/badge.svg?branch=master)](https://github.com/qiwi/consul-service-discovery/actions/workflows/ci.yaml)
[![npm (tag)](https://img.shields.io/npm/v/@qiwi/consul-service-discovery/latest.svg)](https://www.npmjs.com/package/@qiwi/consul-service-discovery)
[![Maintainability](https://api.codeclimate.com/v1/badges/585c9532e7570ecb9c95/maintainability)](https://codeclimate.com/github/qiwi/consul-service-discovery/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/585c9532e7570ecb9c95/test_coverage)](https://codeclimate.com/github/qiwi/consul-service-discovery/test_coverage)
[![CodeStyle](https://img.shields.io/badge/code%20style-lint--config--qiwi-brightgreen.svg)](https://github.com/qiwi/lint-config-qiwi)

Consul service discovery helper. 

## Install
```bash
  npm i @qiwi/consul-service-discovery
  yarn add @qiwi/consul-service-discovery
```

## Usage
```javascript
import ConsulServiceDiscovery from '@qiwi/consul-service-discovery'

const discovery = new ConsulServiceDiscovery({
  host: '0.0.0.0',  // local consul client host
  port: 8000        // and port
})
const targetServiceName = 'example-api' // registered service
const serviceConnectionParams = await discovery.getConnectionParams(targetServiceName)

console.log(serviceConnectionParams) // { host: example-api-1234.qiwi.com, post: 8000 }
```

## Configure
You may override some inner lib deps like logger (console by default) or Promise implementations:
```javascript
ConsulServiceDiscovery.configure({
  Promise,  // Bluebird
  logger,   // log4js
  Consul    // consul client factory
})
```

## License
[MIT](./LICENSE)

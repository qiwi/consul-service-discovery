# Consul service discovery
[![buildStatus](https://api.travis-ci.com/qiwi/consul-service-discovery.svg?branch=master)](https://travis-ci.com/qiwi/consul-service-discovery)
[![dependencyStatus](https://img.shields.io/david/qiwi/consul-service-discovery.svg?maxAge=3600)](https://david-dm.org/qiwi/consul-service-discovery)
[![devDependencyStatus](https://img.shields.io/david/dev/qiwi/consul-service-discovery.svg?maxAge=3600)](https://david-dm.org/qiwi/consul-service-discovery)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)
[![Maintainability](https://api.codeclimate.com/v1/badges/585c9532e7570ecb9c95/maintainability)](https://codeclimate.com/github/qiwi/consul-service-discovery/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/585c9532e7570ecb9c95/test_coverage)](https://codeclimate.com/github/qiwi/consul-service-discovery/test_coverage)

Consul service discovery helper.

## Install
```bash
  npm i @qiwi/consul-service-discovery
  yarn add @qiwi/consul-service-discovery
```

## Usage
```javascript
import ConsulDiscoveryService from '@qiwi/consul-service-discovery'

const discoveryService = new ConsulDiscoveryService({
  host: '0.0.0.0',  // local consul client host
  port: 8000        // and port
})
const targetServiceName = 'example-api' // registered service
const serviceConnectionParams = await discoveryService.getConnectionParams(targetServiceName)

console.log(serviceConnectionParams) // { host: example-api-1234.qiwi.com, post: 8000 }
```

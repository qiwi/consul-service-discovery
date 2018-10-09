# @qiwi/consul-service-discovery
Consul service discovery helper.

## Install
```bash
  npm i consul-service-discovery
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

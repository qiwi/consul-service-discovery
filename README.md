# consul-watcher
Demo consul client

# Usage

```
import ConsulClient from 'consul'

const exampleConfig = {
    host: 0.0.0.0,
    port: 8000
}

const Consul = new ConsulClient(exampleConfig)

// "exampleService" - name of your service in consul
const ConnectionParams = await Consul.getConnectionParams('exampleService')

console.log(ConnectionParams) // { host: example.service.com, post: 8000 }
```

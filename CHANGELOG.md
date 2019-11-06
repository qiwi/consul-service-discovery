# [1.6.0](https://github.com/qiwi/consul-service-discovery/compare/v1.5.0...v1.6.0) (2019-11-06)


### Features

* expose list method ([6f5d8c8](https://github.com/qiwi/consul-service-discovery/commit/6f5d8c8))

# [1.5.0](https://github.com/qiwi/consul-service-discovery/compare/v1.4.1...v1.5.0) (2019-11-04)


### Features

* add register method ([e59f4c6](https://github.com/qiwi/consul-service-discovery/commit/e59f4c6)), closes [#1](https://github.com/qiwi/consul-service-discovery/issues/1)

## [1.4.1](https://github.com/qiwi/consul-service-discovery/compare/v1.4.0...v1.4.1) (2019-09-15)


### Performance Improvements

* migrate to inside-out-promise ([10cfb99](https://github.com/qiwi/consul-service-discovery/commit/10cfb99))

# [1.4.0](https://github.com/qiwi/consul-service-discovery/compare/v1.3.1...v1.4.0) (2019-08-24)


### Bug Fixes

* **package:** add missed dev deps ([787f4c6](https://github.com/qiwi/consul-service-discovery/commit/787f4c6))


### Features

* add flowtype libdefs ([a35ee83](https://github.com/qiwi/consul-service-discovery/commit/a35ee83)), closes [#18](https://github.com/qiwi/consul-service-discovery/issues/18)
* expose ConsulDiscoveryService separately ([de0a612](https://github.com/qiwi/consul-service-discovery/commit/de0a612))

## [1.3.1](https://github.com/qiwi/consul-service-discovery/compare/v1.3.0...v1.3.1) (2019-04-08)


### Bug Fixes

* **package:** broken main ref ([5c5217a](https://github.com/qiwi/consul-service-discovery/commit/5c5217a)), closes [#4](https://github.com/qiwi/consul-service-discovery/issues/4)

# [1.3.0](https://github.com/qiwi/consul-service-discovery/compare/v1.2.1...v1.3.0) (2019-04-08)


### Features

* use the previous valid conn data if onChange returns empty ([24542f7](https://github.com/qiwi/consul-service-discovery/commit/24542f7)), closes [#10](https://github.com/qiwi/consul-service-discovery/issues/10)

## [1.2.1](https://github.com/qiwi/consul-service-discovery/compare/v1.2.0...v1.2.1) (2019-04-08)


### Bug Fixes

* fix sequential error counting ([b2b9af8](https://github.com/qiwi/consul-service-discovery/commit/b2b9af8)), closes [#8](https://github.com/qiwi/consul-service-discovery/issues/8) [#9](https://github.com/qiwi/consul-service-discovery/issues/9)

# [1.2.0](https://github.com/qiwi/consul-service-discovery/compare/v1.1.5...v1.2.0) (2019-04-07)


### Features

* add Promise customization ([0a6426b](https://github.com/qiwi/consul-service-discovery/commit/0a6426b)), closes [#3](https://github.com/qiwi/consul-service-discovery/issues/3)
* add support for custom consul clients ([ba59f96](https://github.com/qiwi/consul-service-discovery/commit/ba59f96)), closes [#2](https://github.com/qiwi/consul-service-discovery/issues/2)
* generate es6 bundles ([74391a5](https://github.com/qiwi/consul-service-discovery/commit/74391a5))

## [1.1.5](https://github.com/qiwi/consul-service-discovery/compare/v1.1.4...v1.1.5) (2019-01-09)


### Bug Fixes

* **README:** fix npm install command ([69f28aa](https://github.com/qiwi/consul-service-discovery/commit/69f28aa))

## [1.1.4](https://github.com/qiwi/consul-service-discovery/compare/v1.1.3...v1.1.4) (2018-11-28)


### Bug Fixes

* obtain service address from Node data ([170d69b](https://github.com/qiwi/consul-service-discovery/commit/170d69b))

## [1.1.3](https://github.com/qiwi/consul-service-discovery/compare/v1.1.2...v1.1.3) (2018-11-01)


### Bug Fixes

* pull `this._instances[serviceName]` reset out of iterator ([44bdbb5](https://github.com/qiwi/consul-service-discovery/commit/44bdbb5))

## [1.1.2](https://github.com/qiwi/consul-service-discovery/compare/v1.1.1...v1.1.2) (2018-11-01)


### Bug Fixes

* on change reset instances ([942abf0](https://github.com/qiwi/consul-service-discovery/commit/942abf0))

## [1.1.1](https://github.com/qiwi/consul-service-discovery/compare/v1.1.0...v1.1.1) (2018-11-01)


### Bug Fixes

* empry instances reject ([c0fa5e3](https://github.com/qiwi/consul-service-discovery/commit/c0fa5e3))

# [1.1.0](https://github.com/qiwi/consul-service-discovery/compare/v1.0.1...v1.1.0) (2018-10-25)


### Bug Fixes

* add watcher namespaces and late instances init ([32a1303](https://github.com/qiwi/consul-service-discovery/commit/32a1303))
* del whitespace ([5f8e095](https://github.com/qiwi/consul-service-discovery/commit/5f8e095))
* empty params checker & logger ([7666b80](https://github.com/qiwi/consul-service-discovery/commit/7666b80))
* fix tests ([c150a50](https://github.com/qiwi/consul-service-discovery/commit/c150a50))
* fix tests ([ee240df](https://github.com/qiwi/consul-service-discovery/commit/ee240df))


### Features

* support logger customization ([52b6504](https://github.com/qiwi/consul-service-discovery/commit/52b6504))


### Performance Improvements

* technical release ([08f769d](https://github.com/qiwi/consul-service-discovery/commit/08f769d))

## [1.0.2](https://github.com/qiwi/consul-service-discovery/compare/v1.0.1...v1.0.2) (2018-10-25)


### Bug Fixes

* add watcher namespaces and late instances init ([32a1303](https://github.com/qiwi/consul-service-discovery/commit/32a1303))
* del whitespace ([5f8e095](https://github.com/qiwi/consul-service-discovery/commit/5f8e095))
* empty params checker & logger ([7666b80](https://github.com/qiwi/consul-service-discovery/commit/7666b80))
* fix tests ([c150a50](https://github.com/qiwi/consul-service-discovery/commit/c150a50))
* fix tests ([ee240df](https://github.com/qiwi/consul-service-discovery/commit/ee240df))


### Performance Improvements

* technical release ([08f769d](https://github.com/qiwi/consul-service-discovery/commit/08f769d))

## [1.0.2](https://github.com/qiwi/consul-service-discovery/compare/v1.0.1...v1.0.2) (2018-10-25)


### Bug Fixes

* add watcher namespaces and late instances init ([32a1303](https://github.com/qiwi/consul-service-discovery/commit/32a1303))
* del whitespace ([5f8e095](https://github.com/qiwi/consul-service-discovery/commit/5f8e095))
* empty params checker & logger ([7666b80](https://github.com/qiwi/consul-service-discovery/commit/7666b80))
* fix tests ([ee240df](https://github.com/qiwi/consul-service-discovery/commit/ee240df))

## [1.0.2](https://github.com/qiwi/consul-service-discovery/compare/v1.0.1...v1.0.2) (2018-10-25)


### Bug Fixes

* del whitespace ([5f8e095](https://github.com/qiwi/consul-service-discovery/commit/5f8e095))
* empty params checker & logger ([7666b80](https://github.com/qiwi/consul-service-discovery/commit/7666b80))

## [1.0.1](https://github.com/qiwi/consul-service-discovery/compare/v1.0.0...v1.0.1) (2018-10-09)


### Performance Improvements

* **package:** test flow improvements ([967899b](https://github.com/qiwi/consul-service-discovery/commit/967899b))

# 1.0.0 (2018-10-09)


### Features

* add tsc build task ([ff97ff3](https://github.com/qiwi/consul-service-discovery/commit/ff97ff3))

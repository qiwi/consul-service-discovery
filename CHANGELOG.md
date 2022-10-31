## [1.10.1](https://github.com/qiwi/consul-service-discovery/compare/v1.10.0...v1.10.1) (2022-10-31)

### Fixes & improvements
* perf: tech release ([5ca6f83](https://github.com/qiwi/consul-service-discovery/commit/5ca6f839ecf9853f7749aebc510f379d4070148f))
* fix(deps): update dependency @types/consul to ^0.40.0 ([cd1e19f](https://github.com/qiwi/consul-service-discovery/commit/cd1e19f61426033446e133997059d67907f9745a))

# [1.10.0](https://github.com/qiwi/consul-service-discovery/compare/v1.9.6...v1.10.0) (2021-10-01)


### Features

* pass ca, secure and defaults opts to consul client factory ([3005874](https://github.com/qiwi/consul-service-discovery/commit/3005874930c5cd6b480e886a906d83a95b3d9949))
* rebuild watcher instance if it hangs ([5e913aa](https://github.com/qiwi/consul-service-discovery/commit/5e913aaca4a23b65fde4cf43d8954d17d4742c65))

## [1.9.6](https://github.com/qiwi/consul-service-discovery/compare/v1.9.5...v1.9.6) (2021-09-23)


### Bug Fixes

* fix readiness promise ([a61e1d0](https://github.com/qiwi/consul-service-discovery/commit/a61e1d0ca43999bed94b586ade52a05b64576846))

## [1.9.5](https://github.com/qiwi/consul-service-discovery/compare/v1.9.4...v1.9.5) (2021-09-22)


### Bug Fixes

* refresh service promise on watcher update event ([9d9a491](https://github.com/qiwi/consul-service-discovery/commit/9d9a49172cf8c4d3fbe4a4fe4ad9c5a2642f6913))

## [1.9.4](https://github.com/qiwi/consul-service-discovery/compare/v1.9.3...v1.9.4) (2021-02-17)


### Bug Fixes

* **deps:** update dependency consul to ^0.40.0 ([1da311a](https://github.com/qiwi/consul-service-discovery/commit/1da311ac7be6e455a7ced07442a3cf5c785d9cf9))

## [1.9.3](https://github.com/qiwi/consul-service-discovery/compare/v1.9.2...v1.9.3) (2020-12-18)


### Performance Improvements

* update deps versions, new .travis.yaml ([#62](https://github.com/qiwi/consul-service-discovery/issues/62)) ([4858ff1](https://github.com/qiwi/consul-service-discovery/commit/4858ff1a8d93ba7d501c277920c91de5560b1c24))

## [1.9.2](https://github.com/qiwi/consul-service-discovery/compare/v1.9.1...v1.9.2) (2020-10-05)


### Bug Fixes

* **deps:** update dependency consul to ^0.38.0 ([70377ee](https://github.com/qiwi/consul-service-discovery/commit/70377ee9b43c706d584573d91f6e14d0a556afb2))

## [1.9.1](https://github.com/qiwi/consul-service-discovery/compare/v1.9.0...v1.9.1) (2020-08-27)


### Bug Fixes

* add logging registration ([32b5128](https://github.com/qiwi/consul-service-discovery/commit/32b51280a81885611231dc3021a4abc7642a400d))

# [1.9.0](https://github.com/qiwi/consul-service-discovery/compare/v1.8.2...v1.9.0) (2020-08-24)


### Features

* add setKv method, some refactor ([fdbbc87](https://github.com/qiwi/consul-service-discovery/commit/fdbbc8779abeee3c718d6c44ce41a03bbfe6eed1))

## [1.8.2](https://github.com/qiwi/consul-service-discovery/compare/v1.8.1...v1.8.2) (2020-08-18)


### Bug Fixes

* fix kv ([60a51eb](https://github.com/qiwi/consul-service-discovery/commit/60a51ebc4102302334b9962b145645d6b4f7cce0))

## [1.8.1](https://github.com/qiwi/consul-service-discovery/compare/v1.8.0...v1.8.1) (2020-08-07)


### Bug Fixes

* update types ([b0d86e2](https://github.com/qiwi/consul-service-discovery/commit/b0d86e2009bb60edc46cc8684fb68edf0fff8fc3))

# [1.8.0](https://github.com/qiwi/consul-service-discovery/compare/v1.7.7...v1.8.0) (2020-08-06)


### Features

* add kv support ([3a12135](https://github.com/qiwi/consul-service-discovery/commit/3a12135211f5a52dced0efe3dde2cacbf024b4a1))

## [1.7.7](https://github.com/qiwi/consul-service-discovery/compare/v1.7.6...v1.7.7) (2020-08-03)


### Bug Fixes

* destroy service if service doesn't have connections ([23662c2](https://github.com/qiwi/consul-service-discovery/commit/23662c204b59d81fb36a1781766d61b6d5d203b0))

## [1.7.6](https://github.com/qiwi/consul-service-discovery/compare/v1.7.5...v1.7.6) (2020-07-24)


### Bug Fixes

* remove broken service from pull ([8685aeb](https://github.com/qiwi/consul-service-discovery/commit/8685aeba755291bb59924b5149f181bcd040bfe8))

## [1.7.5](https://github.com/qiwi/consul-service-discovery/compare/v1.7.4...v1.7.5) (2020-07-01)


### Performance Improvements

* **package:** up deps ([e0b6b14](https://github.com/qiwi/consul-service-discovery/commit/e0b6b14f0f06d67fbea6f137cf8bd6d09baa4140))

## [1.7.4](https://github.com/qiwi/consul-service-discovery/compare/v1.7.3...v1.7.4) (2020-03-02)


### Performance Improvements

* **package:** up uuid ([2f72914](https://github.com/qiwi/consul-service-discovery/commit/2f72914))

## [1.7.3](https://github.com/qiwi/consul-service-discovery/compare/v1.7.2...v1.7.3) (2020-01-31)


### Bug Fixes

* fix Consul import ([a3746a1](https://github.com/qiwi/consul-service-discovery/commit/a3746a1))

## [1.7.2](https://github.com/qiwi/consul-service-discovery/compare/v1.7.1...v1.7.2) (2020-01-30)


### Bug Fixes

* **libdef:** handle prefix issue for external deps ([5640f0a](https://github.com/qiwi/consul-service-discovery/commit/5640f0a))

## [1.7.1](https://github.com/qiwi/consul-service-discovery/compare/v1.7.0...v1.7.1) (2020-01-30)


### Bug Fixes

* fix reexported types ([b146859](https://github.com/qiwi/consul-service-discovery/commit/b146859))

# [1.7.0](https://github.com/qiwi/consul-service-discovery/compare/v1.6.1...v1.7.0) (2019-11-26)


### Features

* add getServiceConnections method ([923ff16](https://github.com/qiwi/consul-service-discovery/commit/923ff16))

## [1.6.1](https://github.com/qiwi/consul-service-discovery/compare/v1.6.0...v1.6.1) (2019-11-07)


### Performance Improvements

* up deps && repack ([bd1f67f](https://github.com/qiwi/consul-service-discovery/commit/bd1f67f))

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

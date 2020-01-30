import {resolve} from 'path'
import { argv } from 'yargs'
import assert from 'assert'
import {sync as replaceSync} from 'replace-in-file'
import {readFileSync} from 'fs'

const {flow, dts, prefix} = argv
const DTS = resolve(dts)
const IMPORT_MAIN_PATTERN = /\timport main = require\('(.+)'\);/g
const IMPORT_MAIN_LINE_PATTERN = /^\timport main = require\('(.+)'\);$/
const BROKEN_MODULE_NAME = /(declare module '.+\/target\/es5\/)[^/]*\/src\/main\/index'.+/
const IMPORT = /import .+ from '(.+)'/g
const REFERENCE = /\/\/\/.+/

assert(!!dts, ' `dts` file path should be specified')

const dtsFile = readFileSync(DTS, 'utf-8')
const declaredModules = (dtsFile.match(/declare module '.*'/g) || []).map(v => v.slice(16, -1))

// console.log(declaredModules)

// console.log(dtsFile)

const options = {
  files: DTS,
  from: [
    '\texport = main;',
    IMPORT_MAIN_PATTERN,
    BROKEN_MODULE_NAME,
    REFERENCE,
    /^\s*[\r\n]/gm,
    IMPORT
  ],
  to: [
    '',
    line => {
      const [, name] = IMPORT_MAIN_LINE_PATTERN.exec(line)
      return `	export * from '${name}';`
    },
    line => {
      const [, module] = BROKEN_MODULE_NAME.exec(line)
      return `${module}index' {`
    },
    '',
    '',
    line => {
      const re = /^(.+from ')([^']+)('.*)$/
      const [, pre, module, post] = line.match(re)
      const name = declaredModules.includes(module)
        ? module
        : module.replace(prefix + '/', '')

      return `${pre}${name}${post}`
    }
  ],
}

const changes = replaceSync(options);
console.log('Modified files:', changes);

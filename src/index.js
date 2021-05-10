import { Lector, Word, dev, prod } from './lector.js'
import { _e, _p, util, _thread } from 'pragmajs'
import * as helpers from './helpers/index'

export * as ui from './ui/index'
export { Lector, Word, helpers }
// import { css } from "./styles/main.css"

export function globalify() {
  const attrs = {
    Lector: Lector,
    Word: Word,
    _e: _e,
    _p: _p,
    util: util,
    lecUtil: helpers,
    _shadow: helpers._shadow,
  }

  for (let [key, val] of Object.entries(attrs)) {
    globalThis[key] = val
  }
}

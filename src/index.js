import { Lector, Word } from "./lector.js"

// PragmaConsole.skip()
export function prod() {
  // console.log('production mode')
  console.log = console.time = console.timeEnd = console.warn = console.error = (() => {});
  // PragmaConsole.intercept()
  // PragmaConsole.skip()
}

export function dev() {
  // return prod()
  console.log('dev mode')
  // PragmaConsole.intercept()
  // PragmaConsole.unskip()
}


export * as ui from "./ui/index"
import * as helpers from "./helpers/index"

export { Lector, Word, helpers }
// import { css } from "./styles/main.css"

import { _e, _p, util, _thread } from "pragmajs"


export function globalify(){
  const attrs = {
    Lector: Lector,
    Word: Word,
    _e: _e,
    _p: _p,
    util: util,
    lecUtil: helpers,
    _shadow: helpers._shadow
  }

  for (let [key, val] of Object.entries(attrs)){
    globalThis[key] = val
  }
}

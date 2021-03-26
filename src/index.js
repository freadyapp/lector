import { Lector, Word } from "./lector.js"
import { PragmaConsole } from "./extensions/pragmaConsole"

// PragmaConsole.skip()
export { PragmaConsole}
pragmaSpace.console = PragmaConsole
export function prod() {
  PragmaConsole.intercept()
  PragmaConsole.skip()
}
export function dev() {
  PragmaConsole.intercept()
  PragmaConsole.unskip()
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
    _thread: _thread
  }

  for (let [key, val] of Object.entries(attrs)){
    globalThis[key] = val
  }
}

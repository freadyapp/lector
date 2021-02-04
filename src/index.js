import { Lector, Word } from "./lector.js"
export { Lector, Word }

export * as helpers from "./helpers/index"
// import { css } from "./styles/main.css"

import { _e, _p, util } from "pragmajs"


export function globalify(){
  const attrs = {
    Lector: Lector,
    Word: Word,
    _e: _e,
    _p: _p,
    util: util
  }

  for (let [key, val] of Object.entries(attrs)){
    globalThis[key] = val
  }
  // globalThis.Lector = Lector
}

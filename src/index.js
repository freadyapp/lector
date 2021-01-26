import { Lector, Word } from "./lector.js"
export { Lector, Word }

export * as helpers from "./helpers/index"
// import { css } from "./styles/main.css"



export function globalify(){
  const attrs = {
    Lector: Lector,
    Word: Word
  }

  for (let [key, val] of Object.entries(attrs)){
    globalThis[key] = val
  }
  // globalThis.Lector = Lector
}

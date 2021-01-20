import { Pragma, _e } from "pragmajs"

export function elementify(el){
  // pipeline to vanillafy pragma objects to html elements
  if (el instanceof Pragma) el = el.element
  if (!el.isPragmaElement) el = _e(el)
  return el
}


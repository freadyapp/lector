export { isOnScreen, isMostlyInScreen, scrollTo, onScroll } from "./autoScroll.js"
export { crush, generateDifficultyIndex, wordValue, charsMsAt } from "./pragmaWordHelper"

import PinkyPromise from "./pinkyPromise"

import  Idle from "./idle"
export { PinkyPromise, Idle }

// ultra useful functions
export { wfy } from "./wfy.js"
export { airway } from "./airway.js"

export function range(start, stop, step) {
    var a = [start], b = start;
    while (b < stop) {
        a.push(b += step || 1);
    }
    return a;
}

export function isClickWithin(click, el){
    el = _e(el)
    let left = el.offset().left
    let top = el.offset().top
    let width = el.rect().width
    let height = el.rect().height
   
    let _x =  left < click.x && left + width > click.x
    let _y =  top < click.y && top + height > click.y
  
    return _x && _y
  }

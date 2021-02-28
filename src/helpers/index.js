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

    console.log(click, el.offset())
   
    let _x =  left < click.pageX && left + width > click.pageX
    let _y =  top < click.pageY && top + height > click.pageY
  
    return _x && _y
  }

export { isOnScreen, isMostlyInScreen, scrollTo, onScroll } from "./autoScroll.js"
export { crush, generateDifficultyIndex, wordValue, charsMsAt } from "./pragmaWordHelper"
import { _e } from "pragmajs"

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
    let left = el.rect().x
    let top = el.rect().y
    let width = el.rect().width
    let height = el.rect().height

    console.log(click, el.offset())
   
    let _x =  left < click.x && left + width > click.x
    let _y =  top < click.y && top + height > click.y
  
    return _x && _y
  }

export function fadeTo(el, value, ms = 500) {
    el = _e(el)
    el.css(`
    transition opacity ${ms}ms 
    opacity ${value}
  `)
    return new Promise(resolve => {
        setTimeout(() => {
            if (value == 0) {
                el.hide()
            } else {
                el.show()
            }
            resolve()
        }, ms)
    })
}

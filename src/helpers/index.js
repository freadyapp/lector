export { isOnScreen, isMostlyInScreen, scrollTo, onScroll, _scroller } from "./autoScroll.js"
export { crush, generateDifficultyIndex, wordValue, charsMsAt } from "./pragmaWordHelper"
import { _e } from "pragmajs"

import PinkyPromise from "./pinkyPromise"

import  Idle from "./idle"
import anime from "animejs"
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

    // console.log(click, el.offset())
   
    let _x =  left < click.x && left + width > click.x
    let _y =  top < click.y && top + height > click.y
  
    return _x && _y
  }

export function collapse(element){
    const ms = 30
    
    element.css(`
        opacity 0
    `)


    element.addClass(`collapsed`)
    element.setData({ 'collapsed': true })
    return element
}

export function expand(element){
    const ms = 30
    
    element = _e(element)
    
    element.show()
    anime({
        targets: element,
        opacity: 1,
        duration: 110,
        easing: 'easeInOutSine'
    })

    element.removeClass(`collapsed`)
    element.setData({ 'collapsed': true })
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
export function visibleY(el) {
    if (!el) return false
    var rect = el.getBoundingClientRect(),
    top = rect.top,
    height = rect.height,
    el = el.parentNode

    // Check if bottom of the element is off the page
    if (rect.bottom < 0) return false
    // Check its within the document viewport
    if (top > document.documentElement.clientHeight) return false
    do {
    if (!el.getBoundingClientRect) return
    rect = el.getBoundingClientRect()
    if (top <= rect.bottom === false) return false
    // Check if the element is out of view due to a container scrolling
    if ((top + height) <= rect.top) return false
    el = el.parentNode
    } while (el != document.body)
    return true
}


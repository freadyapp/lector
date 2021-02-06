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

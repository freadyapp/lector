// mark is responsible for marking words in the screen

import { Pragma, _e, util } from "pragmajs"
import PragmaWord from "./pragmaWord"
import anime from "animejs"
import { PinkyPromise, Idle, airway } from "../helpers/index"
import { mode_ify } from '../config/modes.js'
import { modes, defaultVals } from "../config/marker.config" 

const defaultStyles = `
  position absolute
  outline solid 0px red
  background-color #ffdf6c
  width 10px
  height 20px
  z-index 10
  opacity 1
  mix-blend-mode darken
  border-radius 3px
`

export default class PragmaMark extends Pragma {
  constructor() {
    super('marker')

    this.element = _e("marker")

    this.hide()
    this.css(defaultStyles)

    this.currentlyMarking = null
    window.addEventListener('resize', () => {
      this.mark(this.last_marked, 0)
    })

    this.runningFor = 0
    this.pausing = false
    
    this.setColor(defaultVals.color)
    this.setMode(defaultVals.mode)
    this.setWpm(defaultVals.wpm)
    this.setFovea(defaultVals.fovea)


    this.createEvents('changeLine', 'mark')
    this.createWire('lastMark')
    //this.idle = new Idle(8000)
      //.onAfk(()=> {
        //util.log('user is afk')
        //this.shout()
      //})
      //.onActive(() => {
        //util.log('user is back')
        //this.shutUp()
      //})
  }
  hide(){
    if (this._hidden) return
    this._hidden = true
    this.element.hide()
  }
  show(){
    if (!this._hidden) return
    this._hidden = false
    this.element.show()
  }

  set last_marked(n){
    this.value = n
  }

  get last_marked(){
    return this.value
  }

  get settings() {
    return this.parent ? this.parent.settings : console.error('mark has no settings attached')
  }

  get cw() {
    return this._fovea * 30
  }
  
  get wpm() { return this._wpm || 260 }
  
  setMode(mode){
    this._mode = mode
    mode_ify(this)
  }

  setWpm(wpm){
    this._wpm = wpm
  }

  setColor(hex){
    this._color = hex
    //this.css(`background-color ${hex}`)
    mode_ify(this)
  }

  setFovea(val){
    this._fovea = val
    this.css(`width ${this.cw}px`)
  }

  pause() {
    return new Promise((resolve, reject) => {
      if (this.pausing) return reject("already pausing")

      this.pausing = true

      if (this.currentlyMarking && this.current_anime && this.last_marked) {
        //console.log(this.current_anime.seek(1))
        let temp = this.last_marked
        // console.log('mark was running for', this.runningFor)
        this.runningFor = 0
        //console.table(temp)
        this.current_anime.complete()
        this.current_anime.remove('marker')
        //this.current_anime = null
        this.mark(temp, 80, false).then(() => {
          resolve("paused")
        }).catch(e => {
          reject("could not mark")
        }).then(c => {
          this.pausing = false
        })
      }
    })
  }

  _correctBlueprint(current, last) {
    console.time('correcting blueprint')
    let corrected = this.correctBlueprint(current, last)
    console.timeEnd('correcting blueprint')
    return corrected
  }

  correctBlueprint(current, last) {
    return current
  }

  moveTo(blueprint, duration, complete = (() => {}), correctBlueprint=true) {
    // console.log('moving to', blueprint)
    this.show()
    //this.shutUp() // clear any ui elements that direct attention to mark

    if (this.currentlyMarking) return new Promise((resolve, reject) => resolve());
    return new Promise((resolve, reject) => {
      if (correctBlueprint) blueprint = this._correctBlueprint(blueprint, this.lastMark)

      this.currentlyMarking = blueprint
      this.triggerEvent('mark', blueprint)
      
      this.current_anime = anime({
        targets: this.element,
        left: blueprint.left,
        top: blueprint.top,
        height: blueprint.height,
        width: blueprint.width,
        easing: blueprint.ease || 'easeInOutExpo',
        duration: duration,
        complete: (anim) => {
          this.lastMark = this.currentlyMarking
          this.currentlyMarking = null
          complete()
          resolve()
        }
      })
      // console.log(blueprint)
      // console.log(this.current_anime)
    })
  }


  mark(word, time = 200, fit = false, ease = "easeInOutExpo") {
    //console.log("marking", word)
    if (!(word instanceof Pragma)) return new Promise((r) => { console.warn("cannot mark"); r("error") })
    let w = fit ? word.width + 5 : this.cw
    //this.setWidth(w)
    return this.moveTo({
        top: word.top,
        left: word.x(w),
        height: word.height,
        width: w,
        ease: ease
      }, time, () => {
        //console.log(`FROM MARK -> marked ${word.text}`)
        this.last_marked = word
        // word.parent.value = word.index
      })
  }

  guide(word, time) {
    if (!(word instanceof Pragma)) return new Promise((resolve, reject) => { console.warn("cannot guide thru"); reject("error") })
    return new PinkyPromise((resolve, reject) => {
      let first_ease = word.isFirstInLine ? "easeInOutExpo" : "linear"
      return this.moveTo({
        top: word.top,
        left: word.x(this.width) - word.width / 2,
        height: word.height,
        width: this.cw,
        ease: first_ease
      }, time || this.calcDuration(word, 1))
        .then(() => {
          this.last_marked = word
          this.runningFor += 1
          this.mark(word, this.calcDuration(word, 2), false, "linear").then(() => {
            resolve()
          })
        })
    })
  }

  calcDuration(word, dw=1){

    /*  @dw - either 1 or 2
      * 1. yee|t th|e green fox
      * 2. yeet |the| green fox
      * 1. yeet th|e gr|een fox
      *
      * The marking of "the"(and every word) happens in 2 instances. First mark
      * will transition from "yeet" (1) and then in will mark "the", and immedietly afterwards
      * it will transition from "the" to "green" (1) etc...
      *
      * */

    if (!(word instanceof Pragma)) return this.throw(`Could not calculate marking duration for [${word}] since it does not appear to be a Pragma Object`)
    if (dw!=1 && dw!=2) return this.throw(`Could not calculate duration for ${word.text} since dw was not 1 or 2`)
    if (word.isFirstInLine) return 500 // mark has to change line
    if (!this.last_marked) return 0 // failsafe

    const before_weight = .4
    const weight = dw==1 ? before_weight : 1 - before_weight

    let w = dw==1 ? this.last_marked : word
    //const filters = [(d) => { return d*weight }]

    let duration = w.time(this.wpm)
    const filters = [(d) => { return d*weight }, airway]


    filters.forEach(f => {
      //console.log(f, duration, this.runningFor)
      //console.log(duration, f(duration, this.runningFor))
       duration = f(duration, this.runningFor)
    })

    return duration
    //return airway(duration)*weight// TODO make this a chain of callbacks
  }
}

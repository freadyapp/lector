// mark is responsible for marking words in the screen
import $ from "jquery"
import { Pragma, Comp } from "pragmajs"
import { PragmaWord } from "./pragmaWord"
import anime from "animejs"
import { PinkyPromise, Idle, airway } from "../helpers"

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

export default class PragmaMark extends Comp {
  constructor(parent) {
    super('marker')

    this.parent = parent
    this.element = $("<marker></marker>")
    this.parent.element.append(this.element)
    this.css(defaultStyles)
    //this.parent.element.append(this.element)
    this.currentlyMarking = null
    //this.element.width("180px")
    this.colors = ["tomato", "#FFDFD6", "teal"]

    $(window).on("resize", () => {
      this.mark(this.last_marked, 0)
    })

    this.runningFor = 0
    this.pausing = false

    this.idle = new Idle(5000)
      .onAfk(()=>{
        console.log('user is afk')
      })
      .onActive(()=>{
        console.log('user is back')
      })
  }

  set last_marked(n){
    this.value = n  
  }

  get last_marked(){
    return this.value
  }

  setWidth(n) {
    this.element.width(n)
    return this
  }

  get settings() { return this.parent.settings }

  set color(hex) {
    return 
    this.settings.set({ "color": this.colors[index] })
    this.element.css({ "background": this.colors[index] })
  }
  get cw() {
    return this.fovea * 30
  }
  get fovea() {
    return this.settings.get("markerfovea") || 4
  }
  set fovea(n) {
    console.table(['writing fovea', this.settings.find("fovea")])
    this.settings.set({ "fovea": n })
    this.element.css({ "width": this.settings.find("fovea") * 30 })
  }

  get wpm() { return this.settings.get("wpm") || 260 }
  set wpm(n) { this.settings.set({ "wpm": n }) }
    
  pause() {
    return new Promise((resolve, reject) => {
      if (this.pausing) return reject("already pausing")
      
      this.pausing = true

      if (this.currentlyMarking && this.current_anime && this.last_marked) {
        //console.log(this.current_anime.seek(1))
        let temp = this.last_marked
        console.log('mark was running for', this.runningFor)
        this.runningFor = 0
        //console.table(temp)
        this.current_anime.complete()
        this.current_anime.remove('marker')
        //this.current_anime = null
        this.mark(temp, 80, true).then(() => {
          resolve("paused")
        }).catch(e => {
          reject("could not mark")
        }).then(c => {
          this.pausing = false
        })
      }
    })
  }

  moveTo(blueprint, duration, complete = (() => {})) {
    if (this.currentlyMarking) return new Promise((resolve, reject) => resolve());
    return new Promise((resolve, reject) => {
      this.currentlyMarking = blueprint
      this.current_anime = anime({
        targets: this.element[0],
        left: blueprint.left,
        top: blueprint.top,
        height: blueprint.height,
        width: blueprint.width,
        easing: blueprint.ease || 'easeInOutExpo',
        duration: duration,
        complete: (anim) => {
          this.currentlyMarking = null
          complete()
          resolve()
        }
      })
    })
  }


  mark(word, time = 200, fit = false, ease = "easeInOutExpo") {
    if (!(word instanceof Pragma)) return new Promise((r) => { console.warn("cannot mark"); r("error") })
    let w = fit ? word.width() + 5 : this.cw
    //this.setWidth(w)
    return this.moveTo({
        top: word.top(),
        left: word.x(w),
        height: word.height(),
        width: w,
        ease: ease
      }, time, () => {
        //console.log(`FROM MARK -> marked ${word.text()}`)
        this.last_marked = word 
        word.parent.value = word.index
      })
  }

  guide(word) {
    if (!(word instanceof Pragma)) return new Promise((resolve, reject) => { console.warn("cannot guide thru"); reject("error") })
    return new PinkyPromise((resolve, reject) => {
      let first_ease = word.isFirstInLine ? "easeInOutExpo" : "linear"
      return this.moveTo({
        top: word.top(),
        left: word.x(this.width()) - word.width() / 2,
        height: word.height(),
        width: this.cw,
        ease: first_ease
      }, this.calcDuration(word, 1))
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

    if (!word instanceof Pragma) return this.throw(`Could not calculate marking duration for [${word}] since it does not appear to be a Pragma Object`)
    if (dw!=1 && dw!=2) return this.throw(`Could not calculate duration for ${word.text()} since dw was not 1 or 2`)
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

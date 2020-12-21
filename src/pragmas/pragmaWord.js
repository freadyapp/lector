import { Comp } from "pragmajs";
import { charsMsAt, crush, generateDifficultyIndex, wordValue, PinkyPromise } from "../helpers"

export default class PragmaWord extends Comp {

  get txt(){
    return this.text()
  }
  get index(){
    return this.key
  }
  get mark(){
    if (this.parent) return this.parent.mark
    return null 
  }
  set mark(m){
    if (this.parent) this.parent.mark = m
    return null
  }
  get isReading(){
    return this.currentPromise != null
  }
  get currentWord(){
    if (!this.hasKids) return this
    return this.find(this.value).currentWord
  }
  
  sibling(n){
    return this.parent ? this.parent.find(this.index + n) : null
  }
  // get next() {
  //   if (!this.hasKids)  return this.parent.next
  //   if (this.kidsum-this.value-1>0) return this.sibling(1).currentWord
  //   return null
  // }
  get next() {
    return this.sibling(1)
  }
  get pre() {
    return this.sibling(-1)
  }
  isInTheSameLine(n) {
    return this.sibling(n) != null && ((this.sibling(n).top() - this.top()) ** 2 < 10)
  }
  get isFirstInLine() {
    return !this.isInTheSameLine(-1)
  }
  get isLastInLine() {
    return !this.isInTheSameLine(1)
  }
  time(wpm = 250) {
    return charsMsAt(wpm) * wordValue(this, generateDifficultyIndex(this))
  }
  pause(){
    return new PinkyPromise( resolve => {
      if (this.currentPromise){
        this.currentPromise.catch((e)=>{
          //console.log("broke read chain")
          this.mark.pause().catch(e => {
            // this will trigger if mark is already pausing and not done yet
            console.warn("prevent pause event from bubbling. Chill on the keyboard bro", e)
          }).then(() => {
            this.currentPromise = null
            resolve("done pausing")
            console.log("- - - - - PAUSED - - - - - - - -")
          })
        })
        this.currentPromise.cancel("pause")
      } else { resolve("already paused") }
    })
  }

  set currentPromise(p){
    if (this.parent) return this.parent.currentPromise = p
    this.currentPromiseVal = new PinkyPromise((resolve, reject) => {
      p.catch((e) => {
        console.warn(e)
        // this.currentPromiseVal = null
        // reject(e)
      }).then(() => {
        // this.currentPromiseVal = null
        resolve()
        this.currentPromiseVal = null
      })
    })
  }

  get currentPromise() {
    return this.parent ? this.parent.currentPromise : this.currentPromiseVal
  }

  promiseRead(){
    this.currentPromise = new PinkyPromise((resolve, reject) => {
          // this.mark = "MARK V5 " + this.text() + this.key
          // console.log(this.mark)
          // console.log(this.text())
          console.time(this.text())
          this.mark.guide(this).then(() => {
            console.timeEnd(this.text())
            this.parent.value = this.index + 1
            resolve(` read [ ${this.text()} ] `)
          }).catch((e) => {
            console.warn('rejected promise read', e)
            reject(e)
          })
      })
    // console.log(this.mark)
    return this.currentPromise
  }

  read(){
    // console.log('reading ' + this.text())
    // if (this.hasKids) console.log(this.currentWord)
    
    //console.log('fuck if this works it will be sad')
    if (this.currentPromise) return new Promise((resolve, reject) => { 
      resolve('already reading') 
    })

    if (this.hasKids) return this.currentWord.read()
    this.promiseRead()
    // console.log(this)
    return new PinkyPromise(resolve => {
      this.currentPromise.then(() => {
       resolve()
       this.currentPromise = null
       return this.parent.read()
      }).catch(e => resolve('pause'))
    })
  }

  summon() {
    if (this.hasKids) return false
    return this.parent.pause().catch(() => console.log('no need to pause')).then(() => {
      this.mark.mark(this, 50, true)
      this.parent.value = this.index
    })
  }
}

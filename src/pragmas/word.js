import { charsMsAt, crush, generateDifficultyIndex, wordValue } from "./helper.js"

const Pragma = require("pragmajs")

export default class Word extends Pragma.Pragma{
  constructor(element, parent, mark=null, index=0){
    super(element)
    this.parent = parent
    this.mark = mark || this.parent.mark
    this.cursor = 0
    this.index = index
    this.addKids()
    if (this.virgin()){
      let listeners = { "click": () => this.click(),
                        "mouseover": () => this.mouseover(),
                        "mouseout": () => this.mouseout() 
                      }
      this.setup_listeners(listeners)
    }
  }

  virgin() {
    return this.children.length == 0
  }
  click(){
    this.summon()
  }
  mouseover(){          
  }
  mouseout(){
  }

  pause(){
      
    if (!this.hasKids) return new Promise((resolve, reject) => {
      //this.summon()
      this.onpause()
      resolve()
    })
        
    this.stop_flag = true
    return new Promise((resolve, reject) => {
      this.mark.pause().then(msg => {
          this.onpause()
          resolve("paused")
          this.stop_flag = false
        }).catch( e => {
          reject(e)
          console.warn(e)
        })
    })
  }


  summon(){
    return false
    if (!this.virgin()) return false
    return this.parent.pause().then(() => {
      this.mark.mark(this, 50, true)
      this.parent.cursor = this.index
    })
  }
  onread(){
    // triggers each time a word is read
    //console.log('yyet')
  }
  onpause(){
    console.log("on pause event for: " + this.children[this.cursor].text())
    //console.log('paused reading')
  }
  ondone(){
    console.log('done reading')
  }

  read(){
    if (!this.hasKids) return this.mark.guide(this)

    if (this.stop_flag){
      return new Promise((resolve, reject) =>{
        reject("pause")
      })
    }
    // if (this.children.length - this.cursor > 0){
    // this has kids
    let nextw = this.children[this.cursor]
    if (nextw instanceof Word){
      return nextw.read().then((msg) =>{
        console.log(nextw.text())
        this.cursor += 1
        this.onread()
        return this.read()
      }).catch(e => {
        if (e == "pause") return new Promise(resolve => resolve(e))
        console.warn(e)
      })
    }else{
      return new Promise((resolve, reject) => {
        this.ondone()
        resolve("done")
      })
    } 

  }
  
  sibling(n){
    return this.parent ? this.parent.children[this.index+n] : null
  }
  next(){
    return this.sibling(1)
  }
  pre(){
    return this.sibling(-1)
  }
  same_line(n){
    return this.sibling(n) !=null && ((this.sibling(n).top() - this.top())**2 < 10 )
  }
  first_in_line(){
    return !this.same_line(-1)
  }
  last_in_line(){
    return !this.same_line(1)
  }

  time(wpm=250){
    return charsMsAt(wpm)*wordValue(this, generateDifficultyIndex(this))
  }

  addKids(){
    let index=0
    this.element.find("w").each((x, el)=>{
      if (el.textContent.length > 0){
        this.add(new Word(el, this, this.mark, index))
        index+=1
      }
    })
  } 
}

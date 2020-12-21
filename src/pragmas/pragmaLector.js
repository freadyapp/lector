import { Comp } from "pragmajs";

export default class PragmaLector extends Comp {

  get mark(){
    return this.markPragma
  }
  set mark(m){
    this.markPragma = m
  }
  get isReading(){
    return this.w.isReading
  }
  get currentWord(){
    return this.find(this.value)
  }

  connectTo(w){
    this.w = w
    this.add(w)
    return this
  }

  toggle(){
    if (this.isReading) return this.pause()
    return this.read()
  }
  read(){
    this.w.read()
  }

  pause(){
    this.w.pause()
  }
  // read(){
  //   // super.read()
  //   // if (this.hasKids) console.log(this.currentWord)
  //   // this.mark = "MARK V5 " + this.element.text()
  //   // console.log(this.mark)
  // }
}
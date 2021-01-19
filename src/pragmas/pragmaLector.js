import { Pragma } from "pragmajs";

export default class PragmaLector extends Pragma {

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
    return this.w.currentWord
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
}

import { Pragma, util } from "pragmajs";

export default class PragmaLector extends Pragma {

  constructor(){
    super(arguments)
  }

  get lector(){
    return this
  }

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
  get currentParent(){
    return this.currentWord.parent
  }

  connectTo(w){
    this.w = w
    this.add(w)

    return this
  }

  removeWord(w){
    console.log('> remove', w)
    this.w.remove(w)
  }

  addWord(w, setIndex=true){
    this.w.add(w)
    if (setIndex){
      this.w.value = w.key
    }

    // w.do(_ => {
    //   if (!w.dv) return 
    //   console.log("W VALUE", w.value,w.dv)
    //   // this.connectTo(this.w.next())
    // })
    // this.connect()
    return this
  }

  toggle(){
    if (this.isReading) return this.pause()
    return this.read()
  }

  read(){
    util.log("::LECTOR reading", this)
    if (!this.w.hasKids) return console.error('nothing to read')
    console.log(this.w)
    this.w.read()
  }

  summonTo(n){
    this.currentParent.value += n
    this.currentWord.summon()
  }

  goToNext(){ this.summonTo(+1) }
  goToPre(){ this.summonTo(-1) }

  pause(){
    this.w.pause()
  }
}

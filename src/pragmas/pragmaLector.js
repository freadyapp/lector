import { Pragma, util } from "pragmajs";

export default class PragmaLector extends Pragma {

  constructor(){
    super(arguments)

    this.createEvent('load')
    this.on('load', () => this._loaded = true)
    
  }

  whenLoad(){
    return new Promise((resolve, reject) => {
      if (this._loaded){
        resolve(this)
      } else {
        this.on('load', () => resolve(this))
      }
    })

  }
  get lector(){
    return this
  }

  get mark(){
    return this._mark
  }

  set mark(m){
    this.adopt(m)
    this._mark = m
  }

  get settings(){
    return this._settings
  }
  set settings(s){
    this.adopt(s)
    this._settings = s
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

  removeWord(key){
    this.w.remove(key)
  }

  addWord(w, setIndex=false){
    w.value = w.value ?? 0
    this.w.add(w)
    //w.currentWord.summon()
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
    this.w.read(true)
  }

  summonTo(n){
    this.currentParent.value += n
    this.currentWord.summon()
  }
  
  resetMark(){
    this.whenLoad().then(() => {
      this.currentWord.summon()
    })
    // this.on('load')
    
    // if (this.currentWord && !this.currentWord.hasKids) this.currentWord.summon(true)
  }

  goToNext(){ this.summonTo(+1) }
  goToPre(){ this.summonTo(-1) }

  pause(){
    return this.w.pause()
  }

  setFont(font){
    this.w.css(`font-family ${font}`)
  }

}

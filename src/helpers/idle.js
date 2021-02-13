export default class Idle {
  constructor(idleTime){
    this.afkChain = new Map
    this.activeChain = new Map
    this.idleTime = idleTime
    this.isIdle = false
    
    const events = [ 'load', 'mousemove']

    events.forEach( event => {
      window.addEventListener(event, _ => this.reset())
    })
  }

  generateActionKey(key){
    if (key == null) key = this.afkChain.size
    return key
  }
  
  onAfk(cb, key){
    this.afkChain.set(this.generateActionKey(key), cb) 
    return this
  }
  
  onActive(cb, key){
    this.activeChain.set(this.generateActionKey(key), cb) 
    return this
  }

  reset(){
    clearTimeout(this.t)
    this.t = setTimeout(() => this.idle(), this.idleTime)  // time is in milliseconds
    this.active()
    return this
  }
  
  idle(){
    if (this.isIdle) return false
    this.isIdle = true
    doMap(this.afkChain) 
    return this
  }

  active(){
    if (!this.isIdle) return false
    this.isIdle = false 
    doMap(this.activeChain)
    return this
  }
}



function doMap(map){
  for (const [ key, cb ] of map.entries()){
      cb()
  }
}

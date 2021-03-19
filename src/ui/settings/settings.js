import { _p, Pragma, util } from "pragmajs"

//let testPragma = _p()
                  //.createWire("yoing")
                  //.on('yoingChange', function(v){
                    //settings.update(this.key, v)
                  //})

export class Settings extends Pragma {
  constructor(){
    super()
    this.init()
  }

  init() {
    this.settingsMap = new Map()
    this.pragmaMap = new Map()

    this.createEvents("update", 'load')
  }


  _set(key, value){
    if (value !== this.settingsMap.get(key)) return this.settingsMap.set(key, value)
    return false 
  }

  create(pragma, wireName){
    const settingName=wireName
    const event = pragma._events.get(`${wireName}Change`) 
    this.pragmaMap.set(wireName, pragma)

    if (!event){
      let ogValue = pragma[wireName]
      // Object.defineProperty(pragma, wireName, { writable: true })
      pragma.createWire(wireName)
      pragma[wireName] = ogValue
    }

    this.adopt(pragma)
    pragma.on(`${wireName}Change`, value => {
      this.update(settingName, value, pragma)
    })
  }

  update(hash, value, pragma){

    if (value) {
      hash = { [hash]: value }
    }

    for (let [setting, value] of Object.entries(hash)){
      if (!pragma){
        console.log(setting)
        this.pragmaMap.get(setting)[`set${setting.capitalize()}`](value)
      }
      if (this._set(setting, value)){
        this.triggerEvent("update", setting, value, pragma)
      } 
    }   
  }
  
  get(...keys){
    if (keys.length==0) keys = Array.from(this.pragmaMap.keys())
    return keys.reduce((prev, key) => {

      if (typeof prev === "string"){
        prev = { [prev]: this.settingsMap.get(prev) }
      } else {
        prev[key] = this.settingsMap.get(key)
      }

      return prev
    })
  }

  toObj(){
    let obj = new Map()
    for (let [key, value] of this.pragmaMap) {
      obj.set(key, value[key])
    }
    return obj
  }

  toJSON(){
    return JSON.stringify(this.toObj())
  }
}
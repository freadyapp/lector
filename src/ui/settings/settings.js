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

    this.createEvent("update")
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

    let setting = Object.keys(hash)[0]
    value = hash[setting]

    if (!pragma){
      console.log(setting)
      pragma = this.pragmaMap.get(setting)
      pragma[`set${setting.capitalize()}`](value)
    }
    // console.log(this.pragmaMap.get('color'))
    // console.log('pragma', this.pragmaMap.get(hash))
    for (let [ key, value ] of Object.entries(hash)){
      if (this._set(key, value)){
        this.triggerEvent("update", key, value, pragma)
      }
    }
  }
  
  get(...keys){
    if (keys.length==0) keys = Array.from(this.settingsMap.keys())
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
    return this.get()
  }

  toJSON(){
    return JSON.stringify(this.toObj())
  }
}
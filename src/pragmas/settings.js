import $ from "jquery"
import Pragma from "./pragma"
import anime from "animejs"
import { buildSettingsFrom } from "../composers/settings_builder"

export default class Settings extends Pragma {
  constructor(parent, map={}, settings={}){
    super(buildSettingsFrom(map))
    this.s = settings
    
    this.element.appendTo(document.body)
    this.parent = parent

    this.setup_listeners({
      "mouseover": this.mouseover
    })
      
    // console.log("ive been created")
  }
  onset(key, val){
    console.log(`set ${key} to ${val}`)
  }
  onget(key, val){
    // console.log(`got ${val} from ${key}`)
  }
  get (n){
    this.onget(n, this.s[n])
    return this.s[n]
  }
  set(n){
    this.add(n)
  }
  add(n){
    Object.entries(n).forEach(([key, value]) => {
      this.s[key] = value
      this.onset(key, value)
    })
  }
  mouseover(){
    // console.log("i've been hovered")
  }
}
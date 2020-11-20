import $ from "jquery"
import { wfy } from "./helper.js"
import Mark from "./mark.js"
import Word from "./word.js"
import Mousetrap from "mousetrap"
import { LectorSettings } from "./settings"
const Pragma = require("pragmajs")

export default class Lector extends Pragma.Pragma{
  constructor(element, options={}){
    super(element)
    this.setup_options(options)
   
    this.isReading = false
    this.settings = LectorSettings(this)
    this.reader = new Word(this.element, this, new Mark(this))
    // this.reader.children[7].read()
    // this.read()
    // new Pragma(this.target, { mouseover: () => this.target.fadeOut() })

    
    // this.reader.mark.settings.add({wpm: 250})
    Mousetrap.bind(["a", 'space'], () => {
      if (!this.reading){
        this.read()
      }else{
        this.pause()
      }
      // return false to prevent default browser behavior
      // and stop event from bubbling
      return false;
    }, "keyup");
  }
  get mark(){
    return this.reader.mark
  }

  get fonts(){
    return ["Open Sans", "Arial", "Helvetica", "Space Mono"]
  }
  set font(font){
    this.reader.element.css({"font-family": font})
  }

  get reading(){
    return this.isReading
  }
  set reading(n){
    this.isReading = n
    if (n) return this.read()
  }

  read(){
    if (this.isReading) return true
    console.log("<h1> READING </h1>")
    this.isReading = true
    this.reader.read().then((e) => {
      console.log("msg: " + e)
      this.isReading = false // stop reading when read is done
    }).catch(e => {
      console.warn("something went wrong when reading")
      this.isReading = false // stop reading when read is done
      console.table(e)
    })
  }

  pause(){
    if (!this.isReading) return true
    console.log("<h1> PAUSING </h1>")
    this.reader.pause().then(() => {
      console.log("paused lector")
      this.isReading = false
    }).catch( e => {
      //this.reading = false
      console.log("paused lector but... ")
      console.warn(e)
    })
  }

  setup_options(options){
    this.options = {
      // these are the default values
      toolbar: options.toolbar || false,
      topbar: options.topbar || false,
      loop: options.loop || false,
      autostart: options.autostart || false,
      interactive: options.interactive || true,
      shortcuts: options.shortcuts || true, // if interactive is false, this option doesnt do anything
      freadify: options.freadify == null ? true : options.freadify // will convert plain text to .frd format (scroll to the .frd format section for more)
    }

    if (this.options.freadify){
      this.element.replaceWith(wfy(this.element))
    }
  }
}

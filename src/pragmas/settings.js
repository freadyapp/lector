import $ from "jquery"
const Pragma = require("pragmajs")
import anime from "animejs"
import { buildSettingsFrom } from "../composers/settings_builder"
import { Variants, Comp, AttrSelect, ColorSelect, FontSelect, Compose, contain, host } from "pragmajs"

const LectorSettings = (parent) => {
  let colors = ["tomato", "navy", "lime"]
  let fonts = ["Helvetica", "Roboto", "Open Sans", "Space Mono"]
  let modes = ["HotBox", "Underneath", "Faded"]

  let colorsComp = ColorSelect("markercolors", colors, (v, comp, key) => {
    parent.mark.element.css({ "background": colors[comp.find(key).value] })
  })

  let fontComp = FontSelect("readerfont", fonts, (v, comp, key) => {
    $("w").css({ "font-family": fonts[comp.find(key).value] })
  })

  let modeComp = AttrSelect("markermode", modes, (v, comp, key) => {
    // on set
    console.log(v)
  }, (key, index) => {
    // icon
    return { type: "pointerModeOption", html: "M" }
  })

  let popUpSettings = Compose("popupsettings", "⚙️").host(colorsComp).host(fontComp).host(modeComp)
  // popUpSettings.pragmatize()

  let settings = Compose("settingsWrapper").contain(popUpSettings)
  settings.pragmatize() 
  console.log("Lector Settings")
  return settings
}

export { LectorSettings }
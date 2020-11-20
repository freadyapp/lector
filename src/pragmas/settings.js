import $ from "jquery"
import anime from "animejs"

import { Bridge, Select, Compose } from "pragmajs"

const LectorSettings = (parent) => {
  let colors = ["tomato", "navy", "lime"]
  let fonts = ["Helvetica", "Roboto", "Open Sans", "Space Mono"]
  let modes = ["HotBox", "Underneath", "Faded"]

  let colorsComp = Select.color("markercolors", colors, (v, comp, key) => {
    parent.mark.element.css({ "background": colors[comp.find(key).value] })
  })

  let fontComp = Select.font("readerfont", fonts, (v, comp, key) => {
    $("w").css({ "font-family": fonts[comp.find(key).value] })
  })

  let modeComp = Select.attr("markermode", modes, (v, comp, key) => {
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

  let syncedKeys = ["markercolors", "readerfont", "markermode"]
  let freadyBridge = Bridge(settings, syncedKeys, (object) => {
    // TODO add beam
  })

  settings.chain(freadyBridge) // every time a value is changed, do the freadyBridge's actions as well

  return settings
}

export { LectorSettings }
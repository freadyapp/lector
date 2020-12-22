import $ from "jquery"

import { Bridge, Select, Slider, Compose, Button, IconBuilder, parse } from "pragmajs"
import { mode_ify } from "../config/modes"
import { colors, fonts, modes } from "../config/marker.config"
export { settingsCSS } from "../styles/settings.css"

const LectorSettings = (parent) => {


  let icons = new IconBuilder()
  icons.default.fill = "white"


  // tippy theme for options in settings
  const tippyOption = { 
                        theme: 'lector-settings',
                        arrow: false,
                        hideOnClick: false
                      }

  let foveaComp = Slider.value("markerfovea", 1, 10)
      .bind(">", (comp) => { comp.value+=1 }, 'keyup')
      .bind("<", (comp) => { comp.value-=1 }, 'keyup')
      .html.class("slider")


  let colorsComp = Select.color("markercolor", colors)
                          .bind("c")
                          .setTippy("Color:", tippyOption)

  let fontComp = Select.font("readerfont", fonts).bind("f")
                      .html.class("font-selector")
                      .setTippy('Font:', tippyOption)

  let modeComp = Select.attr("markermode", modes,
    (v, comp, key) => {
      // on value change
      //mode_ify(parent.mark, v, colors[0])
      // console.log(v)
    },
    (key, index) => {
      //console.log(mode_ify(null, modes[index], "transparent"))
      console.log(parse.css(mode_ify(null, modes[index], "transparent")))
      // icon contruction
      return {
        type: "pointerModeOption",
        html: `<div class='pointer-color' style='display: block; width:35px; height:15px; ${parse.css(mode_ify(null, modes[index], "transparent") + "; mix-blend-mode normal")}'></div>`
      }
    }).bind("m", null, "keyup")
    .setTippy("Mode:", tippyOption)


  // key, initial val, step
  let wpmSet = (value, comp ) => { 
    /* on set */ 
    //console.log(value,comp)
  }

  let wpmComp = Button.controls("wpm", 250, 10, wpmSet, {
    "+": icons.grab("plus"),
    "-": icons.grab("minus")
  }).setRange(10, 42069)
    .html.class("inline-grid grid-cols-3 gap-x-1 items-center")
    .setTippy("Reading Speed", tippyOption)

  let popUpSettings = Compose("popupsettings")
    .host(colorsComp, fontComp, modeComp, foveaComp)

  popUpSettings.illustrate(icons.grab("settings")) // icons
  popUpSettings.icon.attr("id", "settings-icon")
  let settings = Compose("settingsWrapper").contain(popUpSettings, wpmComp)
                  .html.class("items-center")
  // extend settings
  settings.get = (key) => { 
    return settings.bridge ? settings.bridge.value[key] : null
  }

  settings.pragmatize()

  let syncedKeys = ["markercolor", "readerfont", "markermode", "wpm", "markerfovea"]
  let freadyBridge = Bridge(settings, syncedKeys,
    (object, trigger) => {
      // on set of any watched attribute
      let color = colors[object.markercolor]
      let mode = modes[object.markermode]
      let font = fonts[object.readerfont]
      // modify pointer
      let modeCss = mode_ify(parent.mark, mode, color)
      //console.log(modeComp)

      modeComp.children.forEach((child) => {
        if (color) child.css(`background ${color}`)
        //console.log(parse.css(modeCss))
      })

      // set font
      $("w").css({ "font-family": font })
    
      // sync data
      console.log(object)
      
      settings.bridge = freadyBridge
      //console.log(settings.value)
    })

  freadyBridge.set({
    wpm: 280,
    readerfont: 1,
    markercolor:1,
    markermode: 0,
    markerfovea: 5
  })

  return settings
}

export { LectorSettings }

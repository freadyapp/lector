import { _p, util, _e, Pragma } from "pragmajs"
import { Setting } from "./settings/setting"
import { SettingList } from "./settings/settingList"
import { SettingInt } from "./settings/settingInt"
import { SettingSlider } from "./settings/settingSlider"
import { select, monitor, slider, input, withLabel, idler } from "../extensions/index"

import { colors, fonts, modes, colorsHumanFriendly } from "../config/marker.config"
import { mode_ify } from "../config/modes.js"
import shc from "../config/shortcuts.config"

import icons from './icons.json'

import { isClickWithin} from "../helpers/index"
import { Settings } from "./settings/settings"
import Mousetrap from "mousetrap"



let settingsComp = _e(`div.settings`)


export function addSettingsToLector(lector){
  // actions that talk to the lector instance
  const actions = {
    changeColor(hex = this.value) {
      // modeComp.update(hex)
      // foveaComp.update(hex)
      _e('body').findAll('[data-lector-marker-color]').forEach(e => {
        e.css(`${e.getData("lectorMarkerColor")} ${hex}`)
      })
      lector.mark.setColor(hex)
    },

    changeFovea(fovea = this.value) {
      lector.mark.setFovea(fovea)
    },

    changeWpm(wpm = this.value) {
      lector.mark.setWpm(wpm)
    },

    changeFont(font = this.value) {
      lector.setFont(font)
    },

    changeMode(mode = this.value) {
      lector.mark.setMode(mode)
      _e('body').findAll('[data-lector-marker-mode]').forEach(e => {
        mode_ify(e, mode, lector.mark._color)
        // e.css(`${e.getData("lectorMarkerColor")} ${hex}`)
      })
    },

    changePage(page = this.value) {
      if (lector.paginator) lector.paginator.goTo(page)
    },

    changeScale(scale = this.value) {
      if (lector.scaler) lector.scaler.scaleTo(scale)
    }
  }

  
  lector.settings = new Settings()
                        .as(settingsComp)
                        .appendTo('body')
                        .on('update', function(key, value, pragma) {
                          console.log('syncing', this.toObj())
                        })
  console.log(`[#] added settings to`, lector)
  

  function onNewSelection(optionPragma, lastOptionPragma) {
      optionPragma.addClass('selected')
      if (lastOptionPragma) lastOptionPragma.removeClass('selected')
  }


  // color comp
  let colorOptionTemplate = pragma => `
      ${pragma.getData('description')}: ${pragma.getData('option')}
  `.trim()

  let colorSetting = new SettingList(lector.settings, 'color', { 
    options: colorsHumanFriendly,
    contentTemplate: colorOptionTemplate
  }).on('select', onNewSelection)
    .on('select', (pragma) => {
    console.log('color is ', pragma.option)
    actions.changeColor(pragma.option)

  })

  
  // mode comp
  let modes = { 
    'Faded': "_-_",
    'HotBox': "|_|",
    'Underneath': "_"
  } 

  let modeOptionTemplate = pragma => `
      ${pragma.getData('option')}
  `.trim()

  let modeSetting = new SettingList(lector.settings, 'mode', {
    options: modes,
    contentTemplate: modeOptionTemplate
  }).on('select', onNewSelection)
    .on('select', function(optionPragma){
        // this.updateDisplay(optionPragma.getData('option'))
        actions.changeMode(optionPragma.getData('option'))
      })

  
  // wpm comp
  let wpmSetting = new SettingInt(lector.settings, 'wpm')
                      .on('input', (value) => {
                        actions.changeWpm(value)
                      }).bind("+", function(){
                        this.wpm += 5
                      }).bind("-", function() { 
                        this.wpm -= 5
                      })
  

  // fovea comp
  let foveaSetting = new SettingSlider(lector.settings, 'fovea', {
    min: 2, max: 10 
  })
                      .on('input', (value) => {
                        actions.changeFovea(value)
                      }).bind("]", function(){
                        this.fovea += 5
                      }).bind('[', function() {
                        this.fovea -= 5
                      })
  // Mousetrap.bind('0', function() {wpmSetting.wpm++})

  pragmaSpace.onDocLoad(function() {
    lector.settings.update({
      color: "#eddd6e",
      mode: "HotBox",
      wpm: 235,
      fovea: 8
    })
  })

  
  //setInterval(function(){
    //wpmSetting.value ++
  //}, 1000)
  
  // colorSetting.setColor("#4bca34")
  

  // modeSetting.setMode('ethereal')
}

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



//let test=0
//let output = html`
//<> div#settings.yoing 
    //this is something else

  //<>div.glass
    //pragma-click: 0, pragma
   //can you tell?

//<> div.yannies
  //antentokoumpooo
//`


//console.log('out =>\n', output)

//function parsePMD(html, lastDepth=-1, skipFirstCloseDiv=true){
  //let parsed = ""
  //let lines = html.split('\n')
  //let i = -1 
  //for (let line of lines){
    //i++
    //let [ident, content] = line.split("<>")

    //if (!content){
      //parsed += ident
      //continue
    //}

    //console.log(lastDepth, ident.length)
    //if (lastDepth > 0 && lastDepth == ident.length) {
      //return parsed+parsePMD(lines.slice(i).join("\n"), ident.length, false)
    //}

    //if (lastDepth < ident.length) {
      //return parsed+parsePMD(lines.slice(i).join("\n"), ident.length, true)
    //}

    //if (!skipFirstCloseDiv){
      //parsed += "</div>\n\n"
    //}
    //skipFirstCloseDiv = false
    //console.log('recuuur', ident.length, content)
    //lastDepth = ident.length
    //parsed += `<div id=${content} class=${ident.length}>\n`
  //}

  //return parsed + "\n</div>"
//}

//function html(input, ...args){
  //let html = input.raw.reduce((last, current, index) => last+args[index-1]+current)
  //return parsePMD(html)
//}
//


let settingsComp = _e(`div.settings`)


export function addSettingsToLector(lector){
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

  
  console.log(`adding settings to`, lector)

  lector.settings = new Settings()
                        .as(settingsComp)
                        .appendTo('body')
                        .on('update', function(key, value, pragma) {
                          console.log('syncing', this.toObj())
                        })
  

  // let colorSetting = new Setting(lector.settings, 'color')
  
  // colorSetting.on('inputChange', (input) => {
    // colorSetting.setColor(input)
    // lector.settings.update(setting, 'color')
  // })
  
  // Mousetrap.bind("+", () => colorSetting.color += 1)
  // Mousetrap.bind("-", () => colorSetting.color += -1)
  // Mousetrap.bind("=", () => colorSetting.color = 0)
  

 
  function update(optionPragma, lastOptionPragma) {
      optionPragma.addClass('selected')
      if (lastOptionPragma) lastOptionPragma.removeClass('selected')
      // [`${optionPragma.getData('setting')}Setting`].updateDisplay(optionPragma.getData('option'))
      // actions[`change${optionPragma.getData('setting')}`](optionPragma.getData('option'))
  }

  let colorOptionTemplate = pragma => `
      ${pragma.getData('description')}: ${pragma.getData('option')}
  `.trim()

  let optionTemplate2 = pragma => `
      ${pragma.getData('option')}
  `.trim()

  let colorSetting = new SettingList(lector.settings, 'color', { 
    options: colorsHumanFriendly,
    contentTemplate: colorOptionTemplate
  }).on('select', (pragma) => {
    console.log('color is ', pragma.option)
    actions.changeColor(pragma.option)
  }).on('select', update)

  
  let modes = { 
    'Faded': "_-_",
    'HotBox': "|_|",
    'Underneath': "_"
  } 

  let modeSetting = new SettingList(lector.settings, 'mode', {
    options: modes,
    contentTemplate: optionTemplate2
  }).on('select', update)
    .on('select', function(optionPragma){
        // this.updateDisplay(optionPragma.getData('option'))
        actions.changeMode(optionPragma.getData('option'))
      })

  let wpmSetting = new SettingInt(lector.settings, 'wpm')
                      .on('input', (value) => {
                        actions.changeWpm(value)
                      }).bind("+", function(){
                        this.wpm += 5
                      }).bind("-", function() { 
                        this.wpm -= 5
                      })
  
  let foveaSetting = new SettingSlider(lector.settings, 'fovea')
                      .on('input', (value) => {
                        actions.changeFovea(value)
                      }).bind("]", function(){
                        this.fovea += 5
                      }).bind('[', function() {
                        this.fovea -= 5
                      })
  // Mousetrap.bind('0', function() {wpmSetting.wpm++})

  // pragmaSpace.onDocLoad(function() {
  lector.settings.update({
    color: "#eddd6e",
    mode: "HotBox",
    wpm: 235,
    fovea: 4
  })
  // })

  
  //setInterval(function(){
    //wpmSetting.value ++
  //}, 1000)
  
  // colorSetting.setColor("#4bca34")
  

  // modeSetting.setMode('ethereal')
}

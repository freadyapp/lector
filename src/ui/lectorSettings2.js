import { _p, util, _e, Pragma } from "pragmajs"
import { Setting } from "./settings/setting"
import { SettingList } from "./settings/settingList"
import { SettingInt } from "./settings/settingInt"
import { SettingInline } from "./settings/settingInline"
import { SettingSlider } from "./settings/settingSlider"
import { select, monitor, slider, input, withLabel, idler } from "../extensions/index"

import { colors, fonts, modes, colorsHumanFriendly, modesHumanFriendly } from "../config/marker.config"
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

  function createColorBlob(color){
    let colorThingy  = _e(`div.color-blob.`)
                  .css(`background-color ${color}`)
                  .setId(`${color}`)
                  .html("   ")

    let blob = _e('div#color.')
                .append(colorThingy)
                .html()

    return blob
    
  }

  let colorOptionTemplate = pragma => `
      ${createColorBlob(pragma.getData('option'))} <span> ${pragma.getData('description')} </span>
  `.trim()

  let colorSetting = new SettingList(lector.settings, 'color', { 
    displayName: "Color",
    options: colorsHumanFriendly,
    contentTemplate: colorOptionTemplate,
    displayTemplate: (el, val) => el.html(createColorBlob(val))
  }).on('select', onNewSelection)
    .on('select', (pragma) => {
    console.log('color is ', pragma.option)
    actions.changeColor(pragma.option)
  })

  
  // mode comp

  function createModeIcon(mode, location=""){
    let icon = `${mode}-icon`

    return `<div class="mode-icon${location ? "-" + location : ''}" id="${mode}">${icons[icon]}</div>`
    

    // let modeThingy = _e('div.mode-icon').setId(`${mode}`).html('W')


    // let pointer = _e(`div#qwer`).append(modeThingy).html()

    // return pointer


  } 

  let modeOptionTemplate = pragma => `
    ${createModeIcon(pragma.getData('option'))} <span> ${pragma.getData('option')} </span>
  `.trim()

  let modeSetting = new SettingList(lector.settings, 'mode', {
    displayName: "Mode",
    options: modesHumanFriendly,
    contentTemplate: modeOptionTemplate,
    displayTemplate: (element, value) => {
      element.html(createModeIcon(value, 'menu'))
    }
  }).on('select', onNewSelection)
    .on('select', function(optionPragma){
        // this.updateDisplay(optionPragma.getData('option'))
        actions.changeMode(optionPragma.getData('option'))
        console.log('MOOOOOOODE')
        console.log(optionPragma.getData('option'))
        //this.setData({mode: optionPragma.getData('option')})

        

      })

  
  // wpm comp
  let wpmSetting = new SettingInt(lector.settings, 'wpm', {
                        displayName: 'Speed',
                        plusElement: icons['increase'],
                        minusElement: icons['decrease'],
                        step: 5
                        // settingTemplate
                      })
                      .run(function(){
                        this.element
                          .find('#title')
                          .html(icons['speed-icon'])
                          .addClass('inline-icon-2')
                      })
                      .setWpmRange(20, 2000)
                      .on('input', (value) => {
                        actions.changeWpm(value)
                      }).bind("+", function(){
                        this.wpm += 5
                      }).bind("-", function() { 
                        this.wpm -= 5
                      })


  // fovea comp
  let foveaSetting = new SettingSlider(lector.settings, 'fovea', {
                        displayName: "Fovea",
                        displayTemplate: (el, v) => {
                          el.html(`${v}<span class='meta'>°</span>`)
                        },
                        min: 2, max: 10 
                      })
                      .on('input', (value) => {
                        actions.changeFovea(value)
                      }).bind("]", function(){
                        this.fovea += 5
                      }).bind('[', function() {
                        this.fovea -= 5
                      })

  
  let pageSetting = new SettingInt(lector.settings, 'page', {
                        displayName: 'Page'
                     })
                     .run(function(){
                       this.element.find('#title').destroy()
                       this.element.append(_e("div#meta.flex.meta").html("/420"))
                     })
                     .on('input', (value) => {
                       console.log('change page to' + value)
                       actions.changePage(value)
                     }).bind("shift+down", function(){
                       this.setPage(this.page+1)
                     }, 'keyup').bind("shift+up", function(){
                       this.setPage(this.page-1)
                     }, 'keyup')

  let pageBar = _e('div.bar#page-bar')
                    .append(pageSetting)

  
  
  let zoomSetting = new SettingInt(lector.settings, 'scale', {
                        // increment: (lastValue, step) => lastValue + step,
                        // decrement: (lastValue, step) => lastValue + step,
                        // step: 1,
                        plusElement: _e("div.", "+"),
                        minusElement: _e("div.", "-"),
                        step: 5
                     })
                     .setScaleRange(20, 200)
                     .run(function(){
                       this.element.find('#title').destroy()
                     })
                     .on('input', (value) => {
                       console.log('change zoom to' + value)
                       actions.changeScale(value)
                     }).bind("ctrl+=", function(){
                       this.setScale(this.scale+5)
                     }).bind("ctrl+-", function(){
                       this.setScale(this.scale-5)
                     })

  let zoomBar = _e('div.bar#zoom-bar')
                    .append(zoomSetting)
 
  let popupSettings = _p("popup")
      .append(colorSetting, modeSetting, foveaSetting)


  let settingsButton = _e('div.inline-icon.clickable#settings-icon').html(icons['settings-icon-white'])
  let settingsBar = _p("settings-bar")
      .addClass('bar')
      .append(
        settingsButton,
        wpmSetting
      )

  lector.settings.append(popupSettings, settingsBar, pageBar, zoomBar)
  
  
  // popup settings
  popupSettings.createWire('hidden')
              .on('hiddenChange', function(v) {
                console.log('hidden change', v)
                if (v){
                  this.element.hide()
                } else {
                  this.element.show()
                }
              })
  
  popupSettings.setHidden(true)
  document.addEventListener('mousedown', (e) => {
    if (isClickWithin(e, settingsButton)){
      // toggle popupSettings
      return popupSettings.setHidden(!popupSettings.hidden)  
    }

    popupSettings.setHidden(!isClickWithin(e, popupSettings))
  })

  //lector.settings.listenTo('mouseout', () => {
    //popupSettings.element.hide()
  //})

  // when the document is loaded, 
  // update to the default settings, and
  // trigger the settings load event
  //

  lector.on('load', function() {
    

    // set range of paginator
    if (lector.paginator){
      let p = lector.paginator
      pageSetting.setPageRange(p.firstPage, p.lastPage)
      pageSetting._edible._setSize(p.lastPage.toString().length)
      pageSetting.element.find('#meta').html(`/${p.lastPage}`)
      // pageSetting._edible._monitorTemplate = (v) => 
                    // `${v}/${p.lastPage}`

    }

    lector.settings.update({
      color: "#eddd6e",
      mode: "HotBox",
      wpm: 235,
      fovea: 8,
      page: 1,
      scale: 100
    })
  })
}

import { _p, util } from "pragmajs"
import { select, monitor, slider } from "../extensions/index"
import { mode_ify } from "../config/modes"

import { colors, fonts, modes } from "../config/marker.config"
import shc from "../config/shortcuts.config"

function activate(self, key){
  self.find(key).css('opacity 1') 
}

function deactivate(self, key){
  self.find(key).css('opacity .7') 
}

const activeSelectTpl = (conf={}) => _p()
  .from(select(util.objDiff({
    onOptionCreate: (self, el) => {
      self.contain(el)
      deactivate(self, el.key)
    }
  }, conf)))
  .css(`
    display flex
    flex-direction row
    flex-wrap no wrap
    justify-content space-around
    align-items center
    width 100%
  `)
  .do(function(){
    if (this.value === this._lv) return
    activate(this, this.value)
    if (this._lv) deactivate(this, this._lv)
  })

export default function lectorSettings(lector){


  // let icons = new IconBuilder()
  // icons.default.fill = "white"

  const tippyOption = {
                        theme: 'lector-settings',
                        arrow: false,
                        hideOnClick: false
                      }
  //
  // let foveaComp = Slider.value("markerfovea", 1, 10)
  //     .bind(">", (comp) => { comp.value+=1 }, 'keyup')
  //     .bind("<", (comp) => { comp.value-=1 }, 'keyup')
  //     .html.class("slider")

  let settings = _p("settingsWrapper")
                  .addClass("items-center")
                  .run(function(){
                    this.value = {}
                    this.set = function(set){
                      this.value = util.objDiff(this.value, edit)
                    }
                    this.get = function(key){
                      return this.value[key] 
                    }
                  })
                  .do(function(){
                    console.log('set value', this.value)
                  })

  let foveaComp = _p("markerfovea")
                  .from(slider({
                    min: 2,
                    max: 10,
                    value: 5
                  }))
                  .addClass('slider')


  let modeComp = _p('markermodes')
                  .from(activeSelectTpl({
                    options: modes
                  }))


  let fontComp = _p('markerfont')
                  .run(function(){
                    console.log(this.key)
                  })
                  .from(activeSelectTpl({
                    options: fonts,
                    optionTemplate: option => _p(option)
                              .html(option)
                              .on('click').do(function(){
                                this.parent.value = this.key
                              })
                  }))
                  .css(`flex-direction row`)

  let colorsComp = _p('markercolor')
                  .from(activeSelectTpl({
                    options: colors,
                    optionTemplate: option => {
                      return _p(option)
                              .css(`
                                width 25px
                                height 25px
                                background-color ${option} 

                              `)
                              .on('click').do(function(){
                                this.parent.value = this.key
                              })
                    }
                  }))


  let wpmComp = _p("wpm")
                  .from(monitor())
                  .setTemplate(
                    v => `${v} wpm`
                  )
                  .setRange(40, 4200)
                  .setValue(250)
                  .bind(shc.wpmPlus, function(){ this.value+=10 })
                  .bind(shc.wpmMinus, function(){ this.value-=10 })


  const comps = [colorsComp, fontComp, foveaComp, modeComp]

  comps.forEach(comp => {
    comp.do(function(){
      console.log(this.key, this.value)
    })
  })

  let popUpSettings = _p("popupsettings")
        .contain(...comps)


  settings.contain(popUpSettings, wpmComp)

  // extend settings
  settings.get = (key) => {
    return settings.bridge ? settings.bridge.value[key] : null
  }

  return settings.pragmatize()
}

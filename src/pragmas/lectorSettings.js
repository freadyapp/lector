import { _p, util } from "pragmajs"
import { select, monitor, slider, input } from "../extensions/index"

import { colors, fonts, modes } from "../config/marker.config"
import shc from "../config/shortcuts.config"

function cssOption(self, key){
  self.find(key).css('cursor pointer')
}
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
      cssOption(self, el.key)
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
    padding 10px
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

  const actions = {
    changeColor(hex=this.value){
      lector.mark.setColor(hex)
    },

    changeFovea(fovea=this.value){
      lector.mark.setFovea(fovea)
    },

    changeWpm(wpm=this.value){
      lector.mark.setWpm(wpm) 
    },

    changeFont(font=this.value){
      lector.setFont(font)
    },

    changeMode(mode=this.value){
      lector.mark.setMode(mode) 
    },

    changePage(page=this.value){
      lector.paginator.goTo(page) 
    }
  }

  let settings = _p("settingsWrapper")
                  .addClass("items-center")
                  .run(function(){
                    this.value = {}

                    this._setVal = function(edit){
                      this.value = util.objDiff(this.value, edit)
                    }

                    this.set = function(edit){
                     this._setting = true 
                      for (let [key, val] of Object.entries(edit)){
                        let child = this.find('!'+key)
                        if (child) child.value = val
                      }
                     this._setting = false
                    }
                    
                    this.get = function(key){
                      return this.value[key] 
                    }
                  })
                  //.do(function(){
                    //console.log('set value', this.value)
                  //})

  let foveaComp = _p("!fovea")
                  .from(slider({
                    min: 2,
                    max: 10,
                    value: 5
                  }))
                  .addClass('slider')
                  .do(actions.changeFovea)


  let modeComp = _p('!mode')
                  .from(activeSelectTpl({
                    options: modes
                  }))
                  .do(actions.changeMode)


  let fontComp = _p('!font')
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
                  .do(actions.changeFont)

  let colorsComp = _p('!color')
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
                  .do(actions.changeColor)

  let wpmComp = _p("!wpm")
                  .from(input())
                  .setTemplate(
                    v => `${v} wpm`
                  )
                  .setValueSanitizer(
                    v => parseInt(v)
                  )
                  .setRange(40, 4200)
                  .setValue(250)
                  .bind(shc.wpmPlus, function(){ this.value+=10 })
                  .bind(shc.wpmMinus, function(){ this.value-=10 })
                  .do(actions.changeWpm)

  let pageComp = _p("!page")
                  .from(monitor())
                  .setTemplate(
                    p => `page [${p}]`
                  )
                  .run(function(){
                    util.createChains(this, 'userEdit')

                    this.editValue = function(val){
                      this.value = val  
                      this.userEditChain.exec(this.value)
                    }

                    this.onUserEdit(actions.changePage)
                  })
                  .setValue(1)
                  .bind(shc.pageNext, function(){
                    this.editValue(this.value+1)
                  }, 'keyup')
                  .bind(shc.pagePre, function(){
                    this.editValue(this.value-1)
                  }, 'keyup')
                  
                  //.do(actions.changePage)

  //const comps = [colorsComp, fontComp, foveaComp, modeComp]

  //comps.forEach(comp => {
    //comp.do(function(){
      //console.log(this.key, this.value)
    //})
  //})

  let popUpSettings = _p("popupsettings")
        .contain(colorsComp, fontComp, foveaComp, modeComp)
        .run(function(){
          this.show = function(){
            this.hidden = false
            this.element.show()
          }
          this.hide = function(){
            this.hidden = true
            this.element.hide()
          }
          this.toggle = function(){
            this.hidden ? this.show() : this.hide()
          }

          this.show()
        })
        .bind("h", function() { this.toggle() })


  settings.contain(popUpSettings, wpmComp, pageComp)
  
  const listenTo_ = p => p.key && p.key.indexOf('!') === 0


  settings.allChildren.forEach(child => {
    if (listenTo_(child)){
      child.do(_ => settings._setVal({[child.key.substring(1)]: child.value}))
    }
  })
  
  settings.do(function(){
    if (!this._setting){
      console.log('syncing',this.value)
    }
  })

  settings.set({
    'color': colors[1],
    'font': fonts[1],
    'mode': modes[2],
    'fovea': 4,
    'wpm': 420
  })
 

  return settings.pragmatize()
}

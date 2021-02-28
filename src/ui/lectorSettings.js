import { _p, util } from "pragmajs"
import { select, monitor, slider, input, withLabel, idler } from "../extensions/index"

import { colors, fonts, modes, colorsHumanFriendly } from "../config/marker.config"
import { mode_ify } from "../config/modes.js"
import shc from "../config/shortcuts.config"

import icons from './icons.json'

import { isClickWithin} from "../helpers/index"

function activate(self, key){
  self.find(key).addClass('active')
                .removeClass('inactive')
}

function deactivate(self, key){
  self.find(key).removeClass('active')
                .addClass('inactive')
}

const labelify = (option, val) => `<span class='option-title'>${option}:</span> ${val}`
function lecLabel(){
  this.run(withLabel)
  this._labelTemplate = v => v

  this.setLabelTemplate = function(lbt){
    this._labelTemplate = lbt
    return this
  }
  this.setLabelName = function(lb){
    this._labelName = lb
    return this
  }
  this.do(function(){
    let v = this._labelTemplate(this.value)
    this.setLabel(labelify(this._labelName, v))
  })
}

const activeSelectTpl = (conf={}) => _p()
  .from(select(util.objDiff({
    onOptionCreate: (self, el) => {
      self.contain(el)
      el.addClass('option')
      deactivate(self, el.key)
    }
  }, conf)))
  .addClass('active-select-template')
  .do(function(){
    if (this.value === this._lv) return
    activate(this, this.value)
    if (this._lv) deactivate(this, this._lv)
  })

export default function lectorSettings(lector){


  // let icons = new IconBuilder()
  // icons.default.fill = "white"

  //const tippyOption = {
                        //theme: 'lector-settings',
                        //arrow: false,
                        //hideOnClick: false
                      //}
  //
  // let foveaComp = Slider.value("markerfovea", 1, 10)
  //     .bind(">", (comp) => { comp.value+=1 }, 'keyup')
  //     .bind("<", (comp) => { comp.value-=1 }, 'keyup')
  //     .html.class("slider")

  const actions = {
    changeColor(hex=this.value){
      modeComp.update(hex)
      foveaComp.update(hex)
      _e('body').findAll('[data-lector-marker-color]').forEach(e => {
        e.css(`${e.getData("lectorMarkerColor")} ${hex}`)
      })
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
      if (lector.paginator) lector.paginator.goTo(page) 
    },

    changeScale(scale=this.value){
      if (lector.scaler) lector.scaler.scaleTo(scale)
    }
  }

  let settings = _p("settingsWrapper")
                  .addClass("items-center", 'lector-settings')

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
                  .addClass('section')
                  .run(lecLabel, slider) // label
                  .setRange(2, 10)
                  .setValue(5)
                  .setLabelName('Pointer Width')
                  .do(actions.changeFovea)
                  .run(function(){
                    this.update = function(bg){
                      this._bar.css(`background-color ${bg}`)
                    }
                  })
                  


  let modeComp = _p('!mode')
                  .from(activeSelectTpl({
                    options: modes,
                    optionTemplate: option => _p(option)
                        .css(`width 35px;
                              height 20px;
                         `)
                        .on('click').do(function(){
                          this.parent.value = this.key
                        })
                        .run(function(){
                          this.update = bg => {
                            mode_ify(this, option, bg)
                            this.css('mix-blend-mode normal')  
                          }
                        })
                  }))
                  .run(function(){
                    this.update = function(bg){
                      this.children.forEach(child => child.update(bg))
                    }
                  })
                  .run(lecLabel)
                  .setLabelName('Pointer mode')
                  .addClass('section')
                  .do(actions.changeMode)



           
  function popUpEditor(){
    this.setPopupEditor = function(popup){
      this._popupEditor = popup
      this._popupEditor.addClass(`displayN`)
      return this
    }

    this.element.listenTo('click', click =>{
      this._popped = click
      this._popupEditor.removeClass(`displayN`)
    })

    this.element.onRender(() => {
      let self = this
      document.addEventListener('click', function _onClick(click){
        console.log(click, self._popped)
        if (self._popped === click){
          // if click event was used to pop the menu, skip
          return null
        }
        if (!isClickWithin(click, self._popupEditor)){
          self._popupEditor.addClass(`displayN`)      
        }
      })
    })
  }

    
  let setColor = _p('!color')
                  .from(activeSelectTpl({
                    options: colors,
                    optionTemplate: option => {
                      return _p(option)
                              .css(`
                                width 25px
                                height 25px
                                border-radius 25px
                                margin-top 5px
                                margin-bottom 5px
                                background-color ${option} 
                              `)
                              .on('click').do(function(){
                                this.parent.value = this.key
                              })
                    }
                  }))
                  .addClass('section', `selector`)
                  
                  //.run(lecLabel)
                  //.setLabelName('Pointer Color')
                  //.setLabelTemplate(v => colorsHumanFriendly[v])
                  .do(actions.changeColor)




  let colorIcon = _p().as(_e(icons['color-icon']))
  let colorMonitor = _p('monitor')
                    .as(_e('div.'))
                    .addClass(`color-indicator`)
                    .setData({ 'lectorMarkerColor': 'background' })

  let colorsComp = _p().contain(colorIcon, colorMonitor, setColor)
                  .addClass(`setting`)
                  .css(`position relative`)

                  .run(popUpEditor)
                  .setPopupEditor(setColor)



  let fontIcon = _p().as(_e(icons['fovea-icon']))

  let fontMonitor = _p('monitor')
                    .addClass('font-indicator')

  let setFont = _p('!font')
                  .run(function(){
                    console.log(this.key)
                  })
                  .from(activeSelectTpl({
                    options: fonts,
                    optionTemplate: option => _p(option)
                              .html("Aa")
                              .css(`font-family ${option}`)
                              .on('click').do(function(){
                                this.parent.value = this.key
                              })
                  }))
                  .css(`flex-direction row`)
                  .addClass('section', `selector`)
                  .do(actions.changeFont)
                
  let fontComp = _p()
                  .contain(fontIcon, fontMonitor, setFont)
                  .run(popUpEditor)
                  .setPopupEditor(setFont)


  let wpmComp = _p("!wpm")
                  .run(input, withLabel)
                  .addClass('settings-input', 'section')
                  .setInputAttrs({
                    maxlength: 4,
                    size: 4
                  })
                  .setValueSanitizer(
                    v => parseInt(v)
                  )
                  .setId('wpm')
                  .setLabel('wpm')
                  .setRange(40, 4200)
                  .setValue(250)
                  .bind(shc.wpmPlus, function(){ this.value+=10 })
                  .bind(shc.wpmMinus, function(){ this.value-=10 })
                  .do(actions.changeWpm)
  
  let pageComp = _p("!page")
                  .run(input, withLabel)
                  .setInputAttrs({
                    maxlength: 4,
                    size: 4
                  })
                  .addClass('settings-input', 'section')
                  .setValueSanitizer(
                    v => parseInt(v)
                  )
                  .setLabel('page')
                  .run(function(){
                    util.createChains(this, 'userEdit')

                    this.editValue = function(val){
                      this.value = val  
                      this.userEditChain.exec(this.value)
                    }

                    this.onUserEdit(actions.changePage)
                  })
                  // .do(actions.changePage
                  .run(function(){
                    this.onUserInput(val => {
                      // console.log(val)
                      this.editValue(val)
                    })
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

  let scaleComp = _p("!scale")
                  .run(input, withLabel)
                  .setInputAttrs({
                    maxlength: 3,
                    size: 4
                  })
                  .addClass('settings-input', 'section')
                  .setValueSanitizer(
                    v => parseInt(v)
                  )
                  .setLabel('scale')
                  .run(function(){
                    util.createChains(this, 'userEdit')

                    this.editValue = function(val){
                      this.value = val
                      this.userEditChain.exec(this.value)
                    }

                    this.onUserEdit(actions.changeScale)
                  })
                  // .do(actions.changePage
                  .run(function(){
                     this.onUserInput(val => {
                       console.log(val)
                       this.editValue(val)
                     })
                  })
                  .setValue(100)
                  .bind(shc.scaleUp, function(){
                    this.editValue(this.value+5)
                    return false
                  })
                  .bind(shc.scaleDown, function(){
                    this.editValue(this.value-5)
                    return false
                  })                  

                    
  let miniSettings = _p('mini-settings')
    .addClass('lector-mini-settings')
    .contain(scaleComp, pageComp)
    .pragmatize()
  
  let popUpSettings = _p("popupsettings")
        .contain(
          fontComp.setId('font'), 
          colorsComp.setId('color'), 
          modeComp.setId('mode'),
          foveaComp.setId('fovea'),) 
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
// 
// pageComp
  settings.contain(popUpSettings, wpmComp)
  settings.adopt(miniSettings)
  
  const listenTo_ = p => p.key && p.key.indexOf('!') === 0

  // let fader = _p('fader')
  //   .run(idler, function(){
  //     this.elements = []
  //     this.include =function(){
  //       this.elements = this.elements.concat(Array.from(arguments))
  //       return this
  //     }
  //   })
  //   .setIdleTime(3000) // TODO CHANGE BACK TO 3000
  //   .include(settings, miniSettings)
  //   .onIdle(function(){
  //     this.elements.forEach(element => {
  //       element.css('opacity 0')
  //     })
  //     // this.css('opacity 0')
  //   })
  //   .onActive(function(){
  //     this.elements.forEach(element => element.css('opacity 1'))
  //   })
  
  // settings.fader = fader

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

  setTimeout(() => {
    // simulate websocket event
    settings.set({
      'color': colors[1],
      'font': fonts[1],
      'mode': modes[2],
      'fovea': 4,
      'wpm': 420
    })
   
  }, 900)
  
  return settings.pragmatize()
}


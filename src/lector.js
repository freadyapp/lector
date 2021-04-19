import { _e, _p, Pragma, util, _thread, runAsync } from "pragmajs"
import { range, wfy, isOnScreen, scrollTo, visibleY, onScroll } from "./helpers/index"
import { PragmaWord, PragmaLector, PragmaMark } from "./pragmas/index"
import { LectorSettings } from "./ui/index"
import { addSettingsToLector } from "./ui/lectorSettings2"
import anime from "animejs"
import { popUpOb } from "./onboarding/popUpOb"


import * as _ext from "./extensions/index"

import css from "./styles/styles.json"
import { onScrollEnd } from "./helpers/autoScroll"



function addOnboardingToLector(lector){
  lector._popUp = new popUpOb()
}


function connectToLectorSettings(lector, wire){
  return new Promise((resolve, reject) => {

      lector.element.onRender(() => {
        if (!lector.settings) return reject('no settings present')
        let setting = lector.settings.pragmaMap.get(wire)
        if (setting) {
          // console.log(`@@@@ connected to ${wire} setting @@@@`)
          return resolve(setting)
        } 
        
        reject('could not find setting')
    })
  })
}


// TODO add more default options
const default_options = {
  onboarding: false,
  wfy: true,
  pragmatizeOnCreate: true,
  experimental: false,
  settings: false,
  defaultsStyles: true
}

const Mark = (lec) => {
  let mark = new PragmaMark(lec)

  function logger(w){
  }

  // auto scroll feature
  // TODO put somewhere else
  let scrollingIntoView = false
  let usersLastScroll = 0

  function userIsScrolling(){
    return usersLastScroll - Date.now() > -10
  }

  function autoScroll(w){
    //return
    if (userIsScrolling() || isOnScreen(mark.element) || scrollingIntoView) return false
    // else we're out of view

    scrollingIntoView = true

    let cbs = [] // these will be the callbacks that are gonna run when the scroll is done
    // TODO  make a class Chain that does this.
    // Chain.add(cb), Chain.do() to execute and shit
    if (lec.isReading){
      lec.pause()
      cbs.push(() => {
        lec.read()
      })
    }

    cbs.push(()=>{
      //console.warn("suck my diiiiiiiiiick")
    })

    //console.warn("mark is out of screen")
    //console.log('lec reading:', lec.isReading)

    // scrollTo(mark).then(() => {
      // cbs.forEach(cb => cb())
      // scrollingIntoView = false
    // })
  }

  const threshold = 40 // how fast should you scroll to pause the pointer
  let lastScroll = 0

  let markedWords = new Set

  let indicator = _e(`div#mark-indicator`)
                    .listenTo('click', () => {
                      lec.currentWord.summon()
                    })
  let indicatorAppended = false
  onScrollEnd((s, ds, event) => {

    console.time('scrollend')
    for (let w of markedWords) {
      if (!w) continue
      console.log(w)
      w.css(`background transparent`)
      markedWords.delete(w)
    }

    function firstVisibleParent(e){
      if (!e || !e.parent || visibleY(e.element)) return e
      return firstVisibleParent(e.parent)
    }

    let _top = 1
    let _bottom = -1

    function findObscurer(p) {
      let surface = firstVisibleParent(p)
      if (surface === p) return null

      var bottomOf = (word) => word.element.top + word.element.height
      var topOf = (word) => word.element.top

                // !visibleY(word.parent.element) ? isWordObscured(word.parent) :
      return {
        surface,
        from: (topOf(p) <= ( surface.isPragmaWord ? topOf(surface) : window.scrollY) ? _top : _bottom)
      }
    }

    if (!lec.isReading) {
      let currentWord = lec.currentWord
      // let obscured = isWordObscured(currentWord)

      let obscured = findObscurer(currentWord)
      console.log('surface is', findObscurer(currentWord))
      // console.log('obscured by', obscured, obscured.firstVisibleParent)
      // console.log('is visible', visibleY(currentWord.element))
      if (obscured) {
        let fromTop = obscured.from === _top
        if (obscured.surface.isPragmaLector) {
          if (!indicatorAppended){
            indicator.appendTo('html')
            indicatorAppended = true
          }
          indicator[fromTop ? `addClass` : `removeClass`]('upwards')
        } else {
            obscured.surface.addClass('mark-obscurer')
                [fromTop ? `addClass` : `removeClass`]('from-top')
                [!fromTop ? `addClass` : `removeClass`]('from-bottom')
        }
                                        
      }else {
        indicator.destroy()
        indicatorAppended = false
        _e('body').findAll('.mark-obscurer').forEach(e => e.removeClass('mark-obscurer', 'obscures-mark-from-top', 'obscures-mark-from-bottom'))
      }

      lec.resetMark().then(() => {
        lec.mark.show()
      })

      console.timeEnd('scrollend')
      // console.log('is visible', window.scrollY - trueTop(lec.currentWord.element))
    } 
  }, 500)

  onScroll((s, ds, event) => {
    usersLastScroll = !scrollingIntoView ? Date.now() : usersLastScroll
    // console.log('user is scrolling', userIsScrolling())

    if (userIsScrolling() && lec.isReading){
      let dscroll = Math.abs(lastScroll-s)
      lastScroll = s
      console.log(dscroll)
      if (dscroll>threshold){

        // console.log('ds=', dscroll)
        // TODO prevent from calling pause to many times
        // on too fast scroll, pause mark
        lec.pause()
      } else {
      }
    } else {
      lec.mark.hide()
      lec.currentWord?.css('background lime')
      markedWords.add(lec.currentWord)
    }

  }, 0)

  //mark.listenTo('mouseover', function(){
    //console.log(this, 'hover')
  //})

  mark.do(logger, autoScroll)
  return mark
}

//console.log(_e("#div").deepQueryAll.toString())
export const Word = (element, i, options={ shallow: false }) => {

  let w = new PragmaWord(i)
          .as(element)
          .setValue(0)

    function unhoverCluster(epicenter) { hoverCluster(epicenter, 'remove') }
    function hoverCluster(epicenter, action='add'){

      function spreadRight(element, cap=1, iter=0){
        hover(element, iter)
        if (element.isInTheSameLine(1) && cap > iter){
          let next = element.next
          spreadRight(next, cap, iter+1)
        }
      }

      function spreadLeft(element, cap=1, iter=0){
        if (iter>0) hover(element, iter)
        if (element.isInTheSameLine(-1) && cap > iter){
          let pre = element.pre
          spreadLeft(pre, cap, iter+1)
        }
      }

      spreadRight(epicenter, 2)
      spreadLeft(epicenter, 2)

      function hover(element, depth){
        element[`${action}Class`](`hover-${depth}`)
      }
    }

    let thisw = w.element.findAll('w')
    if (i && thisw.length === 0) {
      w.setData({ wordAtom: true })
      w.addClass('word-element')
      
      w.listenTo("click", function(){
          this.summon()
        })
        .listenTo("mouseover", function() { hoverCluster(this) })
        .listenTo("mouseout", function() { unhoverCluster(this) })
    }

    if (!options.shallow){
      thisw.forEach((el, i) => {
        let ww = Word(el, i, { shallow: true })
        w.add(ww)
      })
    }
    
  return w
}

export const Reader = (l, options=default_options) => {
  l = _e(l)
  if (options.wfy) wfy(l)
  let w = Word(l)

  let lec = new PragmaLector("lector")
              // .createEvents('load')
              .as(l)
              .setValue(0)
              .connectTo(w)
  
  // console.log(`created lector ${lec}`)
  // console.log(`created word ${w}`)
  // console.log(w)

  lec.mark = Mark(lec)
  if (options.settings) addSettingsToLector(lec) 
  if (options.legacySettings) lec.settings = LectorSettings(lec) 
  if (options.onboarding) addOnboardingToLector(lec)
  // if (options.settings) lec.settings = LectorSettings(lec) 


  function bindKeys(){
    lec.bind("right", _ => lec.goToNext())
    lec.bind("left", _ => lec.goToPre())

    lec.bind("space", _ => false, 'keydown') // dont trigger the dumb fucken scroll thing
    lec.bind("space", function(){
      this.toggle()
      return false
    }, 'keyup')

  }

  function experiment(){
    if (globalThis.pragmaSpace.mousetrapIntegration){
        bindKeys()
    }
  }

  if (options.pragmatizeOnCreate) lec.pragmatize()
  if (options.experimental) experiment()

  return lec
}

function _needWrapper(op){
    return op.stream || op.paginate
}


function _streamer(sf){
  return _p('streamer')
          .setValue(0)
          .run(function(){
            this.fetch = sf
            this.getContent = function(){
              return this.fetch(this.value)
            }
          })

}

export const Lector = (l, options=default_options) => {
  if (options.defaultStyles){
    util.addStyles(css.main)
    util.addStyles(css.slider)
    util.addStyles(css.settings)
  }

  if (options.fullStyles){
    util.addStyles(css.full)
  }

  if (!_needWrapper(options)){
    let r = Reader(l, options) 
    pragmaSpace.onDocLoad(() => {
      r.triggerEvent('load')
    })
    return r
  }

  console.log("configuration appears to be a bit more complicated")
  
  if (!options.experimental) return console.warn('EXPERIMENTAL FEATURES TURNED OFF')

  let lector

  if (options.stream &&
      options.paginate &&
      options.paginate.from === 'stream' &&
      options.paginate.as === 'infiniteScroll'){

    console.log('setting up streamer service')

    let streamer = _streamer(options.stream)
    let paginator = _ext.infinityPaginator(streamer, l, options.paginate.config || {})

    // let reader = _p()
    //               .as(_e(l).parentElement)

    // console.log('creating new lector')
    // console.log(l)
    // console.log(_e(l).parentElement)
    // let options = util.objDiff({ skip: true })
    lector = Reader(_e(l).parentElement, options)
                  .adopt(paginator, streamer)

    
    lector.paginator = paginator

    connectToLectorSettings(lector, 'page').then(settingPragma => {
      lector.paginator.do(function() {
        settingPragma.triggerEvent('update', this.value)
        // settingPragma.updateDisplay(this.value)
      })
    }).catch()

    //if (lector.settings){
      //console.log("lector has settings! connecting paginator's value to pagecomp")
      //console.log('settings', lector.settings)
      //let pageSetting = lector.settings.pragmaMap.get('page')
      //if (pageSetting) {
        //lector.paginator.do(function(){
          //pageSetting.updateDisplay(this.value)
        //})
      //}
    //}

    paginator.fill()
    
    // return lector
  }

  
  if (options.scaler){
    // let _scaler = _p().run(_ext.scaler)
    let _scaler = new _ext.Scaler(lector.element)
    
    // _scaler.setTarget(lector.element)
    
    // _scaler.scaleUp()
    // _scaler.bind("mod+=", function() { _scaler.scaleUp();  return false;})
    // _scaler.bind("mod+-", function() { _scaler.scaleDown();  return false;})
    
    lector.adopt(_scaler)
    lector.scaler = _scaler

    connectToLectorSettings(lector, 'scale').then(settingPragma => {
      lector.scaler.on('scaleChange', (v) => {

        if (lector.scaler.currentPromise){
          anime({
            targets: lector.mark.element,
            opacity: 0,
            duration: 40
          })  
          
          lector.scaler.currentPromise.then(() => {
            anime({
              targets: lector.mark.element,
              opacity: 1,
              duration: 150,
              easing: 'easeInOutSine'
            })
            lector.resetMark()
          })

        }
        settingPragma.setScale(v)
      })
    })
  }

  pragmaSpace.onDocLoad(() => {
    lector.triggerEvent('load')
  })

  return lector
}

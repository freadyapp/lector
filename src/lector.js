// import { Compose, Pragma, Comp } from "pragmajs"
import { _e } from "pragmajs"
import { wfy, isOnScreen, scrollTo, onScroll, LectorSettings } from "./helpers/index"
import { PragmaWord, PragmaLector, PragmaMark } from "./pragmas/index"
globalThis.$ = globalThis.jQuery = $;


// TODO add more default options
const default_options = {
  wfy: true,
  pragmatizeOnCreate: true,
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
    return
    if (userIsScrolling() || isOnScreen(mark) || scrollingIntoView) return false
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

    scrollTo(mark).then(() => {
      cbs.forEach(cb => cb())
      scrollingIntoView = false
    })
  }

  const threshold = 40 // how fast should you scroll to pause the pointer
  let lastScroll = 0
  onScroll((s) => {
    usersLastScroll = !scrollingIntoView ? Date.now() : usersLastScroll
    console.log('user is scrolling', userIsScrolling())

    if (userIsScrolling() && lec.isReading){
      let dscroll = Math.abs(lastScroll-s)
      lastScroll = s
      if (dscroll>threshold){
        console.log('ds=', dscroll)
        // TODO prevent from calling pause to many times
        // on too fast scroll, pause mark
        lec.pause()
      }
    }
  })

  mark.on('mouseover', function(){
    console.log(this, 'hover')
  })

  mark.do(logger, autoScroll)
  return mark
}

const Word = (element, i) => {
  let w = new PragmaWord(i)
          .as(element)
          .setValue(0)

  let thisw = w.element.findAll('w')

  if (thisw.length==0) {
    w.addListeners({
      "click": function(e, comp){
        this.summon().then(() => {
          this.parent.value = this.key
        })
      },
      "mouseover": function(w, comp){
        this.css("background #5e38c74a")
      },
      "mouseout": function(){
        this.css('background transparent')
      }
    })
  }

  // w.element.css({"border": ".5px dashed lightgray"})
  // w.css("border .5px dashed lightgray")
  thisw.forEach( (el, i) => {
    let ww = Word(el, i)
    // console.log(ww)
    w.add(ww)
  })

  return w
}


export const Lector = (l, options=default_options) => {
  l = _e(l)
  if (options.wfy) wfy(l)
  let w = Word(l)
            // .do(function(){
            //   console.log(this.isReading, this.value, this.currentWord)
            //   if (this.isReading){
            //     if (typeof this.onRead !== 'undefined') this.onRead()
            //   }else{
            //     this.currentWord.summon(true)
            //   }
            // })

  let lec = new PragmaLector("lector")
              .setValue(0)
              .connectTo(w)
              .do(function(){

              })

  lec.settings = LectorSettings(lec)
                  .css(`position fixed
                        bottom 10px
                        left 10px
                        background #303030
                        padding 10px`)

  lec.mark = Mark(lec)
  lec.contain(lec.settings)

  function bindKeys(){
    lec.bind("right", function(){ this.w.value += 1; this.currentWord.summon()})
    lec.bind("left", function(){ this.w.value -= 1; this.currentWord.summon()})

    lec.bind("space", function(){
      return false
    }, 'keydown')

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

  // bindKeys() // TODO: add mousetrap integration

  if (options.pragmatizeOnCreate) lec.pragmatize()
  if (options.experimental) experiment()

  // setTimeout(() => {
  //   lec.toggle()
  // }, 1000)

  return lec
}

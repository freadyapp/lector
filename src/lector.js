import { Compose, Pragma, Comp } from "pragmajs"
import { wfy, isOnScreen, scrollTo, onScroll, LectorSettings } from "./helpers"
import { PragmaWord, PragmaLector, PragmaMark } from "./pragmas"
import $ from "jquery"
global.$ = global.jQuery = $;

// find all descendands of object # TODO put it somewhere else
var __indexOf = [].indexOf || function (e) { for (var t = 0, n = this.length; t < n; t++) { if (t in this && this[t] === e) return t } return -1 }; /* indexOf polyfill ends here*/ jQuery.fn.descendants = function (e) { var t, n, r, i, s, o; t = e === "all" ? [1, 3] : e ? [3] : [1]; i = []; n = function (e) { var r, s, o, u, a, f; u = e.childNodes; f = []; for (s = 0, o = u.length; s < o; s++) { r = u[s]; if (a = r.nodeType, __indexOf.call(t, a) >= 0) { i.push(r) } if (r.childNodes.length) { f.push(n(r)) } else { f.push(void 0) } } return f }; for (s = 0, o = this.length; s < o; s++) { r = this[s]; n(r) } return jQuery(i) }

// TODO add more default options
const default_options = {
  wfy: true,
  pragmatizeOnCreate: true,
}

const Mark = (lec) => {
  let mark = new PragmaMark(lec)
  
  function logger(w){
    //mark.log(w.text())
    //console.log(mark.logs)
  }

  // auto scroll feature
  // TODO put somewhere else
  let scrollingIntoView = false
  let usersLastScroll = 0

  function userIsScrolling(){
    return usersLastScroll - Date.now() > -10 
  }

  function autoScroll(w){

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

  mark.listen({
    "mouseover": (e, comp) => {
      console.log('mouseover mark')
    }
  })

  mark.addToChain(logger, autoScroll)
  return mark
}

const Word = (element, i) => {
  let w = new PragmaWord({key: i, value: 0}).from(element, true)
  let thisw = w.element.find('w')
  if (thisw.length==0) {
    w.listen({
      "click": (e, comp) => {
        // console.log(comp)
        comp.summon().then(() => {
          comp.parent.value = comp.key
        })
      },
      "mouseover": (w, comp) => {
        comp.css("background #5e38c74a") // TODO add customizable options this, maybe a theme thing
      },
      "mouseout": (w, comp) => comp.css("background transparent")
    })
  }

  // w.element.css({"border": ".5px dashed lightgray"}) 
  // w.css("border .5px dashed lightgray")
  thisw.each( (i, el) => {
    let ww = Word(el, i)
    w.add(ww)
  })
  w.value = 0
  w.setRange(0, w.kidsum)

  // w.addToChain((v, master, trigger) => {
  //   console.log(v, master, trigger)
  // })
  return w
}


export const Lector = (l, options=default_options) => {
  l = $(l)
  if (options.wfy) wfy(l)
  let w = Word(l)
  let lec = new PragmaLector({key:"lector"}).connectTo(w)
  //console.table(w)
  lec.settings = LectorSettings(lec).pragmatize("#lector")
  lec.mark = Mark(lec)

  lec.value = 0
  // w.value = 0
  lec.addToChain((v, comp, other) => {
    // console.log(v,comp, other)
    // comp.element.fadeOut()
    // console.log(v, comp, oter)
    // console.log( w.currentWord.pre.text(), w.currentWord.text(), w.currentWord.next.text())
    // console.log( w.currentWord.text(), w.currentWord.first_in_line)
    // w.currentWord.read()
    // console.log(w.currentWord.mark)
    // console.log(w.currentWord.mark)
  })

  function bindKeys(){
    lec.bind("right", (() => { w.value += 1}))
    lec.bind("left", (() => { w.value -= 1}))

    lec.bind("space", (() => {
      lec.toggle()
      return false
    }), "keyup")
    lec.bind("space", (() => {
      // lec.toggle()
      return false
    }), "keydown")
  }

  bindKeys()
  // let words = []
  // $("w").each( (i, el) => {
  //   let w = Word(el, i)
  //   // lec.add(w)
  //   // words.push(w)
  //   w.element.css({"border": ".5px dashed lightgray"}) 
  // })

  if (options.pragmatizeOnCreate) lec.pragmatize()
  return lec
}

// export default function lector(paper){
  
//   console.log(paper.text())
//   // this
//   let lec = Lector(paper.element)
//   lec.pragmatize()

//   return ["lector"]
// }

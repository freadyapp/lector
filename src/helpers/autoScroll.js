import { elementify } from './pragmafy.js'
import { _e, util, _p } from "pragmajs"
import anime from "animejs"

// function getViewportHeight(){
//   return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
// }
//
// export function getRelativeScreen(el){
//   el = elementify(el)
//   let eee = _e(el)
//   let rect = el.getBoundingClientRect()
//   return  {
//             top: rect.top, // has to be bigger than 0
//             bottom: rect.bottom-getViewportHeight()// has to be smaller than
//           }
// }

globalThis.lectorSpace = globalThis.lectorSpace || {}

export function isElementWithin(el, r={}){
  let off = el.offset()
  let elTop = off.top
  let elBot = off.top + el.rect().height
  return (elTop <= r.bot && elBot >= r.top) || (elTop <= r.top && elBot >= r.bot)
}

export function isMostlyInScreen(el, percent=.5){
  if (!el) throw util.throwSoft(`couldnt not evaluate if [${el}] is on screen`)
  el = elementify(el)
  return isOnScreen(el, percent*el.rect().height) // is 70% on screen
}

export function isOnScreen(el, threshold=100){
  if (!el) throw util.throwSoft(`couldnt not evaluate if [${el}] is on screen`)
  el = elementify(el)
  let winTop = window.scrollY
  let winBot = winTop + window.innerHeight
  let eee = isElementWithin(el, {top: winTop+threshold , bot: winBot-threshold})
  return eee
}

export function scrollTo(el, duration=200, threshold=200){
  // behavior
  // closer, will scroll little bit downwards or upwards
  // until the element is in view for more than the threshold

  //return new Promise(r => r())
  //el = jqueryfy(el)
  //

  el = elementify(el)
  return new Promise((resolve, reject) => {
    const body = window.document.scrollingElement || window.document.body || window.document.documentElement;
    const top = el.offset().top - threshold
    anime({
      targets: body,
      scrollTop: top,
      duration: duration,
      easing: 'easeInOutSine',
    }).finished.then(() => {
      setTimeout(resolve, 20)
    })
  })
}



function _onScroll(cb, throttle=0){
  let last = 0;
  let ticking = false;
  document.addEventListener('scroll', function(e) {
    // console.log('fire scroll')
    let temp = last
    last = window.scrollY;
    if (!ticking) {
      window.requestAnimationFrame(function() {
        cb(last, last-temp, e);
        setTimeout(() => {
          ticking = false;
        }, throttle)
      });
      ticking = true;
    }
  }, true);
}

export function onScroll(cb, throttle){
  if (!globalThis.lectorSpace.scrollChain){
    util.createChains(globalThis.lectorSpace, 'scroll')
    _onScroll((scroll, ds, event) => {
      globalThis.lectorSpace.scrollChain.exec(scroll, ds, event)
    }, 0)
  }
  globalThis.lectorSpace.onScroll(cb)
}

function _onScrollEnd(cb, delta){

  let scrollData = { s: null, ds: null, e: null }
  var t

  onScroll((s, ds, e) => {
    scrollData = {
      s,
      ds,
      e
    }

    if (t) clearTimeout(t)

    t = setTimeout(_ => {
      cb(scrollData.s, scrollData.ds, scrollData.e)
    }, delta)
  })
}

let scroller = _p()
                  .createEvent('scrollEnd')
                  .run(function() {
                    _onScrollEnd((...args) => {
                      console.log('SCROLL ENDED')
                      this.triggerEvent('scrollEnd', ...args)
                    }, 220)
                  })

export function onScrollEnd(cb, delta=50){
  return scroller.on('scrollEnd', cb)
  // _onScrollEnd((scroll, ds, e) => {
    // scroller.triggerEvent('scrollEnd')
    // globalThis.lectorSpace.scrollEndChain.exec(scroll, ds, e)
  // }, delta)
}

//export function onSlowScroll(cb, sensit=10){
  //onScroll((_, dp) => {
    //if (dp<=sensit) cb()
  //})
//}

function _onScroall(cb, throttle=0){
  let last = 0;
  let ticking = false;
  document.addEventListener('scroll', function(e) {
    // console.log('fire scroll')
    let temp = last
    last = window.scrollY;
    if (!ticking) {
      window.requestAnimationFrame(function() {
        cb(last, last-temp, e);
        setTimeout(() => {
          ticking = false;
        }, throttle)
      });
      ticking = true;
    }
  }, true);
}

 function aonScroll(cb, throttle){
  if (!globalThis.lectorSpace.scrollChain){
    util.createChains(globalThis.lectorSpace, 'scroll')
    _onScroll((scroll, ds, event) => {
      globalThis.lectorSpace.scrollChain.exec(scroll, ds, event)
    }, 0)
  }
  globalThis.lectorSpace.onScroll(cb)
}

export const _scroller = _p()
                    .createWires('scrollData', 'scrollTarget')
                    .createEvents('scrollStart', 'scroll', 'scrollEnd')
                    .define(
                      function test(will){
                        console.log('pleeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeease work first try holy shit')
                      }
                    )
                    .run(function() {
                      let last = 0
                      let ticking = false

                      document.addEventListener('scroll', (e) => {
                        // let temp = last
                        // console.log(e.target)
                        this.scrollTarget = e.target === document ? window.scrollY : _e(e.target).scrollTop;
                        if (!ticking) {
                          window.requestAnimationFrame(() => {
                            this.setScrollData([last, e])
                            this.triggerEvent('scroll', last, e)
                            // setTimeout(() => {
                              ticking = false;
                            // }, throttle)
                          });
                          ticking = true;
                        }
                      }, true)

                      // this.test()
                    })
                    .on('scrollTargetChange', function(old, n) {
                      if (old !== n) console.log('new fukcing target')
                    })
                    .on('scrollDataChange', function(s, ls) {
                      let ds = ls ? s[0] - ls[0] : undefined
                      console.log('aaaaaaaaaaaaaaaaaaaa', s, ls, ds)
                      this.triggerEvent('scroll', s[0], ds, s[1])
                    }).on('scroll', function(s, ds, event) {
                      console.log('scroll', s, ds, event)
                    })
                    


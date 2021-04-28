import { elementify } from './pragmafy.js'
import { _e, util, _p, _thread } from "pragmajs"
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
  if (!el) return console.error(`couldnt not evaluate if [${el}] is on screen`)
  el = elementify(el)
  return isOnScreen(el, percent*el.rect().height) // is 70% on screen
}

export function isOnScreen(el, threshold=100){
  if (!el) return console.error(`couldnt not evaluate if [${el}] is on screen`)
  el = elementify(el)
  let winTop = window.scrollY
  let winBot = winTop + window.innerHeight
  let eee = isElementWithin(el, {top: winTop+threshold , bot: winBot-threshold})
  return eee
}

export function scrollTo(el, duration=200, threshold=200){
  return _scroller.scrollTo(el, duration, threshold)
  // behavior
  // closer, will scroll little bit downwards or upwards
  // until the element is in view for more than the threshold

  //return new Promise(r => r())
  //el = jqueryfy(el)
  //

  // el = elementify(el)
  // return new Promise((resolve, reject) => {
  //   const body = window.document.scrollingElement || window.document.body || window.document.documentElement;
  //   const top = el.offset().top - threshold
  //   anime({
  //     targets: body,
  //     scrollTop: top,
  //     duration: duration,
  //     easing: 'easeInOutSine',
  //   }).finished.then(() => {
  //     setTimeout(resolve, 20)
  //   })
  // })
}

export function onGlobalScroll(cb) {
  return _scroller.on('scroll', cb)
}

export function onScroll(cb) {
  return _scroller.on('userScroll', cb)
}

export function onGlobalScrollEnd(cb, delta=50){
  return _scroller.on('scrollEnd', cb)
}
export function onScrollEnd(cb, delta=50){
  return _scroller.on('userScrollEnd', cb)
}

function getScrollParent(node) {
  if (node == null) {
    return null;
  }

  if (node.scrollHeight > node.clientHeight) {
    return node;
  } else {
    return getScrollParent(node.parentNode);
  }
}

const bodyScroll = window.document.scrollingElement || window.document.body || window.document.documentElement;
export const _scroller = _p()
                    .createWires('scrollData', 'scrollTarget', 'scrolling')
                    .createEvents('scrollStart', 'userScroll', 'scroll', 'scrollEnd', 'userScrollEnd', 'newScrollTarget')
                    .define({

                      scrollTo(el, duration, threshold) {
                        this._selfScrolling = true
                        _e(el).scrollIntoView({
                          block: 'center',
                          behavior: 'smooth',
                          inline: 'center'
                        })
                        return new Promise((r, re) => {
                          this.onNext('scrollEnd', () => {
                            setTimeout(() => {
                              this._selfScrolling = false
                              r()
                            }, 10)
                          })
                        })
                        // if (!el) return new Promise(r => r())
                        // if (!el) return new Promise(r => r())
                        // this._selfScrolling = true
                        // // console.log('scrolling to', el)
                        // // console.log('scroll parent', getScrollParent(el))
                        // // console.log('scroll parent parent', getScrollParent(getScrollParent(el).parentNode))
                        // // let node = el
                        // // while (node && node !== document) {
                        //   // node = getScrollParent(node)
                        //   // console.log(node)

                        //   // node = node.parentNode
                        // // }

                        // // if (el !== document) 
                        // let parent = el === document.body ? bodyScroll : getScrollParent(el)
                        // if (!parent) return new Promise(r => r())
                        // return new Promise((resolve, reject) => {
                        //   const top = _e(el).offset().top - threshold
                        //   anime({
                        //     targets: parent,
                        //     scrollTop: top,
                        //     duration: duration,
                        //     easing: 'easeInOutSine',
                        //   }).finished.then(async () => {
                        //     await this.scrollTo(parent.parentNode, duration, threshold)

                        //     setTimeout(() => {
                        //       this._selfScrolling = false
                        //       resolve()
                        //     }, 20)

                        //   })
                        // })
                      }
                    })
                    .run(function() {
                      let last = 0
                      let ticking = false

                      document.addEventListener('scroll', (e) => {
                        // let temp = last
                        // console.log(e.target)
                        this.setScrollTarget(e.target)
                        last = e.target === document ? window.scrollY : _e(e.target).scrollTop;
                        if (!ticking) {
                          window.requestAnimationFrame(() => {
                            this.setScrollData([last, e])
                            // this.triggerEvent('scroll', last, e)
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
                      if (old !== n) this.triggerEvent('newScrollTarget') 
                    })
                    .on('scrollDataChange', function(s, ls) {
                      let ds = ls ? s[0] - ls[0] : undefined
                      // console.log('aaaaaaaaaaaaaaaaaaaa', s, ls, ds)
                      this.triggerEvent('scroll', s[0], ds, s[1])
                    }).on('scroll', function(s, ds, event) {
                      if (!this.scrolling) {
                        this.triggerEvent('scrollStart', s, ds, event)
                        this.scrolling = true

                        this.onNext('scrollEnd', () => {
                          this.scrolling = false
                        })
                      }

                    }).on('scroll', function(s, ds, event) {

                        if (!this._selfScrolling){
                            this.triggerEvent('userScroll', s, ds, event)
                            if (this._userScrollEndTimeout) clearTimeout(this._userScrollEndTimeout)
                            this._userScrollEndTimeout = setTimeout(_ => {
                              this.triggerEvent('userScrollEnd', s, ds, event)
                            }, 150)
                        }

                        if (this._scrollEndTimeout) clearTimeout(this._scrollEndTimeout)
                        this._scrollEndTimeout = setTimeout(_ => {
                          this.triggerEvent('scrollEnd', s, ds, event)
                        }, 50)

                    })
                    // .on('scrollEnd', () => {
                    //   // console.log('SCROLL JAS ENDED')
                    // }).on('scrollStart', () => {
                    //   // console.log('STATRT SCROLl')
                    // })

                    


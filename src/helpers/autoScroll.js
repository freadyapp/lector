import { elementify } from './pragmafy.js'
import { _e, util, _p, Pragma } from 'pragmajs'
import anime from 'animejs'
import _ from './smoothScroll'  // polyfill scrollIntoView

globalThis.lectorSpace = globalThis.lectorSpace || {}

const boundValueInRange = (val, min, max) => Math.min(Math.max(val, min), max)

export function isElementWithin(el, r = {}) {
  let off = el.offset()
  let elTop = off.top
  let elBot = off.top + el.rect().height
  return (elTop <= r.bot && elBot >= r.top) || (elTop <= r.top && elBot >= r.bot)
}

export function isMostlyInScreen(el, percent = 0.5) {
  if (!el) return console.error(`couldnt not evaluate if [${el}] is on screen`)
  el = elementify(el)
  return isOnScreen(el, percent * el.rect().height) // is 70% on screen
}

export function isOnScreen(el, threshold = 100) {
  if (!el) return console.error(`couldnt not evaluate if [${el}] is on screen`)
  el = elementify(el)
  let winTop = window.scrollY
  let winBot = winTop + window.innerHeight
  let eee = isElementWithin(el, { top: winTop + threshold, bot: winBot - threshold })
  return eee
}

export function scrollTo() {
  return _scroller.scrollTo(...arguments)
}

export function onGlobalScroll(cb) {
  return _scroller.on('scroll', throttle(cb))
}

export function onScroll(cb) {
  return _scroller.on('userScroll', throttle(cb))
}

export function onGlobalScrollEnd(cb, delta = 50) {
  return _scroller.on('scrollEnd', throttle(cb))
}
export function onScrollEnd(cb, delta = 50) {
  return _scroller.on('userScrollEnd', throttle(cb))
}

function getScrollParent(node) {
  if (node == null) {
    return null
  }

  if (node.scrollHeight > node.clientHeight) {
    return node
  } else {
    return getScrollParent(node.parentNode)
  }
}

const bodyScroll =
  window.document.scrollingElement || window.document.body || window.document.documentElement
export const _scroller = _p()
  .createWires('scrollData', 'scrollTarget', 'scrolling')
  .createEvents(
    'scrollStart',
    'userScroll',
    'scroll',
    'scrollEnd',
    'userScrollEnd',
    'newScrollTarget'
  )
  .define({
    async scrollTo(el, behavior='smooth', inline='center') {
      if (!el) return new Promise((resolve, reject) => {
        reject(null)
      })

      el = _e(el)
      this._selfScrolling = true

      await el.scrollIntoView({
        block: 'center',
        behavior: 'smooth',
        inline,
      })

      this._selfScrolling = false
      return; 
    },
  })
  .run(function () {
    let last = 0
    let ticking = false

    document.addEventListener(
      'scroll',
      e => {
        // let temp = last
        // console.log(e.target)
        this.setScrollTarget(e.target)
        last = e.target === document ? window.scrollY : _e(e.target).scrollTop
        if (!ticking) {
          window.requestAnimationFrame(() => {
            this.setScrollData([last, e])
            // this.triggerEvent('scroll', last, e)
            // setTimeout(() => {
            ticking = false
            // }, throttle)
          })
          ticking = true
        }
      },
      true
    )
    // this.test()
  })
  .on('scrollTargetChange', function (old, n) {
    if (old !== n) this.triggerEvent('newScrollTarget')
  })
  .on('scrollDataChange', function (s, ls) {
    let ds = ls ? s[0] - ls[0] : undefined
    // console.log('aaaaaaaaaaaaaaaaaaaa', s, ls, ds)
    this.triggerEvent('scroll', s[0], ds, s[1])
  })
  .on('scroll', function (s, ds, event) {
    if (!this.scrolling) {
      this.triggerEvent('scrollStart', s, ds, event)
      this.scrolling = true

      this.onNext('scrollEnd', () => {
        this.scrolling = false
      })
    }
  })
  .on('scroll', function (s, ds, event) {
    if (!this._selfScrolling) {
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

class Throttler extends Pragma {
  init(fn, throttleValue=50, animationFrame=true) {
    this.action = fn
    this.ticking = false
    this.animationFrame=true
    this.throttleValue=throttleValue
  }

  call(...params) {
    if (!this.ticking) {
      const _call = (() => {
        this.action && this.action(...params)
        this.ticking = false
      })

      if (this.timeout) clearTimeout(this.timeout)
      this.timeout = setTimeout(() => {
        if (this.animationFrame) return window.requestAnimationFrame(_call)
        _call()
      }, this.throttleValue)

      this.ticking = true
    }
  }
}


export const _throttler = (...params) => new Throttler(...params)

//fn, value=50, animationFrame=true
export function throttle() {
  let throttle = _throttler(...arguments)
  return (...params) => {
    throttle.call(...params) 
  };
}

export const _mouse = _p()
  // .createWires('scrollData', 'scrollTarget', 'scrolling')
  .createEvents('move')
  .run(function () {
    let onMouseMove = throttle(e => {
      this.triggerEvent('move')
    }, 250);

    document.addEventListener('mousemove', e => {
      onMouseMove(e)
    }, true)
  })
  //.on('move', e => {
    //console.log('i moved')
  //})

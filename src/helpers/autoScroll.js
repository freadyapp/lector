import { elementify } from './pragmafy.js'
import { _e, util } from "pragmajs"
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

export function isElementWithin(el, r={}){
  let off = el.offset()
  let elTop = off.top
  let elBot = off.top + el.rect().height
  return (elTop <= r.bot && elBot >= r.top) || (elTop <= r.top && elBot >= r.bot)
}

export function isMostlyInScreen(el, percent=.7){
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

export function onScroll(cb=(s)=>{}){

  let last = 0;
  let ticking = false;
  document.addEventListener('scroll', function(e) {
    let temp = last
    last = window.scrollY;
    if (!ticking) {
      window.requestAnimationFrame(function() {
        cb(last, last-temp);
        ticking = false;
      });

      ticking = true;
    }
  });
}

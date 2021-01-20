import { elementify } from './pragmafy.js'
import anime from "animejs"

function getViewportHeight(){
  return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
}

export function getRelativeScreen(el){
  el = elementify(el) 
  let viewportHeight = getViewportHeight()
  let rect = el.getBoundingClientRect()
  return  {
            top: rect.top, 
            bottom: viewportHeight-rect.bottom
          }
}

export function isOnScreen(el, threshold=100){
  el = elementify(el) 
  let viewportHeight = getViewportHeight()
  let rect = el.offset()
  let sm = getRelativeScreen(el, threshold)
  return !(sm.top < threshold || sm.bottom < threshold)
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

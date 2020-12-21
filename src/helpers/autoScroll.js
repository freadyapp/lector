import { vanillafy, jqueryfy } from './pragmafy.js'
import anime from "animejs"

export function isOnScreen(el, threshold=100){
  el = vanillafy(el)
  let viewportHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight,
    rect = el.getBoundingClientRect()
  //console.log(rect.top, rect.bottom)
  //console.log(viewportHeight)
  return !(rect.bottom > viewportHeight-threshold || rect.top < threshold)
}

export function scrollTo(el, duration=200, threshold=200){
  // behavior
  // closer, will scroll little bit downwards or upwards 
  // until the element is in view for more than the threshold
  
  //return new Promise(r => r())
  el = jqueryfy(el)
  //console.log('scrolling to', el)
  return new Promise((resolve, reject) => {
    //window.scroll({
      //top: el.getBoundingClientRect().top,
      //behavior: 'smooth'
    //})
    const body = window.document.scrollingElement || window.document.body || window.document.documentElement;
    console.log('scrolling with anime')
    const top = el.offset().top - threshold
    console.log(top)
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
  
  let last_known_scroll_position = 0;
  let ticking = false;
  document.addEventListener('scroll', function(e) {
    last_known_scroll_position = window.scrollY;
    if (!ticking) {
      window.requestAnimationFrame(function() {
        cb(last_known_scroll_position);
        ticking = false;
      });

      ticking = true;
    }
  });
}

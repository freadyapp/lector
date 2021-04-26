// import { Lector } from '../src'
// import { Word } from "../src/lector"
//


function setG(obj, value){
  if (typeof obj === 'object'){
    for (let [key, val] of Object.entries(obj)) setG(key, val)
    return
  }
  return window.localStorage.setItem(obj, JSON.stringify(value))
}

function getG(key){
  return JSON.parse(window.localStorage.getItem(key))
}

// setG({'lector.onboarding.show?': false})

// pragmaSpace.dev = true
lector.dev()
lector.globalify()

function fetchContent(index){
  // return content[index]

  return new Promise(resolve => {
    setTimeout(_ => {
      let txt = ""

      let abc = "abcdefghijklmnopqrstuvwrxyz "
      let len = abc.length
      let words = 1000

      while (words > 0){
        txt += abc.charAt(Math.floor(Math.random()*len))
        if (Math.floor(Math.random()*6) == 3){
          txt += " "
          words --
        }
      }
      //resolve(`<div class="t m0 x0 h3 y27 ff1 fs0 fc0 sc0 ls0 ws0"><w>Fabian</w> <w>Dälken.</w> <w>(2014).</w> <span class="ff2 ls1"><w>Are</w> <w>Porter’s</w> <w>Five</w> <w>Competitive</w> <w>Forces</w> <w>still</w> </span></div>`)
      resolve(`<h1> Page ${index} </h1> <p>This is a test which copefully will not confirm my own suspicions. ${txt}</p>`)
    }, Math.random()*1900)
  })
}

//function onFetch(p, index){
  //console.log("P >>>>>>>>", p)
  //return new Promise(resolve => {
    //setTimeout(_ => {
      //p.css('background lime')
      //resolve()
    //}, Math.random()*1000)
  //})
//}


let shadow = _shadow().as(".article")

let lectorSettings = {
   onboarding: !getG('lector.onboarding.show?'),
   wfy: true,
   loop: false,
   autostart: false,

   fullStyles: true,
   defaultStyles: true,

   styleInjector: (style, name) => {
      shadow.injectStyle(name, style)
   },

   scaler: true,
  //  pragmatizeOnCreate: true,
   experimental: true,
  
  //  legacySettings: true,
   settings: true,
  //  shadow: 
  //  stream: fetchContent,
    // function with index as param that
    // returns the content for the page
    // can return a promise
}



// window.localStorage.setItem("test", JSON.stringify(obj))
// console.log(">>>>>>", JSON.parse(window.localStorage.getItem("test"))['test'])

pragmaSpace.integrateMousetrap(Mousetrap)

let lec = Lector(shadow.shadow, lectorSettings)
setG("lector.onboarding.show?", true)
// lec.settings.on('update', (setting, value) => {
//   console.log(setting, value)
// })




//console.log(lec.mark.settings)
//setTimeout(_ => {
  //lec.paginator.goTo(parseInt(prompt()))
//}, 5000)
//
//lec.paginator.value = 55
//setTimeout(_ => {
  //console.log(lec.paginator.pages.get(55))
  //lecUtil.scrollTo(lec.paginator.pages.get(55))
//}, 500)


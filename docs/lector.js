// import { Lector } from '../src'
// import { Word } from "../src/lector"

lector.globalify()

function fetchContent(index){
  // return content[index]

  return new Promise(resolve => {
    setTimeout(_ => {
      let txt = ""

      let abc = "abcdefghijklmnopqrstuvwrxyz "
      let len = abc.length
      let words = 100

      while (words > 0){
        txt += abc.charAt(Math.floor(Math.random()*len))
        if (Math.floor(Math.random()*6) == 3){
          txt += " "
          words --
        }
      }
      resolve(txt)
    }, Math.random()*2900)
  })
}

function onFetch(p, index){
  console.log("P >>>>>>>>", p)
  return new Promise(resolve => {
    setTimeout(_ => {
      p.css('background lime')
      resolve()
    }, Math.random()*1000)
  })
}

let lectorSettings = {
  // these are the default values
  "toolbar": false,
  "wfy": true,
  "topbar": false,
  "loop": false,
  "autostart": false,
  // "interactive": true,
  pragmatizeOnCreate: true,
  experimental: true,

 stream: fetchContent,// function with index as param that
                      // returns the content for the page
                      // can return a promise

 paginate: {
   from: 'stream',
   as: 'infiniteScroll',
   config: {
    onPageActive: (p, index) => {
      p.css('background green')
      p.onFetch(function(){
        // return onFetch(p)
        if (p.active) {
          if (!p.word){
            console.log('this.lec', p.lec)
            lector.helpers.wfy(p)
            p.word = Word(p).setKey(index)
            
            p.lec.addWord(p.word)
            console.log("appended new page with key", p.word.key)
          }
          p.css('background whitesmoke')
          // p.lec.connectTo(p.word)
        }
      })
    },

    onPageInactive: p => {
      p.css('background gray')
      if (p.word){ 
        p.lec.removeWord(p.word.key)
        p.word = p.word.destroy()
      }
    },
    onPageAdd: p => p.css("background lightgray"),
    onCreate: p => p.html("...")
  }
 }
}

pragmaSpace.dev = true
pragmaSpace.integrateMousetrap(Mousetrap)

let lec = Lector(".article", lectorSettings)

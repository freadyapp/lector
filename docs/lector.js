// import { Lector } from '../src'

const content = [
  'lalallalalalalalala fear me',
  'hohohoho listen to me',
  'meemememe fuck with me',
  'piriri pirririri bear me'
]

function fetchContent(index){
  // return content[index]
  return new Promise(resolve => {
    setTimeout(_ => {
      resolve(Math.random())
    }, Math.random()*1900)
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
      onPageActive: p => {
        p.css('background green')
        p.onFetch(function(){
          if (p.active) p.css('background lime')
        })
      },
      onPageInactive: p => p.css('background gray'),
      onPageAdd: p => p.css("background gray"),
      onCreate: p => p.html("...")
    }
   }
}

pragmaSpace.dev = true
pragmaSpace.integrateMousetrap(Mousetrap)

let lec = Lector("#article", lectorSettings)

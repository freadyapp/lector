// import { Lector } from '../src'

const content = [
  'lalallalalalalalala fear me',
  'hohohoho listen to me',
  'meemememe fuck with me',
  'piriri pirririri bear me'
]

function fetchContent(index){
  return content[index]
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
   
   stream: fetchContent,
   paginate: {
     from: 'stream',
     as: 'infiniteScroll'
   }
}

pragmaSpace.dev = true
pragmaSpace.integrateMousetrap(Mousetrap)

let lec = Lector("#article", lectorSettings)

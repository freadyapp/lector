import Lector from '../src'





let lectorSettings = {
  // these are the default values
  "toolbar": false,
  "topbar": false,
  "loop": false,
  "autostart": false,
  "interactive": true,
  "shortcuts": true // if interactive is false, this option doesnt do anything
}

let lec = new Lector($("#article"), lectorSettings)
lec.read()
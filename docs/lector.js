import { Lector } from '../src'

let lectorSettings = {
  // these are the default values
  "toolbar": false,
  "wfy": true,
  "topbar": false,
  "loop": false,
  "autostart": false,
  "interactive": true,
  "pragmatizeOnCreate": true,
  "shortcuts": true // if interactive is false, this option doesnt do anything
}

let lec = Lector($("#article"), lectorSettings)
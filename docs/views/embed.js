function setG(obj, value) {
  if (typeof obj === 'object') {
    for (let [key, val] of Object.entries(obj)) setG(key, val)
    return
  }
  return window.localStorage.setItem(obj, JSON.stringify(value))
}

function getG(key) {
  return JSON.parse(window.localStorage.getItem(key))
}

pragmaSpace.integrateMousetrap(Mousetrap)
// setG({'lector.onboarding.show?': false})

// pragmaSpace.dev = true
// lector.prod()
lector.globalify()

let lectorSettings = {
  debug: true,
  onboarding: false,
  wfy: true,
  loop: false,
  autostart: true,
  autoScroll: false,
  experimental: true,
  shortcuts: true,
  global: true,

  lectorini: true,

  fullStyles: false,
  defaultStyles: true,
}

// window.localStorage.setItem("test", JSON.stringify(obj))
// console.log(">>>>>>", JSON.parse(window.localStorage.getItem("test"))['test'])

_e('body')
  .findAll('[lectorini]')
  .forEach(e => {
    let lec = Lector(e, lectorSettings)
  })
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

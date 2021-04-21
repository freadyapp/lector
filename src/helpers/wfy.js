import { _e, util } from 'pragmajs'

// function wfyInner(desc){
//   if (!desc) return false
//   desc = _e(desc)
//   let txt = desc.textContent
//   if (txt.length === 0) return false

//   let inner = ""
//   for (let txt of desc.textContent.split(" ")){
//     // console.log(txt)
//     let noWhiteSpace = txt.replace(/\s/g, "")
//     inner += noWhiteSpace.length!=0 ? "<w>"+txt.split(" ").join("</w> <w>")+"</w> " : txt
//   }

//   desc.html(inner)
// }

// function wfyElement(element){
//   element = _e(element)
//   let nodes = element.findAll("*")
//   if (nodes.length == 0) return wfyInner(wfyInner(element))
//   nodes.forEach(desc => wfyElement(desc))
// }

// export function wfy(element){
//   // console.log(`wfying ${JSON.stringify(element)}`)
//   element = _e(element)
//   // if (element.textContent.replaceAll(" ", "").length<1) return false
//   let txtNodes = element.findAll("*")
//   if (txtNodes.length==0) return wfyElement(element)
//   // txtNodes.each((i, el) => {
//   //   wfy(el)
//   // })
//   txtNodes.forEach(el => wfy(el))
//   return true
// }


let parser = new DOMParser()

export function escapeHtml(unsafe) {
  return unsafe
    // .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
  // .replace(/"/g, "&quot;")
  // .replace(/'/g, "&#039;");
}

const wregex = /(\w+)/gm
const obsKey = util.rk(5)
const obs = {
  "<": `;;#${obsKey}0;`,
  ">": `;;#${obsKey}1;`
}

let obsegex = {}
for (let [key, value] of Object.entries(obs)) {
  obsegex[key] = new RegExp(value, "gm")
}

const esc = (str) => str.replace(/</g, obs["<"])
  .replace(/>/g, obs[">"])

const unesc = (str) => {
  const r = (key) => obsegex[key]
  return str.replaceAll(r("<"), "<")
    .replaceAll(r(">"), ">")
}

function wegex(str) {
  // return str
  return str.replaceAll(wregex, (match, re) => esc("<w>") + escapeHtml(re) + esc("</w> "))
}

function wfyInner(desc) {
  if (desc == undefined) return desc
  if (desc.tagName == "CODE" || desc.tagName == "PRE") return desc
  if (desc.tagName == undefined) {
    // if text, wfy it and return node
    desc.textContent = wegex(desc.textContent)
    return desc
  }
  let og = desc
  let childMap = new Map()
  desc = og.cloneNode(true)

  let childTag = (key) => `{{{{@L3C:${key}:}}}}`

  desc.childNodes.forEach((element, i) => {
    let key = i.toString()
    childMap.set(key, element.cloneNode(true))
    element.replaceWith(childTag(key))
  })


  let txt = desc.innerHTML
  const regex = /\{{4}@L3C:(.+?(?=\:)).+?(?=\}{4})\}{4}/gm

  function replaceElement(match, key) {
    let child = childMap.get(key)
    let inner = wfyInner(child)

    // console.log(inner.innerHTML)
    // inner.innerHTML = inner.textContent.replaceAll(wregex, (match, re) => `<w>${re}</w>`)
    // console.log(inner.innerHTML)
    let outer = inner.outerHTML
    if (outer) return outer
    return parser.parseFromString(unesc(inner.textContent), "text/html").documentElement.innerHTML
  }

  const parse = txt.replaceAll(regex, replaceElement)
  // console.log(parser.parseFromString(parse, "text/html").documentElement.innerHTML)
  og.innerHTML = parse
  // og.innerHTML = parser.parseFromString((parse), "text/html").documentElement.innerHTML
  return og
}

export function wfyElement(element) {
  return wfyInner(element)
}

export function wfy(element) {
  element.addClass('wfying')
  return new Promise(resolve => {
    // setTimeout(() => {
    console.time('wfying...')
    wfyElement(element)
    element.removeClass('wfying')
    resolve()
    console.timeEnd('wfying...')
    // }, 200)
  })
}

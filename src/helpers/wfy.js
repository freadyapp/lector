import { _e, util } from 'pragmajs'

function wfyInner(desc){
  if (!desc) return false
  desc = _e(desc)
  let txt = desc.textContent
  if (txt.length === 0) return false

  let inner = ""
  for (let txt of desc.textContent.split(" ")){
    // console.log(txt)
    let noWhiteSpace = txt.replace(/\s/g, "")
    inner += noWhiteSpace.length!=0 ? "<w>"+txt.split(" ").join("</w> <w>")+"</w> " : txt
  }

  desc.html(inner)
}

function wfyElement(element){
  element = _e(element)
  let nodes = element.findAll("*")
  if (nodes.length == 0) return wfyInner(wfyInner(element))
  nodes.forEach(desc => wfyElement(desc))
}

export function wfy(element){
  // console.log(`wfying ${JSON.stringify(element)}`)
  element = _e(element)
  // if (element.textContent.replaceAll(" ", "").length<1) return false
  let txtNodes = element.findAll("*")
  if (txtNodes.length==0) return wfyElement(element)
  // txtNodes.each((i, el) => {
  //   wfy(el)
  // })
  txtNodes.forEach(el => wfy(el))
  return true
}

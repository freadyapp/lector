function wfyInner(desc){
  let txt = desc.textContent
  let inner = ""
  for (let txt of desc.textContent.split(" ")){
    let noWhiteSpace = txt.replace(/\s/g, "")
    inner += noWhiteSpace.length!=0 ? "<w>"+txt.replaceAll(" ", "</w> <w>")+"</w> " : txt
  }
  $(desc).replaceWith(inner)
}

function wfyElement(element){
  element.descendants(true).each( (i, desc)=> {
    if (desc.textContent.replaceAll("\n", "").trim().length == 0) return false
    wfyInner(desc)
  })
}

export function wfy(element){
  element = $(element)
  let wfied_text = ""
  if (element.text().replaceAll(" ", "").length<1) return false
  let txtNodes = element.find("p, div, h1, h2, h3, h3, h4, h5, article, text")
  if (txtNodes.length==0) return wfyElement(element)
  txtNodes.each((i, el) => {
    wfy(el)
  })
  return true
}


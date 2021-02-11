const reset = `border 0
               border-radius 3px
               z-index 10
               opacity 1
               mix-blend-mode darken;`


const modes = {
  'hotbox': bg => `background ${bg}`,

  'underneath': bg => ` background transparent
                        border-bottom 3px solid ${bg}
                        border-radius 4px`,

  'faded': bg => `
      background: rgb(255,255,255);
      background: -moz-linear-gradient(90deg, rgba(255,255,255,0) 0%, ${ bg } 25%, ${ bg } 75%, rgba(255,255,255,0) 100%);
      background: -webkit-linear-gradient(90deg, rgba(255,255,255,0) 0%, ${ bg } 25%, ${ bg } 75%, rgba(255,255,255,0) 100%);
      background: linear-gradient(90deg, rgba(255,255,255,0) 0%, ${ bg } 25%, ${ bg } 75%, rgba(255,255,255,0) 100%);
      filter: progid:DXImageTransform.Microsoft.gradient(startColorstr="#ffffff",endColorstr="#ffffff",GradientType=1);
    `
}

function grabMode(mode, bg) {
  return reset + modes[mode](bg)
}

export const mode_ify = (mark, mode=mark._mode, bg=mark._color) => {
  mode = (mode || 'hotbox').toString().toLowerCase()
  let css = grabMode(mode, bg)
  if (mark) mark.css(css)
  return css
}

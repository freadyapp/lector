const reset = `border 0
               border-radius 3px
               z-index 10
               opacity 1
               mix-blend-mode darken;`

const modes = (mode, bg) => {
  return reset.concat({
    "hotbox": `background ${bg}`,
    "underneath": `background transparent
                   border-bottom 3px solid ${bg}
                   border-radius 4px
                   `,
    "faded": `
      background linear-gradient(0.25turn, rgba(255, 0, 0, 0), ${ bg }, ${ bg }, ${ bg }, rgba(255, 0, 0, 0))
    `, 
  }[mode])
}

// TODO add default modes
export const mode_ify = (mark, mode = "hotbox", bg ="#edd1b0") => {
  mode = mode.toString().toLowerCase()
  // console.log("mode-ifying,", mark)
  // console.log(mode, bg)
  // console.log(modes(mode, bg))
  let css = modes(mode, bg)
  if (mark) mark.css(css)
  return css
}

import { Pragma, util, _e } from "pragmajs"
import css from "../styles/styles.json"

util.addStyles(css.slider)
  
export function slider(conf={}){
  
  
  this._n = function(){ 
    let range = this.range || { min: 1, max: 100}
    return 100/(range.max||100-range.min||1)
  }


  this.do(function(){
    this.element.setData({ value: this.value})
    this._setBarTo(this.value*this._n())
  })

  this._setBarTo = wp => {
    this._bar.css(`width ${wp}%`)
    this._thumb.offset()
  }

  this._clipValue = perc => {
    let v = Math.round(perc/this._n())
    if (this._lv !== v) {
      this.value = v
    }
    //console.log(this.value)
  }
  
  this._input = _e('div.').addClass('pragma-slider-bg')
  this._bar = _e('div.')
    .addClass('pragma-slider-bar')
  
  this._thumb = _e('div.pragma-slider-thumb')
  this._bar.append(this._thumb)

  this._input.append(this._bar)
  

  let onDown = function(){
    this._clicked = true
  }

  this._input.listenTo('mousedown', onDown)
  this._thumb.listenTo('mousedown', onDown)
  
  document.addEventListener('mouseup', ()=> {
    this._input._clicked = false
  })      
  
  let ticking = false

  document.addEventListener("mousemove", yx => {
    if (this._input._clicked && !ticking) {
      window.requestAnimationFrame(() => {
        ticking = false
        let w = yx.pageX-this._input.offset().left
        let wp = Math.round(Math.min(w/this._input.rect().width, 1)*100)
        this._clipValue(wp)
      })
      ticking = true;
    }
  })

  this.adopt(this._input)
  this.append(this._input)
  this.element.addClass('pragma-slider')
}
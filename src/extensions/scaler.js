import { Pragma } from 'pragmajs'
const MAX_SCALE = 120
const MIN_SCALE = 50

export class Scaler extends Pragma {
  constructor(target, duration = 70, initial = 100) {
    super()
    this.target = target
    this._duration = duration
    this.target.css(`transition transform ${this._duration}ms ease; transform-origin top`)

    this.createWire('scale')
    this.scale = initial

    this.on('scaleChange', function (v, lv) {
      if (v == lv) return false
      this.value = this.scale
      this._scaleTo(this.scale)
    })
  }

  setTarget(n) {
    this.target = n
    return this
  }

  set scaleStep(n) {
    this._scaleStep = n
  }

  get scaleStep() {
    return this._scaleStep || 5
  }

  scaleUp() {
    this.scale += this.scaleStep
  }

  scaleDown() {
    this.scale -= this.scaleStep
  }

  scaleTo(to) {
    this.scale = to
  }

  _scaleTo(value) {
    this.target.css(this._buildScaleCSS(value))
    this.currentPromise = new Promise(resolve => {
      setTimeout(() => {
        resolve()
        this.currentPromise = null
      }, this._duration + 25)
    })

    return this.currentPromise
  }

  _buildScaleCSS(value) {
    return `transform scale(${value / 100})`
  }
}

export function newScaler(target) {
  let scaler = new Scaler(target)
  return scaler
}

//scaler(element){
//this.target = element

//this
//}

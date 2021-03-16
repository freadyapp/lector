import { Pragma } from 'pragmajs'
const MAX_SCALE = 120
const MIN_SCALE = 50

export class Scaler extends Pragma {
    constructor(target){
        super()
        this.target = target
        this.target.css(`transition transform .07s ease; transform-origin top`)

        this.createWire("scale")
        this.setScaleRange(1, 10)
        this.scale = 100

        this.on('scaleShift', function(v, lv){
            if (v == lv) return false
            this._scaleTo(v)
        })
    }
    
    setTarget(n) { this.target = n; return this }
    
    set scaleStep(n){
        this._scaleStep = n
    }

    get scaleStep(){
        return this._scaleStep || 5
    }

    scaleUp(){
        this.scale+= this.scaleStep
    }
    
    scaleDown(){
        this.scale-= this.scaleStep
    }
    scaleTo(to){
        this.scale = to
    }
    
    _scaleTo(to){
        this.target.css(`transform scale(${to/100})`)
    }
}

export function scaler(){
}

export function newScaler(target) {
    let scaler = new Scaler(target)
    return scaler
}

//scaler(element){
    //this.target = element

    //this
//}
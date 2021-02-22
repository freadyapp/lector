import { Pragma } from 'pragmajs'
export class Scaler extends Pragma {
    constructor(target){
        super()
        this.target = target
        this.target.css(`transition transform .07s ease`)

        this.value = 100
        this.do(function(){
            this.scaleTo(this.value)
        })

        this.setRange(10, 400)
    }
    
    setTarget(n) { this.target = n; return this }
    
    set scaleStep(n){
        this._scaleStep = n
    }

    get scaleStep(){
        return this._scaleStep || 5
    }

    scaleUp(){
        this.value+= this.scaleStep
    }
    
    scaleDown(){
        this.value-= this.scaleStep
    }
    
    scaleTo(to){
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
import { Pragma } from 'pragmajs'
export class Scaler extends Pragma {
    constructor(target){
        super()
        this.target = target

        this.value = 1.0
        this.do(function(){
            this.scaleTo(this.value)
        })
        this.setRange(0, 50)
    }
    
    setTarget(n) { this.target = n; return this }
    
    scaleUp(){
        this.value-= 0.1
    }
    
    scaleDown(){
        this.value-= 0.1
    }
    
    scaleTo(to){
        this.target.css(`transform scale(${to})`)
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
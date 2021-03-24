import { _e, _p, Pragma, util, _thread, runAsync } from "pragmajs"
import icons from '/src/ui/icons.json'

export class popUp extends Pragma{ 

    constructor(){
        super()
        this.background 
        this.popUp
        this.popUpContent
    }

    render(){
        this.background = _e('div.blurred-bg').appendTo('body')

        this.popUp = _e('div.popUp').appendTo(this.background)

        let nextBtn = _e('div.next-btn').appendTo(this.popUp)

        this.popUpContent = _e('div')

    }



}
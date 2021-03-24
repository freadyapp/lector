import { _e, _p, Pragma, util, _thread, runAsync } from "pragmajs"
import icons from '../ui/icons.json'


export class popUp extends Pragma{ 

    constructor(){
        super()
        this.background 
        this.popUp
        this.popUpContent
        this.nextBtn
    }

    render(){
        this.background = _e('div.blurred-bg').appendTo('body')

        this.popUp = _p('popUpPragma')
                    .as(_e('div.popUp'))
                    .appendTo(this.background)
                    

        this.nextBtn = _e('div.next-btn')
                      .html(`<div class="next-icon">${icons['back-icon']}</div>`)
                      
                      .appendTo(this.popUp)

        this.popUpContent = _e('div.popUpContent').appendTo(this.popUp)

    }



}
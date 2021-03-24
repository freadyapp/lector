import {popUp} from './popUp'
import icons from '../ui/icons.json'

export class popUpOb extends popUp{
    constructor(){
        super()
        this.render()
        console.log('POPOPOPOPOPOOPOPOOPO')
        this.addContent()
    }

    addContent() {
        let speedBoat = _e('div.boat')
                        .html(`
                        <h1 class="boat-title">Press the spacebar to start/stop the pointer</h1>
                        ${icons['spacebar-3d']}
                        `)
                        .appendTo(this.popUpContent)
                        
    }
}
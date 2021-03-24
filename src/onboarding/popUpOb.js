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
        let slides = []
        let spaceBoat = _e('div.boat')
                        .html(`
                        <h1 class="boat-title">Press the spacebar to start/stop the pointer</h1>
                        ${icons['spacebar-3d']}
                        `)
                        .appendTo(this.popUpContent)
            slides.push(spaceBoat)

        let speedBoat = _e('div.boat')
                        .html(`
                        <h1 class="boat-title">Adjust the speed, by clicking or through your keyboard</h1>
                        ${icons['speedBoat']}
                        `)
                        .appendTo(this.popUpContent)
                        .addClass('displayN')
            slides.push(speedBoat)

        let clickBoat = _e('div.boat')
                        .html(`
                        <h1 class="boat-title">Adjust the speed, by clicking or through your keyboard</h1>
                        ${icons['clickBoat']}
                        `)
                        .appendTo(this.popUpContent)
                        .addClass('displayN')
            slides.push(clickBoat)

        this.popUp.adopt(...slides)
                  .run(function(){
                        console.log('CHILLLLDREEEEEN')
                        console.log(this.children)
                    })

        this.popUp.value = 0

        this.nextBtn.listenTo('click',()=>{
                            this.popUp.value++
                            this.popUp.children[this.popUp.value].toggleClass('displayN')
                            this.popUp.children[this.popUp._lv].toggleClass('displayN')                            
                        })            



    }
}
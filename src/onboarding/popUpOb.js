import { _e } from "pragmajs"
import { popUp } from './popUp'
import icons from '../ui/icons.json'
import { Lottie } from "../ui/elements/lottie"

export class popUpOb extends popUp{
    constructor(){
        super()
        this.render()
        this.addContent()
    }


    addContent() {
        let slides = []

        let spaceBoat = _e('div.boat.')
                        // .html(`
                            // <h1 class="boat-title">Press the spacebar to start/stop the pointer</h1>
                            // <div class="spacebar-icon">${icons['spacebar-3d']}</div>
                        // `)
                        // .hide()
        
        let lottie = Lottie.name("space")

        console.log('lottie', lottie)
                lottie.appendTo(spaceBoat)

            slides.push(spaceBoat)

        let speedBoat = _e('div.boat.')
                        .html(`
                            <h1 class="boat-title">Adjust the speed, through the menu or your keyboard</h1>
                            <div class="speed-icon">${icons['speedBoat']}</div>
                        `)
                        .hide()

            slides.push(speedBoat)

        let clickBoat = _e('div.boat.')
                        .html(`
                            <h1 class="boat-title">Place the pointer by clicking on words</h1>
                            <div class="click-icon">${icons['clickBoat']}</div>
                        `)
                        .hide()

            slides.push(clickBoat)

        
        this.popUpContent.append(...slides)
        this.popUp.adopt(...slides)
                  .value = 0


        this.nextBtn.listenTo('mousedown', () => {
            this.popUp.value++

            this.popUp.children[this.popUp.value].show()
            this.popUp.children[this.popUp._lv].hide()
            
            if (this.popUp.value == 2) {        //If you see all the slides, close onboarding and start trippping
                this.popUp.value = 0 // loop

                this.nextBtn.html(`<div class="exit-icon">${icons['exit-icon']}</div>`)
                            .listenTo('mousedown', () => {
                                this.background.hide()
                                this.popUpContent.hide()
                                // this.background.toggleClass('displayN')
                                // this.popUp.toggleClass('displayN')
                            })
                }
                                       
        })
        
        this.backBtn.listenTo('mousedown', ()=>{
            (this.popUp.value == 0)? this.popUp.value = 2 : this.popUp.value--
            this.popUp.children[this.popUp.value].show()
            this.popUp.children[this.popUp._lv].hide()
        })


    }
}
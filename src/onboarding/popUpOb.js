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

        let clickBoat = _e('div.boat.')
                        .html(`
                            <h1 class="boat-title">Place the pointer by clicking on words</h1>
                        `)
                        .append(Lottie.name('click').addClass('click-lottie'))
                        

            slides.push(clickBoat)


        let spaceBoat = _e('div.boat.')
                        .html(`
                            <h1 class="boat-title">Press space to start & stop the pointer</h1>
                        `)
                        .append(Lottie.name('space').addClass('space-lottie'))
                        .hide()
                        

            slides.push(spaceBoat)

        let speedBoat = _e('div.boat.')
                        .html(`
                            <h1 class="boat-title">Change speed through the menu or keyboard</h1>
                        `)
                        .append(Lottie.name('speed').addClass('speed-lottie'))
                        .hide()

            slides.push(speedBoat)
            

        
        
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
import { _e, html } from "pragmajs"
import { popUp } from './popUp'
import icons from '../ui/icons.json'
import { _lottie } from "../ui/elements/lottie"

const LOTTIES = {
    click: "https://assets9.lottiefiles.com/private_files/lf30_thomociq.json",
    space: 'https://assets4.lottiefiles.com/private_files/lf30_mohfpxha.json',
    speed: 'https://assets8.lottiefiles.com/private_files/lf30_7sexuvbq.json'
}

export class popUpOb extends popUp{
    constructor(){
        super()
        this.render()
        this.addContent()
        console.log('creating new boat')
    }


    addContent() {
        let slides = []

        function newBoat(name, title){
            let boat = _e(`div.boat.`).html(`
                            <h1 class="boat-title">${title}</h1>
                        `).append(
                            _lottie(LOTTIES[name], name)
                                .addClass(`${name}-lottie`)
                            // Lottie.name(name).addClass(`${name}-lottie`)
                        ).hide()

            slides.push(boat)
            return boat
        }

        let clickBoat = newBoat("click", "Place the pointer by clicking on words").show()
        let spaceBoat = newBoat("space", "Press space to start & stop the pointer")
        let speedBoat = newBoat("speed", "Change speed through the menu or keyboard")
        
        
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
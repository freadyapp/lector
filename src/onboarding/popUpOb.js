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
                        <div class="spacebar-icon">${icons['spacebar-3d']}</div>
                        `)
                        .appendTo(this.popUpContent)
            slides.push(spaceBoat)

        let speedBoat = _e('div.boat')
                        .html(`
                        <h1 class="boat-title">Adjust the speed, through the menu or your keyboard</h1>
                        <div class="speed-icon">${icons['speedBoat']}</div>
                        `)
                        .appendTo(this.popUpContent)
                        .addClass('displayN')
            slides.push(speedBoat)

        let clickBoat = _e('div.boat')
                        .html(`
                        <h1 class="boat-title">Place the pointer by clicking on words</h1>
                        <div class="click-icon">${icons['clickBoat']}</div>
                        `)
                        .appendTo(this.popUpContent)
                        .addClass('displayN')
            slides.push(clickBoat)

        this.popUp.adopt(...slides)
                  .value = 0

        this.nextBtn.listenTo('click',()=>{
            if (this.popUp.value == 2) {        //If you see all the slides, close onboarding and start trippping
                this.popUp.value = 0
                this.nextBtn.html(`<div class="exit-icon">${icons['exit-icon']}</div>`)
                            .listenTo('click', ()=>{this.background.toggleClass('displayN'),this.popUp.toggleClass('displayN')})
            } else {this.popUp.value++}
            this.popUp.children[this.popUp.value].toggleClass('displayN')
            this.popUp.children[this.popUp._lv].toggleClass('displayN')                            
        })        
        
        this.backBtn.listenTo('click', ()=>{
            (this.popUp.value == 0)? this.popUp.value = 2 : this.popUp.value--
            this.popUp.children[this.popUp.value].toggleClass('displayN')
            this.popUp.children[this.popUp._lv].toggleClass('displayN') 
        })


    }
}